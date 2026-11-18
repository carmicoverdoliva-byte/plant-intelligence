// Stato del tutorial iniziale e dell'installazione, ricordati solo sul telefono (D3).
export const CHIAVE_ONBOARDING = "mandragola:onboarding"; // "visto" quando completato o saltato
export const CHIAVE_INVITO_INSTALLAZIONE = "mandragola:invito-installazione"; // "chiuso" se l'utente l'ha chiuso

/** Vero se l'app è aperta dall'icona sulla schermata Home (installata), falso se è in Safari. */
export function installata(): boolean {
  const iOS = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iOS || window.matchMedia("(display-mode: standalone)").matches;
}
