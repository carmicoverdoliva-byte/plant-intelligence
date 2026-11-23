// Dati del VIVAIO (fase 3.1, F09; richiesta dell'utente del 2026-11-23). Restano solo sul telefono (D3).
import type { RispostaSchedaGenerata } from "@/app/api/scheda-generata/route";
import type { SceltaScheda } from "@/lib/schede/scegli";

/** I dati della scheda del tipo così come l'app li ha ricevuti da /api/scheda. */
export type DatiSchedaTipo = SceltaScheda & { ok: true };

/** La scheda di cura MOSTRATA in quel momento, salvata per intero (fonti e tossicità comprese). */
export type SchedaMostrata =
  | { tipo: "generata"; dati: RispostaSchedaGenerata; nomeTipo?: string }
  | { tipo: "tipo"; dati: DatiSchedaTipo };

export interface PiantaVivaio {
  id: string;
  salvataIl: string; // data e ora ISO
  soprannome?: string; // facoltativo, es. "la monstera del soggiorno"
  nomeComune?: string;
  nomeScientifico: string;
  genere: string;
  famiglia: string;
  foto?: Blob; // JPEG, lato lungo 1280 px: per la scheda
  miniatura?: Blob; // JPEG, lato lungo 400 px: per la bacheca
  scheda: SchedaMostrata;
}

/** Il nome da mostrare: soprannome, poi nome comune, poi genere. */
export function nomePianta(p: Pick<PiantaVivaio, "soprannome" | "nomeComune" | "genere">): string {
  return p.soprannome?.trim() || p.nomeComune || `Genere ${p.genere}`;
}

export function dataBreve(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}
