// Prova D11 — pagina principale: video, popup, misure, pulsanti.
// Il lavoro pesante (download e verifica del modello, motore, analisi) è nel Web Worker `worker.js`,
// così la pagina resta sempre reattiva. Privacy: le immagini non lasciano il dispositivo.
'use strict';

// Regole del popup (F17). Probabilità e soglie possono essere ritarate in prototypes.json (sezione "calibration").
const CONFIG = {
  // Ritmo adattivo (prova iPhone 2026-11-18: ~300 ms per analisi + 500 ms fissi = solo ~1,2 analisi al secondo).
  // La pausa è almeno pari alla durata dell'analisi: il modello lavora al massimo metà del tempo, per non scaldare.
  intervalMs: 150,     // pausa minima tra la fine di un'analisi e l'inizio della successiva
  dutyCycle: 0.5,      // quota massima di tempo in cui il modello lavora
  hotDutyCycle: 0.33,  // se le analisi rallentano (telefono caldo) lavora al massimo 1/3 del tempo...
  hotSlowdown: 1.25,   // ...cioè quando le ultime 20 analisi sono il 25% più lente delle prime 20
  minProb: 0.6,        // probabilità media minima
  minSim: 0.42,        // somiglianza minima (sul PC: trappole <= 0,39, foto vere >= 0,43)
  minMargin: 0.15,     // distacco minimo dal 2° nome (per una coppia di gemelle: dal 3° nome)
  // Stabilità misurata in secondi, non in numero di analisi: così non dipende dalla velocità del telefono.
  smoothMs: 2000,      // media delle analisi degli ultimi 2 secondi
  appearMs: 1000,      // il nome compare dopo 1 s di risultati concordi...
  appearMin: 2,        // ...e almeno 2 analisi
  switchMs: 2000,      // per cambiare nome: 2 s di risultati concordi...
  switchMin: 3,        // ...almeno 3 analisi...
  switchGain: 0.10,    // ...e 10 punti in più del nome attuale (non serve se il nuovo nome affina il vecchio: "X o Y" → "X")
  hideBelow: 0.35,     // sotto questa probabilità per...
  hideAfterMs: 2000,   // ...2 secondi, il popup torna a "Sto guardando…"
  cropFraction: 0.8,   // il quadrato analizzato è l'80% del lato corto del video
  logitScale: 100,     // "temperatura" del calcolo della probabilità (vedi valutazione-pc.md)
};

const $ = (id) => document.getElementById(id);
// Variante del modello: ?variante=int8 usa il modello compresso (87 MB), altrimenti l'originale (173 MB).
const VARIANT = new URLSearchParams(location.search).get('variante') === 'int8' ? 'int8' : 'fp16';
const PROTOTYPES_FILE = VARIANT === 'int8' ? 'prototypes-int8.json' : 'prototypes.json';
const worker = new Worker('worker.js');
const state = {
  data: null, backend: null, modelNetBytes: 0, loadMs: 0, startedAt: 0, readyAt: 0,
  times: [], history: [], streakLabel: null, streak: 0, shown: null, lowSince: null,
  heat: [], records: [], lastTop: null, errors: 0, lastError: '', lag: [], pauses: [],
  streakKey: null, streakSince: 0, streakCount: 0, hot: false, hotCount: 0, pauseMs: 0, grabMaxMs: 0, twins: [],
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
  const tg = performance.now();
  const pixels = grabFrame(video);
  state.grabMaxMs = Math.max(state.grabMaxMs, performance.now() - tg);
  sched.inFlight = true;
  worker.postMessage({ type: 'frame', id: ++sched.frameId, gen: g, pixels }, [pixels.buffer]);
}
function scheduleNext(lastMs) {
  const g = sched.gen;
  const duty = state.hot ? CONFIG.hotDutyCycle : CONFIG.dutyCycle;
  state.pauseMs = Math.max(CONFIG.intervalMs, (lastMs || 0) * (1 / duty - 1));
  if (sched.running) sched.timer = setTimeout(() => tick(g), state.pauseMs);
}
// Telefono caldo? Confronta le ultime 20 analisi con le prime 20 (isteresi: torna normale sotto il +10%).
function updateHeat() {
  const t = state.times;
  if (t.length < 40) return;
  const ratio = avgMs(t.slice(-20)) / avgMs(t.slice(0, 20));
  if (!state.hot && ratio >= CONFIG.hotSlowdown) { state.hot = true; state.hotCount++; }
  else if (state.hot && ratio < 1.1) state.hot = false;
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
    scheduleNext(m.skipped ? 0 : m.ms);
  } else if (m.type === 'error') {
    if (m.stage === 'frame') { sched.inFlight = false; scheduleNext(0); }
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
  const now = Date.now();
  state.times.push({ t: now, ms });
  if (state.times.length > 5000) state.times.splice(20, 1); // le prime 20 restano: servono per il confronto del calore
  updateHeat();
  state.history.push({ t: now, probs, sims });
  while (state.history.length > 1 && now - state.history[0].t > CONFIG.smoothMs) state.history.shift();
  updatePopup();
  updateMetrics(ms, probs, sims);
}

