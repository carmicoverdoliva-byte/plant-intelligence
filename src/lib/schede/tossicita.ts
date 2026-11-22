// Tossicità PER LA PIANTA RICONOSCIUTA (decisione dell'utente del 2026-11-22).
// Se le nostre fonti A nominano esplicitamente il suo genere o la sua specie (i "casi" della scheda del tipo,
// es. Crassula tossica per cani e gatti, Phalaenopsis non tossica), il valore in grande è quello del caso.
// Il valore generico del tipo ("Dipende dalla specie") resta solo per le piante non nominate.
import type { SchedaCura } from "./tipi";

type TossicitaScheda = SchedaCura["tossicita"];

export function casoTossicita(t: TossicitaScheda | undefined, specie: string, genere: string) {
  return t?.casi?.find((c) => c.taxa.some((x) => x === specie || x === genere || specie.startsWith(x + " ")));
}

/** Valori e nota da mostrare per questa pianta: il caso, se c'è, altrimenti quelli generali del tipo. */
export function tossicitaPerPianta(t: TossicitaScheda, specie: string, genere: string): Omit<TossicitaScheda, "casi"> {
  const caso = casoTossicita(t, specie, genere);
  return caso ? { persone: caso.persone, animali: caso.animali, nota: caso.nota, fonti: caso.fonti } : t;
}
