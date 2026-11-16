---
name: plant-research
description: Analisi di un'app concorrente di riconoscimento o cura delle piante (es. PictureThis, Planta, Pl@ntNet, Flora Incognita). Usala quando l'utente chiede di analizzare, studiare, confrontare o fare benchmark di un'app per piante, o scrive "/plant-research <nome-app>". Raccoglie solo informazioni pubbliche con fonti e date, prepara un protocollo di test manuale su iPhone, salva la scheda in docs/competitor-analysis/<nome-app>.md e aggiorna la matrice di confronto.
---

# Skill: plant-research — analisi di un'app concorrente

Scopo: capire cosa fa bene e cosa fa male un'app concorrente, per decidere cosa prendere e cosa migliorare
in "Plant Intelligence". Il nome dell'app da analizzare è l'argomento passato alla skill (es. `PictureThis`).
Se manca, chiedilo all'utente prima di iniziare.

**Lingua:** tutto in italiano semplice. L'utente è alle prime armi: prima di ogni fase dì cosa stai per fare,
dopo riassumi cosa hai trovato. Se usi un termine tecnico, spiegalo in una frase.

## Regole obbligatorie (reverse engineering consentito)

Si studia **solo ciò che un normale utente può vedere**: funzioni, flussi, schermate, testi pubblici, prezzi.

È **vietato**:
- scaricare, decompilare o analizzare il codice dell'app (APK, IPA, bundle JavaScript, ecc.);
- copiare o riutilizzare asset: immagini, icone, testi, loghi, marchi (si descrive con parole nostre);
- usare o intercettare API private o non documentate (niente sniffing del traffico di rete);
- aggirare paywall, protezioni, limiti di prova o termini di servizio.

Se una richiesta dell'utente va oltre questi limiti, spiega gentilmente perché non si può fare e proponi
un'alternativa lecita (es. osservare il comportamento nell'app invece di leggerne il codice).

## Procedura

