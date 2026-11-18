// Testi della Guida: UNA sola fonte (specifiche F02). L'app li mostra da qui e lo script
// `npm run guida` li copia in docs/user-guide/guida.md. Dopo ogni modifica si rilancia lo script
// (la prova automatica controlla che i due testi coincidano).
// Regola: ogni funzione della v1 ha qui il suo tutorial (CLAUDE.md §6). Scrivere solo ciò che l'app fa davvero.

/** Tipo di bolla colorata (stile-grafico.md): stesso tipo di contenuto = stessa bolla in tutta l'app. */
export type Bolla = "verde" | "acqua" | "viola" | "lime" | "luce" | "azzurro" | "pesca";

/** Icone disponibili per la Guida (nomi delle icone Lucide usate in src/components/icona.tsx). */
export type NomeIcona =
  | "casa" | "campanella" | "piante" | "fotocamera" | "promemoria" | "guida" | "aiuto" | "nuova-pianta" | "telefono"
  | "sole" | "mirino" | "fiore" | "foto" | "posizione" | "condividi" | "aggiungi" | "file" | "scintille" | "scudo"
  | "altro";

export interface Tutorial {
  slug: string;
  titolo: string;
  riassunto: string;
  bolla: Bolla;
  icona: NomeIcona;
  passi: string[];
}

export interface Domanda {
  domanda: string;
  risposta: string;
}

/** Riquadro che compare la prima volta in ogni sezione; si chiude e si richiama col pulsante "?". */
export interface Spiegazione {
  titolo: string;
  testo: string;
}

export const sezioni = {
  piante: {
    titolo: "Le mie piante",
    testo:
      "Qui troverai le piante che salvi dopo averle riconosciute, con le loro schede di cura. Restano solo sul tuo telefono. Questa parte arriva nella fase 3 della versione 1.",
  },
  fotocamera: {
    titolo: "Fotocamera",
    testo:
      "Da qui fotograferai una pianta per sapere come si chiama. L'app ti dirà la specie più probabile e le alternative, senza inventare. Questa parte arriva nella fase 2 della versione 1.",
  },
  promemoria: {
    titolo: "Promemoria",
    testo:
      "Qui vedrai quando annaffiare, concimare o rinvasare le tue piante, con consigli adattati alla finestra e al meteo. Questa parte arriva nella fase 5 della versione 1.",
  },
  "nuova-pianta": {
    titolo: "Nuova pianta",
    testo:
      "Qui potrai far nascere una pianta nuova: da seme, talea o divisione, con i passi da seguire. Questa parte arriva nella fase 5 della versione 1.",
  },
  guida: {
    titolo: "Guida",
    testo:
      "Qui trovi un tutorial per ogni funzione e le risposte alle domande più comuni. La Guida si apre sempre dal pulsante con il libro, in basso a destra.",
  },
} satisfies Record<string, Spiegazione>;

export type IdSezione = keyof typeof sezioni;

