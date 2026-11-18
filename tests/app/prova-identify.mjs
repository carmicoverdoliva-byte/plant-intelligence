// Prova automatica di /api/identify (passi 2.1 e 2.4) con un Pl@ntNet FINTO sul PC: nessuna richiesta vera,
// nessun consumo della quota. Avvia da sola l'app (serve prima `npm run build`) con una chiave finta.
// Controlla: risposta normale, "nessuna pianta", servizio spento, tempo scaduto, limite giornaliero, riserva,
// tetto per indirizzo, foto non valida, sinonimi uniti con GBIF, nessun punteggio e nessuna chiave nelle risposte.
// Uso: node tests/app/prova-identify.mjs
import { spawn } from "node:child_process";
import { createServer } from "node:http";

const CHIAVE_FINTA = "chiave-finta-di-prova";
const PORTA_APP = 3100 + Math.floor(Math.random() * 300);
let modo = "ok";
let richiestePlantNet = 0;
let ultimaQuery = null;
let wikiUserAgent = "";

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
async function invia(indirizzo, { senzaFoto = false } = {}) {
  const m = new FormData();
  if (!senzaFoto) { m.append("foto", foto(), "a.jpg"); m.append("organo", "leaf"); }
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
