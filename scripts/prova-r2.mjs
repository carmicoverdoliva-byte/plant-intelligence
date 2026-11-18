// Prova delle SCHEDE GENERATE (R2, D13 opzione B corretta) con Cloudflare Workers AI, piano gratuito.
// Uso: node scripts/prova-r2.mjs [cartella di uscita]   (predefinita: ~/test-piante/prova-r2, fuori dal repository)
// - Le chiavi si leggono da .env.local dentro questo programma e NON si stampano mai.
// - Per ogni specie: dati reali (nostra scheda del tipo + nota di famiglia = fonti A; Wikipedia = fonte C),
//   poi ogni modello scrive la scheda e i controlli automatici la giudicano.
// - Tetto di sicurezza: si ferma prima di 8.500 neuron stimati (il piano gratuito ne dà 10.000 al giorno).
// Le schede generate NON si pubblicano: servono solo al confronto.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(root, ".env.local"));
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_AI_TOKEN;
if (!ACCOUNT || !TOKEN) throw new Error("Chiavi Cloudflare mancanti in .env.local");
const USCITA = process.argv[2] ?? path.join(homedir(), "test-piante", "prova-r2");
mkdirSync(USCITA, { recursive: true });

// Modelli candidati e costo in neuron per milione di token (pagina prezzi Cloudflare, 2026-11-12)
const MODELLI = [
  { nome: "gemma-4-26b", ricerca: "gemma-4-26b", ingresso: 9091, uscita: 27273 },
  { nome: "qwen3-30b", ricerca: "qwen3-30b-a3b", ingresso: 4625, uscita: 30475 },
  { nome: "mistral-small-3.1", ricerca: "mistral-small-3.1", ingresso: 31876, uscita: 50488 },
];
const TETTO_NEURON = 8500;

const SPECIE = [
  ["Phalaenopsis amabilis", "Orchidaceae", "orchidee"],
  ["Epipremnum aureum", "Araceae", "rampicanti-tropicali"],
  ["Monstera deliciosa", "Araceae", "rampicanti-tropicali"],
  ["Spathiphyllum wallisii", "Araceae", "foglia-tropicale"],
  ["Zamioculcas zamiifolia", "Araceae", "foglia-tropicale"],
  ["Crassula ovata", "Crassulaceae", "succulente"],
  ["Aloe vera", "Asphodelaceae", "succulente"],
  ["Kalanchoe blossfeldiana", "Crassulaceae", "succulente"],
  ["Ficus elastica", "Moraceae", "alberi-arbusti-tropicali"],
  ["Ocimum basilicum", "Lamiaceae", "ortaggi-aromatiche"],
];
const UA = "Mandragola/0.1 (https://mandragola-app.vercel.app; prova schede generate)";
const famiglie = JSON.parse(readFileSync(path.join(root, "src/data/schede/famiglie.json"), "utf8"));

async function wikipedia(nome) {
  for (const lingua of ["it", "en"]) {
    const u = `https://${lingua}.wikipedia.org/w/api.php?action=query&prop=extracts|info&inprop=url&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(nome)}`;
    const j = await (await fetch(u, { headers: { "User-Agent": UA } })).json();
    const p = Object.values(j.query?.pages ?? {})[0];
    if (p && !("missing" in p) && p.extract?.length > 300) return { lingua, titolo: p.title, url: p.fullurl, testo: p.extract.slice(0, 7000) };
  }
  return null;
}

/** Testo compatto della nostra scheda del tipo (fonte A) da dare al modello. */
function riassuntoScheda(s) {
  const righe = [`Scheda del tipo "${s.nome}". Si applica a: ${s.siApplicaA}`];
  for (const [k, sez] of Object.entries(s.sezioni)) {
    righe.push(`[${k}] ${sez.lineeGuida.riassunto} Cose da fare: ${sez.lineeGuida.coseDaFare.join("; ")}.`);
    for (const v of sez.lineeGuida.valori ?? []) righe.push(`  - ${v.etichetta}: ${v.valore}`);
  }
  righe.push(`[tossicità] persone: ${s.tossicita.persone}; animali: ${s.tossicita.animali}. ${s.tossicita.nota}`);
  return righe.join("\n");
}

