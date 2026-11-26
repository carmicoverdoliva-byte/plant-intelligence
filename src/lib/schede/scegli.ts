// Sceglie la scheda più precisa disponibile per una pianta riconosciuta (D13). SOLO SERVER.
// Oggi (R1) esistono le schede per TIPO DI PIANTA e le note di famiglia; specie e genere arriveranno con i blocchi.
import indice from "@/data/tipo-per-genere.json";
import famiglieDati from "@/data/schede/famiglie.json";
import foglia from "@/data/schede/tipi/foglia-tropicale.json";
import orchidee from "@/data/schede/tipi/orchidee.json";
import rampicanti from "@/data/schede/tipi/rampicanti-tropicali.json";
import succulente from "@/data/schede/tipi/succulente.json";
import mediterranee from "@/data/schede/tipi/aromatiche-mediterranee.json";
import orto from "@/data/schede/tipi/ortaggi-aromatiche.json";
import { TIPI, type IdTipo } from "@/content/tipi-di-pianta";
import type { NotaFamiglia, SchedaCura } from "./tipi";

// Schede per tipo già scritte e verificate. Le altre si aggiungono qui, gruppo dopo gruppo.
const SCHEDE_TIPO: Partial<Record<IdTipo, SchedaCura>> = {
  orchidee: orchidee as SchedaCura,
  "foglia-tropicale": foglia as SchedaCura,
  "rampicanti-tropicali": rampicanti as SchedaCura,
  succulente: succulente as SchedaCura,
  "aromatiche-mediterranee": mediterranee as SchedaCura,
  "ortaggi-aromatiche": orto as SchedaCura,
};
const NOTE = new Map((famiglieDati as NotaFamiglia[]).map((n) => [n.famiglia, n]));
const INDICE = indice as unknown as { specie: Record<string, string>; generi: Record<string, [string, string]> };

export type BaseTipo = "manuale" | "famiglia" | "wcvp" | "famiglia-maggioranza" | "nessun-dato" | "genere-sconosciuto";

export interface SceltaScheda {
  livello: "tipo";
  tipo: IdTipo;
  nomeTipo: string;
  base: BaseTipo; // come abbiamo deciso il tipo (lo si dice all'utente)
  scheda: SchedaCura | null; // null = scheda di questo tipo ancora in preparazione
  notaFamiglia: NotaFamiglia | null;
}

export function scegliScheda(specie: string, genere: string, famiglia?: string): SceltaScheda {
  let tipo: IdTipo = "universale";
  let base: BaseTipo = "genere-sconosciuto";
  const perSpecie = INDICE.specie[specie];
  const perGenere = INDICE.generi[genere];
  if (perSpecie && perSpecie in TIPI) {
    tipo = perSpecie as IdTipo;
    base = "manuale";
  } else if (perGenere && perGenere[0] in TIPI) {
    tipo = perGenere[0] as IdTipo;
    base = perGenere[1] as BaseTipo;
  }
  return {
    livello: "tipo",
    tipo,
    nomeTipo: TIPI[tipo].nome,
    base,
    scheda: SCHEDE_TIPO[tipo] ?? null,
    notaFamiglia: (famiglia && NOTE.get(famiglia)) || null,
  };
}