// ---------- regole del popup (F17) ----------
// Un "candidato" è un nome singolo oppure una coppia di piante gemelle ("Forse: X o Y").
const twinOf = (a, b) => state.twins.some((g) => g.includes(a) && g.includes(b));
function candidate(avgP, avgS) {
  const order = avgP.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]);
  const [[p1, i1], [p2, i2], [p3]] = order;
  if (avgS[i1] < CONFIG.minSim) return null;
  if (p1 >= CONFIG.minProb && p1 - p2 >= CONFIG.minMargin) return { key: String(i1), members: [i1], p: p1 };
  // Gemelle: i primi due sono dello stesso gruppo e vicini, e insieme staccano bene il 3° nome
  if (twinOf(i1, i2) && p1 + p2 >= CONFIG.minProb && p1 - p2 < CONFIG.minMargin && p1 + p2 - p3 >= CONFIG.minMargin) {
    const members = [i1, i2].sort((a, b) => a - b); // ordine fisso: il testo non "balla" se i due si scambiano
    return { key: members.join('|'), members, p: p1 + p2 };
  }
  return null;
}
function updatePopup() {
  const k = state.history.length, P = state.data.prototypes, now = Date.now();
  const avgP = P.map((_, i) => state.history.reduce((s, h) => s + h.probs[i], 0) / k);
  const avgS = P.map((_, i) => state.history.reduce((s, h) => s + h.sims[i], 0) / k);
  const cand = candidate(avgP, avgS);
  if (cand && cand.key === state.streakKey) state.streakCount++;
  else { state.streakKey = cand ? cand.key : null; state.streakSince = now; state.streakCount = cand ? 1 : 0; }
  const stable = (ms, min) => cand && now - state.streakSince >= ms && state.streakCount >= min;
  const pOf = (m) => m.reduce((s, i) => s + avgP[i], 0), sOf = (m) => Math.max(...m.map((i) => avgS[i]));
  const sh = state.shown;
  if (sh === null) {
    if (stable(CONFIG.appearMs, CONFIG.appearMin)) state.shown = cand;
  } else {
    const related = cand && cand.members.some((i) => sh.members.includes(i)); // "X o Y" ↔ "X": si affina, non si cambia pianta
    if (cand && cand.key !== sh.key && stable(CONFIG.switchMs, CONFIG.switchMin) && (related || cand.p >= pOf(sh.members) + CONFIG.switchGain)) {
      state.shown = cand; state.lowSince = null;
    } else if (pOf(sh.members) < CONFIG.hideBelow || sOf(sh.members) < CONFIG.minSim) {
      state.lowSince = state.lowSince ?? now;
      if (now - state.lowSince >= CONFIG.hideAfterMs) { state.shown = null; state.lowSince = null; }
    } else state.lowSince = null;
  }
  const shownText = state.shown === null ? null : state.shown.members.map((i) => P[i].label).join(' o ');
  $('popupName').textContent = shownText === null ? 'Sto guardando…' : 'Forse: ' + shownText;
  $('popupHint').textContent = state.shown && state.shown.members.length === 2
    ? 'Si somigliano molto: scatta per saperlo' : 'Anteprima sul telefono · Scatta per il riconoscimento completo';
  const i1 = avgP.indexOf(Math.max(...avgP));
  state.lastTop = { label: P[i1].label, prob: avgP[i1], sim: avgS[i1], shownText,
    shownMembers: state.shown ? state.shown.members.map((i) => P[i].label) : [] };
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
  $('mPause').textContent = Math.round(state.pauseMs) + ' ms' + (state.hot ? ' (telefono caldo: rallento)' : '');
  $('mPauses').textContent = state.pauses.length ? state.pauses.length + ' (la più lunga ' + (Math.max(...state.pauses.map((p) => p.d)) / 1000).toFixed(1) + ' s)' : 'nessuna';
  const sec = Math.round((now - state.startedAt) / 1000);
  $('mElapsed').textContent = Math.floor(sec / 60) + ' min ' + (sec % 60) + ' s';
  // MB della pagina + MB scaricati dal worker (motore), escluso il modello che ha il suo contatore
  const other = (state.engineBytes || 0) + performance.getEntriesByType('resource').filter((r) => !/huggingface\.co|hf\.co\/|\.onnx(\?|$)/.test(r.name)).reduce((s, r) => s + (r.transferSize || 0), 0);
  $('mOtherMB').textContent = other ? mb(other) : 'non misurabile';
  $('mModelMB').textContent = state.modelNetBytes ? mb(state.modelNetBytes) : '0 MB (dalla memoria)';
  const top = probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  $('top3').innerHTML = '<tr><td><b>Prime 3 (questa analisi)</b></td><td>prob · somigl.</td></tr>' + top.map(([p, i]) =>
    `<tr><td>${state.data.prototypes[i].label}</td><td>${(p * 100).toFixed(0)}% · ${sims[i].toFixed(2)}</td></tr>`).join('');
}
// Reattività: misura di quanto un timer da 100 ms arriva in ritardo (= quanto a lungo la pagina è rimasta bloccata).
// Prova iPhone 2026-11-18: un "blocco" di 4688 ms era quasi certamente tempo passato in un'altra app (per incollare
// i risultati): al ritorno il timer scatta prima che la pagina risulti di nuovo visibile. Ora ogni ritardo si giudica
// 1 secondo dopo: se nel frattempo la pagina è stata nascosta o ha perso il fuoco, è una "pausa per cambio app".
const interruption = { last: -Infinity };
const markInterruption = () => { interruption.last = performance.now(); };
document.addEventListener('visibilitychange', markInterruption);
document.addEventListener('freeze', markInterruption);
document.addEventListener('resume', markInterruption);
for (const ev of ['pagehide', 'pageshow', 'blur', 'focus']) window.addEventListener(ev, markInterruption);
(function lagProbe() {
  const t = performance.now();
  setTimeout(() => {
    const d = performance.now() - t - 100;
    if (d > 20) {
      const hiddenNow = document.hidden, at = Date.now(), since = Math.round((at - (state.startedAt || at)) / 1000);
      setTimeout(() => {
        const list = hiddenNow || interruption.last >= t ? state.pauses : state.lag;
        list.push({ t: at, d, since });
        if (list.length > 500) list.shift();
      }, 1000);
    }
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
    state.data = await (await fetch(PROTOTYPES_FILE)).json();
    const cal = state.data.calibration;
    if (cal) {
      CONFIG.logitScale = cal.logitScale; CONFIG.minProb = cal.minProb; CONFIG.minSim = cal.minSim;
      CONFIG.hideBelow = +(cal.minProb * 0.75).toFixed(2); // il popup sparisce sotto i 3/4 della soglia di comparsa
      if (cal.minMargin) CONFIG.minMargin = cal.minMargin;
      syncSliders();
    }
    else CONFIG.logitScale = state.data.model.logitScale;
    const idx = Object.fromEntries(state.data.prototypes.map((p, i) => [p.slug, i]));
    state.twins = (state.data.twinGroups || []).map((g) => g.slugs.map((x) => idx[x]).filter((i) => i !== undefined));
    state.t0 = performance.now();
    const m = state.data.model;
    worker.postMessage({ type: 'init', model: { url: m.url, bytes: m.bytes, sha256: m.sha256, inputName: m.inputName, outputName: m.outputName, mean: m.mean, std: m.std },
      prototypes: state.data.prototypes.map((p) => p.embedding) });
  } catch (e) { showError(e.message, true); }
}

async function onReady({ backend, loadMs, engineBytes }) {
  state.engineBytes = engineBytes || 0;
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
  const pairOk = state.records.filter((r) => r.members.length === 2 && r.members.includes(r.truth)).length;
  return [
    'Prova D11 — risultati', `Data: ${new Date().toISOString()}`, `Browser: ${navigator.userAgent}`,
    `Variante del modello: ${VARIANT} · Motore: ${state.backend} · Modello scaricato dalla rete: ${state.modelNetBytes ? mb(state.modelNetBytes) : '0 (memoria)'} · Altro: ${$('mOtherMB').textContent}`,
    `Caricamento: ${$('mLoad').textContent}`,
    `Analisi: ${state.times.length} · media ${Math.round(avgMs(state.times))} ms · ultimo minuto ${$('mAvg').textContent} · al secondo ${$('mRate').textContent} · rallentamento ${$('mTrend').textContent} · durata ${$('mElapsed').textContent}`,
    `Blocco più lungo della pagina: ${lagMax(Infinity)} ms · errori: ${state.errors}${state.lastError ? ' (ultimo: ' + state.lastError + ')' : ''}`,
    `Blocchi oltre 500 ms: ${state.lag.filter((l) => l.d > 500).map((l) => Math.round(l.d) + ' ms al secondo ' + l.since).join(', ') || 'nessuno'} · preparazione immagine: max ${Math.round(state.grabMaxMs)} ms`,
    `Pause per cambio app: ${state.pauses.length ? state.pauses.slice(-5).map((p) => (p.d / 1000).toFixed(1) + ' s al secondo ' + p.since).join(', ') : 'nessuna'}`,
    `Ritmo: pausa attuale ${Math.round(state.pauseMs)} ms (minima ${CONFIG.intervalMs} ms; modello al lavoro al massimo ${Math.round(CONFIG.dutyCycle * 100)}% del tempo) · telefono caldo rilevato: ${state.hotCount} volte`,
    `Soglie: prob ${CONFIG.minProb} · somiglianza ${CONFIG.minSim} · distacco ${CONFIG.minMargin} · scala ${CONFIG.logitScale} · comparsa dopo ${CONFIG.appearMs} ms · gemelle: ${state.twins.length} gruppi`,
    `Calore annotato: ${state.heat.map((h) => h.min + ' min ' + h.v).join(', ') || 'nessuna nota'}`,
    `Annotazioni: ${state.records.length} (popup giusto ${ok}, coppia "X o Y" con la pianta giusta ${pairOk}, popup vuoto ${state.records.filter((r) => r.shown === null).length})`,
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
  const shown = state.lastTop.shownText;
  const last = state.times[state.times.length - 1];
  state.records.push({ truth: $('truth').value, shown, members: state.lastTop.shownMembers, top: state.lastTop.label, prob: state.lastTop.prob, sim: state.lastTop.sim, ms: last ? Math.round(last.ms) : 0 });
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
fetch(PROTOTYPES_FILE).then((r) => r.json()).then((d) => {
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
