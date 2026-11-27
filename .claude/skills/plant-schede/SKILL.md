---
name: plant-schede
description: Scrittura delle schede di cura di Mandragola (specie, genere, tipo di pianta, note di famiglia) con il metodo deciso dall'utente — più fonti autorevoli per ogni pianta, fatti e consigli pratici riscritti con parole nostre, ogni sezione divisa in "Linee guida" (solo fonti A o due B concordi) e "Consigli dal pollice verde" (fonti B/C, non ufficiali, mai in contraddizione), ogni fonte citata con link, mai testi copiati, contraddizioni nei "Falsi miti", siti che vietano l'AI lasciati all'utente, revisione dell'utente solo sulla tabella della tossicità. Vale anche come riferimento per le regole delle schede generate al momento. Usala SEMPRE quando si scrive, corregge, amplia o controlla una scheda o un blocco di schede, quando l'utente chiede "scrivi la scheda di…", "prossimo blocco", "aggiungi la pianta…", o scrive "/plant-schede <pianta o blocco>".
---

# Skill: plant-schede — scrivere le schede di cura

Scopo: schede **complete, verificabili e scritte da noi** per qualsiasi pianta (decisione D13). Progetto generale:
`docs/architecture/schede-su-larga-scala.md`. L'argomento indica la pianta, il genere, il tipo o il blocco
(es. `Ficus elastica`, `genere Ficus`, `blocco 3`). Se manca, prendi le prossime 10 voci di `data/elenco-priorita.json`.

**Lingua:** italiano semplice. Prima di ogni fase dì cosa farai; alla fine riepiloga per l'utente.

## Fase 0 — Leggere prima (obbligatorio)
1. `CLAUDE.md` §5 e §8 (niente copie, onestà); `docs/architecture/schede-su-larga-scala.md` (livelli, schema `CareSheet`,
   controlli); `docs/requirements/esempio-scheda-pothos.md` (esempio di tono e completezza).
2. `docs/api-documentation/fonti-editoriali.md` (siti confermati, regole sui feed, **regola Gardenia**) e
   `docs/api-documentation/banche-dati-cura.md` (dati aperti per i controlli).
3. Se esiste già la scheda, leggila: si aggiorna, non si riscrive da zero.

## Fase 1 — Raccogliere più fonti autorevoli
Per **ogni pianta e ogni sezione** cerca almeno **2 fonti** (3 se i dati sono numerici o di sicurezza), da questi livelli:

| Livello | Esempi | Cosa può sostenere |
|---|---|---|
| **A — scientifico/istituzionale** | orti botanici (Kew, Missouri Botanical Garden), università e servizi di divulgazione (NC State, UF/IFAS, università italiane), enti di ricerca (CREA, Georgofili), RHS, servizi pubblici, studi pubblicati | tutto: numeri, tossicità, verdetti dei falsi miti |
| **B — vivai specializzati e associazioni** | vivai con schede tecniche serie (es. Vivai Le Georgiche), associazioni di settore | consigli pratici; numeri solo se d'accordo con una fonte A o con un'altra B |
| **C — riviste e blog di settore affidabili** | siti confermati in `fonti-editoriali.md` (Vita in Campagna, Gardenia…) | consigli pratici coerenti con A/B; mai da soli per un numero, per la tossicità o per un verdetto |

**Regole di accesso (obbligatorie):**
- prima di aprire un sito con uno strumento automatico, controlla `robots.txt`, le direttive per l'AI
  (`Content-Signal`, `Content-Usage`, blocchi per `Claude-User`/`ClaudeBot`) e i termini d'uso;
- **se il sito vieta l'AI, non aprire le sue pagine** (vale sempre per **Gardenia**): segna la fonte come
  "da leggere all'utente" nel riepilogo, con titolo e link se li conosci da altre vie; sarà l'utente a leggerla e sceglierla;
- niente paywall, niente scraping massivo: si leggono le singole pagine utili.

## Fase 2 — Ricavare i fatti (non le frasi)
- Da ogni fonte annota **fatti e consigli**, non frasi: "minima 10 °C", "annaffiare quando i primi 2-3 cm sono asciutti".
- Per ogni fatto annota **fonte e punto** (`locator`: "sezione Watering", "tabella 2").
- Confronta le fonti fatto per fatto: **d'accordo**, **in parte**, **in disaccordo**.
- Per le schede di **genere** e di **tipo** usa **intervalli** ed eccezioni esplicite, mai il valore di una sola specie.

## Fase 3 — Scrivere con parole nostre, in due parti per ogni sezione
**Parte 1 — "Linee guida"** (solo fonti **A**, oppure **due B concordi**):
1. **riassunto** (2-4 frasi semplici) di cosa dicono le fonti nel complesso;
2. **"cose da fare"**: lista breve di azioni concrete ("Annaffia quando i primi 2-3 cm di terriccio sono asciutti");
3. i campi strutturati dello schema `CareSheet` (numeri, stagioni, intervalli), ognuno con le sue fonti. **Tutti i numeri
   e la tossicità stanno qui.**

