// Trasforma la risposta di Pl@ntNet in un risultato ONESTO (specifiche F04, CLAUDE.md §8, decisione D9).
// - Al telefono non arrivano i punteggi: solo il livello di affidabilità detto a parole.
// - I nomi della stessa pianta (sinonimi) si uniscono, così la stessa pianta ha sempre lo stesso nome.
// Questo file non importa nulla (solo tipi): così lo può usare anche la prova automatica con Node.js.

/** Soglie del test D9 (2026-11-17). Si cambiano solo qui. s1 = punteggio della 1ª specie, s2 = della 2ª. */
export const SOGLIE = {
  nonRiconosciuta: { sottoDi: 0.1, rapportoMinimo: 5 }, // s1 < 10% e s1 < 5 × s2
  incerto: { sottoDi: 0.3 }, // s1 < 30%
  moltoProbabile: { almeno: 0.8, distacco: 0.75 }, // s1 ≥ 80% e s1 − s2 ≥ 75 punti
  gemelleMassime: 3, // specie simili mostrate (l'utente ha chiesto 2-3)
} as const;

export type Livello = "molto-probabile" | "probabile" | "incerto" | "non-riconosciuta";

export interface FotoEsempio {
  url: string; // foto di esempio della specie, dal database di Pl@ntNet
  autore?: string;
  licenza?: string;
}

export interface Candidato {
  nomeScientifico: string; // senza autore, es. "Epipremnum aureum"
  genere: string;
  famiglia: string;
  nomeComune?: string; // il primo nome comune in italiano, se Pl@ntNet lo conosce
  altriNomiComuni: string[];
  gbifId?: string;
  foto?: FotoEsempio;
  approfondisci: string; // link per saperne di più (Wikipedia in italiano, ricerca per nome scientifico)
}

export interface Risultato {
  livello: Livello;
  principale?: Candidato; // assente se "non-riconosciuta"
  gemelle: Candidato[]; // specie simili, al massimo SOGLIE.gemelleMassime
  versioneModello?: string;
}

/** Nome accettato secondo GBIF, per unire i sinonimi (es. Aloe officinalis → Aloe vera). */
export interface NomeAccettato {
  chiave: string; // codice GBIF del nome accettato
  nomeScientifico: string; // senza autore
}

// --- Forma (minima) della risposta di Pl@ntNet che ci serve. Tutti i campi sono letti con prudenza. ---
interface PnNome {
  scientificNameWithoutAuthor?: string;
}
interface PnImmagine {
  author?: string;
  license?: string;
  url?: { o?: string; m?: string; s?: string };
}
export interface PnRisultato {
  score?: number;
  species?: PnNome & { genus?: PnNome; family?: PnNome; commonNames?: string[] };
  gbif?: { id?: string | number } | null;
  images?: PnImmagine[];
}
export interface PnRisposta {
  results?: PnRisultato[];
  version?: string;
  remainingIdentificationRequests?: number;
}

const linkApprofondisci = (nome: string) =>
  `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(nome)}&go=Vai`;

interface Gruppo {
  punteggio: number;
  candidato: Candidato;
}

/**
 * @param risposta risposta di Pl@ntNet (oppure null se ha risposto "nessuna pianta", errore 404)
 * @param nomiAccettati codice GBIF di Pl@ntNet → nome accettato (facoltativo: senza, si usano i nomi di Pl@ntNet)
 */
export function classifica(risposta: PnRisposta | null, nomiAccettati: Record<string, NomeAccettato> = {}): Risultato {
  const nonRiconosciuta: Risultato = { livello: "non-riconosciuta", gemelle: [], versioneModello: risposta?.version };
  if (!risposta || !Array.isArray(risposta.results) || risposta.results.length === 0) return nonRiconosciuta;

  // 1. Unisce i sinonimi: stessa chiave (nome accettato GBIF, altrimenti nome scientifico) = stessa pianta
  const gruppi = new Map<string, Gruppo>();
  for (const r of risposta.results) {
    const nomePn = r.species?.scientificNameWithoutAuthor?.trim();
    if (!nomePn) continue;
    const idGbif = r.gbif?.id != null ? String(r.gbif.id) : undefined;
    const accettato = idGbif ? nomiAccettati[idGbif] : undefined;
    const chiave = accettato?.chiave ?? nomePn.toLowerCase();
    const punteggio = typeof r.score === "number" && r.score > 0 ? r.score : 0;
    const nomiComuni = (r.species?.commonNames ?? []).filter((n) => typeof n === "string" && n.trim()).map((n) => n.trim());
    const img = r.images?.find((i) => i.url?.m || i.url?.s || i.url?.o);

    const esistente = gruppi.get(chiave);
    if (esistente) {
      esistente.punteggio += punteggio;
      for (const n of nomiComuni) if (!esistente.candidato.altriNomiComuni.includes(n) && n !== esistente.candidato.nomeComune) esistente.candidato.altriNomiComuni.push(n);
      if (!esistente.candidato.nomeComune && nomiComuni[0]) esistente.candidato.nomeComune = nomiComuni[0];
      if (!esistente.candidato.foto && img) esistente.candidato.foto = fotoDa(img);
      continue;
    }
    const nomeScientifico = accettato?.nomeScientifico ?? nomePn;
    gruppi.set(chiave, {
      punteggio,
      candidato: {
        nomeScientifico,
        genere: r.species?.genus?.scientificNameWithoutAuthor?.trim() || nomeScientifico.split(" ")[0],
        famiglia: r.species?.family?.scientificNameWithoutAuthor?.trim() || "",
        nomeComune: nomiComuni[0],
        altriNomiComuni: nomiComuni.slice(1),
        gbifId: accettato?.chiave ?? idGbif,
        foto: img ? fotoDa(img) : undefined,
        approfondisci: linkApprofondisci(nomeScientifico),
      },
    });
  }
  const ordinati = [...gruppi.values()].sort((a, b) => b.punteggio - a.punteggio);
  if (ordinati.length === 0) return nonRiconosciuta;

  // 2. Livello secondo le soglie D9
  const s1 = ordinati[0].punteggio;
  const s2 = ordinati[1]?.punteggio ?? 0;
  let livello: Livello;
  if (s1 < SOGLIE.nonRiconosciuta.sottoDi && s1 < SOGLIE.nonRiconosciuta.rapportoMinimo * s2) livello = "non-riconosciuta";
  else if (s1 < SOGLIE.incerto.sottoDi) livello = "incerto";
  else if (s1 >= SOGLIE.moltoProbabile.almeno && s1 - s2 >= SOGLIE.moltoProbabile.distacco) livello = "molto-probabile";
  else livello = "probabile";

  if (livello === "non-riconosciuta") return nonRiconosciuta;
  return {
    livello,
    principale: ordinati[0].candidato,
    gemelle: ordinati.slice(1, 1 + SOGLIE.gemelleMassime).map((g) => g.candidato),
    versioneModello: risposta.version,
  };
}

function fotoDa(img: PnImmagine): FotoEsempio {
  return {
    url: (img.url?.m || img.url?.s || img.url?.o) as string,
    autore: img.author?.trim() || undefined,
    licenza: img.license?.trim() || undefined,
  };
}
