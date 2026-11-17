// Prova D11 — pagina principale: video, popup, misure, pulsanti.
// Il lavoro pesante (download e verifica del modello, motore, analisi) è nel Web Worker `worker.js`,
// così la pagina resta sempre reattiva. Privacy: le immagini non lasciano il dispositivo.
'use strict';

// Regole del popup (F17). Probabilità e soglie possono essere ritarate in prototypes.json (sezione "calibration").
const CONFIG = {
  intervalMs: 500,     // pausa tra la fine di un'analisi e l'inizio della successiva
  minProb: 0.6,        // probabilità media minima
  minSim: 0.42,        // somiglianza minima (sul PC: trappole <= 0,39, foto vere >= 0,43)
  minMargin: 0.15,     // distacco minimo dal 2° nome
  smoothN: 4,          // media sulle ultime 4 analisi (~2 s)
  appearStreak: 3,     // il nome compare dopo 3 analisi di fila
  switchStreak: 4,     // per cambiare nome: 4 analisi di fila...
  switchGain: 0.10,    // ...e 10 punti in più del nome attuale
  hideBelow: 0.35,     // sotto questa probabilità per...
  hideAfterMs: 2000,   // ...2 secondi, il popup torna a "Sto guardando…"
  cropFraction: 0.8,   // il quadrato analizzato è l'80% del lato corto del video
  logitScale: 100,     // "temperatura" del calcolo della probabilità (vedi valutazione-pc.md)
};

const $ = (id) => document.getElementById(id);
const worker = new Worker('worker.js');
const state = {
  data: null, backend: null, modelNetBytes: 0, loadMs: 0, startedAt: 0, readyAt: 0,
  times: [], history: [], streakLabel: null, streak: 0, shown: null, lowSince: null,
  heat: [], records: [], lastTop: null, errors: 0, lastError: '', lag: [],
};

// ---------- un solo ciclo di analisi, garantito ----------
// `gen` cambia a ogni avvio/arresto: un ciclo vecchio si accorge di essere scaduto e si ferma.
const sched = { gen: 0, inFlight: false, timer: null, frameId: 0, running: false };
function startLoop() { stopLoop(); sched.running = true; const g = ++sched.gen; tick(g); }
function stopLoop() { sched.running = false; sched.gen++; clearTimeout(sched.timer); }
function tick(g) {
  if (g !== sched.gen || sched.inFlight) return;
  const video = $('video');
  if (video.readyState < 2) { sched.timer = setTimeout(() => tick(g), 200); return; }
  const pixels = grabFrame(video);
  sched.inFlight = true;
  worker.postMessage({ type: 'frame', id: ++sched.frameId, gen: g, pixels }, [pixels.buffer]);
}
function scheduleNext() {
  const g = sched.gen;
  if (sched.running) sched.timer = setTimeout(() => tick(g), CONFIG.intervalMs);
}

// Ritaglia il quadrato centrale a 224 px: è l'unico lavoro sull'immagine fatto dalla pagina (~1 ms).
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 224;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
function grabFrame(video) {
  const side = Math.min(video.videoWidth, video.videoHeight) * CONFIG.cropFraction;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side, 0, 0, 224, 224);
  return ctx.getImageData(0, 0, 224, 224).data;
}

// ---------- messaggi dal worker ----------
worker.onmessage = (ev) => {
  const m = ev.data;
  if (m.type === 'progress') { setStatus(m.text); if (m.netBytes !== undefined) state.modelNetBytes = m.netBytes; }
  else if (m.type === 'log') console.info(m.text);
  else if (m.type === 'ready') onReady(m);
  else if (m.type === 'switched') { setBackend(m.backend); state.times = []; state.startedAt = Date.now(); setStatus(''); startLoop(); }
  else if (m.type === 'result') {
    sched.inFlight = false;
    if (!m.skipped) onResult(m);
    scheduleNext();
  } else if (m.type === 'error') {
    if (m.stage === 'frame') { sched.inFlight = false; scheduleNext(); }
    if (m.stage === 'switch') { $('btnBackend').disabled = false; setStatus(''); startLoop(); }
    showError(m.message, m.stage === 'init');
  }
};
worker.onerror = (e) => showError('Errore del worker: ' + (e.message || 'sconosciuto'), true);

