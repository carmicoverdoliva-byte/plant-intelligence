// Prova automatica di /api/identify (passi 2.1 e 2.4) con un Pl@ntNet FINTO sul PC: nessuna richiesta vera,
// nessun consumo della quota. Avvia da sola l'app (serve prima `npm run build`) con una chiave finta.
// Controlla: risposta normale, "nessuna pianta", servizio spento, tempo scaduto, limite giornaliero, riserva,
// tetto per indirizzo, foto non valida, sinonimi uniti con GBIF, nessun punteggio e nessuna chiave nelle risposte.
// Dal 2026-11-25 anche Upstash e Cloudflare sono FINTI: quota per telefono, schede salvate e riusate, Upstash spento.
// Uso: node tests/app/prova-identify.mjs
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { SEZIONI } from "../../src/lib/schede/genera/regole.ts";
import { prossimaMezzanotteItaliana } from "../../src/lib/giorno-italiano.ts";

// Le chiavi delle schede si calcolano con il codice vero dell'app (alias "@/" letto con jiti, già tra le dipendenze)
const { createJiti } = createRequire(import.meta.url)("jiti");
const jiti = createJiti(import.meta.url, { alias: { "@": path.resolve("src") } });
const { chiavePianta, improntaFontiA } = await jiti.import(path.resolve("src/lib/schede/genera/servizio.ts"));
const { scegliScheda } = await jiti.import(path.resolve("src/lib/schede/scegli.ts"));

const CHIAVE_FINTA = "chiave-finta-di-prova";
const PORTA_APP = 3100 + Math.floor(Math.random() * 300);
let modo = "ok";
let richiestePlantNet = 0;
let ultimaQuery = null;
let wikiUserAgent = "";

// Upstash finto: un piccolo Redis in memoria che conta i comandi ricevuti
const TOKEN_FINTO = "token-upstash-finto";
const redis = new Map();
let comandi = [];
let modoUpstash = "ok"; // "ok" | "quota-mese" | "lento"
function eseguiRedis([nome, chiave, ...resto]) {
  comandi.push([nome, chiave, ...resto]);
  if (nome === "GET") return redis.get(chiave) ?? null;
  if (nome === "SET") { redis.set(chiave, resto[0]); return "OK"; }
  if (nome === "INCR" || nome === "DECR") { const n = Number(redis.get(chiave) ?? 0) + (nome === "INCR" ? 1 : -1); redis.set(chiave, n); return n; }
  if (nome === "EXPIREAT") return 1;
}
// Cloudflare finto: una scheda valida (o rotta), scritta con parole che non vengono da nessuna fonte
let chiamateAi = 0;
let modoAi = "ok"; // "ok" | "rotto"
const schedaFinta = JSON.stringify({
  riassunto: "Pianta di prova, facile e robusta.",
  sezioni: Object.fromEntries(SEZIONI.map((k) => [k, { lineeGuida: { riassunto: "Indicazione di prova.", coseDaFare: [`Azione di prova per ${k}.`], fonti: ["S1"] }, pollice: [] }])),
});

// Risposta di Pl@ntNet come quella vera (struttura del test D9), con foto di esempio
const rispostaOk = (rimaste) => ({
  results: [
    { score: 0.44732, species: { scientificNameWithoutAuthor: "Aloe officinalis", genus: { scientificNameWithoutAuthor: "Aloe" }, family: { scientificNameWithoutAuthor: "Asphodelaceae" }, commonNames: ["Aloe vera"] }, gbif: { id: "2777592" },
      images: [{ author: "Autore di prova", license: "cc-by-sa", url: { o: "https://example.org/o.jpg", m: "https://example.org/m.jpg", s: "https://example.org/s.jpg" } }] },
    { score: 0.17518, species: { scientificNameWithoutAuthor: "Aloe vera", genus: { scientificNameWithoutAuthor: "Aloe" }, family: { scientificNameWithoutAuthor: "Asphodelaceae" }, commonNames: ["Aloe vera", "Sabarra"] }, gbif: { id: "2777724" } },
    { score: 0.05, species: { scientificNameWithoutAuthor: "Aloe maculata", genus: { scientificNameWithoutAuthor: "Aloe" }, family: { scientificNameWithoutAuthor: "Asphodelaceae" }, commonNames: [] }, gbif: { id: "2777800" } },
  ],
  version: "prova",
  remainingIdentificationRequests: rimaste,
});

