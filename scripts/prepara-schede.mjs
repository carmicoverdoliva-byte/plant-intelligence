// PREPARAZIONE ANTICIPATA delle schede di specie (R2): le genera e le salva in Upstash, così sul telefono arrivano subito.
// Uso: node scripts/prepara-schede.mjs [--elenco]     (--elenco = dice solo cosa farebbe: niente AI, niente salvataggi)
// - Prende le SPECIE di data/elenco-priorita.json la cui scheda del tipo ha fonti A; salta quelle già in Upstash.
// - Usa lo STESSO codice dell'app (servizio.ts): modello principale, riserva, tutte le regole. I ripieghi non si salvano.
// - Nomi come li manda il telefono: nome accettato e famiglia secondo GBIF (servizio pubblico, dati CC BY 4.0).
// - Tetto di neuron per GIORNO (TETTO_NEURON, predefinito 6.000; Cloudflare riparte a mezzanotte UTC). Prima di ogni specie
//   si controlla che resti posto per il caso peggiore (due prove del principale più la riserva); se no ci si ferma.
// - Se si ferma, rilanciandolo riprende: le schede salvate si saltano; i ripieghi dei giorni prima si riprovano per ultimi.
// - Il ricordo di neuron e ripieghi sta fuori dal repository: ~/test-piante/prepara-schede (CARTELLA_PREPARA per cambiarla).
// - Le chiavi si leggono da .env.local e NON si stampano mai.
// - Il testo grezzo dei tentativi SCARTATI (con le chiavi oscurate) si salva in <cartella>/scartate, per capire il perché.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(root, ".env.local")); // le variabili già impostate (prove) hanno la precedenza
process.env.UPSTASH_TIMEOUT_MS ||= "8000"; // qui si può aspettare un po' di più che sul telefono
process.env.UPSTASH_PAUSA_MS ||= "1";
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") } });
const { chiavePianta, generaRisposta } = await jiti.import(path.join(root, "src/lib/schede/genera/servizio.ts"));
const { UpstashCardStore } = await jiti.import(path.join(root, "src/lib/schede/genera/archivio.ts"));
const { scegliScheda } = await jiti.import(path.join(root, "src/lib/schede/scegli.ts"));

const SOLO_ELENCO = process.argv.includes("--elenco");
const TETTO = Number(process.env.TETTO_NEURON) || 6000;
const CARTELLA = process.env.CARTELLA_PREPARA || path.join(homedir(), "test-piante", "prepara-schede");
const GBIF = process.env.GBIF_API_URL || "https://api.gbif.org";
const STIMA = 120; // neuron di UNA chiamata, finché non se ne misura una
const CHIAMATE_PEGGIORI = 3;
mkdirSync(CARTELLA, { recursive: true });
const FILE_STATO = path.join(CARTELLA, "stato.json");
const CARTELLA_SCARTATE = path.join(CARTELLA, "scartate");
let scartate = 0;
const stato = existsSync(FILE_STATO) ? JSON.parse(readFileSync(FILE_STATO, "utf8")) : { neuron: {}, ripieghi: {} };
const oggi = new Date().toISOString().slice(0, 10); // giorno UTC, come la quota di Cloudflare
const usatiOggi = () => stato.neuron[oggi] ?? 0;
const ricorda = () => writeFileSync(FILE_STATO, JSON.stringify(stato, null, 2));

const esiti = { generate: [], giaPresenti: [], ripieghi: [], senzaFonteA: [], soloGenere: [], nonProvate: [], problemi: [] };
const TETTO_RAGGIUNTO = "tetto di neuron";
let fermo = ""; // perché ci si è fermati prima della fine