const ISTRUZIONI = `Sei il redattore di Mandragola, un'app italiana per la cura delle piante. Scrivi una SCHEDA DI CURA per la specie indicata, in italiano semplice, usando SOLO le fonti fornite (identificate da S1, S2, S3). Non usare conoscenze tue: se un'informazione non è nelle fonti, scrivi "non indicata dalle fonti".
Regole obbligatorie:
- Le fonti di livello A possono stare nelle "lineeGuida". Le fonti di livello C (Wikipedia) possono stare SOLO in "pollice" (consigli non ufficiali).
- Ogni numero (temperature, giorni, mesi, dosi) deve comparire nella fonte citata.
- Tossicità: scrivi "non tossica" solo se una fonte A lo dice esplicitamente; altrimenti "tossica", "varia" o "non verificata".
- I consigli in "pollice" non devono contraddire le lineeGuida.
- Non copiare frasi dalle fonti: riscrivi con parole tue.
Rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, con questa forma:
{"riassunto": "...", "coseDaFare": ["..."],
 "sezioni": {"luce": S, "acqua": S, "temperatura": S, "terriccio": S, "concime": S, "travaso": S, "coltivarla": S, "problemi": S},
 "tossicita": {"persone": "tossica|non tossica|varia|non verificata", "animali": "...", "nota": "...", "fonti": ["S1"]}}
dove S = {"lineeGuida": {"riassunto": "...", "coseDaFare": ["..."], "fonti": ["S1"]}, "pollice": [{"consiglio": "...", "fonti": ["S3"]}]}`;

async function modelloId(ricerca) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/models/search?search=${encodeURIComponent(ricerca)}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const j = await r.json();
  const m = (j.result ?? []).find((x) => x.task?.name === "Text Generation");
  return m?.name ?? null;
}

async function genera(modello, messaggi) {
  const t0 = Date.now();
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${modello}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messaggi, max_tokens: 3500, temperature: 0.2 }),
    signal: AbortSignal.timeout(180000),
  });
  const j = await r.json().catch(() => ({}));
  const res = j.result ?? {};
  const testo = res.response ?? res.choices?.[0]?.message?.content ?? "";
  const usage = res.usage ?? {};
  return { ok: r.ok && j.success !== false, stato: r.status, errori: (j.errors ?? []).map((e) => e.message).join("; "), testo: typeof testo === "string" ? testo : JSON.stringify(testo), usage, ms: Date.now() - t0 };
}

const parole = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ");
const ottetti = (p) => new Set(p.slice(0, Math.max(0, p.length - 7)).map((_, i) => p.slice(i, i + 8).join(" ")));

/** Controlli automatici sulla scheda generata (come previsti per il server di R2). */
function controlla(json, fonti) {
  const problemi = [];
  const SEZ = ["luce", "acqua", "temperatura", "terriccio", "concime", "travaso", "coltivarla", "problemi"];
  for (const k of SEZ) {
    const s = json.sezioni?.[k];
    if (!s?.lineeGuida?.riassunto) { problemi.push(`sezione mancante o vuota: ${k}`); continue; }
    for (const id of s.lineeGuida.fonti ?? []) {
      if (!fonti[id]) problemi.push(`${k}: fonte inesistente ${id}`);
      else if (fonti[id].livello !== "A") problemi.push(`${k}: fonte ${id} (livello ${fonti[id].livello}) nelle linee guida`);
    }
    // Numeri delle linee guida: devono comparire nelle fonti citate
    const testoLg = `${s.lineeGuida.riassunto} ${(s.lineeGuida.coseDaFare ?? []).join(" ")}`;
    const testoFonti = (s.lineeGuida.fonti ?? []).map((id) => fonti[id]?.testo ?? "").join(" ");
    for (const n of testoLg.match(/\d+(?:[.,]\d+)?/g) ?? []) if (!testoFonti.includes(n)) problemi.push(`${k}: numero "${n}" non trovato nelle fonti citate`);
    for (const p of s.pollice ?? []) for (const id of p.fonti ?? []) if (!fonti[id]) problemi.push(`${k}: pollice con fonte inesistente ${id}`);
  }
  const t = json.tossicita ?? {};
  for (const chi of ["persone", "animali"]) {
    if (t[chi] === "non tossica" && !(t.fonti ?? []).some((id) => fonti[id]?.livello === "A")) problemi.push(`tossicità ${chi}: "non tossica" senza fonte A`);
    if (!["tossica", "non tossica", "varia", "non verificata"].includes(t[chi])) problemi.push(`tossicità ${chi}: valore non ammesso (${t[chi]})`);
  }
  const wiki = Object.values(fonti).find((f) => f.livello === "C");
  if (wiki) {
    const uguali = [...ottetti(parole(JSON.stringify(json)))].filter((o) => ottetti(parole(wiki.testo)).has(o));
    if (uguali.length) problemi.push(`anti-copia: ${uguali.length} sequenze di 8 parole uguali a Wikipedia`);
  }
  return problemi;
}