const finto = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const json = (stato, corpo) => { res.writeHead(stato, { "content-type": "application/json" }); res.end(JSON.stringify(corpo)); };
  if (url.pathname === "/upstash") {
    let corpo = "";
    req.on("data", (d) => (corpo += d));
    req.on("end", () => {
      if (modoUpstash === "lento") { comandi.push(["(senza risposta)"]); return; }
      if (req.headers.authorization !== `Bearer ${TOKEN_FINTO}`) return json(401, { error: "Unauthorized" });
      if (modoUpstash === "quota-mese") { comandi.push(["(rifiutato)"]); return json(400, { error: "ERR max requests limit exceeded. Limit: 500000" }); }
      json(200, { result: eseguiRedis(JSON.parse(corpo)) });
    });
    return;
  }
  if (url.pathname.startsWith("/cloudflare/")) {
    chiamateAi++;
    req.resume();
    req.on("end", () => json(200, { success: true, result: { choices: [{ message: { content: modoAi === "ok" ? schedaFinta : "{rotto" } }], usage: { neurons: 1 } } }));
    return;
  }
  // Wikipedia finta: voce italiana su Aloe vera; per "Planta ignota" nessuna voce, ma voce inglese sul genere "Planta"
  if (url.pathname.includes("/api/rest_v1/page/summary/")) {
    wikiUserAgent = req.headers["user-agent"] ?? "";
    const lingua = url.pathname.startsWith("/wiki-it") ? "it" : "en";
    const titolo = decodeURIComponent(url.pathname.split("/").pop());
    const voce = (t, testo) =>
      json(200, { type: "standard", title: t, extract: testo, content_urls: { desktop: { page: `https://${lingua}.wikipedia.org/wiki/${t}` } } });
    if (lingua === "it" && titolo === "Aloe_vera") return voce("Aloe vera", "L'aloe vera è una pianta succulenta della famiglia delle Asphodelaceae.");
    if (lingua === "en" && titolo === "Planta") return voce("Planta", "Planta is a genus used only in this test.");
    if (titolo === "Disambigua") return json(200, { type: "disambiguation", title: "Disambigua", extract: "Può riferirsi a…", content_urls: { desktop: { page: "x" } } });
    return json(404, {});
  }
  if (url.pathname.startsWith("/v1/species/")) {
    const id = url.pathname.split("/").pop();
    if (id === "2777592") return json(200, { key: 2777592, taxonomicStatus: "SYNONYM", acceptedKey: 2777724, canonicalName: "Aloe officinalis" });
    if (id === "2777724") return json(200, { key: 2777724, taxonomicStatus: "ACCEPTED", canonicalName: "Aloe vera" });
    return json(200, { key: Number(id), taxonomicStatus: "ACCEPTED", canonicalName: "Aloe maculata" });
  }
  if (url.pathname === "/v2/identify/k-world-flora") {
    richiestePlantNet++;
    ultimaQuery = url.searchParams;
    req.resume();
    req.on("end", () => {
      if (modo === "ok") return json(200, rispostaOk(400));
      if (modo === "ok-riserva") return json(200, rispostaOk(10));
      if (modo === "404") return json(404, { message: "Species not found" });
      if (modo === "429") return json(429, { message: "Too many requests" });
      if (modo === "500") return json(500, { message: "Errore" });
      // "lento": non risponde mai (il server deve arrendersi da solo)
    });
    return;
  }
  json(404, {});
});
await new Promise((r) => finto.listen(0, "127.0.0.1", r));
const PORTA_FINTO = finto.address().port;

