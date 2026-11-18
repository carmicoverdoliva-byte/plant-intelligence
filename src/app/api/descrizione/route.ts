// "Cos'è": riassunto di Wikipedia per il nome scientifico riconosciuto. Chiamata dal telefono DOPO il risultato,
// così il riconoscimento non rallenta. Nessuna chiave; risposta conservata un giorno dalla rete di Vercel (CDN),
// così Wikipedia riceve poche richieste.
import { descrizione } from "@/lib/riconoscimento/wikipedia";

// Solo lettere (anche accentate), spazi, trattini, punti e "×" degli ibridi: niente altro arriva a Wikipedia
const NOME_VALIDO = /^[\p{L} .×-]{2,100}$/u;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const specie = url.searchParams.get("specie")?.trim() ?? "";
  const genere = url.searchParams.get("genere")?.trim() || undefined;
  if (!NOME_VALIDO.test(specie) || (genere && !NOME_VALIDO.test(genere))) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const { descrizione: d, definitiva } = await descrizione(specie, genere);
  // Risposta certa: conservata un giorno (o un'ora se non c'è la voce). Wikipedia lenta: non si conserva nulla
  const cache = !definitiva ? "no-store" : d ? "public, s-maxage=86400, stale-while-revalidate=604800" : "public, s-maxage=3600";
  return Response.json(d ? { ok: true, descrizione: d } : { ok: false }, { status: 200, headers: { "Cache-Control": cache } });
}
