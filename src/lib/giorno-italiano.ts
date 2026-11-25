// Il giorno secondo l'ora ITALIANA (Europe/Rome, ora legale compresa): serve alla quota per telefono (D5),
// che riparte a mezzanotte italiana. Senza dipendenze: si usa sul telefono, sul server e nelle prove.

const FUSO = "Europe/Rome";

/** La data in Italia, per esempio "2026-11-25". */
export function giornoItaliano(quando: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(quando);
}

/** La prossima mezzanotte in Italia. */
export function prossimaMezzanotteItaliana(quando: Date = new Date()): Date {
  const oggi = giornoItaliano(quando);
  const [anno, mese, giorno] = oggi.split("-").map(Number);
  const domaniUtc = Date.UTC(anno, mese - 1, giorno + 1);
  // In Italia l'ora è UTC+2 (legale) o UTC+1 (solare): è giusta quella in cui un attimo prima è ancora oggi
  for (const ore of [2, 1]) {
    const t = domaniUtc - ore * 3_600_000;
    if (giornoItaliano(new Date(t)) !== oggi && giornoItaliano(new Date(t - 1)) === oggi) return new Date(t);
  }
  return new Date(domaniUtc);
}
