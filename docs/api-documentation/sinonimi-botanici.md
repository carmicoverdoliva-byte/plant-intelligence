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
| Nome | Risposta di GBIF | Decisione dell'utente (D9) | Conflitto? |
|---|---|---|---|
| *Sansevieria trifasciata* | **sinonimo** di *Dracaena trifasciata* | stessa pianta | No ✅ |
| *Aloe officinalis* / *Aloe vera* | **due specie accettate distinte** | stessa pianta | **Sì ⚠️** |
| *Peperomia argyraea* / *Peperomia argyreia* | **due nomi accettati distinti** (autori diversi) | stessa pianta | **Sì ⚠️** |
| *Calathea insignis* / *Goeppertia insignis* | *Goeppertia insignis* accettato; *Calathea insignis* non trovato come specie | stesso genere | Da verificare |
| *Philodendron cordatum* / *P. hederaceum* | due specie accettate distinte | **non** la stessa pianta | No ✅ |
| *Epipremnum pinnatum* (nome usato dall'RHS per il pothos dorato) | specie accettata, distinta da *E. aureum* | — | Da chiarire nella scheda del pothos |

**Come gestiamo i conflitti.** La tabella distingue due casi:
- **sinonimi botanici**, confermati dalla fonte;
- **equivalenze di interfaccia**, decise da noi per mostrare un solo nome anche quando la fonte li tiene separati. Ogni
  equivalenza di questo tipo ha una nota e la data della decisione.

I due conflitti ⚠️ sono stati segnalati all'utente.

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
  name: string;                       // nome mostrato all'utente, sempre lo stesso
  status: 'accepted' | 'synonym' | 'ui-equivalence' | 'unknown';
  source: 'gbif' | 'decision';        // 'decision' = equivalenza decisa da noi (con nota)
  note?: string;
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
| Un'equivalenza sbagliata unisce due piante diverse | Bassa-media | Ogni equivalenza è decisa dall'utente e documentata |

## Decisioni aperte
- **Conflitti con GBIF** su *Aloe officinalis* / *Aloe vera* e *Peperomia argyraea* / *argyreia*: tenerle come
  equivalenze di interfaccia, decise da noi, oppure seguire GBIF? (D9)

## Fonti
1. GBIF, "GBIF Backbone Taxonomy" (licenza CC BY 4.0; DOI 10.15468/39omei; dataset modificato il 2023-11-17) — https://api.gbif.org/v1/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c — consultato il 2026-11-17
2. GBIF API, `species/match` (risposte per i nomi della tabella) — https://api.gbif.org/v1/species/match — consultato il 2026-11-17; documentazione: https://techdocs.gbif.org/en/openapi/v1/species (da verificare)
