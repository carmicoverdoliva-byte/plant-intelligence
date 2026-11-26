// Scheda di SPECIE generata con l'AI gratuita (R2, D13). Chiamata dal telefono DOPO il risultato del riconoscimento:
// il riconoscimento resta veloce, la scheda arriva qualche secondo dopo e sostituisce quella del tipo.
// Accesa su Vercel (anteprime e, dal 2026-11-26, produzione); in locale solo con R2_SPERIMENTALE=1, così le prove non
// consumano neuron. Interruttore di emergenza: R2_SPENTA=1 nelle variabili di Vercel (poi "Redeploy") la spegne.
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
  // Accesa su Vercel (anteprime e produzione, decisione dell'utente del 2026-11-26) e in locale con R2_SPERIMENTALE=1;
  // R2_SPENTA=1 la spegne ovunque (emergenza, senza toccare il codice)
  const suVercel = process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production";
  const accesa = process.env.R2_SPENTA !== "1" && (process.env.R2_SPERIMENTALE === "1" || suVercel);
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
