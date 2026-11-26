// Prova delle regole delle schede generate (R2) su casi costruiti: nessuna rete, nessun consumo.
// Uso: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/app/prova-regole-r2.mjs
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { altraPianta, applicaRegole, contrasta, diceCosaFare, frequenze, senzaVuoto, NON_INDICATA, PARLA_DELL_APP, PER_MOLTE, PROMESSE, SEZIONI, significatoOk } from "../../src/lib/schede/genera/regole.ts";
import { altrePiante } from "../../src/lib/schede/genera/altre-piante.ts";
import { NOTA_PRUDENTE, tossicitaPerPianta } from "../../src/lib/schede/tossicita.ts";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
// fonti.ts e servizio.ts usano l'alias "@/" e import senza estensione: si caricano con jiti, come in prova-identify.mjs
const jiti = createRequire(import.meta.url)("jiti").createJiti(import.meta.url, { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } });
const { tossicitaNostra } = await jiti.import("../../src/lib/schede/genera/fonti.ts");
const { improntaFontiA } = await jiti.import("../../src/lib/schede/genera/servizio.ts");
import { leggiJson } from "../../src/lib/schede/genera/json.ts";
import { testoPerRegistro, valoriSegreti } from "../../src/lib/schede/genera/registro.ts";
import { chiaveScheda, FILE_REGOLE, IMPRONTA_REGOLE, VERSIONE_REGOLE } from "../../src/lib/schede/genera/versione-regole.ts";
import { giornoItaliano, prossimaMezzanotteItaliana } from "../../src/lib/giorno-italiano.ts";

let fatti = 0, errori = 0;
const ok = (c, d) => { fatti++; if (!c) errori++; console.log(`${c ? "✓" : "✗"} ${d}`); };

const wiki = "Il basilico è una pianta erbacea annuale della famiglia delle Lamiaceae originaria dell'India e coltivata in tutto il mondo per le foglie aromatiche. " +
  "Ama il sole pieno e cresce bene tra 20 e 25 °C. Teme il freddo e va riparato dal vento; d'estate sopporta il pieno sole. " +
  "Si moltiplica per talea apicale o per margotta; può soffrire di antracnosi.";
const fontiConA = {
  S1: { livello: "A", titolo: "tipo", testo: "Minima 10 °C. Annaffia quando il terriccio è asciutto. Concime ogni 2 mesi." },
  S3: { livello: "C", titolo: "Wikipedia", testo: wiki },
};
const fontiSoloC = { S3: fontiConA.S3 };
const sez = (lg, pollice = []) => ({ lineeGuida: lg, pollice });
const base = (extra = {}) => ({
  riassunto: "Pianta facile da coltivare con molta luce.",
  coseDaFare: ["Annaffia con regolarità."],
  sezioni: Object.fromEntries(SEZIONI.map((k) => [k, sez({ riassunto: "Annaffia quando il terriccio è asciutto.", coseDaFare: ["Controlla il terriccio."], fonti: ["S1"] })])),
  tossicita: { persone: "non verificata", animali: "non verificata", nota: "Non abbiamo dati verificati.", fonti: [] },
  ...extra,
});

// Regola 2: fonte C nelle linee guida → spostata nel pollice verde
let s = base();
s.sezioni.luce = sez({ riassunto: "Mettilo in sole pieno.", coseDaFare: [], fonti: ["S3"] });
let e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.luce.lineeGuida.riassunto === NON_INDICATA && e.scheda.sezioni.luce.pollice.some((p) => p.consiglio.includes("sole pieno") && p.fonti.includes("S3")),
  "Regola 2: contenuto con fonte C spostato nei consigli dal pollice verde");

// Regola 1: nessuna fonte A → non verificata, linee guida "non indicata dalle fonti"
e = applicaRegole(base(), fontiSoloC);
ok(!e.verificata && SEZIONI.every((k) => e.scheda.sezioni[k].lineeGuida.riassunto === NON_INDICATA), "Regola 1: senza fonti A la scheda è non verificata e le linee guida dicono 'non indicata dalle fonti'");
ok(/non abbiamo ancora fonti verificate/.test(e.scheda.riassunto) && e.scheda.coseDaFare.length === 0, "Regola 1: senza fonti A, in cima nessun consiglio presentato come ufficiale");

// Numeri non presenti nelle fonti A → frase tolta
s = base();
s.sezioni.temperatura = sez({ riassunto: "La minima è 10 °C. Sta bene fino a 35 °C.", coseDaFare: [], fonti: ["S1"] });
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.temperatura.lineeGuida.riassunto === "La minima è 10 °C.", "Numeri: tolta la frase con un numero (35) assente dalle fonti A");

// Regola 4a: tossicità nel testo libero → tolta
s = base({ riassunto: "Pianta tropicale da appartamento. Non è tossica in modo definitivo, ma può irritare.", coseDaFare: ["Tienila lontana dai gatti perché è velenosa.", "Annaffia poco."] });
e = applicaRegole(s, fontiConA);
ok(!/tossic|irrit/i.test(e.scheda.riassunto) && e.scheda.riassunto === "Pianta tropicale da appartamento.", "Regola 4: tolta dal riassunto la frase 'non è tossica in modo definitivo'");
ok(!e.scheda.coseDaFare.some((c) => /velenos|tossic/i.test(c)), "Regola 4: nelle cose da fare nessuna voce sulla tossicità");

// Regola 4b (2026-11-19): la tossicità si copia dalle nostre fonti A, qualunque cosa scriva il modello
const nostra = { persone: "non verificata", animali: "non tossica", nota: "La Phalaenopsis non è tossica per cani e gatti (due fonti).", fonti: ["S1"] };
s = base({ tossicita: { persone: "tossica", animali: "tossica", nota: "Velenosa!", fonti: ["S3"] } });
e = applicaRegole(s, fontiConA, nostra);
ok(e.scheda.tossicita.animali === "non tossica" && e.scheda.tossicita.nota === nostra.nota, "Regola 4: tossicità copiata dalle nostre fonti A (anche 'non tossica' verificata), ignorando il modello");
e = applicaRegole(base(), fontiSoloC, nostra);
ok(e.scheda.tossicita.persone === "non verificata" && e.scheda.tossicita.animali === "non verificata" && /prudenza/.test(e.scheda.tossicita.nota), "Regola 4: senza fonti A → 'non verificata' con la nota prudente");

