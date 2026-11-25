// Riconoscimento da foto (passi 2.1-2.4): il telefono manda da 1 a 5 foto già ridotte, il server le passa a Pl@ntNet
// con la chiave segreta e restituisce un risultato onesto, senza punteggi. Mai un errore tecnico al telefono:
// solo codici che l'app traduce in messaggi chiari in italiano.
import { classifica } from "@/lib/riconoscimento/classifica";
import { GbifTaxonomy } from "@/lib/riconoscimento/gbif";
import { CONFIG, puoChiedere, registra, segnaEsaurito } from "@/lib/riconoscimento/limiti-server";
import { ORGANI, PlantNetProvider, type Organo } from "@/lib/riconoscimento/plantnet";
import { UpstashQuotaStore } from "@/lib/riconoscimento/quota-server";

export const maxDuration = 30; // secondi (Pl@ntNet risponde di solito in pochi secondi)

const MAX_FOTO = 5;
const MAX_BYTE_FOTO = 1_500_000; // il telefono le riduce a ~200-600 KB
const MAX_BYTE_TOTALI = 4_400_000; // Vercel accetta al massimo 4,5 MB per richiesta

const quota = new UpstashQuotaStore();

export type CodiceErrore =
  | "quota-telefono" // finiti i riconoscimenti di oggi per questo telefono (D5)
  | "limite-giornaliero" // finite le identificazioni gratuite di oggi (Pl@ntNet)
  | "limite-server" // tetto prudente del server raggiunto
  | "non-risponde" // Pl@ntNet non risponde
  | "foto-non-valida"
  | "configurazione"; // problema nostro (es. chiave mancante): messaggio generico

const errore = (codice: CodiceErrore, stato: number) =>
  Response.json(
    { ok: false, codice, quotaPerDispositivo: CONFIG.quotaPerDispositivo, ...(codice === "quota-telefono" ? { rimasti: 0 } : {}) },
    { status: stato },
  );

export async function POST(request: Request) {
  const indirizzo = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "sconosciuto";

  let modulo: FormData;
  try {
    modulo = await request.formData();
  } catch {
    return errore("foto-non-valida", 400);
  }
  const files = modulo.getAll("foto").filter((f): f is File => f instanceof File);
  const organi = modulo.getAll("organo").map(String);
  const totale = files.reduce((s, f) => s + f.size, 0);
  if (
    files.length < 1 ||
    files.length > MAX_FOTO ||
    totale > MAX_BYTE_TOTALI ||
    files.some((f) => f.size === 0 || f.size > MAX_BYTE_FOTO || !f.type.startsWith("image/"))
  ) {
    return errore("foto-non-valida", 400);
  }

  const permesso = puoChiedere(indirizzo);
  if (permesso === "riserva") return errore("limite-giornaliero", 429);
  if (permesso === "tetto-indirizzo") return errore("limite-server", 429);

  // Quota del telefono (D4, D5): null = Upstash non disponibile o codice mancante, valgono i limiti di prima
  const prenotazione = await quota.prenota(String(modulo.get("telefono") ?? ""), CONFIG.quotaPerDispositivo);
  if (prenotazione === "finita") return errore("quota-telefono", 429);
  const rimasti = prenotazione ? { rimasti: prenotazione.rimasti } : {};

  const foto = files.map((dati, i) => ({
    dati,
    organo: (ORGANI as string[]).includes(organi[i]) ? (organi[i] as Organo) : "auto",
  }));
  const esito = await new PlantNetProvider().identify(foto);

  // Riconoscimento non fatto (Pl@ntNet fermo o esaurito, foto illeggibile, problema nostro): al telefono non si conta
  if (esito.tipo !== "ok" && esito.tipo !== "nessuna-pianta") await prenotazione?.restituisci();

  switch (esito.tipo) {
    case "nessuna-pianta":
      registra(indirizzo);
      return Response.json({ ok: true, risultato: classifica(null), quotaPerDispositivo: CONFIG.quotaPerDispositivo, ...rimasti });
    case "limite-giornaliero":
      segnaEsaurito();
      return errore("limite-giornaliero", 429);
    case "non-risponde":
      return errore("non-risponde", 503);
    case "foto-non-valida":
      return errore("foto-non-valida", 400);
    case "configurazione":
      return errore("configurazione", 500);
  }

  registra(indirizzo, esito.risposta.remainingIdentificationRequests);
  const idGbif = (esito.risposta.results ?? []).map((r) => (r.gbif?.id != null ? String(r.gbif.id) : "")).filter(Boolean);
  const nomi = await new GbifTaxonomy().nomiAccettati(idGbif);
  return Response.json({
    ok: true,
    risultato: classifica(esito.risposta, nomi),
    quotaPerDispositivo: CONFIG.quotaPerDispositivo,
    ...rimasti,
  });
}