**Parte 2 — "Consigli dal pollice verde"** (fonti **B e C**: vivai, appassionati, riviste e blog di settore):
- trucchi pratici, uno per riga, con parole nostre e la fonte; nell'app compaiono con l'etichetta **"non ufficiale"**;
- **mai in contraddizione** con le linee guida (es. una temperatura fuori dall'intervallo, un'annaffiatura più frequente
  del consigliato): un consiglio che le contraddice **non entra qui** e si valuta come voce dei **"Falsi miti"**,
  con verdetto basato su fonti A;
- può essere vuota: meglio nessun trucco che un trucco dubbio.

Per entrambe le parti: **fonti citate con link** (titolo, sito, URL, data di consultazione, livello A/B/C, punto della
fonte).

**Divieti:**
- mai copiare testi, nemmeno parzialmente; mai seguire un singolo articolo frase per frase o nello stesso ordine;
- mai più di **8 parole consecutive** uguali a una fonte (il test le cerca);
- mai un numero o un consiglio di sicurezza senza fonte: se manca, "non indicata dalle fonti";
- mai percentuali di frequenza dei problemi (solo frequente / occasionale / raro / non indicata, come la fonte).

## Fase 4 — Quando le fonti si contraddicono
- **Dichiaralo** nella sezione: "Le fonti non sono d'accordo: X dice…, Y dice…" e indica la **via prudente**.
- Pesa autorevolezza e accordo: una fonte A prevale su B e C; più fonti A concordi prevalgono su una sola.
- **Valuta una voce in "Falsi miti"** se il disaccordo nasce da una credenza diffusa (tipicamente fonti C o B contro
  fonti A): verdetto a quattro livelli (falso, esagerato, vero solo in parte, fonti in disaccordo), con fonti A.
- Annota il caso nel riepilogo del blocco, così l'utente lo vede.

## Fase 5 — Controlli (come da progetto)
1. `npm run schede:controlla` (quando esiste): completezza, fonti, coerenza, EIVE/WCVP, anti-copia, link vivi.
2. **Verifica indipendente:** un secondo agente, senza la bozza del ragionamento, rilegge le fonti e controlla ogni
   affermazione; quelle non trovate si tolgono o si correggono. Controlla anche che i consigli dal pollice verde non
   contraddicano le linee guida.
3. Tossicità (decisione dell'utente del 2026-11-26): la prudenza vale in una sola direzione.
   - **"non tossica"**: solo con **2 fonti A concordi**. Una fonte sola che dice "non tossica" non basta: resta
     "non verificata" (es. basilico, fragola, cetriolo).
   - **"tossica"**: con **2 fonti concordi** (almeno una A).
   - **"tossica (una fonte)"**: basta **una fonte A** che segnala un pericolo. La nota deve dirlo ("una fonte sola…, non
     ancora confermato da una seconda"): `npm run schede:controlla` lo controlla. Es. porro, erba cipollina, origano.
   - Per le **persone** una fonte conta se nomina persone o bambini: il testo, le etichette "Problem for Children" o
     "Poisonous to Humans" di NC State, oppure (decisione dell'utente del 2026-11-27) la **sezione "Poisonous to Humans"
     di NC State**: quando c'è vale come fonte A per le persone ("tossica (una fonte)" se è l'unica). Es. bosso, ligustro,
     evonimo, aucuba, iperico, geranio, gardenia.
     Per le piante che si mangiano (ortaggi e aromatiche) quella sezione spesso descrive sintomi degli animali (per la
     cipolla, l'anemia del cane): lì la decisione spetta all'utente (in attesa per cipolla, aglio, porro, prezzemolo,
     menta e lavanda).
   - Altrimenti "non verificata" con il consiglio prudente.
   Vale per i casi, per i valori generali delle schede del tipo e per il testo delle note di famiglia (dove la fonte
   è una sola, si dice).

## Fase 6 — Revisione dell'utente (5 minuti per blocco)
Decisione dell'utente del 2026-11-18: la revisione è **solo** questa tabella. Tutto il resto lo verificano i test
automatici e l'agente indipendente.

| Pianta | Tossica per le persone | Tossica per gli animali | Fonte (con link) |
|---|---|---|---|
| … | sì / sì (una fonte) / no / varia / non verificata | sì / sì (una fonte) / no / varia / non verificata | [titolo](url) |

Sotto la tabella, in poche righe: fonti da leggere all'utente (siti che vietano l'AI), eventuali nuove voci di
"Falsi miti". Le letture complete sono facoltative. Dopo l'approvazione: commit e push (regola dei push).

## Schede generate al momento (riferimento)
Le schede generate dall'AI gratuita (D6 rivista, D13) seguono le stesse regole, con alcune differenze:
- linee guida solo dalla nostra scheda di genere o di tipo e da EIVE e WCVP;
- Wikipedia vale come fonte C;
- tossicità mai "innocua" senza fonte verificata;
- etichetta "Scheda generata automaticamente".

Quando una specie generata entra in un blocco, si scrive la scheda verificata che la sostituisce.
