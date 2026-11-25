// Testo grezzo dei modelli per il REGISTRO DEL SERVER (decisione dell'utente del 2026-11-25). SOLO SERVER.
// Serve a capire perché una risposta è stata scartata per "formato non valido". Senza dipendenze: si prova da solo.

const MASSIMO_CARATTERI = 20_000;
const NOME_SEGRETO = /KEY|TOKEN|SECRET|PASSWORD|ACCOUNT_ID/i;

/** I valori segreti delle variabili d'ambiente (mai i nomi): servono solo a oscurarli, non si scrivono da nessuna parte. */
export function valoriSegreti(env: Record<string, string | undefined>): string[] {
  return Object.entries(env)
    .filter(([nome, v]) => NOME_SEGRETO.test(nome) && (v?.length ?? 0) >= 8)
    .map(([, v]) => v as string)
    .sort((a, b) => b.length - a.length); // prima i più lunghi: uno può contenerne un altro
}

/** Il testo su UNA riga (gli a capo diventano \n), con le chiavi oscurate; se è lunghissimo restano inizio e fine. */
export function testoPerRegistro(testo: string, segreti: string[]): string {
  let t = testo;
  for (const s of segreti) t = t.replaceAll(s, "[oscurato]");
  if (t.length > MASSIMO_CARATTERI) {
    const meta = MASSIMO_CARATTERI / 2;
    t = `${t.slice(0, meta)} […tagliati ${t.length - MASSIMO_CARATTERI} caratteri…] ${t.slice(-meta)}`;
  }
  return JSON.stringify(t);
}
