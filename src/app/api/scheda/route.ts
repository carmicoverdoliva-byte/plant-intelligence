// Scheda di cura per la pianta riconosciuta (rilascio R1): la scheda del suo tipo di pianta più la nota della famiglia.
// Nessun servizio esterno: le schede sono file nostri. Risposta conservata un'ora dalla rete di Vercel.
import { scegliScheda } from "@/lib/schede/scegli";

const NOME_VALIDO = /^[\p{L} .×-]{2,100}$/u;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const specie = url.searchParams.get("specie")?.trim() ?? "";
  const genere = url.searchParams.get("genere")?.trim() ?? "";
  const famiglia = url.searchParams.get("famiglia")?.trim() || undefined;
  if (!NOME_VALIDO.test(specie) || !NOME_VALIDO.test(genere) || (famiglia && !NOME_VALIDO.test(famiglia))) {
    return Response.json({ ok: false }, { status: 400 });
  }
  return Response.json(
    { ok: true, ...scegliScheda(specie, genere, famiglia) },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
