// Scarica da iNaturalist le foto di RIFERIMENTO per la pagina di prova D11.
// Regole (come nel test D9): identificazione confermata dalla comunità (taxon della comunità = taxon,
// >= 2 conferme, 0 disaccordi), prima le piante coltivate e poi le selvatiche "research"; solo licenze aperte;
// autore, licenza e link annotati in crediti.md. Escluse le osservazioni già usate nel test D9.
// Le foto vanno FUORI dal repository (cartella passata come argomento).
//
// Uso: node scarica-riferimenti.mjs <cartella-test-piante>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CATALOG } from './catalogo.mjs';

const BASE = path.resolve(process.argv[2] || path.join(os.homedir(), 'test-piante'));
const OUT = path.join(BASE, 'riferimenti-d11');
const PER_LABEL = 6;
const UA = { 'User-Agent': 'test-script/1.0' };
const LICENSES = ['cc0', 'cc-by', 'cc-by-sa', 'cc-by-nc'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  await sleep(1100); // circa 1 richiesta al secondo, come chiede iNaturalist
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// Osservazioni già usate nel test D9: non vanno riusate come riferimento.
const d9 = JSON.parse(fs.readFileSync(path.join(BASE, 'inaturalist', 'manifest.json'), 'utf8'));
const excluded = new Set(d9.map((m) => Number(m.observationUrl.split('/').pop())));

function confirmed(o, targetId) {
  if (!o.taxon || o.community_taxon_id !== o.taxon.id) return false;
  if (o.taxon.id !== targetId && !(o.taxon.ancestor_ids || []).includes(targetId)) return false;
  return o.num_identification_agreements >= 2 && o.num_identification_disagreements === 0;
}

async function candidates(taxonId, captive) {
  const p = new URLSearchParams({ taxon_id: String(taxonId), photo_license: LICENSES.join(','), per_page: '200', order_by: 'votes' });
  if (captive) p.set('captive', 'true'); else { p.set('captive', 'false'); p.set('quality_grade', 'research'); }
  const j = await getJson('https://api.inaturalist.org/v1/observations?' + p);
  const out = [];
  for (const o of j.results) {
    if (excluded.has(o.id) || !confirmed(o, taxonId)) continue;
    const ph = o.photos.find((x) => LICENSES.includes(x.license_code) && x.original_dimensions
      && Math.min(x.original_dimensions.width, x.original_dimensions.height) >= 400);
    if (!ph) continue;
    out.push({ o, ph, captive: o.captive });
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
for (const item of CATALOG) {
  const t = await getJson(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(item.inatName)}&rank=${item.rank}&is_active=true&per_page=10`);
  const taxon = t.results.find((x) => x.name === item.inatName);
  if (!taxon) throw new Error('taxon non trovato: ' + item.inatName);
  let list = await candidates(taxon.id, true);
  if (list.length < PER_LABEL) list = list.concat(await candidates(taxon.id, false));
  // Un solo scatto per autore, per avere foto più varie
  const seenUsers = new Set();
  const chosen = [];
  for (const c of list) {
    const user = c.o.user?.id;
    if (seenUsers.has(user)) continue;
    seenUsers.add(user);
    chosen.push(c);
    if (chosen.length >= PER_LABEL) break;
  }
  let n = 0;
  for (const { o, ph, captive } of chosen) {
    n++;
    const file = `${item.slug}-${n}.jpg`;
    await sleep(500);
    const res = await fetch(ph.url.replace('/square.', '/medium.'), { headers: UA });
    if (!res.ok) throw new Error(`${res.status} foto ${ph.id}`);
    fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
    manifest.push({
      file, slug: item.slug, label: item.label, trueName: o.taxon.name, captive,
      license: ph.license_code, attribution: ph.attribution,
      photoUrl: `https://www.inaturalist.org/photos/${ph.id}`, observationUrl: `https://www.inaturalist.org/observations/${o.id}`,
    });
  }
  console.log(`${item.slug.padEnd(18)} ${item.inatName.padEnd(26)} riferimenti: ${chosen.length} (coltivate: ${chosen.filter((c) => c.captive).length})`);
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
const LIC = { 'cc0': 'CC0', 'cc-by': 'CC BY', 'cc-by-sa': 'CC BY-SA', 'cc-by-nc': 'CC BY-NC' };
fs.writeFileSync(path.join(OUT, 'crediti.md'), [
  '# Crediti delle foto di riferimento (prova D11)', '',
  `Scaricate il ${new Date().toISOString().slice(0, 10)} dall'API pubblica di iNaturalist. Usate solo per calcolare le "impronte" (embedding) del prototipo D11, progetto non commerciale.`,
  'Licenza indicata da iNaturalist per ogni foto (versione non specificata dall\'API).', '',
  '| File | Pianta | Nome (comunità iNaturalist) | Autore | Licenza | Foto | Osservazione |', '|---|---|---|---|---|---|---|',
  ...manifest.map((m) => `| ${m.file} | ${m.label} | *${m.trueName}* | ${m.attribution} | ${LIC[m.license]} | ${m.photoUrl} | ${m.observationUrl} |`), '',
].join('\n'));
console.log(`Totale: ${manifest.length} foto in ${OUT}`);
