// Costruisce le "impronte" (embedding) delle piante del catalogo con BioCLIP v1 e le prova sul PC.
// 1. scarica il modello (versione fissata) e ne verifica l'impronta SHA-256;
// 2. calcola l'impronta di ogni foto di riferimento e ne fa la media per pianta -> ../prototypes.json;
// 3. prova il riconoscimento sulle foto del test D9 (mai usate come riferimento) -> ../valutazione-pc.md.
//
// Uso: node costruisci-impronte.mjs <cartella-test-piante>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as ort from 'onnxruntime-web'; // stesso motore (WebAssembly) usato dal telefono
import sharp from 'sharp';
import { CATALOG } from './catalogo.mjs';

const BASE = path.resolve(process.argv[2] || '<cartella-utente>/test-piante');
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PAGE_DIR = path.resolve(HERE, '..');
export const MODEL = {
  url: 'https://huggingface.co/m3r1al/naturalist-bioclip-v1/resolve/22a18d2fd141d2301968d93881b9e4431470c149/image_encoder.onnx',
  sha256: 'd982b6800a5b751272485ad4dd266f3d3eb39457b882daa5a0557cbbb62b3e9d',
  bytes: 172771717,
};
const MEAN = [0.48145466, 0.4578275, 0.40821073];
const STD = [0.26862954, 0.26130258, 0.27577711];
const LOGIT_SCALE = 100;

// --- 1. modello -------------------------------------------------------------
const modelPath = path.join(BASE, 'modello', 'bioclip-v1-image-encoder-fp16.onnx');
if (!fs.existsSync(modelPath)) {
  fs.mkdirSync(path.dirname(modelPath), { recursive: true });
  console.log('Scarico il modello (173 MB)...');
  const res = await fetch(MODEL.url);
  if (!res.ok) throw new Error('download modello: ' + res.status);
  fs.writeFileSync(modelPath, Buffer.from(await res.arrayBuffer()));
}
const hash = crypto.createHash('sha256').update(fs.readFileSync(modelPath)).digest('hex');
if (hash !== MODEL.sha256) throw new Error('Impronta SHA-256 del modello diversa da quella dichiarata: ' + hash);
console.log('Modello verificato (SHA-256 corretto).');
const session = await ort.InferenceSession.create(fs.readFileSync(modelPath), { executionProviders: ['wasm'] });
const inputName = session.inputNames[0];
const outputName = session.outputNames[0];
console.log('Ingresso:', inputName, '· Uscita:', outputName);

// --- conversione float16 -> float32 (se il modello restituisse numeri a mezza precisione) ---
function fromHalf(h) {
  const s = h & 0x8000 ? -1 : 1, e = (h >>> 10) & 0x1f, m = h & 0x3ff;
  if (e === 0) return s * m * 2 ** -24; if (e === 31) return m ? NaN : s * Infinity;
  return s * (1 + m / 1024) * 2 ** (e - 15);
}

