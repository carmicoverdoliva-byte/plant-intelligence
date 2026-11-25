// VERSIONE DELLE REGOLE delle schede generate (decisione dell'utente del 2026-11-25). Senza dipendenze: si prova da solo.
// Fa parte della chiave con cui la scheda è salvata in Upstash: se cambia, TUTTE le schede vecchie non vengono più usate.
//
// QUANDO CAMBIARLA: quando cambiano le regole o le istruzioni al modello (i file qui sotto). Aumenta VERSIONE_REGOLE di 1
// e aggiorna IMPRONTA_REGOLE. Se te ne dimentichi, tests/app/prova-regole-r2.mjs fallisce e scrive l'impronta nuova.
// NON serve quando cambiano le fonti A (scheda del tipo, nota di famiglia, tossicità, tipo della pianta): nella chiave c'è
// anche la loro impronta (servizio.ts), quindi si rigenerano da sole solo le schede interessate.

export const VERSIONE_REGOLE = 2; // 2 dal 2026-11-25: regole 7a-7e, dopo la rilettura delle prime 24 schede

/** Impronta dei file qui sotto: serve solo alla prova, per accorgersi che sono cambiati. */
export const IMPRONTA_REGOLE = "e020cc99c128dee3";
export const FILE_REGOLE = [
  "src/lib/schede/genera/regole.ts",
  "src/lib/schede/genera/genera.ts",
  "src/lib/schede/genera/fonti.ts",
  "src/lib/schede/tossicita.ts",
];

/** Chiave della scheda: versione, nome scientifico, genere e famiglia, impronta delle fonti A.
 *  Genere e famiglia arrivano dal telefono e decidono tipo e tossicità: se qualcuno li mandasse sbagliati, la sua scheda
 *  non finirebbe mai sotto la chiave giusta. Per lo stesso motivo i nomi restano ESATTI (niente minuscole). */
export function chiaveScheda(specie: string, genere: string, famiglia = "", improntaFonti = ""): string {
  return `scheda:r${VERSIONE_REGOLE}:${specie}|${genere}|${famiglia}:${improntaFonti}`;
}