const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORTA_APP)], {
  env: {
    ...process.env,
    PLANTNET_API_KEY: CHIAVE_FINTA, // ha la precedenza su .env.local: la chiave vera non viene usata
    PLANTNET_API_URL: `http://127.0.0.1:${PORTA_FINTO}`,
    GBIF_API_URL: `http://127.0.0.1:${PORTA_FINTO}`,
    WIKIPEDIA_BASE_URL: `http://127.0.0.1:${PORTA_FINTO}/wiki-{lingua}`,
    PLANTNET_TIMEOUT_MS: "1500",
    IDENTIFY_PER_IP_PER_DAY: "3",
    UPSTASH_REDIS_REST_URL: `http://127.0.0.1:${PORTA_FINTO}/upstash`, // hanno la precedenza su .env.local: il database vero non si tocca
    UPSTASH_REDIS_REST_TOKEN: TOKEN_FINTO,
    UPSTASH_TIMEOUT_MS: "500",
    UPSTASH_PAUSA_MS: "1500",
    R2_SPERIMENTALE: "1",
    CLOUDFLARE_API_URL: `http://127.0.0.1:${PORTA_FINTO}/cloudflare`,
    CLOUDFLARE_ACCOUNT_ID: "conto-finto",
    CLOUDFLARE_AI_TOKEN: "token-ai-finto",
    NEXT_TELEMETRY_DISABLED: "1",
  },
  stdio: "ignore",
});
const BASE = `http://127.0.0.1:${PORTA_APP}`;
for (let i = 0; i < 60; i++) {
  try { await fetch(BASE + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); }
}

let fatti = 0, errori = 0;
const ok = (cond, d) => { fatti++; if (!cond) errori++; console.log(`${cond ? "✓" : "✗"} ${d}`); };
const foto = () => new Blob([new Uint8Array(2000).fill(7)], { type: "image/jpeg" });
async function invia(indirizzo, { senzaFoto = false, telefono } = {}) {
  const m = new FormData();
  if (!senzaFoto) { m.append("foto", foto(), "a.jpg"); m.append("organo", "leaf"); }
  if (telefono) m.append("telefono", telefono);
  const r = await fetch(BASE + "/api/identify", { method: "POST", body: m, headers: { "x-forwarded-for": indirizzo } });
  const testo = await r.text();
  return { stato: r.status, testo, dati: JSON.parse(testo) };
}

