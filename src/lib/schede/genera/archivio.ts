// Archivio delle schede generate (D6, D13): una per specie, valida per tutti, così non si rigenera. SOLO SERVER.
// Dentro ci sono solo testi delle schede: nessun dato delle persone. Comandi: 1 per leggere (GET), 1 per salvare (SET).
import { comandoUpstash } from "@/lib/upstash";
import type { RispostaSchedaGenerata } from "@/app/api/scheda-generata/route";
import { SEZIONI } from "./regole";

/** Dopo un anno la scheda si cancella da sola: così spariscono anche quelle di versioni vecchie. */
const DURATA_SECONDI = 365 * 24 * 3600;

export interface GeneratedCardStore {
  leggi(chiave: string): Promise<RispostaSchedaGenerata | null>; // null = non c'è, o archivio non disponibile
  salva(chiave: string, scheda: RispostaSchedaGenerata): Promise<void>; // se non riesce, la scheda arriva lo stesso
}

export class UpstashCardStore implements GeneratedCardStore {
  async leggi(chiave: string): Promise<RispostaSchedaGenerata | null> {
    const r = await comandoUpstash(["GET", chiave]);
    if (!r.ok || typeof r.valore !== "string") return null;
    try {
      const s = JSON.parse(r.valore) as RispostaSchedaGenerata;
      const intera =
        s?.ok === true && s.tipo === "generata" && s.fonti && s.scheda?.tossicita && SEZIONI.every((k) => s.scheda.sezioni?.[k]?.lineeGuida);
      return intera ? s : null; // rovinata: si rigenera
    } catch {
      return null;
    }
  }

  async salva(chiave: string, scheda: RispostaSchedaGenerata): Promise<void> {
    await comandoUpstash(["SET", chiave, JSON.stringify(scheda), "EX", DURATA_SECONDI]);
  }
}
