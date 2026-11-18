// Versione dell'app pubblicata in questo momento. Il telefono la confronta con la sua (AvvisoAggiornamento).
// Mai conservata da reti o browser: deve essere sempre quella attuale.
export async function GET() {
  return Response.json(
    { versione: process.env.NEXT_PUBLIC_VERSIONE_APP },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
