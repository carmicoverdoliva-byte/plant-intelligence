# Specifiche funzionali — Mandragola

> Ultimo aggiornamento: 2026-11-18 · Basato su: [visione prodotto](visione-prodotto.md), [analisi dei concorrenti](../competitor-analysis/matrice-confronto.md),
> [schede dei servizi](../api-documentation/) · Architettura: [architettura.md](../architecture/architettura.md)

Questo documento elenca **cosa fa l'app**, non come è programmata. Ogni funzione ha un codice (es. `F03`) per poterla citare.
I "criteri di accettazione" sono le condizioni da controllare per dire che la funzione è **fatta** (CLAUDE.md §3).

## 1. Principi (dalle 5 idee emerse dall'analisi dei concorrenti)
| # | Idea | Da quale concorrente | Funzioni collegate |
|---|---|---|---|
| I1 | **Risultati onesti**: specie più probabile + alternative + sicurezza spiegata a parole; "non so" quando serve | Pl@ntNet (sì), PictureThis (no) | F04, F05 |
| I2 | **Riconoscimento guidato**: consigli di scatto e seconda foto di un'altra parte se la prima non basta | Flora Incognita | F03, F05 |
| I3 | **Cura personalizzata con meteo e sole, gratis** | Planta (ma a pagamento) | F08, F10, F11, F12 |
| I4 | **Gratuità vera e limiti gestiti bene**: niente abbonamenti né schermate di vendita | contro PictureThis e Planta | F13, tutte |
| I5 | **Onboarding rispettoso e Guida sempre disponibile**, privacy senza tracciamento | contro PictureThis | F01, F02, F15 |
| I6 | **Riconoscimento a due livelli**: anteprima live sul telefono ("Forse…"), riconoscimento completo allo scatto | Seek (live sul dispositivo) | F03, F17 |

## 2. Versione 1 — minima ma utilizzabile
Obiettivo: chi apre l'app per la prima volta riesce a **riconoscere una pianta di casa**, **salvarla** nella collezione e
**ricevere promemoria di cura adattati alla sua finestra e al meteo**, senza pagare e senza registrarsi.

### F01 — Onboarding al primo avvio
- Schermata di benvenuto: cosa fa l'app, "gratis, senza pubblicità, senza account".
- Tutorial **come fotografare** una pianta: luce, inquadratura ravvicinata, una sola pianta a fuoco, fiori e frutti
  aiutano più delle foglie.
- Spiegazione di **come leggere i risultati**: specie più probabile, alternative, livello di sicurezza.
- Permessi **fotocamera** e **posizione**: prima una schermata che spiega **perché** servono, poi la richiesta di iOS.
  La posizione è **facoltativa**: in alternativa si può scrivere il nome del comune.
- **Guida all'installazione sulla schermata Home** (decisione D3): spiega con parole semplici che, se l'app resta solo in
  Safari, **Safari può cancellare i dati** (piante, foto, promemoria) dopo un periodo senza visite; poi mostra i passaggi
  con immagini: pulsante **Condividi** → **"Aggiungi a Home"** → **"Aggiungi"**. Ricorda anche che così, in futuro,
  arriveranno le notifiche.
- **Proposta del backup su file** (F14): spiega a cosa serve e dove salvarlo (es. iCloud Drive). Si può rimandare.
- **Anteprima live** (F17): spiega che il nome che compare inquadrando è un **"forse"** calcolato sul telefono, e che il
  risultato affidabile arriva **scattando la foto**. Il download del modello **non** si propone qui, ma alla prima
  apertura della fotocamera (D10).

**Criteri di accettazione:** ogni schermata si può saltare; l'onboarding si può ripetere dalla Guida; se l'utente nega un
permesso, l'app continua a funzionare e spiega come riattivarlo; se l'app è aperta da Safari e non dalla Home, compare un
invito discreto (chiudibile) a installarla.

### F02 — Guida sempre disponibile
- Voce **"Guida"** nel menu principale, raggiungibile da ogni schermata.
- Contiene: un tutorial per ogni funzione, **FAQ**, pulsante **"Ripeti il tutorial iniziale"**.
- **Prima volta in ogni sezione**: un breve riquadro di spiegazione, chiudibile e richiamabile con un'icona "?".
- I testi in-app e quelli in `docs/user-guide/` sono gli stessi (una sola fonte).

**Criteri:** nessuna funzione della v1 senza la sua voce nella Guida (CLAUDE.md §6).

### F03 — Riconoscimento da foto (livello 2: completo)
- È il **secondo livello** del riconoscimento: parte quando l'utente **scatta** (o tocca il popup dell'anteprima live, F17).
- Scatto dalla fotocamera o scelta dalla galleria; **da 1 a 5 foto della stessa pianta**.
- Per ogni foto l'utente indica la parte (foglia, fiore, frutto, corteccia, "non so").
- Il telefono **riduce le foto** prima dell'invio (lato corto 1280 pixel, JPEG di qualità 90%): l'invio è più veloce e
  vengono eliminate le informazioni nascoste come il luogo dello scatto.

**Criteri:** risultato in meno di 10 secondi con una buona connessione; nessun dato di posizione inviato insieme alla foto.

