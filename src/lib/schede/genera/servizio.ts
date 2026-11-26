// Trovare, generare e salvare una scheda di specie. SOLO SERVER.
// È lo STESSO codice per l'app (/api/scheda-generata) e per la preparazione anticipata (scripts/prepara-schede.mjs).
import { createHash } from "node:crypto";
import type { RispostaSchedaGenerata } from "@/app/api/scheda-generata/route";
import { scegliScheda } from "../scegli";
import type { GeneratedCardStore } from "./archivio";
import { tossicitaNostra } from "./fonti";
import { generaScheda, type Tentativo } from "./genera";
import { chiaveScheda } from "./versione-regole";

/** Impronta delle fonti A di questa pianta (scheda del tipo e nota di famiglia): se una cambia, cambia.
 *  Senza la tossicità della scheda del tipo (2026-11-26): non la scrive il modello e si ricalcola a ogni lettura
 *  (trovaOGenera), quindi cambiarla non obbliga a rigenerare le schede. */
export function improntaFontiA(specie: string, genere: string, famiglia?: string): string {
  const { tipo, nomeTipo, scheda, notaFamiglia } = scegliScheda(specie, genere, famiglia);
  const senzaTossicita = scheda && { ...scheda, tossicita: undefined };
  return createHash("sha256").update(JSON.stringify({ tipo, nomeTipo, scheda: senzaTossicita, notaFamiglia })).digest("hex").slice(0, 12);
}

/** Chiave in Upstash: versione delle regole, nomi, impronta delle fonti A di oggi. */
export function chiavePianta(specie: string, genere: string, famiglia?: string): string {
  return chiaveScheda(specie, genere, famiglia, improntaFontiA(specie, genere, famiglia));
}

export type EsitoGenerazione =
  | { tipo: "generata"; risposta: RispostaSchedaGenerata; tentativi: Tentativo[] }
  | { tipo: "ripiego"; motivo: string; tentativi: Tentativo[] };

/** Genera la scheda (modelli e regole dell'app) e la prepara per il telefono e per l'archivio. */
export async function generaRisposta(specie: string, genere: string, famiglia?: string): Promise<EsitoGenerazione> {
  const r = await generaScheda(specie, genere, famiglia);
  if (r.tipo !== "generata") return { tipo: "ripiego", motivo: r.motivo, tentativi: r.tentativi };
  return {
    tipo: "generata",
    tentativi: r.tentativi,
    risposta: {
      ok: true,
      tipo: "generata",
      verificata: r.esito.verificata,
      scheda: r.esito.scheda,
      // Al telefono solo titolo, livello e link delle fonti (non i loro testi)
      fonti: Object.fromEntries(Object.entries(r.fonti).map(([id, f]) => [id, { livello: f.livello, titolo: f.titolo, url: f.url }])),
      modello: r.modello,
      generataIl: new Date().toISOString(),
    },
  };
}

/** La scheda salvata, oppure una appena generata (e salvata); null = ripiego, l'app resta sulla scheda del tipo. */
export async function trovaOGenera(
  archivio: GeneratedCardStore,
  chiave: string,
  specie: string,
  genere: string,
  famiglia?: string,
): Promise<{ risposta: RispostaSchedaGenerata; appenaGenerata: boolean } | null> {
  const { scheda } = await archivio.cerca(chiave);
  // La tossicità si copia dalle nostre fonti di OGGI anche per le schede salvate (regola 4b: non è del modello)
  if (scheda) return { risposta: scheda.verificata ? { ...scheda, scheda: { ...scheda.scheda, tossicita: tossicitaNostra(specie, genere, famiglia) } } : scheda, appenaGenerata: false };
  const r = await generaRisposta(specie, genere, famiglia);
  if (r.tipo === "ripiego") {
    // Nessun dettaglio tecnico al telefono; il motivo resta nel registro del server.
    console.info(`[scheda-generata] ripiego per ${specie}: ${r.motivo} · ${r.tentativi.map((t) => `${t.modello} ${t.esito}`).join(" · ")}`);
    return null;
  }
  await archivio.salva(chiave, r.risposta);
  return { risposta: r.risposta, appenaGenerata: true };
}
