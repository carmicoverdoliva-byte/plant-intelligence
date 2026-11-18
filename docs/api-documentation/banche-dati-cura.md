# Banche dati aperte per le schede di cura — scheda

> Ultima verifica: 2026-11-18 · Collegati: [schede su larga scala](../architecture/schede-su-larga-scala.md),
> [decisione D13](../architecture/decisioni-da-prendere.md#d13--schede-complete-per-qualsiasi-pianta-riconosciuta)

## In breve
Abbiamo cercato banche dati **gratuite e con licenza aperta** che contengano consigli di cura (luce, acqua, temperatura,
terriccio, concime…) da usare in un progetto open source non commerciale.

- **Nessuna banca dati aperta contiene schede di cura complete.** Quelle complete (RHS, Missouri Botanical Garden,
  università) sono protette dal diritto d'autore: si possono **consultare e citare**, ma non copiare.
- Ci sono però **quattro fonti aperte utili per accelerare e controllare** il lavoro:
  1. GBIF, per scegliere le specie;
  2. WCVP di Kew, per assegnare a ogni pianta il suo "tipo";
  3. EIVE, per controllare i valori di luce, umidità e temperatura;
  4. Wikidata, per nomi e collegamenti.

**Glossario minimo**
- **Licenza aperta:** permesso scritto di riusare i dati. "CC0" = nessun obbligo. "CC BY" = si può usare tutto, citando
  la fonte. "NC" = solo usi non commerciali. "ND" = vietato modificare.
- **Diritto sui generis delle banche dati (UE):** anche se i singoli fatti non sono protetti, in Europa non si può
  **estrarre una parte sostanziale** di una banca dati altrui. Per questo ogni scheda usa **più fonti** e i testi sono
  scritti da noi, senza copiare elenchi interi da un solo sito.

## Cosa usiamo e perché
| Fonte | Cosa contiene | Licenza | A cosa ci serve | Esito |
|---|---|---|---|---|
| **GBIF**, dataset "Pl@ntNet automatically identified occurrences" e "Pl@ntNet observations" [1][2] | Piante fotografate con Pl@ntNet, con luogo e data: 10,7 milioni di osservazioni in Europa, 0,93 milioni in Italia | CC BY 4.0 | **Scegliere e ordinare le specie e i generi** da coprire: quelle che la gente fotografa davvero | ✅ Usare |
| **WCVP**, World Checklist of Vascular Plants (Kew) [3][4] | Tutte le piante vascolari del mondo, con **forma di vita** (albero, arbusto, erbacea perenne, epifita…) e **clima d'origine** (tropicale, temperato…) | CC BY 4.0 | Dare a ogni pianta riconosciuta il suo **"tipo di pianta"**, l'ultimo livello di sicurezza | ✅ Usare |
| **EIVE 1.0**, Ecological Indicator Values for Europe [5][6] | Valori ecologici per 14.835 piante europee: luce, umidità, temperatura, acidità e nutrienti del suolo | CC BY 4.0 | **Controllo di qualità**: se una scheda dice "pieno sole" e EIVE dice "pianta d'ombra", il test lo segnala | ✅ Usare (solo piante europee) |
| **Wikidata** [7] | Nomi comuni in italiano, sinonimi, collegamenti ad altre banche dati | CC0 | Nomi italiani e collegamenti; mai consigli di cura (non ce ne sono di affidabili) | ✅ Usare |
| USDA PLANTS [8] | Caratteristiche di ~2.000 piante americane: tolleranza all'ombra, uso dell'acqua, temperatura minima | Probabilmente di pubblico dominio (ente pubblico USA), **(da verificare: la pagina delle condizioni d'uso non ha risposto il 2026-11-18)** | Controllo aggiuntivo, solo per le specie presenti | ⏸️ Da verificare |
| Plants For A Future (PFAF) [9] | Schede di migliaia di piante utili | Testi **protetti** ("copyrighted by Ken Fern/PFAF"); immagini CC BY-NC-ND | Niente | ❌ Esclusa |
| Practical Plants [10] | Wiki costruito sui dati PFAF | Licenza dichiarata "solo usi non commerciali", ma derivata da PFAF, oggi protetto: **origine dei diritti incerta** | Niente | ❌ Esclusa |
| OpenFarm [11][12] | Guide di coltivazione di ortaggi | **Chiuso ad aprile 2025.** Il codice è MIT, ma per i dati le fonti si contraddicono (CC0 o CC BY) e un archivio completo non è confermato | Niente, per ora | ❌ Esclusa (rivalutare se esce un archivio ufficiale) |
| Perenual e API commerciali simili [13] | Schede di cura per oltre 10.000 piante | Servizio commerciale; termini e licenza dei dati **non trovati** | Niente | ❌ Esclusa (dipendenza a pagamento, CLAUDE.md §4) |
| Piccoli dataset su GitHub e Hugging Face [14] | Schede di poche decine di piante d'appartamento | Licenza spesso assente; **provenienza dei dati non verificabile** | Niente | ❌ Esclusi |

**Fonti per scrivere le schede (consultare e citare, non copiare).** I valori di cura verranno da siti istituzionali,
letti uno per uno e citati nella scheda:
- Royal Horticultural Society;
- Missouri Botanical Garden (Plant Finder);
- servizi di divulgazione delle università (es. NC State Extension, University of Florida IFAS);
- CREA e Accademia dei Georgofili;
- orti botanici universitari italiani.

Sono **testi protetti**: usiamo **i fatti**, con parole nostre e citando la fonte, e mai una parte sostanziale di un solo
sito. Prima che uno strumento di intelligenza artificiale apra un sito, si controllano `robots.txt` e i termini d'uso. Se
il sito non vuole strumenti di AI (come Gardenia), quel sito lo legge solo l'utente, oppure non si usa.

## Cosa dicono i numeri di GBIF: quante specie servono
Conteggi fatti il 2026-11-18 con l'API pubblica di GBIF [1][2]. Ogni cella dice: le prime N specie (o generi, o
famiglie), ordinate per numero di foto, coprono questa **quota delle foto**.

| Insieme di foto | Specie: 100 | 300 | 500 | 1.000 | Generi: 100 | 300 | 500 | Famiglie: 50 | 100 |
|---|---|---|---|---|---|---|---|---|---|
| Italia, riconosciute in automatico (0,93 mln foto, 2.460 specie) | 51% | 78% | 89% | 98% | 64% | 92% | 99% | — | — |
| Italia, confermate da persone (0,20 mln foto, 3.253 specie) | 27% | 53% | 68% | 88% | 51% | 84% | 96% | — | — |
| Europa, riconosciute in automatico (10,7 mln foto, 4.363 specie) | 46% | 73% | 84% | 95% | 62% | 89% | 97% | 88% | 99% |

**Come leggerli:**
- La realtà sta fra le due righe italiane. La prima favorisce le piante facili da riconoscere; la seconda contiene più
  piante rare, viste da esperti.
- **Questi dati riguardano piante all'aperto**: giardini, siepi, alberi in città, piante selvatiche. In cima ci sono
  pitosforo, lentisco, viburno tino, faggio, lauroceraso, olivo, oleandro.
- **Piante d'appartamento e ortaggi sono quasi assenti**, perché le foto in casa o nell'orto finiscono poco su GBIF.
  Vanno scelti con un **elenco a parte**.

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì: GBIF, WCVP, EIVE e Wikidata si scaricano gratis, senza account per i file pubblici | [1][3][5][7] |
| Uso commerciale consentito? | GBIF, WCVP ed EIVE sono CC BY 4.0 (sì, citando); Wikidata CC0 (sì). Non ci riguarda: il progetto è non commerciale (D1) | [2][4][6][7] |
| Serve una chiave API? | No | [1] |
| Obblighi (attribuzione, logo…) | Citare GBIF (con il DOI dei dati usati), Kew-WCVP, gli autori di EIVE nella pagina "Informazioni" (F15) e in questo documento | [2][4][6] |

## Come lo usiamo nel codice (adattatore)
Queste fonti **non** si chiamano dall'app: si scaricano **una volta, sul PC**, con script che producono file statici,
come già facciamo per i sinonimi botanici. Così non ci sono servizi esterni da cui dipendere quando l'app è online.

```text
[PC: script] --scarica--> GBIF (conteggi) + WCVP (forma di vita, clima) + EIVE (valori ecologici)
      |
      +--> data/elenco-priorita.json   (quali specie e generi scrivere prima)
      +--> data/tipo-di-pianta.json    (genere -> tipo di pianta, per il livello 4)
      +--> test di qualità delle schede (confronto con EIVE)
```

Adattatore: `CareSheetProvider` (vedi [schede su larga scala](../architecture/schede-su-larga-scala.md)). Oggi legge i
file statici delle schede; domani potrebbe leggere un'altra fonte senza cambiare le schermate.

## Cosa succede se il servizio non risponde o il limite è superato
Nulla per l'utente: i dati sono già nei nostri file. Se GBIF o Kew cambiano o spariscono, restano le copie scaricate
(con data e versione annotate). Si aggiornano al più una volta per versione dell'app.

## Alternative gratuite
- Per l'ordine delle specie: iNaturalist (osservazioni "research grade" su GBIF, CC BY o CC0 a seconda dell'autore).
- Per il tipo di pianta: World Flora Online (licenza **da verificare**, vedi [sinonimi botanici](sinonimi-botanici.md)).
- Per i valori ecologici delle piante italiane: indicatori di Pignatti, già compresi in EIVE.

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| I dati GBIF non rappresentano le piante d'appartamento | Certa | Elenco a parte per casa e orto, da fonti di settore, con priorità alta |
| Una scheda copia troppo da un solo sito | Media | Più fonti per scheda; test automatico anti-copia; parole nostre |
| Un sito fonte vieta gli strumenti di AI | Media | Controllo di `robots.txt` prima di aprirlo; altrimenti lo legge l'utente o non si usa |
| WCVP o EIVE non hanno una pianta | Media | Il tipo di pianta si assegna a mano, citando la fonte |