// Cose da fare in cima: dal codice, solo dalle linee guida con fonte A, max 7, senza doppioni
s = base({ coseDaFare: ["Mantieni 16-30 °C (da Wikipedia)."] });
s.sezioni.acqua = sez({ riassunto: "Annaffia quando il terriccio è asciutto.", coseDaFare: ["Controlla il terriccio con un dito.", "Svuota il sottovaso."], fonti: ["S1"] });
s.sezioni.luce = sez({ riassunto: "Luce viva.", coseDaFare: ["Mettila vicino a una finestra luminosa."], fonti: ["S3"] });
e = applicaRegole(s, fontiConA);
ok(!e.scheda.coseDaFare.some((c) => /16-30|finestra luminosa/.test(c)), "Cose da fare: niente testo libero del modello né voci con fonte C");
ok(e.scheda.coseDaFare.includes("Controlla il terriccio con un dito.") && e.scheda.coseDaFare.length <= 7, "Cose da fare: prese dalle linee guida con fonte A, al massimo 7");
ok(new Set(e.scheda.coseDaFare).size === e.scheda.coseDaFare.length && e.scheda.coseDaFare.filter((c) => /terriccio/.test(c)).length === 1, "Cose da fare: senza doppioni");
e = applicaRegole(base(), fontiSoloC);
ok(e.scheda.coseDaFare.length === 0, "Cose da fare: vuote se la scheda è non verificata");

// Pollice verde: doppioni e frasi quasi uguali tolti, max 3 per sezione
s = base();
s.sezioni.temperatura = sez({ riassunto: NON_INDICATA, coseDaFare: [], fonti: [] }, [
  { consiglio: "Coltivalo al sole: cresce bene tra 20 e 25 °C.", fonti: ["S3"] },
  { consiglio: "Mantieni temperature tra 20 e 25 °C.", fonti: ["S3"] },
  { consiglio: "Teme il freddo: proteggilo d'inverno.", fonti: ["S3"] },
  { consiglio: "Tienilo in un posto riparato dal vento.", fonti: ["S3"] },
  { consiglio: "D'estate può stare in pieno sole.", fonti: ["S3"] },
]);
e = applicaRegole(s, fontiConA);
const pt = e.scheda.sezioni.temperatura.pollice.map((p) => p.consiglio);
ok(pt.length <= 3 && pt.filter((c) => /20 e 25/.test(c)).length === 1, `Pollice verde: senza frasi quasi uguali e al massimo 3 (${pt.length})`);

// Regola 6a: consigli dal pollice verde ancorati alla fonte (almeno 2 parole importanti presenti nella fonte citata)
s = base();
s.sezioni.coltivarla = sez({ riassunto: NON_INDICATA, coseDaFare: [], fonti: [] }, [
  { consiglio: "Moltiplicalo con una talea apicale o con la margotta.", fonti: ["S3"] },
  { consiglio: "Usa una lampada per piante e un insetticida biologico.", fonti: ["S3"] },
  { consiglio: "Scegli una pianta madre sana.", fonti: ["S3"] },
]);
e = applicaRegole(s, fontiConA, undefined, ["Ocimum basilicum", "Ocimum"]);
const pc = e.scheda.sezioni.coltivarla.pollice.map((p) => p.consiglio);
ok(pc.length === 1 && /talea apicale/.test(pc[0]), "Regola 6a: tenuto il consiglio vero (talea apicale, margotta), tolti quelli inventati");
ok(e.consigliTolti === 2, `Regola 6a: conteggio dei consigli tolti (${e.consigliTolti})`);

// Regola 6b: un consiglio che cita una fonte A va nelle linee guida, non nel pollice verde
s = base();
s.sezioni.concime = sez({ riassunto: "Concima nella stagione di crescita.", coseDaFare: [], fonti: ["S1"] }, [
  { consiglio: "Concime ogni 2 mesi, con il terriccio asciutto annaffiato prima.", fonti: ["S1"] },
]);
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.concime.pollice.length === 0 && e.scheda.sezioni.concime.lineeGuida.coseDaFare.some((c) => /ogni 2 mesi/.test(c)),
  "Regola 6b: consiglio con fonte A spostato nelle cose da fare delle linee guida");

// Numeri per intervalli interi: "16-30" deve comparire così nella fonte
s = base();
s.sezioni.temperatura = sez({ riassunto: "Sta bene tra 16-30 °C. La minima è 10 °C.", coseDaFare: [], fonti: ["S1"] });
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.temperatura.lineeGuida.riassunto === "La minima è 10 °C.", "Numeri: l'intervallo 16-30 non presente nella fonte A viene tolto");

// 1a (2026-11-19): consiglio che ripete una parte di un altro → tolto (Ficus: margotta / talea apicale)
s = base();
s.sezioni.coltivarla = sez({ riassunto: NON_INDICATA, coseDaFare: [], fonti: [] }, [
  { consiglio: "Moltiplicalo per margotta o talea apicale.", fonti: ["S3"] },
  { consiglio: "Moltiplicare con la margotta.", fonti: ["S3"] },
  { consiglio: "Usare la talea apicale per la propagazione.", fonti: ["S3"] },
]);
e = applicaRegole(s, fontiConA, undefined, ["Ocimum basilicum", "Ocimum"]);
ok(e.scheda.sezioni.coltivarla.pollice.length === 1 && /margotta o talea apicale/.test(e.scheda.sezioni.coltivarla.pollice[0].consiglio),
  "Doppioni: tenuto solo il consiglio più completo (margotta o talea apicale)");

// 1b: niente "non è indicata…" quando il testo dà già il dato
s = base();
s.sezioni.temperatura = sez({ riassunto: "La minima è 10 °C. Non è indicata la temperatura massima.", coseDaFare: [], fonti: ["S1"] });
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.temperatura.lineeGuida.riassunto === "La minima è 10 °C.", "Linee guida: tolta 'Non è indicata la temperatura massima' dopo il dato");

