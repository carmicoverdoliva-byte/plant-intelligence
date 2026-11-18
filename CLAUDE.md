# CLAUDE.md — Regole del progetto "Mandragola"

Queste regole valgono per chiunque (persona o assistente AI) lavori su questo progetto.
La visione completa del prodotto è in `docs/requirements/visione-prodotto.md`.

## 1. Lingua e comunicazione
- Si scrive e si comunica **in italiano**: documentazione, messaggi di commit, testi dell'interfaccia, commenti nel codice.
  (Nomi di variabili, funzioni e file restano in inglese, come da convenzione.)
- L'utente è alle prime armi: **spiega sempre cosa stai facendo in italiano semplice**, prima e dopo ogni passaggio.
  Evita il gergo; se un termine tecnico è necessario, spiegalo in una frase.

## 2. Lavorare a piccoli passi
- Un passo alla volta: ogni modifica deve essere piccola, comprensibile e verificabile.
- Prima di iniziare un passo, dichiara cosa farai. Dopo, riassumi cosa è cambiato.
- Non fare modifiche non richieste o fuori dallo scopo del passo corrente.
- Commit frequenti, con messaggi in italiano chiari e descrittivi.

## 3. Verificare prima di dichiarare "fatto"
- Nessun passaggio è "fatto" finché non è stato **verificato** (build, test, lint, avvio dell'app o controllo manuale, a seconda del caso).
- Se una verifica fallisce, dillo chiaramente e mostra l'errore: non nascondere i problemi.
- Se un passaggio è stato saltato o non è stato possibile verificarlo, dillo esplicitamente.

## 4. Vincolo di gratuità
- **Tutto deve essere gratuito.** Nessuna funzione essenziale può dipendere da un servizio a pagamento.
- Si usano solo piani gratuiti, servizi open source o elaborazione locale.
- **Ogni servizio esterno deve essere sostituibile**: va usato tramite un'interfaccia/adattatore nel codice
  (es. `PlantRecognitionProvider`, `WeatherProvider`, `AiProvider`), così da poterlo cambiare senza riscrivere l'app.
- Se un servizio gratuito ha limiti (es. numero di richieste al giorno), l'app deve gestirli con messaggi chiari, senza rompersi.
- Prima di aggiungere una nuova dipendenza o un servizio, verifica licenza e costi e documentalo in `docs/api-documentation/`.

## 5. Regole sul reverse engineering (analisi dei concorrenti)
Benchmark: PictureThis (riconoscimento), Planta (cura), Pl@ntNet e Flora Incognita (rigore scientifico),
Seek di iNaturalist (riconoscimento live sul telefono).
- Si studia **solo il comportamento e le funzionalità osservabili** da un normale utente (flussi, schermate, scelte di UX, contenuti pubblici).
- **Vietato**: copiare o decompilare codice proprietario, riutilizzare asset (immagini, icone, testi, marchi),
  usare API private o non documentate, aggirare protezioni, paywall o limiti tecnici.
- Le analisi vanno scritte in `docs/competitor-analysis/` con parole nostre, citando le fonti pubbliche.

## 6. Requisito obbligatorio: onboarding e Guida
Ogni nuova funzione deve rispettare questo requisito:
- **Onboarding al primo avvio**: benvenuto, tutorial su come fotografare una pianta, spiegazione dei risultati
  (confidenza, alternative), richiesta dei permessi (fotocamera, posizione) **spiegando prima il motivo**.
- **Sezione "Guida" sempre raggiungibile dal menu**, con: tutorial singoli, FAQ, possibilità di ripetere il tutorial.
- **Breve spiegazione la prima volta che si entra in ogni sezione** (ignorabile e richiamabile).
- Una funzione nuova non è completa finché non ha la sua voce nella Guida (`docs/user-guide/` e in-app).

## 7. Sicurezza delle chiavi API
- Le chiavi API **non vanno mai scritte nel codice** né nei documenti né nei commit.
- Si salvano **solo in `.env.local`**, che è escluso da git tramite `.gitignore`.
- Si può versionare un file `.env.example` con i **nomi** delle variabili e valori finti.
- Le chiamate che usano chiavi segrete passano dal server (API route di Next.js), mai direttamente dal browser.
- Prima di ogni commit, controlla che nessun segreto sia stato aggiunto per errore.

## 8. Onestà dei risultati
- Il riconoscimento mostra specie, specie simili e livello di confidenza. **Se non è sicuro, mostra alternative invece di inventare.**
  - Il titolo del risultato è **nome comune + genere**; la specie è sempre introdotta da "probabilmente" (o "molto
    probabilmente" solo sopra le soglie tarate in D9). **Nessuna percentuale mostrata all'utente.**
  - Sotto la soglia minima l'app dice "Non riesco a riconoscerla" e dà consigli di scatto: non inventa un nome.
  - Lo stesso nome per la stessa pianta: i nomi passano dalla tabella dei sinonimi (fonte verificabile, es. GBIF).
- L'**anteprima live** è un "Forse…": mostra solo nome comune o genere, mai la specie; non viene mai salvata; vale sempre
  il riconoscimento completo.
- Le **schede di cura** (comprese "Coltivarla da zero" e "Travaso") citano fonti verificabili per ogni sezione, con testi
  nostri; senza scheda completa si usa il ripiego per famiglia o tipo di pianta, **dichiarato come tale**.
- L'esposizione al sole è una **stima**, non una misura: va sempre presentata come tale, con possibilità di calibrazione manuale.
- Il "botanico AI" deve dichiarare incertezza e non presentare ipotesi come fatti.

## 9. Stack tecnico previsto
- Next.js + React + TypeScript + Tailwind CSS, installabile come PWA, mobile-first.
- Riconoscimento a due livelli:
  - **completo**: Pl@ntNet API (piano gratuito), flora `k-world-flora` (D9);
  - **anteprima live** (D10, 2026-11-18): **BioCLIP v1 compresso int8** (87 MB) limitato al catalogo, scaricato da Hugging
    Face (`carmineverdoliva-byte/d11-bioclip-int8`) alla **versione bloccata** con controllo SHA-256; ONNX Runtime Web in un Web Worker
    (WebGPU, ripiego WebAssembly); piante "gemelle" mostrate come "Forse: X o Y".
  - **completo allo scatto**: Pl@ntNet (sopra). L'anteprima non si salva mai; vale sempre Pl@ntNet.
- Sinonimi botanici: tabella statica generata da GBIF Backbone Taxonomy (CC BY 4.0).
- Meteo: Open-Meteo. Sole: SunCalc.
- AI botanica: modello locale via Ollama quando possibile, provider configurabile.
- Telefono di prova dell'utente: **iPhone 16 con iOS 26.5.2** (WebGPU disponibile).

## 10. Struttura delle cartelle
- `docs/competitor-analysis/` — analisi dei benchmark
- `docs/requirements/` — requisiti e visione prodotto
- `docs/architecture/` — scelte architetturali
- `docs/api-documentation/` — servizi esterni usati, limiti, costi, alternative
- `docs/user-guide/` — contenuti della Guida per l'utente
- `docs/design/` — stile grafico (`stile-grafico.md`), schermate di riferimento (`riferimenti/`), icona master
- `src/` — codice dell'app (`src/components/` per i pezzi d'interfaccia riusabili) · `scripts/` — piccoli strumenti (es. `genera-icone.mjs`) · `public/` — file statici · `tests/` — test e pagine di prova (es. `tests/d11-anteprima-live/`)
- Foto di prova, modelli scaricati e risposte grezze dei servizi restano **fuori dal repository**
  (es. la cartella `test-piante` nella cartella utente), non su cartelle sincronizzate nel cloud.
- `.claude/skills/`, `.claude/agents/` — configurazioni per Claude Code

## 11. Stile grafico (nome dell'app: **Mandragola**)
- Le regole grafiche sono in **`docs/design/stile-grafico.md`** ("Serra di vetro": sfondo chiaro con aloni, vetro
  smerigliato con ripiego, verde principale, viola solo per la "magia", Nunito, forme tonde, icone Lucide tratto 2,6,
  target 44 px, contrasto 4,5:1). Le schermate approvate sono in `docs/design/riferimenti/`.
- **Ogni schermata o modifica visiva passa dalla skill `plant-ui`** (`.claude/skills/plant-ui/SKILL.md`): si leggono
  regole e riferimenti prima, si confronta il risultato con i riferimenti dopo.
- Colori, raggi e carattere sono token in `src/app/globals.css`: niente colori scritti a mano nelle pagine.
- Le icone dell'app si rigenerano dall'icona master con `node scripts/genera-icone.mjs`.
