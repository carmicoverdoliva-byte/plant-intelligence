// Ricorda se sulla pagina Fotocamera c'è un RISULTATO aperto, così il tasto verde della barra in basso sa se deve
// chiedere "Vuoi riconoscere un'altra pianta?" oppure portare subito alla fotocamera.
// Solo nel telefono, in memoria: non si salva niente.

let aperto = false;
const EVENTO_NUOVA_FOTO = "mandragola:nuova-foto";

export function segnaRisultatoAperto(valore: boolean) {
  aperto = valore;
}

export function risultatoAperto(): boolean {
  return aperto;
}

/** Chiede alla pagina Fotocamera di chiudere il risultato e tornare pulita, pronta per una nuova foto. */
export function chiediNuovaFoto() {
  window.dispatchEvent(new Event(EVENTO_NUOVA_FOTO));
}

/** La pagina Fotocamera ascolta la richiesta; restituisce la funzione per smettere di ascoltare. */
export function ascoltaNuovaFoto(azione: () => void): () => void {
  window.addEventListener(EVENTO_NUOVA_FOTO, azione);
  return () => window.removeEventListener(EVENTO_NUOVA_FOTO, azione);
}