// Riassunto generale senza numeri (Monstera: "tra 10 e 30 °C" mescolava minima e ideale)
s = base({ riassunto: "Pianta rampicante da casa. Sta bene a temperature tra 10 e 30 °C." });
e = applicaRegole(s, fontiConA);
ok(e.scheda.riassunto === "Pianta rampicante da casa.", "Riassunto generale: tolte le frasi con numeri");
// …anche le misure scritte in lettere (albero di giada: "un metro e mezzo", da Wikipedia), ma non "una volta" o "una gradevole"
s = base({ riassunto: "Succulenta facile da casa. In vaso arriva a un metro e mezzo. Riposa per due settimane dopo il travaso. Annaffiala una volta che il terriccio è asciutto. Ha una gradevole forma ad alberello." });
e = applicaRegole(s, fontiConA);
ok(e.scheda.riassunto === "Succulenta facile da casa. Annaffiala una volta che il terriccio è asciutto. Ha una gradevole forma ad alberello.",
  "Riassunto generale: tolte le misure in lettere ('un metro e mezzo', 'due settimane'), tenute 'una volta' e 'una gradevole'");

// Numeri nel pollice verde: devono stare nella fonte, in una frase che parla della stessa cosa
const wikiFiori = "Le foglie sono ovali. L'infiorescenza può sembrare composta da 6 fiori, il petalo è lungo 4–6 mm. Cresce a pieno sole.";
const fontiFiori = { S1: fontiConA.S1, S3: { livello: "C", titolo: "Wikipedia", testo: wikiFiori } };
s = base();
s.sezioni.luce = sez({ riassunto: NON_INDICATA, coseDaFare: [], fonti: [] }, [
  { consiglio: "Esponi la pianta a pieno sole per almeno 6 ore al giorno.", fonti: ["S3"] },
  { consiglio: "Mettila a pieno sole, dove cresce bene.", fonti: ["S3"] },
]);
e = applicaRegole(s, fontiFiori);
const pl = e.scheda.sezioni.luce.pollice.map((p) => p.consiglio);
ok(pl.length === 1 && !pl[0].includes("6 ore"), "Pollice: '6 ore di sole' tolto (nella fonte il 6 parla di fiori e mm)");
s = base();
s.sezioni.temperatura = sez({ riassunto: "Minima 10 °C.", coseDaFare: [], fonti: ["S1"] });
s.sezioni.temperatura.lineeGuida.riassunto = "Sopporta 1 °C.";
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.temperatura.lineeGuida.riassunto === NON_INDICATA, "Numeri: '1' non vale dentro '10' (numero a sé)");

// Regola 3: anti-copia (8 parole uguali a Wikipedia)
s = base();
s.sezioni.coltivarla = sez({ riassunto: NON_INDICATA, coseDaFare: [], fonti: [] }, [{ consiglio: "Coltivalo: è una pianta erbacea annuale della famiglia delle Lamiaceae originaria dell'India.", fonti: ["S3"] }]);
e = applicaRegole(s, fontiConA);
ok(e.bloccanti.some((b) => b.startsWith("copia")), "Regola 3: una sequenza di 8 parole uguale a Wikipedia blocca la scheda (si rigenera)");

// --- Versione 2 delle regole (2026-11-25): difetti trovati rileggendo le prime 24 schede ---
// 7a. Il significato dei numeri, con la fonte VERA della Monstera (scheda del tipo "rampicanti")
const righeTipo = (f) => {
  const j = JSON.parse(readFileSync(new URL(`../../src/data/schede/tipi/${f}.json`, import.meta.url), "utf8"));
  return Object.values(j.sezioni).map((x) => `${x.lineeGuida.riassunto} Cose da fare: ${x.lineeGuida.coseDaFare.join("; ")}.\n${(x.lineeGuida.valori ?? []).map((v) => `  - ${v.etichetta}: ${v.valore}`).join("\n")}`).join("\n");
};
const ramp = righeTipo("rampicanti-tropicali"), foglia = righeTipo("foglia-tropicale"), grasse = righeTipo("succulente"), orch = righeTipo("orchidee");
const MONSTERA = "Mantieni la temperatura tra i 10 e i 13 °C per evitare che la crescita si blocchi o la pianta si rovini.";
ok(!significatoOk(MONSTERA, ramp), "7a: frase sbagliata della Monstera ('mantieni tra i 10 e i 13 °C') rifiutata: nella fonte è la minima");
ok(!significatoOk("Tienila tra 10 e 13 °C.", foglia), "7a: rifiutata anche con la fonte delle piante da foglia, dove 10-13 è la minima");
for (const t of ["La minima è 10-13 °C.", "Non farla scendere sotto i 10 °C.", "Tienila sopra i 10 °C.", "Non lasciarla a temperature inferiori ai 10 °C."])
  ok(significatoOk(t, ramp), `7a: accettata "${t}"`);
ok(significatoOk("Tienila tra 16 e 30 °C.", ramp), "7a: l'intervallo ideale non è una minima e resta");
ok(!significatoOk("La minima è 16 °C.", ramp), "7a: un numero 'ideale' non può diventare una minima");
ok(significatoOk("Riportala in casa quando di notte si scende verso i 13 °C.", foglia) && significatoOk("I danni possono arrivare già tra i 4 e i 10 °C.", foglia), "7a: soglie di freddo e di danno dette bene restano");
ok(!significatoOk("Mantieni tra 4 e 10 °C per evitare danni.", foglia), "7a: una soglia di danno non può diventare un consiglio");
ok(!significatoOk("Dalle 4 ore di sole.", grasse) && significatoOk("Dalle almeno 4 ore di sole.", grasse), "7a: 'almeno 4 ore' deve restare 'almeno'");
ok(significatoOk("Di notte non deve scendere sotto i 16 °C, di giorno va bene tra 19 e 30 °C.", orch) && significatoOk("La massima è circa 30 °C.", orch), "7a: orchidea, minima e massima giuste");
ok(!significatoOk("Tienila in un vaso 10 °C più largo.", ramp.replace(/.*10.*°C.*\n?/g, "")), "7a: stesso numero con un'altra unità (cm invece di °C) non vale");
s = base();
s.sezioni.temperatura = sez({ riassunto: "Teme il freddo.", coseDaFare: [MONSTERA, "Tienila lontana dagli spifferi."], fonti: ["S1"] });
e = applicaRegole(s, { S1: { livello: "A", titolo: "tipo", testo: ramp } });
ok(e.scheda.sezioni.temperatura.lineeGuida.coseDaFare.join() === "Tienila lontana dagli spifferi." && !JSON.stringify(e.scheda).includes("10 e i 13"), "7a: nella scheda la frase della Monstera sparisce, le altre restano");

