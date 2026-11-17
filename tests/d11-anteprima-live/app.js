// Prova D11 — anteprima live con BioCLIP nel browser.
// Cosa fa: scarica il modello (una volta), apre la fotocamera, analizza il quadrato centrale circa 2 volte al secondo,
// confronta l'immagine con le "impronte" delle piante del catalogo e mostra il popup con le regole di F17.
// Misura: MB scaricati, tempo di caricamento, millisecondi per analisi, rallentamento nel tempo.
// Privacy: nessuna immagine viene inviata; le uniche richieste di rete sono il motore (jsDelivr) e il modello (Hugging Face).
'use strict';

const ORT_VERSION = '1.31.1';
const CACHE_NAME = 'd11-modello-v1';

// Regole del popup (F17), modificabili dai cursori della pagina.
const CONFIG = {
  intervalMs: 500,     // ~2 analisi al secondo; la successiva parte solo quando la precedente è finita
  minProb: 0.6,        // probabilità media minima (tarata sul PC: vedi valutazione-pc.md)
  minSim: 0.42,        // somiglianza minima (sul PC: trappole <= 0,39, foto vere >= 0,43)
  minMargin: 0.15,     // distacco minimo dal 2° nome
  smoothN: 4,          // media sulle ultime 4 analisi (~2 s)
  appearStreak: 3,     // il nome compare dopo 3 analisi di fila (~1,5 s)
  switchStreak: 4,     // per cambiare nome: 4 analisi di fila...
  switchGain: 0.10,    // ...e 10 punti in più del nome attuale
  hideBelow: 0.35,     // sotto questa probabilità per...
  hideAfterMs: 2000,   // ...2 secondi, il popup torna a "Sto guardando…"
  cropFraction: 0.8,   // il quadrato analizzato è l'80% del lato corto del video
};

const $ = (id) => document.getElementById(id);
const state = {
  data: null, protos: null, session: null, backend: null, modelBytes: null,
  modelNetBytes: 0, loadMs: 0, running: false, timer: null,
  times: [], history: [], streakLabel: null, streak: 0, shown: null, lowSince: null,
  startedAt: 0, heat: [], records: [], lastTop: null,
};

function setStatus(text) { $('status').textContent = text || ''; }
const mb = (bytes) => (bytes / 1e6).toFixed(1) + ' MB';

// ---------- download del modello con avanzamento e memoria (Cache Storage) ----------
async function getModel(url, expectedBytes, sha256) {
  let cache = null;
  try { cache = await caches.open(CACHE_NAME); } catch { /* memoria non disponibile: si scarica ogni volta */ }
  const cached = cache && await cache.match(url);
  if (cached) {
    setStatus('Modello trovato nella memoria del telefono: nessun download.');
    return new Uint8Array(await cached.arrayBuffer());
  }
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error('Download del modello non riuscito (' + res.status + ')');
  const total = Number(res.headers.get('content-length')) || expectedBytes;
  const reader = res.body.getReader();
  const buf = new Uint8Array(total);
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf.set(value, got); got += value.length;
    state.modelNetBytes = got;
    setStatus(`Scarico il modello: ${mb(got)} di ${mb(total)} (${Math.round((got / total) * 100)}%)`);
  }
  setStatus('Controllo che il file sia integro…');
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf)), (b) => b.toString(16).padStart(2, '0')).join('');
  if (digest !== sha256) throw new Error('Il file del modello non è integro (impronta diversa): riprova.');
  if (cache) {
    try { await cache.put(url, new Response(buf)); } catch { setStatus('Nota: il telefono non ha salvato il modello in memoria; alla prossima apertura verrà riscaricato.'); }
  }
  return buf;
}

// ---------- motore: WebGPU se c'è, altrimenti WebAssembly ----------
async function createSession(preferred) {
  ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
  const order = preferred === 'wasm' ? ['wasm'] : ['webgpu', 'wasm'];
  for (const ep of order) {
    if (ep === 'webgpu' && !('gpu' in navigator)) continue;
    try {
      const t0 = performance.now();
      const s = await ort.InferenceSession.create(state.modelBytes, { executionProviders: [ep] });
      // prima analisi "a vuoto" per preparare il motore (non conta nelle misure)
      await s.run({ [state.data.model.inputName]: new ort.Tensor('float32', new Float32Array(3 * 224 * 224), [1, 3, 224, 224]) });
      state.loadMs = performance.now() - t0;
      return { session: s, backend: ep };
    } catch (e) {
      console.warn('Motore non disponibile:', ep, e);
    }
  }
  throw new Error('Nessun motore disponibile su questo telefono.');
}

