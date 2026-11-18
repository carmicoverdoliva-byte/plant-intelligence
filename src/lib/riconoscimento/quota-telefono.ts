// Quota per dispositivo contata SUL TELEFONO (decisione D5: 10 al giorno), in attesa di Upstash.
// È un limite semplice: chi cancella i dati del browser lo azzera. Il server ha i suoi tetti prudenti.
// Il giorno segue Pl@ntNet: si azzera a mezzanotte UTC (01:00 in Italia d'inverno, 02:00 d'estate).
import { leggi, scrivi } from "@/lib/memoria-locale";

const CHIAVE_QUOTA = "mandragola:quota-predefinita";
const chiaveGiorno = () => `mandragola:riconoscimenti:${new Date().toISOString().slice(0, 10)}`;

export function quotaGiornaliera(): number {
  return Number(leggi(CHIAVE_QUOTA)) || 10;
}

/** Il server comunica il valore vero (configurabile): lo ricordiamo. */
export function salvaQuota(valore: number) {
  if (Number.isFinite(valore) && valore > 0) scrivi(CHIAVE_QUOTA, String(valore));
}

export function usatiOggi(): number {
  return Number(leggi(chiaveGiorno())) || 0;
}

export function rimastiOggi(): number {
  return Math.max(0, quotaGiornaliera() - usatiOggi());
}

export function registraUso() {
  scrivi(chiaveGiorno(), String(usatiOggi() + 1));
}

/** Ora locale (es. "01:00") in cui si azzerano quota e limite di Pl@ntNet. */
export function oraRipartenza(): string {
  const domani = new Date();
  domani.setUTCHours(24, 0, 0, 0);
  return domani.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
