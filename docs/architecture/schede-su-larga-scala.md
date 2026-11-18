# Schede di cura complete per qualsiasi pianta riconosciuta — progetto

> Proposto il 2026-11-18 · Stato: **da approvare** (decisione [D13](decisioni-da-prendere.md#d13--schede-complete-per-qualsiasi-pianta-riconosciuta))
> Collegati: [banche dati aperte](../api-documentation/banche-dati-cura.md), [architettura §5](architettura.md#5-schema-dei-dati),
> [esempio di scheda (pothos)](../requirements/esempio-scheda-pothos.md), [piano v1](../requirements/piano-v1.md)

## In breve
**Il problema.** Il piano diceva "22 schede complete nella v1", cioè solo le piante dell'anteprima live. Per tutte le
altre c'era un ripiego per gruppo, poco preciso. È stato un errore di pianificazione. L'utente vuole la **scheda
completa** per **qualsiasi** pianta riconosciuta:
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

**La proposta, in quattro idee:**
1. **Tre livelli di scheda, tutti con le stesse sezioni complete:**
   - **specie**, la più precisa;
   - **genere**, la rete di sicurezza;
   - **tipo di pianta**, il paracadute: esiste per *ogni* pianta, per costruzione.

   L'app usa sempre la più precisa disponibile e **lo dice** in cima alla scheda.
2. **Si scrive prima ciò che la gente fotografa davvero.** L'ordine viene dai dati aperti di Pl@ntNet su GBIF per le
   piante all'aperto, e da un elenco a parte per casa e orto.
3. **Si produce a blocchi di 10 schede**, ognuno con fonti citate e un controllo di qualità in quattro parti:
   - test automatici;
   - verifica "chi scrive non è chi controlla";
   - confronto con i dati aperti;
   - revisione a campione dell'utente.
4. **Nessun dato inventato:** ogni numero ha la sua fonte. Dove le fonti non permettono di generalizzare (per esempio la
   tossicità di un genere intero), la scheda lo dice e dà un consiglio prudente.

## 1. I tre livelli (più le note di famiglia)

```text
Pl@ntNet riconosce:  specie (es. Ficus elastica) ─┐
                                                  ▼
  1. Scheda della SPECIE?        sì → "Scheda della specie"                      (la più precisa)
                     │ no
  2. Scheda del GENERE (Ficus)?  sì → "Scheda del genere Ficus: vale per la      (rete di sicurezza)
                     │ no              maggior parte dei Ficus. La tua può avere qualche differenza."
  3. Scheda del TIPO DI PIANTA   sempre → "Consigli per: albero/arbusto da        (paracadute: c'è sempre)
     (es. "arbusto sempreverde          appartamento di clima tropicale.
      di clima tropicale")              La scheda della specie non è ancora disponibile."
  + NOTE DI FAMIGLIA (Moraceae), quando ci sono: tossicità tipica, parassiti tipici della famiglia
```

| Livello | Quante ne servono | Da dove arriva l'abbinamento | Precisione |
|---|---|---|---|
| **Specie** | centinaia, a crescere | nome della specie da Pl@ntNet, passato dalla tabella dei sinonimi | alta |
| **Genere** | 120 nella v1, 300 nella v1.1 | genere da Pl@ntNet | media: valori come **intervalli**, eccezioni dette |
| **Tipo di pianta** | circa **18**, tutte nella v1 | forma di vita + clima d'origine da **WCVP** (Kew, CC BY), calcolati sul PC per **ogni genere** della flora di Pl@ntNet | di base, ma onesta e completa |
| Note di famiglia | circa 60 | famiglia da Pl@ntNet | aggiunta, non una scheda |

**Perché non la "scheda di famiglia" come livello.** Una famiglia mette insieme piante troppo diverse: le Rosacee
comprendono la fragola, la rosa e il ciliegio, e un consiglio d'acqua per tutte e tre non servirebbe. La famiglia
serve invece per avvisi comuni, come le euforbiacee con lattice irritante. Per questo diventa una **nota** aggiunta alla
scheda.

**I tipi di pianta proposti** (elenco da confermare durante il blocco 1):
- casa (clima tropicale o subtropicale): pianta verde da foglia, rampicante/ricadente, epifita (orchidee, bromelie),
  succulenta, cactus, felce, palma, bulbosa da fiore;
- esterno (clima temperato e mediterraneo): albero a foglia caduca, albero sempreverde, conifera, arbusto a foglia
  caduca, arbusto sempreverde, rampicante, erbacea perenne, annuale o biennale, bulbosa, graminacea, pianta acquatica;
- ortaggi e aromatiche, come tipo a parte.

Se WCVP non ha la forma di vita di un genere, si usa quella più frequente nella sua famiglia, dichiarandolo. Se manca
anche quella, si usa una scheda universale "pianta in vaso o in giardino". **Nessuna pianta resta senza scheda.**

**Toccare il popup dell'anteprima live** apre la scheda del livello migliore disponibile. Il catalogo dell'anteprima
(D10) e l'elenco delle schede sono quindi **separati**: le 22 piante della prova D11 entrano semplicemente nel primo blocco.

## 2. Quali specie e generi scrivere prima

**All'aperto: lo dicono i dati.** Pl@ntNet pubblica su GBIF, con licenza CC BY, le foto dei suoi utenti con luogo e
data. Conteggi del 2026-11-18 (dettagli in [banche dati aperte](../api-documentation/banche-dati-cura.md)):

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

La stima prudente viene dalle foto confermate da persone esperte; quella ottimista dalle foto riconosciute in automatico.

**In casa e nell'orto: un elenco a parte.** Su GBIF finiscono poche foto di piante d'appartamento e di ortaggi. L'elenco
si costruisce da:
- le piante d'appartamento trattate dai siti istituzionali (RHS, servizi universitari);
- le piante delle schede già esistenti;
- l'esperienza dell'utente.

Stima di partenza: circa **60 specie e 40 generi** coprono la grande maggioranza delle piante vendute in Italia. Questo
numero **non è misurato**: va confermato.

**Regola d'ordine dei blocchi:**
1. i generi e le specie di casa, perché sono le piante dell'app e del pubblico principale;
2. i generi all'aperto più fotografati;
3. ortaggi e aromatiche;
4. le specie all'aperto, seguendo la classifica di GBIF.

L'elenco si salva in `data/elenco-priorita.json`, con la data dei conteggi.

## 3. Come si produce un blocco (10 schede)

**Metodo di scrittura (deciso dall'utente il 2026-11-18).** Si segue la skill `plant-schede`
(`.claude/skills/plant-schede/SKILL.md`).
- **Più fonti autorevoli per ogni pianta**, di tre livelli:
  - **A**: orti botanici, università, enti di ricerca, servizi pubblici;
  - **B**: vivai specializzati e associazioni;
  - **C**: riviste e blog di settore affidabili.
- Si ricavano **fatti e consigli pratici**, e si scrive con **parole nostre** un **riassunto** e una lista di
  **"cose da fare"** per ogni sezione, citando ogni fonte con link.
- **Mai** copiare testi, né riprodurre un articolo frase per frase.
- **Qualità = autorevolezza della fonte + accordo tra più fonti:**
  - numeri, tossicità e verdetti dei falsi miti richiedono almeno una fonte A, oppure due B concordi;
  - le fonti C sostengono solo consigli pratici coerenti con A e B.
- **Se le fonti si contraddicono:** si dichiara nella scheda, si indica la via prudente e si valuta una voce in
  **"Falsi miti"**.
- **Siti che vietano l'uso dell'AI** (es. Gardenia): non si aprono con strumenti automatici. Li legge e li seleziona
  l'utente.


```text
 1. ELENCO      prossime 10 voci dall'elenco di priorità
 2. FONTI       per ogni sezione, 2+ fonti di livello A/B/C (3 per numeri e sicurezza), almeno una A per i numeri;
                prima di aprire un sito: robots.txt e termini d'uso (se vieta l'AI → lo legge l'utente, o non si usa)
 3. BOZZA       per ogni sezione: riassunto + "cose da fare" con parole nostre, campi strutturati; ogni numero con la sua fonte
                e l'indicazione di DOVE si trova nella fonte (es. "sezione Watering")
 4. CONTROLLI   test automatici (sotto) ──── falliti? → si torna al punto 3
 5. VERIFICA    un secondo agente, che NON ha scritto la bozza, rilegge le fonti frase per frase:
                ogni affermazione non trovata nella fonte viene segnalata e tolta o corretta
 6. RIEPILOGO   tabella per l'utente: schede del blocco, segnalazioni, scelte fatte quando le fonti non concordano
 7. REVISIONE   l'utente legge per intero 2 schede su 10 (scelte a caso) + tutte le segnalazioni
 8. PUBBLICA    commit, push; la scheda mostra "Verificata con le fonti il AAAA-MM-GG"
```

**Test automatici su ogni scheda** (`npm run schede:controlla`):
1. **Completezza:**
   - ci sono tutte le sezioni;
   - ogni sezione ha almeno una fonte;
   - ogni numero ha una fonte.
2. **Coerenza interna:**
   - la temperatura minima è più bassa dell'ideale, che è più bassa della massima;
   - i periodi coincidono con le stagioni;
   - i promemoria nascono solo da valori con fonte.
3. **Confronto con i dati aperti:**
   - per le piante europee, luce, umidità e temperatura si confrontano con **EIVE**: per esempio "pieno sole" contro
     un valore di luce da pianta d'ombra fa scattare una segnalazione;
   - il clima d'origine si confronta con **WCVP**: una pianta tropicale con minima sotto i 5 °C fa scattare una
     segnalazione.
4. **Coerenza fra livelli:** i valori di una specie stanno dentro gli intervalli del suo genere, oppure c'è scritto
   perché no.
5. **Anti-copia:** nessuna sequenza di **8 o più parole uguali** a un testo delle fonti che lo strumento può leggere.
   Per le altre fonti, controllo dell'utente.
6. **Fonti vive:** ogni indirizzo risponde, e la data di consultazione non è più vecchia di 3 anni.
7. **Niente percentuali inventate:** la frequenza dei problemi è solo a parole, come la dice la fonte (regola F20).

**Cosa la scheda mostra all'utente**, sempre in cima:
- il **livello**: "Scheda della specie", "Scheda del genere", "Consigli per il tipo di pianta";
- lo **stato del controllo**: "Verificata con le fonti il 18/11/2026" oppure "Verificata con le fonti e rivista da una
  persona".

Tutte le fonti sono raggiungibili da ogni sezione.

**Sezioni che non si possono generalizzare.** Nelle schede di genere e di tipo la sezione c'è sempre, ma dice la verità.
- *Tossicità:* "Nel genere ci sono specie tossiche e specie innocue: finché non conosci la specie, tienila lontana da
  bambini e animali."
- *Falsi miti:* quelli del gruppo e quelli che valgono per tutte le piante in vaso (es. la ghiaia sul fondo).
- *Approfondimenti:* solo se si trova un articolo davvero adatto; altrimenti un messaggio onesto (regola F22, invariata).

## 4. Schema dei dati (sostituisce `Species.care` e `CareGroup`)
Una sola struttura per i tre livelli, così l'app mostra tutte le schede allo stesso modo. Le sezioni riusano i tipi già
progettati ([architettura §5](architettura.md#5-schema-dei-dati)).

```ts
interface CareSheet {
  id: string;                          // es. "species/ficus-elastica", "genus/ficus", "type/arbusto-tropicale"
  level: 'species' | 'genus' | 'plant-type';
  taxon?: { scientificName: string; rank: 'species' | 'genus'; family: string };  // assente per 'plant-type'
  appliesTo: string;                   // "la maggior parte dei Ficus coltivati in casa" (parole nostre)
  summary: string;                     // riassunto della scheda, parole nostre (metodo dell'utente, 2026-11-18)
  todo: string[];                      // "cose da fare" principali, azioni concrete
  // Ogni sezione qui sotto ha inoltre: summary (riassunto), todo (cose da fare) e, se le fonti non concordano,
  // disagreements: { topic: string; positions: { claim: string; sources: Source[] }[]; prudentChoice: string;
  //                  mythCandidate: boolean }[]
  exceptions?: string[];               // "Ficus carica (fico) vive all'aperto: vedi la sua scheda"
  // TUTTE obbligatorie, a ogni livello:
  light: LightGuide;
  water: WaterGuide;
  temperatureC: TemperatureGuide;
  soil: SoilGuide;
  fertilizer: FertilizerGuide;
  repotting: RepottingGuide;
  propagation: PropagationGuide;       // "Coltivarla da zero"
  commonProblems: CommonProblem[];     // problemi e malattie più comuni
  myths: MythCheck[];
  furtherReading: FurtherReading[];    // può essere vuoto: l'app lo dice
  toxicity: {
    pets: 'toxic' | 'non-toxic' | 'varies' | 'unknown';   // 'varies' solo per genere e tipo: consiglio prudente
    children: 'toxic' | 'non-toxic' | 'varies' | 'unknown';
    note: string;
    sources: Source[];
  };
  verification: {
    autoChecks: { name: string; passed: boolean; checkedAt: string }[];
    independentCheckAt: string;        // verifica del secondo agente, frase per frase
    humanReview?: { reviewedAt: string; scope: 'full' | 'spot' };
  };
  version: number;
  updatedAt: string;
}

interface Source {                     // esteso
  title: string;
  url: string;
  accessedAt: string;
  kind: 'institutional' | 'scientific' | 'open-data' | 'nursery' | 'association' | 'editorial';
  tier: 'A' | 'B' | 'C';               // A scientifico/istituzionale · B vivai e associazioni · C riviste e blog di settore
  readBy: 'claude' | 'user';           // 'user' per i siti che vietano l'AI (es. Gardenia)
  locator?: string;                    // dove si trova il dato nella fonte: "sezione Watering", "tabella 2"
}

interface FamilyNote {                 // note di famiglia, aggiunte alla scheda
  family: string;                      // "Euphorbiaceae"
  notes: { topic: 'toxicity' | 'pests' | 'handling'; text: string; sources: Source[] }[];
}

// File generato sul PC da WCVP: ogni genere della flora di Pl@ntNet → tipo di pianta
type PlantTypeIndex = Record<string /* genere */, { typeId: string; basis: 'wcvp' | 'family-majority' | 'manual' }>;
```

**Come arrivano al telefono.** Le schede sono **file statici** sul nostro sito, in `public/schede/…/<id>.json`.
- Non servono servizi esterni né database online, quindi resta tutto gratuito.
- Il telefono scarica **solo la scheda che apre**, circa 10-25 KB; il service worker conserva quelle delle piante salvate
  per l'uso senza rete.
- Un indice leggero (nome → scheda) serve per la ricerca per nome (F06).
- Stima con 1.000 specie, 300 generi e 18 tipi: **15-30 MB sul server**. È nei limiti dei file statici di Vercel Hobby
  **(da verificare al traguardo 3)**.
- Adattatore: `CareSheetProvider` (`getBest(speciesName, genus, family) → { sheet, level, familyNote? }`). Così un giorno
  le schede potranno arrivare da un'altra fonte senza cambiare le schermate.

## 5. Tempi e copertura (stima realistica)
**Ipotesi dichiarate:**
- un blocco di 10 schede = **una sessione di lavoro di Claude** (ricerca, bozza, controlli, verifica indipendente) più
  **30-45 minuti dell'utente** per la revisione a campione;
- **4-5 blocchi a settimana**, in parallelo con lo sviluppo dell'app;
- le schede di genere e di tipo valgono circa 1,3 schede di specie (servono intervalli ed eccezioni); le note di famiglia
  circa 0,3.

Le stime si **ricalcolano dopo il blocco 1**, con i tempi veri.

| Traguardo | Contenuto | Blocchi (stima) | Settimane (stima) | Copertura stimata |
|---|---|---|---|---|
| **T1 — versione 1** | 18 tipi, 60 note di famiglia, 120 generi (40 casa e orto, 80 esterno), 80 specie (60 casa e orto, comprese le 22 della prova D11; 20 esterno) | circa 26 | **6-7** | **scheda per il 100% delle piante riconosciute**; il genere o meglio per **~45-58%** delle foto all'aperto in Italia (80 generi) e per la gran parte delle piante di casa (da misurare); la specie per le piante di casa più comuni e per l'8-19% delle foto all'aperto (20 specie) |
| T2 — versione 1.1 | +180 generi (300 in tutto), +220 specie (300 in tutto) | circa 45 | 9-11 | genere o meglio 84-92%; specie 53-78% all'aperto |
| T3 — versioni 1.2-1.3 | fino a 1.000 specie | circa 70 | 14-18 | specie 88-98% all'aperto |

**Cosa cambia per la versione 1.** La v1 esce con il **traguardo T1**. La produzione delle schede parte **subito**, in
parallelo alle fasi 2 e 3, perché non dipende dal codice dell'app. Senza questo parallelo la v1 slitterebbe di 6-7
settimane.

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| Un dato sbagliato in una scheda (es. una pianta tossica detta innocua) | Media | Verifica indipendente frase per frase; tossicità sempre con 2 fonti concordi, altrimenti "unknown" e consiglio prudente; revisione dell'utente di **tutte** le voci tossicità del blocco |
| Le schede di genere sono troppo vaghe | Media | Intervalli ed eccezioni espliciti; si passa alla specie per i generi con piante molto diverse (Ficus, Euphorbia) |
| I tempi raddoppiano | Media | Ricalcolo dopo il blocco 1; si riduce T1 nei generi all'aperto, non nei controlli |
| Troppo materiale da un solo sito (diritto sulle banche dati) | Bassa | Almeno 2 fonti per scheda; niente estrazioni sistematiche; parole nostre |
| Un sito fonte vieta gli strumenti di AI | Media | Controllo di robots.txt e termini; altrimenti lo legge l'utente, o si usa un'altra fonte |
| L'utente non è un botanico: la revisione non basta a scoprire errori tecnici | Media | La revisione controlla **chiarezza e corrispondenza con le fonti**, non la competenza; in futuro, revisori esperti (D12, community) |
| Piante d'appartamento poco rappresentate nei dati | Certa | Elenco a parte, con priorità nei primi blocchi |

## Decisioni aperte
Vedi [D13](decisioni-da-prendere.md#d13--schede-complete-per-qualsiasi-pianta-riconosciuta):
- traguardo T1 per la v1;
- quota di revisione dell'utente;
- elenco iniziale di casa e orto.
