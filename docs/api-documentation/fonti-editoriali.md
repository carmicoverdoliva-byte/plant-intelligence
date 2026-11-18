# Fonti editoriali (blog e riviste) — scheda

> Ultima verifica: 2026-11-18 · Siti verificati: Vivai Le Georgiche (https://www.legeorgiche.it , blog su
> https://www.venditapianteonline.it/blog/), Gardenia (https://gardenia.cairoeditore.it), Vita in Campagna,
> Accademia dei Georgofili, CREA, Il Floricultore
> Collegati: [specifiche F21-F22, V-13](../requirements/specifiche-funzionali.md),
> [schema dei dati](../architecture/architettura.md#5-schema-dei-dati),
> [esempio del pothos](../requirements/esempio-scheda-pothos.md), [decisioni](../architecture/decisioni-da-prendere.md)

## In breve
Questa scheda risponde a tre domande sui siti italiani da cui vogliamo **consigliare articoli**:
1. esiste un **feed RSS** ufficiale? (Un feed RSS è un file che il sito pubblica con l'elenco dei suoi ultimi articoli,
   pensato per essere letto da altri programmi.)
2. cosa dicono i **termini d'uso** su link, citazioni e uso del feed in un'app?
3. si può fare, nella versione 1.1, una sezione **"Ultimi articoli su questa pianta"** con solo titolo e link dal feed?

Risposta breve: i **link** agli articoli sono consentiti, e sono la sezione "Approfondimenti" (F22) della v1, scelta a
mano. **Nessun sito dà un permesso esplicito per usare il feed in un'app.** Per la v1.1 i feed si useranno solo dopo un
**permesso scritto** dell'editore.

## Regole decise il 2026-11-18 (dall'utente)
1. **Siti confermati:** Vivai Le Georgiche, Gardenia, Vita in Campagna, Accademia dei Georgofili, CREA.
   **Escluso:** Il Floricultore.
2. **Feed RSS (v1.1):** solo con **permesso scritto** dell'editore **e controllo umano**. Ogni articolo arrivato dal feed
   viene letto da una persona prima di comparire nell'app; non esiste una sezione di articoli "non controllati".
   Testo dell'email per chiedere il permesso: [email-permesso-feed.md](email-permesso-feed.md) (da inviare a mano).
3. **Gardenia:** gli articoli li **legge e li sceglie l'utente**, a mano. Nessuno strumento di intelligenza artificiale
   apre, legge o riassume le pagine di Gardenia, per rispetto del suo `robots.txt` [8].

## Cosa usiamo e perché
- **v1, "Approfondimenti" (F22):** un elenco **scelto a mano** di articoli per ogni scheda, con titolo, nome del sito,
  una riga scritta da noi e il link all'articolo originale. Nessun servizio esterno: l'elenco è un dato statico dentro
  la scheda.
- **v1.1, "Ultimi articoli su questa pianta" (V-13, proposta):** titolo e link presi in automatico dal feed RSS, solo per
  i siti che lo permettono per iscritto.
- **Mai:** copiare, riassumere punto per punto o mostrare dentro l'app il testo, le immagini o i loghi degli articoli
  (CLAUDE.md §5). I feed di Le Georgiche e di Gardenia contengono il **testo completo** degli articoli: il nostro server
  lo **scarterebbe** subito, tenendo solo titolo, data e link.
- **Mai** dare questi articoli in pasto all'"assistente" o a un modello di intelligenza artificiale (vedi Gardenia e
  Vita in Campagna più sotto).

## Risultati per sito
Dati raccolti il 2026-11-18 aprendo le pagine pubbliche e il file `robots.txt` di ogni sito (`robots.txt` è il file
in cui un sito dice quali programmi automatici possono leggere quali pagine).

| Sito | Chi lo pubblica | Feed RSS | Termini su link, citazioni, feed | `robots.txt` | Uso proposto |
|---|---|---|---|---|---|
| **Vivai Le Georgiche** | Vivai Le Georgiche soc. agr., vivaio di Calvisano (BS) [1] | Sito principale: feed tecnico **vuoto** (0 articoli, ultimo aggiornamento 2022) [2]. **Blog** (sul sito del negozio venditapianteonline.it): feed **attivo**, `…/feed/`, 10 articoli, ultimo del 2026-09-30, con testo completo [3] | Nessuna pagina di termini d'uso. Piè di pagina: "copyright 2013 - tutti i diritti riservati"; pagina "Disclaimer": le fonti degli articoli sono citate quando disponibili [4]. Niente su link o feed | Nessun blocco per il feed [5] | **v1:** link scelti a mano (sì). **v1.1:** feed solo con permesso scritto |
| **Gardenia** | Cairo Editore; testata registrata a Milano nel 1983, in edicola dal 1984; il sito è del 2025 [6] | **Attivo**: `https://gardenia.cairoeditore.it/feed/`, 10 articoli, ultimo del 2026-11-17, con testo completo [7] | Nessuna pagina di termini d'uso trovata: solo privacy e cookie [6] | **Blocca tutti i programmi di intelligenza artificiale** (anche quelli di Anthropic) e dichiara `Content-Usage: ai=n` (nessun uso per l'AI) e `DisallowAITraining`; gli altri programmi sono ammessi [8] | **v1:** link letti e scelti **dall'utente**, a mano (regola 3). **v1.1:** feed solo con permesso scritto e controllo umano |
| **Vita in Campagna** (confermato) | Edizioni L'Informatore Agrario S.r.l. [9] | Non trovato (gli indirizzi `/feed` e `/rss` restituiscono pagine normali) | Contenuti di proprietà dell'editore; riproduzione solo senza scopo di lucro, con fonte e copyright; **scraping vietato**, cioè la raccolta automatica dei contenuti [9] | Blocca i programmi AI; `Content-Signal: ai-train=no, use=reference` [10] | **v1:** link scelti a mano. Forte su orto, frutteto, giardino; meno sulle piante d'appartamento. Niente feed |
| **Accademia dei Georgofili** (confermato) | Accademia dei Georgofili, Firenze | Non trovato | Materiale protetto da copyright o con licenza CC dove indicato; copia vietata senza consenso, salvo estratti per uso personale [11] | Blocca i programmi AI [10] | **v1:** link per i falsi miti di orticoltura generale (articoli scientifici divulgativi). Niente feed |
| **CREA**, Consiglio per la ricerca in agricoltura (confermato) | Ente pubblico di ricerca | **Attivo**, ma di **notizie istituzionali** (100 elementi), non articoli sulle singole piante [12] | **Licenza CC BY 3.0**, salvo dove indicato: riuso libero citando la fonte [12] | Nessun blocco | **v1:** anche come **fonte** per le schede e i falsi miti, oltre che per i link. Il feed serve a poco per "una pianta" |
| **Il Floricultore** (escluso il 2026-11-18) | Agrital Editrice [13] | Non trovato | "All Rights Reserved" [13] | — | **Escluso:** rivista per professionisti del settore, non per chi cura piante in casa |

