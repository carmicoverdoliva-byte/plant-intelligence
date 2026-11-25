// Scheda di SPECIE generata con l'AI gratuita (R2, D13). Chiamata dal telefono DOPO il risultato del riconoscimento:
// il riconoscimento resta veloce, la scheda arriva qualche secondo dopo e sostituisce quella del tipo.
// È SPENTA in produzione: si accende con R2_SPERIMENTALE=1 (in locale) o nelle anteprime di Vercel (VERCEL_ENV=preview);
// Se è spenta risponde 404 e l'app resta sulla scheda del tipo, senza messaggi d'errore.
// Prima si cerca la scheda già pronta: nella memoria del server, poi in Upstash (una per specie, valida per tutti).
// Solo se non c'è la si genera, e si salva se ha passato i controlli; i ripieghi non si salvano mai (servizio.ts).
import { connection } from "next/server";
import { UpstashCardStore } from "@/lib/schede/genera/archivio";
import type { SchedaGenerata } from "@/lib/schede/genera/regole";
import { chiavePianta, trovaOGenera } from "@/lib/schede/genera/servizio";

export const maxDuration = 300;
const NOME_VALIDO = /^[\p{L} .×-]{2,100}$/u;

export interface RispostaSchedaGenerata {
  ok: true;
  tipo: "generata";
  verificata: boolean; // false = nessuna fonte A: "Scheda della specie · NON VERIFICATA"
  scheda: SchedaGenerata;
  fonti: Record<string, { livello: "A" | "C"; titolo: string; url?: string }>;
  modello: string;
  generataIl?: string; // data e ora ISO (dal 2026-11-25; manca nelle piante salvate prima nel Vivaio)
  appenaGenerata?: boolean; // true solo nella risposta a chi l'ha appena fatta generare; non si salva in Upstash
}

const archivio = new UpstashCardStore();
const memoria = new Map<string, RispostaSchedaGenerata>();
const inPreparazione = new Map<string, ReturnType<typeof trovaOGenera>>();
const SENZA_CACHE = { headers: { "Cache-Control": "no-store" } };

export async function GET(request: Request) {
  await connection(); // si decide a ogni richiesta, non durante la compilazione
  // Accesa in locale con R2_SPERIMENTALE=1 e nelle ANTEPRIME di Vercel (rami diversi da main); spenta in produzione
  const accesa = process.env.R2_SPERIMENTALE === "1" || process.env.VERCEL_ENV === "preview";
  if (!accesa) return Response.json({ ok: false }, { status: 404 });
  const url = new URL(request.url);
  const specie = url.searchParams.get("specie")?.trim() ?? "";
  const genere = url.searchParams.get("genere")?.trim() ?? "";
  const famiglia = url.searchParams.get("famiglia")?.trim() || undefined;
  if (!NOME_VALIDO.test(specie) || !NOME_VALIDO.test(genere) || (famiglia && !NOME_VALIDO.test(famiglia))) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const chiave = chiavePianta(specie, genere, famiglia);
  const giaFatta = memoria.get(chiave);
  if (giaFatta) return Response.json(giaFatta, SENZA_CACHE);

  // Due richieste uguali nello stesso momento aspettano la STESSA generazione (non si pagano neuron due volte)
  let inCorso = inPreparazione.get(chiave);
  if (!inCorso) {
    inCorso = trovaOGenera(archivio, chiave, specie, genere, famiglia).finally(() => inPreparazione.delete(chiave));
    inPreparazione.set(chiave, inCorso);
  }
  const r = await inCorso;
  if (!r) return Response.json({ ok: true, tipo: "ripiego" }, SENZA_CACHE);
  memoria.set(chiave, r.risposta);
  return Response.json(r.appenaGenerata ? { ...r.risposta, appenaGenerata: true } : r.risposta, SENZA_CACHE);
}
