# Prova D11 — anteprima live sull'iPhone

> Creata il 2026-11-17 · Decisioni collegate: [D10 e D11](../../docs/architecture/decisioni-da-prendere.md) ·
> Scheda dei modelli: [modelli per l'anteprima live](../../docs/api-documentation/modelli-riconoscimento-live.md)

Questa cartella contiene una **pagina di prova minima**, non l'app. Serve a misurare sul telefono vero (iPhone 16,
iOS 26.5.2) se un modello di riconoscimento può girare nel browser abbastanza bene da fare l'anteprima live (F17).

## Cosa fa la pagina
1. Avvisa del peso del download e aspetta un tocco: è lo stesso comportamento previsto dall'app (D10).
2. Scarica il modello **BioCLIP v1** (173 MB) da Hugging Face, controlla che il file sia integro (impronta SHA-256) e lo
   conserva nella memoria del browser per le volte successive.
3. Prepara il motore **ONNX Runtime Web 1.31.1**: prova WebGPU (scheda grafica) e, se manca, WebAssembly (processore).
4. Apre la fotocamera posteriore e analizza il **quadrato centrale** circa 2 volte al secondo.
5. Confronta l'immagine con le **impronte** delle 22 piante del catalogo di prova e mostra il popup *"Forse: Pothos"* con
   le regole di F17 (soglie, stabilità, nessun cambio di nome a ogni movimento). Mostra il nome comune, mai la specie.
6. Misura: motore in uso, MB scaricati, tempo di caricamento, millisecondi per analisi, analisi al secondo e
   **rallentamento** nel tempo. Il calore non si può misurare dal browser: se il telefono si scalda, le analisi
   rallentano, e in più ci sono i pulsanti per annotare come lo senti.
7. Pulsante **"Copia i risultati"**: un riassunto da incollare in chat.

**Privacy:** le immagini della fotocamera **non lasciano il telefono**. Le uniche richieste di rete sono il motore
(da cdn.jsdelivr.net, con controllo di integrità SRI) e il modello (da huggingface.co, con controllo SHA-256).

## Come funziona il riconoscimento (in parole semplici)
BioCLIP trasforma un'immagine in un'**impronta**: 512 numeri che ne riassumono l'aspetto. Per ogni pianta del catalogo
abbiamo calcolato sul PC l'impronta media di **6 foto di riferimento** iNaturalist, con licenza aperta e autori citati in
[crediti-riferimenti.md](crediti-riferimenti.md). Il telefono calcola l'impronta dell'inquadratura e cerca la pianta più
simile. Così il modello resta "limitato al nostro catalogo", come chiede D10.

> Perché non i nomi delle piante? BioCLIP può anche confrontare un'immagine con dei *nomi*, ma per preparare i nomi
> servirebbe un'altra parte del modello che non esiste in formato pronto per il browser, e sul PC non c'è Python per
> convertirla. Le foto di riferimento sono un metodo equivalente e più semplice da controllare. Si potrà rivedere in D10.

## Risultati sul PC (2026-11-17)
Dettagli completi in [valutazione-pc.md](valutazione-pc.md). Foto di prova: le 46 del test D9, **mai usate come riferimento**.
- Pianta giusta al 1° posto: **38 su 43 (88%)**; fra le prime 3: 42 su 43.
- Con le soglie iniziali (probabilità ≥ 60% e somiglianza ≥ 0,42): nome mostrato per 40 foto vere su 43, giusto nel
  **90%** dei casi; **nessun nome** per le 3 trappole (tazza, foto sfocata, foglia secca).
- Errori tipici: la tua **monstera** scambiata per filodendro (sono parenti); un basilico scambiato per zamioculcas.
- Prova automatica completa nel browser Edge del PC, con fotocamera finta: WebGPU attivo, 172,8 MB di modello e
  5,1 MB di motore scaricati, caricamento in 18 s, **circa 195 ms per analisi**. La velocità sull'iPhone sarà diversa:
  è proprio ciò che misura D11.

⚠️ Limiti: 43 foto e 3 trappole sono poche; le foto iNaturalist sono più "facili" di un video dal vivo; il modello è
una **conversione fatta da terzi** (`m3r1al/naturalist-bioclip-v1`, licenza MIT dichiarata, file verificato con SHA-256).

## Cosa fare sull'iPhone (quando la pagina sarà online)
1. Collegati al **Wi-Fi** e apri il link in **Safari**.
2. Tocca "Scarica e avvia la fotocamera" e consenti la fotocamera.
3. Per circa **5 minuti** inquadra le piante di casa una alla volta, a 20-40 cm, con la pianta dentro il quadrato.
   Per ognuna scegli il nome vero in "Cosa stai inquadrando?" e premi **"Registra adesso"**.
4. Inquadra anche **una tazza** e **un muro**, scegliendo "Nessuna pianta": il popup non deve mostrare nomi.
5. Ogni 2 minuti tocca "Telefono freddo / tiepido / caldo".
6. Prova "**Prova con l'altro motore**" per un minuto, così confrontiamo WebGPU e WebAssembly.
7. Tocca "**Copia i risultati**" e incolla il testo in chat.

## Criteri di successo (da D11)
Analisi in meno di 500 ms · download sotto i 150 MB · mirino fluido · nome giusto in almeno 6 casi su 10 · **nessun nome
sbagliato mostrato** sulle trappole. Nota: il modello pesa 173 MB, **sopra** il limite di 150 MB. Una versione più
compressa (quantizzata) va preparata e misurata (D10).

## File
| File | Cosa contiene |
|---|---|
| `index.html`, `app.js` | La pagina di prova |
| `prototypes.json` | Impronte delle 22 piante + dati del modello (indirizzo fissato, SHA-256) |
| `crediti-riferimenti.md` | Autori, licenze e link delle 132 foto di riferimento |
| `valutazione-pc.md` | Risultati della prova sul PC |
| `tools/` | Script per il PC: `scarica-riferimenti.mjs`, `costruisci-impronte.mjs`, `server-locale.mjs`, `catalogo.mjs` |

## Rigenerare i dati sul PC
```bash
cd tests/d11-anteprima-live/tools
npm install
node scarica-riferimenti.mjs   # foto di riferimento in ~/test-piante (fuori dal repository)
node costruisci-impronte.mjs   # impronte + valutazione-pc.md (~2 minuti)
node server-locale.mjs                                                   # pagina su http://localhost:8011/
```
Le foto e il modello restano nella cartella `test-piante` dentro la cartella utente (fuori da git). Si può indicare
un'altra cartella come primo argomento degli script.

## Licenze e servizi usati
| Cosa | Licenza | Note |
|---|---|---|
| BioCLIP v1 (Imageomics) | MIT | Gli autori chiedono che i derivati restino open source |
| Conversione ONNX `m3r1al/naturalist-bioclip-v1` | MIT (dichiarata) | Di terzi; commit fissato `22a18d2`; il manifest dichiara ingresso float16 ma il file vuole float32 |
| ONNX Runtime Web 1.31.1 | MIT | Dal CDN jsDelivr, con controllo SRI |
| sharp 0.35.5 (solo sul PC) | Apache 2.0 | Ridimensiona le foto per le impronte |
| Foto di riferimento iNaturalist | CC BY / CC BY-NC | Citate in `crediti-riferimenti.md` |