// ---------- preparazione dell'immagine (come sul PC: quadrato centrale, 224 px, normalizzazione CLIP) ----------
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 224;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
function frameTensor(video) {
  const side = Math.min(video.videoWidth, video.videoHeight) * CONFIG.cropFraction;
  const sx = (video.videoWidth - side) / 2, sy = (video.videoHeight - side) / 2;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, sx, sy, side, side, 0, 0, 224, 224);
  const px = ctx.getImageData(0, 0, 224, 224).data;
  const { mean, std } = state.data.model;
  const out = new Float32Array(3 * 224 * 224);
  for (let i = 0; i < 224 * 224; i++) for (let c = 0; c < 3; c++) out[c * 50176 + i] = (px[i * 4 + c] / 255 - mean[c]) / std[c];
  return new ort.Tensor('float32', out, [1, 3, 224, 224]);
}

// ---------- un'analisi ----------
async function analyze() {
  const video = $('video');
  if (!state.running || video.readyState < 2) return;
  const t0 = performance.now();
  const out = await state.session.run({ [state.data.model.inputName]: frameTensor(video) });
  const ms = performance.now() - t0;
  const e = out[state.data.model.outputName].data;
  let n = 0; for (let i = 0; i < e.length; i++) n += e[i] * e[i]; n = Math.sqrt(n);
  const sims = state.protos.map((p) => { let d = 0; for (let i = 0; i < p.length; i++) d += p[i] * e[i]; return d / n; });
  const maxS = Math.max(...sims);
  const ex = sims.map((s) => Math.exp(state.data.model.logitScale * (s - maxS)));
  const z = ex.reduce((a, b) => a + b, 0);
  const probs = ex.map((x) => x / z);
  state.times.push({ t: Date.now(), ms });
  state.history.push({ probs, sims });
  if (state.history.length > CONFIG.smoothN) state.history.shift();
  updatePopup();
  updateMetrics(ms, probs, sims);
}

function loop() {
  if (!state.running) return;
  analyze().catch((e) => setStatus('Errore durante l\'analisi: ' + e.message))
    .finally(() => { state.timer = setTimeout(loop, CONFIG.intervalMs); });
}

// ---------- regole del popup (F17) ----------
function updatePopup() {
  const k = state.history.length, P = state.data.prototypes;
  const avgP = P.map((_, i) => state.history.reduce((s, h) => s + h.probs[i], 0) / k);
  const avgS = P.map((_, i) => state.history.reduce((s, h) => s + h.sims[i], 0) / k);
  const order = avgP.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]);
  const [p1, i1] = order[0], [p2] = order[1];
  const qualifies = p1 >= CONFIG.minProb && avgS[i1] >= CONFIG.minSim && (p1 - p2) >= CONFIG.minMargin;
  state.streak = qualifies && state.streakLabel === i1 ? state.streak + 1 : (qualifies ? 1 : 0);
  state.streakLabel = qualifies ? i1 : null;

  if (state.shown === null) {
    if (qualifies && state.streak >= CONFIG.appearStreak) state.shown = i1;
  } else {
    const pShown = avgP[state.shown];
    if (qualifies && i1 !== state.shown && state.streak >= CONFIG.switchStreak && p1 >= pShown + CONFIG.switchGain) {
      state.shown = i1; state.lowSince = null;
    } else if (pShown < CONFIG.hideBelow || avgS[state.shown] < CONFIG.minSim) {
      state.lowSince = state.lowSince ?? Date.now();
      if (Date.now() - state.lowSince >= CONFIG.hideAfterMs) { state.shown = null; state.lowSince = null; }
    } else {
      state.lowSince = null;
    }
  }
  $('popupName').textContent = state.shown === null ? 'Sto guardando…' : 'Forse: ' + P[state.shown].label;
  state.lastTop = { label: P[i1].label, prob: p1, sim: avgS[i1] };
}

