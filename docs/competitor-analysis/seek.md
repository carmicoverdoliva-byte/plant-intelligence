# Seek by iNaturalist — analisi concorrente

> Ultimo aggiornamento: 2026-11-17 · Versione app osservata: 2.18.2 (App Store, data dell'anno non indicata) · Piattaforme: iOS / Android

## 1. Sintesi
Seek è l'app gratuita di **iNaturalist** (organizzazione non profit) per riconoscere piante, animali e funghi
**inquadrandoli con la fotocamera**: i nomi compaiono **in tempo reale**, calcolati da un modello che gira **sul telefono**,
senza internet [1][2]. È pensata anche per i bambini: niente account obbligatorio, nessun dato personale raccolto di default,
sfide e distintivi [2]. Punto forte: il **riconoscimento live sul dispositivo**, privato e istantaneo, che sale e scende
nella classificazione (es. "famiglia" → "specie") a seconda di quanto è sicuro [3]. Punto debole per noi: è un'app di
natura, **non di cura**, e il modello è meno allenato sulle piante coltivate [3]. Modello di business: gratuita, senza
acquisti dichiarati sullo store [1].

## 2. Tabella funzionalità
| Area | Cosa offre | Gratis / A pagamento | Valutazione (1-5) | Fonte |
|------|------------|----------------------|-------------------|-------|
| Riconoscimento | Live dalla fotocamera, sul dispositivo e offline; circa 80.000 specie dalla versione 2.17.1 (prima circa 20.000); si ferma a un livello più alto (genere, famiglia) quando non è sicuro | Gratis | 4 (giudizio nostro; nessun test indipendente trovato sulle piante di casa) | [1][2][3] |
| Diagnosi malattie | Non presente **(da verificare nell'app)** | — | 1 | [1] |
| Schede botaniche | Informazioni sulla specie trovata **(contenuti da verificare nell'app)** | Gratis | da verificare | [1] |
| Consigli di cura | Non presenti (app di natura, non di cura) **(da verificare)** | — | 1 | [1] |
| Posizione / meteo / luce | Usa la posizione **resa meno precisa** per suggerire specie della zona; niente meteo né luce | Gratis | 2 | [1][4] |
| Promemoria e collezione | Osservazioni salvate sul telefono, sfide e distintivi; niente promemoria | Gratis | 2 | [2] |
| Onboarding e Guida | Guida utente pubblicata da iNaturalist (2020); onboarding nell'app **da verificare** | Gratis | da verificare | [5] |
| UX (passaggi per un riconoscimento) | Aprire l'app e inquadrare: il nome compare senza scattare **(numero di tocchi da misurare)** | Gratis | da misurare | [3] |

## 3. Punti di forza
- **Riconoscimento istantaneo e privato**: il modello è sul telefono, le immagini non lasciano il dispositivo, funziona
  senza connessione [2].
- **Onestà sul livello di dettaglio**: se non è sicuro della specie mostra un livello più generale (genere, famiglia) [3].
- **Niente account e nessun dato personale di default**, adatta ai bambini [2].
- Gratuita, molto apprezzata (4,8 su 5 su circa 31.000 valutazioni sull'App Store; opinione degli utenti, non un test) [1].
- Il modello è stato ampliato nel 2025 da circa 20.000 a circa 80.000 specie [1].

## 4. Punti deboli
- **Non è un'app di cura**: niente consigli, promemoria, meteo o luce [1].
- Il modello è **meno allenato sulle piante coltivate** e non distingue le varietà ornamentali (segnalato già nel 2019
  dagli stessi sviluppatori e dagli utenti) [3].
- La previsione live può **oscillare** tra genere e specie mentre si muove il telefono, e sui telefoni vecchi può essere
  lenta (forum, 2019: dati vecchi, **da verificare** sulla versione attuale) [3].
- Il modello sul telefono è **più vecchio** di quello online di iNaturalist [2].
- App pesante da scaricare (circa 228 MB sull'App Store), probabilmente anche per il modello incluso **(da verificare)** [1].
- Il modello **non è aperto**: iNaturalist dichiara di non poter condividere i propri modelli [6] **(da verificare)**.

## 5. Idee da prendere
- **Anteprima live nel mirino**, calcolata sul telefono: è l'origine del nostro livello 1 (F17), con testo e regole nostre.
- **Scendere a un livello più generale quando non è sicuro** ("Forse un Philodendron" invece di una specie inventata).
- **Nessun fotogramma inviato a server** durante l'inquadratura: privacy come valore dichiarato.
- Funzionamento **offline** dell'anteprima.

## 6. Idee da migliorare
- **Stabilità del popup**: regole esplicite contro l'oscillazione dei nomi (soglie, media sugli ultimi secondi, cambio
  di nome solo se il nuovo è nettamente migliore) — vedi F17.
- **Due livelli chiari**: l'anteprima è un "forse"; scattando si ottiene il risultato completo con alternative e
  percentuali (Pl@ntNet), cosa che Seek non separa in modo così netto **(da verificare nell'app)**.
- **Cura delle piante di casa**: tutto ciò che Seek non fa (schede, promemoria, luce stimata, meteo).
- **Download del modello facoltativo** con il peso dichiarato, invece di un'app pesante per tutti.

## 7. Protocollo di test manuale (iPhone)
**Prima di iniziare**
- Installa Seek da zero dall'App Store. Non serve un account: non accedere con iNaturalist.
- Usa lo stesso set di 7 foto già scattato per le altre app **e, per il live, inquadra le piante vere** (F1, F2, F7).
- Prova anche in **modalità aereo**, per controllare il funzionamento offline.

| # | Foto | Cosa misura |
|---|------|-------------|
| F1 | Pianta d'appartamento comune, foglia ben illuminata (es. pothos) | riconoscimento facile |
| F2 | Fiore in primo piano | riconoscimento da fiore |
| F3 | Solo foglia di un albero/arbusto da esterno | riconoscimento difficile |
| F4 | Foto sfocata o scura della stessa pianta di F1 | comportamento con foto scarse |
| F5 | Foglia con macchie / ingiallita | diagnosi malattie |
| F6 | Oggetto che non è una pianta (es. tazza) | onestà: dice "non so"? |
| F7 | Due specie simili (es. due succulente) | alternative e confidenza |

**Risultati** (da compilare)
| # | Specie proposta | Corretta (sì/no/parz.) | Confidenza mostrata | Alternative (quante) | Tocchi | Tempo | Richiesta pagamento | Note |
|---|---|---|---|---|---|---|---|---|
| F1 | | | | | | | | |
| F2 | | | | | | | | |
| F3 | | | | | | | | |
| F4 | | | | | | | | |
| F5 | | | | | | | | |
| F6 | | | | | | | | |
| F7 | | | | | | | | |

**Controlli specifici sul live** (utili per F17)
| Controllo | Risultato | Note |
|---|---|---|
| Dopo quanti secondi compare il primo nome? | | |
| Tenendo il telefono fermo 10 secondi, il nome cambia? Quante volte? | | |
| Il nome cambia livello (famiglia → genere → specie)? Come lo mostra? | | |
| Inquadrando la tazza compare un nome? | | |
| Funziona in modalità aereo? | | |
| Il telefono scalda dopo 5 minuti? | | |

**Controlli sul primo avvio** (rispondi sì/no e aggiungi note)
| Controllo | Risultato | Note |
|-----------|-----------|------|
| Quante schermate prima di poter usare l'app? Si possono saltare? | | |
| Compare una richiesta di account, donazione o pagamento? | | |
| C'è un tutorial su come inquadrare una pianta? | | |
| Chiede la fotocamera? Spiega prima il motivo? | | |
| Chiede la posizione? Quando e perché? | | |
| Esiste una sezione Guida / FAQ / Aiuto nell'app? Dove? | | |

## 8. Fonti
1. Seek by iNaturalist, pagina App Store (versione 2.18.2; note della 2.17.1 del 17/04/2025; prezzo; privacy; valutazioni; 228,1 MB) — https://apps.apple.com/app/seek-by-inaturalist/id1353224144 — consultato il 2026-11-17
2. iNaturalist Help, "What is the difference between iNaturalist and Seek by iNaturalist?" (modificato il 19/08/2025) — https://inaturalist.freshdesk.com/en/support/solutions/articles/151000169914 — consultato il 2026-11-17
3. Forum iNaturalist, "Real-time Computer Vision predictions in Seek by iNaturalist 2.0" (aprile-giugno 2019) — https://forum.inaturalist.org/t/real-time-computer-vision-predictions-in-seek-by-inaturalist-2-0/1855 — consultato il 2026-11-17
4. Seek, testo delle FAQ riportato da terzi (posizione resa meno precisa, account facoltativo) — https://apppage.net/preview/org.inaturalist.seek , https://sourceforge.net/app/seek-by-inaturalist/ — letti tramite risultati di ricerca il 2026-11-17 (fonti secondarie, **da verificare**)
5. iNaturalist, "Seek User Guide" (2020) — https://static.inaturalist.org/wiki_page_attachments/SeekUserGuide2020.pdf — esistenza verificata il 2026-11-17, contenuto non letto (file troppo grande)
6. iNaturalist, blog e forum sui modelli di visione — https://www.inaturalist.org/blog/99701 , https://forum.inaturalist.org/t/computer-vision-model-parameters-available/45408 — letti tramite risultati di ricerca il 2026-11-17 (pagine non accessibili direttamente)