function onResult({ ms, sims }) {
  const maxS = Math.max(...sims);
  const ex = sims.map((s) => Math.exp(CONFIG.logitScale * (s - maxS)));
  const z = ex.reduce((a, b) => a + b, 0);
  const probs = ex.map((x) => x / z);
  state.times.push({ t: Date.now(), ms });
  if (state.times.length > 5000) state.times.shift();
  state.history.push({ probs, sims });
  if (state.history.length > CONFIG.smoothN) state.history.shift();
  updatePopup();
  updateMetrics(ms, probs, sims);
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
    } else state.lowSince = null;
  }
  $('popupName').textContent = state.shown === null ? 'Sto guardando…' : 'Forse: ' + P[state.shown].label;
  state.lastTop = { label: P[i1].label, prob: p1, sim: avgS[i1] };
}

// ---------- misure ----------
const mb = (bytes) => (bytes / 1e6).toFixed(1) + ' MB';
const avgMs = (a) => a.reduce((s, x) => s + x.ms, 0) / (a.length || 1);
function lagMax(windowMs) { const now = Date.now(); return Math.round(Math.max(0, ...state.lag.filter((l) => now - l.t <= windowMs).map((l) => l.d))); }
function updateMetrics(ms, probs, sims) {
  const now = Date.now();
  const lastMin = state.times.filter((x) => now - x.t <= 60000);
  const firstMin = state.times.filter((x) => x.t - state.startedAt <= 60000);
  $('mLast').textContent = Math.round(ms) + ' ms';
  $('mAvg').textContent = Math.round(avgMs(lastMin)) + ' ms';
  const span = lastMin.length > 1 ? (lastMin[lastMin.length - 1].t - lastMin[0].t) / 1000 : 0;
  $('mRate').textContent = span ? (lastMin.length / span).toFixed(1) : '—';
  $('mTrend').textContent = now - state.startedAt > 120000 ? ((avgMs(lastMin) / avgMs(firstMin) - 1) * 100).toFixed(0) + '%' : 'dopo 2 minuti';
  $('mLag').textContent = lagMax(60000) + ' ms';
  const sec = Math.round((now - state.startedAt) / 1000);
  $('mElapsed').textContent = Math.floor(sec / 60) + ' min ' + (sec % 60) + ' s';
  const other = performance.getEntriesByType('resource').filter((r) => !/huggingface|hf\.co/.test(r.name)).reduce((s, r) => s + (r.transferSize || 0), 0);
  $('mOtherMB').textContent = other ? mb(other) : 'non misurabile';
  $('mModelMB').textContent = state.modelNetBytes ? mb(state.modelNetBytes) : '0 MB (dalla memoria)';
  const top = probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  $('top3').innerHTML = '<tr><td><b>Prime 3 (questa analisi)</b></td><td>prob · somigl.</td></tr>' + top.map(([p, i]) =>
    `<tr><td>${state.data.prototypes[i].label}</td><td>${(p * 100).toFixed(0)}% · ${sims[i].toFixed(2)}</td></tr>`).join('');
}
// Reattività: misura di quanto un timer da 100 ms arriva in ritardo (= quanto a lungo la pagina è rimasta bloccata).
(function lagProbe() {
  const t = performance.now();
  setTimeout(() => {
    const d = performance.now() - t - 100;
    if (d > 20 && !document.hidden) { state.lag.push({ t: Date.now(), d }); if (state.lag.length > 500) state.lag.shift(); }
    lagProbe();
  }, 100);
})();

