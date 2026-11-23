// GARA DEI MODELLI per le schede di specie generate (R2), con il codice VERO dell'app (generaScheda + tutte le regole).
// Uso: node scripts/gara-modelli.mjs [cartella di uscita] [id-modello ...]
//   cartella predefinita: ~/test-piante/prova-r2/gara2 (fuori dal repository); modelli predefiniti: quelli qui sotto.
// - Ogni modello lavora DA SOLO: prima prova, eventuale riprova se copia da Wikipedia, poi ripiego (niente riserva),
//   così si vede quanto vale ciascuno.
// - Le chiavi si leggono da .env.local e NON si stampano mai. Le schede NON si pubblicano: servono al confronto.
// - Tetto di neuron (predefinito 7.500, il piano gratuito ne dà 10.000 al giorno; si cambia con TETTO_NEURON):
//   prima di ogni scheda si controlla che resti posto anche per una riprova; altrimenti la scheda si salta.
//   Le chiamate interrotte (tempo scaduto) contano il loro costo PIENO previsto, anche se Cloudflare non lo dice.
// - Per leggere il TypeScript dell'app (alias "@/") usa jiti, già presente tra le dipendenze di Tailwind.
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(root, ".env.local"));
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") } });
const { generaScheda } = await jiti.import(path.join(root, "src/lib/schede/genera/genera.ts"));
const { WorkersAiCardWriter } = await jiti.import(path.join(root, "src/lib/schede/genera/scrittore.ts"));

const USCITA = process.argv[2] ?? path.join(homedir(), "test-piante", "prova-r2", "gara2");
mkdirSync(USCITA, { recursive: true });
const TETTO = Number(process.env.TETTO_NEURON) || 7500;

// Modelli in gara, dal più economico al più caro; "stima" = neuron previsti per una scheda (prezzi del catalogo)
const MODELLI = [
  { nome: "gemma-4-26b", id: "@cf/google/gemma-4-26b-a4b-it", stima: 100 },
  { nome: "glm-4.7-flash", id: "@cf/zai-org/glm-4.7-flash", stima: 110 },
  { nome: "gpt-oss-20b", id: "@cf/openai/gpt-oss-20b", stima: 90 },
  { nome: "qwen3.8-27b", id: "@cf/qwen/qwen3.8-27b", stima: 800 },
].filter((m) => process.argv.length <= 3 || process.argv.slice(3).includes(m.id));

// Le 10 specie della prima gara; Monstera e albero di giada per prime (servono come esempi)
const SPECIE = [
  ["Monstera deliciosa", "Monstera", "Araceae"],
  ["Crassula ovata", "Crassula", "Crassulaceae"],
  ["Phalaenopsis amabilis", "Phalaenopsis", "Orchidaceae"],
  ["Epipremnum aureum", "Epipremnum", "Araceae"],
  ["Ficus elastica", "Ficus", "Moraceae"],
  ["Ocimum basilicum", "Ocimum", "Lamiaceae"],
  ["Spathiphyllum wallisii", "Spathiphyllum", "Araceae"],
  ["Zamioculcas zamiifolia", "Zamioculcas", "Araceae"],
  ["Aloe vera", "Aloe", "Asphodelaceae"],
  ["Kalanchoe blossfeldiana", "Kalanchoe", "Crassulaceae"],
].filter(([s]) => !process.env.SPECIE || process.env.SPECIE.split(",").map((x) => x.trim()).includes(s)); // es. SPECIE="Monstera deliciosa,Crassula ovata"

const nessunaRiserva = { nome: "nessuna", scrivi: async () => ({ testo: "", neuron: 0, ms: 0, errore: "riserva spenta nella gara" }) };
let totale = 0;
let quotaFinita = false;
const righe = [];

for (const m of MODELLI) {
  const scrittore = new WorkersAiCardWriter(m.nome, m.id);
  const costi = [];
  for (const [specie, genere, famiglia] of SPECIE) {
    const prevista = costi.length ? Math.max(...costi) : m.stima;
    if (quotaFinita || totale + 2 * prevista > TETTO) {
      righe.push({ modello: m.nome, specie, esito: quotaFinita ? "saltata: quota finita" : "saltata: tetto di neuron" });
      continue;
    }
    const r = await generaScheda(specie, genere, famiglia, { principale: scrittore, riserva: nessunaRiserva });
    const miei = r.tentativi.filter((t) => t.modello === m.nome);
    // Una chiamata interrotta (tempo scaduto, rete) Cloudflare la completa e la fa pagare, ma non ci dice quanto:
    // nel tetto conta il costo PIENO previsto (correzione del 2026-11-23, dopo la gara2)
    const interrotte = miei.filter((t) => t.esito === "errore: tempo scaduto" || t.esito === "errore: rete").length;
    const neuron = miei.reduce((s, t) => s + t.neuron, 0) + interrotte * prevista;
    const ms = miei.reduce((s, t) => s + t.ms, 0);
    totale += neuron;
    for (const t of miei) if (t.neuron) costi.push(t.neuron); // costo di UNA chiamata, per le previsioni
    if (miei.some((t) => t.esito === "errore: quota")) quotaFinita = true;
    const riga = {
      modello: m.nome,
      specie,
      esito: r.tipo === "generata" ? (r.esito.verificata ? "generata" : "generata NON VERIFICATA") : `ripiego: ${r.motivo}`,
      chiamate: miei.length,
      primoColpo: miei[0]?.esito === "ok",
      riprovaCopia: miei.length > 1 && miei[0]?.esito === "copia",
      ripiego: r.tipo !== "generata",
      senzaChiamate: miei.length === 0, // es. nessuna fonte A ma scheda del tipo pronta: non si genera
      ms,
      neuron, // comprese le chiamate interrotte, al costo previsto
      interrotte,
      tentativi: miei.map((t) => t.esito),
      interventi: miei.flatMap((t) => t.interventi),
    };
    righe.push(riga);
    writeFileSync(
      path.join(USCITA, `${m.nome}__${specie.replace(/ /g, "_")}.json`),
      JSON.stringify({ ...riga, scheda: r.tipo === "generata" ? r.esito.scheda : null, fonti: r.tipo === "generata" ? Object.fromEntries(Object.entries(r.fonti).map(([k, f]) => [k, { livello: f.livello, titolo: f.titolo, url: f.url }])) : null }, null, 2),
    );
    console.log(`${m.nome} · ${specie}: ${riga.esito} · ${riga.tentativi.join(" → ")} · ${(ms / 1000).toFixed(1)} s · ${neuron} neuron · totale ${totale}`);
  }
}

// Riepilogo per modello
const tabella = MODELLI.map((m) => {
  const r = righe.filter((x) => x.modello === m.nome && !x.esito.startsWith("saltata") && !x.senzaChiamate);
  const media = (k) => (r.length ? r.reduce((s, x) => s + x[k], 0) / r.length : 0);
  return {
    modello: m.nome,
    provate: r.length,
    saltate: righe.filter((x) => x.modello === m.nome && x.esito.startsWith("saltata")).length,
    primoColpo: r.filter((x) => x.primoColpo).length,
    riprovaCopia: r.filter((x) => x.riprovaCopia).length,
    ripiego: r.filter((x) => x.ripiego).length,
    secondiMedi: +(media("ms") / 1000).toFixed(1),
    neuronMedi: Math.round(media("neuron")),
  };
});
writeFileSync(path.join(USCITA, "riepilogo.json"), JSON.stringify({ neuronTotali: totale, tetto: TETTO, tabella, righe }, null, 2));
console.log(`\nNeuron totali: ${totale} (tetto ${TETTO})`);
console.table(tabella);
