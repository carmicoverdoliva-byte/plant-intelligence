// Regole delle SCHEDE GENERATE (R2, decisioni dell'utente del 2026-11-19). Nessuna rete, nessun import: si prova da solo.
// Prende la scheda scritta dal modello e la rende sicura, oppure dice che va rigenerata o scartata.
//  1. Nessuna fonte A per la specie → scheda "non verificata": linee guida "non indicata dalle fonti",
//     Wikipedia solo nei consigli dal pollice verde.
//  2. Una sezione delle linee guida cita una fonte C → il contenuto si sposta nel pollice verde.
//  3. Anti-copia: anche una sola sequenza di 8 parole uguale a Wikipedia → "copia" (bloccante: si rigenera).
//  4. Tossicità: niente nel testo libero; valore e nota si COPIANO dalle nostre fonti A (scheda del tipo, nota di
//     famiglia, casi verificati come la Phalaenopsis). Senza fonti A: "non verificata" con la nota prudente.
//  5. "Cose da fare" in cima costruite dal codice dalle linee guida con fonte A; pollice verde senza doppioni (max 3).
//  6. (2026-11-19) Pollice verde ANCORATO alla fonte: ogni consiglio deve avere almeno 2 parole importanti presenti nel
//     testo della fonte citata, e i suoi numeri devono comparire lì; altrimenti si toglie. Un consiglio che cita una
//     fonte A non è "non ufficiale": passa nelle cose da fare delle linee guida della sua sezione.
//  7. (2026-11-25, versione 2 delle regole, dopo la rilettura delle prime 24 schede)
//     a. un numero che nella fonte è una minima o una massima deve restarlo nella frase, altrimenti la frase si toglie;
//     b. "Coltivarla da zero" basata solo sul tipo di pianta si dichiara indicazione generale;
//     c. niente promesse (aria pulita, fortuna, salute) e niente frasi che parlano dell'app o delle schede;
//     d. fonte A citata insieme a Wikipedia: nelle linee guida resta solo ciò che la fonte A dice davvero;
//     e. un consiglio del pollice verde deve dire cosa FARE.
//  8. (2026-11-25, versione 3 delle regole)
//     a. il pollice verde non dà frequenze, quantità o temperature diverse dalle linee guida della stessa sezione;
//     b. niente frasi senza contenuto pratico nel riassunto e nelle linee guida ("segui le indicazioni specifiche");
//     c. una scheda quasi vuota non passa: se la scheda del tipo copre tutte le sezioni ma qui ne restano vuote troppe
//        (per esempio il modello ha dimenticato le fonti), sul telefono resta la scheda del tipo, che è completa.
//  9. (2026-11-26, versione 4 delle regole)
//     a. fonte dimenticata: linee guida senza fonti → ogni frase che la fonte A dice davvero (parole e numeri, come
//        in 7d) si attribuisce a lei; le altre vanno nel pollice verde (e restano solo se Wikipedia le dice);
//     b. la regola 8a non toglie un consiglio PIÙ prudente della linea guida (minima più alta, massima più bassa,
//        annaffiature o concimazioni meno frequenti, meno concime): toglie solo ciò che è meno prudente o contraddice;
//     c. niente frasi che nominano un'altra pianta (es. il pothos nella scheda della Monstera), salvo i confronti
//        presenti in una fonte su QUESTA pianta (non nella scheda del tipo o nella nota di famiglia, che valgono per molte);
//     d. sezione con le "cose da fare" ma senza riassunto: la prima cosa da fare diventa il riassunto (prima si perdeva).

export type LivelloFonte = "A" | "C";
export interface FonteData {
  livello: LivelloFonte;
  titolo: string;
  url?: string;
  testo: string;
  copreTutto?: boolean; // ha tutte le sezioni (scheda del tipo): una scheda generata quasi vuota non è accettabile (8c)
  generale?: boolean; // vale per il tipo di pianta o la famiglia, non per la singola specie (regola 7b)
}
export type Tossicita = "tossica" | "tossica (una fonte)" | "varia" | "non verificata" | "non tossica"; // vedi src/lib/schede/tipi.ts

export interface SezioneGenerata {
  lineeGuida: { riassunto: string; coseDaFare: string[]; fonti: string[] };
  pollice: { consiglio: string; fonti: string[] }[];
}
export interface SchedaGenerata {
  riassunto: string;
  coseDaFare: string[];
  sezioni: Record<string, SezioneGenerata>;
  tossicita: { persone: Tossicita; animali: Tossicita; nota: string; fonti: string[] };
}

export const SEZIONI = ["luce", "acqua", "temperatura", "terriccio", "concime", "travaso", "coltivarla", "problemi"] as const;
export const QUASI_VUOTA = "scheda quasi vuota";
export const NON_INDICATA = "Non indicata dalle fonti.";
export const RIASSUNTO_NON_VERIFICATA =
  "Per questa pianta non abbiamo ancora fonti verificate: qui sotto trovi solo consigli non ufficiali, presi da Wikipedia. Usali con prudenza.";

const NOTE_STANDARD: Record<Tossicita, string> = {
  tossica: "Le nostre fonti la indicano tossica: tienila lontana da bambini e animali.",
  "tossica (una fonte)": "Una delle nostre fonti la indica tossica: tienila lontana da bambini e animali.",
  varia: "Dipende dalla specie: finché non è verificato, tienila lontana da bambini e animali.",
  "non verificata": "Non abbiamo dati verificati sulla tossicità: per prudenza tienila lontana da bambini e animali.",
  "non tossica": "Non abbiamo dati verificati sulla tossicità: per prudenza tienila lontana da bambini e animali.",
};
// Parole che parlano di tossicità: nel testo libero non devono comparire (regola 4)
const PAROLE_TOSSICITA = /tossic|velen|avvelen|irrit|ingerit|ingesti|innocu|sicur[ao] per (i |gli )?(bambin|animal|cani|gatti)|pericolos[ao] per/i;

const parole = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
const ottetti = (p: string[]) => new Set(p.slice(0, Math.max(0, p.length - 7)).map((_, i) => p.slice(i, i + 8).join(" ")));
const frasi = (t: string) => t.split(/(?<=[.!?])\s+/).filter((f) => f.trim());
const testo = (x: unknown) => (typeof x === "string" ? x.trim() : "");
const elenco = (x: unknown) => (Array.isArray(x) ? x.map(testo).filter(Boolean) : []);

/** I numeri di una frase, con gli intervalli tenuti interi: "tra 16-30 °C e 5" → ["16-30", "5"] */
const numeriDi = (t: string) => t.match(/\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?/g)?.map((n) => n.replace(/\s*[-–]\s*/, "-")) ?? [];
const fontiNormalizzate = (t: string) => t.replace(/\s*[-–]\s*(?=\d)/g, "-");
/** Il numero compare nel testo COME NUMERO A SÉ? ("6" non vale dentro "16", "2016" o "6,5") */
const numeroIn = (n: string, testo: string) =>
  new RegExp(`(?<![\\d.,])${n.replace(/[.]/g, "\\.")}(?!\\d|[.,]\\d)`).test(fontiNormalizzate(testo));