export const tutorial: Tutorial[] = [
  {
    slug: "muoversi-nell-app",
    titolo: "Muoversi nell'app",
    riassunto: "La barra in basso porta a tutte le sezioni.",
    bolla: "verde",
    icona: "casa",
    passi: [
      "In basso c'è sempre la barra di navigazione, su ogni schermata.",
      "Da sinistra: Home, Le mie piante, Fotocamera (il pulsante verde al centro), Promemoria e Guida.",
      "La sezione in cui ti trovi ha l'icona verde su uno sfondo chiaro.",
      "Dalla Home puoi aprire le stesse sezioni anche con i quattro pulsanti colorati sotto la card \"Riconosci una pianta\".",
    ],
  },
  {
    slug: "spiegazioni-delle-sezioni",
    titolo: "Le spiegazioni delle sezioni",
    riassunto: "La prima volta ogni sezione si presenta; il pulsante \"?\" la richiama.",
    bolla: "lime",
    icona: "aiuto",
    passi: [
      "La prima volta che entri in una sezione compare un riquadro che spiega a cosa serve.",
      "Tocca \"Ho capito\" per chiuderlo: non ricomparirà da solo.",
      "Per rileggerlo, tocca il pulsante con il punto di domanda in alto a destra nella sezione.",
    ],
  },
  {
    slug: "installare-l-app",
    titolo: "Installare l'app sulla schermata Home",
    riassunto: "Così Safari non cancella i tuoi dati e l'app si apre a schermo intero.",
    bolla: "verde",
    icona: "telefono",
    passi: [
      "Apri https://mandragola-app.vercel.app in Safari.",
      "Tocca il pulsante Condividi (il quadrato con la freccia verso l'alto). Se non lo vedi, tocca prima i tre puntini in basso.",
      "Scorri e tocca \"Aggiungi alla schermata Home\".",
      "Tocca \"Aggiungi\" in alto a destra. Se compare l'interruttore \"Apri come app web\", lascialo acceso.",
      "Da quel momento apri Mandragola dalla sua icona, non da Safari.",
    ],
  },
  {
    slug: "ripetere-il-tutorial-iniziale",
    titolo: "Ripetere il tutorial iniziale",
    riassunto: "Rivedi le schermate del primo avvio quando vuoi.",
    bolla: "lime",
    icona: "scintille",
    passi: [
      "Apri la Guida.",
      "Tocca \"Ripeti il tutorial iniziale\", sopra l'elenco dei tutorial.",
      "Scorri le schermate con \"Avanti\" e \"Indietro\"; \"Salta\" ti riporta alla Home in qualsiasi momento.",
    ],
  },
  {
    slug: "usare-la-guida",
    titolo: "Usare la Guida",
    riassunto: "Tutorial per ogni funzione e domande frequenti.",
    bolla: "lime",
    icona: "guida",
    passi: [
      "Apri la Guida dal pulsante con il libro, in basso a destra, oppure dal punto di domanda in alto nella Home.",
      "Tocca un tutorial per vedere i passi uno sotto l'altro; la freccia in alto ti riporta alla Guida.",
      "Sotto i tutorial ci sono le domande frequenti: tocca una domanda per leggere la risposta.",
      "Ogni volta che l'app riceve una funzione nuova, qui arriva il suo tutorial.",
    ],
  },
];

export const domande: Domanda[] = [
  {
    domanda: "Mandragola è davvero gratis?",
    risposta:
      "Sì. È un progetto non commerciale: niente pubblicità, niente abbonamenti, nessuna funzione a pagamento.",
  },
  {
    domanda: "Devo creare un account?",
    risposta: "No. L'app funziona senza registrazione e senza password.",
  },
  {
    domanda: "Dove finiscono i miei dati?",
    risposta:
      "Restano sul tuo telefono. Non c'è un archivio online con i tuoi dati. Più avanti potrai salvarne una copia in un file, per esempio su iCloud Drive.",
  },
  {
    domanda: "Perché alcune sezioni dicono che arriveranno più avanti?",
    risposta:
      "L'app è in costruzione e cresce un passo alla volta. Ogni sezione dice onestamente in quale fase arriva, invece di mostrare pulsanti che non fanno niente.",
  },
  {
    domanda: "Posso vedere come è fatta?",
    risposta: "Sì: Mandragola è open source, il codice è pubblico su GitHub con licenza MIT.",
  },
];

/** Una schermata del tutorial iniziale (onboarding, specifiche F01). */
export interface PassoOnboarding {
  id: string;
  titolo: string;
  testo: string;
  punti: { icona: NomeIcona; bolla: Bolla; titolo: string; testo: string }[];
  /** Parte speciale mostrata sotto i punti */
  extra?: "esempio-risultato" | "installazione";
}

