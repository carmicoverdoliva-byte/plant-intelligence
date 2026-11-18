// Controlli automatici delle schede di cura (D13, skill plant-schede, fase 5).
// Uso: npm run schede:controlla            → controlli sul contenuto (veloci, senza rete)
//      npm run schede:controlla -- --rete  → anche link vivi e anti-copia (scarica le pagine delle fonti)
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const RETE = process.argv.includes("--rete");
const SEZIONI = ["luce", "acqua", "temperatura", "terriccio", "concime", "travaso", "coltivarla", "problemi"];
const TOSSICITA = ["tossica", "non tossica", "varia", "non verificata"];
const FREQUENZE = ["frequente", "occasionale", "raro", "non indicata"];
const VERDETTI = ["falso", "esagerato", "vero in parte", "fonti in disaccordo"];
// Siti che non vogliono strumenti di AI: non si scaricano (regola della skill plant-schede)
const SITI_VIETATI = ["gardenia.cairoeditore.it", "www.missouribotanicalgarden.org"];

let errori = 0, avvisi = 0;
const errore = (dove, msg) => { errori++; console.log(`✗ ${dove}: ${msg}`); };
const avviso = (dove, msg) => { avvisi++; console.log(`! ${dove}: ${msg}`); };

/** Le linee guida accettano solo fonti A, oppure almeno due fonti B concordi. */
function fontiLineeGuida(dove, ids, fonti) {
  const usate = ids.map((id) => fonti.get(id));
  if (usate.some((f) => !f)) return errore(dove, `fonte inesistente (${ids.join(",")})`);
  const a = usate.filter((f) => f.livello === "A").length;
  const b = usate.filter((f) => f.livello === "B").length;
  if (usate.some((f) => f.livello === "C")) errore(dove, "fonte di livello C nelle linee guida");
  if (ids.length && a === 0 && b < 2) errore(dove, "nelle linee guida servono fonti A, oppure due fonti B");
}