### Fase 1 — Raccolta di informazioni pubbliche e aggiornate
Cerca sul web (privilegia fonti recenti) in quest'ordine:
1. sito ufficiale dell'app (pagine funzioni, prezzi, FAQ, centro assistenza);
2. pagine degli store (App Store e Google Play): descrizione, piani in abbonamento, note di versione;
3. documentazione pubblica (es. API ufficiali, articoli scientifici per Pl@ntNet / Flora Incognita);
4. recensioni e test indipendenti (articoli di confronto, studi accademici sull'accuratezza, riviste);
5. recensioni degli utenti sugli store e forum, solo come segnale (da indicare come opinioni, non fatti).

Per ogni informazione annota **fonte (URL)** e **data** (data di pubblicazione della fonte, oppure data di
consultazione se non c'è). Ciò che non è confermato da almeno una fonte affidabile va marcato
**"(da verificare)"**. Non inventare numeri: se un dato non si trova, scrivi "non trovato".

### Fase 2 — Analisi per aree
Copri **tutte** queste aree (se un'area non è applicabile, dillo esplicitamente):
1. **Riconoscimento**: accuratezza dichiarata e misurata da terzi, mostra alternative? mostra la confidenza
   (percentuale o altro)? quante foto/organi (foglia, fiore, frutto, corteccia) accetta?
2. **Diagnosi malattie**: c'è? quanto è affidabile? cosa propone come rimedio?
3. **Schede botaniche**: contenuti (nome scientifico, famiglia, tossicità, origine…), qualità e fonti.
4. **Consigli di cura**: annaffiatura, luce, concime, rinvaso; personalizzati o generici?
5. **Posizione / meteo / luce**: usa la posizione? il meteo? stima l'esposizione al sole? come lo spiega?
6. **Promemoria e collezione**: "il mio giardino", calendario, notifiche, diario.
7. **Onboarding e Guida**: com'è il primo avvio, come chiede i permessi (spiega prima il motivo?),
   tutorial su come fotografare, sezione di aiuto/FAQ.
8. **UX**: numero di passaggi (tocchi) dall'apertura al risultato di un riconoscimento; chiarezza.
9. **Gratis vs a pagamento**: cosa resta gratis, limiti della versione gratuita, prezzi degli abbonamenti,
   eventuali pratiche aggressive (paywall all'avvio, prove che si rinnovano da sole).
10. **Punti deboli**: problemi ricorrenti nelle recensioni e nei test.

### Fase 3 — Protocollo di test manuale (iPhone)
Prepara un protocollo che l'utente può eseguire sul proprio iPhone, **identico per tutte le app**, così i
risultati sono confrontabili. Usa sempre questo set standard di foto (l'utente le scatta una volta sola e
le riusa per ogni app):

| # | Foto | Cosa misura |
|---|------|-------------|
| F1 | Pianta d'appartamento comune, foglia ben illuminata (es. pothos) | riconoscimento facile |
| F2 | Fiore in primo piano | riconoscimento da fiore |
| F3 | Solo foglia di un albero/arbusto da esterno | riconoscimento difficile |
| F4 | Foto sfocata o scura della stessa pianta di F1 | comportamento con foto scarse |
| F5 | Foglia con macchie / ingiallita | diagnosi malattie |
| F6 | Oggetto che non è una pianta (es. tazza) | onestà: dice "non so"? |
| F7 | Due specie simili (es. due succulente) | alternative e confidenza |

Per ogni foto l'utente annota in una tabella: specie proposta, corretta sì/no/parzialmente, confidenza
mostrata, alternative mostrate (quante), numero di tocchi per arrivare al risultato, tempo indicativo,
richiesta di pagamento sì/no, note.
Aggiungi anche i controlli sul primo avvio: schermate di onboarding, quando e come chiede fotocamera e posizione,
se esiste una Guida/FAQ nell'app. Chiedi di installare l'app da zero e di **non** sottoscrivere abbonamenti.

### Fase 4 — Scrivere la scheda
Salva il risultato in `docs/competitor-analysis/<nome-app>.md`, con nome file in minuscolo e trattini
(es. `picturethis.md`, `plantnet.md`, `flora-incognita.md`). Se il file esiste già, aggiornalo (mantieni le
note dei test manuali già fatte dall'utente) e cambia la data. Usa **esattamente** questo formato:

```markdown
# <Nome app> — analisi concorrente

> Ultimo aggiornamento: AAAA-MM-GG · Versione app osservata: <versione o "non nota"> · Piattaforme: iOS / Android / Web

## 1. Sintesi
<3-5 frasi: cos'è, per chi, punto forte principale, punto debole principale, modello di business.>

## 2. Tabella funzionalità
| Area | Cosa offre | Gratis / A pagamento | Valutazione (1-5) | Fonte |
|------|------------|----------------------|-------------------|-------|
| Riconoscimento | … | … | … | [n] |
| Diagnosi malattie | … | … | … | [n] |
| Schede botaniche | … | … | … | [n] |
| Consigli di cura | … | … | … | [n] |
| Posizione / meteo / luce | … | … | … | [n] |
| Promemoria e collezione | … | … | … | [n] |
| Onboarding e Guida | … | … | … | [n] |
| UX (passaggi per un riconoscimento) | … | … | … | [n] |

## 3. Punti di forza
- …

## 4. Punti deboli
- …

## 5. Idee da prendere
<Cosa funziona bene e potremmo adottare (riscritto con parole e design nostri, senza copiare asset).>

## 6. Idee da migliorare
<Dove possiamo fare meglio, collegato ai principi di Plant Intelligence: gratuità, onestà sulla confidenza,
sole come stima calibrabile, onboarding e Guida.>

## 7. Protocollo di test manuale (iPhone)
<Istruzioni della Fase 3 + tabella dei risultati con le colonne vuote da compilare.>

## 8. Fonti
1. <Titolo> — <URL> — <data fonte o "consultato il AAAA-MM-GG">
2. …
```

Nella scheda, le informazioni non confermate restano marcate "(da verificare)". Le valutazioni 1-5 sono un
giudizio nostro: indicalo come tale.

### Fase 5 — Aggiornare la matrice di confronto
Aggiorna `docs/competitor-analysis/matrice-confronto.md`, con **una riga per app** (se la riga dell'app
esiste già, sostituiscila; non duplicarla). Se il file non esiste, crealo con questa intestazione:

```markdown
# Matrice di confronto delle app concorrenti

Una riga per app. Valutazioni da 1 a 5 (giudizio nostro); dettagli e fonti nelle singole schede.

| App | Ultimo aggiornamento | Riconoscimento | Confidenza / alternative | Diagnosi | Cura | Posizione / meteo / luce | Promemoria / collezione | Onboarding / Guida | Passaggi per riconoscere | Gratis | A pagamento | Punto debole principale | Scheda |
|-----|----------------------|----------------|--------------------------|----------|------|--------------------------|-------------------------|--------------------|--------------------------|--------|-------------|-------------------------|--------|
```

L'ultima colonna è un link relativo alla scheda (es. `[picturethis.md](picturethis.md)`).

### Fase 6 — Verifica e riepilogo
Prima di dire "fatto":
- controlla che la scheda abbia tutte le 8 sezioni e che ogni dato nella tabella abbia una fonte;
- controlla che la matrice contenga una sola riga per questa app e che il link alla scheda funzioni;
- controlla di non aver incluso asset, testi copiati o informazioni ottenute in modo non consentito.

Poi spiega all'utente in italiano semplice: cosa hai trovato (3-5 punti chiave), cosa resta "da verificare",
e i prossimi passi (fare il test manuale sull'iPhone e incollare i risultati, così aggiorni la scheda).
Non fare commit automaticamente: proponilo all'utente.
