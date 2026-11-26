// Generazione di una scheda di specie (R2, decisioni dell'utente del 2026-11-19). SOLO SERVER.
// Ordine dei tentativi (i modelli si scelgono in ./modelli.ts):
//   1. modello principale
//   2. se la scheda COPIA da Wikipedia → di nuovo il principale, chiedendo di riscrivere con parole sue
//   3. se ricapita, o se il principale non risponde o la scheda non passa i controlli → modello di riserva
//   4. se fallisce anche la riserva → ripiego: la scheda di genere o di tipo (o "in preparazione")
// Regola 1: senza nessuna fonte A, se esiste una scheda di genere o di tipo si mostra quella al posto della generata.
import { altrePiante } from "./altre-piante";
import { raccogliFonti } from "./fonti";
import { leggiJson } from "./json";
import { applicaRegole, type EsitoRegole, type FonteData } from "./regole";
import { MODELLI_SCHEDE } from "./modelli";
import { testoPerRegistro, valoriSegreti } from "./registro";
import { WorkersAiCardWriter, type CardWriter } from "./scrittore";
import type { SceltaScheda } from "../scegli";

const ISTRUZIONI = `Sei il redattore di Mandragola, un'app italiana per la cura delle piante. Scrivi una SCHEDA DI CURA per la specie indicata, in italiano semplice e corretto, usando SOLO le fonti fornite (S1, S2, S3). Non usare conoscenze tue: se un'informazione non è nelle fonti, scrivi "Non indicata dalle fonti.".
Regole obbligatorie:
- "lineeGuida": solo fonti di livello A. Le fonti di livello C (Wikipedia) vanno SOLO in "pollice" (consigli non ufficiali).
- Ogni numero (temperature, giorni, mesi, dosi) deve comparire nella fonte citata.
- NON parlare di tossicità, veleno o pericoli: la tossicità la aggiungiamo noi dalle nostre fonti.
- "pollice": da 0 a 3 consigli per sezione, SOLO se la fonte citata dice davvero quella cosa (un fatto preciso della fonte, non un consiglio generico). Se la fonte non dice nulla di specifico, lascia "pollice" vuoto: []. Non devono contraddire le lineeGuida.
- Non copiare frasi dalle fonti: riscrivi tutto con parole tue, frasi brevi.
- Scrivi ciò che è specifico di questa specie, non solo ciò che vale per tutto il tipo di pianta.
- I consigli sono PRATICI, per chi ha la pianta in casa, sul balcone o nell'orto: cosa fare e come. Niente elenchi di nomi scientifici di parassiti o malattie: usa il nome comune (es. "cocciniglia") e di' come riconoscerla o prevenirla.
- Non scrivere frasi come "non è indicata la temperatura massima": scrivi solo i dati che le fonti danno.
- Il "riassunto" generale NON contiene numeri (niente temperature, giorni, dosi): i numeri vanno solo nelle sezioni.
- Un numero mantiene il SIGNIFICATO della fonte: se la fonte dice "minima 10-13 °C" scrivi "non scendere sotto i 10-13 °C", mai "tieni tra 10 e 13 °C".
- In OGNI sezione di "lineeGuida" scrivi sempre il "riassunto" (una o due frasi) e "fonti" con almeno S1 o S2: senza fonte la sezione viene cancellata. Cita solo fonti A (S1, S2): le cose dette da Wikipedia vanno in "pollice".
- Ogni consiglio di "pollice" comincia con un'AZIONE (annaffia, sposta, taglia, controlla…), non con una descrizione della pianta.
- Moltiplicazione: se Wikipedia cita un metodo preciso per QUESTA specie (es. talea di foglia, rizoma, stoloni, polloni, germogli), riportalo nel "pollice" di "coltivarla" come azione, con le parole della fonte (es. "Preleva una talea di foglia e mettila in acqua", "Separa le nuove rosette che nascono dal rizoma"). Se Wikipedia non cita nessun metodo, non inventarlo.
- Non trasformare in consigli le descrizioni dell'habitat naturale. Nel "pollice" niente frequenze o temperature diverse dalle linee guida.
- Parla SOLO di questa specie: non nominare altre piante (es. il pothos nella scheda della monstera), anche se la scheda del tipo le cita come esempio.
- Niente frasi vuote ("segui le indicazioni specifiche", "richiede attenzione particolare", "con diverse tecniche"): di' che cosa fare.
- Vietato: promesse o proprietà (purifica l'aria, porta fortuna, usi medicinali) e frasi sull'app, sulle fonti o sulle schede ("consulta la scheda…").
Rispondi SOLO con un oggetto JSON valido:
{"riassunto": "...",
 "sezioni": {"luce": S, "acqua": S, "temperatura": S, "terriccio": S, "concime": S, "travaso": S, "coltivarla": S, "problemi": S}}
dove S = {"lineeGuida": {"riassunto": "...", "coseDaFare": ["..."], "fonti": ["S1"]}, "pollice": [{"consiglio": "...", "fonti": ["S3"]}]}`;

const RIPROVA_COPIA = "Nel tentativo precedente alcune frasi erano copiate da Wikipedia. Riscrivi con parole DIVERSE dalle fonti, frasi brevi, ma mantieni GLI STESSI FATTI (stessi metodi, nomi di malattie e parassiti, numeri): cambia le parole, non il contenuto.";

