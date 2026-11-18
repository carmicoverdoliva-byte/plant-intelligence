// Prova automatica delle regole del risultato (passo 2.3, specifiche F04, soglie D9).
// Usa le RISPOSTE GIÀ SALVATE del test D9: nessuna richiesta nuova a Pl@ntNet, nessun consumo della quota.
// Le risposte stanno fuori dal repository (CLAUDE.md §10): cartella indicata come argomento, predefinita
// ~/test-piante/risultati. Se manca, si provano solo i casi costruiti qui sotto.
// Uso: node tests/app/prova-classifica.mjs [cartella]
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { classifica } from "../../src/lib/riconoscimento/classifica.ts";

let fatti = 0, errori = 0;
const ok = (cond, descrizione) => {
  fatti++;
  if (!cond) errori++;
  console.log(`${cond ? "✓" : "✗"} ${descrizione}`);
};
const r = (score, nome, comuni = [], gbif) => ({
  score,
  species: { scientificNameWithoutAuthor: nome, genus: { scientificNameWithoutAuthor: nome.split(" ")[0] }, family: { scientificNameWithoutAuthor: "Fam" }, commonNames: comuni },
  gbif: gbif ? { id: gbif } : null,
});

// --- Casi costruiti: le soglie D9 una per una ---
ok(classifica(null).livello === "non-riconosciuta", "404 (nessuna pianta) → non riconosciuta");
ok(classifica({ results: [] }).livello === "non-riconosciuta", "lista vuota → non riconosciuta");
ok(classifica({ results: [r(0.056, "A a"), r(0.03, "B b")] }).livello === "non-riconosciuta", "s1 5,6% e s1 < 5×s2 → non riconosciuta");
ok(classifica({ results: [r(0.08, "A a"), r(0.01, "B b")] }).livello === "incerto", "s1 8% ma molto staccato (≥ 5×s2) → incerto");
ok(classifica({ results: [r(0.25, "A a"), r(0.2, "B b")] }).livello === "incerto", "s1 25% → incerto");
ok(classifica({ results: [r(0.5, "A a"), r(0.2, "B b")] }).livello === "probabile", "s1 50% → probabile");
ok(classifica({ results: [r(0.89, "Ocimum americanum"), r(0.05, "Ocimum basilicum")] }).livello === "molto-probabile", "s1 89%, distacco 84 punti → molto probabile");
ok(classifica({ results: [r(0.85, "A a"), r(0.15, "B b")] }).livello === "probabile", "s1 85% ma distacco 70 punti → probabile");
const gemelle = classifica({ results: [r(0.4, "A a"), r(0.2, "B b"), r(0.1, "C c"), r(0.1, "D d"), r(0.05, "E e")] });
ok(gemelle.gemelle.length === 3, "al massimo 3 specie simili");
const sinonimi = classifica(
  { results: [r(0.45, "Aloe officinalis", ["Aloe vera"], "2777592"), r(0.18, "Aloe vera", ["Aloe vera", "Sabarra"], "2777724")] },
  { 2777592: { chiave: "2777724", nomeScientifico: "Aloe vera" }, 2777724: { chiave: "2777724", nomeScientifico: "Aloe vera" } },
);
ok(sinonimi.principale?.nomeScientifico === "Aloe vera" && sinonimi.gemelle.length === 0, "i sinonimi si uniscono: Aloe officinalis = Aloe vera, nessuna gemella doppia");
ok(sinonimi.principale?.altriNomiComuni.includes("Sabarra"), "i nomi comuni dei sinonimi si sommano");
const json = JSON.stringify(classifica({ results: [r(0.5, "A a"), r(0.2, "B b")] }));
ok(!/score|punteggio|0\.5/.test(json), "nessun punteggio nel risultato inviato al telefono");

// --- Risposte reali salvate del test D9 (flora k-world-flora) ---
const cartella = process.argv[2] ?? path.join(homedir(), "test-piante", "risultati");
if (existsSync(cartella)) {
  const file = readdirSync(cartella).filter((f) => f.startsWith("k-world-flora__"));
  const conteggio = {};
  for (const f of file) {
    const salvato = JSON.parse(readFileSync(path.join(cartella, f), "utf8"));
    const ris = classifica(salvato.status === 200 ? salvato.response : null);
    conteggio[ris.livello] = (conteggio[ris.livello] ?? 0) + 1;
    if (f.includes("trappola")) ok(ris.livello === "non-riconosciuta", `trappola ${f.replace("k-world-flora__", "")} → "Non riesco a riconoscerla"`);
  }
  ok(file.length === 46, `risposte D9 lette: ${file.length}`);
  console.log("  livelli sulle 46 foto D9:", JSON.stringify(conteggio));
} else {
  console.log(`(cartella ${cartella} assente: prova solo sui casi costruiti)`);
}

console.log(`\n${fatti - errori}/${fatti} controlli superati.`);
process.exit(errori ? 1 : 0);
