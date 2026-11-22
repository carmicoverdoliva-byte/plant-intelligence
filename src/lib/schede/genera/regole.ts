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

export type LivelloFonte = "A" | "C";
export interface FonteData {
  livello: LivelloFonte;
  titolo: string;
  url?: string;
  testo: string;
}
export type Tossicita = "tossica" | "varia" | "non verificata" | "non tossica";

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
export const NON_INDICATA = "Non indicata dalle fonti.";
export const RIASSUNTO_NON_VERIFICATA =
  "Per questa pianta non abbiamo ancora fonti verificate: qui sotto trovi solo consigli non ufficiali, presi da Wikipedia. Usali con prudenza.";

const NOTE_STANDARD: Record<Tossicita, string> = {
  tossica: "Le nostre fonti la indicano tossica: tienila lontana da bambini e animali.",
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
  return paroleImportanti(consiglio, escluse).filter((r) => nellaFonte.has(r)).length >= 2 && numeriConContesto(consiglio, testoFonti, escluse);
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
    const citate = elenco(lg.fonti).filter((id) => fonti[id]);
    const pollice = (Array.isArray(s.pollice) ? s.pollice : [])
      .map((p) => ({ consiglio: testo(p?.consiglio), fonti: elenco(p?.fonti).filter((id) => fonti[id]) }))
      .filter((p) => p.consiglio && p.fonti.length);

    // Regole 1 e 2: linee guida solo con fonti A; il resto va nel pollice verde
    const nonA = citate.filter((id) => fonti[id].livello !== "A");
    const soloA = citate.filter((id) => fonti[id].livello === "A");
    if (riassunto && (nonA.length || !soloA.length || !verificata)) {
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
      const ok = (t: string) => numeriNelleFonti(t, testoFonti);
      const prima = frasi(riassunto).length + cose.length;
      riassunto = frasi(riassunto).filter(ok).join(" ");
      cose = cose.filter(ok);
      if (frasi(riassunto).length + cose.length < prima) interventi.push(`${k}: tolte frasi con numeri non presenti nelle fonti`);
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
    const liste = ORDINE_COSE.map((k) => (scheda.sezioni[k].lineeGuida.fonti.length ? [...scheda.sezioni[k].lineeGuida.coseDaFare] : []));
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
