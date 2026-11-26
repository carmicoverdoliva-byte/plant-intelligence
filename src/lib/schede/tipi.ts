// Formato delle schede di cura (D13, docs/architecture/schede-su-larga-scala.md §4).
// Versione semplificata per R1: ogni sezione ha "Linee guida" (fonti A, o due B concordi) e
// "Consigli dal pollice verde" (fonti B e C, non ufficiali). Le fonti si citano con il loro numero (campo `id`).

export type Livello = "specie" | "genere" | "tipo";
export type LivelloFonte = "A" | "B" | "C";

export interface Fonte {
  id: number;
  titolo: string;
  sito: string;
  url: string;
  consultato: string; // AAAA-MM-GG
  livello: LivelloFonte;
  punto?: string; // dove si trova il dato nella fonte
}

export interface Valore {
  etichetta: string; // "Minima di notte"
  valore: string; // "16 °C"
  fonti: number[];
}

export interface Disaccordo {
  tema: string;
  posizioni: { dice: string; fonti: number[] }[];
  sceltaPrudente: string;
}

export interface Sezione {
  lineeGuida: {
    riassunto: string;
    coseDaFare: string[];
    valori?: Valore[];
    disaccordi?: Disaccordo[];
    fonti: number[];
  };
  pollice: { consiglio: string; fonti: number[] }[]; // "Consigli dal pollice verde" (non ufficiali)
}

export interface Problema {
  nome: string;
  tipo: "parassita" | "malattia" | "cura";
  frequenza: "frequente" | "occasionale" | "raro" | "non indicata"; // solo a parole, come la fonte (F20)
  segni: string[];
  prevenzione: string[];
  fonti: number[];
}

export interface FalsoMito {
  mito: string;
  verdetto: "falso" | "esagerato" | "vero in parte" | "fonti in disaccordo";
  cosaDiconoLeFonti: string;
  inPratica: string;
  fonti: number[]; // solo fonti A
}

// "tossica (una fonte)": una sola fonte A segnala un pericolo (decisione dell'utente del 2026-11-26: per dire che una pianta
// NON è tossica servono due fonti A concordi; per segnalare un pericolo ne basta una, detto chiaramente nella nota).
export type Tossicita = "tossica" | "tossica (una fonte)" | "non tossica" | "varia" | "non verificata";

export interface SchedaCura {
  id: string; // "tipo/orchidee"
  livello: Livello;
  nome: string; // "orchidee da appartamento"
  siApplicaA: string;
  eccezioni: string[];
  riassunto: string;
  coseDaFare: string[];
  sezioni: {
    luce: Sezione;
    acqua: Sezione;
    temperatura: Sezione;
    terriccio: Sezione;
    concime: Sezione;
    travaso: Sezione;
    coltivarla: Sezione; // "Coltivarla da zero"
    problemi: Sezione & { elenco: Problema[] };
  };
  falsiMiti: FalsoMito[];
  approfondimenti: { titolo: string; sito: string; url: string; nostraRiga: string }[]; // può essere vuoto (F22)
  tossicita: {
    persone: Tossicita;
    animali: Tossicita;
    nota: string;
    fonti: number[];
    // Casi verificati più precisi del tipo (per genere o specie), es. Phalaenopsis non tossica per cani e gatti.
    // "non tossica" solo con almeno due fonti A (controllato da npm run schede:controlla).
    casi?: { taxa: string[]; persone: Tossicita; animali: Tossicita; nota: string; fonti: number[] }[];
    // La nota divisa in frasi (decisione dell'utente del 2026-11-26): a una pianta riconosciuta senza "caso" si mostrano
    // solo le frasi del suo genere o della sua famiglia ("per"), più quelle senza "per" (valide per tutte).
    frasi?: { testo: string; per?: string[]; fonti: number[] }[];
  };
  fonti: Fonte[];
  verifica: {
    controlliAutomatici?: string; // data dell'ultimo `npm run schede:controlla` superato
    verificaIndipendente?: string; // data della verifica del secondo agente
    tabellaTossicita?: string; // data dell'approvazione dell'utente (5 minuti per blocco)
  };
  versione: number;
  aggiornata: string;
}

export interface NotaFamiglia {
  famiglia: string; // "Araceae"
  nomeComune: string; // "aracee"
  note: { tema: "tossicità" | "parassiti" | "maneggiare"; testo: string; fonti: number[] }[];
  fonti: Fonte[];
  verifica: SchedaCura["verifica"];
  aggiornata: string;
}