function setStatus(text) { $('status').textContent = text || ''; }
function showError(message, fatal) {
  state.errors++; state.lastError = message;
  $('errors').hidden = false;
  $('errors').textContent = `Errori: ${state.errors} · ultimo: ${message}`;
  if (fatal) { setStatus('Problema: ' + message); $('btnStart').disabled = false; }
}
function setBackend(b) {
  state.backend = b;
  $('mBackend').textContent = b === 'webgpu' ? 'WebGPU (scheda grafica)' : 'WebAssembly (processore)';
}

// ---------- avvio ----------
async function start() {
  $('btnStart').disabled = true;
  try {
    setStatus('Carico l\'elenco delle piante…');
    state.data = await (await fetch('prototypes.json')).json();
    const cal = state.data.calibration;
    if (cal) { CONFIG.logitScale = cal.logitScale; CONFIG.minProb = cal.minProb; CONFIG.minSim = cal.minSim; syncSliders(); }
    else CONFIG.logitScale = state.data.model.logitScale;
    state.t0 = performance.now();
    const m = state.data.model;
    worker.postMessage({ type: 'init', model: { url: m.url, bytes: m.bytes, sha256: m.sha256, inputName: m.inputName, outputName: m.outputName, mean: m.mean, std: m.std },
      prototypes: state.data.prototypes.map((p) => p.embedding) });
  } catch (e) { showError(e.message, true); }
}

async function onReady({ backend, loadMs }) {
  setBackend(backend);
  $('mLoad').textContent = ((performance.now() - state.t0) / 1000).toFixed(1) + ' s in tutto (motore: ' + (loadMs / 1000).toFixed(1) + ' s)';
  try {
    setStatus('Chiedo il permesso per la fotocamera…');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    const video = $('video');
    video.srcObject = stream;
    await video.play();
  } catch (e) { showError('Fotocamera non disponibile: ' + e.message, true); return; }
  $('start').hidden = true;
  $('stage').style.display = 'block';
  for (const id of ['metrics', 'annotate', 'tech', 'export']) $(id).hidden = false;
  placeFrame();
  try { await navigator.wakeLock?.request('screen'); } catch { /* lo schermo potrebbe spegnersi da solo */ }
  setStatus('');
  state.startedAt = Date.now();
  startLoop();
}

function placeFrame() {
  const v = $('video'), f = $('frame');
  const side = Math.min(v.clientWidth, v.clientHeight) * CONFIG.cropFraction;
  Object.assign(f.style, { width: side + 'px', height: side + 'px', left: (v.clientWidth - side) / 2 + 'px', top: (v.clientHeight - side) / 2 + 'px' });
}

function switchBackend() {
  stopLoop();
  $('btnBackend').disabled = true;
  setStatus('Cambio motore… (aspetto la fine dell\'analisi in corso)');
  worker.postMessage({ type: 'switch', backend: state.backend === 'webgpu' ? 'wasm' : 'webgpu' });
  setTimeout(() => { $('btnBackend').disabled = false; }, 3000);
}

function summary() {
  const ok = state.records.filter((r) => r.truth !== 'nessuna' && r.shown === r.truth).length;
  return [
    'Prova D11 — risultati', `Data: ${new Date().toISOString()}`, `Browser: ${navigator.userAgent}`,
    `Motore: ${state.backend} · Modello scaricato dalla rete: ${state.modelNetBytes ? mb(state.modelNetBytes) : '0 (memoria)'} · Altro: ${$('mOtherMB').textContent}`,
    `Caricamento: ${$('mLoad').textContent}`,
    `Analisi: ${state.times.length} · media ${Math.round(avgMs(state.times))} ms · ultimo minuto ${$('mAvg').textContent} · al secondo ${$('mRate').textContent} · rallentamento ${$('mTrend').textContent} · durata ${$('mElapsed').textContent}`,
    `Blocco più lungo della pagina: ${lagMax(Infinity)} ms · errori: ${state.errors}${state.lastError ? ' (ultimo: ' + state.lastError + ')' : ''}`,
    `Soglie: prob ${CONFIG.minProb} · somiglianza ${CONFIG.minSim} · intervallo ${CONFIG.intervalMs} ms · scala ${CONFIG.logitScale}`,
    `Calore annotato: ${state.heat.map((h) => h.min + ' min ' + h.v).join(', ') || 'nessuna nota'}`,
    `Annotazioni: ${state.records.length} (popup giusto ${ok}, popup vuoto ${state.records.filter((r) => r.shown === null).length})`,
    ...state.records.map((r) => `- ${r.truth} → popup: ${r.shown ?? 'niente'} · 1° nome: ${r.top} ${(r.prob * 100).toFixed(0)}% · somigl. ${r.sim.toFixed(2)} · ${r.ms} ms`),
  ].join('\n');
}

