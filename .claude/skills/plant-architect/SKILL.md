---
name: plant-architect
description: Progettazione di Plant Intelligence — architettura, schema dei dati, integrazioni con servizi esterni (Pl@ntNet, Open-Meteo, SunCalc, AI, hosting, database) e specifiche funzionali. Usala quando l'utente chiede di progettare, pianificare o documentare come è fatta l'app, scegliere un servizio o una libreria, scrivere specifiche o requisiti, definire i dati, valutare limiti/licenze/costi di un servizio, o scrive "/plant-architect <argomento>". Produce documenti in italiano semplice in docs/architecture, docs/requirements e docs/api-documentation, con diagrammi testuali, alternative gratuite, rischi e decisioni aperte.
---

# Skill: plant-architect — progettare Plant Intelligence

Scopo: prendere decisioni tecniche **documentate, gratuite e reversibili**, spiegate in modo comprensibile a chi è alle
prime armi. L'argomento passato alla skill indica cosa progettare (es. `architettura`, `schema dati`, `Open-Meteo`).
Se manca o è vago, chiedi all'utente cosa vuole progettare prima di iniziare.

**Lingua:** tutto in italiano semplice. Prima di ogni fase dì cosa farai, dopo riassumi cosa hai deciso o trovato.
Ogni termine tecnico va spiegato in una frase la prima volta che compare (es. "API: un servizio a cui l'app manda una
richiesta e da cui riceve una risposta").

## Fase 1 — Leggere prima di progettare (obbligatorio)
Prima di scrivere qualsiasi cosa, leggi:
1. `CLAUDE.md` — regole del progetto (gratuità, adattatori, chiavi API, onestà, onboarding e Guida);
2. `docs/requirements/visione-prodotto.md` — cosa deve fare l'app;
3. tutte le analisi in `docs/competitor-analysis/` (schede e `matrice-confronto.md`);
4. i documenti già esistenti in `docs/requirements/`, `docs/architecture/`, `docs/api-documentation/`, per non
   contraddirli. Se un nuovo documento cambia una scelta già scritta, dillo esplicitamente.

## Fase 2 — Verificare ogni servizio esterno sulla documentazione ufficiale
Per **ogni** servizio, libreria o hosting che proponi:
- consulta la **documentazione ufficiale aggiornata** (sito, pagina prezzi, termini d'uso, file LICENSE), non blog o
  riassunti di terzi; annota URL e data di consultazione;
- verifica: cosa fa, **limiti del piano gratuito** (richieste al giorno/mese, spazio, sospensioni per inattività),
  **licenza** (del codice e dei dati), **uso commerciale sì/no**, obblighi (es. citare la fonte, logo), necessità di
  chiave API o carta di credito;
- ciò che non riesci a confermare va marcato **"(da verificare)"**; non inventare numeri.
- Le schede dei servizi vanno in `docs/api-documentation/<servizio>.md` con questo formato:

```markdown
# <Servizio> — scheda

> Ultima verifica: AAAA-MM-GG · Sito ufficiale: <URL>

## In breve
## Cosa usiamo e perché
## Limiti del piano gratuito
## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | | |
| Uso commerciale consentito? | | |
| Serve una chiave API? | | |
| Obblighi (attribuzione, logo…) | | |
## Come lo usiamo nel codice (adattatore)
## Cosa succede se il servizio non risponde o il limite è superato
## Alternative gratuite
## Rischi
## Fonti
```

## Fase 3 — Un'alternativa gratuita per ogni dipendenza
- Ogni servizio esterno passa da un **adattatore** (un'interfaccia nel codice, es. `PlantRecognitionProvider`,
  `WeatherProvider`, `AiProvider`, `StorageProvider`) così da poterlo cambiare senza riscrivere l'app (CLAUDE.md §4).
- Per ogni dipendenza indica **almeno un'alternativa gratuita** (meglio se open source o locale) e una
  **soluzione di ripiego** se il servizio smette di funzionare (es. funzione degradata con messaggio chiaro).
- Nessuna funzione essenziale può dipendere da un servizio a pagamento.
- Le chiavi segrete restano sul server (API route di Next.js), mai nel codice che arriva al telefono (CLAUDE.md §7).

## Fase 4 — Scrivere i documenti
- Documenti in italiano semplice, con frasi brevi, esempi concreti e un glossario se servono molti termini tecnici.
- Usa **diagrammi testuali** (blocchi di codice con frecce ASCII) per flussi e componenti, ad esempio:

```text
[iPhone / PWA] --foto--> [Server Next.js /api/identify] --chiave segreta--> [Pl@ntNet API]
       ^                              |
       +---------- risultati ---------+
```

- Per gli schemi dei dati usa tabelle (campo, tipo, obbligatorio, descrizione) o tipi TypeScript commentati.
- Collega i documenti tra loro con link relativi.
- Dove si va: architettura → `docs/architecture/`; requisiti e specifiche → `docs/requirements/`;
  servizi esterni → `docs/api-documentation/`.

## Fase 5 — Rischi e decisioni aperte (non decidere da sola)
- Le **decisioni importanti** (scelta di hosting o database, uso commerciale, raccolta di dati personali, account utente,
  costi potenziali, cambi allo stack previsto in CLAUDE.md) **non si prendono da soli**: vanno presentate all'utente come
  "decisione da prendere", con le opzioni, pro e contro in parole semplici e la tua **raccomandazione motivata**.
- Ogni documento termina con le sezioni **"Rischi"** (cosa può andare storto, probabilità, come lo mitighiamo) e
  **"Decisioni aperte"** (cosa aspetta una scelta dell'utente).
- Le scelte piccole e facilmente reversibili puoi proporle come default, dicendolo esplicitamente.

## Fase 6 — Verifica e riepilogo
Prima di dire "fatto":
- controlla che ogni servizio citato abbia una fonte ufficiale con data, e che i "(da verificare)" siano evidenti;
- controlla che ogni dipendenza abbia un'alternativa gratuita e un adattatore;
- controlla che nessuna chiave o segreto compaia nei documenti;
- controlla che i link tra documenti funzionino.

Poi spiega all'utente in italiano semplice: cosa hai prodotto, i punti chiave, i rischi principali e le decisioni da
prendere insieme. Non fare commit automaticamente: proponilo (o fallo se l'utente l'ha già chiesto).
