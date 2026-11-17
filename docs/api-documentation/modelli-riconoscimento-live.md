# Modelli per l'anteprima live — scheda

> Ultima verifica: 2026-11-17 · Collegati: [architettura §1b](../architecture/architettura.md#1b-riconoscimento-a-due-livelli),
> [specifiche F17](../requirements/specifiche-funzionali.md#f17--anteprima-live-nel-mirino), decisioni [D10 e D11](../architecture/decisioni-da-prendere.md)

## In breve
Per l'**anteprima live** (il nome che compare mentre si inquadra una pianta) serve un **modello di riconoscimento che giri
dentro il browser dell'iPhone**, senza internet e senza costi. Abbiamo cercato modelli **aperti** (con licenza che ne
permette il riuso) e li abbiamo confrontati.

> **Modello**: un file che contiene ciò che un programma di intelligenza artificiale ha "imparato" guardando molte foto.
> **Pesi**: i numeri dentro quel file; la loro licenza dice se possiamo usarli.
> **Inferenza**: una singola analisi di un'immagine da parte del modello.

**Risultato principale:** nessun modello aperto pronto all'uso copre bene le **piante d'appartamento**. Lo abbiamo
verificato confrontando gli elenchi ufficiali delle specie con le 22 piante del nostro test D9.

## I candidati
| Modello | Specie | Piante di casa del test D9 (22) | Download | Licenza | Velocità attesa su iPhone | Note |
|---|---|---|---|---|---|---|
| **BioCLIP** (Imageomics) | non ha un elenco fisso: confronta la foto con **una lista di nomi scelta da noi** ("zero-shot"); addestrato su 454.000 gruppi di esseri viventi [1] | non misurabile dall'elenco: dipende dalla lista che gli diamo **(da verificare con D11)** | file ufficiale 599 MB [2]; la sola parte che analizza le immagini, compressa, **stimata 90-170 MB (da verificare)** | **MIT** [1] (gli autori chiedono che i derivati restino open source) | **da verificare** (modello medio, ViT-B/16) | Candidato principale. I nomi delle nostre specie si "preparano" una volta sul PC: il telefono analizza solo l'immagine |
| BioCLIP 2 | come sopra, più preciso | come sopra | 1.711 MB [2] | MIT [3] | probabilmente troppo lento (ViT-L, 3-4 volte più grande) **(da verificare)** | Esistono versioni compresse ONNX fatte da terzi, non ufficiali **(da verificare)** |
| **Google AIY Plants V1** | 2.101 specie (foto iNaturalist) [4] | **6 su 22** (aloe, crassula, stella di Natale, edera, rosmarino, monstera) — verificato sull'elenco ufficiale [5] | **circa 5 MB** (TFLite) [4] | **Apache 2.0** [4] | molto veloce: modello piccolo (MobileNet V2) pensato per telefoni | Ottimo come prova di velocità, **inadatto** come anteprima: sbaglierebbe la maggior parte delle piante di casa |
| PlantNet-300K (ResNet18, versione LiteRT) | 1.081 specie [6] | **3 su 22** (zamioculcas; alcune peperomie e anthurium, non quelli da appartamento) — verificato [7] | 47 MB [7] | codice BSD-2 [6]; pesi ufficiali **senza licenza dichiarata**; la versione su Hugging Face dichiara Apache 2.0 ma è di terzi [7] | media | Flora selvatica, quasi solo europea: inadatto |
| Pl@ntNet PlantCLEF 2024 (ViT-B DINOv2) | 7.806 specie della flora dell'Europa sud-occidentale [8] | quasi nessuna (flora selvatica) **(da verificare)** | archivio da 2,3 GB [8] | **CC BY 4.0** [8] | lento (modello medio-grande) | Ottimo per le piante selvatiche europee, inadatto qui |
| **Modello nostro** (piccolo, addestrato sulle piante del catalogo) | quelle che scegliamo (~50-100) | tutte quelle del catalogo, per costruzione | stimato 5-15 MB **(da verificare)** | nostra (open source); foto di addestramento con licenze aperte da citare (es. iNaturalist CC BY / CC BY-NC) | veloce | Richiede lavoro: raccogliere foto con licenza, addestrare (gratis sul PC o con servizi gratuiti **da verificare**), mantenerlo |
| Modello di Seek / iNaturalist | circa 80.000 [9] | probabilmente buona **(da verificare)** | — | **non disponibile**: iNaturalist dichiara di non poter condividere i propri modelli [10] | — | Escluso: non è aperto |

## Come gira nel browser (motori)
| Motore | Licenza | Cosa fa | Note |
|---|---|---|---|
| **ONNX Runtime Web** | MIT [11] | esegue modelli ONNX nel browser con WebGPU (scheda grafica), WebAssembly (processore) o WebNN [12] | scelta proposta: supporta tutti gli operatori in WebAssembly, solo una parte in WebGPU [12] |
| TensorFlow.js | Apache 2.0 [11] | esegue modelli TensorFlow nel browser | utile per Plants V1, ma richiede una conversione **(da verificare)** |
| Transformers.js | Apache 2.0 [11] | esegue modelli di Hugging Face (usa ONNX Runtime sotto) | comodo per modelli tipo CLIP **(da verificare per BioCLIP)** |

> **WebGPU**: permette a una pagina web di usare la scheda grafica del telefono, molto più veloce del solo processore.
> **WebAssembly**: un formato che fa girare codice veloce nel browser usando il processore; è il "piano B" quando WebGPU manca.

**WebGPU su iPhone.** Safari 26 (iOS 26, settembre 2025) ha WebGPU attivo di default [13]. Le fonti non concordano su
**quali iPhone** lo supportano: un forum parla solo di iPhone 15 Pro e successivi, mentre segnalazioni di WebKit lo mostrano
in uso su iPhone 12 Pro Max e 13 mini con iOS 26 [13]. **Il telefono di prova dell'utente è un iPhone 16 con iOS 26.5.2**
(dato fornito dall'utente il 2026-11-17): WebGPU dovrebbe essere disponibile; la pagina di prova D11 lo controlla.
Se WebGPU manca, si usa WebAssembly (più lento).

## Cosa usiamo e perché
Decisione [D10](../architecture/decisioni-da-prendere.md) **rimandata all'esito di D11** (2026-11-17), con queste indicazioni:
- candidato principale **BioCLIP**, limitato alla lista delle specie del catalogo, in **versione quantizzata** (compressa)
  per ridurre il peso; **Plants V1** solo come riferimento di velocità;
- download **solo alla prima apertura della fotocamera**, con un avviso sul peso;
- il popup mostra **nome comune o genere, mai la specie**.

Se BioCLIP risulta troppo pesante o lento sull'iPhone 16 (D11), si passa a un **modello nostro** piccolo.

## Limiti del piano gratuito
Non ci sono servizi né quote: il modello si scarica **una volta** e gira sul telefono. I "limiti" sono fisici:
spazio occupato, tempo del primo download, batteria e calore durante l'uso.

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì, tutti i candidati aperti | [1][4][8] |
| Uso commerciale consentito? | BioCLIP MIT: sì; Plants V1 Apache 2.0: sì; PlantCLEF CC BY 4.0: sì con attribuzione. Il nostro progetto è comunque non commerciale (D1) | [1][4][8] |
| Serve una chiave API? | No | — |
| Obblighi (attribuzione…) | Citare autori e licenza nella pagina "Informazioni" (F15); per BioCLIP i derivati restano open source (lo siamo già) | [1] |

## Come lo usiamo nel codice (adattatore)
```ts
// src/lib/recognition/LivePreviewClassifier.ts (da creare)
interface LivePreviewClassifier {
  load(onProgress?: (fraction: number) => void): Promise<void>; // scarica e prepara il modello (una volta)
  isSupported(): Promise<'webgpu' | 'wasm' | 'none'>;
  classify(frame: ImageBitmap): Promise<{ scientificName: string; score: number }[]>; // ordinati
}
// Implementazioni possibili: BioClipClassifier, AiyPlantsClassifier, OwnModelClassifier, NoopClassifier (nessun modello)
```

## Cosa succede se il modello non funziona
| Situazione | Cosa vede l'utente |
|---|---|
| Modello non ancora scaricato | Il mirino funziona; al posto del nome: "Anteprima non ancora pronta (download 45%)". Lo scatto con Pl@ntNet funziona normalmente |
| Telefono troppo vecchio o lento | L'anteprima si spegne da sola; restano i consigli di inquadratura. Spiegato nella Guida |
| Nessuna rete | L'anteprima funziona (il modello è sul telefono); lo scatto avvisa che il riconoscimento completo serve la rete |

## Alternative gratuite
Vedi la tabella dei candidati. Ripiego sempre disponibile: **nessun modello** (`NoopClassifier`), con soli consigli di
inquadratura (luce, messa a fuoco, distanza).

## Preparazione della prova D11 (2026-11-17)
Dettagli e istruzioni in [`tests/d11-anteprima-live/`](../../tests/d11-anteprima-live/README.md).
- **Versioni ONNX di BioCLIP già pubblicate** (tutte di terzi, tutte con licenza MIT dichiarata): nessuna contiene le
  nostre piante di casa. Una è per i funghi, una per i ragni, e un modello "studente" piccolo (24 MB) ne copre 9 su 24.
  Abbiamo usato solo la parte che analizza le immagini di **`m3r1al/naturalist-bioclip-v1`**: BioCLIP v1 ViT-B/16,
  **172,8 MB**, commit fissato `22a18d2`, file verificato con SHA-256. Il manifest dichiara un ingresso "float16", ma il
  file vuole **float32** (verificato).
- **Metodo:** invece di confrontare l'immagine con i *nomi* delle piante, che richiederebbe la parte "testo" del modello,
  non disponibile pronta e non convertibile qui senza Python, la confrontiamo con le **impronte medie di 6 foto di
  riferimento** per pianta (iNaturalist, licenze aperte, osservazioni diverse da quelle del test D9).
- **Risultati sul PC** (46 foto del test D9, mai usate come riferimento):
  - pianta giusta al 1° posto **88%**;
  - con soglie probabilità ≥ 60% e somiglianza ≥ 0,42: nome mostrato nel 93% dei casi, **giusto nel 90%**;
  - **0 trappole su 3** con un nome.
- **Prova nel browser del PC** (Edge, fotocamera finta): WebGPU attivo, caricamento 18 s, **~195 ms per analisi**. Il
  motore scaricato pesa 5,1 MB compresso (29,5 MB non compresso).
- **Peso:** 173 MB, sopra i 150 MB dei criteri di D11. Serve una versione quantizzata, da preparare e misurare (D10).
- **Strumenti aggiunti (solo per la prova, in `tests/d11-anteprima-live/tools`):**
  - `onnxruntime-web` 1.31.1 (MIT) e `sharp` 0.35.5 (Apache 2.0), gratuiti;
  - `onnxruntime-node` è stato scartato: sul PC (Node 26) si chiudeva con un errore grave. Usiamo `onnxruntime-web`
    anche sul PC, che è lo stesso motore del telefono.

## Rischi
| Rischio | Probabilità | Mitigazione |
|---|---|---|
| Nessun modello aperto riconosce bene le piante di casa | **Alta** (già verificato per 3 candidati) | BioCLIP con lista nostra; poi modello nostro |
| Download troppo pesante per un'app sul telefono | Media (BioCLIP) | Download facoltativo, solo in Wi-Fi, con avviso; versione compressa |
| Analisi troppo lenta o telefono che scalda | Media | D11 prima di sviluppare; frequenza adattiva; pausa automatica |
| Safari cancella il modello scaricato | Media | App installata sulla Home (D3); si riscarica in automatico |
| Anteprima sbagliata presa per vera | Media | Testo "Forse…", soglie, nessun salvataggio; il risultato vero è sempre Pl@ntNet |
| Il modello convertito da terzi sparisce o cambia | Media | Commit fissato e SHA-256; in futuro conversione nostra o copia ospitata da noi **(da verificare: limiti di dimensione dell'hosting)** |
| Il modello sceglie sempre una pianta del catalogo, anche davanti a un oggetto | Alta | Soglia di somiglianza (0,42 sul PC), da ritarare sul telefono con la prova D11 |

## Decisioni aperte
[D10](../architecture/decisioni-da-prendere.md) (quale modello) e [D11](../architecture/decisioni-da-prendere.md)
(prova pratica sull'iPhone 16).

## Fonti
1. Imageomics, "BioCLIP" (scheda del modello) — https://huggingface.co/imageomics/bioclip — consultato il 2026-11-17
2. Hugging Face API, elenco file di imageomics/bioclip e imageomics/bioclip-2 — https://huggingface.co/api/models/imageomics/bioclip — consultato il 2026-11-17
3. Imageomics, "BioCLIP 2" — https://huggingface.co/imageomics/bioclip-2 — consultato il 2026-11-17
4. Google, "aiy / vision-classifier-plants-v1" su Kaggle Models (licenza Apache 2.0, TFLite 5.056.146 byte, MobileNet V2) — https://www.kaggle.com/models/google/aiy — consultato il 2026-11-17 tramite l'API di Kaggle
5. Google, elenco specie di Plants V1 — https://www.gstatic.com/aihub/tfhub/labelmaps/aiy_plants_V1_labelmap.csv — consultato il 2026-11-17
6. Pl@ntNet, repository PlantNet-300K (licenza BSD-2-Clause) — https://github.com/plantnet/PlantNet-300K — consultato il 2026-11-17
7. litert-community, "PlantNet-300K-ResNet18-LiteRT" (elenco specie e file) — https://huggingface.co/litert-community/PlantNet-300K-ResNet18-LiteRT — consultato il 2026-11-17 (versione di terzi)
8. Pl@ntNet, "PlantCLEF 2024 pretrained models" (CC BY 4.0, 7.806 specie, 2,3 GB) — https://zenodo.org/records/10848263 — consultato il 2026-11-17
9. Seek by iNaturalist, pagina App Store (versione 2.17.1: da circa 20.000 a circa 80.000 specie) — https://apps.apple.com/app/seek-by-inaturalist/id1353224144 — consultato il 2026-11-17
10. iNaturalist, blog e forum sui modelli di visione (i modelli non vengono condivisi) — https://www.inaturalist.org/blog/99701 , https://forum.inaturalist.org/t/computer-vision-model-parameters-available/45408 — letti tramite risultati di ricerca il 2026-11-17 (pagine non accessibili direttamente) **(da verificare)**
11. Licenze dei repository: https://github.com/microsoft/onnxruntime/blob/main/LICENSE (MIT), https://github.com/tensorflow/tfjs/blob/master/LICENSE (Apache 2.0), https://github.com/huggingface/transformers.js/blob/main/LICENSE (Apache 2.0) — consultati il 2026-11-17
12. ONNX Runtime, "Web" (tutorial) — https://onnxruntime.ai/docs/tutorials/web/ — consultato il 2026-11-17
13. web.dev, "WebGPU is now supported in major browsers" — https://web.dev/blog/webgpu-supported-major-browsers ; WebKit Bugzilla 301627 — https://bugs.webkit.org/show_bug.cgi?id=301627 — letti tramite risultati di ricerca il 2026-11-17
