// Prova delle regole delle schede generate (R2) su casi costruiti: nessuna rete, nessun consumo.
// Uso: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/app/prova-regole-r2.mjs
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { applicaRegole, NON_INDICATA, SEZIONI } from "../../src/lib/schede/genera/regole.ts";
import { tossicitaPerPianta } from "../../src/lib/schede/tossicita.ts";
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
s.sezioni.luce = sez({ riassunto: "Ama il sole pieno.", coseDaFare: [], fonti: ["S3"] });
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
  { consiglio: "Il basilico cresce bene tra 20 e 25 °C.", fonti: ["S3"] },
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
  { consiglio: "Si riproduce per margotta o talea apicale.", fonti: ["S3"] },
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
  { consiglio: "Cresce bene a pieno sole, anche diretto.", fonti: ["S3"] },
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
s.sezioni.coltivarla = sez({ riassunto: NON_INDICATA, coseDaFare: [], fonti: [] }, [{ consiglio: "È una pianta erbacea annuale della famiglia delle Lamiaceae originaria dell'India.", fonti: ["S3"] }]);
e = applicaRegole(s, fontiConA);
ok(e.bloccanti.some((b) => b.startsWith("copia")), "Regola 3: una sequenza di 8 parole uguale a Wikipedia blocca la scheda (si rigenera)");

// Formato non valido
e = applicaRegole("testo qualsiasi", fontiConA);
ok(e.bloccanti.includes("formato non valido"), "Formato non valido → bloccante");

// Tossicità per la pianta riconosciuta: il caso del suo genere, se le nostre fonti A lo nominano
const t = (f) => JSON.parse(readFileSync(new URL(`../../src/data/schede/tipi/${f}.json`, import.meta.url), "utf8")).tossicita;
const succ = t("succulente");
ok(tossicitaPerPianta(succ, "Crassula ovata", "Crassula").animali === "tossica", "Tossicità: albero di giada (Crassula) → Animali: Tossica");
ok(tossicitaPerPianta(succ, "Kalanchoe blossfeldiana", "Kalanchoe").animali === "tossica", "Tossicità: kalanchoe → Animali: Tossica");
ok(tossicitaPerPianta(succ, "Echeveria elegans", "Echeveria").animali === "varia", "Tossicità: echeveria (non nominata) → resta 'Dipende dalla specie'");
ok(tossicitaPerPianta(t("rampicanti-tropicali"), "Epipremnum aureum", "Epipremnum").persone === "tossica", "Tossicità: pothos → Persone: Tossica");
ok(tossicitaPerPianta(t("orchidee"), "Phalaenopsis amabilis", "Phalaenopsis").animali === "non tossica", "Tossicità: Phalaenopsis → Animali: Non tossica");

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
