# Pl@ntNet API — scheda

> Ultima verifica: 2026-11-16 · Sito ufficiale: https://my.plantnet.org/

## In breve
Pl@ntNet API è il servizio che **riconosce una pianta da una o più foto**. È gestito da enti di ricerca pubblici francesi
(CIRAD, INRAE, INRIA, IRD). L'app manda le foto, il servizio risponde con una **lista di specie possibili**, ognuna con un
**punteggio** da 0 a 1 (la "confidenza") [2].

> **API**: un servizio a cui un programma manda una richiesta e da cui riceve una risposta, senza che una persona debba
> usare un sito web.

## Cosa usiamo e perché
- **Riconoscimento** (`POST /v2/identify/{project}`): fino a **5 foto della stessa pianta** in una richiesta, ognuna con l'organo
  fotografato (`leaf` foglia, `flower` fiore, `fruit` frutto, `bark` corteccia, oppure `auto`) [2].
- **Lista ordinata di specie con punteggio** (`results`): è proprio quello che serve per mostrare **alternative e confidenza**
  (CLAUDE.md §8) [2].
- **Nomi comuni in italiano** con il parametro `lang=it` [2].
- **Rifiuto delle foto che non sono piante**: se la foto è un oggetto, una persona o un paesaggio, il servizio risponde
  "Species not found" (errore 404). Così l'app può dire onestamente "non vedo una pianta" [2].