/** Una misura scritta in lettere: numero a parole + unità ("un metro", "due settimane", "una decina di centimetri") */
export const MISURA_IN_LETTERE = new RegExp(
  "(?<![\\p{L}])(?:un[oa]?|un'|mezz[oa]|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici|quindici|venti|trenta|quaranta|cinquanta|sessanta|settanta|ottanta|novanta|cento|mille|decin[ae]|dozzin[ae]|centinai[oa]|paio)" +
    "\\s*(?:di\\s+)?(?:metr[oi]|centimetr[oi]|millimetr[oi]|chilometr[oi]|grad[oi]|litr[oi]|chil[oi]|chilogramm[oi]|gramm[oi]|giorn[oi]|settiman[ae]|mes[ei]|ann[oi]|or[ae])(?![\\p{L}])",
  "iu",
);
/** Tutti i numeri della frase compaiono nel testo delle fonti? */
const numeriNelleFonti = (frase: string, testoFonti: string) => numeriDi(frase).every((n) => numeroIn(n, testoFonti));
// Verbi e parole generiche: non bastano a dire che un consiglio viene dalla fonte
const PAROLE_GENERICHE = new Set(["usare", "utilizzare", "mettere", "metti", "fare", "tenere", "tienila", "evitare", "evita", "mantenere", "mantieni", "controllare", "controlla", "assicurare", "assicurati", "garantire", "aggiungere", "posizionare", "fornire", "scegliere", "scegli", "richiede", "necessita", "preferisce", "bisogno", "consigliato", "consiglia", "importante", "regolarmente", "spesso", "sempre", "buona", "buono", "bene", "migliore", "molto", "poco", "questa", "questo", "quella", "quello", "della", "delle", "dello", "degli", "nella", "nelle", "sono", "essere", "anche", "quando", "pianta", "piante", "specie", "coltivazione", "crescita", "crescere", "periodo", "modo", "moltiplicare", "moltiplica", "moltiplicala", "moltiplicalo", "riprodurre", "riproduce", "propagare", "propagazione", "propaga", "permette", "consente", "possibile", "ottenere"]);
const radiceParola = (w: string) => w.slice(0, 5);
/** Parole importanti di una frase (escluse quelle generiche e i nomi della pianta) */
const paroleImportanti = (t: string, escluse: Set<string>) =>
  [...new Set(parole(t).filter((w) => w.length > 3 && !/^\d/.test(w) && !PAROLE_GENERICHE.has(w) && !escluse.has(radiceParola(w))).map(radiceParola))];
/** Il consiglio ha almeno 2 parole importanti che compaiono nel testo della fonte citata, e i suoi numeri sono lì? */
export function ancorato(consiglio: string, testoFonti: string, nomiPianta: string[] = []): boolean {
  const escluse = new Set(nomiPianta.flatMap((n) => parole(n)).map(radiceParola));
  const nellaFonte = new Set(parole(testoFonti).map(radiceParola));
  return paroleImportanti(consiglio, escluse).filter((r) => nellaFonte.has(r)).length >= 2 && numeriConContesto(consiglio, testoFonti, escluse) && significatoOk(consiglio, testoFonti);
}
/** Ogni numero del consiglio è in una frase della fonte che parla della STESSA cosa (almeno una parola importante in
 *  comune)? Es.: "pieno sole per 6 ore" NON è confermato da "possono sembrare 6 fiori" (2026-11-19, basilico). */
function numeriConContesto(consiglio: string, testoFonti: string, escluse: Set<string>): boolean {
  const mie = new Set(paroleImportanti(consiglio, escluse));
  const frasiFonte = testoFonti.split(/(?<=[.!?])\s+|\n+/);
  return numeriDi(consiglio).every((n) =>
    frasiFonte.some((f) => numeroIn(n, f) && paroleImportanti(f, escluse).some((r) => mie.has(r))),
  );
}

/** Quasi tutte le parole importanti di "a" sono già in "b"? (allora "a" non aggiunge nulla) */
export function giaContenuto(a: string, b: string, nomiPianta: string[] = []): boolean {
  const escluse = new Set(nomiPianta.flatMap((n) => parole(n)).map(radiceParola));
  const pa = paroleImportanti(a, escluse);
  const pb = new Set(paroleImportanti(b, escluse));
  if (!pa.length) return true;
  return pa.filter((r) => pb.has(r)).length / pa.length >= 0.8;
}

// --- Regola 7a: il SIGNIFICATO dei numeri (minima, massima, soglia di danno) ---
type Significato = "min" | "max" | "danno";
interface NumeroLetto {
  n: string;
  unita: string; // "" se non si capisce
  significati: Set<Significato>; // vuoto = numero senza un significato particolare (es. "ideale 16-30 °C")
  dichiarato?: Significato; // "minima" o "massima" scritto chiaro
}
const UNITA: [RegExp, string][] = [
  [/^\s*(°|gradi)/i, "gradi"],
  [/^\s*(cm|centimetr)/i, "cm"],
  [/^\s*(mm|millimetr)/i, "mm"],
  [/^\s*(m|metr[oi])(?![\p{L}])/iu, "m"],
  [/^\s*or[ae](?![\p{L}])/iu, "ore"],
  [/^\s*minut/i, "minuti"],
  [/^\s*giorn/i, "giorni"],
  [/^\s*settiman/i, "settimane"],
  [/^\s*mes[ei](?![\p{L}])/iu, "mesi"],
  [/^\s*ann[oi](?![\p{L}])/iu, "anni"],
  [/^\s*volt[ae]/i, "volte"],
  [/^\s*%/, "%"],
];
// Parole che uniscono due numeri in un solo intervallo: "10-13", "tra i 10 e i 13 °C", "2 o 3 anni"
const UNISCE = /^\s*(?:°\s*C?)?\s*(?:[-–‑]|e|o|a|ai|and|to|fino a)\s*(?:i|gli|ai|agli)?\s*$/i;
const DANNO = /dann|rovin|soffr|muor|uccid|blocc|letal/i;
const TENERE = /\b(?:tieni\w*|tener\w*|mantien\w*|manten\w*|conserva\w*|preferi\w*|ideal\w*|ottimal\w*|sta(?:nno)? bene|cresc\w* bene)\b/i;
const NEGA = /\b(?:non|mai|evita\w*|senza)\b/i;

function significatiDi(prima: string, dopo: string): Pick<NumeroLetto, "significati" | "dichiarato"> {
  const s = new Set<Significato>();
  let dichiarato: Significato | undefined;
  const p = prima.toLowerCase();
  if (/minim|minimum/.test(p)) s.add((dichiarato = "min"));
  if (/massim|maximum/.test(p)) s.add((dichiarato = "max"));
  if (/almeno|non meno|at least/.test(p)) s.add("min");
  if (/al massimo|non più di|at most|fino a(?:i|gli|d)?\s*$|up to\s*$/.test(p)) s.add("max");
  if (/\bsotto\b|inferior|\bscend|\bbelow\b|\bunder\b|meno di/.test(p)) {
    const tienilaSotto = TENERE.test(p) && !NEGA.test(p) && !/scend|\bse\b|quando|prima che/.test(p);
    s.add(tienilaSotto ? "max" : "min");
  }
  if (/\bsopra\b|superior|\boltre\b|supera|\babove\b|più di/.test(p)) s.add(NEGA.test(p) || (DANNO.test(dopo) && !TENERE.test(p)) ? "max" : "min");
  if (/^\W*(?:°\s*c)?\W*(?:o più|in su|al minimo|come minimo|minim)/i.test(dopo)) s.add("min");
  if (/^\W*(?:°\s*c)?\W*(?:o meno|al massimo|come massimo|massim)/i.test(dopo)) s.add("max");
  // "possono subire danni tra 4 e 10 °C"; ma "mantieni tra 10 e 13 °C per evitare danni" NON è una soglia di danno
  if (DANNO.test(p) || (DANNO.test(dopo) && !TENERE.test(p))) s.add("danno");
  return { significati: s, dichiarato };
}

