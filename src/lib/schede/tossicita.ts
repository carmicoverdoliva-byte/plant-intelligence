// Tossicità PER LA PIANTA RICONOSCIUTA (decisioni dell'utente del 2026-11-22 e del 2026-11-26).
// 1. Se le nostre fonti A nominano esplicitamente il suo genere o la sua specie (i "casi" della scheda del tipo,
//    es. Crassula tossica per cani e gatti, Phalaenopsis non tossica), valore e nota sono quelli del caso.
// 2. Altrimenti, se la nota del tipo è divisa in frasi, si mostrano solo le frasi del suo genere o della sua famiglia,
//    più quelle valide per tutte, con il valore "non verificata" (per lei non abbiamo un caso verificato).
//    Se non resta nessuna frase: "non verificata" con la nota prudente (es. falangio e Strelitzia: niente aracee).
// 3. Una scheda del tipo senza frasi: i valori e la nota generali del tipo, come prima.
import type { SchedaCura } from "./tipi";

type TossicitaScheda = SchedaCura["tossicita"];
export type TossicitaMostrata = Omit<TossicitaScheda, "casi" | "frasi">;

/** Nota prudente quando non sappiamo nulla di verificato (uguale a quella delle schede generate, regole.ts). */
export const NOTA_PRUDENTE = "Non abbiamo dati verificati sulla tossicità: per prudenza tienila lontana da bambini e animali.";

export function casoTossicita(t: TossicitaScheda | undefined, specie: string, genere: string) {
  return t?.casi?.find((c) => c.taxa.some((x) => x === specie || x === genere || specie.startsWith(x + " ")));
}

/** La frase riguarda questa pianta? Senza "per" vale per tutte; altrimenti specie, genere o famiglia. */
const riguarda = (per: string[] | undefined, specie: string, genere: string, famiglia?: string) =>
  !per || per.some((x) => x === specie || x === genere || (!!famiglia && x === famiglia) || specie.startsWith(x + " "));

/** Valori e nota da mostrare per questa pianta. */
export function tossicitaPerPianta(t: TossicitaScheda, specie: string, genere: string, famiglia?: string): TossicitaMostrata {
  const caso = casoTossicita(t, specie, genere);
  if (caso) return { persone: caso.persone, animali: caso.animali, nota: caso.nota, fonti: caso.fonti };
  if (!t.frasi) return { persone: t.persone, animali: t.animali, nota: t.nota, fonti: t.fonti };
  const tenute = t.frasi.filter((f) => riguarda(f.per, specie, genere, famiglia));
  if (!tenute.length) return { persone: "non verificata", animali: "non verificata", nota: NOTA_PRUDENTE, fonti: [] };
  return {
    persone: "non verificata",
    animali: "non verificata",
    nota: tenute.map((f) => f.testo).join(" "),
    fonti: [...new Set(tenute.flatMap((f) => f.fonti))],
  };
}
