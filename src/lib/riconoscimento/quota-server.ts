// Quota per telefono contata sul SERVER con Upstash (decisioni D4 e D5: 10 al giorno). SOLO SERVER.
// Nessun dato personale: il telefono manda un codice casuale (telefono.ts) e qui se ne conserva solo un'IMPRONTA,
// da cui non si risale al codice. Il contatore si cancella da solo a mezzanotte ora italiana.
// Comandi: 1 per riconoscimento (INCR), 1 in più al primo della giornata (EXPIREAT), 1 se va restituito (DECR).
import { createHash } from "node:crypto";
import { giornoItaliano, prossimaMezzanotteItaliana } from "@/lib/giorno-italiano";
import { comandoUpstash } from "@/lib/upstash";

const CODICE_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Un riconoscimento prenotato; se Pl@ntNet non lo fa, si restituisce. */
export interface Prenotazione {
  rimasti: number;
  restituisci(): Promise<void>;
}

export interface QuotaStore {
  /** null = contatore non disponibile (valgono i limiti del telefono e della rete); "finita" = quota di oggi esaurita. */
  prenota(codiceTelefono: string, quota: number): Promise<Prenotazione | "finita" | null>;
}

export class UpstashQuotaStore implements QuotaStore {
  async prenota(codiceTelefono: string, quota: number): Promise<Prenotazione | "finita" | null> {
    if (!CODICE_VALIDO.test(codiceTelefono)) return null;
    const ora = new Date();
    const scade = prossimaMezzanotteItaliana(ora);
    const impronta = createHash("sha256").update(codiceTelefono).digest("hex").slice(0, 32);
    const chiave = `quota:${giornoItaliano(ora)}:${impronta}`;
    // Prima si conta e poi si controlla: due richieste nello stesso momento non si sovrappongono
    const r = await comandoUpstash(["INCR", chiave]);
    if (!r.ok || typeof r.valore !== "number") return null;
    if (r.valore === 1) await comandoUpstash(["EXPIREAT", chiave, Math.floor(scade.getTime() / 1000)]);
    if (r.valore > quota) return "finita";
    return {
      rimasti: quota - r.valore,
      restituisci: async () => {
        // Dopo mezzanotte il contatore non esiste più: non va ricreato
        if (Date.now() < scade.getTime()) await comandoUpstash(["DECR", chiave]);
      },
    };
  }
}