function numeriLetti(testoFonte: string): NumeroLetto[] {
  const letti: NumeroLetto[] = [];
  for (const pezzo of testoFonte.split(/\n+|(?<=[.!?;])\s+/)) {
    const trovati = [...pezzo.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => ({ n: m[0], da: m.index, a: m.index + m[0].length }));
    for (let i = 0; i < trovati.length; ) {
      let j = i;
      while (j + 1 < trovati.length && UNISCE.test(pezzo.slice(trovati[j].a, trovati[j + 1].da))) j++;
      const prima = pezzo.slice(i ? trovati[i - 1].a : 0, trovati[i].da).split(/[;(]/).pop() as string;
      const dopo = pezzo.slice(trovati[j].a, trovati[j + 1]?.da ?? pezzo.length);
      const unita = UNITA.find(([re]) => re.test(dopo))?.[1] ?? "";
      const senso = significatiDi(prima, dopo);
      for (let k = i; k <= j; k++) letti.push({ n: trovati[k].n, unita, ...senso });
      i = j + 1;
    }
  }
  return letti;
}

/** Ogni numero della frase ha nella fonte la stessa unità e lo stesso significato? Se nella fonte è SOLO una minima
 *  (o una massima, o una soglia di danno), la frase deve dirlo: "mantieni tra 10 e 13 °C" non vale per "Minima: 10-13 °C". */
export function significatoOk(frase: string, testoFonti: string): boolean {
  const fonte = numeriLetti(testoFonti);
  return numeriLetti(frase).every((g) => {
    const uguali = fonte.filter((f) => f.n === g.n && (!f.unita || !g.unita || f.unita === g.unita));
    if (!uguali.length) return false;
    if (uguali.every((f) => f.significati.size) && !uguali.some((f) => [...f.significati].some((x) => g.significati.has(x)))) return false;
    return !g.dichiarato || uguali.some((f) => f.significati.has(g.dichiarato as Significato));
  });
}

// --- Regola 7b: moltiplicazione nota solo per il tipo di pianta ---
export const PER_MOLTE = "Per molte piante di questo tipo: ";
export const NON_DETTO = "Non è detto che valga per questa specie.";
const PARLA_DI_MOLTIPLICAZIONE = /moltiplic|propag|\btale[ae]\b|riproduc|riproduzion|stolon|pollon/i;
const minuscola = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

// --- Regola 7c: promesse (aria, fortuna, salute) e frasi che parlano dell'app o delle schede ---
export const PROMESSE =
  /purific|depura(?!t)|(?:pulisc|ripulisc|filtra)\w* l['’]aria|miglior\w* (?:[\wàèéìòù'’]+ ?){0,3}aria|inquinan|formaldeide|fortuna(?!t)|porta(?:no)? (?:bene|soldi|prosperità|ricchezza)|buon auspicio|feng ?shui|energi[ae] positiv|medicin|curativ|terapeutic|fitoterap|antinfiammator|antisettic|lenitiv|cicatrizz|cosmetic|tisan|benefic\w* per (?:la|il|l['’])|fa bene al(?:la|l['’])? ?(?:salute|pelle|umore)|benessere (?:mentale|psicofisico)/i;
export const PARLA_DELL_APP = /\bsched[ae]\b|mandragola|\bapp\b|quando sarà pront/i;

// --- Regola 7e: un consiglio deve dire cosa FARE ---
// Imperativi chiari ("metti", "tieni") e imperativi che somigliano alla terza persona ("annaffia", "la pianta evita…")
const CHIARI =
  "metti|mantieni|tieni|proteggi|rimuovi|togli|scegli|aggiungi|dividi|immergi|riduci|sospendi|attendi|pulisci|fornisci|garantisci|copri|raccogli|distribuisci|riproduci|esponi|poni|disponi|preferisci|inserisci|diluisci|riempi|ripeti|fai|offri|sostieni";
const AMBIGUI =
  "annaffia|innaffia|bagna|irriga|versa|vaporizza|nebulizza|spruzza|sposta|posiziona|colloca|evita|taglia|pota|elimina|controlla|verifica|osserva|concima|fertilizza|travasa|rinvasa|trapianta|semina|pianta|moltiplica|separa|stacca|preleva|lascia|aspetta|usa|utilizza|mescola|svuota|aumenta|somministra|lega|ruota|arieggia|ventila|tratta|ricorda|assicura|avvicina|allontana|appoggia|interra|ombreggia|ripara|spolvera|riporta|porta|applica|coltiva|limita|regola|alterna|prepara|propaga|monitora";
const ENCLITICI = "(?:la|lo|le|li|ne|ti|gli|vi)";
const INFINITI =
  "(?:annaffi|innaffi|bagn|irrig|vers|vaporizz|nebulizz|spruzz|spost|posizion|colloc|evit|tagli|pot|elimin|controll|verific|osserv|concim|fertilizz|travas|rinvas|trapiant|semin|piant|moltiplic|separ|stacc|prelev|lasci|aspett|us|utilizz|mescol|svuot|aument|somministr|leg|ruot|arieggi|ventil|tratt|assicur|avvicin|allontan|appoggi|interr|ombreggi|ripar|riport|port|applic|coltiv|limit|regol|altern|prepar|propag|monitor)ar(?:e|la|lo|le|li|ne)" +
  "|(?:mett|ten|manten|protegg|rimuov|toglier|scegli|aggiung|divid|immerg|sospend|attend|raccogli|ripet|otten)er(?:e|la|lo|le|li|ne)|(?:pul|forn|garant|copr|distribu|inser|dilu|riemp|offr)ir(?:e|la|lo|le|li|ne)|(?:ridur|espor|por|dispor|riprodur)(?:re|la|lo|le|li|ne)";
const PARTICIPI =
  "(?:annaffi|innaffi|bagn|irrig|vaporizz|nebulizz|spost|posizion|colloc|evit|tagli|pot|elimin|controll|concim|fertilizz|travas|rinvas|trapiant|semin|piant|moltiplic|separ|stacc|lasci|us|utilizz|svuot|somministr|tratt|riport|coltiv|limit|propag)at[aoei]|mess[aoei]|(?:man)?tenut[aoei]|protett[aoei]|tolt[aoei]|rimoss[aoei]|scelt[aoei]|divis[aoei]|ridott[aoei]|espost[aoei]|copert[aoei]";
