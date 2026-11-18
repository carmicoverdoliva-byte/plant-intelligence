// Costruisce le "impronte" (embedding) delle piante del catalogo con BioCLIP v1 e le prova sul PC.
// 1. verifica il modello (SHA-256) della variante scelta: fp16 (originale, 173 MB) o int8 (compresso, 87 MB);
// 2. calcola l'impronta di ogni foto di riferimento e ne fa la media per pianta;
// 3. prova il riconoscimento sulle foto del test D9 (mai usate come riferimento);
// 4. taratura della probabilità: sceglie la "scala" (temperatura) che rende la probabilità più realistica,
//    e le soglie del popup per quella scala;
// 5. scrive ../prototypes[-int8].json e ../valutazione-pc[-int8].md.
// Le impronte calcolate restano in <test-piante>/cache-impronte-<variante>.json (fuori dal repository).
//
// Uso: node costruisci-impronte.mjs [--variante fp16|int8] [cartella-test-piante]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import * as ort from 'onnxruntime-web'; // stesso motore (WebAssembly) usato dal telefono
import sharp from 'sharp';
import { CATALOG, TWIN_GROUPS } from './catalogo.mjs';

const args = process.argv.slice(2);
const vi = args.indexOf('--variante');
const VARIANT = vi >= 0 ? args.splice(vi, 2)[1] : 'fp16';
const BASE = path.resolve(args[0] || path.join(os.homedir(), 'test-piante'));
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PAGE_DIR = path.resolve(HERE, '..');
const SUFFIX = VARIANT === 'fp16' ? '' : '-' + VARIANT;

const FP16 = {
  file: 'bioclip-v1-image-encoder-fp16.onnx',
  url: 'https://huggingface.co/m3r1al/naturalist-bioclip-v1/resolve/22a18d2fd141d2301968d93881b9e4431470c149/image_encoder.onnx',
  sha256: 'd982b6800a5b751272485ad4dd266f3d3eb39457b882daa5a0557cbbb62b3e9d',
  bytes: 172771717,
  name: 'BioCLIP v1 (ViT-B/16, fp16), conversione ONNX m3r1al/naturalist-bioclip-v1',
};
let MODEL;
if (VARIANT === 'fp16') MODEL = FP16;
else if (VARIANT === 'int8') {
  const meta = JSON.parse(fs.readFileSync(path.join(BASE, 'modello', 'bioclip-v1-image-encoder-int8.onnx.json'), 'utf8'));
  // L'indirizzo definitivo dipende da dove verrà pubblicato il modello compresso: per ora è relativo alla pagina.
  MODEL = { file: meta.file, url: 'modello/' + meta.file, sha256: meta.sha256, bytes: meta.bytes,
    name: 'BioCLIP v1 (ViT-B/16) compresso int8 (solo pesi, per canale) da m3r1al/naturalist-bioclip-v1 con quantizza-modello.mjs' };
} else throw new Error('Variante sconosciuta: ' + VARIANT);

const MEAN = [0.48145466, 0.4578275, 0.40821073];
const STD = [0.26862954, 0.26130258, 0.27577711];

// --- 1. modello -------------------------------------------------------------
const modelPath = path.join(BASE, 'modello', MODEL.file);
if (!fs.existsSync(modelPath)) {
  if (VARIANT !== 'fp16') throw new Error('Modello compresso mancante: esegui prima quantizza-modello.mjs');
  if (!fs.existsSync(path.join(BASE, 'riferimenti-d11'))) throw new Error('Cartella di prova non valida: ' + BASE);
  fs.mkdirSync(path.dirname(modelPath), { recursive: true });
  console.log('Scarico il modello (173 MB)...');
  const res = await fetch(MODEL.url);
  if (!res.ok) throw new Error('download modello: ' + res.status);
  fs.writeFileSync(modelPath, Buffer.from(await res.arrayBuffer()));
}
const modelBuf = fs.readFileSync(modelPath);
if (crypto.createHash('sha256').update(modelBuf).digest('hex') !== MODEL.sha256) throw new Error('Impronta SHA-256 del modello diversa da quella attesa');
console.log(`Modello ${VARIANT} verificato (SHA-256 corretto, ${(modelBuf.length / 1e6).toFixed(1)} MB).`);
const session = await ort.InferenceSession.create(modelBuf, { executionProviders: ['wasm'] });
const inputName = session.inputNames[0], outputName = session.outputNames[0];