// 7b. Moltiplicazione nota solo per il tipo di pianta
const fontiTipo = { S1: { ...fontiConA.S1, generale: true }, S3: fontiConA.S3 };
s = base({ riassunto: "Pianta da casa. Si moltiplica facilmente per talea." });
s.sezioni.coltivarla = sez({ riassunto: "La propagazione avviene tramite talea.", coseDaFare: ["Taglia una talea con un nodo."], fonti: ["S1"] });
e = applicaRegole(s, fontiTipo);
const colt = e.scheda.sezioni.coltivarla.lineeGuida;
ok(colt.riassunto.startsWith(PER_MOLTE + "la propagazione") && /Non è detto/.test(colt.riassunto) && colt.coseDaFare[0] === "In generale: taglia una talea con un nodo.", "7b: moltiplicazione del solo tipo → 'Per molte piante di questo tipo: …'");
ok(!e.scheda.coseDaFare.some((c) => /talea/.test(c)) && e.scheda.riassunto === "Pianta da casa.", "7b: non compare tra le cose da fare in cima né nel riassunto");
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.coltivarla.lineeGuida.riassunto === "La propagazione avviene tramite talea.", "7b: con una fonte della specie la frase resta com'è");

// 7c. Promesse e frasi sull'app
for (const t of ["Può purificare l'aria degli ambienti chiusi.", "Migliora la qualità dell'aria.", "Si dice che porti fortuna.", "Il gel ha proprietà lenitive.", "È usata come pianta medicinale."]) ok(PROMESSE.test(t), `7c: promessa riconosciuta "${t}"`);
for (const t of ["I problemi dipendono dall'acqua e dalla qualità dell'aria.", "Usa acqua depurata.", "Preferisce la luce filtrata.", "Il sole diretto causa scottature sulle foglie."]) ok(!PROMESSE.test(t), `7c: frase normale lasciata "${t}"`);
ok(PARLA_DELL_APP.test("Per la moltiplicazione, consulta la scheda specifica della specie quando sarà pronta."), "7c: frase sulle schede riconosciuta (falangio)");
s = base({ riassunto: "Pianta facile. Può purificare l'aria." });
s.sezioni.luce = sez({ riassunto: "Luce viva con terriccio asciutto. Porta fortuna in casa.", coseDaFare: ["Consulta la scheda della specie.", "Mettila alla luce."], fonti: ["S1"] });
e = applicaRegole(s, fontiConA);
ok(e.scheda.riassunto === "Pianta facile." && e.scheda.sezioni.luce.lineeGuida.riassunto === "Luce viva con terriccio asciutto." && e.scheda.sezioni.luce.lineeGuida.coseDaFare.join() === "Mettila alla luce.", "7c: tolte da riassunto, linee guida e cose da fare");

// 7d. Fonte A e Wikipedia citate insieme
s = base();
s.sezioni.acqua = sez({ riassunto: "Annaffia quando il terriccio è asciutto. Riparalo dal vento e dal freddo.", coseDaFare: ["Annaffia con il terriccio asciutto.", "Tienilo a 25 °C in pieno sole."], fonti: ["S1", "S3"] });
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.acqua.lineeGuida.riassunto === "Annaffia quando il terriccio è asciutto." && e.scheda.sezioni.acqua.lineeGuida.fonti.join() === "S1" && !/vento|25/.test(JSON.stringify(e.scheda.sezioni.acqua.lineeGuida)), "7d: nelle linee guida resta solo ciò che dice la fonte A");
ok(e.scheda.sezioni.acqua.pollice.some((p) => /vento/.test(p.consiglio) && p.fonti.join() === "S3"), "7d: il resto va nel pollice verde con la sua fonte");

// 7e. Un consiglio deve dire cosa fare
for (const t of ["Annaffia ogni settimana.", "In inverno riduci le annaffiature.", "Puoi riprodurla usando gli stoloni.", "Tienila lontana dai vetri.", "Va spostata in casa.", "È possibile propagarla per talea.", "Evitare i ristagni.", "Se l'aria è secca, vaporizza le foglie.", "Con il caldo, esponila di meno."]) ok(diceCosaFare(t), `7e: azione riconosciuta "${t}"`);
for (const t of ["La pianta ha un portamento lianoso con fusticini lunghi.", "La pianta tollera l'ombra.", "La fioritura avviene tra febbraio e marzo.", "Si propaga facilmente.", "Non indicata dalle fonti.", "Annaffiature frequenti, suolo ben drenato.", "La pianta evita il sole diretto.", "La temperatura ideale è 20 °C."]) ok(!diceCosaFare(t), `7e: descrizione rifiutata "${t}"`);

