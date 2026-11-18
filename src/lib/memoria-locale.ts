// Piccoli ricordi dell'app sul telefono (localStorage): per esempio quali spiegazioni sono già state lette.
// Restano solo sul telefono (D3). Se il browser blocca la memoria (es. navigazione privata) l'app funziona lo stesso:
// semplicemente non ricorda.
const EVENTO = "mandragola:memoria";

export function leggi(chiave: string): string | null {
  try {
    return window.localStorage.getItem(chiave);
  } catch {
    return null;
  }
}

export function scrivi(chiave: string, valore: string | null) {
  try {
    if (valore === null) window.localStorage.removeItem(chiave);
    else window.localStorage.setItem(chiave, valore);
  } catch {
    /* memoria non disponibile: l'app continua senza ricordare */
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Per useSyncExternalStore: avvisa quando un valore cambia (in questa scheda o in un'altra). */
export function ascolta(avvisa: () => void) {
  window.addEventListener(EVENTO, avvisa);
  window.addEventListener("storage", avvisa);
  return () => {
    window.removeEventListener(EVENTO, avvisa);
    window.removeEventListener("storage", avvisa);
  };
}