/** Nome accettato e famiglia secondo GBIF: gli stessi nomi che usa il telefono dopo il riconoscimento. */
async function nomiGbif(voce) {
  const chiedi = async (id) => (await fetch(`${GBIF}/v1/species/${id}`, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mandragola/0.1 (https://mandragola-app.vercel.app)" } })).json();
  try {
    let s = await chiedi(voce.gbif.chiave);
    if (s.taxonomicStatus !== "ACCEPTED" && s.acceptedKey) s = await chiedi(s.acceptedKey);
    return s.canonicalName && s.family ? { specie: s.canonicalName, famiglia: s.family } : null;
  } catch {
    return null;
  }
}

// 1. Quali specie
const voci = JSON.parse(readFileSync(path.join(root, "data/elenco-priorita.json"), "utf8")).specie.filter(
  (v) => !process.env.SPECIE || process.env.SPECIE.split(",").map((x) => x.trim()).includes(v.nome),
);
const daFare = [];
for (const v of voci) {
  const genereElenco = v.nome.split(" ")[0];
  const s = scegliScheda(v.nome, genereElenco);
  if (!s.scheda?.fonti?.some((f) => f.livello === "A")) esiti.senzaFonteA.push(v.nome);
  else if (v.nome.trim().split(/\s+/).length < 2) esiti.soloGenere.push(v.nome); // l'app genera solo schede di specie
  else {
    const n = await nomiGbif(v);
    if (!n) { esiti.problemi.push(`${v.nome}: GBIF non risponde`); continue; }
    const genere = n.specie.split(" ")[0];
    daFare.push({ specie: n.specie, genere, famiglia: n.famiglia, chiave: chiavePianta(n.specie, genere, n.famiglia) });
  }
}
daFare.sort((a, b) => Number(a.chiave in stato.ripieghi) - Number(b.chiave in stato.ripieghi)); // ripieghi vecchi in fondo

// 2. Generazione
const archivio = new UpstashCardStore();
let costoMassimo = 0;
console.log(`Neuron già contati oggi da questo script: ${usatiOggi()} · tetto ${TETTO} · specie da controllare: ${daFare.length}\n`);
for (const p of daFare) {
  if (fermo && fermo !== TETTO_RAGGIUNTO) { esiti.nonProvate.push(p.specie); continue; } // col tetto si contano ancora le già presenti
  const { disponibile, scheda } = await archivio.cerca(p.chiave);
  if (!disponibile) { fermo = "Upstash non risponde"; esiti.nonProvate.push(p.specie); continue; }
  if (scheda) { esiti.giaPresenti.push(p.specie); continue; }
  if (SOLO_ELENCO || fermo) { esiti.nonProvate.push(p.specie); continue; }
  if (usatiOggi() + CHIAMATE_PEGGIORI * (costoMassimo || STIMA) > TETTO) { fermo = TETTO_RAGGIUNTO; esiti.nonProvate.push(p.specie); continue; }

  const r = await generaRisposta(p.specie, p.genere, p.famiglia);
  // Le chiamate interrotte Cloudflare le fa pagare ma non dice quanto: si contano al costo previsto
  for (const t of r.tentativi) if (t.neuron) costoMassimo = Math.max(costoMassimo, t.neuron);
  const interrotte = r.tentativi.filter((t) => t.esito === "errore: tempo scaduto" || t.esito === "errore: rete").length;
  const neuron = Math.round(r.tentativi.reduce((s, t) => s + t.neuron, 0) + interrotte * (costoMassimo || STIMA));
  stato.neuron[oggi] = usatiOggi() + neuron;
  const percorso = r.tentativi.map((t) => `${t.modello} ${t.esito}`).join(" → ");
  r.tentativi.forEach((t, i) => {
    if (!t.grezzo) return;
    mkdirSync(CARTELLA_SCARTATE, { recursive: true });
    const nome = `${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}-${p.specie.replace(/\W+/g, "_")}-${i + 1}-${t.modello.replace(/\W+/g, "_")}.json`;
    writeFileSync(path.join(CARTELLA_SCARTATE, nome), JSON.stringify({ specie: p.specie, modello: t.modello, esito: t.esito, interventi: t.interventi, grezzo: JSON.parse(t.grezzo) }, null, 2));
    scartate++;
  });
  const secondi = (r.tentativi.reduce((s, t) => s + t.ms, 0) / 1000).toFixed(1);

  if (r.tipo === "generata") {
    let salvata = false;
    for (let i = 0; i < 3 && !salvata; i++) salvata = await archivio.salva(p.chiave, r.risposta);
    if (salvata) {
      delete stato.ripieghi[p.chiave];
      esiti.generate.push({ specie: p.specie, modello: r.risposta.modello, verificata: r.risposta.verificata, neuron });
    } else {
      fermo = "Upstash non salva";
      esiti.problemi.push(`${p.specie}: generata ma non salvata`);
    }
  } else if (r.tentativi.some((t) => t.esito === "errore: quota")) {
    fermo = "quota gratuita di Cloudflare finita";
    esiti.nonProvate.push(p.specie);
  } else if (r.tentativi.some((t) => t.esito === "errore: configurazione")) {
    fermo = "chiavi di Cloudflare mancanti";
    esiti.nonProvate.push(p.specie);
  } else {
    stato.ripieghi[p.chiave] = { specie: p.specie, giorno: oggi, percorso };
    esiti.ripieghi.push({ specie: p.specie, percorso, neuron });
  }
  ricorda();
  console.log(`${p.specie}: ${r.tipo} · ${percorso} · ${secondi} s · ${neuron} neuron · oggi ${usatiOggi()}`);
}

// 3. Riepilogo
const nomi = (l) => l.map((x) => (typeof x === "string" ? x : x.specie)).join(", ") || "—";
const righe = [
  ["Generate e salvate", esiti.generate],
  ["Già presenti in Upstash", esiti.giaPresenti],
  ["Ripieghi (non salvate)", esiti.ripieghi],
  ["Saltate: senza scheda del tipo con fonti A", esiti.senzaFonteA],
  ["Saltate: voce di solo genere", esiti.soloGenere],
  [SOLO_ELENCO ? "Da generare" : "Non ancora provate", esiti.nonProvate],
  ["Problemi", esiti.problemi],
];
console.log("\n=== RIEPILOGO ===");
for (const [titolo, l] of righe) console.log(`${titolo}: ${l.length}${l.length ? ` (${nomi(l)})` : ""}`);
console.log(`Neuron di questo lancio e dei precedenti di oggi: ${usatiOggi()} (tetto ${TETTO})`);
if (scartate) console.log(`Tentativi scartati: ${scartate}, testo grezzo in ${CARTELLA_SCARTATE}`);
if (fermo) console.log(`FERMATO PRIMA DELLA FINE: ${fermo}. Rilancialo per riprendere da qui.`);
if (!SOLO_ELENCO) writeFileSync(path.join(CARTELLA, `riepilogo-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`), JSON.stringify({ ...esiti, neuronOggi: usatiOggi(), tetto: TETTO, fermo }, null, 2));