// --- Versione 3 delle regole (2026-11-25) ---
// 8a. Pollice verde in contrasto con le linee guida della stessa sezione
const DITO = ["L'irrigazione va fatta quando il terreno è asciutto in superficie.", "Controlla con un dito: annaffia se i primi 2-3 cm di terriccio sono asciutti."];
ok(JSON.stringify(frequenze("Annaffia due volte a settimana, concima ogni 2-3 mesi.")) === "[[3.5,3.5],[60,90]]", "8a: frequenze lette (volte a settimana, ogni N mesi)");
ok(frequenze("Lasciala riposare un giorno e aspetta due settimane.").length === 0, "8a: una durata non è una frequenza");
ok(contrasta("Annaffia due volte a settimana in estate.", DITO, "acqua"), "8a: Dracaena, 'due volte a settimana' contro 'controlla con il dito' → tolto");
ok(contrasta("Annaffia una volta a settimana in inverno.", DITO, "acqua") && contrasta("Annaffia settimanalmente.", DITO, "acqua"), "8a: tolte anche 'una volta a settimana' e 'settimanalmente'");
ok(!contrasta("Evita la presenza di acqua stagnante.", DITO, "acqua"), "8a: un consiglio senza numeri resta");
const CONCIME = ["Usa un concime liquido una o due volte al mese."];
ok(!contrasta("Usa un concime circa ogni 3 settimane.", CONCIME, "concime") && contrasta("Concima ogni settimana.", CONCIME, "concime"), "8a: ogni 3 settimane sta in '1-2 volte al mese', ogni settimana no");
ok(!contrasta("Concima ogni 2-3 mesi.", CONCIME, "concime"), "9b: concimare meno spesso (ogni 2-3 mesi contro 1-2 volte al mese) è più prudente → resta");
ok(contrasta("Rinvasa ogni 1-2 anni.", ["Travasa ogni 2-3 anni."], "travaso") && !contrasta("Rinvasa ogni 2 anni.", ["Travasa ogni 2-3 anni."], "travaso"), "8a: travaso ogni 1-2 anni contro 2-3 → tolto; ogni 2 anni resta");
ok(!contrasta("Concima ogni 2 mesi.", ["Concima dalla primavera all'autunno."], "concime"), "8a: se la linea guida non dà il dato, non c'è contrasto");
const TEMP = ["Non scendere sotto i 10 °C."];
ok(!contrasta("Mantieni una temperatura minima di 15 °C.", TEMP, "temperatura") && !contrasta("Non scendere mai sotto i 10 °C in casa.", TEMP, "temperatura"), "9b: minima 15 contro minima 10 è più prudente → resta; la stessa minima resta");
ok(contrasta("Mantieni una temperatura minima di 5 °C.", TEMP, "temperatura"), "9b: minima 5 contro minima 10 è meno prudente → tolto");
ok(!contrasta("Non superare i 28 °C.", ["Non superare i 32 °C."], "temperatura") && contrasta("Non superare i 35 °C.", ["Non superare i 32 °C."], "temperatura"), "9b: massima più bassa resta, massima più alta tolta");
ok(!contrasta("Annaffia una volta ogni due settimane.", ["Annaffia una volta a settimana."], "acqua") && contrasta("Annaffia ogni giorno.", ["Annaffia una volta a settimana."], "acqua"), "9b: annaffiare meno spesso resta, più spesso no");
ok(!contrasta("Usa metà dose di concime.", ["Usa la dose intera dell'etichetta."], "concime") && contrasta("Usa la dose intera.", ["Usa metà dose di concime."], "concime"), "9b: metà dose contro dose intera resta; dose intera contro metà dose no");
ok(contrasta("Rinvasa ogni 4-5 anni.", ["Travasa ogni 2-3 anni."], "travaso"), "9b: nel travaso 'meno spesso' resta un contrasto");
ok(contrasta("Tienila tra 5 e 8 °C.", TEMP, "temperatura") && !contrasta("Tienila intorno ai 20 °C.", TEMP, "temperatura"), "8a: sotto la minima → tolto; 20 °C resta");
ok(contrasta("Tienila tra 20 e 35 °C.", ["Sta bene tra 16 e 30 °C."], "temperatura"), "8a: fuori dall'intervallo ideale → tolto");
ok(contrasta("Scegli un vaso 15 cm più largo.", ["Scegli un vaso 5-10 cm più largo."], "travaso"), "8a: quantità diversa (15 cm contro 5-10) → tolto");
s = base();
s.sezioni.temperatura = sez({ riassunto: "La minima è 10 °C.", coseDaFare: [], fonti: ["S1"] }, [
  { consiglio: "Tienilo al sole: cresce bene tra 20 e 25 °C.", fonti: ["S3"] },
  { consiglio: "Riparalo dal freddo e dal vento.", fonti: ["S3"] },
]);
s.sezioni.acqua = sez({ riassunto: "Annaffia quando il terriccio è asciutto.", coseDaFare: [], fonti: ["S1"] }, [{ consiglio: "Annaffialo ogni giorno in pieno sole d'estate.", fonti: ["S3"] }]);
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.acqua.pollice.length === 0 && e.scheda.sezioni.temperatura.pollice.length === 2 && e.interventi.some((i) => /in contrasto/.test(i)), "8a: nella scheda sparisce solo il consiglio in contrasto");

// 8b. Frasi senza contenuto pratico
for (const [prima, dopo] of [
  ["La moltiplicazione può avvenire tramite talea, ma è importante seguire le indicazioni specifiche per la specie.", "La moltiplicazione può avvenire tramite talea."],
  ["Predilige la luce filtrata e richiede un'attenzione particolare alla gestione dell'acqua per evitare danni.", "Predilige la luce filtrata."],
  ["Predilige la luce indiretta e richiede cure moderate per l'acqua e il nutrimento.", "Predilige la luce indiretta."],
  ["La propagazione può avvenire con diverse tecniche.", ""],
  ["Segui le indicazioni specifiche per la specie.", ""],
  ["La riproduzione avviene tramite strutture specifiche della pianta.", ""],
  ["Il metodo di moltiplicazione dipende dalla specie specifica.", ""],
  ["Usa la dose giusta seguendo l'etichetta.", "Usa la dose giusta seguendo l'etichetta."],
  ["Annaffia quando il terriccio è asciutto.", "Annaffia quando il terriccio è asciutto."],
]) ok(senzaVuoto(prima) === dopo, `8b: "${prima.slice(0, 60)}…" → "${dopo || "tolta"}"${senzaVuoto(prima) === dopo ? "" : " MA: " + senzaVuoto(prima)}`);
s = base({ riassunto: "Pianta da casa. Richiede un'attenzione particolare." });
s.sezioni.coltivarla = sez({ riassunto: "La moltiplicazione avviene con diverse tecniche.", coseDaFare: ["Taglia una talea con un nodo.", "Segui le indicazioni specifiche per la specie."], fonti: ["S1"] });
e = applicaRegole(s, fontiTipo);
ok(e.scheda.riassunto === "Pianta da casa." && e.scheda.sezioni.coltivarla.lineeGuida.riassunto === PER_MOLTE + "taglia una talea con un nodo. Non è detto che valga per questa specie." && !JSON.stringify(e.scheda).includes("specifiche"), "8b: tolte da riassunto e linee guida; resta ciò che si può fare");

for (const t of ["Esistono diversi metodi per riprodurre la pianta.", "La pianta può essere riprodotta con tecniche specifiche."]) ok(senzaVuoto(t) === "", `8b: "${t}" tolta`);