**Non proposti:** i siti di guide generiche che vivono di pubblicità e motori di ricerca (es. Giardinaggio.it). La qualità
varia molto da articolo ad articolo e spesso non c'è un autore indicato.

## Cosa dice la legge, in parole semplici (non è un parere legale)
- **Link:** secondo la Corte di giustizia dell'UE (causa Svensson, C-466/12, 13 febbraio 2014), un link a un articolo
  **già libero sul web** non richiede il permesso dell'autore, perché non raggiunge un "pubblico nuovo" [14]. Non vale
  per i contenuti dietro abbonamento o pubblicati senza permesso (causa GS Media, C-160/15) [14].
- **Citazioni e riassunti:** la legge italiana sul diritto d'autore (L. 633/1941, art. 70) permette citazioni e
  riassunti di brani solo per critica o discussione, nei limiti di quello scopo e senza fare concorrenza all'opera [15].
  Noi **non citiamo e non riassumiamo**: scriviamo una riga nostra che dice di cosa parla l'articolo e perché leggerlo.
- **Feed RSS:** un feed è pubblicato per essere letto da altri programmi, ma **nessuno dei siti verificati concede una
  licenza esplicita** per mostrarlo in un'app. Per questo il permesso scritto è la strada prudente.

## Criterio di scelta degli articoli (F22, mostrato nell'app in "Come scegliamo gli articoli")
1. **Sito affidabile:** editore o autore identificabile (testata registrata, vivaio con sede e partita IVA, ente pubblico
   o universitario).
