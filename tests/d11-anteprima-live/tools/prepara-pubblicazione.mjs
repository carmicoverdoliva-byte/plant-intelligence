// Prepara (NON pubblica) la cartella da caricare a mano su Hugging Face e GitHub Pages, come da PUBBLICAZIONE.md.
// Crea <test-piante>/pubblica-d11/modello (per Hugging Face) e <test-piante>/pubblica-d11/sito (per GitHub Pages).
// I nomi utente arrivano come argomenti: nel progetto non resta scritto nulla di personale.
//
// Uso: node prepara-pubblicazione.mjs --github <utente> --hf <utente> [--hf-commit <commit>] [cartella-test-piante]
// Con --hf-commit la pagina scarica il modello compresso da quella versione esatta (consigliato dopo il caricamento).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const take = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args.splice(i, 2)[1] : null; };
const GH = take('--github'), HF = take('--hf'), HF_COMMIT = take('--hf-commit');
if (HF_COMMIT && !/^[0-9a-f]{40}$/.test(HF_COMMIT)) throw new Error('--hf-commit deve essere un codice di commit di 40 caratteri');
if (!GH || !HF || !/^[A-Za-z0-9-]+$/.test(GH) || !/^[A-Za-z0-9-]+$/.test(HF)) throw new Error('Servono --github <utente> e --hf <utente> (solo lettere, numeri e trattini)');
const BASE = path.resolve(args[0] || path.join(os.homedir(), 'test-piante'));
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PAGE = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(PAGE, '..', '..');
const HF_REPO = 'd11-bioclip-int8', GH_REPO = 'd11-prova-anteprima';
const MODEL_FILE = 'bioclip-v1-image-encoder-int8.onnx';

const OUT = path.join(BASE, 'pubblica-d11');
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });   // la cartella si ricrea da zero ogni volta
const M = path.join(OUT, 'modello'), S = path.join(OUT, 'sito');
fs.mkdirSync(M, { recursive: true }); fs.mkdirSync(S, { recursive: true });

// ---------- modello (Hugging Face) ----------
const meta = JSON.parse(fs.readFileSync(path.join(BASE, 'modello', MODEL_FILE + '.json'), 'utf8'));
fs.copyFileSync(path.join(BASE, 'modello', MODEL_FILE), path.join(M, MODEL_FILE));
const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(M, MODEL_FILE))).digest('hex');
if (sha !== meta.sha256) throw new Error('La copia del modello non corrisponde (SHA-256 diverso)');
fs.copyFileSync(path.join(HERE, 'licenze', 'BIOCLIP-LICENSE.txt'), path.join(M, 'LICENSE'));
fs.writeFileSync(path.join(M, 'README.md'), `---
license: mit
library_name: onnxruntime
base_model: imageomics/bioclip
tags:
  - bioclip
  - onnx
  - int8
  - plants
  - on-device
---

# BioCLIP v1 image encoder — int8 (weight-only) ONNX, for a browser test

**Test artifact** for an open-source, non-commercial plant-care web app ("Plant Intelligence", decision D11): it measures
whether a plant-recognition model can run in the iPhone browser (ONNX Runtime Web, WebGPU / WebAssembly).
Not intended for production use.

## Origin
- **Model:** [BioCLIP](https://huggingface.co/imageomics/bioclip) by the Imageomics Institute (MIT), image encoder only
  (OpenCLIP ViT-B/16).
- **ONNX conversion used as input:** [m3r1al/naturalist-bioclip-v1](https://huggingface.co/m3r1al/naturalist-bioclip-v1),
  commit \`22a18d2fd141d2301968d93881b9e4431470c149\`, file \`image_encoder.onnx\` (fp16 weights, MIT).
- **This file:** weight-only int8 quantization made with a small Node.js script (no Python). 50 large weight tables
  (MatMul / Gemm / Conv) are stored as int8 with one float32 scale per output channel and restored at run time with
  \`DequantizeLinear\` + \`Cast\` (ONNX opset 17). Everything else is unchanged.

## File
| File | Size | SHA-256 |
|---|---|---|
| \`${MODEL_FILE}\` | ${meta.bytes} bytes (${(meta.bytes / 1e6).toFixed(1)} MB) | \`${meta.sha256}\` |

Input \`pixel_values\`: float32 \`[batch, 3, 224, 224]\`, CLIP normalization (mean 0.48145466, 0.4578275, 0.40821073;
std 0.26862954, 0.26130258, 0.27577711). Output \`image_embedding\`: float32 \`[batch, 512]\`.

## Measured on a PC (2026-11-17)
Compared with the fp16 original on 178 images: mean embedding cosine similarity 0.9996 (min 0.998); same top-1 label on
45 of 46 test images. Speed in Edge with WebGPU: ~170 ms per image (original ~167 ms).

## License and credits
MIT, see \`LICENSE\` (copyright notices of the Imageomics Institute and of the OpenCLIP authors, unchanged).
BioCLIP authors ask that derivative works remain open source: this file is.
Please cite BioCLIP: Stevens et al., "BioCLIP: A Vision Foundation Model for the Tree of Life", CVPR 2024.
`);

