// VERSIONE DELLE REGOLE delle schede generate (decisione dell'utente del 2026-11-25). Senza dipendenze: si prova da solo.
// Fa parte della chiave con cui la scheda è salvata in Upstash: se cambia, le schede vecchie non vengono più usate.
//
// QUANDO CAMBIARLA: ogni volta che cambiano regole, istruzioni al modello o fonti (schede del tipo, note di famiglia,
// tossicità, tipo di pianta per genere). Aumenta VERSIONE_REGOLE di 1 e aggiorna IMPRONTA_REGOLE.
// Se te ne dimentichi, tests/app/prova-regole-r2.mjs fallisce e scrive l'impronta nuova.

export const VERSIONE_REGOLE = 1;

/** Impronta dei file qui sotto: serve solo alla prova, per accorgersi che sono cambiati. */
export const IMPRONTA_REGOLE = "4887b56b1aa6af7c";
export const FILE_REGOLE = [
  "src/lib/schede/genera/regole.ts",
  "src/lib/schede/genera/genera.ts",
  "src/lib/schede/genera/fonti.ts",
  "src/lib/schede/scegli.ts",
  "src/lib/schede/tossicita.ts",
  "src/content/tipi-di-pianta.ts",
  "src/data/tipo-per-genere.json",
  "src/data/schede/famiglie.json",
  "src/data/schede/tipi", // tutta la cartella
];

/** Chiave della scheda: versione, nome scientifico, e anche genere e famiglia. Questi due arrivano dal telefono e decidono
 *  tipo e tossicità: se qualcuno li mandasse sbagliati, la sua scheda non finirebbe mai sotto la chiave giusta.
 *  Per lo stesso motivo i nomi restano ESATTI (niente minuscole): la ricerca del tipo distingue le maiuscole. */
export function chiaveScheda(specie: string, genere: string, famiglia = ""): string {
  return `scheda:r${VERSIONE_REGOLE}:${specie}|${genere}|${famiglia}`;
}