// 8c. Scheda quasi vuota (gemma a volte dimentica le fonti delle linee guida)
const fontiPiene = { S1: { ...fontiConA.S1, copreTutto: true }, S3: fontiConA.S3 };
const senzaFonti = (n) => { const x = base(); for (const k of SEZIONI.slice(0, n)) x.sezioni[k] = sez({ riassunto: "Pulisci le foglie con un panno umido.", coseDaFare: [], fonti: [] }); return x; };
ok(applicaRegole(senzaFonti(8), fontiPiene).bloccanti.some((b) => /quasi vuota: 8/.test(b)), "8c: scheda tutta senza fonti → non passa");
ok(applicaRegole(senzaFonti(3), fontiPiene).bloccanti.length === 1 && applicaRegole(senzaFonti(2), fontiPiene).bloccanti.length === 0, "8c: si blocca da 3 sezioni vuote su 8");
ok(applicaRegole(senzaFonti(8), fontiConA).bloccanti.length === 0 && applicaRegole(base(), fontiSoloC).bloccanti.length === 0, "8c: senza scheda del tipo le sezioni vuote sono normali");

// Moltiplicazione specifica da Wikipedia (fonti vere di zamioculcas e sansevieria): l'azione passa le regole
const moltiplicazione = (wikiVera, consiglio, nomi) => {
  const x = base();
  x.sezioni.coltivarla = sez({ riassunto: "La propagazione avviene tramite talea.", coseDaFare: [], fonti: ["S1"] }, [{ consiglio, fonti: ["S3"] }]);
  return applicaRegole(x, { S1: { ...fontiConA.S1, generale: true }, S3: { livello: "C", titolo: "Wikipedia", testo: wikiVera } }, undefined, nomi).scheda.sezioni.coltivarla.pollice.length === 1;
};
ok(moltiplicazione("La propagazione avviene sia per seme che per talea di foglia (molto facile in acqua).", "Preleva una talea di foglia e mettila in acqua.", ["Zamioculcas zamiifolia", "Zamioculcas"]), "Moltiplicazione: talea di foglia della zamioculcas tenuta nel pollice verde");
ok(moltiplicazione("Il rizoma funziona come mezzo di propagazione vegetativa, producendo nuove rosette lateralmente.", "Separa le nuove rosette laterali che nascono dal rizoma.", ["Dracaena trifasciata", "Dracaena"]), "Moltiplicazione: rosette dal rizoma della sansevieria tenute nel pollice verde");
ok(!moltiplicazione("La pianta è costituita da rizomi, le foglie sono ispide.", "Dividi i cespi in primavera e ripianta subito.", ["Strelitzia reginae", "Strelitzia"]), "Moltiplicazione: un metodo che Wikipedia non cita viene tolto (Strelitzia)");

// --- Versione 4 delle regole (2026-11-26) ---
// 9a. Fonte dimenticata: si attribuisce alla fonte A solo ciò che lei dice davvero
s = base();
s.sezioni.acqua = sez({ riassunto: "Annaffia quando il terriccio è asciutto. Pulisci le foglie con un panno umido.", coseDaFare: ["Concima ogni 2 mesi.", "Concima ogni settimana."], fonti: [] });
s.sezioni.luce = sez({ riassunto: "Ama il sole pieno: riparalo dal vento.", coseDaFare: [], fonti: [] });
e = applicaRegole(s, fontiConA);
ok(e.scheda.sezioni.acqua.lineeGuida.riassunto === "Annaffia quando il terriccio è asciutto." && e.scheda.sezioni.acqua.lineeGuida.fonti.join() === "S1", "9a: la frase che la fonte A dice resta nelle linee guida, attribuita a S1");
ok(JSON.stringify(e.scheda.sezioni.acqua.lineeGuida.coseDaFare) === JSON.stringify(["Concima ogni 2 mesi."]), "9a: 'ogni 2 mesi' (nella fonte) resta, 'ogni settimana' (non nella fonte) no");
ok(!JSON.stringify(e.scheda).includes("panno umido"), "9a: una frase che non dice né la fonte A né Wikipedia sparisce");
ok(e.scheda.sezioni.luce.lineeGuida.riassunto === NON_INDICATA && e.scheda.sezioni.luce.pollice.some((p) => /sole pieno/.test(p.consiglio) && p.fonti.join() === "S3"), "9a: una frase che dice solo Wikipedia va nel pollice verde");
ok(e.interventi.some((i) => /fonte dimenticata/.test(i)), "9a: l'intervento è registrato");
const fontiPieneA = { S1: { ...fontiConA.S1, copreTutto: true, testo: fontiConA.S1.testo + " Tienila in piena luce, ma non al sole diretto. Usa terriccio universale drenante. Travasa ogni 2-3 anni. Moltiplica per talea. Controlla la cocciniglia." } };
const dimenticate = base();
for (const k of SEZIONI) dimenticate.sezioni[k].lineeGuida.fonti = [];
ok(applicaRegole(dimenticate, fontiPieneA).bloccanti.length === 0 && SEZIONI.every((k) => applicaRegole(dimenticate, fontiPieneA).scheda.sezioni[k].lineeGuida.riassunto !== NON_INDICATA), "9a: con tutte le fonti dimenticate la scheda non si svuota più (8c non scatta)");
ok(applicaRegole(dimenticate, fontiSoloC).scheda.sezioni.acqua.lineeGuida.riassunto === NON_INDICATA, "9a: senza fonti A non si attribuisce nulla");

// 9c. Frasi che nominano un'altra pianta
const altreM = altrePiante("Monstera deliciosa", "Monstera");
ok(altreM.includes("Pothos") && altreM.includes("Filodendro") && !altreM.includes("Monstera") && !altreM.includes("Rosa"), "9c: nomi delle altre piante per la Monstera (pothos sì, monstera e 'rosa' no)");
ok(!altrePiante("Dracaena trifasciata", "Dracaena").some((n) => /sansevieria|dracena/i.test(n)), "9c: per la sansevieria 'sansevieria' e 'dracena' non sono altre piante");
ok(altraPianta("Le talee del pothos radicano anche in acqua.", altreM) === "Pothos" && altraPianta("Come i filodendri, ama l'umidità.", altreM) === "Filodendro", "9c: nome trovato anche al plurale");
ok(altraPianta("Tienilo a mente: una pianta rosa.", altrePiante("Monstera deliciosa", "Monstera")) === "", "9c: 'mente' e 'rosa' non sono piante");
const tipoMonstera = { S1: { livello: "A", titolo: "tipo", generale: true, testo: "Le talee di fusto radicano facilmente, e quelle del pothos anche in acqua. Per la monstera si taglia la punta sotto una radice aerea." },
  S3: { livello: "C", titolo: "Wikipedia", testo: "La monstera è spesso confusa con il Philodendron, da cui si distingue per le foglie bucate. Le radici aeree vanno lasciate crescere." } };
