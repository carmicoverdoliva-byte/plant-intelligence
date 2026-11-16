# Pl@ntNet — analisi concorrente

> Ultimo aggiornamento: 2026-11-16 · Versione app osservata: 3.27.4 (App Store USA, pubblicata il 7 ottobre; anno non indicato, presumibilmente 2026 — da verificare) · Piattaforme: iOS / Android / Web

Questa scheda si basa solo su informazioni pubbliche (pagine degli store, sito e documentazione ufficiale dell'API, test indipendenti).
Le valutazioni 1-5 sono un **giudizio nostro**. Ciò che non è confermato da una fonte affidabile è marcato **(da verificare)**.
I numeri tra parentesi quadre, es. [1], rimandano alla sezione 8 "Fonti".

> **Nota importante per noi:** Pl@ntNet non è solo un concorrente. È anche il **servizio di riconoscimento previsto per Plant
> Intelligence** (CLAUDE.md §9). Per questo la scheda include i dati sull'API gratuita (sezione 2, riga "Riconoscimento", e
> sezione 6).

## 1. Sintesi
Pl@ntNet è un progetto **scientifico e partecipativo** francese, gestito da enti di ricerca pubblici (CIRAD, INRAE, INRIA,
IRD) [1][2]. L'app è **gratuita, senza abbonamenti** [1][2] e si finanzia con fondi pubblici, progetti europei e donazioni [2].
Il punto forte è il **rigore**: mostra una lista ordinata di specie possibili, ciascuna con una percentuale di confidenza [1],
e le osservazioni degli utenti vengono riviste dalla comunità e dagli scienziati [1]. Il punto debole è che si ferma al
riconoscimento: non offre consigli di cura, promemoria né diagnosi delle malattie nell'app. Inoltre riconosce meno bene le
piante coltivate e ornamentali [1].