function controllaScheda(file) {
  const s = JSON.parse(readFileSync(file, "utf8"));
  const dove = s.id ?? path.basename(file);
  const fonti = new Map((s.fonti ?? []).map((f) => [f.id, f]));
  const usate = new Set();
  const usa = (ids) => ids.forEach((i) => usate.add(i));

  for (const f of s.fonti ?? []) {
    if (!f.titolo || !f.url || !/^https:\/\//.test(f.url) || !/^\d{4}-\d{2}-\d{2}$/.test(f.consultato) || !["A", "B", "C"].includes(f.livello))
      errore(dove, `fonte ${f.id} incompleta (titolo, url https, data, livello)`);
    if (SITI_VIETATI.some((d) => f.url.includes(d)) && f.lettaDa !== "utente") errore(dove, `fonte ${f.id}: sito che vieta l'AI, va letto dall'utente`);
  }
  if (!s.riassunto || !s.coseDaFare?.length || !s.siApplicaA) errore(dove, "manca riassunto, cose da fare o 'si applica a'");

  for (const nome of SEZIONI) {
    const sez = s.sezioni?.[nome];
    const d = `${dove} › ${nome}`;
    if (!sez) { errore(d, "sezione mancante"); continue; }
    const lg = sez.lineeGuida;
    if (!lg?.riassunto || !lg.coseDaFare?.length) errore(d, "linee guida senza riassunto o cose da fare");
    if (!lg?.fonti?.length) errore(d, "linee guida senza fonti");
    else { fontiLineeGuida(d, lg.fonti, fonti); usa(lg.fonti); }
    for (const v of lg?.valori ?? []) {
      const conNumero = /\d/.test(v.valore);
      if (conNumero && !v.fonti.length) errore(d, `valore con numero senza fonte: "${v.etichetta}"`);
      if (!v.fonti.length && !/non indicat/i.test(v.valore)) errore(d, `valore senza fonte: "${v.etichetta}"`);
      if (v.fonti.length) { fontiLineeGuida(`${d} › ${v.etichetta}`, v.fonti, fonti); usa(v.fonti); }
    }
    for (const dis of lg?.disaccordi ?? []) {
      if (!dis.sceltaPrudente) errore(d, `disaccordo senza scelta prudente: ${dis.tema}`);
      dis.posizioni.forEach((p) => usa(p.fonti));
    }
    for (const p of sez.pollice ?? []) {
      if (!p.fonti?.length) errore(d, `consiglio dal pollice verde senza fonte: "${p.consiglio}"`);
      for (const id of p.fonti ?? []) {
        const f = fonti.get(id);
        if (!f) errore(d, `fonte ${id} inesistente nel pollice verde`);
        else if (f.livello === "A") avviso(d, `consiglio dal pollice verde con fonte A (meglio nelle linee guida): "${p.consiglio}"`);
      }
      usa(p.fonti ?? []);
    }
  }
  const prob = s.sezioni?.problemi;
  if (!prob?.elenco?.length) errore(`${dove} › problemi`, "elenco dei problemi vuoto");
  for (const p of prob?.elenco ?? []) {
    if (!FREQUENZE.includes(p.frequenza)) errore(`${dove} › problemi`, `frequenza non ammessa: ${p.frequenza}`);
    if (/%/.test(JSON.stringify(p))) errore(`${dove} › problemi`, `percentuale nei problemi: ${p.nome}`);
    if (!p.fonti?.length) errore(`${dove} › problemi`, `problema senza fonte: ${p.nome}`);
    else fontiLineeGuida(`${dove} › problemi › ${p.nome}`, p.fonti, fonti);
    usa(p.fonti ?? []);
  }
  // Temperature coerenti: minima ≤ inizio dell'intervallo ideale
  const val = s.sezioni?.temperatura?.lineeGuida?.valori ?? [];
  const num = (re) => Number(val.find((v) => re.test(v.etichetta))?.valore.match(/-?\d+/)?.[0]);
  const min = num(/^minima/i), ideale = num(/^ideale/i);
  if (!Number.isNaN(min) && !Number.isNaN(ideale) && min > ideale) errore(`${dove} › temperatura`, `minima (${min}) più alta dell'ideale (${ideale})`);

  for (const m of s.falsiMiti ?? []) {
    if (!VERDETTI.includes(m.verdetto)) errore(`${dove} › falsi miti`, `verdetto non ammesso: ${m.verdetto}`);
    if (!m.fonti?.length || m.fonti.some((id) => fonti.get(id)?.livello !== "A")) errore(`${dove} › falsi miti`, `il verdetto vuole solo fonti A: "${m.mito}"`);
    usa(m.fonti ?? []);
  }
  const t = s.tossicita;
  if (!t || !TOSSICITA.includes(t.persone) || !TOSSICITA.includes(t.animali)) errore(`${dove} › tossicità`, "valori mancanti o non ammessi");
  else {
    if ([t.persone, t.animali].includes("non tossica") && t.fonti.filter((id) => fonti.get(id)?.livello === "A").length < 2)
      errore(`${dove} › tossicità`, "\"non tossica\" solo con almeno due fonti A");
    if (!t.nota) errore(`${dove} › tossicità`, "manca la nota (consiglio prudente)");
    usa(t.fonti);
  }
  for (const f of s.fonti ?? []) if (!usate.has(f.id)) avviso(dove, `fonte ${f.id} mai citata`);
  return s;
}

function testi(oggetto) {
  // Tutti i testi scritti da noi (per l'anti-copia)
  const out = [];
  const giro = (o, chiave) => {
    if (typeof o === "string" && !["url", "titolo", "sito", "punto", "consultato", "id"].includes(chiave)) out.push(o);
    else if (Array.isArray(o)) o.forEach((x) => giro(x, chiave));
    else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (k !== "fonti") giro(v, k);
  };
  giro(oggetto);
  return out.join(" ");
}
const parole = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ");
const ottetti = (p) => new Set(p.slice(0, Math.max(0, p.length - 7)).map((_, i) => p.slice(i, i + 8).join(" ")));

const cartella = path.join(root, "src/data/schede/tipi");
const schede = readdirSync(cartella).filter((f) => f.endsWith(".json")).map((f) => controllaScheda(path.join(cartella, f)));

// Note di famiglia
const famiglie = JSON.parse(readFileSync(path.join(root, "src/data/schede/famiglie.json"), "utf8"));
for (const n of famiglie) {
  const fonti = new Map(n.fonti.map((f) => [f.id, f]));
  for (const nota of n.note) {
    if (!nota.fonti.length) errore(n.famiglia, `nota senza fonti: ${nota.tema}`);
    fontiLineeGuida(`${n.famiglia} › ${nota.tema}`, nota.fonti, fonti);
    if (nota.tema === "tossicità" && nota.fonti.filter((id) => fonti.get(id)?.livello === "A").length < 2)
      errore(n.famiglia, "la tossicità vuole almeno due fonti A");
  }
}

// Indice dei tipi: ogni genere porta a un tipo esistente
const { TIPI } = await import(pathToFileURL(path.join(root, "src/content/tipi-di-pianta.ts")).href);
const indice = JSON.parse(readFileSync(path.join(root, "src/data/tipo-per-genere.json"), "utf8"));
{
  const sconosciuti = Object.entries(indice.generi).filter(([, [t]]) => !(t in TIPI));
  if (sconosciuti.length) errore("indice dei tipi", `${sconosciuti.length} generi con un tipo inesistente`);
  const pronti = new Set(schede.map((s) => s.id.replace("tipo/", "")));
  console.log(`Schede per tipo pronte: ${pronti.size}/${Object.keys(TIPI).length} (${[...pronti].join(", ")})`);
}

if (RETE) {
  const pagine = new Map();
  for (const s of schede) {
    const nostri = ottetti(parole(testi(s)));
    for (const f of s.fonti) {
      if (SITI_VIETATI.some((d) => f.url.includes(d))) continue;
      if (!pagine.has(f.url)) {
        try {
          const r = await fetch(f.url, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mandragola/0.1 (https://mandragola-app.vercel.app; controllo fonti)" } });
          pagine.set(f.url, { stato: r.status, testo: r.ok && /html|text/.test(r.headers.get("content-type") ?? "") ? (await r.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ") : "" });
        } catch {
          pagine.set(f.url, { stato: 0, testo: "" });
        }
      }
      const p = pagine.get(f.url);
      if (p.stato >= 400 || p.stato === 0) avviso(s.id, `link non raggiungibile dal PC (${p.stato || "nessuna risposta"}): ${f.url}`);
      if (p.testo) {
        const loro = ottetti(parole(p.testo));
        const uguali = [...nostri].filter((o) => loro.has(o));
        if (uguali.length) errore(s.id, `anti-copia: ${uguali.length} sequenze di 8 parole uguali a ${f.url} (es. "${uguali[0]}")`);
      }
    }
  }
  console.log(`Fonti controllate in rete: ${pagine.size}`);
}

console.log(`\nSchede: ${schede.length} · note di famiglia: ${famiglie.length} · errori: ${errori} · avvisi: ${avvisi}`);
process.exit(errori ? 1 : 0);