s = base();
s.sezioni.coltivarla = sez({ riassunto: "Le talee di fusto radicano facilmente, e quelle del pothos anche in acqua. Per la monstera taglia la punta sotto una radice aerea.", coseDaFare: [], fonti: ["S1"] },
  [{ consiglio: "Controlla le foglie: se sono bucate è una monstera, non un Philodendron.", fonti: ["S3"] }]);
e = applicaRegole(s, tipoMonstera, undefined, ["Monstera deliciosa", "Monstera"], altreM);
ok(!/pothos/i.test(JSON.stringify(e.scheda)) && e.scheda.sezioni.coltivarla.lineeGuida.riassunto.includes("le talee di fusto radicano facilmente. Per la monstera taglia la punta sotto una radice aerea."), "9c: Monstera, tolto solo il pezzo sul pothos (la scheda del tipo lo cita come esempio); restano talee di fusto e monstera");
ok(altraPianta("Usa un concime ricco di potassio, come quello per i pomodori, diluito.", altrePiante("Crassula ovata", "Crassula")) === "" && altraPianta("Annaffiala come il pomodoro.", altrePiante("Crassula ovata", "Crassula")) === "Pomodoro", "9c: 'concime come quello per i pomodori' è un prodotto e resta; 'come il pomodoro' no");
ok(e.scheda.sezioni.coltivarla.pollice.some((p) => /Philodendron/.test(p.consiglio)), "9c: resta il confronto con il Philodendron, che Wikipedia fa proprio sulla monstera");

// 9d. Sezioni con le cose da fare ma senza riassunto (falangio, 2026-11-26): non si perdono più
const soloCose = base();
for (const k of SEZIONI) soloCose.sezioni[k].lineeGuida = { coseDaFare: ["Annaffia quando il terriccio è asciutto.", "Concime ogni 2 mesi."], fonti: ["S1"] };
e = applicaRegole(soloCose, fontiPieneA);
ok(e.bloccanti.length === 0 && SEZIONI.every((k) => e.scheda.sezioni[k].lineeGuida.riassunto === "Annaffia quando il terriccio è asciutto." && e.scheda.sezioni[k].lineeGuida.coseDaFare.length === 1), "9d: senza riassunto la prima cosa da fare fa da riassunto, la scheda non è quasi vuota");
// Formato non valido
e = applicaRegole("testo qualsiasi", fontiConA);
ok(e.bloccanti.includes("formato non valido"), "Formato non valido → bloccante");

// Tossicità per la pianta riconosciuta: il caso del suo genere, se le nostre fonti A lo nominano
const t = (f) => JSON.parse(readFileSync(new URL(`../../src/data/schede/tipi/${f}.json`, import.meta.url), "utf8")).tossicita;
const succ = t("succulente");
ok(tossicitaPerPianta(succ, "Crassula ovata", "Crassula").animali === "tossica", "Tossicità: albero di giada (Crassula) → Animali: Tossica");
ok(tossicitaPerPianta(succ, "Kalanchoe blossfeldiana", "Kalanchoe").animali === "tossica", "Tossicità: kalanchoe → Animali: Tossica");
ok(tossicitaPerPianta(succ, "Echeveria elegans", "Echeveria", "Crassulaceae").animali === "non verificata" && /stessa famiglia/.test(tossicitaPerPianta(succ, "Echeveria elegans", "Echeveria", "Crassulaceae").nota), "Tossicità: echeveria (non nominata, Crassulaceae) → 'Non verificata' con le frasi della sua famiglia");
ok(tossicitaPerPianta(t("rampicanti-tropicali"), "Epipremnum aureum", "Epipremnum").persone === "tossica", "Tossicità: pothos → Persone: Tossica");
ok(tossicitaPerPianta(t("orchidee"), "Phalaenopsis amabilis", "Phalaenopsis").animali === "non tossica", "Tossicità: Phalaenopsis → Animali: Non tossica");

// Tossicità solo per la pianta riconosciuta (2026-11-26): frasi per genere o famiglia, valore coerente con la nota
const tossDi = (tipo, specie, famiglia) => tossicitaPerPianta(t(tipo), specie, specie.split(" ")[0], famiglia);
const coerente = (x) => (x.nota === NOTA_PRUDENTE) === (x.fonti.length === 0) && (x.persone !== "varia" && x.animali !== "varia");
for (const [specie, famiglia] of [["Chlorophytum comosum", "Asparagaceae"], ["Strelitzia reginae", "Strelitziaceae"], ["Maranta leuconeura", "Marantaceae"], ["Dracaena trifasciata", "Asparagaceae"]]) {
  const x = tossDi("foglia-tropicale", specie, famiglia);
  ok(!/arace|monstera|filodendro/i.test(x.nota) && x.persone === "non verificata" && x.animali === "non verificata" && x.nota === NOTA_PRUDENTE, `Tossicità: ${specie} → "Non verificata" con la nota prudente, niente aracee`);
}
const spati = tossDi("foglia-tropicale", "Spathiphyllum wallisii", "Araceae");
ok(/aracea/.test(spati.nota) && spati.persone === "non verificata" && spati.fonti.join() === "7,9" && coerente(spati), "Tossicità: spatifillo (aracea) → frasi sulle aracee, 'Non verificata' (non abbiamo due fonti per lui)");
for (const [specie, nome] of [["Epipremnum aureum", "pothos"], ["Monstera deliciosa", "monstera"], ["Philodendron hederaceum", "filodendro"]]) {
  const x = tossDi("rampicanti-tropicali", specie, "Araceae");
  ok(x.persone === "tossica" && x.animali === "tossica" && /aracee/.test(x.nota), `Tossicità: ${nome} → Tossica, parla delle aracee`);
}
const scind = tossDi("rampicanti-tropicali", "Scindapsus pictus", "Araceae");
ok(scind.persone === "non verificata" && /aracea/.test(scind.nota) && /non abbiamo ancora dati verificati/.test(scind.nota), "Tossicità: scindapsus (aracea senza caso) → 'Non verificata', frasi sulle aracee");
ok(tossDi("rampicanti-tropicali", "Hoya carnosa", "Apocynaceae").nota === NOTA_PRUDENTE, "Tossicità: hoya (non aracea) → nota prudente");
ok(tossDi("succulente", "Aloe vera", "Asphodelaceae").nota === NOTA_PRUDENTE && tossDi("orchidee", "Dendrobium nobile", "Orchidaceae").animali === "non verificata", "Tossicità: aloe → nota prudente; altra orchidea → 'Non verificata'");
ok(!/arace/i.test(tossDi("foglia-tropicale", "Chlorophytum comosum").nota), "Tossicità: senza famiglia (Vivaio vecchio) nessuna frase di altri gruppi");
// Schede generate: la stessa tossicità, ricalcolata anche per quelle salvate
ok(applicaRegole(base(), fontiSoloC).scheda.tossicita.nota === NOTA_PRUDENTE, "Nota prudente: la stessa nella scheda del tipo e in quella generata");
ok(tossicitaNostra("Chlorophytum comosum", "Chlorophytum", "Asparagaceae").nota === NOTA_PRUDENTE && tossicitaNostra("Chlorophytum comosum", "Chlorophytum", "Asparagaceae").fonti.length === 0, "Schede generate: falangio → nota prudente, senza fonti");
ok(tossicitaNostra("Monstera deliciosa", "Monstera", "Araceae").persone === "tossica" && tossicitaNostra("Strelitzia reginae", "Strelitzia", "Strelitziaceae").persone === "non verificata", "Schede generate: monstera tossica, Strelitzia non verificata");
const tipoFoglia = JSON.parse(readFileSync(new URL("../../src/data/schede/tipi/foglia-tropicale.json", import.meta.url), "utf8"));
ok(improntaFontiA("Chlorophytum comosum", "Chlorophytum", "Asparagaceae") === improntaFontiA("Chlorophytum comosum", "Chlorophytum", "Asparagaceae") && tipoFoglia.tossicita.frasi.length === 2, "Impronta delle fonti A: stabile (la tossicità non ne fa parte, si ricalcola a ogni lettura)");