## Decisioni aperte
- Vedi [D13](../architecture/decisioni-da-prendere.md#d13--schede-complete-per-qualsiasi-pianta-riconosciuta).
- Verificare le condizioni d'uso di USDA PLANTS quando il sito risponde.

## Fonti
1. GBIF API, ricerca delle osservazioni con conteggi per specie, genere e famiglia — https://api.gbif.org/v1/occurrence/search — consultato il 2026-11-18
2. GBIF, dataset "Pl@ntNet automatically identified occurrences" (chiave 14d5676a-2c54-4f94-9023-1e8dcd822aa0) e "Pl@ntNet observations" (chiave 7a3679ef-5582-4aaa-81f0-8c2545cafc81), licenza CC BY 4.0 — https://www.gbif.org/dataset/14d5676a-2c54-4f94-9023-1e8dcd822aa0 — consultato il 2026-11-18
3. GBIF, dataset "The World Checklist of Vascular Plants (WCVP)", licenza CC BY 4.0 — https://www.gbif.org/dataset/f382f0ce-323a-4091-bb9f-add557f3a9a2 — consultato il 2026-11-18
4. rWCVPdata, descrizione dei campi `lifeform_description` e `climate_description` — https://matildabrown.github.io/rWCVPdata/reference/wcvp_names.html — consultato il 2026-11-18
5. Dengler J. et al. (2023), "Ecological Indicator Values for Europe (EIVE) 1.0", Vegetation Classification and Survey 4: 7-29, doi:10.3897/VCS.98324, CC BY 4.0 — https://doaj.org/article/937b6ae384ff4590bd4227f09d50ebe9 — consultato il 2026-11-18
6. Zenodo, materiale supplementare EIVE 1.0, licenza CC BY 4.0 — https://zenodo.org/records/7534792 — consultato il 2026-11-18
7. Wikidata, "Licensing" (dati strutturati in CC0) — https://www.wikidata.org/wiki/Wikidata:Licensing — consultato il 2026-11-18
8. USDA NRCS, PLANTS Database, caratteristiche (Charinfo) — https://plants.usda.gov/assets/docs/Charinfo.pdf — consultato il 2026-11-18 (pagina delle condizioni d'uso non raggiungibile)
9. Plants For A Future, pagina sul copyright — https://pfaf.org/user/cmspage.aspx?pageid=136 — consultato il 2026-11-18
10. Practical Plants, "Commons" — https://practicalplants.org/wiki/Commons — consultato il 2026-11-18
11. FarmBot, "Sunsetting OpenFarm" — https://farm.bot/blogs/news/sunsetting-openfarm — consultato il 2026-11-18
12. OpenFarm, repository archiviato (licenza del codice MIT) — https://github.com/openfarmcc/OpenFarm — consultato il 2026-11-18
13. API Evangelist, profilo di Perenual Care API (fonte di terzi: termini ufficiali non trovati) — https://apis.apievangelist.com/store/perenual-care-api/ — consultato il 2026-11-18
14. Esempio: Houseplantdex, "How the data is built" (conferma che non esiste una fonte aperta completa) — https://houseplantdex.pages.dev/methodology/ — consultato il 2026-11-18