let neuron = 0;
const risultati = [];
const ids = {};
for (const m of MODELLI) ids[m.nome] = await modelloId(m.ricerca);
console.log("Modelli trovati:", JSON.stringify(ids));

for (const [specie, famiglia, tipo] of SPECIE) {
  const fonti = {};
  let blocchi = [];
  const fileTipo = path.join(root, "src/data/schede/tipi", `${tipo}.json`);
  if (existsSync(fileTipo)) {
    const s = JSON.parse(readFileSync(fileTipo, "utf8"));
    fonti.S1 = { livello: "A", titolo: `Scheda Mandragola del tipo "${s.nome}" (verificata con fonti istituzionali)`, testo: riassuntoScheda(s) };
  }
  const nota = famiglie.find((f) => f.famiglia === famiglia);
  if (nota) fonti.S2 = { livello: "A", titolo: `Nota Mandragola sulla famiglia ${nota.famiglia}`, testo: nota.note.map((n) => `${n.tema}: ${n.testo}`).join("\n") };
  const w = await wikipedia(specie);
  if (w) fonti.S3 = { livello: "C", titolo: `Wikipedia (${w.lingua}): ${w.titolo}`, url: w.url, testo: w.testo };
  blocchi = Object.entries(fonti).map(([id, f]) => `### ${id} — livello ${f.livello} — ${f.titolo}\n${f.testo}`);
  const messaggi = [
    { role: "system", content: ISTRUZIONI },
    { role: "user", content: `Specie: ${specie} (famiglia ${famiglia}).\n\nFONTI:\n${blocchi.join("\n\n")}` },
  ];
  for (const m of MODELLI) {
    if (!ids[m.nome]) continue;
    if (neuron > TETTO_NEURON) { console.log("Tetto di sicurezza raggiunto: mi fermo."); break; }
    const g = await genera(ids[m.nome], messaggi);
    const n = ((g.usage.prompt_tokens ?? 0) * m.ingresso + (g.usage.completion_tokens ?? 0) * m.uscita) / 1e6;
    neuron += n;
    let json = null;
    try { json = JSON.parse(g.testo.slice(g.testo.indexOf("{"), g.testo.lastIndexOf("}") + 1)); } catch { /* JSON non valido */ }
    const problemi = json ? controlla(json, fonti) : ["JSON non valido o risposta vuota" + (g.errori ? `: ${g.errori}` : "")];
    risultati.push({ specie, modello: m.nome, ms: g.ms, neuron: Math.round(n), tokenUscita: g.usage.completion_tokens, valida: Boolean(json), problemi });
    writeFileSync(path.join(USCITA, `${m.nome}__${specie.replace(/ /g, "_")}.json`), JSON.stringify({ specie, modello: ids[m.nome], fonti: Object.fromEntries(Object.entries(fonti).map(([k, f]) => [k, { livello: f.livello, titolo: f.titolo, url: f.url }])), scheda: json, grezzo: json ? undefined : g.testo, problemi }, null, 2));
    console.log(`${specie} · ${m.nome}: ${json ? "JSON ok" : "JSON NON valido"} · problemi ${problemi.length} · ${Math.round(n)} neuron · ${(g.ms / 1000).toFixed(1)} s`);
  }
}
writeFileSync(path.join(USCITA, "riepilogo.json"), JSON.stringify({ neuronStimati: Math.round(neuron), risultati }, null, 2));
console.log(`\nNeuron stimati in tutto: ${Math.round(neuron)} (piano gratuito: 10.000 al giorno)`);
for (const m of MODELLI) {
  const r = risultati.filter((x) => x.modello === m.nome);
  if (!r.length) continue;
  const media = (f) => (r.reduce((s, x) => s + f(x), 0) / r.length).toFixed(1);
  console.log(`${m.nome}: JSON validi ${r.filter((x) => x.valida).length}/${r.length} · problemi medi ${media((x) => x.problemi.length)} · neuron medi ${media((x) => x.neuron)} · secondi medi ${media((x) => x.ms / 1000)}`);
}
