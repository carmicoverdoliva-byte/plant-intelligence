// Quota per dispositivo (decisione D5: 10 al giorno) ricordata SUL TELEFONO: per mostrarla e non fare richieste inutili.
// Il conteggio vero è sul server (Upstash, quota-server.ts), che a ogni riconoscimento dice quanti ne restano; se Upstash
// non risponde vale questo conteggio, come prima. Il giorno cambia a mezzanotte ora italiana.
import { giornoItaliano, prossimaMezzanotteItaliana } from "@/lib/giorno-italiano";
import { leggi, scrivi } from "@/lib/memoria-locale";

const CHIAVE_QUOTA = "mandragola:quota-predefinita";
const chiaveGiorno = () => `mandragola:riconoscimenti:${giornoItaliano()}`;

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

/** Il server ha detto quanti ne restano: vale il conteggio più alto (senza Upstash il telefono ne ha contati alcuni da solo). */
export function allineaRimasti(rimasti: number) {
  scrivi(chiaveGiorno(), String(Math.max(usatiOggi(), quotaGiornaliera() - rimasti)));
}

const ora = (d: Date) => d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

/** Ora locale in cui riparte la quota di questo telefono: mezzanotte italiana. */
export function oraRipartenzaTelefono(): string {
  return ora(prossimaMezzanotteItaliana());
}

/** Ora locale (es. "01:00") in cui si azzera il limite di Pl@ntNet: mezzanotte UTC. */
export function oraRipartenza(): string {
  const domani = new Date();
  domani.setUTCHours(24, 0, 0, 0);
  return ora(domani);
}