const L = "(?<![\\p{L}])", F = "(?![\\p{L}])"; // inizio e fine di parola, accenti compresi
const IMPERATIVO_CHIARO = new RegExp(`${L}(?:(?:${CHIARI})${ENCLITICI}?|(?:${AMBIGUI})${ENCLITICI})${F}`, "iu");
const IMPERATIVO_INIZIO = new RegExp(`(?:^|[,;:(]\\s*|${L}(?:e|o|poi|quindi|oppure|non|inoltre|infine|sempre)\\s+)(?:${AMBIGUI})${F}`, "iu");
const COMPLEMENTO_INIZIALE = /^(?:in|da|dal|dalla|d['’]\w+|durante|per|se|quando|dopo|prima|ogni|nel|nei|nella|nelle|con|a|al|all['’]\w+|ad)\s/i;
const IMPERATIVO_DOPO = new RegExp(`(?<!${L}(?:si|che|la|una|pianta|specie|questa)\\s)${L}(?:${AMBIGUI})${F}`, "iu");
const INFINITO_INIZIO = new RegExp(`(?:^|[,;:]\\s*)(?:non\\s+)?(?:${INFINITI})${F}`, "iu");
const MODALE = new RegExp(
  `${L}(?:puoi|devi|dovresti|potresti|bisogna|occorre|conviene|basta|si (?:può|possono|deve|devono|consiglia(?: di)?)|è (?:meglio|bene|possibile|consigliabile|consigliato|utile|importante|necessario|preferibile|sufficiente)|va|vanno|andrebbe|deve|devono|dovrebbe|può essere|possono essere|consiglia(?:bile|to)?)${F}.*${L}(?:${INFINITI}|${PARTICIPI})${F}`,
  "iu",
);
/** Il consiglio contiene un'azione ("annaffia", "puoi dividerla", "va spostata")? "Ha un portamento lianoso" no. */
export function diceCosaFare(t: string): boolean {
  const s = t.trim();
  return (
    IMPERATIVO_CHIARO.test(s) ||
    IMPERATIVO_INIZIO.test(s) ||
    (COMPLEMENTO_INIZIALE.test(s) && IMPERATIVO_DOPO.test(s)) ||
    INFINITO_INIZIO.test(s) ||
    MODALE.test(s)
  );
}

// --- Regola 8a: il pollice verde non dà frequenze, quantità o temperature diverse dalle linee guida della sua sezione ---
const PAROLE_NUMERO: Record<string, number> = { un: 1, "un'": 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, quindici: 15, venti: 20, trenta: 30 };
const N_FREQ = `(?:\\d+(?:[.,]\\d+)?|${Object.keys(PAROLE_NUMERO).filter((n) => n !== "un'").join("|")})`;
const INTERVALLO = `(${N_FREQ})(?:\\s*(?:-|–|‑|o|a|e)\\s*(${N_FREQ}))?`;
const PERIODO = "(giorn[oi]|d[iì]|settiman[ae]|mes[ei]|ann[oi])";
const VOLTE = new RegExp(`(?<![\\p{L}\\d])${INTERVALLO}\\s+volt[ae]\\s+(?:a|al|alla|all['’]|ogni|per|l['’]|il|la)\\s*${PERIODO}(?![\\p{L}])`, "giu");
const OGNI = new RegExp(`(?<![\\p{L}])ogni\\s+(?:${INTERVALLO}\\s+)?${PERIODO}(?![\\p{L}])`, "giu");
const AVVERBI: [RegExp, number][] = [[/quotidian|giornalier|ogni d[iì](?![\p{L}])/iu, 1], [/settimanal/i, 7], [/quindicinal/i, 15], [/mensil/i, 30], [/annual/i, 365]];
const inNumero = (t: string) => PAROLE_NUMERO[t.toLowerCase()] ?? Number(t.replace(",", "."));
const giorniDi = (p: string) => (/^(giorn|d)/i.test(p) ? 1 : /^settim/i.test(p) ? 7 : /^mes/i.test(p) ? 30 : 365);

/** Ogni quanti giorni, come intervallo: "due volte a settimana" → [3.5, 3.5]; "ogni 2-3 anni" → [730, 1095]. */
export function frequenze(t: string): [number, number][] {
  const trovate: [number, number][] = [];
  for (const m of t.matchAll(VOLTE)) {
    const a = inNumero(m[1]), b = m[2] ? inNumero(m[2]) : a, g = giorniDi(m[3]);
    trovate.push([g / Math.max(a, b), g / Math.min(a, b)]);
  }
  for (const m of t.matchAll(OGNI)) {
    const a = m[1] ? inNumero(m[1]) : 1, b = m[2] ? inNumero(m[2]) : a, g = giorniDi(m[3]);
    trovate.push([g * Math.min(a, b), g * Math.max(a, b)]);
  }
  for (const [re, g] of AVVERBI) if (re.test(t)) trovate.push([g, g]);
  return trovate;
}
const SI_CONTROLLA = /\bdito\b|asciutt|solleva/i; // "annaffia quando i primi 2-3 cm sono asciutti": niente calendario