// ---------- sito (GitHub Pages) ----------
for (const f of ['index.html', 'app.js', 'worker.js', 'prototypes.json', 'crediti-riferimenti.md']) fs.copyFileSync(path.join(PAGE, f), path.join(S, f));
const p8 = JSON.parse(fs.readFileSync(path.join(PAGE, 'prototypes-int8.json'), 'utf8'));
p8.model.url = `https://huggingface.co/${HF}/${HF_REPO}/resolve/${HF_COMMIT || 'main'}/${MODEL_FILE}`; // con il commit: versione bloccata
if (p8.model.sha256 !== meta.sha256) throw new Error('prototypes-int8.json non corrisponde al modello');
fs.writeFileSync(path.join(S, 'prototypes-int8.json'), JSON.stringify(p8));
fs.copyFileSync(path.join(REPO_ROOT, 'LICENSE'), path.join(S, 'LICENSE'));
fs.writeFileSync(path.join(S, 'README.md'), `# Prova D11 · Anteprima live

Pagina di prova (non è l'app) del progetto open source e non commerciale **Plant Intelligence**: misura se un modello di
riconoscimento delle piante può girare nel browser dell'iPhone.

- Indirizzo: https://${GH}.github.io/${GH_REPO}/ (modello originale, 173 MB) ·
  https://${GH}.github.io/${GH_REPO}/?variante=int8 (modello compresso, 87 MB)
- **Privacy:** le immagini della fotocamera **non lasciano il telefono**. La pagina scarica solo il motore ONNX Runtime
  Web (da cdn.jsdelivr.net, con controllo d'integrità) e il modello (da huggingface.co, con controllo SHA-256).
- **Modello:** BioCLIP v1 (Imageomics, MIT); conversione ONNX
  [m3r1al/naturalist-bioclip-v1](https://huggingface.co/m3r1al/naturalist-bioclip-v1) (MIT); versione compressa
  [${HF}/${HF_REPO}](https://huggingface.co/${HF}/${HF_REPO})${HF_COMMIT ? ', versione ' + HF_COMMIT.slice(0, 7) : ''}.
- **Impronte delle piante:** calcolate da foto iNaturalist con licenza aperta, autori in \`crediti-riferimenti.md\`.
  Le foto non sono pubblicate qui.
- Codice della pagina: licenza MIT (\`LICENSE\`).
`);

// ---------- riepilogo ----------
const list = (d) => fs.readdirSync(d).map((f) => `   ${f.padEnd(40)} ${(fs.statSync(path.join(d, f)).size / 1e6).toFixed(2).padStart(8)} MB`).join('\n');
console.log(`Cartella pronta: ${OUT}\n\nmodello\\ (da caricare su Hugging Face, repository "${HF_REPO}", Public):\n${list(M)}\n\nsito\\ (da caricare su GitHub, repository "${GH_REPO}", Public):\n${list(S)}`);
console.log(`\nIndirizzo del modello compresso nella pagina: ${p8.model.url}`);
console.log(`Indirizzo previsto della pagina: https://${GH}.github.io/${GH_REPO}/`);
const tooBig = fs.readdirSync(S).filter((f) => fs.statSync(path.join(S, f)).size > 25 * 1024 * 1024);
console.log(tooBig.length ? 'ATTENZIONE: file del sito oltre 25 MiB: ' + tooBig.join(', ') : 'Tutti i file del sito sono sotto i 25 MiB (caricabili dal browser).');
