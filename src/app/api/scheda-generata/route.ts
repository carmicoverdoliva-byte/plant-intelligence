// Scheda di SPECIE generata con l'AI gratuita (R2, D13). Chiamata dal telefono DOPO il risultato del riconoscimento:
// il riconoscimento resta veloce, la scheda arriva qualche secondo dopo e sostituisce quella del tipo.
// È SPENTA in produzione: si accende con R2_SPERIMENTALE=1 (in locale) o nelle anteprime di Vercel (VERCEL_ENV=preview);
// Se è spenta risponde 404 e l'app resta sulla scheda del tipo, senza messaggi d'errore.
// Le schede generate si ricordano in memoria finché il server resta acceso; l'archivio vero (Upstash) arriverà dopo.
import { connection } from "next/server";
import { generaScheda } from "@/lib/schede/genera/genera";
import type { SchedaGenerata } from "@/lib/schede/genera/regole";

export const maxDuration = 300;
const NOME_VALIDO = /^[\p{L} .×-]{2,100}$/u;

export interface RispostaSchedaGenerata {
  ok: true;
  tipo: "generata";
  verificata: boolean; // false = nessuna fonte A: "Scheda della specie · NON VERIFICATA"
  scheda: SchedaGenerata;
  fonti: Record<string, { livello: "A" | "C"; titolo: string; url?: string }>;
  modello: string;
}

const memoria = new Map<string, RispostaSchedaGenerata>();

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
  const chiave = `${specie}|${genere}|${famiglia ?? ""}`;
  const giaFatta = memoria.get(chiave);
  if (giaFatta) return Response.json(giaFatta, { headers: { "Cache-Control": "no-store" } });

  const r = await generaScheda(specie, genere, famiglia);
  if (r.tipo !== "generata") {
    // Ripiego: l'app resta sulla scheda del tipo. Nessun dettaglio tecnico al telefono.
    return Response.json({ ok: true, tipo: "ripiego" }, { headers: { "Cache-Control": "no-store" } });
  }
  const risposta: RispostaSchedaGenerata = {
    ok: true,
    tipo: "generata",
    verificata: r.esito.verificata,
    scheda: r.esito.scheda,
    // Al telefono solo titolo, livello e link delle fonti (non i loro testi)
    fonti: Object.fromEntries(Object.entries(r.fonti).map(([id, f]) => [id, { livello: f.livello, titolo: f.titolo, url: f.url }])),
    modello: r.modello,
  };
  memoria.set(chiave, risposta);
  return Response.json(risposta, { headers: { "Cache-Control": "no-store" } });
}