/** Il consiglio contrasta con le linee guida della stessa sezione? Se quelle non danno il dato, non c'è contrasto. */
export function contrasta(consiglio: string, lineeGuida: string[], sezione: string): boolean {
  const lg = lineeGuida.join("\n");
  // Frequenze
  const mie = frequenze(consiglio), loro = frequenze(lg);
  if (mie.length) {
    if (loro.length) {
      const min = Math.min(...loro.map((x) => x[0])), max = Math.max(...loro.map((x) => x[1]));
      if (mie.some(([a]) => a < min * 0.95)) return true; // più spesso della linea guida
      // Meno spesso: per acqua e concime è più prudente e resta (9b); per il resto (es. travaso) è un contrasto
      if (mie.some(([, b]) => b > max * 1.05) && !MENO_SPESSO_PRUDENTE.has(sezione)) return true;
    } else if (sezione === "acqua" && SI_CONTROLLA.test(lg)) return true; // un calendario contro "controlla col dito"
  }
  const valori = numeriLetti(lg);
  for (const g of numeriLetti(consiglio)) {
    const v = Number(g.n.replace(",", "."));
    const stessi = valori.filter((x) => x.unita === g.unita).map((x) => ({ v: Number(x.n.replace(",", ".")), s: x.significati }));
    if (!stessi.length) continue;
    const con = (s: Significato) => stessi.filter((x) => x.s.has(s)).map((x) => x.v);
    const liberi = stessi.filter((x) => !x.s.size).map((x) => x.v);
    if (g.unita === "gradi") {
      const minime = con("min"), massime = con("max");
      // 9b: una minima più alta o una massima più bassa sono più prudenti e restano; fuori dall'intervallo ideale no
      if (g.significati.has("min")) {
        if (minime.length ? v < Math.min(...minime) : liberi.length > 0 && v > Math.max(...liberi)) return true;
      } else if (g.significati.has("max")) {
        if (massime.length ? v > Math.max(...massime) : liberi.length > 0 && v < Math.min(...liberi)) return true;
      } else if (liberi.length) {
        if (v < Math.min(...liberi) || v > Math.max(...liberi)) return true;
      } else if ((minime.length && v < Math.min(...minime)) || (massime.length && v > Math.max(...massime))) return true;
    } else if (["cm", "mm", "m", "ore", "minuti", "%"].includes(g.unita)) {
      // Quantità: dentro i valori delle linee guida per la stessa unità (i tempi "ogni N" sono già guardati sopra)
      const tutti = stessi.map((x) => x.v);
      if (v < Math.min(...tutti) || v > Math.max(...tutti)) return true;
    }
  }
  // Quantità in parole: "dose intera" contro "metà dose" sì; "metà dose" contro "dose intera" è più prudente e resta (9b)
  const dose = (t: string) => (/met[àa] (?:della )?dose|dose dimezzata/i.test(t) ? "metà" : /dose (?:intera|piena|dell['’]etichetta)|doppi[ao] (?:della )?dose/i.test(t) ? "piena" : "");
  return dose(consiglio) === "piena" && dose(lg) === "metà";
}
const MENO_SPESSO_PRUDENTE = new Set(["acqua", "concime"]);

// --- Regola 9c: frasi che nominano un'altra pianta ---
const normale = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
/** Il nome come parola intera, anche al plurale ("filodendro" → "filodendri"; "pothos" resta uguale). I nomi corti
 *  solo così come sono: il plurale di "menta" sarebbe "mente", che è anche una parola comune. */
const cercaNome = (nome: string) => {
  const n = normale(nome).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![a-z])${n.length > 5 ? n.replace(/[aeio]$/, "[aeio]") : n}(?![a-z])`);
};
// "Un concime come quello per i pomodori", "terriccio per agrumi": è un prodotto, non un'altra pianta
const PRODOTTO = /concim|fertilizz|terricci|substrat|prodott/;
const PER_PRODOTTO = /(?:^|[^a-z])per\s+(?:(?:i|le|gli|la|il|lo|l')\s*)?$/;
/** Il primo nome di un'altra pianta che compare nella frase; "" se nessuno. */
export function altraPianta(frase: string, altrePiante: string[]): string {
  const f = normale(frase);
  const prodotto = PRODOTTO.test(f);
  return altrePiante.find((n) => [...f.matchAll(new RegExp(cercaNome(n), "g"))].some((m) => !(prodotto && PER_PRODOTTO.test(f.slice(0, m.index))))) ?? "";
}

// --- Regola 8b: frasi senza contenuto pratico (nel riassunto e nelle linee guida) ---
const NUCLEO_VUOTO =
  "(?:seguire|segui|rispettare|rispetta)\\s+(?:sempre\\s+)?le\\s+(?:indicazioni|istruzioni|esigenze|necessità|regole)(?!\\s+(?:dell['’]etichetta|sull['’]etichetta|riportate|del\\s+prodotto|del\\s+produttore))" +
  "|(?:indicazioni|esigenze|cure)\\s+specifiche" +
  "|attenzione\\s+(?:particolare|costante|specifica)|particolare\\s+attenzione" +
  "|cure\\s+(?:attente|adeguate|appropriate|moderate|costanti|particolari|corrette|mirate)" +
  "|con\\s+(?:divers[ei]|vari[ei]?|differenti)\\s+(?:tecniche|metodi|modi)|in\\s+(?:diversi|vari)\\s+modi|tramite\\s+(?:diversi|vari)\\s+metodi" +
  "|esiston[oa]\\s+(?:divers[ei]|vari[ei]?|più)\\s+(?:tecniche|metodi|modi)|tecniche\\s+specifiche" +
  // 2026-11-26 (falangio, Strelitzia): "tramite strutture specifiche della pianta", "dipende dalla specie specifica"
  "|(?:strutture|parti|organi|metodi)\\s+specific[ihe]|dipend\\w*\\s+dalla\\s+(?:singola\\s+)?specie";
const VUOTA = new RegExp(NUCLEO_VUOTO, "i");
// Il pezzo vuoto in coda o in mezzo alla frase, dal connettivo che lo introduce fino alla virgola o al punto
const PEZZO_VUOTO = new RegExp(`(?:,?\\s+(?:e|ma|mentre|però)\\s+|,\\s+)(?:(?!,|\\s(?:e|ma|mentre|però)\\s)[^.;])*?(?:${NUCLEO_VUOTO})[^,.;]*`, "i");
/** La frase senza il pezzo vuoto; "" se senza quello non resta niente di utile. */
export function senzaVuoto(frase: string): string {
  if (!VUOTA.test(frase)) return frase;
  const resto = frase.replace(PEZZO_VUOTO, "").trim();
  return VUOTA.test(resto) || resto.split(/\s+/).length < 4 ? "" : /[.!?]$/.test(resto) ? resto : `${resto}.`;
}

/** Sezioni senza linee guida da cui una scheda è "quasi vuota" (8c). */
const TROPPE_VUOTE = 3;
const MAX_POLLICE = 3;
const MAX_COSE = 7;
const ORDINE_COSE = ["acqua", "luce", "temperatura", "concime", "terriccio", "travaso", "problemi", "coltivarla"] as const;
const PAROLE_VUOTE = new Set(["della", "delle", "dello", "degli", "nella", "nelle", "molto", "anche", "quando", "sono", "essere", "pianta", "piante"]);
const radici = (t: string) => new Set(parole(t).filter((w) => w.length > 3 && !PAROLE_VUOTE.has(w)).map((w) => w.slice(0, 5)));
/** Due frasi dicono quasi la stessa cosa? (radici delle parole in comune, oppure una contenuta nell'altra) */
export function simili(a: string, b: string): boolean {
  // Stessi numeri (es. "tra 20 e 25 °C") = stesso consiglio detto con altre parole
  const numeri = (t: string) => (t.match(/\d+(?:[.,]\d+)?/g) ?? []).sort().join(" ");
  if (numeri(a) && numeri(a) === numeri(b)) return true;
  const x = radici(a), y = radici(b);
  if (!x.size || !y.size) return a.trim().toLowerCase() === b.trim().toLowerCase();
  const comuni = [...x].filter((w) => y.has(w)).length;
  return comuni / Math.min(x.size, y.size) >= 0.6 || comuni / new Set([...x, ...y]).size >= 0.5;
}
export function tossicitaPrudente(): SchedaGenerata["tossicita"] {
  return { persone: "non verificata", animali: "non verificata", nota: NOTE_STANDARD["non verificata"], fonti: [] };
}

export interface EsitoRegole {
  scheda: SchedaGenerata;
  verificata: boolean; // false = nessuna fonte A: scheda "non verificata"
  interventi: string[]; // correzioni applicate (si mostrano nel rapporto, non all'utente)
  bloccanti: string[]; // se non è vuoto, la scheda non si usa: si rigenera o si passa al ripiego
  copie: number;
  consigliTolti: number; // consigli dal pollice verde tolti perché la fonte non li dice
}

export function applicaRegole(
  grezza: unknown,
  fonti: Record<string, FonteData>,
  tossicitaNostra?: SchedaGenerata["tossicita"], // copiata dalle nostre fonti A (scheda del tipo, nota di famiglia)
  nomiPianta: string[] = [], // es. ["Ficus elastica", "Ficus"]: non contano come parole "importanti"
  altrePiante: string[] = [], // nomi delle altre piante (regola 9c), es. "Pothos" per la Monstera
): EsitoRegole {
  const interventi: string[] = [];
  const bloccanti: string[] = [];
  const g = (grezza ?? {}) as Partial<SchedaGenerata> & { sezioni?: Record<string, Partial<SezioneGenerata>> };
  if (typeof grezza !== "object" || grezza === null || typeof g.sezioni !== "object") {
    return { scheda: vuota(), verificata: false, interventi, bloccanti: ["formato non valido"], copie: 0, consigliTolti: 0 };
  }
  const idA = Object.keys(fonti).filter((k) => fonti[k].livello === "A");
  const verificata = idA.length > 0;
  if (!verificata) interventi.push("nessuna fonte A: scheda non verificata, linee guida 'non indicata dalle fonti'");

  const scheda: SchedaGenerata = {
    riassunto: testo(g.riassunto),
    coseDaFare: [],
    sezioni: {},
    tossicita: { persone: "non verificata", animali: "non verificata", nota: "", fonti: [] },
  };

  let consigliTolti = 0;
  for (const k of SEZIONI) {
    const s = g.sezioni?.[k] ?? {};
    const lg = (s.lineeGuida ?? {}) as Partial<SezioneGenerata["lineeGuida"]>;
    let riassunto = testo(lg.riassunto);
    let cose = elenco(lg.coseDaFare);
    // Regola 9d: il modello a volte scrive solo le "cose da fare", senza riassunto della sezione (visto il 2026-11-26 nel
    // testo grezzo: falangio, Dracaena marginata, Aloe, 8 sezioni su 8). La prima cosa da fare fa da riassunto.
    if (!riassunto && cose.length) {
      riassunto = cose.shift() as string;
      interventi.push(`${k}: riassunto della sezione mancante, usata la prima cosa da fare`);
    }
    let citate = elenco(lg.fonti).filter((id) => fonti[id]);
    const pollice = (Array.isArray(s.pollice) ? s.pollice : [])
      .map((p) => ({ consiglio: testo(p?.consiglio), fonti: elenco(p?.fonti).filter((id) => fonti[id]) }))
      .filter((p) => p.consiglio && p.fonti.length);

    // Regola 9a: il modello ha dimenticato le fonti → ogni frase si attribuisce alla fonte A che la dice davvero
    // (stesso controllo di 7d); le altre vanno nel pollice verde con Wikipedia, che poi deve confermarle (regola 6a)
    if (verificata && !citate.length && (riassunto || cose.length)) {
      // Anche le frequenze ("ogni settimana", "due volte al mese") devono essere quelle della fonte
      const stesseFrequenze = (t: string, f: string) => frequenze(t).every(([a, b]) => frequenze(f).some(([x, y]) => Math.abs(a - x) <= x * 0.05 && Math.abs(b - y) <= y * 0.05));
      const daChi = (t: string) => idA.filter((id) => ancorato(t, fonti[id].testo, nomiPianta) && numeriNelleFonti(t, fonti[id].testo) && stesseFrequenze(t, fonti[id].testo));
      const senzaDati = (t: string) => /non (è |sono )?indicat/i.test(t); // "Non indicata dalle fonti.": niente da attribuire
      riassunto = frasi(riassunto).filter((f) => !senzaDati(f)).join(" ");
      cose = cose.filter((c) => !senzaDati(c));
      const idC = Object.keys(fonti).filter((id) => fonti[id].livello === "C");
      const attribuite = new Set<string>();
      let spostate = 0;
      const tieni = (t: string) => {
        const chi = daChi(t);
        chi.forEach((id) => attribuite.add(id));
        if (!chi.length) {
          spostate++;
          if (idC.length) pollice.push({ consiglio: /[.!?]$/.test(t) ? t : `${t}.`, fonti: idC });
        }
        return chi.length > 0;
      };
      const tutte = frasi(riassunto).length + cose.length;
      riassunto = frasi(riassunto).filter(tieni).join(" ");
      cose = cose.filter(tieni);
      if (!riassunto && cose.length) riassunto = cose.shift() as string;
      citate = [...attribuite];
      if (tutte) interventi.push(`${k}: fonte dimenticata dal modello, ${tutte - spostate} frasi su ${tutte} attribuite alla fonte A, le altre nel pollice verde`);
    }

    // Regole 1 e 2: linee guida solo con fonti A; il resto va nel pollice verde
    const nonA = citate.filter((id) => fonti[id].livello !== "A");
    const soloA = citate.filter((id) => fonti[id].livello === "A");
    if ((riassunto || cose.length) && nonA.length && soloA.length) {
      // Regola 7d: fonte A e Wikipedia insieme → frase per frase: ciò che dice la fonte A resta, il resto va nel pollice
      const testoA = soloA.map((id) => fonti[id].testo).join("\n");
      const diceA = (t: string) => ancorato(t, testoA, nomiPianta) && numeriNelleFonti(t, testoA);
      const pezzi = [...frasi(riassunto), ...cose];
      const spostate = pezzi.filter((t) => !diceA(t));
      for (const t of spostate) pollice.push({ consiglio: /[.!?]$/.test(t) ? t : `${t}.`, fonti: nonA });
      riassunto = frasi(riassunto).filter(diceA).join(" ");
      cose = cose.filter(diceA);
      if (!riassunto && cose.length) riassunto = cose.shift() as string;
      interventi.push(`${k}: citate insieme fonte A e Wikipedia, tenute ${pezzi.length - spostate.length} frasi della fonte A su ${pezzi.length}`);
    } else if (riassunto && (nonA.length || !soloA.length || !verificata)) {
      if (nonA.length) {
        // Un consiglio per frase, senza doppioni (le "cose da fare" spesso ripetono il riassunto)
        const pezzi: string[] = [];
        for (const t of [...frasi(riassunto), ...cose]) {
          const f = /[.!?]$/.test(t) ? t : `${t}.`;
          const norm = f.toLowerCase().replace(/[^a-zà-ù0-9 ]/g, "");
          if (!pezzi.some((p) => p.toLowerCase().replace(/[^a-zà-ù0-9 ]/g, "").includes(norm) || norm.includes(p.toLowerCase().replace(/[^a-zà-ù0-9 ]/g, "")))) pezzi.push(f);
        }
        for (const p of pezzi) pollice.push({ consiglio: p, fonti: nonA });
        interventi.push(`${k}: contenuto con fonte C spostato nei consigli dal pollice verde`);
      } else interventi.push(`${k}: linee guida senza fonte A, tolte`);
      riassunto = "";
      cose = [];
    }
    // Numeri delle linee guida: devono comparire nelle fonti A citate, altrimenti la frase si toglie
    if (riassunto) {
      const testoFonti = soloA.map((id) => fonti[id].testo).join(" ");
      const righeFonti = soloA.map((id) => fonti[id].testo).join("\n");
      const ok = (t: string) => numeriNelleFonti(t, testoFonti) && significatoOk(t, righeFonti);
      const prima = frasi(riassunto).length + cose.length;
      riassunto = frasi(riassunto).filter(ok).join(" ");
      cose = cose.filter(ok);
      if (frasi(riassunto).length + cose.length < prima) interventi.push(`${k}: tolte frasi con numeri non presenti nelle fonti, o con un altro significato`);
    }
    if (riassunto) {
      const conDati = frasi(riassunto).filter((f) => !/non (è |sono )?indicat/i.test(f));
      if (conDati.length && conDati.length < frasi(riassunto).length) {
        riassunto = conDati.join(" ");
        interventi.push(`${k}: tolta la frase "non è indicata…" (il testo dà già i dati)`);
      }
      cose = cose.filter((c) => !/non (è |sono )?indicat/i.test(c));
    }
    const lineeGuida = riassunto ? { riassunto, coseDaFare: cose, fonti: soloA } : { riassunto: NON_INDICATA, coseDaFare: [] as string[], fonti: [] as string[] };
    const testoDi = (ids: string[]) => ids.map((id) => fonti[id]?.testo ?? "").join(" ");
    const tenuti: SezioneGenerata["pollice"] = [];
    let tolti = 0;
    let spostati = 0;
    for (const c of pollice) {
      const a = c.fonti.filter((id) => fonti[id].livello === "A");
      if (a.length === c.fonti.length && verificata) {
        // Regola 6b: cita solo fonti A → non è un consiglio "non ufficiale": va nelle linee guida (se la fonte lo dice)
        if (ancorato(c.consiglio, testoDi(a), nomiPianta) && !lineeGuida.coseDaFare.some((x) => simili(x, c.consiglio))) {
          if (lineeGuida.riassunto === NON_INDICATA) lineeGuida.riassunto = c.consiglio;
          else lineeGuida.coseDaFare.push(c.consiglio);
          lineeGuida.fonti = [...new Set([...lineeGuida.fonti, ...a])];
          spostati++;
        } else tolti++;
        continue;
      }
      const soloC = c.fonti.filter((id) => fonti[id].livello !== "A");
      // Regola 6a: il consiglio deve essere davvero nella fonte citata
      if (ancorato(c.consiglio, testoDi(soloC), nomiPianta)) tenuti.push({ consiglio: c.consiglio, fonti: soloC });
      else tolti++;
    }
    if (spostati) interventi.push(`${k}: ${spostati} consigli con fonte A spostati nelle linee guida`);
    if (tolti) interventi.push(`${k}: ${tolti} consigli dal pollice verde tolti perché la fonte citata non li dice`);
    consigliTolti += tolti;
    scheda.sezioni[k] = { lineeGuida, pollice: tenuti };
  }

  // Regola 4a: niente tossicità nel testo libero (riassunto, cose da fare, sezioni, pollice)
  const pulisci = (t: string, dove: string) => {
    const tenute = frasi(t).filter((f) => !PAROLE_TOSSICITA.test(f));
    if (tenute.length < frasi(t).length) interventi.push(`${dove}: tolta una frase sulla tossicità`);
    return tenute.join(" ");
  };
  scheda.riassunto = pulisci(scheda.riassunto, "riassunto");
  // Riassunto generale senza numeri (2026-11-19): il modello mescolava minima e ideale ("tra 10 e 30 °C").
  // I numeri stanno solo nelle sezioni, dove sono controllati con le fonti.
  // Dal 2026-11-22 anche le misure scritte in lettere ("un metro e mezzo", "due settimane").
  {
    const tutte = frasi(scheda.riassunto);
    const senza = tutte.filter((f) => !/\d/.test(f) && !MISURA_IN_LETTERE.test(f));
    if (senza.length < tutte.length) interventi.push("riassunto: tolte le frasi con numeri o misure (i numeri stanno solo nelle sezioni)");
    scheda.riassunto = senza.join(" ");
  }
  for (const k of SEZIONI) {
    const s = scheda.sezioni[k];
    if (s.lineeGuida.riassunto !== NON_INDICATA) s.lineeGuida.riassunto = pulisci(s.lineeGuida.riassunto, `${k}`) || NON_INDICATA;
    s.lineeGuida.coseDaFare = s.lineeGuida.coseDaFare.filter((c) => !PAROLE_TOSSICITA.test(c));
    s.pollice = s.pollice.filter((p) => !PAROLE_TOSSICITA.test(p.consiglio));
  }

  // Regola 7c: promesse e frasi sull'app o sulle schede, ovunque (nel pollice verde per prudenza)
  const ammessa = (t: string) => !PROMESSE.test(t) && !PARLA_DELL_APP.test(t);
  const senzaPromesse = (t: string, dove: string) => {
    const tenute = frasi(t).filter(ammessa);
    if (tenute.length < frasi(t).length) interventi.push(`${dove}: tolta una promessa o una frase sull'app`);
    return tenute.join(" ");
  };
  scheda.riassunto = senzaPromesse(scheda.riassunto, "riassunto");
  for (const k of SEZIONI) {
    const { lineeGuida: lg } = scheda.sezioni[k];
    const quante = lg.coseDaFare.length + scheda.sezioni[k].pollice.length;
    if (lg.riassunto !== NON_INDICATA) lg.riassunto = senzaPromesse(lg.riassunto, k);
    lg.coseDaFare = lg.coseDaFare.filter(ammessa);
    scheda.sezioni[k].pollice = scheda.sezioni[k].pollice.filter((p) => ammessa(p.consiglio));
    if (lg.coseDaFare.length + scheda.sezioni[k].pollice.length < quante) interventi.push(`${k}: tolta una promessa o una frase sull'app`);
    if (!lg.riassunto) lg.riassunto = lg.coseDaFare.shift() ?? NON_INDICATA;
  }

  // Regola 9c: frasi che nominano un'altra pianta, salvo che una fonte su QUESTA pianta (non generale) la nomini
  const testoSpecifico = normale(Object.values(fonti).filter((f) => !f.generale).map((f) => f.testo).join("\n"));
  const nominaAltra = (t: string) => {
    const n = altraPianta(t, altrePiante);
    return Boolean(n) && !cercaNome(n).test(testoSpecifico);
  };
  // Si toglie solo il pezzo di frase (tra virgole) che parla dell'altra pianta; se non resta niente di utile, tutta la frase
  const togliAltra = (t: string): string => {
    if (!nominaAltra(t)) return t;
    const resto = t.replace(/[.!?]$/, "").split(/,\s+|;\s*/).filter((x) => !nominaAltra(x)).join(", ").replace(/^(?:e|ma|mentre|però)\s+/i, "").trim();
    return resto.split(/\s+/).length >= 4 && !nominaAltra(resto) ? `${resto.charAt(0).toUpperCase()}${resto.slice(1)}.` : "";
  };
  const senzaAltre = (t: string, dove: string) => {
    const dopo = frasi(t).map(togliAltra).filter(Boolean).join(" ");
    if (dopo !== frasi(t).join(" ")) interventi.push(`${dove}: tolta una frase che parla di un'altra pianta`);
    return dopo;
  };
  scheda.riassunto = senzaAltre(scheda.riassunto, "riassunto");
  for (const k of SEZIONI) {
    const { lineeGuida: lg } = scheda.sezioni[k];
    if (lg.riassunto !== NON_INDICATA) lg.riassunto = senzaAltre(lg.riassunto, k);
    const prima = JSON.stringify([lg.coseDaFare, scheda.sezioni[k].pollice]);
    lg.coseDaFare = lg.coseDaFare.map(togliAltra).filter(Boolean);
    scheda.sezioni[k].pollice = scheda.sezioni[k].pollice.map((p) => ({ ...p, consiglio: togliAltra(p.consiglio) })).filter((p) => p.consiglio);
    if (JSON.stringify([lg.coseDaFare, scheda.sezioni[k].pollice]) !== prima) interventi.push(`${k}: tolto un pezzo che parla di un'altra pianta`);
    if (!lg.riassunto) lg.riassunto = lg.coseDaFare.shift() ?? NON_INDICATA;
  }

  // Regola 8b: frasi (o pezzi di frase) senza contenuto pratico
  const senzaVuote = (t: string, dove: string) => {
    const dopo = frasi(t).map(senzaVuoto).filter(Boolean).join(" ");
    if (dopo !== frasi(t).join(" ")) interventi.push(`${dove}: tolto un pezzo senza contenuto pratico`);
    return dopo;
  };
  scheda.riassunto = senzaVuote(scheda.riassunto, "riassunto");
  for (const k of SEZIONI) {
    const { lineeGuida: lg } = scheda.sezioni[k];
    if (lg.riassunto !== NON_INDICATA) lg.riassunto = senzaVuote(lg.riassunto, k);
    lg.coseDaFare = lg.coseDaFare.map(senzaVuoto).filter(Boolean);
    if (!lg.riassunto) lg.riassunto = lg.coseDaFare.shift() ?? NON_INDICATA;
  }

  // Regola 7b: moltiplicazione nota solo per il tipo di pianta → si dichiara generale, e non va tra le cose da fare in cima
  const moltiplica = scheda.sezioni.coltivarla.lineeGuida;
  const coltivarlaGenerale = moltiplica.fonti.length > 0 && moltiplica.fonti.every((id) => fonti[id]?.generale);
  if (coltivarlaGenerale && moltiplica.riassunto !== NON_INDICATA) {
    moltiplica.riassunto = `${PER_MOLTE}${minuscola(moltiplica.riassunto)} ${NON_DETTO}`;
    moltiplica.coseDaFare = moltiplica.coseDaFare.map((c) => `In generale: ${minuscola(c)}`);
    interventi.push("coltivarla: dichiarata indicazione generale per il tipo di pianta");
  }
  if (coltivarlaGenerale) {
    const tenute = frasi(scheda.riassunto).filter((f) => !PARLA_DI_MOLTIPLICAZIONE.test(f));
    if (tenute.length < frasi(scheda.riassunto).length) interventi.push("riassunto: tolte le frasi sulla moltiplicazione (note solo per il tipo)");
    scheda.riassunto = tenute.join(" ");
  }

  // Regola 7e: un consiglio del pollice verde deve dire cosa fare
  for (const k of SEZIONI) {
    const tenuti = scheda.sezioni[k].pollice.filter((p) => diceCosaFare(p.consiglio));
    const tolti = scheda.sezioni[k].pollice.length - tenuti.length;
    if (tolti) interventi.push(`${k}: ${tolti} consigli dal pollice verde tolti perché non dicono cosa fare`);
    consigliTolti += tolti;
    scheda.sezioni[k].pollice = tenuti;
  }

  // Regola 8a: pollice verde in contrasto con le linee guida della stessa sezione
  for (const k of SEZIONI) {
    const { lineeGuida: lg, pollice } = scheda.sezioni[k];
    if (lg.riassunto === NON_INDICATA) continue;
    const tenuti = pollice.filter((p) => !contrasta(p.consiglio, [lg.riassunto, ...lg.coseDaFare], k));
    const tolti = pollice.length - tenuti.length;
    if (tolti) interventi.push(`${k}: ${tolti} consigli dal pollice verde tolti perché in contrasto con le linee guida`);
    consigliTolti += tolti;
    scheda.sezioni[k].pollice = tenuti;
  }

  // Regola 4b (2026-11-19): la tossicità NON la scrive il modello: si copia dalle nostre fonti A
  scheda.tossicita = verificata && tossicitaNostra ? tossicitaNostra : tossicitaPrudente();

  // Consigli dal pollice verde: niente doppioni o frasi quasi uguali, al massimo 3 per sezione
  for (const k of SEZIONI) {
    const tenuti: SezioneGenerata["pollice"] = [];
    // Si tiene l'ordine del modello; un consiglio che ripete una parte di un altro si toglie,
    // e se un consiglio nuovo CONTIENE uno già tenuto, prende il suo posto (è più completo)
    for (const c of scheda.sezioni[k].pollice) {
      if (tenuti.some((t) => simili(t.consiglio, c.consiglio) || giaContenuto(c.consiglio, t.consiglio, nomiPianta))) continue;
      const i = tenuti.findIndex((t) => giaContenuto(t.consiglio, c.consiglio, nomiPianta));
      if (i >= 0) tenuti[i] = c;
      else tenuti.push(c);
    }
    if (tenuti.length < scheda.sezioni[k].pollice.length || tenuti.length > MAX_POLLICE) interventi.push(`${k}: consigli dal pollice verde ripetuti o troppi, ridotti`);
    scheda.sezioni[k].pollice = tenuti.slice(0, MAX_POLLICE);
  }

  // "Cose da fare" in cima: non le scrive il modello. Si prendono dalle linee guida con fonte A (max 7, senza doppioni)
  scheda.coseDaFare = [];
  if (verificata) {
    const liste = ORDINE_COSE.map((k) => (scheda.sezioni[k].lineeGuida.fonti.length && !(k === "coltivarla" && coltivarlaGenerale) ? [...scheda.sezioni[k].lineeGuida.coseDaFare] : []));
    for (let giro = 0; scheda.coseDaFare.length < MAX_COSE && liste.some((l) => l.length); giro++) {
      for (const l of liste) {
        const c = l.shift();
        if (c && scheda.coseDaFare.length < MAX_COSE && !scheda.coseDaFare.some((x) => simili(x, c))) scheda.coseDaFare.push(c);
      }
    }
  }

  // Regola 1: senza fonti A, in cima niente consigli presentati come ufficiali (venivano da Wikipedia)
  if (!verificata) {
    scheda.riassunto = RIASSUNTO_NON_VERIFICATA;
  }

  // Completezza minima
  if (!scheda.riassunto) bloccanti.push("riassunto vuoto");
  // Regola 8c: scheda quasi vuota
  const vuote = SEZIONI.filter((k) => scheda.sezioni[k].lineeGuida.riassunto === NON_INDICATA).length;
  if (vuote >= TROPPE_VUOTE && Object.values(fonti).some((f) => f.copreTutto)) bloccanti.push(`${QUASI_VUOTA}: ${vuote} sezioni su ${SEZIONI.length} senza linee guida`);

  // Regola 3: anti-copia rispetto alle fonti C (Wikipedia)
  const nostri = ottetti(parole(JSON.stringify(scheda)));
  let copie = 0;
  for (const f of Object.values(fonti)) if (f.livello === "C") copie += [...nostri].filter((o) => ottetti(parole(f.testo)).has(o)).length;
  if (copie) bloccanti.push(`copia: ${copie} sequenze di 8 parole uguali a Wikipedia`);

  return { scheda, verificata, interventi, bloccanti, copie, consigliTolti };
}

function vuota(): SchedaGenerata {
  return {
    riassunto: "",
    coseDaFare: [],
    sezioni: Object.fromEntries(SEZIONI.map((k) => [k, { lineeGuida: { riassunto: NON_INDICATA, coseDaFare: [], fonti: [] }, pollice: [] }])),
    tossicita: tossicitaPrudente(),
  };
}
