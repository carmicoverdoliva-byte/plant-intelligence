// Nomi accettati secondo GBIF (regola D9: "la stessa pianta ha sempre lo stesso nome"). SOLO SERVER.
// Pl@ntNet dà per ogni specie il suo codice GBIF; GBIF dice se quel nome è un sinonimo e qual è il nome accettato.
// Servizio pubblico e gratuito, senza chiave, dati CC BY 4.0 (docs/api-documentation/sinonimi-botanici.md).
// Se GBIF non risponde in tempo si usano i nomi di Pl@ntNet: il riconoscimento non si blocca mai per questo.
import type { NomeAccettato } from "./classifica";

export interface TaxonomyProvider {
  nomiAccettati(idGbif: string[]): Promise<Record<string, NomeAccettato>>;
}

interface SpecieGbif {
  key?: number;
  acceptedKey?: number;
  taxonomicStatus?: string;
  canonicalName?: string;
  accepted?: string;
}

// Memoria del processo sul server: i nomi cambiano di rado, così non si richiede due volte la stessa specie
const memoria = new Map<string, NomeAccettato | null>();

export class GbifTaxonomy implements TaxonomyProvider {
  constructor(
    private readonly base = process.env.GBIF_API_URL || "https://api.gbif.org",
    private readonly tempoMassimoMs = 2500,
  ) {}

  async nomiAccettati(idGbif: string[]): Promise<Record<string, NomeAccettato>> {
    const risultato: Record<string, NomeAccettato> = {};
    await Promise.all(
      [...new Set(idGbif)].map(async (id) => {
        if (!/^\d+$/.test(id)) return;
        if (!memoria.has(id)) memoria.set(id, await this.chiedi(id));
        const nome = memoria.get(id);
        if (nome) risultato[id] = nome;
      }),
    );
    return risultato;
  }

  private async chiedi(id: string): Promise<NomeAccettato | null> {
    try {
      const r = await fetch(`${this.base}/v1/species/${id}`, {
        signal: AbortSignal.timeout(this.tempoMassimoMs),
        headers: { "User-Agent": "Mandragola/0.1 (https://mandragola-app.vercel.app)" },
      });
      if (!r.ok) return null;
      const s = (await r.json()) as SpecieGbif;
      const sinonimo = s.taxonomicStatus && s.taxonomicStatus !== "ACCEPTED" && s.acceptedKey;
      if (sinonimo) {
        // Il nome accettato: chiediamo la sua scheda per avere il nome senza autore
        const a = await fetch(`${this.base}/v1/species/${s.acceptedKey}`, { signal: AbortSignal.timeout(this.tempoMassimoMs) });
        if (!a.ok) return null;
        const acc = (await a.json()) as SpecieGbif;
        return acc.canonicalName ? { chiave: String(s.acceptedKey), nomeScientifico: acc.canonicalName } : null;
      }
      return s.canonicalName ? { chiave: id, nomeScientifico: s.canonicalName } : null;
    } catch {
      return null; // non risponde: si useranno i nomi di Pl@ntNet
    }
  }
}
