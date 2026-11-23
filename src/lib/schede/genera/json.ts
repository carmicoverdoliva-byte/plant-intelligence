// Lettura del JSON scritto dal modello. SOLO SERVER (ma senza dipendenze: si prova anche fuori da Next.js).
// Alcuni modelli (gpt-oss-20b, diagnosi del 2026-11-23) chiudono il JSON con una graffa in meno alla fine:
// la scheda è completa ma il testo non è JSON valido. Qui si aggiungono SOLO le chiusure mancanti in fondo;
// se il testo è rotto in altri punti si rinuncia (null) e le regole lo trattano come "formato non valido".

/** Aggiunge in fondo le } e ] mancanti, contando le parentesi fuori dalle stringhe. */
export function chiudiJson(testo: string): string {
  const pila: string[] = [];
  let inStringa = false;
  let escape = false;
  for (const c of testo) {
    if (inStringa) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inStringa = false;
      continue;
    }
    if (c === '"') inStringa = true;
    else if (c === "{") pila.push("}");
    else if (c === "[") pila.push("]");
    else if (c === "}" || c === "]") {
      if (pila.pop() !== c) return testo; // parentesi sbagliate in mezzo: non si ripara
    }
  }
  if (inStringa) return testo; // stringa troncata: non si ripara
  return testo + pila.reverse().join("");
}

/** Il primo oggetto JSON nel testo del modello, con le chiusure mancanti aggiunte; null se non si legge. */
export function leggiJson(testo: string): unknown {
  const inizio = testo.indexOf("{");
  if (inizio < 0) return null;
  const pezzo = testo.slice(inizio, testo.lastIndexOf("}") + 1);
  for (const candidato of [pezzo, chiudiJson(pezzo)]) {
    try {
      return JSON.parse(candidato);
    } catch {
      /* si prova il candidato successivo */
    }
  }
  return null;
}