export const onboarding: PassoOnboarding[] = [
  {
    id: "benvenuto",
    titolo: "Benvenuto in Mandragola",
    testo: "Riconosci le piante con la fotocamera e impara a curarle.",
    punti: [
      { icona: "scudo", bolla: "verde", titolo: "Gratis, davvero", testo: "Niente pubblicità, niente abbonamenti, niente account." },
      { icona: "telefono", bolla: "lime", titolo: "Tutto sul tuo telefono", testo: "Le tue piante restano qui, non su un archivio online." },
    ],
  },
  {
    id: "fotografare",
    titolo: "Come fotografare una pianta",
    testo: "Una buona foto vale più di tutto il resto.",
    punti: [
      { icona: "sole", bolla: "luce", titolo: "Tanta luce", testo: "Meglio la luce del giorno, senza controluce." },
      { icona: "mirino", bolla: "verde", titolo: "Da vicino", testo: "Una sola pianta, a fuoco, che riempie la foto." },
      { icona: "fiore", bolla: "viola", titolo: "Fiori e frutti", testo: "Se ci sono, fotografali: aiutano più delle foglie." },
      { icona: "foto", bolla: "acqua", titolo: "Più foto", testo: "Puoi usare fino a 5 foto della stessa pianta." },
    ],
  },
  {
    id: "risultati",
    titolo: "Come leggere i risultati",
    testo: "Mandragola dice quanto è sicura, senza inventare.",
    punti: [
      { icona: "piante", bolla: "verde", titolo: "Nome e \"probabilmente\"", testo: "In grande il nome comune e il genere; la specie è sempre introdotta da \"probabilmente\"." },
      { icona: "aiuto", bolla: "lime", titolo: "Alternative", testo: "Se non è sicura ti mostra le piante simili. Se non riesce, te lo dice e ti dà consigli per una foto migliore." },
      { icona: "scintille", bolla: "viola", titolo: "Il \"Forse…\" nel mirino", testo: "Mentre inquadri compare un nome con \"Forse\": è un'ipotesi veloce fatta sul telefono. Il risultato affidabile arriva quando scatti." },
    ],
    extra: "esempio-risultato",
  },
  {
    id: "permessi",
    titolo: "Fotocamera e posizione",
    testo: "Prima di chiederti un permesso ti spieghiamo sempre a cosa serve.",
    punti: [
      { icona: "fotocamera", bolla: "verde", titolo: "Fotocamera", testo: "Serve per fotografare le piante. Te la chiederemo la prima volta che scatti." },
      { icona: "posizione", bolla: "azzurro", titolo: "Posizione (facoltativa)", testo: "Serve per il meteo e il sole della tua città. Se preferisci, scrivi solo il nome del comune." },
      { icona: "scudo", bolla: "lime", titolo: "Puoi dire di no", testo: "L'app funziona lo stesso. Per cambiare idea: Impostazioni di iPhone → App → Safari → Fotocamera o Posizione." },
    ],
  },
  {
    id: "installazione",
    titolo: "Mettila sulla schermata Home",
    testo: "Se resta solo in Safari, dopo alcuni giorni senza visite Safari può cancellare i suoi dati: piante, foto e promemoria. Installata sulla Home, no. E in futuro potrà mandarti le notifiche.",
    punti: [
      { icona: "condividi", bolla: "verde", titolo: "1. Condividi", testo: "In Safari tocca Condividi. Se non lo vedi, tocca prima i tre puntini in basso." },
      { icona: "aggiungi", bolla: "verde", titolo: "2. Aggiungi alla schermata Home", testo: "Scorri l'elenco e toccalo." },
      { icona: "casa", bolla: "verde", titolo: "3. Aggiungi", testo: "Tocca \"Aggiungi\". Poi apri Mandragola dalla sua icona." },
    ],
    extra: "installazione",
  },
  {
    id: "backup",
    titolo: "Una copia di sicurezza",
    testo: "Presto potrai salvare le tue piante in un file, per esempio su iCloud Drive, e ritrovarle su un altro telefono.",
    punti: [
      { icona: "file", bolla: "acqua", titolo: "Un file tutto tuo", testo: "Lo salvi dove vuoi tu. Nessun account, nessun archivio online." },
      { icona: "campanella", bolla: "lime", titolo: "Te lo ricorderemo", testo: "La funzione arriva nella fase 3 della versione 1: per ora non devi fare niente." },
    ],
  },
];