// ---------- misure ----------
function updateMetrics(ms, probs, sims) {
  const now = Date.now();
  const lastMin = state.times.filter((x) => now - x.t <= 60000);
  const firstMin = state.times.filter((x) => x.t - state.startedAt <= 60000);
  const avg = (a) => a.reduce((s, x) => s + x.ms, 0) / (a.length || 1);
  $('mLast').textContent = Math.round(ms) + ' ms';
  $('mAvg').textContent = Math.round(avg(lastMin)) + ' ms';
  const span = lastMin.length > 1 ? (lastMin[lastMin.length - 1].t - lastMin[0].t) / 1000 : 0;
  $('mRate').textContent = span ? (lastMin.length / span).toFixed(1) : '—';
  $('mTrend').textContent = now - state.startedAt > 120000 ? ((avg(lastMin) / avg(firstMin) - 1) * 100).toFixed(0) + '%' : 'dopo 2 minuti';
  const sec = Math.round((now - state.startedAt) / 1000);
  $('mElapsed').textContent = Math.floor(sec / 60) + ' min ' + (sec % 60) + ' s';
  const other = performance.getEntriesByType('resource').filter((r) => !r.name.includes('huggingface') && !r.name.includes('cdn.hf.co'))
    .reduce((s, r) => s + (r.transferSize || 0), 0);
  $('mOtherMB').textContent = other ? mb(other) : 'non misurabile';
  const top = probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  $('top3').innerHTML = '<tr><td><b>Prime 3 (questa analisi)</b></td><td>prob · somigl.</td></tr>' + top.map(([p, i]) =>
    `<tr><td>${state.data.prototypes[i].label}</td><td>${(p * 100).toFixed(0)}% · ${sims[i].toFixed(2)}</td></tr>`).join('');
}

// ---------- avvio ----------
async function start() {
  $('btnStart').disabled = true;
  try {
    setStatus('Carico l\'elenco delle piante…');
    state.data = await (await fetch('prototypes.json')).json();
    state.protos = state.data.prototypes.map((p) => Float32Array.from(p.embedding));
    const t0 = performance.now();
    state.modelBytes = await getModel(state.data.model.url, state.data.model.bytes, state.data.model.sha256);
    $('mModelMB').textContent = state.modelNetBytes ? mb(state.modelNetBytes) : '0 MB (dalla memoria)';
    setStatus('Preparo il motore…');
    ({ session: state.session, backend: state.backend } = await createSession());
    $('mBackend').textContent = state.backend === 'webgpu' ? 'WebGPU (scheda grafica)' : 'WebAssembly (processore)';
    $('mLoad').textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s in tutto (motore: ' + (state.loadMs / 1000).toFixed(1) + ' s)';
    setStatus('Chiedo il permesso per la fotocamera…');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    const video = $('video');
    video.srcObject = stream;
    await video.play();
    $('start').hidden = true;
    $('stage').style.display = 'block';
    for (const id of ['metrics', 'annotate', 'tech', 'export']) $(id).hidden = false;
    placeFrame();
    try { await navigator.wakeLock?.request('screen'); } catch { /* lo schermo potrebbe spegnersi da solo */ }
    setStatus('');
    state.startedAt = Date.now();
    state.running = true;
    loop();
  } catch (e) {
    setStatus('Problema: ' + e.message);
    $('btnStart').disabled = false;
  }
}

function placeFrame() {
  const v = $('video'), f = $('frame');
  const side = Math.min(v.clientWidth, v.clientHeight) * CONFIG.cropFraction;
  Object.assign(f.style, { width: side + 'px', height: side + 'px', left: (v.clientWidth - side) / 2 + 'px', top: (v.clientHeight - side) / 2 + 'px' });
}

async function switchBackend() {
  state.running = false; clearTimeout(state.timer);
  const next = state.backend === 'webgpu' ? 'wasm' : 'webgpu';
  setStatus('Cambio motore…');
  try {
    await state.session.release?.();
    ({ session: state.session, backend: state.backend } = await createSession(next));
    $('mBackend').textContent = state.backend === 'webgpu' ? 'WebGPU (scheda grafica)' : 'WebAssembly (processore)';
    if (state.backend !== next) setStatus('L\'altro motore non è disponibile su questo telefono.'); else setStatus('');
  } catch (e) { setStatus('Problema: ' + e.message); }
  state.times = []; state.history = []; state.startedAt = Date.now();
  state.running = true; loop();
}