// --- 2. impronte (con memoria su disco) ------------------------------------------
const cachePath = path.join(BASE, `cache-impronte-${VARIANT}.json`);
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const msList = [];
async function embed(file) {
  const key = path.relative(BASE, file).replace(/\\/g, '/');
  if (cache[key]) return cache[key];
  // NB: il manifest del modello dichiara float16, ma il file vuole float32 in ingresso (verificato il 2026-11-17)
  const raw = await sharp(file).rotate().resize(224, 224, { fit: 'cover', position: 'centre', kernel: 'cubic' }).removeAlpha().raw().toBuffer();
  const data = new Float32Array(3 * 224 * 224);
  for (let i = 0; i < 224 * 224; i++) for (let c = 0; c < 3; c++) data[c * 224 * 224 + i] = (raw[i * 3 + c] / 255 - MEAN[c]) / STD[c];
  const t0 = performance.now();
  const out = await session.run({ [inputName]: new ort.Tensor('float32', data, [1, 3, 224, 224]) });
  msList.push(performance.now() - t0);
  const v = Array.from(out[outputName].data);
  const n = Math.hypot(...v);
  return (cache[key] = v.map((x) => +(x / n).toFixed(6)));
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
}

// --- 3. prova con le foto del test D9 ------------------------------------------
const tests = [
  ...JSON.parse(fs.readFileSync(path.join(BASE, 'manifest-ricevute.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(BASE, 'inaturalist', 'manifest.json'), 'utf8')),
];
const genusOf = (s) => (s || '').toLowerCase().split(/\s+/)[0];
function expectedSlug(t) {
  if (!t.trueName) return null;
  if (t.trueName.startsWith('Sansevieria')) return 'sansevieria';
  if (t.trueName.startsWith('Dracaena fragrans')) return 'dracena';
  const byGenus = CATALOG.filter((c) => c.genus.toLowerCase() === genusOf(t.trueName) || genusOf(c.inatName) === genusOf(t.trueName));
  return byGenus.length === 1 ? byGenus[0].slug : (byGenus.find((c) => t.trueName.startsWith(c.inatName))?.slug ?? null);
}
const rows = [];
for (const t of tests) {
  const e = await embed(t.path);
  rows.push({ file: t.file, group: t.group, exp: expectedSlug(t), sims: prototypes.map((p) => dot(e, p.embedding)) });
}
fs.writeFileSync(cachePath, JSON.stringify(cache));
const real = rows.filter((r) => r.group !== 'trappole'), traps = rows.filter((r) => r.group === 'trappole');

function probs(sims, scale) {
  const m = Math.max(...sims); const ex = sims.map((s) => Math.exp(scale * (s - m))); const z = ex.reduce((a, b) => a + b, 0);
  return ex.map((x) => x / z);
}
function rank(r, scale) {
  const p = probs(r.sims, scale);
  const order = p.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]);
  return { p, top: order[0][1], p1: order[0][0], p2: order[1][0], second: order[1][1], sim1: r.sims[order[0][1]] };
}
const slugIdx = Object.fromEntries(prototypes.map((p, i) => [p.slug, i]));

// --- 4. taratura della probabilità ------------------------------------------------
// NLL = quanto la probabilità data alla risposta giusta è bassa (più basso = meglio);
// ECE = differenza media tra "probabilità dichiarata" e "quante volte era davvero giusto" (più basso = meglio).
const SCALES = [10, 15, 20, 25, 30, 40, 50, 60, 80, 100];
const calib = SCALES.map((scale) => {
  let nll = 0; const bins = Array.from({ length: 5 }, () => ({ n: 0, conf: 0, ok: 0 }));
  for (const r of real) {
    const k = rank(r, scale);
    nll -= Math.log(Math.max(1e-9, k.p[slugIdx[r.exp]]));
    const b = bins[Math.min(4, Math.floor(k.p1 * 5))]; b.n++; b.conf += k.p1; b.ok += k.top === slugIdx[r.exp] ? 1 : 0;
  }
  const ece = bins.reduce((s, b) => s + (b.n ? Math.abs(b.conf - b.ok) : 0), 0) / real.length;
  return { scale, nll: nll / real.length, ece };
});
const best = calib.reduce((a, b) => (b.nll < a.nll ? b : a));
// Soglie del popup per la scala scelta: somiglianza 0,42 (separa trappole e foto vere) e la probabilità
// minima più bassa che mantiene almeno il 90% di nomi giusti e nessuna trappola.
const MIN_SIM = 0.42;
let chosenProb = null;
for (const p of [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7]) {
  const shown = real.filter((r) => { const k = rank(r, best.scale); return k.p1 >= p && k.sim1 >= MIN_SIM && k.p1 - k.p2 >= 0.15; });
  const ok = shown.filter((r) => rank(r, best.scale).top === slugIdx[r.exp]).length;
  const trapShown = traps.filter((r) => { const k = rank(r, best.scale); return k.p1 >= p && k.sim1 >= MIN_SIM; }).length;
  if (shown.length && ok / shown.length >= 0.9 && trapShown === 0) { chosenProb = { p, shown: shown.length, ok, trapShown }; break; }
}

// --- 4b. piante gemelle: "Forse: X o Y" quando i primi due nomi sono dello stesso gruppo e vicini -----------
// Stessa regola della pagina (app.js, candidate()): somiglianza >= soglia, p1+p2 >= soglia di probabilità,
// distacco fra i due < 15 punti, distacco della coppia dal 3° nome >= 15 punti.
const twinOf = (a, b) => TWIN_GROUPS.some((g) => g.slugs.includes(prototypes[a].slug) && g.slugs.includes(prototypes[b].slug));
const MIN_MARGIN = 0.15;
function popupFor(r, scale, minProb) {
  const p = probs(r.sims, scale);
  const o = p.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]);
  const [[p1, i1], [p2, i2], [p3]] = o;
  if (r.sims[i1] < MIN_SIM) return null;
  if (p1 >= minProb && p1 - p2 >= MIN_MARGIN) return [i1];
  if (twinOf(i1, i2) && p1 + p2 >= minProb && p1 - p2 < MIN_MARGIN && p1 + p2 - p3 >= MIN_MARGIN) return [i1, i2];
  return null;
}
const twinEval = chosenProb && (() => {
  const shown = real.map((r) => ({ r, s: popupFor(r, best.scale, chosenProb.p) })).filter((x) => x.s);
  const singles = shown.filter((x) => x.s.length === 1), pairs = shown.filter((x) => x.s.length === 2);
  const hit = (x) => x.s.includes(slugIdx[x.r.exp]);
  return { singles: singles.length, singlesOk: singles.filter(hit).length, pairs: pairs.length, pairsOk: pairs.filter(hit).length,
    traps: traps.filter((r) => popupFor(r, best.scale, chosenProb.p)).length,
    pairList: pairs.map((x) => `${x.r.file}: ${x.s.map((i) => prototypes[i].label).join(' o ')} (atteso ${x.r.exp})`) };
})();
const refCounts = [...new Set(prototypes.map((p) => p.refs))].sort((a, b) => a - b);

