// Service worker di Mandragola (passo 0.4 del piano della v1, F16).
// È un piccolo programma che lavora in sottofondo e conserva le pagine dell'app, così si riapre anche senza rete.
// Regole:
// - pagine: prima la rete (contenuto aggiornato); senza rete, l'ultima copia salvata;
// - file dell'app con l'impronta nel nome (/_next/static/...): non cambiano mai, quindi prima la copia salvata;
// - icone e manifest: copia salvata, aggiornata in sottofondo;
// - MAI salvate: le richieste al server (/api/...) e quelle verso altri siti. Riconoscimento, contatori e meteo
//   devono sempre andare in rete, e senza rete l'app lo dice (F13).
// v2: nuovo nome (Mandragola) e nuove icone. Cambiare la versione fa scaricare di nuovo i file salvati.
const VERSIONE = 'v2';
const CACHE = `mandragola-${VERSIONE}`;
const DA_SALVARE_SUBITO = ['/', '/manifest.webmanifest', '/icons/icona-192.png', '/icons/icona-512.png', '/icons/icona-512-maskable.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(DA_SALVARE_SUBITO);
    // Salva anche i file dell'app usati dalla pagina iniziale, letti dal suo HTML
    const html = await (await fetch('/', { cache: 'no-store' })).text();
    const files = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])];
    await Promise.all(files.map((u) => cache.add(u).catch(() => { /* un file mancante non blocca l'installazione */ })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Cancella le copie delle versioni precedenti (anche quelle col vecchio nome "plant-intelligence-")
    for (const key of await caches.keys()) {
      if ((key.startsWith('mandragola-') || key.startsWith('plant-intelligence-')) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(req)) || (await cache.match('/')) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Altri file della stessa app (icone, manifest…): copia salvata subito, aggiornata in sottofondo
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await fresh) || Response.error();
  })());
});
