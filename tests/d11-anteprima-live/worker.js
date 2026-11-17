// Prova D11 — "lavoratore" separato (Web Worker): scarica e verifica il modello, prepara il motore e fa le analisi.
// Così la pagina (pulsanti, video, popup) non si blocca mai, anche mentre il modello lavora.
// Regola fondamentale: UNA sola analisi alla volta. Le richieste arrivano solo dopo la risposta precedente,
// e il cambio di motore aspetta che l'analisi in corso sia finita.
'use strict';

const ORT_VERSION = '1.31.1';
const ORT_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort.min.js`;
// Stessa impronta SRI usata nella versione precedente della pagina (verificata il 2026-11-17)
const ORT_SHA384 = 'Gcu8U60SCeoyIiwfPwFy+eRexUuRRE9UYEXcm6vLDFVkGxcB1kk/gTv9FKTgoA6h';
const CACHE_NAME = 'd11-modello-v1'; // la chiave è l'indirizzo del modello: le due varianti non si confondono

let ortReady = null, model = null, modelBytes = null, session = null, backend = null;
let protos = null, busy = false, pendingBackend = null;
const post = (msg, transfer) => self.postMessage(msg, transfer || []);
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const toHex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

// Carica ONNX Runtime controllando l'integrità del file (equivalente dell'attributo SRI, che nei worker non esiste).
async function loadOrt() {
  const res = await fetch(ORT_URL, { mode: 'cors' });
  if (!res.ok) throw new Error('Download del motore non riuscito (' + res.status + ')');
  const text = await res.arrayBuffer();
  if (toB64(await crypto.subtle.digest('SHA-384', text)) !== ORT_SHA384) throw new Error('Il file del motore non è integro.');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
  importScripts(url);
  URL.revokeObjectURL(url);
  self.ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
}

async function getModel() {
  let cache = null;
  try { cache = await caches.open(CACHE_NAME); } catch { /* memoria non disponibile */ }
  const cached = cache && await cache.match(model.url);
  if (cached) { post({ type: 'progress', text: 'Modello trovato nella memoria del browser: nessun download.', netBytes: 0 }); return new Uint8Array(await cached.arrayBuffer()); }
  const res = await fetch(model.url, { mode: 'cors' });
  if (!res.ok) throw new Error('Download del modello non riuscito (' + res.status + ')');
  const total = Number(res.headers.get('content-length')) || model.bytes;
  const buf = new Uint8Array(total);
  const reader = res.body.getReader();
  let got = 0, lastPost = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf.set(value, got); got += value.length;
    if (Date.now() - lastPost > 250) { lastPost = Date.now(); post({ type: 'progress', text: `Scarico il modello: ${(got / 1e6).toFixed(1)} di ${(total / 1e6).toFixed(1)} MB (${Math.round((got / total) * 100)}%)`, netBytes: got }); }
  }
  post({ type: 'progress', text: 'Controllo che il modello sia integro…', netBytes: got });
  if (toHex(await crypto.subtle.digest('SHA-256', buf)) !== model.sha256) throw new Error('Il file del modello non è integro (impronta diversa): riprova.');
  let cached2 = true;
  if (cache) { try { await cache.put(model.url, new Response(buf)); } catch { cached2 = false; } }
  post({ type: 'progress', text: cached2 ? 'Modello salvato nella memoria del browser.' : 'Nota: il browser non ha salvato il modello; alla prossima apertura verrà riscaricato.', netBytes: got });
  return buf;
}

async function createSession(preferred) {
  if (session) { try { await session.release(); } catch { /* già rilasciata */ } session = null; }
  const order = preferred === 'wasm' ? ['wasm'] : ['webgpu', 'wasm'];
  for (const ep of order) {
    if (ep === 'webgpu' && !('gpu' in navigator)) continue;
    try {
      const t0 = performance.now();
      const s = await self.ort.InferenceSession.create(modelBytes, { executionProviders: [ep] });
      await s.run({ [model.inputName]: new self.ort.Tensor('float32', new Float32Array(3 * 224 * 224), [1, 3, 224, 224]) });
      session = s; backend = ep;
      return { backend: ep, loadMs: performance.now() - t0 };
    } catch (e) { post({ type: 'log', text: `Motore ${ep} non disponibile: ${e.message}` }); }
  }
  throw new Error('Nessun motore disponibile su questo dispositivo.');
}

async function analyze(pixels) {
  const { mean, std } = model;
  const x = new Float32Array(3 * 224 * 224);
  for (let i = 0; i < 224 * 224; i++) for (let c = 0; c < 3; c++) x[c * 50176 + i] = (pixels[i * 4 + c] / 255 - mean[c]) / std[c];
  const t0 = performance.now();
  const out = await session.run({ [model.inputName]: new self.ort.Tensor('float32', x, [1, 3, 224, 224]) });
  const ms = performance.now() - t0;
  const e = out[model.outputName].data;
  let n = 0; for (let i = 0; i < e.length; i++) n += e[i] * e[i]; n = Math.sqrt(n);
  const sims = protos.map((p) => { let d = 0; for (let i = 0; i < p.length; i++) d += p[i] * e[i]; return d / n; });
  return { ms, sims };
}

self.onmessage = async (ev) => {
  const m = ev.data;
  try {
    if (m.type === 'init') {
      model = m.model; protos = m.prototypes.map((p) => Float32Array.from(p));
      post({ type: 'progress', text: 'Carico il motore…' });
      ortReady = ortReady || loadOrt();
      await ortReady;
      modelBytes = await getModel();
      post({ type: 'progress', text: 'Preparo il motore…' });
      const r = await createSession(m.backend);
      // MB scaricati dal worker (motore e file collegati), escluso il modello che ha il suo contatore
      const engineBytes = performance.getEntriesByType('resource').filter((e) => !/huggingface\.co|hf\.co\/|\.onnx(\?|$)/.test(e.name)).reduce((s, e) => s + (e.transferSize || 0), 0);
      post({ type: 'ready', ...r, engineBytes });
    } else if (m.type === 'frame') {
      if (busy || !session) { post({ type: 'result', id: m.id, skipped: true }); return; }
      busy = true;
      try { const r = await analyze(m.pixels); post({ type: 'result', id: m.id, ...r }); }
      finally {
        busy = false;
        if (pendingBackend) { const b = pendingBackend; pendingBackend = null; const r = await createSession(b); post({ type: 'switched', ...r }); }
      }
    } else if (m.type === 'switch') {
      if (busy) { pendingBackend = m.backend; return; } // si cambia appena finisce l'analisi in corso
      const r = await createSession(m.backend);
      post({ type: 'switched', ...r });
    }
  } catch (e) {
    post({ type: 'error', id: m.id, stage: m.type, message: String(e && e.message || e) });
  }
};