- **Richieste rimaste oggi** (`remainingIdentificationRequests`) in ogni risposta: ci serve per il contatore del limite
  giornaliero [2]. Vedi [architettura](../architecture/architettura.md#4-il-limite-di-500-identificazioni-al-giorno).
- **Codice GBIF** (`gbif.id`) per ogni specie: permette di collegare altre banche dati scientifiche aperte [2].

Parametri utili: `nb-results` (quante specie restituire, meno = risposta più veloce), `include-related-images` (foto di
esempio della specie), `detailed` (risultati anche per genere e famiglia) [2].

**Foto consigliate** [2]: JPEG con qualità 90%; il servizio le riduce a 1280 pixel sul lato corto; sotto 800×800 pixel la
qualità del risultato non è garantita; massimo 50 MB per richiesta. **Fiori e frutti** danno risultati migliori di foglie e corteccia.

## Limiti del piano gratuito
| Voce | Valore | Fonte |
|---|---|---|
| Identificazioni al giorno | **500** | [3] |
| Azzeramento del contatore | mezzanotte UTC = **01:00 ora italiana d'inverno, 02:00 d'estate** | [3] |
| Superato il limite | errore **HTTP 429** ("troppe richieste") fino all'azzeramento; nessun addebito | [3] |
| Carta di credito / contratto | non richiesti | [3] |
| Account | **uno solo** per persona o organizzazione; vietati più account dallo stesso indirizzo IP | [3][4] |
| Richieste contemporanee | massimo 20 per cliente | [4] |

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì, fino a 500 identificazioni al giorno | [3] |
| Uso commerciale consentito? | **Sì, entro 500 al giorno**; oltre serve il piano Pro (da 1.000 €/anno) | [3][4] |
| Serve una chiave API? | **Sì**, segreta, passata nell'indirizzo della richiesta (`?api-key=…`) | [1] |
| Obblighi (attribuzione, logo…) | Piano Free: la scritta "Powered by Pl@ntNet" è **gradita ma non obbligatoria** [3]; i termini suggeriscono una frase di riconoscimento con logo [4]. **Noi la mettiamo comunque** (è corretto e costa nulla). | [3][4] |
| Le foto inviate vengono conservate? | **No**: restano in memoria solo durante il riconoscimento. Vengono registrati data, ora e indirizzi (URL) delle immagini, non le immagini | [3][4] |
| Garanzie | Nessuna: risultati "a proprio rischio" | [4] |

Altri piani: **Non-profit** gratuito su richiesta (fino a 10.000 al giorno) solo per **organizzazioni** non profit
educative o scientifiche, senza pubblicità né abbonamenti, con logo obbligatorio [3]. **Pro**: 1.000 €/anno per 200.000
identificazioni [3].

## Riconosce bene le piante d'appartamento?
Abbiamo verificato, ecco cosa sappiamo:
- **Le specie ci sono.** La flora mondiale `k-world-flora` comprende 73.591 specie [5]. Il pothos (*Epipremnum aureum*), per esempio,
  ha migliaia di immagini nelle flore di Pl@ntNet [7]. Esiste anche un progetto tematico `useful` ("Cultivated and ornamental
  plants", 5.443 specie) [5].
- **Ma il servizio nasce per la flora selvatica.** La stessa scheda dell'app sull'App Store dice che le piante coltivate sono
  riconosciute "in misura minore" [6].
- **Non abbiamo trovato nessun test indipendente** sull'accuratezza con le piante d'appartamento. I test pubblici riguardano
  piante selvatiche o di campo (vedi [scheda concorrente](../competitor-analysis/plantnet.md)). Una recensione datata racconta
  difficoltà con alcune piante di casa, ma si riferisce a quando le flore erano limitate a poche regioni [8].
- **Attenzione ai progetti "legacy"**: la documentazione dice di usare sempre i progetti "KT" (prefisso `k-`), perché quelli
  legacy usano un modello vecchio che verrà rimosso [2][5]. Va verificato se `useful` è un progetto legacy **(da verificare)**.

**Conclusione:** probabilmente funziona bene con le piante d'appartamento più comuni, ma **non è dimostrato**. Prima di scrivere
il codice dell'interfaccia faremo un **test con circa 30 foto di piante di casa** (le 7 foto del protocollo più altre 20-25),
confrontando `all`, `k-world-flora` e `useful`. È la [decisione D9](../architecture/decisioni-da-prendere.md).

## Come lo usiamo nel codice (adattatore)
La chiave è segreta: **la usa solo il nostro server**, mai il telefono (CLAUDE.md §7).

```text
[Telefono] --foto ridotte--> [Server Next.js /api/identify] --foto + chiave segreta--> [Pl@ntNet API]
                                      |  conta le richieste
                                      v
                             risposta "tradotta" nel nostro formato
```

```ts
// src/lib/recognition/PlantRecognitionProvider.ts (da creare)
interface PlantRecognitionProvider {
  identify(input: { photos: Blob[]; organs: Organ[]; lang: string }): Promise<IdentificationResult>;
}
// PlantNetProvider implementa questa interfaccia. Se un giorno cambiamo servizio,
// scriviamo un nuovo "provider" senza toccare il resto dell'app.
```

Nome della variabile segreta (solo in `.env.local`, mai nel codice): `PLANTNET_API_KEY`.

## Cosa succede se il servizio non risponde o il limite è superato
| Situazione | Cosa vede l'utente |
|---|---|
| 404 "Species not found" | "Non riesco a vedere una pianta in questa foto. Prova ad avvicinarti a una foglia o a un fiore." |
| 429 limite giornaliero | "Oggi abbiamo esaurito i riconoscimenti gratuiti. Riprova dopo le 01:00 (le 02:00 con l'ora legale). Intanto puoi cercare la pianta per nome." |
| Servizio irraggiungibile | "Il servizio di riconoscimento non risponde. Le foto restano salvate: riprova più tardi." |

In ogni caso l'app **non si blocca**: la ricerca della pianta per nome resta sempre disponibile.

## Alternative gratuite
| Alternativa | Gratuita? | Note |
|---|---|---|
| **Ricerca per nome** dentro l'app | Sì | Ripiego sempre disponibile; non riconosce dalla foto |
| Modello di riconoscimento open source eseguito da noi (es. addestrato sul dataset pubblico PlantNet-300K) | Sì, ma richiede un server con potenza di calcolo | **(da verificare)**: licenze e fattibilità; opzione per versioni future |
| iNaturalist | Il riconoscimento da foto non risulta offerto come API pubblica | **(da verificare)** |
| Plant.id (Kindwise) | **No**, a pagamento con crediti di prova | Non adatta: violerebbe il vincolo di gratuità |

Oggi **non esiste un'alternativa gratuita equivalente**: è il rischio principale del progetto (vedi sotto).

## Rischi
| Rischio | Probabilità | Come lo mitighiamo |
|---|---|---|
| Accuratezza bassa sulle piante di casa | Media | Test con 30 foto prima di sviluppare (D9); alternative sempre visibili; ricerca per nome |
| 500 identificazioni al giorno non bastano se l'app ha successo | Bassa all'inizio | Contatore + quota per dispositivo; messaggi chiari; eventuale richiesta piano non profit se nascerà un'associazione |
| Cambio delle condizioni gratuite | Bassa | Adattatore `PlantRecognitionProvider`; questa scheda va riverificata ogni 6 mesi |
| Chiave rubata | Bassa | Chiave solo sul server; quota per dispositivo; possibilità di rigenerarla |
| Privacy: posizione GPS nascosta nelle foto | Media | Ridurre le foto sul telefono (questo elimina i dati EXIF, cioè le informazioni nascoste come luogo e data) prima dell'invio |

## Fonti
1. Pl@ntNet API, "Introduction" — https://my.plantnet.org/doc/getting-started/introduction — consultato il 2026-11-16
2. Pl@ntNet API, "Single-species identification" — https://my.plantnet.org/doc/api/identify — consultato il 2026-11-16
3. Pl@ntNet API, "Pricing and conditions" — https://my.plantnet.org/pricing — consultato il 2026-11-16
4. Pl@ntNet API, "General Terms, Conditions and Access policy" — https://my.plantnet.org/terms_of_use — consultato il 2026-11-16 (licenze commerciali v5.1)
5. Pl@ntNet API, "Taxonomy related routes" (elenco progetti) — https://my.plantnet.org/doc/api/taxonomy — consultato il 2026-11-16
6. PlantNet, pagina App Store (USA) — https://apps.apple.com/us/app/plantnet/id600547573 — consultato il 2026-11-16
7. Pl@ntNet identify, osservazione e liste di *Epipremnum aureum* — https://identify.plantnet.org/the-plant-list/observations/1012550215 — consultato il 2026-11-16 tramite risultati di ricerca
8. Modern Farmer, recensione di app di riconoscimento — https://modernfarmer.com/?p=44006 — data non indicata, letta tramite risultati di ricerca (aneddoto, non test)