2. **Coerente con le fonti scientifiche della scheda:** prima di inserirlo, una persona confronta l'articolo con le
   fonti della scheda. **Se contraddice le fonti anche su un solo punto, compreso un numero, non lo inseriamo.**
3. **Leggibile gratis**, senza abbonamento né registrazione.
4. **Conflitti d'interesse dichiarati:** se il sito vende piante (es. un vivaio), la scheda lo dice ("sito di un vivaio").
5. **Solo titolo, nome del sito, una riga nostra e link.** Niente immagini, loghi, citazioni o riassunti.
6. **Ricontrollo:** a ogni nuova versione dell'app un test automatico verifica che i link funzionino, e una persona
   rilegge gli articoli aggiornati dopo l'ultima verifica.

**Esempio del criterio applicato (2026-11-18):** l'articolo di Le Georgiche "Ecco le 12 piante migliori per depurare
l'aria (ma è tutto falso)" (2025-08-07) arriva alla conclusione giusta, ma riporta per una pianta **0,0023 m³/h** di aria
pulita, mentre lo studio da cui prende il dato indica una mediana di **0,023 m³/h**, dieci volte di più [16].
**Escluso.** Per lo stesso falso mito usiamo l'articolo di Gardenia, che è coerente con lo studio.

## Come lo usiamo nel codice (adattatore)
- **v1:** nessun adattatore. Gli articoli sono un campo statico della scheda (`furtherReading`, vedi
  [schema dei dati](../architecture/architettura.md#5-schema-dei-dati)).
- **v1.1:** adattatore `ArticleFeedProvider` sul server, con implementazione `RssFeedProvider`:
  - legge **solo i feed autorizzati**, elencati in un file di configurazione insieme alla data del permesso;
  - mette gli articoli nuovi **in attesa**: compaiono nell'app solo dopo che una persona li ha letti e approvati
    (regola 2). Per Gardenia la persona è l'utente (regola 3);
  - lo fa **una volta al giorno** per sito e conserva il risultato (cache), per non pesare sui siti;
  - si presenta con un nome che dice chi è (`User-Agent: PlantIntelligence-feed`) e rispetta `robots.txt`;
  - tiene solo **titolo, data, link**; scarta testo, immagini e autore del feed;
  - abbina un articolo a una pianta solo se il **titolo** contiene il nome comune o scientifico (dalla tabella dei
    [sinonimi](sinonimi-botanici.md)).
- La libreria per leggere l'XML del feed va scelta al momento (licenza e costi da verificare, CLAUDE.md §4).

## Cosa succede se il servizio non risponde o il limite è superato
- **v1:** niente da gestire. Se un link si rompe, il test automatico lo segnala prima della pubblicazione e l'articolo
  viene tolto o sostituito.
- **v1.1:** se un feed non risponde, la sezione mostra l'ultimo elenco salvato con la data ("aggiornato il …"), oppure
  scompare. Gli Approfondimenti scelti a mano restano sempre.

## Alternative gratuite
- **Approfondimenti scelti a mano** (la v1): non dipendono da nessun feed. Sono il ripiego permanente.
- Fonti pubbliche con **licenza aperta** (es. CREA, CC BY 3.0 [12]), che si possono anche citare con attribuzione.

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| Un articolo consigliato viene modificato e diventa sbagliato | Media | Ricontrollo a ogni versione (vedi criterio 6); data dell'ultima verifica salvata in `checkedAt` |
| Il feed (v1.1) propone un articolo che contraddice la scheda | Media | Deciso: controllo umano di ogni articolo prima che compaia (regola 2). Costo: la sezione si aggiorna più lentamente |
| Un editore chiede di togliere i link o il feed | Bassa | Si toglie subito: è un dato statico o una riga di configurazione |
| L'utente prende un articolo esterno per un consiglio dell'app | Media | Etichetta "Articolo esterno" e nome del sito sempre visibili; il link apre Safari |
| Un vivaio è in conflitto d'interessi (vende piante) | Certa per i vivai | Dichiarato nella scheda (criterio 4) |
| Le pagine di Gardenia sono state lette una volta con uno strumento AI, prima di vedere il blocco nel `robots.txt` | Già successo (2026-11-18) | Da ora gli articoli di Gardenia li legge e li sceglie l'utente (regola 3) |

## Decisioni aperte
- Nessuna. Le decisioni del 2026-11-18 sono in "Regole decise".
- **Da fare prima della v1.1 (utente):** inviare a mano l'email di [richiesta del permesso](email-permesso-feed.md) a
  Vivai Le Georgiche e a Cairo Editore e salvare qui la risposta, con la data.

## Fonti
1. Vivai Le Georgiche, home page e piè di pagina (soc. agr., P.IVA indicata, sede di Calvisano) — https://www.legeorgiche.it/ — consultato il 2026-11-18
2. Vivai Le Georgiche, feed — https://www.legeorgiche.it/feed/ — consultato il 2026-11-18 (0 elementi, `lastBuildDate` 2022-06-28)
3. Vivai Le Georgiche, feed del blog — https://www.venditapianteonline.it/feed/ — consultato il 2026-11-18 (10 elementi, `lastBuildDate` 2026-09-30)
4. Vivai Le Georgiche, "Disclaimer" — https://www.legeorgiche.it/disclaimer/ — consultato il 2026-11-18
5. venditapianteonline.it, `robots.txt` — https://www.venditapianteonline.it/robots.txt — consultato il 2026-11-18
6. Gardenia, "Chi siamo" — https://gardenia.cairoeditore.it/chi-siamo-gardenia-we/ — consultato il 2026-11-18
7. Gardenia, feed — https://gardenia.cairoeditore.it/feed/ — consultato il 2026-11-18 (10 elementi, `lastBuildDate` 2026-11-17)
8. Gardenia, `robots.txt` — https://gardenia.cairoeditore.it/robots.txt — consultato il 2026-11-18
9. Vita in Campagna, "Note legali" — https://vitaincampagna.it/note-legali — consultato il 2026-11-18
10. `robots.txt` di vitaincampagna.it e georgofili.it — consultati il 2026-11-18
11. Accademia dei Georgofili, "Termini" — https://georgofili.it/contenuti/termini/1738 — consultato il 2026-11-18
12. CREA, "Note legali" e feed delle notizie — https://www.crea.gov.it/note-legali — consultato il 2026-11-18
13. Il Floricultore, piè di pagina della home page — https://www.ilfloricultore.it/ — consultato il 2026-11-18
14. Corte di giustizia dell'UE, comunicato stampa n. 20/14 sulla causa C-466/12 (Svensson), 13 febbraio 2014 — https://curia.europa.eu/jcms/upload/docs/application/pdf/2014-02/cp140020it.pdf — consultato il 2026-11-18 tramite risultati di ricerca; causa GS Media C-160/15 citata da fonti secondarie **(da rileggere sul testo ufficiale)**
15. L. 22 aprile 1941 n. 633, art. 70 (testo del comma 1 su Filodiritto) — https://www.filodiritto.com/codici/legge-sulla-protezione-del-diritto-dautore-e-di-altri-diritti-connessi-al-suo-esercizio-l-22-aprile-1941-n-633/capo-v-eccezioni-e-limitazioni/art-70 — consultato il 2026-11-18 tramite risultati di ricerca **(da rileggere su Normattiva)**
16. B. E. Cummings, M. S. Waring, "Potted plants do not improve indoor air quality: a review and analysis of reported VOC removal efficiencies", *Journal of Exposure Science & Environmental Epidemiology* 30, 253-261 (2020; online il 2019-11-06), DOI 10.1038/s41370-019-0175-9 — abstract letto su Europe PMC il 2026-11-18
