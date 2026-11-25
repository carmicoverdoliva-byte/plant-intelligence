// Codice anonimo di questo telefono per la quota (architettura §4): un codice casuale creato dall'app, senza dati personali.
// Se il browser non permette di ricordarlo (es. navigazione privata) non si manda: valgono i limiti di riserva.
import { leggi, scrivi } from "@/lib/memoria-locale";

const CHIAVE = "mandragola:codice-telefono";

export function codiceTelefono(): string | null {
  const gia = leggi(CHIAVE);
  if (gia) return gia;
  scrivi(CHIAVE, crypto.randomUUID());
  return leggi(CHIAVE);
}