## 2. Tabella funzionalità
| Area | Cosa offre | Gratis / A pagamento | Valutazione (1-5) | Fonte |
|------|------------|----------------------|-------------------|-------|
| Riconoscimento | Foto di fiore, foglia, frutto, corteccia, pianta intera; si possono inviare più foto della stessa pianta (fino a 5 tramite API) [1][4]. Il sito indica 84.710 specie [2]; la pagina dello store indica ancora circa 20.000 specie [1] (testo forse non aggiornato, **da verificare**). Mostra **risultati ordinati con percentuale di confidenza** [1]. Le piante coltivate sono riconosciute meno bene [1]. Test indipendenti: 66% al primo suggerimento [6]; 68% corrette + 13% parziali [7]; 70% corrette + 22,5% parziali su piante della California [5]. Funziona anche **senza connessione** (modello offline) [1]. | **Gratis** | 4 | [1][2][4][5][6][7] |
| Diagnosi malattie | Nell'app: **non presente** (nessuna menzione [1]). L'API offre un rilevamento delle malattie in versione sperimentale ("beta") [3]. | — (beta solo via API) | 1 | [1][3] |
| Schede botaniche | Gallerie di immagini per specie, genere e famiglia; mappa mondiale di distribuzione delle specie; filtri per tratti [1]. Contenuti scientifici; tossicità e usi: **(da verificare)**. | Gratis | 3 | [1] |
| Consigli di cura | **Non presenti** (l'app non nomina cura né consigli di coltivazione [1]). | — | 1 | [1] |
| Posizione / meteo / luce | Usa la posizione per localizzare le osservazioni e mostrarle su una mappa [1]; flore regionali e "previsione geografica" (tramite API) [3]. Meteo e luce: **non presenti**. | Gratis | 2 | [1][3] |
| Promemoria e collezione | Cronologia delle proprie osservazioni, mappa delle osservazioni, flore preferite [1]. Promemoria: **non presenti**. | Gratis | 2 | [1] |
| Onboarding e Guida | Primo avvio, spiegazione dei permessi, tutorial su come fotografare e FAQ nell'app: **(da verificare)**. Lo store dà indicazioni su quali parti fotografare (fiori, frutti, foglie sono le più utili) [1]. | — | non valutato | [1] |
| UX (passaggi per un riconoscimento) | Numero di tocchi: **non trovato**, da misurare con il test manuale (sezione 7). | — | non valutato | — |

**Gratis e a pagamento, in sintesi.** L'app è gratuita, senza acquisti in-app [1]. Il progetto chiede donazioni volontarie [2].
L'**API per sviluppatori** ha un piano gratuito di **500 identificazioni al giorno**, senza carta di credito, con **uso
commerciale permesso** entro il limite [3]. Oltre il limite, il servizio risponde con un errore ("HTTP 429") fino a mezzanotte
UTC, senza costi [3]. Gli enti non profit ed educativi possono chiedere gratis un limite più alto, con l'obbligo di scrivere
"Powered by Pl@ntNet" [3]. Il piano Pro parte da 1.000 € l'anno [3].

## 3. Punti di forza
- **Onestà sui risultati**: lista di specie possibili con percentuale di confidenza, invece di un solo nome [1][3].
- **Completamente gratuita**, senza pubblicità né abbonamenti; progetto pubblico e scientifico [1][2].
- **Più foto della stessa pianta** (fiore + foglia + frutto…) per un risultato più affidabile [1][4].
- **Funziona offline** grazie al modello sul telefono [1].
- **Scienza partecipativa**: le osservazioni sono riviste dalla comunità e alimentano dati aperti (GBIF) [1][2].
- **Privacy più rispettosa**: lo store non dichiara dati usati per tracciare l'utente [1].
- **API gratuita e documentata** che possiamo usare legalmente [3][4].

## 4. Punti deboli
- **Nessuna funzione di cura**: niente consigli, promemoria, luce o meteo [1].
- **Nessuna diagnosi delle malattie** nell'app [1].
- **Piante coltivate e ornamentali riconosciute meno bene** [1]: è un limite per chi ha piante d'appartamento.
- **Al primo suggerimento è meno precisa di PictureThis** in alcuni test [5][6][7]. Contando le risposte parziali le distanze si
  riducono [5][7].
- **Pensata per esperti e naturalisti**: le scelte di flora, genere e famiglia possono confondere un principiante **(da verificare)**.
- **Testo dello store forse non aggiornato** (20.000 specie contro le 84.710 del sito) [1][2].

## 5. Idee da prendere
- **Lista di alternative con percentuale**: è esattamente il comportamento richiesto dal CLAUDE.md §8.
- **Più foto della stessa pianta** con indicazione dell'organo (fiore, foglia, frutto, corteccia), per migliorare il risultato.
- **Suggerimenti su cosa fotografare** (fiori e frutti sono più utili delle sole foglie).
- **Usare l'API ufficiale** di Pl@ntNet attraverso il nostro adattatore `PlantRecognitionProvider`.
- **Flore regionali / previsione geografica** per migliorare i risultati in base a dove si trova l'utente (con il suo permesso).

Tutto va realizzato con parole, grafica e icone nostre. Dove richiesto dai termini d'uso, va indicato "Powered by Pl@ntNet".

## 6. Idee da migliorare
- **Unire il rigore di Pl@ntNet alla cura di Planta**: dopo il riconoscimento, piano di cura, promemoria, meteo (Open-Meteo) e
  sole stimato (SunCalc), tutto gratis.
- **Percentuali spiegate in parole semplici** per i principianti (es. "molto probabile", "possibile", "incerto: prova un'altra foto").
- **Gestire con chiarezza il limite di 500 identificazioni al giorno** (CLAUDE.md §4): contare le richieste sul server, mostrare
  un messaggio comprensibile quando il limite è raggiunto ("riprova domani"), senza far rompere l'app. Valutare di chiedere
  l'accesso esteso gratuito non profit/educativo.
- **Diagnosi delle malattie**: valutare la funzione beta dell'API, presentandola chiaramente come sperimentale e incerta.
- **Onboarding per principianti**: tutorial su come fotografare, permessi spiegati, Guida sempre raggiungibile (CLAUDE.md §6).
- **Documentare l'API** in `docs/api-documentation/` (limiti, condizioni, alternative), come chiede il CLAUDE.md §4.

## 7. Protocollo di test manuale (iPhone)

**Prima di iniziare**
- Installa Pl@ntNet da zero dall'App Store. L'app è gratuita: se compare una richiesta di donazione, non è obbligatoria.
- Usa lo stesso set di 7 foto già scattato per le altre app.

| # | Foto | Cosa misura |
|---|------|-------------|
| F1 | Pianta d'appartamento comune, foglia ben illuminata (es. pothos) | riconoscimento facile |
| F2 | Fiore in primo piano | riconoscimento da fiore |
| F3 | Solo foglia di un albero/arbusto da esterno | riconoscimento difficile |
| F4 | Foto sfocata o scura della stessa pianta di F1 | comportamento con foto scarse |
| F5 | Foglia con macchie / ingiallita | diagnosi malattie |
| F6 | Oggetto che non è una pianta (es. tazza) | onestà: dice "non so"? |
| F7 | Due specie simili (es. due succulente) | alternative e confidenza |

**Controlli sul primo avvio** (rispondi sì/no e aggiungi note)
| Controllo | Risultato | Note |
|-----------|-----------|------|
| Quante schermate prima di poter usare l'app? Si possono saltare? | | |
| Compare una richiesta di account, donazione o pagamento? | | |
| C'è un tutorial su come fotografare una pianta (quale organo)? | | |
| Chiede la fotocamera? Spiega prima il motivo? | | |
| Chiede la posizione? Quando e perché? | | |
| Esiste una sezione Guida / FAQ / Aiuto nell'app? Dove? | | |

**Risultati per foto** (una riga per foto)
| Foto | Specie proposta | Corretta? (sì / no / parz.) | Confidenza mostrata (es. %, parole, niente) | Alternative mostrate (quante) | Tocchi fino al risultato | Tempo indicativo (s) | Richiesta di pagamento? | Note |
|------|-----------------|------------------------------|---------------------------------------------|-------------------------------|--------------------------|----------------------|-------------------------|------|
| F1 | | | | | | | | |
| F2 | | | | | | | | |
| F3 | | | | | | | | |
| F4 | | | | | | | | |
| F5 | | | | | | | | |
| F6 | | | | | | | | |
| F7 | | | | | | | | |

**Altri controlli specifici per Pl@ntNet**
- Prima di inviare la foto, l'app chiede di indicare l'organo (foglia, fiore…)? Lo riconosce da sola?
- Che flora (zona geografica) è impostata all'inizio? È chiaro come cambiarla?
- Prova F1 con la modalità aereo attiva: il riconoscimento offline funziona? Il risultato è uguale?
- Con F5 l'app dice qualcosa sulla malattia o solo sulla specie?
- Con F6 (tazza) mostra percentuali basse o un avviso?

## 8. Fonti
1. PlantNet, pagina App Store (USA) — https://apps.apple.com/us/app/plantnet/id600547573 — consultato il 2026-11-16
2. Sito ufficiale Pl@ntNet — https://plantnet.org/en/ — consultato il 2026-11-16
3. Pl@ntNet API, pagina dei piani e delle condizioni — https://my.plantnet.org/ — consultato il 2026-11-16
4. Pl@ntNet API, documentazione "Single-species identification" — https://my.plantnet.org/doc/api/identify — consultato il 2026-11-16 (contenuto ricavato dai risultati di ricerca, **da rileggere** prima dello sviluppo)
5. Garden Myths (Robert Pavlis), "The Best Plant ID App – We Tested 7 Different Ones" (40 foto, piante della California; Pl@ntNet 65/80 punti) — https://www.gardenmyths.com/the-best-plant-id-app-we-tested-7-different-ones/ — data non indicata (commenti fino al 2025-12-04), consultato il 2026-11-16
6. University of Maryland Extension, "Snap it or scrap it? Putting plant ID apps to the test" — https://extension.umd.edu/resource/snap-it-or-scrap-it-putting-plant-id-apps-test — data non indicata, consultato il 2026-11-16
7. GrowIt BuildIt, "Testing Plant Identification Apps – Which Is Best?" (234 immagini) — https://growitbuildit.com/plant-identification-apps-tested/ — dati al 2024-05-24