// Lettura del JSON del modello (gpt-oss-20b chiudeva con una graffa in meno)
ok(JSON.stringify(leggiJson('{"a":{"b":[1,2]}')) === '{"a":{"b":[1,2]}}', "JSON: aggiunta la graffa finale mancante (caso gpt-oss)");
ok(JSON.stringify(leggiJson('Ecco: {"a":"testo con } e ]"}')) === '{"a":"testo con } e ]"}', "JSON: le parentesi dentro i testi non si contano");
ok(leggiJson('{"a":[1}, "b":2}') === null, "JSON: rotto in mezzo → non si ripara (formato non valido)");

// Testo grezzo nel registro del server (2026-11-25): una riga sola, senza chiavi, completo se non è lunghissimo
const segreti = valoriSegreti({ FINTA_TOKEN: "valore-finto-1234", FINTO_ACCOUNT_ID: "conto-finto-5678", NODE_ENV: "production", VUOTA_KEY: "" });
ok(segreti.length === 2 && !segreti.includes("production"), "Registro: si oscurano solo le variabili segrete non vuote");
const riga = testoPerRegistro('{"a":\n"valore-finto-1234 e conto-finto-5678"', segreti);
ok(!/valore-finto|conto-finto/.test(riga) && riga.includes("[oscurato]") && !riga.includes("\n"), "Registro: chiavi oscurate e testo su una riga sola");
ok(JSON.parse(testoPerRegistro('{"a":1', [])) === '{"a":1', "Registro: il testo grezzo si recupera identico");
ok(testoPerRegistro("x".repeat(30000), []).length < 20100, "Registro: un testo lunghissimo si accorcia tenendo inizio e fine");

// Versione delle regole nella chiave delle schede salvate (2026-11-25): se cambiano regole o fonti, deve cambiare
const radice = new URL("../../", import.meta.url);
const elencoFile = FILE_REGOLE.flatMap((f) => {
  const u = new URL(f, radice);
  return statSync(u).isDirectory() ? readdirSync(u).sort().map((n) => `${f}/${n}`) : [f];
});
const impronta = createHash("sha256");
for (const f of elencoFile) impronta.update(f).update(readFileSync(new URL(f, radice), "utf8").replace(/\r\n/g, "\n"));
const improntaOra = impronta.digest("hex").slice(0, 16);
ok(improntaOra === IMPRONTA_REGOLE,
  `Schede salvate: regole e fonti sono quelle della versione ${VERSIONE_REGOLE}` +
    (improntaOra === IMPRONTA_REGOLE ? "" : ` → CAMBIATE: in versione-regole.ts aumenta VERSIONE_REGOLE e scrivi IMPRONTA_REGOLE = "${improntaOra}"`));
ok(chiaveScheda("Monstera deliciosa", "Monstera", "Araceae", "abc") === `scheda:r${VERSIONE_REGOLE}:Monstera deliciosa|Monstera|Araceae:abc`, "Schede salvate: chiave con versione, nome scientifico, genere, famiglia e impronta delle fonti");
ok(chiaveScheda("Monstera deliciosa", "monstera", "Araceae") !== chiaveScheda("Monstera deliciosa", "Monstera", "Araceae"), "Schede salvate: un genere scritto male non finisce sotto la chiave giusta");

// Quota per telefono: il giorno cambia a mezzanotte ITALIANA, ora legale compresa
const mezzanotte = (d) => prossimaMezzanotteItaliana(new Date(d)).toISOString();
ok(mezzanotte("2026-11-25T14:00:00Z") === "2026-11-25T23:00:00.000Z", "Quota: d'inverno riparte alle 23:00 UTC (mezzanotte italiana)");
ok(mezzanotte("2026-07-10T21:59:00Z") === "2026-07-10T22:00:00.000Z" && mezzanotte("2026-07-10T22:00:00Z") === "2026-07-11T22:00:00.000Z", "Quota: d'estate riparte alle 22:00 UTC");
ok(mezzanotte("2026-10-25T10:00:00Z") === "2026-10-25T23:00:00.000Z" && mezzanotte("2026-03-29T10:00:00Z") === "2026-03-29T22:00:00.000Z", "Quota: giusta anche nei giorni del cambio d'ora");
ok(giornoItaliano(new Date("2026-11-25T23:30:00Z")) === "2026-11-26" && giornoItaliano(new Date("2026-12-31T23:30:00Z")) === "2027-01-01", "Quota: dopo mezzanotte italiana è già domani, anche a Capodanno");

console.log(`\n${fatti - errori}/${fatti} controlli superati.`);
process.exit(errori ? 1 : 0);
