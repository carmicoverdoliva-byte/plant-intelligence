// Piccolo server locale per provare la pagina sul PC: http://localhost:8011/
// (localhost è considerato "sicuro" dal browser, quindi la fotocamera funziona anche senza https).
// Uso: node server-locale.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };
const ALLOWED = new Set(['index.html', 'app.js', 'prototypes.json']);

http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  if (!ALLOWED.has(name)) { res.writeHead(404); res.end('non trovato'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(path.join(ROOT, name)).pipe(res);
}).listen(8011, '127.0.0.1', () => console.log('Pagina di prova su http://localhost:8011/'));
