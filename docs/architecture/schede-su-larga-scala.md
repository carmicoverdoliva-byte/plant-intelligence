# Schede di cura complete per qualsiasi pianta riconosciuta — progetto

> Proposto il 2026-11-18 · **Approvato dall'utente il 2026-11-18** (D13: opzione A più una versione corretta di B)
> Collegati: [D13](decisioni-da-prendere.md#d13--schede-complete-per-qualsiasi-pianta-riconosciuta),
> [banche dati aperte](../api-documentation/banche-dati-cura.md),
> [AI gratuita per le schede generate](../api-documentation/ai-schede-generate.md),
> [architettura §5](architettura.md#5-schema-dei-dati), [esempio (pothos)](../requirements/esempio-scheda-pothos.md),
> [piano v1](../requirements/piano-v1.md), skill `plant-schede`

## In breve
**Obiettivo (decisione dell'utente).** La **scheda completa** per **qualsiasi** pianta riconosciuta, con la massima
completezza e senza servizi a pagamento. Le sezioni sono:
- luce;
- acqua (quando e quanto);
- temperatura;
- terriccio;
- concime;
- travaso;
- coltivarla da zero;
- problemi e malattie più comuni;
- falsi miti;
- approfondimenti.

Le "22 schede" del vecchio piano erano un errore di pianificazione.

**Come, in sei idee:**
1. **Quattro livelli**, tutti con tutte le sezioni. L'app usa il più preciso disponibile e **lo dice** in cima.
   1. **specie verificata**, scritta da noi;
   2. **specie generata** al momento da un'AI gratuita, a partire da dati reali;
   3. **genere**;
   4. **tipo di pianta**, che esiste per ogni pianta.
2. **Ogni sezione ha due parti:**
   - **"Linee guida"**, solo da fonti ufficiali e autorevoli;
   - **"Consigli dal pollice verde"**, trucchi di appassionati, vivai e blog, etichettati come non ufficiali.
3. **Si scrive prima ciò che la gente fotografa e coltiva davvero:**
   - dati Pl@ntNet su GBIF per le piante all'aperto;
   - [elenco casa, balcone e orto](../../data/elenco-priorita.json).
4. **Produzione a blocchi di 10 schede**, con:
   - test automatici;
   - un agente di verifica indipendente;
   - confronto con i dati aperti;
   - una **revisione dell'utente di 5 minuti**: solo la tabella della tossicità.
5. **Rilascio progressivo:** R0 riconoscimento, R1 tipi di pianta e note di famiglia, R2 schede generate, poi schede
   verificate **ogni settimana**; ognuno si pubblica appena pronto.
6. **Nessun dato inventato:** ogni numero ha la sua fonte. Quando un dato non si può generalizzare, la scheda lo dice e dà
   un consiglio prudente.

## 1. I livelli (più le note di famiglia)

```text
Pl@ntNet riconosce:  specie (es. Ficus microcarpa) ─┐
                                                    ▼
  1. Scheda di SPECIE VERIFICATA?   sì → "Scheda della specie · verificata con le fonti"     (la più precisa)
                    │ no
  2. Scheda di SPECIE GENERATA?     sì → "Scheda generata automaticamente" (già in cache)
                    │ no → si genera ora (AI gratuita, dati reali, controlli); se non riesce ↓
  3. Scheda del GENERE (Ficus)?     sì → "Scheda del genere Ficus: vale per la maggior parte dei Ficus"
                    │ no
  4. Scheda del TIPO DI PIANTA      sempre → "Consigli per: arbusto da appartamento di clima tropicale"
  + NOTE DI FAMIGLIA (Moraceae), quando ci sono: tossicità tipica, parassiti tipici della famiglia
```

| Livello | Quante | Da dove arriva l'abbinamento | Precisione |
|---|---|---|---|
| **Specie verificata** | centinaia, a crescere ogni settimana | nome della specie da Pl@ntNet, passato dalla tabella dei sinonimi | alta |
| **Specie generata** | tutte le altre specie riconosciute, una volta sola ciascuna | come sopra; generata solo per specie arrivate da un vero riconoscimento | media: dichiarata |
| **Genere** | 120 al traguardo T1, 300 al T2 | genere da Pl@ntNet | media: valori come **intervalli**, eccezioni dette |
| **Tipo di pianta** | circa **18**, tutte nella prima pubblicazione | forma di vita + clima d'origine da **WCVP** (Kew, CC BY), calcolati sul PC per **ogni genere** della flora di Pl@ntNet | di base, ma onesta e completa |
| Note di famiglia | circa 60 | famiglia da Pl@ntNet | aggiunta, non una scheda |

**Perché non la "scheda di famiglia" come livello.** Una famiglia mette insieme piante troppo diverse: le Rosacee
comprendono la fragola, la rosa e il ciliegio. La famiglia serve per avvisi comuni (lattice irritante, parassiti
tipici), quindi diventa una **nota**.

**I tipi di pianta proposti** (elenco da confermare nel blocco 1):
- **casa** (clima tropicale o subtropicale): pianta verde da foglia, rampicante o ricadente, epifita (orchidee,
  bromelie), succulenta, cactus, felce, palma, bulbosa da fiore;
- **esterno** (clima temperato e mediterraneo): albero a foglia caduca, albero sempreverde, conifera, arbusto a foglia
  caduca, arbusto sempreverde, rampicante, erbacea perenne, annuale o biennale, bulbosa, graminacea, pianta acquatica;
- **ortaggi e aromatiche**, come tipo a parte; dal 2026-11-26 diviso in due: **aromatiche mediterranee** (rosmarino,
  salvia, timo, origano, lavanda, santoreggia: poca acqua, terreno povero, niente concime) e **ortaggi e aromatiche
  dell'orto** (acqua regolare, terreno ricco, concime).

Se WCVP non ha la forma di vita di un genere, si usa quella più frequente nella sua famiglia, dichiarandolo. Se manca
anche quella, si usa una scheda universale "pianta in vaso o in giardino". **Nessuna pianta resta senza scheda.**

Il popup dell'anteprima live apre la scheda del livello migliore disponibile. Il catalogo dell'anteprima (D10) non
decide più quali schede esistono.

## 2. Quali specie e generi scrivere prima

**All'aperto: lo dicono i dati.** Pl@ntNet pubblica su GBIF, con licenza CC BY, le foto dei suoi utenti. Conteggi del
2026-11-18 ([dettagli](../api-documentation/banche-dati-cura.md)):

| Le prime… | coprono in Italia (stima prudente – ottimista) | in Europa |
|---|---|---|
| 100 specie | 27% – 51% delle foto | 46% |
| 300 specie | 53% – 78% | 73% |
| 500 specie | 68% – 89% | 84% |
| 1.000 specie | 88% – 98% | 95% |
| 80 generi | 45% – 58% | 56% |
| 120 generi | 56% – 70% | 67% |
| 300 generi | 84% – 92% | 89% |
| 500 generi | 96% – 99% | 97% |

**In casa, sul balcone e nell'orto: un elenco a parte**, perché su GBIF arrivano poche foto di queste piante. La
proposta è in [`data/elenco-priorita.json`](../../data/elenco-priorita.json): **61 specie e 42 generi**, di cui 30 specie
di casa per i primi blocchi settimanali (dopo R2). È **da approvare dall'utente** prima dell'uso.

**Ordine dei blocchi:**
1. tipi di pianta e note di famiglia;
2. le 30 specie di casa più comuni (primi blocchi settimanali, dopo R2);
3. i generi di casa;
4. i generi all'aperto più fotografati;
5. balcone, orto e aromatiche;
6. le specie all'aperto, secondo la classifica di GBIF.

## 3. Come si scrive una scheda verificata (blocchi di 10)

**Metodo (deciso dall'utente il 2026-11-18)**, applicato con la skill `plant-schede`:
- **più fonti per ogni pianta**, di tre livelli:
  - **A**: orti botanici, università, enti di ricerca, servizi pubblici;
  - **B**: vivai specializzati e associazioni;
  - **C**: riviste e blog di settore affidabili;
- si ricavano **fatti e consigli pratici**; si scrive con **parole nostre**; ogni fonte è citata con link. **Mai**
  copiare testi, né riprodurre un articolo frase per frase;
- **ogni sezione ha due parti distinte:**

| Parte | Da quali fonti | Regole |
|---|---|---|
| **Linee guida** | **solo A**, oppure **due B concordi** | Riassunto + "cose da fare" + valori strutturati (numeri, stagioni). Qui stanno tutti i numeri e la tossicità |
| **Consigli dal pollice verde** | **B e C** (vivai, appassionati, blog e riviste di settore) | Trucchi pratici, con l'etichetta **"non ufficiale"** e la fonte. **Mai in contraddizione** con le linee guida: se la contraddicono, non entrano qui ma diventano una voce di **"Falsi miti"** (verdetto con fonti A) |

- **Qualità = autorevolezza + accordo.** Se le fonti A non sono d'accordo tra loro, la scheda lo dichiara e indica la
  via prudente.
- **Siti che vietano l'uso dell'AI** (es. Gardenia): non si aprono con strumenti automatici. Li legge e li seleziona
  l'utente.

```text
 1. ELENCO      prossime 10 voci dall'elenco di priorità (approvato)
 2. FONTI       per ogni sezione: 2+ fonti A per le linee guida (3 per numeri e sicurezza); B e C per il pollice verde;
                prima di aprire un sito: robots.txt e termini d'uso (se vieta l'AI → lo legge l'utente, o non si usa)
 3. BOZZA       linee guida (riassunto, cose da fare, valori) + consigli dal pollice verde, con parole nostre;
                ogni dato con la sua fonte e il punto della fonte (es. "sezione Watering")
 4. CONTROLLI   test automatici (sotto) ──── falliti? → si torna al punto 3
 5. VERIFICA    un secondo agente, che NON ha scritto la bozza, rilegge le fonti frase per frase:
                ogni affermazione non trovata viene tolta o corretta; controlla che il pollice verde non contraddica
 6. TOSSICITÀ   tabella per l'utente (5 minuti): pianta · tossica per persone · tossica per animali · fonte con link
 7. PUBBLICA    commit e push; la scheda mostra "Verificata con le fonti il AAAA-MM-GG"
```

**Revisione dell'utente (decisione del 2026-11-18): solo la tabella della tossicità.** Tutto il resto lo verificano i
test automatici e l'agente indipendente. Le letture complete sono facoltative: la scheda le registra
(`humanReview`), se ci sono.

**Test automatici su ogni scheda** (`npm run schede:controlla`):
1. **completezza:** tutte le sezioni; ogni sezione ha le linee guida; ogni numero ha una fonte;
2. **livello delle fonti:** nelle linee guida solo fonti A, oppure due B concordi; nel pollice verde solo B e C,
   ognuno con la sua fonte e l'etichetta "non ufficiale";
3. **niente contraddizioni:** i consigli dal pollice verde non escono dai valori delle linee guida (temperature,
   intervalli d'acqua, periodi). Se escono, il test fallisce e il consiglio va spostato nei falsi miti;
4. **coerenza interna:** minima < ideale < massima; periodi coerenti con le stagioni; promemoria solo da valori con
   fonte;
5. **confronto con i dati aperti:** luce, umidità e temperatura con **EIVE** (piante europee); clima d'origine con
   **WCVP**;
6. **coerenza fra livelli:** i valori della specie stanno negli intervalli del genere, oppure c'è scritto perché no;
7. **anti-copia:** nessuna sequenza di 8 o più parole uguali a una fonte leggibile;
8. **fonti vive:** ogni link risponde; data di consultazione non più vecchia di 3 anni;
9. **niente percentuali inventate** nei problemi (regola F20).

**Sezioni che non si possono generalizzare** (schede di genere e di tipo):
- *Tossicità:* "Nel genere ci sono specie tossiche e specie innocue: finché non conosci la specie, tienila lontana da
  bambini e animali."
- *Falsi miti:* quelli del gruppo e quelli di tutte le piante in vaso.
- *Approfondimenti:* solo articoli davvero adatti; altrimenti un messaggio onesto (F22).

## 4. Schema dei dati (sostituisce `Species.care` e `CareGroup`)

> **Attuato in R1 (2026-11-18)** in forma semplificata, con nomi in italiano: `src/lib/schede/tipi.ts` (`SchedaCura`, `Sezione`
> con `lineeGuida` e `pollice`, `Valore`, `Disaccordo`, `NotaFamiglia`). Le fonti si citano per numero. I tipi di pianta
> sono **19 più la scheda universale** (`src/content/tipi-di-pianta.ts`). Lo schema qui sotto resta il riferimento per
> specie e genere.

```ts
interface CareSheet {
  id: string;                          // "species/ficus-elastica", "genus/ficus", "type/arbusto-tropicale"
  level: 'species' | 'genus' | 'plant-type';
  origin: 'verified' | 'generated';    // 'generated' solo per level 'species' (schede generate al momento, §6)
  taxon?: { scientificName: string; rank: 'species' | 'genus'; family: string };  // assente per 'plant-type'
  appliesTo: string;                   // "la maggior parte dei Ficus coltivati in casa" (parole nostre)
  exceptions?: string[];               // "Ficus carica (fico) vive all'aperto: vedi la sua scheda"
  summary: string;                     // riassunto della scheda, parole nostre
  todo: string[];                      // "cose da fare" principali
  // TUTTE obbligatorie, a ogni livello. Ogni sezione ha DUE PARTI:
  light: Section<LightGuide>;
  water: Section<WaterGuide>;
  temperatureC: Section<TemperatureGuide>;
  soil: Section<SoilGuide>;
  fertilizer: Section<FertilizerGuide>;
  repotting: Section<RepottingGuide>;
  propagation: Section<PropagationGuide>;   // "Coltivarla da zero"
  commonProblems: Section<CommonProblem[]>; // problemi e malattie più comuni
  myths: MythCheck[];                       // le contraddizioni pollice verde ↔ linee guida finiscono qui
  furtherReading: FurtherReading[];         // può essere vuoto: l'app lo dice
  toxicity: {                               // solo da linee guida (fonti A o due B concordi)
    people: 'toxic' | 'non-toxic' | 'varies' | 'unverified';
    pets: 'toxic' | 'non-toxic' | 'varies' | 'unverified';
    // 'non-toxic' SOLO con fonte verificata; schede generate: mai 'non-toxic' senza fonte verificata → 'unverified'
    note: string;                           // consiglio prudente se 'varies' o 'unverified'
    sources: Source[];
  };
  verification: {
    autoChecks: { name: string; passed: boolean; checkedAt: string }[];
    independentCheckAt?: string;            // agente di verifica (schede verificate)
    toxicityTableApprovedAt?: string;       // revisione dell'utente (5 minuti per blocco)
    humanReview?: { reviewedAt: string; scope: 'full' | 'spot' };   // facoltativa
    generatedBy?: { service: string; model: string; at: string };  // schede generate
  };
  license: 'project' | 'CC-BY-SA-4.0';      // CC BY-SA se contiene informazioni rielaborate da Wikipedia
  version: number;
  updatedAt: string;
}

interface Section<T> {
  guidelines: {                        // "Linee guida": solo fonti A, o due B concordi
    summary: string;                   // riassunto, parole nostre
    todo: string[];                    // cose da fare
    data: T;                           // valori strutturati (numeri, stagioni…), ognuno con le sue fonti
    disagreements?: { topic: string; positions: { claim: string; sources: Source[] }[]; prudentChoice: string }[];
    sources: Source[];
  };
  greenThumb: {                        // "Consigli dal pollice verde": fonti B e C, etichetta "non ufficiale"
    tip: string;                       // un trucco pratico, parole nostre
    sources: Source[];                 // almeno una, B o C
  }[];                                 // può essere vuoto
}

interface Source {
  title: string;
  url: string;
  accessedAt: string;
  kind: 'institutional' | 'scientific' | 'open-data' | 'nursery' | 'association' | 'editorial' | 'encyclopedia' | 'our-sheet';
  tier: 'A' | 'B' | 'C';               // A scientifico/istituzionale · B vivai e associazioni · C riviste, blog, Wikipedia
  readBy: 'claude' | 'user' | 'generator';   // 'user' per i siti che vietano l'AI (es. Gardenia)
  locator?: string;                    // dove si trova il dato: "sezione Watering", "tabella 2"
}

interface FamilyNote {
  family: string;
  notes: { topic: 'toxicity' | 'pests' | 'handling'; text: string; sources: Source[] }[];
}

type PlantTypeIndex = Record<string /* genere */, { typeId: string; basis: 'wcvp' | 'family-majority' | 'manual' }>;
```

**Come arrivano al telefono:**
- **Schede verificate** (specie, generi, tipi, note di famiglia): **file statici** sul nostro sito, in
  `public/schede/…/<id>.json`. Il telefono scarica solo la scheda che apre (10-25 KB); il service worker conserva quelle
  delle piante salvate. Stima con 1.000 specie: 15-30 MB sul server **(limiti di Vercel Hobby da verificare al T3)**.
- **Schede generate:** salvate su **Upstash Redis**, gratuito e già previsto ([scheda](../api-documentation/ai-schede-generate.md)).
  Una volta generate valgono per tutti. Ogni settimana si esportano anche nel repository, come archivio pubblico e base
  per le schede verificate.
- Adattatori:
  - `CareSheetProvider.getBest(species, genus, family)` restituisce `{ sheet, level, origin, familyNote? }`;
  - `CardWriter` e `GeneratedCardStore` (§6).

## 5. Rilascio progressivo e tempi (ricalcolati il 2026-11-18)
**Ipotesi dichiarate:**
- **circa 5 sessioni di lavoro di Claude a settimana**, divise tra codice e schede;
- **blocco di 10 schede = 1 sessione**; revisione dell'utente: 5 minuti per blocco;
- una scheda di genere o di tipo vale 1,3 schede di specie; una nota di famiglia vale 0,3.

Si ricalcola dopo il blocco 1.

**Ordine dei rilasci (decisione dell'utente del 2026-11-18): utile il prima possibile, a pezzi.** Ogni rilascio si
pubblica appena è pronto e verificato.

| Rilascio | Contenuto | Lavoro (stima) | Quando (stima) |
|---|---|---|---|
| **R0** | Riconoscimento Pl@ntNet da foto per qualsiasi pianta: nome, specie simili, affidabilità (passi 2.1-2.3 e messaggi d'errore di 2.4) | ~4 sessioni, dopo la chiave su Vercel | **circa 26-27 novembre 2026** |
| **R1** | **18 schede per tipo di pianta** + **60 note di famiglia** + motore e schermata della scheda (3.3a): ogni foto ha subito una scheda completa | ~2 sessioni di codice + ~4-5 blocchi | **circa 4-5 dicembre 2026** |
| **R2** | **Schede generate al momento** (Cloudflare Workers AI + Upstash, dopo la prova su 10 specie) | ~3-4 sessioni + account Cloudflare e Upstash (utente) | **circa 11-14 dicembre 2026** |
| **Poi, ogni settimana** | 3-4 blocchi di schede verificate (30-40), che **sostituiscono** quelle generate: 30 specie di casa (entro fine dicembre), generi di casa, generi all'aperto, balcone, orto, specie all'aperto | 3-4 sessioni a settimana | dal **15 dicembre 2026** |
| T1 (riferimento) | 18 tipi, 60 note, 120 generi, 80 specie verificate | ~21 blocchi dopo R1, a 3-4 a settimana | **circa fine gennaio 2027** |
| T2 | 300 generi, 300 specie verificate | +45 blocchi (~13 settimane) | circa fine aprile 2027 |
| T3 | fino a 1.000 specie verificate | +70 blocchi (~20 settimane) | circa settembre 2027 |

**Cosa significa per l'utente dell'app:**
- **da R0** l'app riconosce qualsiasi pianta (nome, specie simili, affidabilità);
- **da R1** ogni pianta riconosciuta ha una scheda completa: almeno quella del tipo di pianta;
- **da R2** quasi ogni specie ha la sua scheda: verificata, oppure generata e dichiarata come tale;
- le schede verificate crescono ogni settimana e **sostituiscono** quelle generate.

## 6. Schede generate al momento (opzione B corretta)
**Decisione dell'utente del 2026-11-18**, che rivede D6. Servizio e verifiche:
[AI gratuita per le schede generate](../api-documentation/ai-schede-generate.md).

**Come funziona.** Per una specie riconosciuta senza scheda verificata, il server:
1. raccoglie **dati reali**:
   - la nostra scheda del genere e quella del tipo di pianta;
   - le note di famiglia;
   - Wikidata;
   - Wikipedia (italiana o inglese);
   - EIVE e WCVP;
2. chiede a un'**AI gratuita** (proposta: Cloudflare Workers AI) di scrivere la scheda nel formato `CareSheet`,
   **citando solo quei dati**;
3. la controlla;
4. la salva per tutti.

**Mai dalla sola memoria del modello.**

**Regole della scheda generata:**
- tutte le sezioni, con **"Linee guida"** e **"Consigli dal pollice verde"** separati;
  - nelle linee guida solo fonti A: la nostra scheda di genere o di tipo, EIVE, WCVP;
  - Wikipedia vale come fonte C: va solo nel pollice verde, con l'etichetta "non ufficiale";
- in cima: **"Scheda generata automaticamente"**, con le fonti usate e la data;
- **tossicità:** mai "innocua" senza fonte verificata; altrimenti **"non verificata"** con il consiglio prudente;
- si genera **una volta per specie** e si salva (cache gratuita); una scheda verificata la **sostituisce**;
- se il servizio non risponde o finisce le richieste del giorno, la scheda del genere o del tipo, **subito**. Mai una
  risposta vuota.

**Controlli automatici al momento:**
- formato completo;
- solo fonti ricevute;
- ogni numero presente nelle fonti;
- livelli delle fonti;
- tossicità;
- nessuna contraddizione tra pollice verde e linee guida;
- anti-copia.

Se un controllo fallisce, la scheda **non si salva** e si mostra quella del genere o del tipo.

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| Un dato sbagliato in una scheda (es. una pianta tossica detta innocua) | Media | Tossicità solo da fonti A o due B concordi; tabella della tossicità approvata dall'utente in ogni blocco; nelle schede generate "non verificata" senza fonte verificata |
| Un consiglio "dal pollice verde" sbagliato o rischioso | Media | Mai in contraddizione con le linee guida (test automatico); etichetta "non ufficiale"; se contraddice, diventa un falso mito |
| L'AI gratuita inventa o sbaglia | Media | Solo dati ricevuti, controlli automatici, etichetta ben visibile, sostituzione con schede verificate ([dettagli](../api-documentation/ai-schede-generate.md)) |
| Il piano gratuito dell'AI cambia | Media | Due riserve (Groq, OpenRouter); senza AI restano genere e tipo, sempre completi |
| Revisione umana ridotta: errori che i test non vedono | Media | Agente di verifica indipendente frase per frase; letture complete facoltative; segnalazioni dell'utente dell'app (in futuro) |
| I tempi raddoppiano | Media | Ricalcolo dopo il blocco 1; R1 resta piccolo (solo tipi e note di famiglia); si riduce il ritmo settimanale, mai i controlli |
| Troppo materiale da un solo sito (diritto sulle banche dati) | Bassa | Più fonti per scheda; niente estrazioni sistematiche; parole nostre |
| Un sito fonte vieta gli strumenti di AI | Media | Controllo di robots.txt e termini; altrimenti lo legge l'utente, o si usa un'altra fonte |

## Decisioni aperte
- **Approvare l'[elenco casa, balcone e orto](../../data/elenco-priorita.json)** (61 specie, 42 generi).
- **Creare gli account** (li crea l'utente, con il suo permesso per ogni servizio nuovo): Upstash, già previsto per R1;
  Cloudflare per R2. Poi la scelta del modello dopo la prova su 10 specie.
