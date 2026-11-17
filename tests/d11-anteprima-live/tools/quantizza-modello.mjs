// Comprime il modello BioCLIP (ONNX) con la "quantizzazione int8 dei soli pesi", senza Python.
// Ogni tabella di pesi grande (usata da MatMul, Gemm o Conv) diventa: interi a 8 bit + una scala per canale.
// Al momento dell'uso il modello ricostruisce i pesi con DequantizeLinear (-> float32) e Cast (-> float16),
// due operazioni standard di ONNX (opset 17). Il resto del modello non cambia.
//
// Uso: node quantizza-modello.mjs [cartella-test-piante]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import protobuf from 'protobufjs';

const BASE = path.resolve(process.argv[2] || path.join(os.homedir(), 'test-piante'));
const IN = path.join(BASE, 'modello', 'bioclip-v1-image-encoder-fp16.onnx');
const OUT = path.join(BASE, 'modello', 'bioclip-v1-image-encoder-int8.onnx');
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

const root = protobuf.loadSync(path.join(HERE, 'onnx.proto')); // descrizione ufficiale del formato ONNX v1.17.0 (Apache-2.0)
const ModelProto = root.lookupType('onnx.ModelProto');
const T = { FLOAT: 1, INT8: 3, FLOAT16: 10 };
const model = ModelProto.decode(fs.readFileSync(IN));
const g = model.graph;

const fromHalf = (h) => {
  const s = h & 0x8000 ? -1 : 1, e = (h >>> 10) & 0x1f, m = h & 0x3ff;
  if (e === 0) return s * m * 2 ** -24; if (e === 31) return m ? NaN : s * Infinity;
  return s * (1 + m / 1024) * 2 ** (e - 15);
};

// Chi usa ogni peso, e in che posizione
const uses = new Map();
for (const n of g.node) n.input.forEach((name, i) => { if (!uses.has(name)) uses.set(name, []); uses.get(name).push({ n, i }); });
const attr = (n, name) => n.attribute.find((a) => a.name === name);

const newInits = [], newNodes = [];
let quantized = 0, before = 0, after = 0;
for (const t of g.initializer) {
  const dims = t.dims.map(Number);
  const count = dims.reduce((a, b) => a * b, 1);
  const u = uses.get(t.name) || [];
  // Solo pesi grandi in float16, usati come 2° ingresso di MatMul/Gemm/Conv
  const eligible = t.dataType === T.FLOAT16 && count >= 4096 && u.length > 0
    && u.every(({ n, i }) => i === 1 && ['MatMul', 'Gemm', 'Conv'].includes(n.opType));
  if (!eligible) { newInits.push(t); continue; }
  // Asse dei "canali di uscita": MatMul [K,N] -> 1 · Gemm con transB=1 [N,K] -> 0 (altrimenti 1) · Conv [O,...] -> 0
  const { n } = u[0];
  const axis = n.opType === 'Conv' ? 0 : n.opType === 'Gemm' ? ((attr(n, 'transB')?.i ?? 0) ? 0 : 1) : dims.length - 1;
  const C = dims[axis];
  const inner = dims.slice(axis + 1).reduce((a, b) => a * b, 1);
  const raw = new Uint16Array(t.rawData.buffer.slice(t.rawData.byteOffset, t.rawData.byteOffset + t.rawData.byteLength));
  const w = Float32Array.from(raw, fromHalf);
  const maxAbs = new Float32Array(C);
  for (let i = 0; i < count; i++) { const c = Math.floor(i / inner) % C; const a = Math.abs(w[i]); if (a > maxAbs[c]) maxAbs[c] = a; }
  const scale = Float32Array.from(maxAbs, (m) => (m > 0 ? m / 127 : 1));
  const q = new Int8Array(count);
  for (let i = 0; i < count; i++) { const c = Math.floor(i / inner) % C; q[i] = Math.max(-127, Math.min(127, Math.round(w[i] / scale[c]))); }
  const base = t.name;
  newInits.push(
    { name: base + '__q', dataType: T.INT8, dims: t.dims, rawData: Buffer.from(q.buffer) },
    { name: base + '__scale', dataType: T.FLOAT, dims: [C], rawData: Buffer.from(scale.buffer) },
    { name: base + '__zp', dataType: T.INT8, dims: [C], rawData: Buffer.alloc(C) },
  );
  newNodes.push(
    { opType: 'DequantizeLinear', name: base + '__dq', input: [base + '__q', base + '__scale', base + '__zp'], output: [base + '__f32'],
      attribute: [{ name: 'axis', type: 2, i: axis }] },               // type 2 = INT
    { opType: 'Cast', name: base + '__cast', input: [base + '__f32'], output: [base], attribute: [{ name: 'to', type: 2, i: T.FLOAT16 }] },
  );
  quantized++; before += t.rawData.length; after += q.length + C * 5;
}
g.initializer = newInits;
g.node = [...newNodes, ...g.node];                       // i nuovi nodi dipendono solo da pesi: possono stare all'inizio
const quantNames = new Set(newNodes.filter((x) => x.opType === 'Cast').map((x) => x.output[0]));
g.input = g.input.filter((i) => !quantNames.has(i.name)); // i pesi non devono comparire come ingressi del grafo

const bytes = ModelProto.encode(ModelProto.fromObject(ModelProto.toObject(model, { defaults: false }))).finish();
fs.writeFileSync(OUT, bytes);
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
console.log(`Tabelle compresse: ${quantized} · pesi: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`);
console.log(`File: ${(fs.statSync(IN).size / 1e6).toFixed(1)} MB -> ${(bytes.length / 1e6).toFixed(1)} MB`);
console.log(`Salvato: ${OUT}`);
console.log(`SHA-256: ${sha256}`);
fs.writeFileSync(OUT + '.json', JSON.stringify({ file: path.basename(OUT), bytes: bytes.length, sha256, quantizedTables: quantized, createdAt: new Date().toISOString().slice(0, 10) }, null, 2));
