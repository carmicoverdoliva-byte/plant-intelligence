// Archivio delle schede generate (D6, D13): una per specie, valida per tutti, così non si rigenera. SOLO SERVER.
// Dentro ci sono solo testi delle schede: nessun dato delle persone. Comandi: 1 per leggere (GET), 1 per salvare (SET).
import { comandoUpstash } from "@/lib/upstash";
import type { RispostaSchedaGenerata } from "@/app/api/scheda-generata/route";
import { SEZIONI } from "./regole";

/** Dopo un anno la scheda si cancella da sola: così spariscono anche quelle con regole o fonti vecchie. */
const DURATA_SECONDI = 365 * 24 * 3600;

export interface GeneratedCardStore {
  /** scheda null = non c'è (o è rovinata, si rigenera); disponibile false = l'archivio non risponde. */
  cerca(chiave: string): Promise<{ disponibile: boolean; scheda: RispostaSchedaGenerata | null }>;
  /** true = salvata. Se non riesce, al telefono la scheda arriva lo stesso. */
  salva(chiave: string, scheda: RispostaSchedaGenerata): Promise<boolean>;
}

export class UpstashCardStore implements GeneratedCardStore {
  async cerca(chiave: string): Promise<{ disponibile: boolean; scheda: RispostaSchedaGenerata | null }> {
    const r = await comandoUpstash(["GET", chiave]);
    if (!r.ok) return { disponibile: false, scheda: null };
    if (typeof r.valore !== "string") return { disponibile: true, scheda: null };
    try {
      const s = JSON.parse(r.valore) as RispostaSchedaGenerata;
      const intera =
        s?.ok === true && s.tipo === "generata" && s.fonti && s.scheda?.tossicita && SEZIONI.every((k) => s.scheda.sezioni?.[k]?.lineeGuida);
      return { disponibile: true, scheda: intera ? s : null };
    } catch {
      return { disponibile: true, scheda: null };
    }
  }

  async salva(chiave: string, scheda: RispostaSchedaGenerata): Promise<boolean> {
    return (await comandoUpstash(["SET", chiave, JSON.stringify(scheda), "EX", DURATA_SECONDI])).ok;
  }
}
