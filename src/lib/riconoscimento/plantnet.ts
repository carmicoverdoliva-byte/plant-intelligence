// Adattatore Pl@ntNet (passo 2.1, CLAUDE.md §4): SOLO SERVER. La chiave PLANTNET_API_KEY si legge qui e non esce mai:
// non va nei log, nei messaggi d'errore né nelle risposte al telefono (CLAUDE.md §7).
import type { PnRisposta } from "./classifica";

export type Organo = "auto" | "leaf" | "flower" | "fruit" | "bark";
export const ORGANI: Organo[] = ["auto", "leaf", "flower", "fruit", "bark"];

export type EsitoPlantNet =
  | { tipo: "ok"; risposta: PnRisposta }
  | { tipo: "nessuna-pianta" } // 404 "Species not found": la foto non mostra una pianta riconoscibile
  | { tipo: "limite-giornaliero" } // 429: finite le 500 identificazioni gratuite del giorno
  | { tipo: "non-risponde" } // rete, tempo scaduto, errore 5xx
  | { tipo: "configurazione" } // chiave assente o rifiutata (401/403)
  | { tipo: "foto-non-valida" }; // 400/413/415: foto rifiutata

/** Interfaccia sostituibile: un giorno si può cambiare servizio senza toccare il resto dell'app. */
export interface PlantRecognitionProvider {
  identify(foto: { dati: Blob; organo: Organo }[]): Promise<EsitoPlantNet>;
}

export class PlantNetProvider implements PlantRecognitionProvider {
  constructor(
    private readonly opzioni = {
      // Indirizzo modificabile solo per le prove automatiche (servizio finto sul PC)
      base: process.env.PLANTNET_API_URL || "https://my-api.plantnet.org",
      flora: "k-world-flora", // decisione D9
      tempoMassimoMs: Number(process.env.PLANTNET_TIMEOUT_MS) || 20000,
    },
  ) {}

  async identify(foto: { dati: Blob; organo: Organo }[]): Promise<EsitoPlantNet> {
    const chiave = process.env.PLANTNET_API_KEY;
    if (!chiave) return { tipo: "configurazione" };

    const modulo = new FormData();
    foto.forEach((f, i) => {
      modulo.append("images", f.dati, `foto-${i + 1}.jpg`);
      modulo.append("organs", f.organo);
    });
    const parametri = new URLSearchParams({
      "api-key": chiave,
      lang: "it",
      "nb-results": "5",
      "include-related-images": "true",
    });
    const indirizzo = `${this.opzioni.base}/v2/identify/${this.opzioni.flora}?${parametri}`;

    let risposta: Response;
    try {
      risposta = await fetch(indirizzo, {
        method: "POST",
        body: modulo,
        signal: AbortSignal.timeout(this.opzioni.tempoMassimoMs),
        cache: "no-store",
      });
    } catch {
      return { tipo: "non-risponde" }; // nessun dettaglio: l'errore conterrebbe l'indirizzo con la chiave
    }
    if (risposta.status === 404) return { tipo: "nessuna-pianta" };
    if (risposta.status === 429) return { tipo: "limite-giornaliero" };
    if (risposta.status === 401 || risposta.status === 403) return { tipo: "configurazione" };
    if ([400, 413, 414, 415].includes(risposta.status)) return { tipo: "foto-non-valida" };
    if (!risposta.ok) return { tipo: "non-risponde" };
    try {
      return { tipo: "ok", risposta: (await risposta.json()) as PnRisposta };
    } catch {
      return { tipo: "non-risponde" };
    }
  }
}