// --- 2. impronta di un'immagine ------------------------------------------------
async function embed(file) {
  // ridimensiona il lato corto a 224 (bicubico) e ritaglia il quadrato centrale, come indica il manifest del modello
  const raw = await sharp(file).rotate().resize(224, 224, { fit: 'cover', position: 'centre', kernel: 'cubic' })
    .removeAlpha().raw().toBuffer();
  // NB: il manifest dichiara float16, ma il file ONNX vuole float32 in ingresso (verificato il 2026-11-17)
  const data = new Float32Array(3 * 224 * 224);
  for (let i = 0; i < 224 * 224; i++) for (let c = 0; c < 3; c++) {
    data[c * 224 * 224 + i] = (raw[i * 3 + c] / 255 - MEAN[c]) / STD[c];
  }
  const out = await session.run({ [inputName]: new ort.Tensor('float32', data, [1, 3, 224, 224]) });
  const t = out[outputName];
  const v = Array.from(t.type === 'float16' ? Array.from(t.data, fromHalf) : t.data);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

const refs = JSON.parse(fs.readFileSync(path.join(BASE, 'riferimenti-d11', 'manifest.json'), 'utf8'));
const prototypes = [];
for (const item of CATALOG) {
  const files = refs.filter((r) => r.slug === item.slug);
  const sum = new Array(512).fill(0);
  for (const r of files) (await embed(path.join(BASE, 'riferimenti-d11', r.file))).forEach((x, i) => { sum[i] += x; });
  const n = Math.hypot(...sum);
  prototypes.push({ slug: item.slug, label: item.label, genus: item.genus, refs: files.length, embedding: sum.map((x) => +(x / n).toFixed(5)) });
  process.stdout.write('.');
}
console.log('\nImpronte calcolate:', prototypes.length);
fs.writeFileSync(path.join(PAGE_DIR, 'prototypes.json'), JSON.stringify({
  model: { ...MODEL, name: 'BioCLIP v1 (ViT-B/16, fp16), conversione ONNX m3r1al/naturalist-bioclip-v1', inputName, outputName, mean: MEAN, std: STD, logitScale: LOGIT_SCALE },
  createdAt: new Date().toISOString().slice(0, 10),
  method: 'Media delle impronte di 6 foto di riferimento iNaturalist per pianta (crediti in crediti-riferimenti.md)',
  prototypes,
}));
fs.copyFileSync(path.join(BASE, 'riferimenti-d11', 'crediti.md'), path.join(PAGE_DIR, 'crediti-riferimenti.md'));

// --- 3. prova sul PC con le foto del test D9 ------------------------------------
const tests = [
  ...JSON.parse(fs.readFileSync(path.join(BASE, 'manifest-ricevute.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(BASE, 'inaturalist', 'manifest.json'), 'utf8')),
];
const genusOf = (s) => (s || '').toLowerCase().split(/\s+/)[0];
function expectedSlug(t) {
  if (!t.trueName) return null;
  const g = genusOf(t.trueName);
  if (t.trueName.startsWith('Sansevieria')) return 'sansevieria';
  if (t.trueName.startsWith('Dracaena fragrans')) return 'dracena';
  const byGenus = CATALOG.filter((c) => c.genus.toLowerCase() === g || genusOf(c.inatName) === g);
  return byGenus.length === 1 ? byGenus[0].slug : (byGenus.find((c) => t.trueName.startsWith(c.inatName))?.slug ?? null);
}
const rows = [];
for (const t of tests) {
  const e = await embed(t.path);
  const sims = prototypes.map((p) => dot(e, p.embedding));
  const ex = sims.map((s) => Math.exp(LOGIT_SCALE * (s - Math.max(...sims))));
  const z = ex.reduce((a, b) => a + b, 0);
  const ranked = prototypes.map((p, i) => ({ slug: p.slug, label: p.label, sim: sims[i], prob: ex[i] / z })).sort((a, b) => b.prob - a.prob);
  const exp = expectedSlug(t);
  rows.push({ file: t.file, group: t.group, exp, top: ranked[0], second: ranked[1], ok: exp && ranked[0].slug === exp, top3: exp && ranked.slice(0, 3).some((r) => r.slug === exp) });
}
const real = rows.filter((r) => r.group !== 'trappole');
const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
const lines = [
  '# Prova sul PC dell\'anteprima live (D11)', '',
  `Data: ${new Date().toISOString().slice(0, 10)} · Modello: BioCLIP v1 fp16 (ONNX, ${(MODEL.bytes / 1e6).toFixed(1)} MB) · Metodo: confronto con le impronte medie di 6 foto di riferimento per pianta (22 piante).`,
  'Foto di prova: quelle del test D9, **mai usate come riferimento**. Il PC non misura velocità e calore del telefono: questo lo dirà la prova sull\'iPhone 16.', '',
  '| Gruppo | Foto | Pianta giusta al 1° posto | Fra le prime 3 |', '|---|---|---|---|',
  ...['ricevute', 'inaturalist-coltivate', 'inaturalist-selvatiche'].map((g) => {
    const r = rows.filter((x) => x.group === g); return `| ${g} | ${r.length} | ${r.filter((x) => x.ok).length} (${pct(r.filter((x) => x.ok).length, r.length)}) | ${r.filter((x) => x.top3).length} (${pct(r.filter((x) => x.top3).length, r.length)}) |`;
  }),
  `| **Totale** | ${real.length} | ${real.filter((x) => x.ok).length} (${pct(real.filter((x) => x.ok).length, real.length)}) | ${real.filter((x) => x.top3).length} (${pct(real.filter((x) => x.top3).length, real.length)}) |`, '',
  '## Trappole', '| Foto | 1° nome | Probabilità | Somiglianza |', '|---|---|---|---|',
  ...rows.filter((r) => r.group === 'trappole').map((r) => `| ${r.file} | ${r.top.label} | ${(r.top.prob * 100).toFixed(0)}% | ${r.top.sim.toFixed(3)} |`), '',
  '## Soglie candidate per il popup (mostra il nome solo se probabilità ≥ p e somiglianza ≥ s)', '| p | s | Foto vere con nome | di cui giuste | Trappole con nome |', '|---|---|---|---|---|',
];
for (const p of [0.5, 0.6, 0.7]) for (const s of [0.35, 0.4, 0.42, 0.45]) {
  const shown = real.filter((r) => r.top.prob >= p && r.top.sim >= s);
  const traps = rows.filter((r) => r.group === 'trappole' && r.top.prob >= p && r.top.sim >= s);
  lines.push(`| ${p} | ${s} | ${shown.length}/${real.length} | ${shown.filter((r) => r.ok).length} (${pct(shown.filter((r) => r.ok).length, shown.length)}) | ${traps.length}/3 |`);
}
lines.push('', '## Dettaglio', '| Foto | Atteso | 1° nome | Prob. | Somigl. | 2° nome | Esito |', '|---|---|---|---|---|---|---|');
for (const r of rows) lines.push(`| ${r.file} | ${r.exp ?? '—'} | ${r.top.label} | ${(r.top.prob * 100).toFixed(0)}% | ${r.top.sim.toFixed(3)} | ${r.second.label} | ${r.exp ? (r.ok ? '✅' : r.top3 ? '🔸' : '❌') : 'trappola'} |`);
fs.writeFileSync(path.join(PAGE_DIR, 'valutazione-pc.md'), lines.join('\n') + '\n');
console.log(lines.slice(0, 30).join('\n'));
