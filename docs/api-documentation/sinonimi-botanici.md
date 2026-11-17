# Tabella dei sinonimi botanici (GBIF) — scheda

> Ultima verifica: 2026-11-17 · Sito ufficiale: https://www.gbif.org/ · Collegati: [decisione D9](../architecture/decisioni-da-prendere.md),
> [scheda Pl@ntNet](plantnet-api.md)

## In breve
Una stessa pianta può avere **più nomi scientifici**: un nome vecchio e uno nuovo (*Sansevieria trifasciata* è oggi
*Dracaena trifasciata*), oppure grafie diverse. Pl@ntNet, iNaturalist e le nostre schede non usano sempre lo stesso nome.
Serve quindi una **tabella dei sinonimi** che dica qual è il **nome accettato**, cioè quello valido oggi, così l'app
mostra **sempre lo stesso nome** per la stessa pianta (decisione D9).

> **Sinonimo**: un altro nome scientifico della stessa pianta, oggi non più usato come principale.
> **Nome accettato**: il nome che le banche dati botaniche considerano valido oggi.

## Cosa usiamo e perché
- **GBIF Backbone Taxonomy**: la classificazione di riferimento di GBIF (la grande banca dati internazionale sulla
  biodiversità). Licenza **CC BY 4.0** [1].
- Ogni risultato di Pl@ntNet contiene già il codice GBIF della specie (`gbif.id`) e quello di POWO (`powo.id`), la banca
  dati dei Royal Botanic Gardens di Kew. È stato verificato su una risposta reale del test D9.
- **La tabella si prepara una volta sul PC**, con uno script, per le specie del catalogo e per quelle viste nei test. Poi
  viaggia **dentro l'app** come file: l'app non chiama GBIF mentre la usi.
- Il servizio usato è l'API pubblica e documentata di GBIF, `species/match` [2]: dato un nome, restituisce se è
  accettato o sinonimo e qual è il nome accettato.

## Cosa abbiamo verificato (2026-11-17)
**Regola decisa il 2026-11-17 (D9):** i **nomi scientifici seguono GBIF**. Quando GBIF tiene separati due nomi che per
la cura sono la stessa pianta, l'app mostra il nome GBIF ma apre **la stessa scheda di cura**.

| Nome | Risposta di GBIF | Nome mostrato | Scheda di cura |
|---|---|---|---|
| *Sansevieria trifasciata* | **sinonimo** di *Dracaena trifasciata* | *Dracaena trifasciata* | sansevieria |
| *Aloe officinalis* / *Aloe vera* | due specie accettate distinte | ciascuna il suo nome GBIF | **la stessa** (aloe vera) |
| *Peperomia argyraea* / *Peperomia argyreia* | due nomi accettati distinti (autori diversi) | ciascuna il suo nome GBIF | **la stessa** (peperomia anguria) |
| *Calathea insignis* / *Goeppertia insignis* | *Goeppertia insignis* accettato; *Calathea insignis* non trovato come specie | *Goeppertia insignis* | calathea |
| *Philodendron cordatum* / *P. hederaceum* | due specie accettate distinte | ciascuna il suo nome | **diverse** (non è la stessa pianta) |
| *Epipremnum pinnatum* (nome usato dall'RHS per il pothos dorato) | specie accettata, distinta da *E. aureum* | — | da chiarire nella scheda del pothos |

La tabella contiene quindi due cose separate:
- i **sinonimi botanici**, presi da GBIF, che decidono il **nome**;
- i **collegamenti alle schede di cura** (`careSheetId`), decisi da noi, che decidono **quale scheda si apre**. Ogni
  collegamento tra nomi che GBIF considera distinti ha una nota e la data della decisione.

**World Flora Online** (il catalogo mondiale delle piante) e **POWO**: non è stato possibile confrontarli. Il sito di
World Flora Online ha dato un errore di certificato di sicurezza, e non lo abbiamo aggirato. Restano **da verificare**
come seconda fonte.

## Limiti del piano gratuito
L'API di GBIF è gratuita e non richiede chiave per le ricerche sulle specie [2]. Limiti di frequenza: **da verificare**
(la pagina dei termini ha risposto 403 a una lettura automatica). Usandola **solo sul PC** per preparare la tabella,
facciamo poche centinaia di richieste in tutto.

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì | [1][2] |
| Uso commerciale consentito? | Sì, con attribuzione (CC BY 4.0) | [1] |
| Serve una chiave API? | No, per `species/match` | [2] |
| Obblighi (attribuzione…) | Citare "GBIF Backbone Taxonomy", DOI 10.15468/39omei, nella pagina Informazioni (F15) | [1] |

## Come lo usiamo nel codice (adattatore)
```ts
// src/lib/taxonomy/TaxonomyProvider.ts (da creare)
interface TaxonomyProvider {
  acceptedName(scientificName: string, ids?: { gbif?: string; powo?: string }): AcceptedName;
}
interface AcceptedName {
  name: string;                       // nome mostrato all'utente: il nome accettato da GBIF
  status: 'accepted' | 'synonym' | 'unknown';
  gbifKey?: number;
  careSheetId?: string;               // scheda di cura da aprire; più nomi GBIF possono avere la stessa scheda
  careSheetNote?: string;             // es. "Aloe officinalis: stessa scheda di Aloe vera (decisione D9, 2026-11-17)"
}
// Implementazione v1: StaticSynonymTable (file JSON nell'app, generato da uno script sul PC)
```

## Cosa succede se il servizio non risponde
L'app non chiama mai GBIF: la tabella è un file incluso. Se un nome non c'è, l'app mostra il nome di Pl@ntNet così com'è
(stato `unknown`).

## Alternative gratuite
- **World Flora Online**: catalogo mondiale delle piante (licenza e API **da verificare**).
- **POWO** (Kew): Pl@ntNet ne fornisce il codice. Le condizioni di riuso dei dati sono **da verificare**. Le API non
  documentate non vanno usate (CLAUDE.md §5).
- Ripiego: tabella scritta a mano per le specie del catalogo.

## Rischi
| Rischio | Probabilità | Mitigazione |
|---|---|---|
| La classificazione GBIF è datata (ultima modifica del dataset: 2023-11-17) | Media | Seconda fonte (WFO) da verificare; nota della data nella tabella |
| Le fonti non concordano su un nome | Media | Equivalenze di interfaccia dichiarate, con nota |
| Un collegamento sbagliato apre la scheda di una pianta diversa | Bassa-media | Ogni collegamento tra nomi distinti è deciso dall'utente e documentato con una nota |

## Decisioni aperte
Nessuna: i conflitti con GBIF sono stati risolti il 2026-11-17. I nomi seguono GBIF, e i nomi da collegare tra loro
puntano alla stessa scheda di cura.

## Fonti
1. GBIF, "GBIF Backbone Taxonomy" (licenza CC BY 4.0; DOI 10.15468/39omei; dataset modificato il 2023-11-17) — https://api.gbif.org/v1/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c — consultato il 2026-11-17
2. GBIF API, `species/match` (risposte per i nomi della tabella) — https://api.gbif.org/v1/species/match — consultato il 2026-11-17; documentazione: https://techdocs.gbif.org/en/openapi/v1/species (da verificare)