try {
  modo = "ok";
  let r = await invia("10.0.0.1");
  ok(r.stato === 200 && r.dati.ok, "risposta normale: 200 e risultato");
  ok(r.dati.risultato.principale.nomeScientifico === "Aloe vera", "sinonimi uniti con GBIF: Aloe officinalis diventa Aloe vera");
  ok(r.dati.risultato.gemelle.length === 1 && r.dati.risultato.gemelle[0].nomeScientifico === "Aloe maculata", "specie simili senza doppioni");
  ok(r.dati.risultato.livello === "probabile", `livello secondo le soglie D9 (${r.dati.risultato.livello})`);
  ok(!/score|0\.44|0\.17/.test(r.testo), "nessun punteggio inviato al telefono");
  ok(!r.testo.includes(CHIAVE_FINTA), "la chiave non compare nella risposta");
  ok(ultimaQuery?.get("api-key") === CHIAVE_FINTA && ultimaQuery?.get("lang") === "it", "a Pl@ntNet arrivano chiave e lingua italiana");
  ok(r.dati.quotaPerDispositivo === 10, "quota per dispositivo comunicata al telefono (10, D5)");

  modo = "404";
  r = await invia("10.0.0.2");
  ok(r.stato === 200 && r.dati.risultato.livello === "non-riconosciuta", "nessuna pianta (404) → \"Non riesco a riconoscerla\"");

  modo = "500";
  r = await invia("10.0.0.3");
  ok(r.stato === 503 && r.dati.codice === "non-risponde", "Pl@ntNet in errore → messaggio \"non risponde\"");

  modo = "lento";
  r = await invia("10.0.0.4");
  ok(r.stato === 503 && r.dati.codice === "non-risponde", "Pl@ntNet che non risponde → tempo scaduto, messaggio chiaro");

  r = await invia("10.0.0.5", { senzaFoto: true });
  ok(r.stato === 400 && r.dati.codice === "foto-non-valida", "nessuna foto → \"foto non valida\"");

  modo = "ok";
  await invia("10.0.0.6"); await invia("10.0.0.6"); await invia("10.0.0.6");
  r = await invia("10.0.0.6");
  ok(r.stato === 429 && r.dati.codice === "limite-server", "tetto per indirizzo (3 in prova) → messaggio dedicato");

  // --- Quota per telefono su Upstash (D4, D5) ---
  const TEL = "3f2b8c1e-5a6d-4c7b-9e0f-112233445566";
  comandi = [];
  r = await invia("10.1.0.1", { telefono: TEL });
  ok(r.dati.ok && r.dati.rimasti === 9, "Quota: primo riconoscimento, ne restano 9");
  const chiaveQuota = comandi[0]?.[1] ?? "";
  ok(comandi.length === 2 && comandi[0][0] === "INCR" && comandi[1][0] === "EXPIREAT" &&
    comandi[1][2] === Math.floor(prossimaMezzanotteItaliana().getTime() / 1000), "Quota: 2 comandi al primo della giornata, scadenza a mezzanotte italiana");
  ok(/^quota:\d{4}-\d\d-\d\d:[0-9a-f]{32}$/.test(chiaveQuota) && !JSON.stringify(comandi).includes(TEL) && !JSON.stringify(comandi).includes("10.1.0.1"),
    "Quota: in Upstash solo un'impronta, mai il codice del telefono né l'indirizzo di rete");
  comandi = [];
  r = await invia("10.1.0.2", { telefono: TEL });
  ok(r.dati.rimasti === 8 && comandi.length === 1, "Quota: dal secondo in poi 1 solo comando");
  modo = "500"; comandi = [];
  await invia("10.1.0.3", { telefono: TEL });
  ok(comandi.map((c) => c[0]).join() === "INCR,DECR" && redis.get(chiaveQuota) === 2, "Quota: se Pl@ntNet non risponde il riconoscimento viene restituito");
  modo = "ok";
  for (let i = 0; i < 8; i++) r = await invia(`10.1.1.${i}`, { telefono: TEL });
  ok(r.dati.ok && r.dati.rimasti === 0, "Quota: il decimo riconoscimento passa, ne restano 0");
  let primaPn = richiestePlantNet;
  r = await invia("10.1.2.1", { telefono: TEL });
  ok(r.stato === 429 && r.dati.codice === "quota-telefono" && r.dati.rimasti === 0 && richiestePlantNet === primaPn, "Quota: l'undicesimo è fermato senza chiamare Pl@ntNet, anche da un'altra rete");
  r = await invia("10.1.2.2", { telefono: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" });
  ok(r.dati.ok && r.dati.rimasti === 9, "Quota: un altro telefono ha la sua");
  comandi = [];
  r = await invia("10.1.2.3", { telefono: "codice; non valido" });
  ok(r.dati.ok && r.dati.rimasti === undefined && comandi.length === 0, "Quota: codice non valido → nessun comando, valgono i limiti di prima");

  // --- Schede generate salvate e riusate (D6) ---
  const generata = async (q) => {
    const x = await fetch(BASE + "/api/scheda-generata?" + q);
    const t = await x.text();
    return { stato: x.status, testo: t, dati: JSON.parse(t) };
  };
  const MONSTERA = "specie=Monstera%20deliciosa&genere=Monstera&famiglia=Araceae";
  const chiaveMonstera = chiavePianta("Monstera deliciosa", "Monstera", "Araceae");
  comandi = [];
  let g = await generata(MONSTERA);
  ok(g.dati.tipo === "generata" && chiamateAi === 1 && comandi.map((c) => c[0]).join() === "GET,SET", "Scheda: la prima volta si genera e si salva (2 comandi)");
  ok(comandi[1][1] === chiaveMonstera && /:[0-9a-f]{12}$/.test(chiaveMonstera) && comandi[1][3] === "EX", "Scheda: chiave con versione, nome e impronta delle fonti A, con scadenza");
  ok(g.dati.appenaGenerata === true && !isNaN(Date.parse(g.dati.generataIl)) && !comandi[1][2].includes("appenaGenerata"), "Scheda: appena generata lo dice, e in Upstash resta solo la data");
  comandi = [];
  const g2 = await generata(MONSTERA);
  ok(g2.testo === g.testo.replace(',"appenaGenerata":true', "") && chiamateAi === 1 && comandi.length === 0, "Scheda: subito dopo arriva dalla memoria del server (0 comandi, 0 AI)");
  // Una scheda già in Upstash (come dopo un riavvio del server, o generata per un altro telefono)
  const valore = redis.get(chiaveMonstera);
  redis.set(chiavePianta("Epipremnum aureum", "Epipremnum", "Araceae"), valore);
  comandi = [];
  g = await generata("specie=Epipremnum%20aureum&genere=Epipremnum&famiglia=Araceae");
  ok(g.dati.tipo === "generata" && chiamateAi === 1 && comandi.map((c) => c[0]).join() === "GET", "Scheda: già in Upstash → arriva con 1 comando e senza AI");
  ok(g.dati.appenaGenerata === undefined && g.dati.generataIl === JSON.parse(valore).generataIl, "Scheda: quella salvata porta la sua data e non si dice appena generata");
  // Fonti A cambiate: una nota o una scheda del tipo diversa danno un'altra impronta
  const fontiMonstera = scegliScheda("Monstera deliciosa", "Monstera", "Araceae");
  const improntaPrima = improntaFontiA("Monstera deliciosa", "Monstera", "Araceae"), improntaAltra = improntaFontiA("Phalaenopsis amabilis", "Phalaenopsis", "Orchidaceae");
  const riassuntoVero = fontiMonstera.scheda.riassunto;
  fontiMonstera.scheda.riassunto = riassuntoVero + " (cambiato)";
  ok(improntaFontiA("Monstera deliciosa", "Monstera", "Araceae") !== improntaPrima, "Fonti A: se cambia la scheda del tipo, la scheda salvata non vale più");
  ok(improntaFontiA("Phalaenopsis amabilis", "Phalaenopsis", "Orchidaceae") === improntaAltra, "Fonti A: le schede degli altri tipi restano valide");
  fontiMonstera.scheda.riassunto = riassuntoVero;
  const notaVera = fontiMonstera.notaFamiglia.note[0].testo;
  fontiMonstera.notaFamiglia.note[0].testo = notaVera + " (cambiata)";
  ok(improntaFontiA("Monstera deliciosa", "Monstera", "Araceae") !== improntaPrima, "Fonti A: se cambia la nota di famiglia, la scheda salvata non vale più");
  fontiMonstera.notaFamiglia.note[0].testo = notaVera;
  ok(improntaFontiA("Monstera deliciosa", "Monstera", "Araceae") === improntaPrima, "Fonti A: rimesse com'erano, la scheda torna valida");
  redis.set(chiavePianta("Zamioculcas zamiifolia", "Zamioculcas", "Araceae"), '{"tipo":"generata","rovinata":');
  g = await generata("specie=Zamioculcas%20zamiifolia&genere=Zamioculcas&famiglia=Araceae");
  ok(g.dati.tipo === "generata" && chiamateAi === 2, "Scheda: se quella salvata è rovinata si rigenera");
  redis.set(chiavePianta("Aloe vera", "Aloe", "Asphodelaceae").replace("scheda:r", "scheda:r0"), valore);
  redis.set(chiavePianta("Aloe vera", "Aloe", "Asphodelaceae").replace(/[0-9a-f]{12}$/, "000000000000"), valore);
  g = await generata("specie=Aloe%20vera&genere=Aloe&famiglia=Asphodelaceae");
  ok(g.dati.tipo === "generata" && chiamateAi === 3, "Scheda: quella con regole o fonti vecchie non si usa, si rigenera");
  modoAi = "rotto"; comandi = [];
  g = await generata("specie=Crassula%20ovata&genere=Crassula&famiglia=Crassulaceae");
  ok(g.dati.tipo === "ripiego" && !comandi.some((c) => c[0] === "SET") && !/rotto|formato|Error/.test(g.testo), "Scheda: il ripiego non si salva e non mostra errori tecnici");
  modoAi = "ok";

  // --- Upstash fermo o quota mensile finita: tutto continua come prima ---
  modoUpstash = "quota-mese"; comandi = [];
  r = await invia("10.2.0.1", { telefono: TEL });
  ok(r.stato === 200 && r.dati.ok && r.dati.rimasti === undefined && comandi.length === 1, "Quota mensile di Upstash finita → il riconoscimento funziona lo stesso");
  g = await generata("specie=Ficus%20lyrata&genere=Philodendron&famiglia=Araceae");
  ok(g.dati.tipo === "generata" && comandi.length === 1, "Quota mensile finita → la scheda si genera senza salvare, e Upstash non viene richiamato subito");
  ok(!/limit exceeded|upstash|token/i.test(r.testo + g.testo), "Quota mensile finita → nessun dettaglio tecnico al telefono");
  await new Promise((x) => setTimeout(x, 1700));
  modoUpstash = "lento"; comandi = [];
  const t0 = Date.now();
  r = await invia("10.2.0.2", { telefono: TEL });
  ok(r.dati.ok && comandi.length === 1 && Date.now() - t0 < 4000, "Upstash non risponde → si prosegue dopo una breve attesa");
  await invia("10.2.0.3", { telefono: TEL });
  ok(comandi.length === 1, "Upstash non risponde → per un po' non lo si richiama");
  await new Promise((x) => setTimeout(x, 1700));
  modoUpstash = "ok";
  r = await invia("10.2.0.4", { telefono: TEL });
  ok(r.dati.codice === "quota-telefono", "Upstash torna → la quota torna a valere");

  modo = "ok-riserva";
  await invia("10.0.0.7");
  const prima = richiestePlantNet;
  r = await invia("10.0.0.8");
  ok(r.stato === 429 && r.dati.codice === "limite-giornaliero" && richiestePlantNet === prima,
    "restano poche identificazioni (riserva) → il server si ferma senza chiamare Pl@ntNet");

  ok(!/Error|stack|at Object|http:\/\/127/.test(r.testo), "nessun dettaglio tecnico nelle risposte");

  // --- "Cos'è": riassunto di Wikipedia ---
  const desc = async (q) => {
    const x = await fetch(BASE + "/api/descrizione?" + q);
    return { stato: x.status, dati: await x.json(), cache: x.headers.get("cache-control") ?? "" };
  };
  let d = await desc("specie=Aloe%20vera&genere=Aloe");
  ok(d.dati.ok && d.dati.descrizione.lingua === "it" && d.dati.descrizione.livello === "specie", "Cos'è: voce italiana sulla specie");
  ok(
    d.dati.descrizione.licenza === "CC BY-SA 4.0" && d.dati.descrizione.autori.endsWith("?action=history") && d.dati.descrizione.url.includes("wikipedia.org"),
    "Cos'è: titolo, link, autori e licenza CC BY-SA 4.0",
  );
  ok(/^Mandragola\/.*mandragola-app\.vercel\.app/.test(wikiUserAgent), "Cos'è: User-Agent con nome dell'app e contatto");
  ok(/s-maxage=86400/.test(d.cache), "Cos'è: risposta conservata un giorno dalla rete (poche richieste a Wikipedia)");
  d = await desc("specie=Planta%20ignota&genere=Planta");
  ok(d.dati.ok && d.dati.descrizione.livello === "genere" && d.dati.descrizione.lingua === "en", "Cos'è: senza voce sulla specie, voce sul genere (in inglese se manca in italiano)");
  d = await desc("specie=Disambigua");
  ok(d.dati.ok === false, "Cos'è: le pagine di disambiguazione non si mostrano");
  d = await desc("specie=%3Cscript%3E");
  ok(d.stato === 400, "Cos'è: nomi non validi rifiutati, niente arriva a Wikipedia");

  // --- Scheda di cura per tipo di pianta (R1) ---
  const scheda = async (q) => (await fetch(BASE + "/api/scheda?" + q)).json();
  let s = await scheda("specie=Phalaenopsis%20amabilis&genere=Phalaenopsis&famiglia=Orchidaceae");
  ok(s.ok && s.tipo === "orchidee" && s.scheda?.id === "tipo/orchidee" && s.notaFamiglia?.famiglia === "Orchidaceae", "Scheda: orchidea → scheda delle orchidee + nota di famiglia");
  s = await scheda("specie=Quercus%20ilex&genere=Quercus&famiglia=Fagaceae");
  ok(s.ok && s.tipo === "alberi" && s.scheda === null, "Scheda: leccio → tipo \"alberi\", scheda dichiarata in preparazione (mai inventata)");
  s = await scheda("specie=Solanum%20lycopersicum&genere=Solanum&famiglia=Solanaceae");
  ok(s.tipo === "ortaggi-aromatiche" && s.base === "manuale", "Scheda: pomodoro → ortaggi (eccezione per specie)");
  s = await scheda("specie=Planta%20ignota&genere=Planta");
  ok(s.ok && s.tipo === "universale" && s.base === "genere-sconosciuto", "Scheda: genere sconosciuto → scheda universale, dichiarata");
  const no = await fetch(BASE + "/api/scheda?specie=%3Cx%3E&genere=y");
  ok(no.status === 400, "Scheda: nomi non validi rifiutati");
} catch (e) {
  ok(false, `errore durante la prova: ${e.message}`);
} finally {
  app.kill();
  finto.close();
}

console.log(`\n${fatti - errori}/${fatti} controlli superati.`);
process.exit(errori ? 1 : 0);