export interface Tentativo {
  modello: string;
  ms: number;
  neuron: number;
  esito: string; // "ok", "copia", "errore: …", "controlli: …"
  interventi: string[];
  grezzo?: string; // testo del modello se la scheda è stata scartata (su una riga, chiavi oscurate): solo per capire
}

export type RisultatoGenerazione =
  | { tipo: "generata"; esito: EsitoRegole; modello: string; fonti: Record<string, FonteData>; tentativi: Tentativo[]; ms: number }
  | { tipo: "ripiego"; motivo: string; scelta: SceltaScheda; tentativi: Tentativo[]; ms: number };


export async function generaScheda(
  specie: string,
  genere: string,
  famiglia?: string,
  scrittori: { principale: CardWriter; riserva: CardWriter } = {
    principale: new WorkersAiCardWriter(MODELLI_SCHEDE.principale.nome, MODELLI_SCHEDE.principale.id),
    riserva: new WorkersAiCardWriter(MODELLI_SCHEDE.riserva.nome, MODELLI_SCHEDE.riserva.id),
  },
): Promise<RisultatoGenerazione> {
  const t0 = Date.now();
  const tentativi: Tentativo[] = [];
  const { fonti, scelta, tossicita } = await raccogliFonti(specie, genere, famiglia);
  const haFontiA = Object.values(fonti).some((f) => f.livello === "A");

  // Regola 1 (seconda parte): senza fonti A, se c'è una scheda di genere o di tipo pronta, si mostra quella
  if (!haFontiA && scelta.scheda) {
    return { tipo: "ripiego", motivo: "nessuna fonte A: si usa la scheda di genere o di tipo", scelta, tentativi, ms: Date.now() - t0 };
  }
  const blocchi = Object.entries(fonti).map(([id, f]) => `### ${id} — livello ${f.livello} — ${f.titolo}\n${f.testo}`);
  const base = [
    { role: "system" as const, content: ISTRUZIONI },
    { role: "user" as const, content: `Specie: ${specie} (genere ${genere}${famiglia ? `, famiglia ${famiglia}` : ""}).\n\nFONTI:\n${blocchi.join("\n\n") || "(nessuna fonte)"}` },
  ];

  const prova = async (s: CardWriter, extra?: string) => {
    const messaggi = extra ? [...base, { role: "user" as const, content: extra }] : base;
    const r = await s.scrivi(messaggi);
    if (r.errore) {
      tentativi.push({ modello: s.nome, ms: r.ms, neuron: r.neuron, esito: `errore: ${r.errore}`, interventi: [] });
      return null;
    }
    const json = leggiJson(r.testo);
    const esito = applicaRegole(json, fonti, tossicita, [specie, genere], altrePiante(specie, genere));
    const copia = esito.bloccanti.some((b) => b.startsWith("copia"));
    // Scartata (formato, quasi vuota, copia, controlli): il testo grezzo va nel registro del server, anche se poi la
    // riserva riesce, e nel tentativo (lo salva lo script di preparazione; al telefono non arriva)
    const grezzo = esito.bloccanti.length ? testoPerRegistro(r.testo, valoriSegreti(process.env)) : undefined;
    if (grezzo) console.warn(`[scheda-generata] scartata: ${esito.bloccanti.join("; ")} · ${s.nome} · ${specie} · ${r.testo.length} caratteri · testo grezzo: ${grezzo}`);
    tentativi.push({
      modello: s.nome,
      ms: r.ms,
      neuron: Math.round(r.neuron),
      esito: esito.bloccanti.length ? (copia ? "copia" : `controlli: ${esito.bloccanti.join("; ")}`) : "ok",
      interventi: esito.interventi,
      ...(grezzo ? { grezzo } : {}),
    });
    return { esito, copia };
  };

  const quotaFinita = () => tentativi.some((t) => t.esito === "errore: quota");
  const ripiegoQuota = () =>
    ({ tipo: "ripiego", motivo: "quota gratuita del giorno finita", scelta, tentativi, ms: Date.now() - t0 }) as const;

  // 1-2. Modello principale, con una seconda prova solo se ha copiato
  let r = await prova(scrittori.principale);
  if (quotaFinita()) return ripiegoQuota();
  if (r?.copia) r = await prova(scrittori.principale, RIPROVA_COPIA);
  if (quotaFinita()) return ripiegoQuota();
  if (r && !r.esito.bloccanti.length) {
    return { tipo: "generata", esito: r.esito, modello: scrittori.principale.nome, fonti, tentativi, ms: Date.now() - t0 };
  }
  // 3. Riserva
  const g = await prova(scrittori.riserva, r?.copia ? RIPROVA_COPIA : undefined);
  if (g && !g.esito.bloccanti.length) {
    return { tipo: "generata", esito: g.esito, modello: scrittori.riserva.nome, fonti, tentativi, ms: Date.now() - t0 };
  }
  // 4. Ripiego
  return { tipo: "ripiego", motivo: "nessun modello ha prodotto una scheda che passa i controlli", scelta, tentativi, ms: Date.now() - t0 };
}
