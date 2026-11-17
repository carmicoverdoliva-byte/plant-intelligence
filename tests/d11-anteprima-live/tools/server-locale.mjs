// Piccolo server locale per provare la pagina sul PC: http://localhost:8011/
// (localhost è considerato "sicuro" dal browser, quindi la fotocamera funziona anche senza https).
// Uso: node server-locale.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };
const ALLOWED = new Set(['index.html', 'app.js', 'worker.js', 'prototypes.json', 'prototypes-int8.json']);
// Il modello compresso resta fuori dal repository (cartella test-piante): il server lo espone solo in locale.
const MODEL_DIR = path.join(process.env.TEST_PIANTE_DIR || path.join(os.homedir(), 'test-piante'), 'modello');
const MODEL_FILES = new Set(['bioclip-v1-image-encoder-int8.onnx']);

http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  if (name.startsWith('modello/') && MODEL_FILES.has(name.slice(8))) {
    const file = path.join(MODEL_DIR, name.slice(8));
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': fs.statSync(file).size, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res); return;
  }
  if (!ALLOWED.has(name)) { res.writeHead(404); res.end('non trovato'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(path.join(ROOT, name)).pipe(res);
}).listen(8011, '127.0.0.1', () => console.log('Pagina di prova su http://localhost:8011/'));