// ---------- pulsanti ----------
function flash(button, text) {
  const original = button.dataset.label || (button.dataset.label = button.textContent);
  button.textContent = text; button.classList.add('done');
  clearTimeout(button._t);
  button._t = setTimeout(() => { button.textContent = original; button.classList.remove('done'); }, 1500);
}
$('btnStart').addEventListener('click', start);
$('btnBackend').addEventListener('click', switchBackend);
for (const b of document.querySelectorAll('[data-heat]')) {
  b.addEventListener('click', () => {
    state.heat.push({ min: Math.round((Date.now() - state.startedAt) / 60000), v: b.dataset.heat });
    flash(b, '✓ Annotato');
  });
}
$('btnRecord').addEventListener('click', () => {
  const b = $('btnRecord');
  if (!state.lastTop) { flash(b, 'Aspetta la prima analisi…'); return; }
  const shown = state.shown === null ? null : state.data.prototypes[state.shown].label;
  const last = state.times[state.times.length - 1];
  state.records.push({ truth: $('truth').value, shown, top: state.lastTop.label, prob: state.lastTop.prob, sim: state.lastTop.sim, ms: last ? Math.round(last.ms) : 0 });
  flash(b, `✓ Registrato (${state.records.length})`);
  $('recordInfo').textContent = `Ultima registrazione: ${$('truth').value} → popup: ${shown ?? 'niente'}`;
});
$('btnCopy').addEventListener('click', () => {
  const text = summary();
  const box = $('copyText');
  box.value = text; box.hidden = false;           // il testo è SEMPRE visibile, anche se la copia automatica non riesce
  box.focus(); box.select();
  const b = $('btnCopy');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => flash(b, '✓ Copiati'), () => flash(b, 'Seleziona il testo qui sotto e copialo'));
  } else flash(b, 'Seleziona il testo qui sotto e copialo');
});
function bindSlider(id, key, fmt) {
  const s = $(id), v = $('v' + id.slice(1));
  s.addEventListener('input', () => { CONFIG[key] = Number(s.value); v.textContent = fmt(CONFIG[key]); });
}
const FORMATS = { sProb: ['minProb', (x) => Math.round(x * 100) + '%'], sSim: ['minSim', (x) => x.toFixed(2)], sInterval: ['intervalMs', (x) => x + ' ms'] };
function syncSliders() { for (const [id, [key, fmt]] of Object.entries(FORMATS)) { $(id).value = CONFIG[key]; $('v' + id.slice(1)).textContent = fmt(CONFIG[key]); } }
for (const [id, [key, fmt]] of Object.entries(FORMATS)) bindSlider(id, key, fmt);
syncSliders();
fetch('prototypes.json').then((r) => r.json()).then((d) => {
  $('truth').innerHTML = d.prototypes.map((p) => `<option>${p.label}</option>`).join('') + '<option value="nessuna">Nessuna pianta (oggetto, muro…)</option><option value="altra">Un\'altra pianta (non in elenco)</option>';
}).catch(() => {});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();                       // pagina nascosta: nessuna analisi
  else if (state.backend && !sched.running) startLoop(); // di nuovo visibile: UN solo ciclo riparte
});
window.addEventListener('resize', () => { if (sched.running) placeFrame(); });
// Solo per le verifiche automatiche sul PC: con ?auto la prova parte senza toccare il pulsante.
if (new URLSearchParams(location.search).has('auto')) start();
window.__d11 = { state, CONFIG, sched };