function summary() {
  const avg = (a) => Math.round(a.reduce((s, x) => s + x.ms, 0) / (a.length || 1));
  const ok = state.records.filter((r) => r.truth !== 'nessuna' && r.shown === r.truth).length;
  const lines = [
    'Prova D11 — risultati', `Data: ${new Date().toISOString()}`, `Browser: ${navigator.userAgent}`,
    `Motore: ${state.backend} · Modello scaricato dalla rete: ${state.modelNetBytes ? mb(state.modelNetBytes) : '0 (memoria)'} · Altro: ${$('mOtherMB').textContent}`,
    `Caricamento: ${$('mLoad').textContent}`,
    `Analisi: ${state.times.length} · media ${avg(state.times)} ms · ultimo minuto ${$('mAvg').textContent} · rallentamento ${$('mTrend').textContent} · durata ${$('mElapsed').textContent}`,
    `Soglie: prob ${CONFIG.minProb} · somiglianza ${CONFIG.minSim} · intervallo ${CONFIG.intervalMs} ms`,
    `Calore annotato: ${state.heat.map((h) => h.min + ' min ' + h.v).join(', ') || 'nessuna nota'}`,
    `Annotazioni: ${state.records.length} (popup giusto ${ok}, popup vuoto ${state.records.filter((r) => r.shown === null).length})`,
    ...state.records.map((r) => `- ${r.truth} → popup: ${r.shown ?? 'niente'} · 1° nome: ${r.top} ${(r.prob * 100).toFixed(0)}% · somigl. ${r.sim.toFixed(2)} · ${r.ms} ms`),
  ];
  return lines.join('\n');
}

// ---------- collegamenti dei pulsanti ----------
$('btnStart').addEventListener('click', start);
$('btnBackend').addEventListener('click', switchBackend);
for (const b of document.querySelectorAll('[data-heat]')) {
  b.addEventListener('click', () => { state.heat.push({ min: Math.round((Date.now() - state.startedAt) / 60000), v: b.dataset.heat }); setStatus('Annotato: telefono ' + b.dataset.heat); });
}
$('btnRecord').addEventListener('click', () => {
  if (!state.lastTop) return;
  const shown = state.shown === null ? null : state.data.prototypes[state.shown].label;
  const last = state.times[state.times.length - 1];
  state.records.push({ truth: $('truth').value, shown, top: state.lastTop.label, prob: state.lastTop.prob, sim: state.lastTop.sim, ms: last ? Math.round(last.ms) : 0 });
  $('recordInfo').textContent = `Registrato (${state.records.length}): ${$('truth').value} → popup: ${shown ?? 'niente'}`;
});
$('btnCopy').addEventListener('click', async () => {
  const text = summary();
  try { await navigator.clipboard.writeText(text); setStatus('Risultati copiati: incollali nella chat.'); }
  catch { setStatus('Copia non riuscita: tieni premuto per selezionare il testo qui sotto.'); $('recordInfo').textContent = text; }
});
function bindSlider(id, key, fmt) {
  const s = $(id), v = $('v' + id.slice(1));
  s.value = CONFIG[key]; v.textContent = fmt(CONFIG[key]);
  s.addEventListener('input', () => { CONFIG[key] = Number(s.value); v.textContent = fmt(CONFIG[key]); });
}
bindSlider('sProb', 'minProb', (x) => Math.round(x * 100) + '%');
bindSlider('sSim', 'minSim', (x) => x.toFixed(2));
bindSlider('sInterval', 'intervalMs', (x) => x + ' ms');
fetch('prototypes.json').then((r) => r.json()).then((d) => {
  $('truth').innerHTML = d.prototypes.map((p) => `<option>${p.label}</option>`).join('') + '<option value="nessuna">Nessuna pianta (oggetto, muro…)</option><option value="altra">Un\'altra pianta (non in elenco)</option>';
}).catch(() => {});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { state.running = false; clearTimeout(state.timer); }
  else if (state.session && !state.running) { state.running = true; loop(); }
});
window.addEventListener('resize', () => { if (state.running) placeFrame(); });
// Solo per le verifiche automatiche sul PC: con ?auto la prova parte senza toccare il pulsante.
if (new URLSearchParams(location.search).has('auto')) start();
window.__d11 = { state, CONFIG }; // per leggere le misure durante le verifiche automatiche