fs.writeFileSync(path.join(PAGE_DIR, `prototypes${SUFFIX}.json`), JSON.stringify({
  model: { ...MODEL, inputName, outputName, mean: MEAN, std: STD, logitScale: 100 },
  calibration: { logitScale: best.scale, minProb: chosenProb ? chosenProb.p : 0.6, minSim: MIN_SIM,
    minMargin: MIN_MARGIN,
    note: `Tarata sul PC con le ${real.length} foto vere del test D9 (le stesse usate per misurare: valori indicativi, da ricontrollare sul telefono).` },
  twinGroups: TWIN_GROUPS.map((g) => ({ id: g.id, slugs: g.slugs })),
  createdAt: new Date().toISOString().slice(0, 10),
  method: `Media delle impronte di ${refCounts.join(' o ')} foto di riferimento iNaturalist per pianta (di più per le piante gemelle; crediti in crediti-riferimenti.md)`,
  prototypes,
}));
fs.copyFileSync(path.join(BASE, 'riferimenti-d11', 'crediti.md'), path.join(PAGE_DIR, 'crediti-riferimenti.md'));

// --- 5. rapporto ---------------------------------------------------------------
const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
const okAt1 = (r) => rank(r, 100).top === slugIdx[r.exp];
const inTop3 = (r) => { const k = rank(r, 100); return k.p.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).some(([, i]) => i === slugIdx[r.exp]); };
const avgMs = msList.length ? Math.round(msList.reduce((a, b) => a + b, 0) / msList.length) : null;
const screenEx = [0.32, 0.31, 0.31, ...new Array(19).fill(0.25)];
const lines = [
  `# Prova sul PC dell'anteprima live (D11) — modello ${VARIANT}`, '',
  `Data: ${new Date().toISOString().slice(0, 10)} · Modello: ${MODEL.name} · ${(MODEL.bytes / 1e6).toFixed(1)} MB · SHA-256 \`${MODEL.sha256.slice(0, 16)}…\``,
  `Metodo: confronto con le impronte medie di ${refCounts.join(' o ')} foto di riferimento per pianta (22 piante; 15 per le piante "gemelle").` + ' Foto di prova: quelle del test D9, **mai usate come riferimento**.',
  `Velocità sul PC (WebAssembly, senza scheda grafica): ${avgMs ? avgMs + ' ms per analisi in media' : 'impronte già in memoria, non rimisurata'}. Velocità e calore sul telefono li misura la prova D11.`, '',
  '| Gruppo | Foto | Pianta giusta al 1° posto | Fra le prime 3 |', '|---|---|---|---|',
  ...['ricevute', 'inaturalist-coltivate', 'inaturalist-selvatiche'].map((g) => {
    const r = rows.filter((x) => x.group === g); return `| ${g} | ${r.length} | ${r.filter(okAt1).length} (${pct(r.filter(okAt1).length, r.length)}) | ${r.filter(inTop3).length} (${pct(r.filter(inTop3).length, r.length)}) |`;
  }),
  `| **Totale** | ${real.length} | ${real.filter(okAt1).length} (${pct(real.filter(okAt1).length, real.length)}) | ${real.filter(inTop3).length} (${pct(real.filter(inTop3).length, real.length)}) |`, '',
  '## Trappole (somiglianza con la pianta più vicina)', '| Foto | 1° nome | Somiglianza |', '|---|---|---|',
  ...traps.map((r) => { const k = rank(r, 100); return `| ${r.file} | ${prototypes[k.top].label} | ${k.sim1.toFixed(3)} |`; }),
  `Foto vere: somiglianza minima ${Math.min(...real.map((r) => rank(r, 100).sim1)).toFixed(3)}.`, '',
  '## Taratura della probabilità', '',
  'La probabilità si calcola dalle somiglianze con una "scala": più la scala è alta, più piccole differenze di somiglianza',
  'diventano grandi differenze di probabilità. Con scala 100 (quella usata da CLIP/BioCLIP per i nomi) la probabilità',
  'risultava **troppo sicura** con le immagini ambigue. NLL ed ECE misurano quanto la probabilità è realistica (più basso = meglio).', '',
  '| Scala | NLL | ECE |', '|---|---|---|', ...calib.map((c) => `| ${c.scale}${c.scale === best.scale ? ' ✅' : ''} | ${c.nll.toFixed(3)} | ${(c.ece * 100).toFixed(1)}% |`), '',
  `**Scelta: scala ${best.scale}.** Esempio della prova con la webcam (somiglianze 0,32 / 0,31 / 0,31 e altre ~0,25): il 1° nome passa dal ` +
    `${(probs(screenEx, 100)[0] * 100).toFixed(0)}% (scala 100) al ${(probs(screenEx, best.scale)[0] * 100).toFixed(0)}% (scala ${best.scale}).`,
  chosenProb ? `Soglie del popup per questa scala: probabilità ≥ ${Math.round(chosenProb.p * 100)}%, somiglianza ≥ ${MIN_SIM}, distacco ≥ 15 punti → nome mostrato per ${chosenProb.shown}/${real.length} foto vere, giusto in ${chosenProb.ok} (${pct(chosenProb.ok, chosenProb.shown)}), trappole con nome: ${chosenProb.trapShown}/3.`
    : 'Nessuna soglia di probabilità raggiunge il 90% di nomi giusti senza trappole: si tengono i valori precedenti.',
  ...(twinEval ? ['', '## Piante gemelle ("Forse: X o Y")', '',
    'Gruppi: ' + TWIN_GROUPS.map((g) => g.slugs.join('/')).join(' · ') + '.',
    `Con le stesse soglie: nome singolo per ${twinEval.singles} foto (giusto ${twinEval.singlesOk}), coppia "X o Y" per ${twinEval.pairs} foto (pianta giusta nella coppia: ${twinEval.pairsOk}); trappole con un nome o una coppia: ${twinEval.traps}/3.`,
    ...twinEval.pairList.map((x) => '- ' + x), ''] : []),
  '⚠️ Taratura fatta sulle stesse 43 foto usate per misurare: i valori sono indicativi e vanno ricontrollati sul telefono.', '',
  '## Dettaglio (scala 100)', '| Foto | Atteso | 1° nome | Somigl. | 2° nome | Esito |', '|---|---|---|---|---|---|',
  ...rows.map((r) => { const k = rank(r, 100); return `| ${r.file} | ${r.exp ?? '—'} | ${prototypes[k.top].label} | ${k.sim1.toFixed(3)} | ${prototypes[k.second].label} | ${r.exp ? (k.top === slugIdx[r.exp] ? '✅' : inTop3(r) ? '🔸' : '❌') : 'trappola'} |`; }),
];
fs.writeFileSync(path.join(PAGE_DIR, `valutazione-pc${SUFFIX}.md`), lines.join('\n') + '\n');
console.log(lines.slice(0, 32).join('\n'));
