// Prova di scripts/prepara-schede.mjs con Upstash, Cloudflare e GBIF FINTI: nessun neuron, il database vero non si tocca.
// (Wikipedia è vera: poche letture pubbliche; se non risponde la prova vale lo stesso.)
// Uso: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/app/prova-prepara-schede.mjs
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { SEZIONI } from "../../src/lib/schede/genera/regole.ts";

const redis = new Map();
let chiamateAi = 0, get = 0, modoAi = "ok", upstashSpento = false;
const buona = JSON.stringify({
  riassunto: "Pianta di prova, facile e robusta.",
  sezioni: Object.fromEntries(SEZIONI.map((k) => [k, { lineeGuida: { riassunto: "Indicazione di prova.", coseDaFare: [`Azione di prova per ${k}.`], fonti: ["S1"] }, pollice: [] }])),
});
const finto = createServer((req, res) => {
  const json = (s, c) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(c)); };
  let corpo = "";
  req.on("data", (d) => (corpo += d));
  req.on("end", () => {
    if (req.url === "/upstash") {
      if (upstashSpento) return json(500, { error: "spento" });
      const [c, k, v] = JSON.parse(corpo);
      if (c === "GET") { get++; return json(200, { result: redis.get(k) ?? null }); }
      redis.set(k, v);
      return json(200, { result: "OK" });
    }
    if (req.url.startsWith("/cloudflare")) {
      chiamateAi++;
      if (modoAi === "quota") return json(429, { success: false, errors: [{ message: "daily limit" }] });
      return json(200, { success: true, result: { choices: [{ message: { content: modoAi === "ok" ? buona : "{rotto" } }], usage: { neurons: 100 } } });
    }
    const nomi = { 2868323: "Epipremnum aureum", 2868241: "Monstera deliciosa", 2869014: "Zamioculcas zamiifolia" };
    const nome = nomi[req.url.split("/").pop()];
    json(nome ? 200 : 404, nome ? { taxonomicStatus: "ACCEPTED", canonicalName: nome, family: "Araceae" } : {});
  });
});
await new Promise((r) => finto.listen(0, "127.0.0.1", r));
const F = `http://127.0.0.1:${finto.address().port}`;
const CARTELLA = mkdtempSync(path.join(tmpdir(), "mandragola-prepara-"));
const lancia = (tetto, ...args) =>
  new Promise((r) => {
    const p = spawn(process.execPath, ["scripts/prepara-schede.mjs", ...args], {
      env: { ...process.env, UPSTASH_REDIS_REST_URL: `${F}/upstash`, UPSTASH_REDIS_REST_TOKEN: "finto", CLOUDFLARE_API_URL: `${F}/cloudflare`, CLOUDFLARE_ACCOUNT_ID: "conto-finto", CLOUDFLARE_AI_TOKEN: "token-finto", GBIF_API_URL: F,
        CARTELLA_PREPARA: CARTELLA, TETTO_NEURON: String(tetto), SPECIE: "Epipremnum aureum,Monstera deliciosa,Zamioculcas zamiifolia,Phalaenopsis,Ficus elastica" },
    });
    let t = "";
    p.stdout.on("data", (d) => (t += d));
    p.stderr.on("data", (d) => (t += d));
    p.on("close", () => r(t));
  });
let fatti = 0, errori = 0;
const ok = (c, d, t) => { fatti++; if (!c) { errori++; if (t) console.log(t); } console.log(`${c ? "✓" : "✗"} ${d}`); };
try {
  let t = await lancia(6000, "--elenco");
  ok(/Da generare: 3 /.test(t) && chiamateAi === 0 && redis.size === 0, "--elenco: dice cosa farebbe, senza AI e senza salvare", t);
  // Dal 2026-11-26 il pomodoro ha la scheda del tipo "ortaggi e aromatiche dell'orto": l'esempio senza fonti A è il Ficus elastica
  ok(/senza scheda del tipo con fonti A: 1 \(Ficus elastica\)/.test(t) && /solo genere: 1 \(Phalaenopsis\)/.test(t), "Saltate: Ficus elastica senza fonti A, Phalaenopsis solo genere", t);
  t = await lancia(450); // la prima costa 100; per la seconda servono al peggio 100 + 300 = 400; per la terza 500: fermo
  ok(/Generate e salvate: 2 /.test(t) && /FERMATO PRIMA DELLA FINE: tetto di neuron/.test(t) && chiamateAi === 2, "Tetto: si ferma prima di poterlo superare", t);
  t = await lancia(450);
  ok(/Generate e salvate: 0/.test(t) && chiamateAi === 2, "Tetto: vale per tutta la giornata, anche rilanciando", t);
  modoAi = "rotto";
  t = await lancia(6000);
  ok(/Già presenti in Upstash: 2 /.test(t) && /Ripieghi \(non salvate\): 1 /.test(t) && redis.size === 2 && chiamateAi === 4, "Ripresa: salta le salvate; il ripiego (principale e riserva) non si salva", t);
  modoAi = "quota";
  t = await lancia(6000);
  ok(/quota gratuita di Cloudflare finita/.test(t) && /Non ancora provate: 1 /.test(t), "Quota di Cloudflare finita: si ferma e lo dice", t);
  modoAi = "ok";
  t = await lancia(6000);
  ok(/Generate e salvate: 1 /.test(t) && /Già presenti in Upstash: 2 /.test(t) && redis.size === 3, "Il ripiego di prima si riprova e si salva", t);
  ok(Object.keys(JSON.parse(readFileSync(path.join(CARTELLA, "stato.json"), "utf8")).ripieghi).length === 0, "Il ripiego riuscito si toglie dal ricordo");
  const primaAi = chiamateAi;
  t = await lancia(6000);
  ok(/Già presenti in Upstash: 3 /.test(t) && chiamateAi === primaAi, "Tutto pronto: nessuna chiamata all'AI", t);
  redis.clear(); upstashSpento = true;
  t = await lancia(6000);
  ok(/Upstash non risponde/.test(t) && chiamateAi === primaAi, "Upstash spento: si ferma senza sprecare neuron", t);
  ok(!/token-finto|conto-finto/.test(t), "Nessuna chiave nel testo stampato");
} finally {
  finto.close();
  rmSync(CARTELLA, { recursive: true, force: true });
}
console.log(`\n${fatti - errori}/${fatti} controlli superati.`);
process.exit(errori ? 1 : 0);