### F04 — Risultati onesti (idea I1)
> Aggiornata il 2026-11-17 con la decisione D9 (soglie tarate sul test; dettagli in
> [decisioni](../architecture/decisioni-da-prendere.md) e [scheda Pl@ntNet](../api-documentation/plantnet-api.md#test-d9-2026-11-17)).

**Come si presenta il risultato** (nessuna percentuale mostrata all'utente):
1. **Titolo: nome comune + genere**, es. **"Basilico, genere *Ocimum*"**. Il genere è il dato più affidabile: giusto nel
   93% dei casi nel test, contro il 65% della specie.
2. Sotto: la specie più probabile, introdotta da **"probabilmente"** ("probabilmente *Ocimum basilicum*").
3. **Fino a 4 alternative**, ognuna con **foto di confronto**, nome comune italiano e nome scientifico, per permettere
   all'utente di confrontare.
4. I nomi sono uniformati con la **tabella dei sinonimi** ([scheda](../api-documentation/sinonimi-botanici.md)): la
   stessa pianta ha sempre lo stesso nome.
5. Scritta "Riconoscimento: Pl@ntNet".

**Livelli** (soglie configurabili; s1 = punteggio della 1ª specie, s2 = della 2ª):

| Livello | Quando | Cosa vede l'utente |
|---|---|---|
| Non riconosciuta | risposta "nessuna pianta", oppure s1 < 10% e s1 < 5 × s2 | **"Non riesco a riconoscerla, prova con un'altra foto"** + consigli di scatto: avvicinati a una foglia o a un fiore, una sola pianta nell'inquadratura, buona luce, niente mosso. Pulsanti "Riprova" e "Cerca per nome" |
| Incerto | s1 < 30% | Titolo **"Non ne sono sicuro"**, poi "forse" + nome comune e genere; alternative in evidenza; invito ad aggiungere una foto (F05) |
| Probabile | s1 ≥ 30% | Titolo nome comune + genere; "probabilmente" + specie |
| Molto probabile | s1 ≥ 80% **e** distacco s1 − s2 ≥ 75 punti | Come sopra, ma "**molto probabilmente**" + specie |

**Criteri:**
- nessuna percentuale visibile all'utente;
- il titolo contiene sempre il genere;
- con la foto trappola della tazza non propone nessuna pianta;
- con la foto trappola della foglia secca mostra "Non riesco a riconoscerla";
- due nomi della stessa pianta presenti nella tabella dei sinonimi compaiono con lo stesso nome.

### F05 — Riconoscimento guidato (idea I2)
- Se il risultato è "probabile" o "incerto" (F04), l'app propone: "Aggiungi una foto di un'altra parte (es. il fiore) per un risultato migliore".
- La nuova foto viene inviata **insieme** alle precedenti (stessa pianta).
- L'utente può sempre scegliere a mano una delle alternative oppure "Nessuna di queste".

**Criteri:** dopo "Nessuna di queste", l'app offre la ricerca per nome (F06).

### F06 — Ricerca per nome
- Ricerca per nome comune o scientifico in un elenco di specie.
- È il **ripiego** quando il riconoscimento non è disponibile (limite raggiunto, servizio fuori uso, niente rete).

**Criteri:** funziona anche quando il riconoscimento restituisce errore 429.

### F07 — Scheda botanica
- Nome scientifico, nomi comuni, famiglia, foto di esempio, descrizione breve.
- **Tossicità** per animali e bambini, ben visibile, **solo se abbiamo una fonte affidabile**. Altrimenti: "Informazione
  non disponibile". Mai "non tossica" senza fonte.
- **Fonti** citate in fondo a ogni scheda.

**Criteri:** ogni scheda mostra almeno una fonte.

### F08 — Consigli di cura (idea I3)
- Acqua, luce, terreno, temperatura, concime, rinvaso. In più le sezioni **"Coltivarla da zero"** e **"Travaso"** (F18)
  e **"Problemi più comuni"** (F20).
- **Contenuto minimo delle sezioni** (ampliato il 2026-11-18):
  - **Acqua — quando e quanto.** Quando annaffiare (es. "terriccio asciutto in superficie: prova con un dito") e
    **quanto**, con indicazioni pratiche: "annaffia finché l'acqua esce dai fori, poi svuota il sottovaso". Più **come
    cambia** con la **stagione** e con il **vaso** (dimensione e materiale: la terracotta asciuga prima della plastica).
  - **Concime — tipo preciso.** Forma (liquido/idrosolubile, granulare, a lenta cessione); per **piante verdi o da
    fiore**; **rapporto NPK indicativo** (azoto-fosforo-potassio, es. "bilanciato, tipo 20-20-20"); **diluizione**;
    **frequenza**; **periodo** dell'anno; segnali di troppo concime.
  - **Temperatura — minima, ideale e massima**, in °C. Se una fonte non indica un valore (es. la minima), la scheda
    scrive "non indicata dalle fonti" e **non inventa un numero**.
- Ogni valore numerico (NPK, diluizione, temperature, frequenze) compare **solo se una fonte lo indica**. Se le fonti non
  sono d'accordo, la scheda mostra l'intervallo e indica la via prudente.
- **Scheda completa per QUALSIASI pianta riconosciuta** (correzione dell'utente del 2026-11-18, decisione
  [D13](../architecture/decisioni-da-prendere.md#d13--schede-complete-per-qualsiasi-pianta-riconosciuta), proposta;
  progetto: [schede su larga scala](../architecture/schede-su-larga-scala.md)). Sostituisce "circa 50 schede" e il
  ripiego per gruppo.
  - **Approvata il 2026-11-18 (A + B corretta).** Livelli, tutti con tutte le sezioni:
    - scheda della **specie verificata**;
    - scheda della **specie generata automaticamente** (AI gratuita, da dati reali: scheda del genere, Wikidata,
      Wikipedia, dati aperti), dichiarata in cima, con tossicità mai "innocua" senza fonte verificata, salvata una volta
      per tutti; se il servizio non risponde, si passa al genere o al tipo, mai una risposta vuota;
    - scheda del **genere** (rete di sicurezza: valori come intervalli, eccezioni dette);
    - scheda del **tipo di pianta** (circa 18 tipi, es. "arbusto sempreverde di clima mediterraneo"), che esiste per
      ogni pianta.

    In più, le **note di famiglia** (es. tossicità tipica).
  - **Ogni sezione ha due parti:**
    - **"Linee guida"**, solo da fonti ufficiali e autorevoli (A, o due B concordi);
    - **"Consigli dal pollice verde"**, trucchi di appassionati, vivai e blog (B e C), etichettati "non ufficiale", mai in
      contraddizione con le linee guida. Se le contraddicono, diventano "Falsi miti".
  - **Rilascio progressivo:** la prima pubblicazione ha i tipi di pianta, le note di famiglia e le specie di casa più
    comuni; poi schede nuove ogni settimana.
  - L'app usa **sempre la scheda più precisa disponibile** e lo dichiara in cima:
    - "Scheda della specie";
    - "Scheda del genere Ficus: vale per la maggior parte dei Ficus";
    - "Consigli per il tipo di pianta: la scheda della specie non è ancora disponibile".
  - Le schede si producono **a blocchi di 10**, partendo dalle piante più fotografate e coltivate. L'ordine viene dai
    dati di Pl@ntNet su GBIF per le piante all'aperto e da un elenco a parte per casa e orto.
  - Ogni blocco passa da un **controllo di qualità**: test automatici, verifica indipendente frase per frase con le
    fonti, confronto con dati aperti (EIVE, WCVP) e, da parte dell'utente, la sola tabella della tossicità (5 minuti per
    blocco; letture complete facoltative). La scheda mostra quando è stata verificata.
  - **Metodo (deciso dall'utente):**
    - per ogni pianta, **più fonti autorevoli**: orti botanici, università ed enti di ricerca, vivai specializzati,
      riviste e blog di settore affidabili;
    - per ogni sezione, un **riassunto** e una lista di **"cose da fare"** con parole nostre;
    - ogni fonte **citata con link** (titolo, sito, data di consultazione);
    - vietato copiare testi o riprodurre un articolo frase per frase (CLAUDE.md §5);
    - qualità = autorevolezza + accordo tra fonti; le contraddizioni si dichiarano e si valutano per "Falsi miti";
    - i siti che vietano l'AI li legge l'utente.
  - **Quando un dato non si può generalizzare** (es. la tossicità di un intero genere), la sezione c'è ma lo dice e dà
    un consiglio prudente, senza inventare.

**Criteri:**
- qualsiasi pianta riconosciuta (anche solo a livello di genere) apre una scheda con **tutte** le sezioni;
- il livello della scheda è sempre visibile;
- mai consigli specifici inventati;
- ogni sezione mostra almeno una fonte (controllato da un test automatico);
- ogni scheda ha "quanto" annaffiare, il tipo di concime e le tre temperature (valore con fonte oppure "non indicata
  dalle fonti");
- le schede generate mostrano "Scheda generata automaticamente" e le fonti usate;
- i consigli dal pollice verde sono sempre separati e marcati "non ufficiale";
- nella v1 almeno il traguardo T1 di D13, raggiunto per rilasci successivi.

### F18 — Coltivarla da zero e travaso
> Aggiunta il 2026-11-17. Estende le schede di cura (F08, decisione D8). Esempio completo:
> [scheda di esempio del pothos](esempio-scheda-pothos.md).

Ogni scheda di cura ha due sezioni in più.

**1. "Coltivarla da zero"**
- **Metodi adatti a quella pianta**, scelti tra: seme, talea (di fusto o di punta), divisione dei cespi, foglia,
  propaggine (un ramo piegato e fissato nel terriccio finché mette radici). Per ogni metodo:
  - adatto sì/no, con il motivo se non è adatto (es. "da foglia senza nodo: non funziona");
  - **periodo migliore** dell'anno;
  - **passaggi semplici**, numerati, con il materiale necessario;
  - **tempi** indicativi (es. "radici in 3-6 settimane");
  - **errori comuni** e come evitarli.
- Il metodo più facile è indicato come **"consigliato per iniziare"**.

**2. "Travaso"**
- **Segnali** che il travaso serve (radici dai fori, terriccio che si asciuga subito, crescita ferma…);
- **ogni quanto**, indicativamente;
- **periodo migliore**;
- **vaso** (quanto più grande, fori di drenaggio) e **terriccio** adatto;
- **passaggi** numerati;
- **cure dei giorni successivi** (luce, acqua, concime: quando riprendere).

**Regole comuni**
- Ogni sezione cita le **sue fonti verificabili** (titolo, link, data di consultazione), visibili nella scheda.
- Testi **scritti con parole nostre**; vietato copiare i concorrenti (CLAUDE.md §5).
- Se le fonti **non sono d'accordo** (es. ogni quanto travasare), la scheda lo dice e indica un intervallo
  ("ogni 1-3 anni, a seconda di quanto cresce").
- **Ripiego per le piante senza scheda completa** (D8): consigli generici di propagazione e travaso per **famiglia o tipo
  di pianta** (es. "aracee rampicanti", "piante grasse"), con l'avviso ben visibile: *"La scheda completa per questa
  pianta non è ancora disponibile. Questi sono consigli generici per il suo gruppo: controlla prima di procedere."*
  Se non c'è nemmeno un gruppo adatto, solo consigli di base dichiarati come tali.
- **Dall'anteprima live** (F17) la scheda si può aprire, con in cima l'avviso *"Scheda basata sull'anteprima: la
  specie non è confermata. Scatta una foto per il riconoscimento completo."*

**Collegamento a stagione e meteo**
- Ogni metodo e il travaso hanno un **periodo consigliato** (es. "primavera"). L'app lo traduce in mesi in base
  all'emisfero, ricavato dalla posizione (in Italia: primavera ≈ marzo-maggio), e lo mostra in modo semplice:
  - dentro il periodo: *"È il periodo giusto per il travaso"*;
  - fuori: *"Il periodo migliore è la primavera: tra circa 4 mesi"*.
- Per le **piante all'aperto** l'app usa anche il meteo locale (Open-Meteo): sconsiglia il travaso con gelo o caldo
  forte previsti nei giorni successivi ("Previsto gelo giovedì: meglio rimandare").
- Per le piante in casa il meteo esterno conta poco: l'app usa solo la stagione e lo dice.
- Il periodo è un **consiglio**, non un divieto: se la pianta soffre (es. radici marce), il travaso si fa subito, e la
  scheda lo spiega.

**Promemoria facoltativo**
- Pulsante **"Ricordamelo"** nelle sezioni Travaso e Coltivarla da zero: crea un promemoria all'inizio del periodo
  consigliato (es. "1° aprile: controlla se il pothos va travasato").
- Per il travaso, l'app ricorda la **data dell'ultimo travaso** (inserita dall'utente) e propone il controllo quando è
  passato l'intervallo indicato dalla scheda, **sempre nel periodo giusto**.
- Il promemoria si vede nella schermata "Oggi" e si può esportare nel Calendario come gli altri (F12, D7).

**Guida:** voci "Come moltiplicare una pianta" e "Come travasare una pianta" (CLAUDE.md §6).

**Criteri di accettazione:**
- ogni scheda completa ha le due sezioni, ciascuna con almeno una fonte (controllato da un test automatico);
- nessun metodo di propagazione è indicato "adatto" senza una fonte che lo confermi;
- per una pianta senza scheda, l'avviso del ripiego è visibile prima dei consigli;
- con posizione in Italia, a novembre la scheda del pothos dice che il periodo migliore per il travaso è la primavera;
- il promemoria si crea, compare in "Oggi" e si può cancellare.

### F20 — Problemi più comuni (prevenzione)
> Aggiunta il 2026-11-18. Estende le schede di cura (F08, D8). Esempio: [scheda del pothos](esempio-scheda-pothos.md).

Ogni scheda ha una sezione **preventiva** "Problemi più comuni": non è una diagnosi (quella è V-01), ma aiuta a
**accorgersi presto** dei problemi tipici di quella pianta.

- **Quali problemi:** malattie, parassiti e problemi di cura (es. scottature, marciume per troppa acqua) **tipici di
  quella pianta secondo le fonti**. Niente elenchi generici copiati su tutte le schede.
- **Frequenza a parole, mai percentuali:** **frequente**, **occasionale** o **raro**, solo se la fonte lo dice con parole
  sue (es. "most common" → frequente, "occasionally" → occasionale, "rarely" → raro). Se la fonte nomina il problema senza
  dire quanto è frequente: **"frequenza non indicata dalle fonti"**. Se le fonti non sono d'accordo, la scheda riporta
  entrambe le indicazioni.
- **Segnali da riconoscere:** cosa si vede (es. "ciuffetti bianchi cotonosi", "puntini chiari sulle foglie, ragnatele
  sottili"), con parole semplici.
- **Come prevenirli:** abitudini pratiche (es. controllare il sotto delle foglie, svuotare il sottovaso, isolare le
  piante nuove).
- **Fonti** per ogni problema, come nelle altre sezioni.
- **Ripiego:** per le piante senza scheda completa, i problemi tipici del **gruppo** (es. aracee), con l'avviso del
  ripiego (D8).

**Avviso di rischio personalizzato** (versione 1.1, vedi V-11): se la pianta è nella collezione, l'app combina i problemi
della scheda con l'ambiente (luce stimata, abitudini di annaffiatura, stagione) e mostra un avviso, per esempio *"Stima:
poca luce e annaffiature frequenti → rischio di marciume più alto del normale"*. Sempre etichettato come **stima**, senza
percentuali, e ogni regola che lega l'ambiente a un rischio deve avere una fonte.

**Guida:** voce "Prevenire i problemi più comuni" (CLAUDE.md §6).

**Criteri di accettazione:**
- ogni problema ha tipo, frequenza (parola o "non indicata dalle fonti"), almeno un segnale, almeno un consiglio di
  prevenzione e almeno una fonte (controllato da un test automatico);
- nessuna percentuale compare nella sezione;
- per una pianta senza scheda compare l'avviso del ripiego prima dei problemi del gruppo.

### F21 — Falsi miti
> Aggiunta il 2026-11-18. Estende le schede di cura (F08, D8). Esempio: [scheda del pothos](esempio-scheda-pothos.md#-falsi-miti).

Ogni scheda ha una sezione **"Falsi miti"**: credenze diffuse su quella pianta (o su tutte le piante in vaso) messe a
confronto con quello che dicono le fonti. Esempi: "il pothos purifica l'aria", "la ghiaia sul fondo del vaso aiuta il
drenaggio".

- **Per ogni mito:** il mito come lo dice la gente; un **verdetto**; cosa dicono le fonti, con parole nostre; cosa fare in
  pratica, in una frase; le fonti.
- **Verdetto a quattro livelli:** **Falso**, **Esagerato** (c'è del vero, ma in casa l'effetto non conta), **Vero solo
  in parte**, **Le fonti non sono d'accordo** (si mostrano entrambe le posizioni). Mai "Falso" se le fonti dicono solo
  "esagerato" (CLAUDE.md §8).
- **Fonti:** dello stesso livello del resto della scheda (studi, università, orti botanici, enti pubblici). Gli articoli
  di blog e riviste **non bastano** per smentire un mito: stanno negli Approfondimenti (F22).
- **Miti generali:** quelli che valgono per tutte le piante in vaso si scrivono una volta e compaiono in ogni scheda e
  nel ripiego per gruppo, con la nota "Vale per tutte le piante in vaso".
- **Tono:** spiegare senza prendere in giro chi ci credeva ("è un'idea molto diffusa, ecco cosa hanno misurato").
- **Ripiego:** per le piante senza scheda completa, i miti del gruppo e quelli generali, con l'avviso del ripiego (D8).

**Guida:** voce "Falsi miti: come li verifichiamo" (CLAUDE.md §6).

**Criteri di accettazione:**
- ogni scheda completa ha almeno un mito (anche solo uno generale), ciascuno con verdetto, "in pratica" e almeno una
  fonte (controllato da un test automatico);
- nessuna fonte di un mito ha come tipo un blog o una rivista;
- per una pianta senza scheda, i miti del gruppo compaiono dopo l'avviso del ripiego.

### F22 — Approfondimenti (articoli consigliati)
> Aggiunta il 2026-11-18. Estende le schede di cura (F08, D8). Verifica dei siti, termini d'uso e criterio completo:
> [fonti editoriali](../api-documentation/fonti-editoriali.md). Esempio: [scheda del pothos](esempio-scheda-pothos.md#-approfondimenti).

Ogni scheda ha una sezione **"Approfondimenti"**: pochi articoli (indicativamente da 1 a 4) di blog e riviste italiane
affidabili, per chi vuole leggere di più.

- **Cosa si mostra, e solo questo:** titolo dell'articolo, nome del sito, **una riga scritta da noi** (di cosa parla e
  perché leggerlo), link all'articolo originale. Il tocco apre il sito in Safari, con l'etichetta "Articolo esterno".
- **Vietato:** copiare, citare o riassumere punto per punto i testi; mostrare immagini o loghi dei siti (CLAUDE.md §5).
- **Criterio di scelta dichiarato**, raggiungibile dalla sezione con "Come scegliamo gli articoli":
  1. sito affidabile, con editore o autore identificabile;
  2. **coerente con le fonti scientifiche della scheda**: se contraddice le fonti anche su un solo punto, non lo inseriamo;
  3. leggibile gratis;
  4. se il sito vende piante, la scheda lo dice ("sito di un vivaio");
  5. data dell'ultimo controllo visibile.
- **Siti confermati (2026-11-18):** Vivai Le Georgiche, Gardenia, Vita in Campagna, Accademia dei Georgofili, CREA.
  Escluso: Il Floricultore.
- **Regola per Gardenia:** gli articoli li **legge e li sceglie l'utente**, a mano; nessuno strumento di intelligenza
  artificiale apre o legge le pagine di Gardenia (il sito lo chiede nel suo `robots.txt`).
- **Se non c'è nessun articolo** che rispetti i criteri, la sezione lo dice: *"Non abbiamo ancora trovato articoli che
  rispettino i nostri criteri."* Meglio vuota che con un articolo sbagliato.
- Il contenuto degli articoli **non** viene mai usato dall'assistente o da modelli di intelligenza artificiale (alcuni
  siti lo vietano esplicitamente).

**Guida:** voce "Approfondimenti: come scegliamo gli articoli" (CLAUDE.md §6).

**Criteri di accettazione:**
- ogni articolo ha titolo, sito, riga nostra, link e data del controllo (controllato da un test automatico);
- un test automatico controlla che ogni link risponda prima di ogni pubblicazione;
- la riga nostra è al massimo di una frase (test sulla lunghezza);
- la sezione vuota mostra il messaggio previsto.

### F09 — Collezione personale
- Aggiungere una pianta (da riconoscimento o ricerca), con soprannome, foto, stanza e finestra (F10).
- Elenco delle piante con stato dei promemoria ("da annaffiare oggi").
- Modifica ed eliminazione.

**Criteri:** i dati restano sul telefono dopo la chiusura dell'app e il riavvio del telefono.

### F10 — Ambiente e stima del sole (idea I3)
- Per ogni pianta: **finestra** (orientamento con 8 pulsanti o bussola del telefono), distanza dalla finestra,
  ostacoli ("palazzo di fronte", "tenda", "albero").
- Stima delle **ore di sole diretto** e della fascia oraria con SunCalc, corretta per le nuvole con Open-Meteo.
- Sempre etichettata **"stima"**, con il pulsante **"Correggi"** (calibrazione manuale: "il sole arriva dalle 10 alle 13").
- Confronto con il bisogno della pianta: "La tua finestra dà circa 2 ore di sole; questa pianta ne preferisce 4-6".

**Criteri:** la parola "stima" è sempre visibile; la correzione manuale prevale sul calcolo.

### F11 — Meteo
- Previsioni nel luogo della pianta (Open-Meteo).
- Per le piante **all'aperto**: avvisi di gelo e caldo; la pioggia sposta il promemoria di annaffiatura.
- Scritta "Dati meteo: Open-Meteo.com" (obbligo di attribuzione, licenza CC BY 4.0).

**Criteri:** senza rete o senza meteo l'app usa l'ultima previsione salvata o gli intervalli standard, e lo dice.

### F12 — Promemoria
- Annaffiatura e concimazione con **intervalli che cambiano** con stagione, luce stimata e meteo.
- Mostrati **dentro l'app** (schermata "Oggi") e, se l'utente vuole, **esportabili nel Calendario dell'iPhone** con un file
  calendario (formato `.ics`).
- Pulsanti "Fatto" e "Rimanda di 1 giorno".

**Criteri:** un promemoria segnato "Fatto" ricalcola la scadenza successiva. Le notifiche push sono previste in una versione successiva (V-03).

### F19 — Nuova pianta
> Aggiunta il 2026-11-18. Usa il riconoscimento (F03) o la ricerca (F06), la stima del sole (F10) e i promemoria (F12).

**Cosa fa.** Accompagna chi ha **appena comprato** (o ricevuto) una pianta:
1. **Quale pianta:** l'utente la fotografa (riconoscimento completo) o la cerca per nome.
2. **Stanze e finestre di casa:** l'utente indica le **stanze** e le **finestre** disponibili: orientamento (8 pulsanti o
   bussola), piano, ostacoli (palazzo, albero, balcone, tenda) e, per ogni posto possibile, la distanza dalla finestra.
   Si inseriscono **una volta** e restano salvate per le piante successive (si possono modificare).
3. **Il posto migliore, con il motivo:** l'app confronta la **stima del sole** di ogni posto (F10) con il bisogno della
   pianta (scheda di cura) e propone il posto più adatto, con una frase che spiega perché: *"Soggiorno, a 1 m dalla
   finestra a est: circa 2 ore di sole del mattino (stima). Il pothos preferisce luce indiretta."* Mostra anche le
   alternative e cosa non va negli altri posti. La stima del sole resta **sempre etichettata come stima** e la correzione
   manuale prevale (F10).
4. **Piano delle prime settimane, con promemoria:** una lista di passi datati, ognuno con la sua fonte, per esempio:
   - tenerla **separata** dalle altre piante per controllare i parassiti (durata secondo le fonti, es. 30 giorni-6
     settimane), con un **controllo** a intervalli regolari;
   - **non travasarla subito**: il travaso si fa quando serve e nel periodo giusto (F18);
   - **prima annaffiatura** solo quando il terriccio lo richiede (regola della scheda);
   - **prima concimazione** solo quando la scheda o il gruppo hanno una fonte che dice quando; altrimenti nessun
     promemoria e un rimando al periodo normale di concimazione.
   L'utente può togliere o spostare ogni passo; i promemoria finiscono in "Oggi" e si esportano nel Calendario (F12).

**Regole**
- Ogni passo del piano ha una fonte. Senza fonte, il passo non diventa un promemoria.
- Senza scheda completa si usa il ripiego per gruppo, dichiarato (D8).
- Se l'utente non vuole inserire finestre, l'app dà solo i consigli di luce della scheda, senza scegliere il posto.

**Guida:** voce "Hai appena comprato una pianta?" e spiegazione la prima volta che si apre la funzione (CLAUDE.md §6).

**Criteri di accettazione:**
- stanze e finestre inserite per la prima pianta compaiono già pronte per la seconda;
- con almeno due finestre, l'app propone un posto e mostra il motivo con la parola "stima";
- il piano crea i promemoria in "Oggi"; ogni passo mostra la sua fonte; nessun promemoria senza fonte;
- con la correzione manuale del sole (F10), il consiglio del posto cambia di conseguenza.

### F13 — Limiti e messaggi d'errore (idea I4)
- Messaggi chiari quando il riconoscimento giornaliero è esaurito, il servizio non risponde o manca la rete (vedi
  [scheda Pl@ntNet](../api-documentation/plantnet-api.md#cosa-succede-se-il-servizio-non-risponde-o-il-limite-è-superato)).
- **Quota personale** di riconoscimenti al giorno, visibile ("Oggi ti restano 7 riconoscimenti"), per dividere equamente
  le 500 identificazioni gratuite (decisione D5: **10 al giorno**).
- Il numero è un **valore configurabile** sul server (`QUOTA_PER_DEVICE_PER_DAY`), non scritto nel codice; i messaggi
  mostrano sempre il valore vero ricevuto dal server.

**Criteri:** nessuna schermata bianca o errore tecnico mostrato all'utente; cambiando la variabile di configurazione la
quota cambia senza modificare il codice.

### F14 — Backup dei dati
- **Esporta** tutta la collezione (piante, foto ridotte, promemoria, finestre) in un file da salvare su iCloud Drive o altrove.
- **Importa** il file su un altro telefono o dopo una reinstallazione.
- Proposto già nell'**onboarding** (F01) e raggiungibile dalle impostazioni (decisione D3).

**Criteri:** esportazione e importazione riportano la collezione identica.

### F15 — Informazioni e privacy (idea I5)
- Pagina "Informazioni": crediti (Pl@ntNet, Open-Meteo, SunCalc e licenze), codice open source, contatto.
- Pagina "Privacy" in italiano semplice: le foto vanno a Pl@ntNet solo per il riconoscimento e non vengono conservate; la
  posizione viene arrotondata a circa 1 km; niente pubblicità, niente tracciamento, niente account.

### F16 — App installabile (PWA)
- Si installa dalla schermata Home ("Aggiungi a Home" in Safari), si apre a schermo intero, funziona offline per consultare
  la collezione.

> **PWA** (Progressive Web App): un sito che si comporta come un'app. Si aggiunge alla schermata Home e funziona anche senza rete.

### F17 — Anteprima live nel mirino
> Livello 1 del riconoscimento (idea I6). Aggiunta il 2026-11-17. **Entra nella v1:** la prova sull'iPhone (D11, 2026-11-18)
> è andata bene. Modello: BioCLIP v1 compresso int8 (D10). Aggiornata il 2026-11-18 (ritmo adattivo, piante gemelle).

**Cosa fa.** Mentre l'utente inquadra una pianta, un modello che gira **sul telefono** (gratis, senza limiti, anche
offline) propone un nome probabile in un piccolo popup. Scattando, parte il riconoscimento completo con Pl@ntNet (F03-F04).

**Regole del popup** (valori iniziali, configurabili e da tarare con D11; dettagli tecnici in
[architettura §1b](../architecture/architettura.md#1b-riconoscimento-a-due-livelli)):
1. **Quante analisi al secondo:** ritmo **adattivo**: il modello lavora al massimo metà del tempo (un terzo se il telefono
   scalda); sull'iPhone 16 circa 1,6 al secondo **(da misurare)**. Una nuova analisi parte solo quando la precedente è finita.
   Le analisi si fermano quando l'app va in background o il mirino si chiude.
2. **Soglia minima di sicurezza:** il nome compare solo se, in media negli ultimi ~2 secondi, la **somiglianza** con la pianta è
   almeno **0,42** e la sicurezza è almeno **30%** (calcolata con scala 30), e supera di almeno **15 punti** il secondo nome.
   Valori tarati sul PC il 2026-11-17; la prova D11 li ricontrolla. Sotto soglia: nessun nome, solo "Sto guardando…" o un consiglio
   ("Avvicinati a una foglia", "C'è poca luce").
3. **Niente cambio di nome a ogni movimento:**
   - un nome compare solo dopo essere rimasto primo per circa **1 secondo** (e almeno 2 analisi);
   - per **cambiare** nome, il nuovo deve restare primo per circa **2 secondi** e superare il vecchio di **10 punti**;
   - se la sicurezza scende sotto i **3/4 della soglia** di comparsa per 2 secondi, il popup sfuma in "Sto guardando…" invece di cambiare nome.
4. **Testo onesto:**
   - mostra **solo il nome comune o il genere, mai la specie** (D10): **"Forse: Pothos"** oppure
     **"Forse un *Philodendron*"**, mai "È un Pothos";
   - sotto il nome, piccolo: **"Anteprima sul telefono · Scatta per il riconoscimento completo"**;
   - **piante gemelle** (gruppi che si confondono spesso, es. Pothos/Filodendro/Monstera, Maranta/Calathea): se i primi due
     nomi sono dello stesso gruppo e vicini, il popup dice **"Forse: Pothos o Filodendro"** con sotto
     **"Si somigliano molto: scatta per saperlo"**. Se poi uno dei due prevale in modo stabile, il popup passa al nome singolo;
   - nessuna percentuale, né nel popup né nel risultato completo (D9).
5. **Tocco sul popup** = scatto della foto. Un piccolo link secondario "Come coltivarla" apre la scheda (F18) con
   l'avviso che la specie non è confermata.
6. Il nome dell'anteprima **non viene mai salvato** e non sostituisce il risultato di Pl@ntNet. Se i due sono diversi, l'app
   mostra solo il risultato completo.
7. **Senza rete:** l'anteprima funziona; allo scatto l'app spiega che il riconoscimento completo richiede la connessione
   e propone di salvare la foto per riprovare dopo.
8. **Accessibilità:** il popup non copre il centro del mirino; per VoiceOver il nome viene annunciato solo quando cambia
   (al massimo ogni 2 secondi).

**Download del modello:** facoltativo, proposto **alla prima apertura della fotocamera** (D10) e poi nelle impostazioni,
con il peso indicato e consiglio di
usare il Wi-Fi. Senza modello: mirino con soli consigli di inquadratura.

**Guida:** voce "Come funziona l'anteprima live" (perché è un "forse", perché a volte non compare il nome, come
scaricare o cancellare il modello) e spiegazione la prima volta che si apre il mirino (CLAUDE.md §6).

**Criteri di accettazione:**
- nessun fotogramma lascia il telefono (verificabile: nessuna richiesta di rete durante l'inquadratura);
- con la pianta ferma, il nome non cambia per almeno 10 secondi;
- inquadrando la tazza della foto trappola, nessun nome compare;
- la parola "Forse" è sempre presente quando c'è un nome;
- il mirino resta fluido (nessun blocco visibile) sull'iPhone 16;
- senza modello scaricato, il riconoscimento completo funziona normalmente.

## 3. Versioni successive
| Codice | Funzione | Versione proposta | Note |
|---|---|---|---|
| V-01 | **Diagnosi guidata dei sintomi** (domande: foglie gialle? macchie? parassiti?) con possibili cause e cosa fare | v1.1 | Senza AI, basata su regole e schede; dichiara sempre l'incertezza |
| V-02 | **Botanico AI** (chat) | v2 | Vedi [architettura §2](../architecture/architettura.md#2-il-botanico-ai-ollama-gira-sul-pc-non-sulliphone): Ollama sul proprio PC per chi lo configura; ripiego "assistente a regole" |
| V-03 | **Notifiche push** dei promemoria | v2 | Su iPhone solo con app installata sulla Home (iOS 16.4+); richiede un server di invio |
| V-04 | **Sincronizzazione online** e account facoltativo | v2 | Decisione D3 |
| V-05 | **Diario di crescita** con foto nel tempo | v1.2 | Da Planta |
| V-06 | **Diagnosi da foto** (funzione sperimentale di Pl@ntNet) | v3 | Presentata come sperimentale |
| V-07 | **Riconoscimento senza rete** (foto messe in coda e inviate quando torna la connessione) | v1.2 | Da Flora Incognita |
| V-08 | **Misura della luce** con il sensore o la fotocamera del telefono, per affinare la stima | v3 | Da verificare cosa permette il browser su iPhone |
| V-09 | **Avvisi sui gruppi difficili** (graminacee, ombrellifere…) | v1.1 | Dagli studi su Flora Incognita |
| V-10 | **Condivisione della cura** con un'altra persona | v3 | Da Planta; richiede sincronizzazione (V-04) |
| V-11 | **Avviso di rischio personalizzato** (F20): problemi della scheda + ambiente della pianta (luce stimata, annaffiature, stagione) | v1.1 | Insieme a V-01, con le stesse regole; sempre "stima", nessuna percentuale; ogni regola con una fonte. Servono settimane di dati sulle annaffiature |
| V-11 | **Stato di protezione e distribuzione** della specie | v2 | Da Flora Incognita; dati GBIF |
| V-12 | Altre lingue oltre l'italiano | v3 | |
| V-13 | **"Ultimi articoli su questa pianta"**: solo titolo e link dal feed RSS dei siti degli Approfondimenti | v1.1 | Solo per i siti che lo permettono **per iscritto** (nessuno lo concede oggi in modo esplicito) e solo dopo il **controllo umano** di ogni articolo. Vedi [fonti editoriali](../api-documentation/fonti-editoriali.md) |
| V-14 | **Community** di appassionati con consigli e voti | da rivalutare nella v2 | **D12 decisa (2026-11-18): A**. Nella v1 e v1.x solo link a community esistenti |

## 4. Fuori dallo scopo (per ora)
- Funzioni a pagamento di qualsiasi tipo, pubblicità, tracciamento.
- App nativa per App Store (costerebbe 99 $/anno di iscrizione ad Apple **(da verificare)**): restiamo PWA.
- Comunità e social **nella v1 e nella v1.x**: solo link a community esistenti (D12, decisa il 2026-11-18). Da
  rivalutare nella v2 (V-14).

## 5. Rischi
| Rischio | Come lo gestiamo |
|---|---|
| Riconoscimento poco accurato sulle piante di casa | Test con 30 foto prima di sviluppare F04 (D9); alternative sempre visibili; ricerca per nome |
| Scrivere i consigli di cura richiede tempo | Partire da 50 piante comuni; consigli generici dichiarati per le altre |
| iPhone cancella i dati di un sito non installato | Invito a installare l'app (F01, F16) e backup (F14) |
| La stima del sole viene presa per una misura | Etichetta "stima", calibrazione, voce nella Guida |
| Nessun modello aperto riconosce bene le piante di casa sul telefono | D10 e D11 prima di sviluppare; ripiego con soli consigli di inquadratura |
| L'anteprima live viene presa per un risultato certo | Testo "Forse…", soglie, stabilità; mai salvata; vale sempre il riconoscimento completo |
| Consigli di propagazione o travaso sbagliati per una specie | Fonti per ogni sezione; ripiego per gruppo dichiarato; avviso se la scheda viene dall'anteprima live |
| Scrivere due sezioni in più per ~50 piante richiede tempo | Partire dalle piante più comuni; ripiego per famiglia/tipo per le altre |
| Un articolo consigliato (F22) è sbagliato o cambia dopo il controllo | Criterio di coerenza con le fonti; data del controllo visibile; ricontrollo a ogni versione; test sui link |
| Un falso mito (F21) viene smentito con troppa sicurezza | Verdetto a quattro livelli; solo fonti scientifiche o istituzionali |

## 6. Decisioni
Le decisioni D1-D9 sono state **approvate il 2026-11-16**: vedi [decisioni](../architecture/decisioni-da-prendere.md).
**Aggiornamento 2026-11-17:** D9 chiusa dopo il test (`k-world-flora`, soglie, nessuna percentuale, tabella dei sinonimi);
D11 approvata (prova sull'iPhone 16 con iOS 26.5.2); D10 rimandata all'esito di D11.
**Nomi (D9, 2026-11-17):** i nomi scientifici seguono GBIF; *Aloe officinalis* / *Aloe vera* e i due nomi della Peperomia
restano distinti ma aprono la stessa scheda di cura.
**Aggiornamento 2026-11-18 (sera):** nuove sezioni delle schede F21 "Falsi miti" e F22 "Approfondimenti" (v1, D8
ampliata); V-13 "Ultimi articoli" dal feed (v1.1, solo con permesso scritto e controllo umano); V-14 community
(**D12 decisa: A**, solo link a community esistenti nella v1 e v1.x; da rivalutare nella v2).
