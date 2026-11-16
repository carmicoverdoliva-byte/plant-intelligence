# Specifiche funzionali — Plant Intelligence

> Ultimo aggiornamento: 2026-11-16 · Basato su: [visione prodotto](visione-prodotto.md), [analisi dei concorrenti](../competitor-analysis/matrice-confronto.md),
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

**Criteri di accettazione:** ogni schermata si può saltare; l'onboarding si può ripetere dalla Guida; se l'utente nega un
permesso, l'app continua a funzionare e spiega come riattivarlo; se l'app è aperta da Safari e non dalla Home, compare un
invito discreto (chiudibile) a installarla.

### F02 — Guida sempre disponibile
- Voce **"Guida"** nel menu principale, raggiungibile da ogni schermata.
- Contiene: un tutorial per ogni funzione, **FAQ**, pulsante **"Ripeti il tutorial iniziale"**.
- **Prima volta in ogni sezione**: un breve riquadro di spiegazione, chiudibile e richiamabile con un'icona "?".
- I testi in-app e quelli in `docs/user-guide/` sono gli stessi (una sola fonte).

**Criteri:** nessuna funzione della v1 senza la sua voce nella Guida (CLAUDE.md §6).

### F03 — Riconoscimento da foto
- Scatto dalla fotocamera o scelta dalla galleria; **da 1 a 5 foto della stessa pianta**.
- Per ogni foto l'utente indica la parte (foglia, fiore, frutto, corteccia, "non so").
- Il telefono **riduce le foto** prima dell'invio (lato corto 1280 pixel, JPEG di qualità 90%): l'invio è più veloce e
  vengono eliminate le informazioni nascoste come il luogo dello scatto.

**Criteri:** risultato in meno di 10 secondi con una buona connessione; nessun dato di posizione inviato insieme alla foto.

### F04 — Risultati onesti (idea I1)
- Mostra la **specie più probabile** e **fino a 4 alternative**, ognuna con foto di esempio, nome comune italiano e nome scientifico.
- Sicurezza espressa **a parole e in percentuale**: "molto probabile" (≥ 70%), "possibile" (30-69%), "incerto" (< 30%).
  Le soglie sono **provvisorie**: le confermeremo con il test sulle foto (decisione D9).
- Se la specie più probabile è "incerta": il titolo diventa **"Non sono sicuro"**, con le alternative in evidenza.
- Se la foto non contiene una pianta: "Non vedo una pianta in questa foto" (nessun nome inventato).
- Scritta "Riconoscimento: Pl@ntNet".

**Criteri:** l'app non mostra mai un solo nome senza la sua percentuale; con la foto F6 (tazza) del
[protocollo di test](../competitor-analysis/plantnet.md#7-protocollo-di-test-manuale-iphone) non propone nessuna pianta.

### F05 — Riconoscimento guidato (idea I2)
- Se il risultato è "possibile" o "incerto", l'app propone: "Aggiungi una foto di un'altra parte (es. il fiore) per un risultato migliore".
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
- Acqua, luce, terreno, temperatura, concime, rinvaso.
- Per le **piante d'appartamento più comuni** (circa 50 nella v1): schede scritte da noi (decisione D8).
  - Ogni scheda si basa su **fonti verificabili** (orti botanici, università, servizi pubblici) **citate nella scheda**
    con titolo, link e data di consultazione.
  - Testi **con parole nostre**: vietato copiare testi dei concorrenti (CLAUDE.md §5).
- **Ripiego per le piante senza scheda:** consigli generici per **famiglia o tipo di pianta** (es. "piante grasse",
  "aracee"), anch'essi con fonti, e un messaggio chiaro: *"La scheda completa per questa pianta non è ancora disponibile.
  Questi sono consigli generici per il suo gruppo."*
- Se non c'è nemmeno un gruppo adatto: lo stesso messaggio e solo consigli di base, dichiarati come tali.

**Criteri:** mai consigli specifici inventati; ogni scheda e ogni gruppo mostra almeno una fonte (controllato da un test
automatico); quando i consigli sono generici, l'app lo dice in modo ben visibile.

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
| V-11 | **Stato di protezione e distribuzione** della specie | v2 | Da Flora Incognita; dati GBIF |
| V-12 | Altre lingue oltre l'italiano | v3 | |

## 4. Fuori dallo scopo (per ora)
- Funzioni a pagamento di qualsiasi tipo, pubblicità, tracciamento.
- App nativa per App Store (costerebbe 99 $/anno di iscrizione ad Apple **(da verificare)**): restiamo PWA.
- Comunità e social.

## 5. Rischi
| Rischio | Come lo gestiamo |
|---|---|
| Riconoscimento poco accurato sulle piante di casa | Test con 30 foto prima di sviluppare F04 (D9); alternative sempre visibili; ricerca per nome |
| Scrivere i consigli di cura richiede tempo | Partire da 50 piante comuni; consigli generici dichiarati per le altre |
| iPhone cancella i dati di un sito non installato | Invito a installare l'app (F01, F16) e backup (F14) |
| La stima del sole viene presa per una misura | Etichetta "stima", calibrazione, voce nella Guida |

## 6. Decisioni
Le decisioni D1-D9 sono state **approvate il 2026-11-16**: vedi [decisioni](../architecture/decisioni-da-prendere.md).
Resta in sospeso solo il **risultato del test delle foto (D9)**, che fisserà flora di Pl@ntNet e soglie di confidenza
definitive (oggi provvisorie: 70% / 30%).
