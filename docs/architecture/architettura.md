# Architettura — Plant Intelligence

> Ultimo aggiornamento: 2026-11-18 · Collegati: [specifiche funzionali](../requirements/specifiche-funzionali.md),
> [decisioni da prendere](decisioni-da-prendere.md), schede [Pl@ntNet](../api-documentation/plantnet-api.md),
> [Open-Meteo](../api-documentation/open-meteo.md), [SunCalc](../api-documentation/suncalc.md)

Questo documento spiega **come è fatta l'app**: quali pezzi la compongono, dove girano, come si parlano e dove finiscono i dati.
Le decisioni D1-D9 sono state **approvate il 2026-11-16** (vedi [decisioni](decisioni-da-prendere.md)). Restano da
verificare i termini di Vercel (D2) e da fare il test delle foto (D9).

## 0. Il quadro generale

L'app ha **due parti**:
- il **client**, cioè l'app che gira sul telefono dentro Safari (PWA). Qui sta quasi tutto: schermate, collezione, promemoria,
  calcolo del sole, chiamate al meteo;
- il **server**, piccolo, che fa **una cosa sola nella v1**: parlare con Pl@ntNet usando la chiave segreta e contare le
  identificazioni.

```text
┌──────────────────────── iPhone (Safari / app installata sulla Home) ────────────────────────┐
│                                                                                             │
│  Schermate (Next.js + React + Tailwind)                                                     │
│     │                                                                                       │
│     ├── LivePreviewClassifier ── modello locale, niente rete (anteprima live, §1b)         │
│     ├── PlantRecognitionProvider ──── foto ridotte ────────────────┐                        │
│     ├── WeatherProvider (Open-Meteo) ── lat/lon arrotondate ──┐     │                        │
│     ├── SunProvider (SunCalc) ── calcolo locale, niente rete  │     │                        │
│     ├── AiProvider (v1: assistente a regole, niente AI)       │     │                        │
│     └── StorageProvider ──> IndexedDB (database del browser)  │     │                        │
│                              piante, foto, promemoria         │     │                        │
└───────────────────────────────────────────────────────────────┼─────┼────────────────────────┘
                                                                │     │
                                                                v     v
                                               [Open-Meteo]   [Server Next.js, es. Vercel]
                                              (nessuna chiave)   /api/identify
                                                                   │  chiave segreta PLANTNET_API_KEY
                                                                   │  contatore ──> [Upstash Redis]
                                                                   v
                                                               [Pl@ntNet API]
```

> **Client / server**: il client è il programma che usa la persona (qui l'app sul telefono); il server è un computer su
> internet che risponde alle richieste del client.
> **IndexedDB**: un piccolo database che ogni browser mette a disposizione dei siti, salvato sul telefono.

## 1. La chiave di Pl@ntNet non arriva mai al telefono

**Problema.** Tutto il codice che arriva al telefono si può leggere, anche se è "nascosto". Se ci mettessimo la chiave,
chiunque potrebbe copiarla e consumare le nostre 500 identificazioni al giorno (CLAUDE.md §7).

**Soluzione: un server intermedio** (una "API route" di Next.js, cioè una funzione che gira sul server e risponde a un
indirizzo come `/api/identify`).

```text
1. Telefono  ──POST /api/identify (foto ridotte + parti fotografate + ID anonimo del dispositivo)──>  Server
2. Server    controlla le quote (§4)
3. Server    ──POST https://my-api.plantnet.org/v2/identify/k-world-flora?api-key=SEGRETA&lang=it──>  Pl@ntNet  (flora scelta in D9)
4. Pl@ntNet  ──lista di specie con punteggi + richieste rimaste──>  Server
5. Server    aggiorna i contatori e traduce la risposta nel nostro formato: nomi uniformati con la tabella dei
             sinonimi, livello di sicurezza calcolato con le soglie di D9 (le percentuali non arrivano all'utente)
6. Server    ──risultato (senza chiave, senza dati interni)──>  Telefono
```

- La chiave sta **solo** nelle variabili d'ambiente del server (in locale nel file `.env.local`, online nelle impostazioni
  dell'hosting). Nel repository c'è solo `.env.example` con il **nome** `PLANTNET_API_KEY` e un valore finto.
- Pl@ntNet permette anche di "esporre" la chiave nel browser limitandola a certi domini [1], ma **non lo facciamo**: un
  dominio si può falsificare fuori dal browser, e non potremmo contare le quote per dispositivo.
- Il server **non salva le foto**: le inoltra e le dimentica.

**Dimensione delle foto.** Il telefono riduce ogni foto (lato corto 1280 pixel, JPEG 90%), che pesa così circa 0,3-0,6 MB.
Anche 5 foto restano sotto il limite di dimensione delle funzioni dell'hosting (su Vercel circa 4,5 MB **(da verificare)**).

### Hosting gratuito (deciso: Vercel Hobby, D2)
| Opzione | Gratis | Limiti principali (piano gratuito) | Pro | Contro |
|---|---|---|---|---|
| **Vercel Hobby** (scelto, se i termini lo confermano) | Sì | 1.000.000 di esecuzioni di funzioni al mese, 4 ore di CPU, 100 GB di traffico, funzioni fino a 5 minuti; superati i limiti, la funzione si ferma fino a 30 giorni [2][3] | Creato da chi sviluppa Next.js: configurazione quasi nulla | Il piano Hobby è storicamente riservato a **uso personale non commerciale**: la pagina consultata non lo dice, **da verificare nei termini** [3] |
| **Cloudflare Workers** | Sì | 100.000 richieste al giorno, 10 ms di CPU per richiesta [4] | Limiti generosi; database D1 incluso | Next.js richiede un adattatore (OpenNext) **(da verificare)**; più passaggi di configurazione |
| **Netlify** | Sì | **(da verificare)** | Supporta Next.js | Limiti da verificare |

Con circa 500 identificazioni al giorno siamo **molto lontani** dai limiti di tutti e tre. Il codice del server resta
piccolo e standard, quindi si può spostare da un hosting all'altro. Decisione [D2](decisioni-da-prendere.md).

## 1b. Riconoscimento a due livelli

> Aggiunto il 2026-11-17 (nuovo requisito). **Cambia** una scelta precedente: il riconoscimento non passa più solo da
> Pl@ntNet. Pl@ntNet resta il riconoscimento **completo**; si aggiunge un'**anteprima live** sul telefono.

**L'idea.** Mentre l'utente inquadra una pianta, un **modello che gira nel browser** (sul telefono, senza internet e senza
limiti) propone un nome probabile in un piccolo popup: *"Forse: Pothos"*. Se l'utente vuole saperne di più, **scatta**:
parte il riconoscimento completo con Pl@ntNet, con alternative e confidenza (F04).

```text
┌──────────────────────────── iPhone ────────────────────────────┐
│  Fotocamera (getUserMedia) ──fotogrammi──┐                      │
│                                          v                      │
│                         LivePreviewClassifier (modello locale)  │   Livello 1: ANTEPRIMA
│                         ritmo adattivo (~1,6/s), niente rete    │   gratis, senza limiti,
│                                          │                      │   anche offline
│                                          v                      │
│                         Regole del popup (soglia, stabilità)    │
│                                          │                      │
│                                          v                      │
│                      popup "Forse: Pothos" ── tocco o scatto ──┐│
└────────────────────────────────────────────────────────────────┼┘
                                                                 v
                                   /api/identify ──> Pl@ntNet           Livello 2: COMPLETO
                                   (quota giornaliera, §4)              specie + alternative
```

**Regole di base.**
- I fotogrammi del livello 1 **non lasciano mai il telefono**: nessun invio, nessun salvataggio.
- Il livello 1 **non consuma** riconoscimenti Pl@ntNet.
- Il nome dell'anteprima **non viene mai salvato** come identificazione: in collezione finisce solo il risultato del
  livello 2 (o la scelta manuale dell'utente).
- Se il riconoscimento completo dice una cosa diversa dall'anteprima, vale il riconoscimento completo (CLAUDE.md §8).

**Il modello locale.** Si scarica **una volta** e resta nella cache dell'app, gestita dal service worker (il pezzo
della PWA che lavora in sottofondo e conserva i file per l'uso offline). Il download è **facoltativo** e viene proposto
**alla prima apertura della fotocamera**, con un avviso sul peso e il consiglio di usare il Wi-Fi (D10). Senza modello
l'app funziona lo stesso. **Modello scelto (D10, 2026-11-18): BioCLIP v1 compresso int8** (87,3 MB), cioè con i numeri
salvati con meno cifre per ridurre il peso. Si scarica da Hugging Face (`carmineverdoliva-byte/d11-bioclip-int8`) alla **versione bloccata**
`ca03b3a`, e il telefono ne controlla l'impronta SHA-256 prima di usarlo. Il modello confronta
l'immagine con le "impronte" (embedding) delle piante del catalogo, calcolate da foto di riferimento con licenza aperta.
Tutto il lavoro pesante gira in un **Web Worker** (un "lavoratore" separato dalla pagina), così il mirino non si blocca.

**Cosa mostra il popup:** **nome comune o genere, mai la specie** (D10), coerente con D9: il genere è affidabile, la
specie no. Il modello gira con **ONNX Runtime Web**
(licenza MIT), su WebGPU se disponibile, altrimenti su WebAssembly. Quale modello usare è la decisione
[D10](decisioni-da-prendere.md); prima di sviluppare l'interfaccia lo proviamo sull'iPhone dell'utente
([D11](decisioni-da-prendere.md)). Confronto dei candidati: [modelli per l'anteprima live](../api-documentation/modelli-riconoscimento-live.md).

**Ripiego.** Se il telefono non regge il modello, o se il modello non è scaricato, il mirino mostra solo **consigli di
inquadratura** calcolati in modo semplice (troppo buio, mossa, troppo lontano), senza nomi. Implementazione
`NoopClassifier` dello stesso adattatore.

**Regole del popup** (dettaglio in [specifiche F17](../requirements/specifiche-funzionali.md#f17--anteprima-live-nel-mirino)).
Tutti i numeri sono **valori di configurazione** (in un unico file, `src/config/livePreview.ts`), non sparsi nel codice,
e sono stati provati con D11 (aggiornati il 2026-11-18 dopo la prova sull'iPhone):

| Regola | Valore | Perché |
|---|---|---|
| Ritmo delle analisi | **adattivo**: pausa lunga quanto l'ultima analisi (minimo 150 ms), cioè modello al lavoro al massimo **metà del tempo**; se le ultime 20 analisi sono il 25% più lente delle prime 20 (telefono caldo), al massimo **un terzo**. Una nuova analisi parte solo quando la precedente è finita | Sull'iPhone 16 un'analisi dura ~0,3 s: con la pausa fissa di 500 ms si arrivava solo a ~1,2 analisi al secondo. Atteso ~1,6, **da misurare** insieme al calore |
| Area analizzata | quadrato centrale del mirino, ridotto alla dimensione richiesta dal modello | L'utente sa cosa sta "guardando" l'app |
| Media mobile | punteggi mediati sulle analisi degli **ultimi 2 secondi** | Un fotogramma mosso non cambia il risultato |
| Soglia per mostrare un nome | somiglianza ≥ **0,42** e probabilità media ≥ **30%** con scala **30**, distacco dal 2° nome ≥ **0,15** (tarate sul PC) | Sotto: nessun nome, solo "Sto guardando…" o un consiglio |
| Piante gemelle | se i primi due nomi sono dello **stesso gruppo** (es. Pothos/Filodendro/Monstera) e distano meno di 0,15, insieme valgono almeno il 30% e staccano il 3° nome di 0,15 → **"Forse: X o Y – scatta per saperlo"**. Gruppi nel catalogo (`twinGroups`) | Meglio una coppia onesta che un nome tirato a sorte |
| Comparsa | stesso nome (o stessa coppia) in testa per **1 secondo** e almeno **2** analisi | Niente nomi lampo; non dipende dalla velocità del telefono |
| Cambio di nome | il nuovo nome deve restare in testa per **2 secondi** (almeno 3 analisi) **e** superare il vecchio di **0,10**; se il nuovo nome "affina" il vecchio ("X o Y" → "X") basta la stabilità | Il popup non "balla" a ogni movimento |
| Scomparsa | probabilità media sotto i **3/4 della soglia** di comparsa (oggi 0,22) per 2 secondi → il popup sfuma in "Sto guardando…" | Meglio nessun nome che un nome sbagliato |
| Pausa | app in background, schermo spento o mirino chiuso → analisi ferme | Batteria |

**Privacy e permessi.** La fotocamera si chiede con la spiegazione già prevista (F01). Nessun nuovo dato esce dal telefono.

## 2. Il botanico AI: Ollama gira sul PC, non sull'iPhone

**Il problema, detto semplice.** Ollama è un programma che fa girare un modello di intelligenza artificiale **sul tuo PC**.
L'app pubblicata online è invece usata dal telefono, da qualsiasi luogo. Ci sono tre ostacoli:
1. un server gratuito come Vercel **non può far girare Ollama** (servono molta memoria e potenza di calcolo);
2. il telefono **non raggiunge il tuo PC** quando sei fuori casa;
3. anche a casa, sulla stessa rete Wi-Fi, un'app pubblicata con indirizzo sicuro (`https://`) **non può chiamare** un indirizzo
   non sicuro come `http://192.168.1.10:11434`: il browser blocca il "contenuto misto".

**Cosa abbiamo verificato sulle alternative online gratuite.**
- **Google Gemini, piano gratuito: escluso.** I termini in vigore dal 23 marzo 2026 dicono che le app rese disponibili a
  utenti dell'Unione Europea devono usare **solo servizi a pagamento**. Inoltre l'uso è vietato ad app accessibili a
  minori di 18 anni, e i contenuti inviati gratis possono essere letti da revisori e usati per addestrare i modelli [5].
- Altri servizi con piani gratuiti (es. Groq, OpenRouter, Hugging Face): termini, limiti e regole per l'UE **(da verificare)**.
  In ogni caso i piani gratuiti cambiano spesso, e una funzione essenziale non può dipendere da loro (CLAUDE.md §4).
- Modello AI **dentro il browser** dell'iPhone (es. WebLLM): scaricherebbe centinaia di MB o più e richiede un telefono
  recente **(da verificare)**.

**Deciso (D6): tre livelli, tutti dietro lo stesso adattatore `AiProvider`.**

```text
                      ┌─────────────── AiProvider ───────────────┐
                      │                                           │
   v1 (tutti) ──> RuleBasedAssistant          v2 (chi lo configura) ──> OllamaProvider
                  niente AI: risposte          il TUO PC con Ollama, raggiunto con un
                  da schede di cura, FAQ       "tunnel" https gratuito (es. Cloudflare Tunnel)
                  e domande guidate            funziona solo quando il PC è acceso
                      │
                      └── futuro: un provider online gratuito, se ne troveremo uno con termini adatti all'UE
```

- **v1 — assistente a regole (senza AI), per tutti.** Non è una chat libera: l'utente sceglie tra domande guidate ("Perché
  le foglie ingialliscono?", "Quanta luce serve?") e l'app risponde usando le schede di cura, la stima del sole, il meteo e
  le FAQ. Gratuito, funziona offline, **non inventa nulla** (CLAUDE.md §8).
- **v2 — Ollama personale.** Nelle impostazioni, chi ha Ollama sul proprio PC può inserire l'indirizzo `https` di un tunnel
  verso il PC (Cloudflare Tunnel ha un piano gratuito **(da verificare)**). La chat AI funziona finché il PC è acceso. Per
  chi sviluppa, durante i test l'app gira sul PC stesso e Ollama si raggiunge direttamente.
- **Sempre:** le risposte AI sono etichettate "Risposta generata da AI, può contenere errori", e il prompt (le istruzioni
  date al modello) chiede di dichiarare l'incertezza.

Decisione [D6](decisioni-da-prendere.md).

## 3. Dove salviamo i dati dell'utente

**Deciso per la v1 (D3): tutto sul telefono, nessun account, nessun dato personale sul server.**

| Dove | Cosa | Perché |
|---|---|---|
| **IndexedDB sul telefono** | Piante, foto ridotte, identificazioni, finestre, promemoria, impostazioni | Gratis, veloce, funziona offline, privacy massima |
| **File di backup** (esporta/importa) | Copia completa della collezione | Protegge da cancellazioni e cambio telefono (F14) |
| **Cache del service worker** | Modello dell'anteprima live (§1b), se l'utente lo scarica | Funziona offline; se Safari lo cancella si riscarica. Non va nel backup |
| **Server (Upstash Redis)** | **Solo contatori** anonimi delle identificazioni, cancellati dopo 48 ore | Necessari per il limite di 500 al giorno (§4) |

**Come iPhone conserva i dati.** Safari cancella i dati salvati dai siti dopo **7 giorni senza visite**, ma le web app
**installate sulla schermata Home** sono esentate da questa regola [6]. Per questo:
- l'onboarding **guida passo per passo** all'installazione sulla Home (Condividi → "Aggiungi a Home"), spiegando con
  parole semplici che senza installazione Safari può cancellare i dati dopo un periodo senza visite (F01, F16);
- l'onboarding **propone subito il backup su file** e spiega dove salvarlo, es. iCloud Drive (F14);
- se l'app si accorge di essere aperta in Safari e non dalla Home, mostra un promemoria discreto per installarla;
- l'app chiede al browser di rendere i dati "persistenti" (`navigator.storage.persist()`) [6];
- il backup su file resta comunque consigliato. Le fonti di WebKit sono del 2019-2023 e Safari 26 ha reso più severe
  alcune regole sui dati salvati dai siti: **da riverificare** quando l'app sarà installabile [6].

**Foto:** due versioni per ogni foto, una miniatura (circa 400 pixel) per gli elenchi e una media (1280 pixel) per la scheda.
Le foto originali non vengono conservate, così risparmiamo spazio.

**In futuro (v2): sincronizzazione online facoltativa.** Opzione gratuita: **Supabase** (database 500 MB, file 1 GB, 50.000
utenti al mese). Attenzione: il progetto **si mette in pausa dopo 7 giorni senza attività** e i backup automatici non sono
inclusi [7]. 1 GB di file vale circa 2.000-3.000 foto in tutto: per molti utenti non basterebbe. Da rivalutare in v2
([D3](decisioni-da-prendere.md)).

## 4. Il limite di 500 identificazioni al giorno

**Regole di Pl@ntNet** [8]: 500 identificazioni al giorno, azzerate a mezzanotte UTC (01:00 italiane d'inverno, 02:00 d'estate).
Oltre il limite il servizio risponde con l'errore 429. **Ogni risposta riporta quante richieste restano**
(`remainingIdentificationRequests`) [1].

**Dove contiamo.** Le funzioni del server non hanno memoria tra una richiesta e l'altra, quindi serve un piccolo
archivio esterno. Deciso (D4): **Upstash Redis** (piano gratuito: 500.000 comandi al mese, 256 MB, senza carta di credito) [9].
Ogni identificazione usa circa 4 comandi: 500 al giorno × 30 giorni × 4 = **60.000 comandi al mese**, ben dentro il limite.

> **Redis**: un archivio molto veloce di coppie "nome → valore", ideale per i contatori.

**Tre contatori.** I limiti **non sono scritti nel codice**: si leggono da variabili d'ambiente del server (in locale in
`.env.local`, online nelle impostazioni dell'hosting), con un valore predefinito se mancano. Così si possono cambiare
senza modificare il programma (decisione [D5](decisioni-da-prendere.md)).

| Contatore | Chiave (esempio) | Variabile d'ambiente | Valore predefinito | Scade |
|---|---|---|---|---|
| Totale del giorno | `id:2026-11-16` | `QUOTA_TOTAL_PER_DAY` | **480** (20 di riserva per i test e gli imprevisti) | 48 ore |
| Per dispositivo | `dev:<impronta>:2026-11-16` | `QUOTA_PER_DEVICE_PER_DAY` | **10** | 48 ore |
| Per rete (IP) | `ip:<impronta>:2026-11-16` | `QUOTA_PER_IP_PER_DAY` | **30** (contro chi reinstalla l'app per avere nuovi riconoscimenti) | 48 ore |

Il server legge e controlla questi valori in **un solo punto** del codice (un piccolo modulo di configurazione): se un
valore è assente o non valido usa quello predefinito. Il telefono **non conosce** il limite in anticipo: è il server a
dirgli, in ogni risposta, quanti riconoscimenti restano ("Oggi ti restano N"). I messaggi usano sempre il numero vero,
mai un "10" fisso.

L'**ID del dispositivo** è un codice casuale creato dall'app al primo avvio. Non contiene dati personali. Il server conserva
solo un'**impronta** (hash) di ID e IP: un codice da cui non si può risalire all'originale.

**Il flusso:**
```text
richiesta ──> il totale di oggi è sotto 480? ── no ──> "Riconoscimenti di oggi esauriti, riprova dopo le 01:00"
                 │ sì
                 v
              il dispositivo e la rete sono sotto la loro quota? ── no ──> "Hai usato i tuoi N riconoscimenti di oggi"
                 │ sì
                 v
              prenota +1 su tutti i contatori (operazione "atomica": due richieste contemporanee non si sovrappongono)
                 │
                 v
              chiama Pl@ntNet ──> 200 ok: salva "rimaste" dalla risposta, che è il dato più affidabile
                              ──> 429: segna "esaurito fino a mezzanotte UTC"
                              ──> errore di rete: restituisce la prenotazione (-1)
```

**Altre accortezze:**
- **Una richiesta = un'identificazione**, anche con 5 foto della stessa pianta **(da verificare** con un test, perché la
  documentazione parla di "identification requests"). Il riconoscimento guidato (F05) consuma quindi un riconoscimento in più.
- Se l'utente reinvia **la stessa foto**, il telefono riusa il risultato salvato senza chiamare il server.
- Il telefono mostra sempre "Oggi ti restano N riconoscimenti".
- Se il servizio dei contatori non risponde, il server **fa passare** la richiesta usando solo il dato "rimaste" di
  Pl@ntNet, così l'app non si blocca.

## 5. Schema dei dati

Tipi TypeScript (indicativi) salvati in IndexedDB sul telefono. `?` significa facoltativo.

```text
Plant (pianta) 1 ──── * Photo (foto)
  │  1                          * ──── 1 Identification (riconoscimento) 1 ──── * Candidate (specie possibile)
  │  1 ──── * Reminder (promemoria)
  │  * ──── 1 Spot (posizione in casa) * ──── 1 Window (finestra)
  └─ speciesId ──> Species (catalogo specie e schede di cura, sola lettura, fornito con l'app)
                      * ──── 1 CareGroup (consigli generici per famiglia/tipo: il ripiego, D8)
```

**Regole sulle schede di cura (D8):**
- ogni `care` (scheda completa) e ogni `CareGroup` (consigli generici) ha **almeno una fonte verificabile** in `sources`,
  mostrata nella scheda. Un test automatico controllerà che nessuna scheda sia senza fonti;
- i testi sono scritti con parole nostre, mai copiati dai concorrenti;
- **come si sceglie cosa mostrare:**
  1. la specie è nel catalogo e ha `care` → scheda completa;
  2. altrimenti, la famiglia (o il tipo) corrisponde a un `CareGroup` → consigli generici + messaggio *"La scheda completa
     per questa pianta non è ancora disponibile. Questi sono consigli generici per il suo gruppo."*;
  3. altrimenti → solo il messaggio che la scheda non è disponibile, con consigli di base dichiarati come tali.
  La famiglia arriva anche da Pl@ntNet (`family`), quindi il ripiego funziona pure per specie fuori dal catalogo.
- **Sezioni "Coltivarla da zero" e "Travaso"** (aggiunte il 2026-11-17, F18): stanno dentro `care` (scheda completa) e
  dentro `CareGroup` (ripiego). **Ogni sezione ha le sue fonti** (`sources`), così si vede da dove viene ogni consiglio.
  Esempio completo: [scheda del pothos](../requirements/esempio-scheda-pothos.md).
- **Stagione e meteo:** i periodi consigliati sono salvati come **stagioni** (`'spring'`, `'summer'`…), non come mesi.
  Una piccola funzione (`seasonToMonths`) li traduce in mesi in base all'emisfero, ricavato dalla latitudine
  (in Italia: primavera = marzo-maggio). Per le piante all'aperto, `WeatherProvider` controlla gelo o caldo previsti
  nei 7 giorni successivi e, se serve, l'app consiglia di rimandare. Nessun nuovo servizio esterno.
- **Sezioni "Falsi miti" e "Approfondimenti"** (aggiunte il 2026-11-18, F21 e F22): stanno in `care.myths` e
  `care.furtherReading` (e negli stessi campi di `CareGroup`).
  - Un mito ha un **verdetto** a quattro livelli e **fonti dello stesso tipo del resto della scheda**: studi, università,
    orti botanici. Mai un blog.
  - I miti validi per tutte le piante in vaso (es. la ghiaia sul fondo) hanno `scope: 'all-potted-plants'`: si scrivono
    una volta e compaiono in tutte le schede e nei gruppi.
  - Un articolo consigliato salva solo **titolo, sito, una riga nostra, link e data del controllo**: nessun testo,
    immagine o logo del sito. Criterio di scelta in [fonti editoriali](../api-documentation/fonti-editoriali.md).
  - Tutto è statico, dentro la scheda: **nessun nuovo servizio esterno nella v1**.

```ts
type ID = string;              // codice univoco casuale (UUID)
type ISODate = string;         // data e ora, es. "2026-11-16T10:30:00Z"

interface Plant {
  id: ID;
  nickname: string;            // "Pothos della cucina"
  speciesId?: ID;              // vuoto se la specie non è ancora confermata
  speciesConfirmedBy: 'user' | 'identification' | 'none';
  spotId?: ID;                 // dove si trova
  indoor: boolean;             // in casa o all'aperto (cambia meteo e avvisi)
  potDiameterCm?: number;
  lastRepottedAt?: ISODate;    // data dell'ultimo travaso, inserita dall'utente (F18)
  acquiredAt?: ISODate;
  newPlantPlan?: {              // piano delle prime settimane (F19), creato dalla funzione "Nuova pianta"
    startedAt: ISODate;
    steps: { kind: 'isolate' | 'inspect' | 'first-water-check' | 'no-repot-yet' | 'first-fertilize' | 'end-isolation';
             dueAt: ISODate; reminderId?: ID; sources: Source[] }[];  // nessun passo senza fonte
  };
  notes?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

interface Photo {
  id: ID;
  plantId?: ID;                // vuoto se la foto è solo di un tentativo di riconoscimento
  organ: 'leaf' | 'flower' | 'fruit' | 'bark' | 'auto';
  thumbnail: Blob;             // ~400 px
  medium: Blob;                // ~1280 px, senza dati EXIF (posizione, modello telefono)
  sha256: string;              // impronta: evita di inviare due volte la stessa foto
  takenAt: ISODate;
}

interface Identification {
  id: ID;
  photoIds: ID[];              // 1-5 foto della stessa pianta
  provider: 'plantnet';        // quale servizio ha risposto
  project: string;             // flora usata: "k-world-flora" (D9)
  modelVersion?: string;       // versione del modello di Pl@ntNet
  status: 'ok' | 'not-a-plant' | 'quota-exceeded' | 'error';
  candidates: Candidate[];     // ordinati dal più probabile
  chosenCandidateIndex?: number;  // cosa ha scelto l'utente; -1 = "nessuna di queste"
  createdAt: ISODate;
}

interface Candidate {
  scientificName: string;      // "Epipremnum aureum"
  commonNames: string[];       // in italiano se disponibili
  family?: string;
  genus?: string;
  acceptedName: string;        // nome uniformato con la tabella dei sinonimi (D9)
  score: number;               // 0-1, come restituito da Pl@ntNet: usato per i calcoli, MAI mostrato all'utente
  // Livello del risultato, calcolato sul 1° candidato con le soglie di D9 (src/config/recognition.ts):
  // 'not-recognized' (404, oppure s1 < 0,10 e s1 < 5 × s2) · 'uncertain' (s1 < 0,30)
  // · 'probable' (s1 ≥ 0,30) · 'very-probable' (s1 ≥ 0,80 e s1 − s2 ≥ 0,75)
  confidenceLevel: 'not-recognized' | 'uncertain' | 'probable' | 'very-probable';
  gbifId?: number;             // collegamento alla banca dati GBIF
  speciesId?: ID;              // collegamento al nostro catalogo, se la specie c'è
}

interface Reminder {
  id: ID;
  plantId: ID;
  kind: 'water' | 'fertilize' | 'repot' | 'propagate' | 'check' | 'inspect' | 'end-isolation';
  // 'inspect' ed 'end-isolation' nascono dal piano delle prime settimane (F19)
  // 'repot' e 'propagate' sono facoltativi (pulsante "Ricordamelo", F18) e cadono nel periodo consigliato
  season?: Season;             // periodo consigliato a cui è legato il promemoria
  baseIntervalDays: number;    // dalla scheda di cura
  adjustedIntervalDays: number;// corretto per stagione, luce stimata e meteo
  adjustmentReason?: string;   // "più caldo del solito: anticipato di 1 giorno"
  nextDueAt: ISODate;
  lastDoneAt?: ISODate;
  history: { doneAt: ISODate; action: 'done' | 'snoozed' }[];
  enabled: boolean;
}

interface Room {                // stanza di casa (F19): inserita una volta, riusata per tutte le piante
  id: ID;
  name: string;                // "Soggiorno"
}

interface Window {
  id: ID;
  roomId?: ID;                 // stanza in cui si trova (F19)
  name: string;                // "Finestra soggiorno"
  azimuthDeg: number;          // direzione verso cui guarda: 0 = Nord, 90 = Est, 180 = Sud (convenzione SunCalc v2)
  azimuthSource: 'compass' | 'manual';
  floor?: number;              // piano dell'edificio
  obstructions: ('building' | 'tree' | 'balcony' | 'curtain')[];
  location: { lat: number; lon: number; source: 'gps' | 'city' };  // arrotondata a circa 1 km
}

interface Spot {                // dove sta la pianta rispetto alla finestra
  id: ID;
  name: string;                // "Mensola vicino al divano"
  windowId?: ID;               // vuoto = nessuna finestra vicina
  distanceFromWindowM?: number;
  estimate?: {                 // risultato del calcolo: è una STIMA
    directSunHours: number;
    sunWindow?: { from: string; to: string };  // "10:00"-"13:00"
    computedAt: ISODate;
    usedWeather: boolean;
  };
  calibration?: {              // correzione manuale: prevale sulla stima
    directSunHours?: number;
    sunWindow?: { from: string; to: string };
    note?: string;
    updatedAt: ISODate;
  };
}

interface Species {             // catalogo fornito con l'app (sola lettura)
  id: ID;
  scientificName: string;
  commonNames: string[];
  family: string;
  careGroupId?: ID;            // gruppo per i consigli generici, se manca la scheda completa
  care?: {                     // presente solo per le specie con scheda di cura scritta da noi
    light: { minSunHours: number; maxSunHours: number; note: string };
    water: WaterGuide;               // quando E quanto (F08, 2026-11-18)
    temperatureC: TemperatureGuide;  // minima, ideale, massima
    soil: string;
    fertilizer: FertilizerGuide;     // tipo preciso, diluizione, frequenza, periodo
    commonProblems: CommonProblem[]; // "Problemi più comuni" (F20)
    repotEveryYears?: number;
    propagation: PropagationGuide;   // "Coltivarla da zero" (F18)
    repotting: RepottingGuide;       // "Travaso" (F18)
    myths: MythCheck[];              // "Falsi miti" (F21): almeno uno, anche solo quelli 'all-potted-plants'
    furtherReading: FurtherReading[]; // "Approfondimenti" (F22): può essere vuoto, e l'app lo dice
  };
  toxicity?: { pets: 'toxic' | 'non-toxic' | 'unknown'; children: 'toxic' | 'non-toxic' | 'unknown'; source: string };
  sources: Source[];           // obbligatorie (almeno una) se c'è `care`
}

interface Source {              // fonte verificabile, mostrata nella scheda
  title: string;               // es. "Royal Horticultural Society — Pothos"
  url: string;
  accessedAt: string;          // data di consultazione, es. "2026-11-16"
}

interface WaterGuide {           // F08: quando e quanto annaffiare
  when: string;                // "quando il terriccio in superficie è asciutto: prova con un dito"
  howMuch: string[];           // passi pratici: "finché l'acqua esce dai fori", "svuota il sottovaso entro un'ora"
  intervalDays?: { summer?: number; winter?: number };  // solo se una fonte lo indica; base dei promemoria
  seasonNotes: string[];       // come cambia con la stagione
  potNotes: string[];          // come cambia con dimensione e materiale del vaso
  sources: Source[];
}

interface TemperatureGuide {     // °C; un valore manca se nessuna fonte lo indica ("non indicata dalle fonti")
  min?: number;
  ideal: { min: number; max: number };
  max?: number;
  notes: string[];             // spifferi, termosifoni, sbalzi
  sources: Source[];
}

interface FertilizerGuide {      // F08: tipo preciso di concime
  forms: ('liquid' | 'water-soluble' | 'granular' | 'slow-release')[];  // il primo è il consigliato
  plantType: 'foliage' | 'flowering';  // concime per piante verdi o da fiore
  npk?: { n: number; p: number; k: number; note: string };  // indicativo, es. 20-20-20 "bilanciato"; solo con fonte
  dilution: string;            // "come da etichetta; oppure metà dose con frequenza doppia"
  everyWeeks?: { min: number; max: number };  // le fonti possono differire
  seasons: Season[];           // periodo in cui concimare
  warnings: string[];          // segnali di troppo concime, terriccio umido prima di concimare
  sources: Source[];
}

interface CommonProblem {        // F20: problemi tipici di quella pianta (prevenzione, non diagnosi)
  name: string;                // "Cocciniglia farinosa"
  kind: 'pest' | 'disease' | 'care';   // parassita, malattia, problema di cura
  // Frequenza SOLO a parole e solo come la dice la fonte; 'not-stated' = la fonte non lo dice. Mai percentuali.
  frequency: 'frequent' | 'occasional' | 'rare' | 'not-stated';
  signs: string[];             // cosa si vede
  prevention: string[];        // come prevenirlo
  // Per l'avviso personalizzato (V-11, versione 1.1): fattori dell'ambiente che aumentano il rischio, ognuno con fonte
  riskFactors?: { factor: 'low-light' | 'frequent-watering' | 'standing-water' | 'dry-air' | 'cold' | 'new-plant';
                  sources: Source[] }[];
  sources: Source[];
}

interface CareGroup {           // consigli generici per famiglia o tipo di pianta (ripiego, D8)
  id: ID;
  name: string;                // "Piante grasse", "Aracee"
  families: string[];          // famiglie botaniche che rientrano nel gruppo, es. ["Araceae"]
  advice: { light: string; water: string; temperature: string; soil: string };
  water?: WaterGuide;              // versioni strutturate, quando le fonti del gruppo le permettono
  fertilizer?: FertilizerGuide;
  commonProblems?: CommonProblem[];
  propagation?: PropagationGuide;  // consigli generici del gruppo (es. "aracee rampicanti: talea con nodo")
  repotting?: RepottingGuide;
  myths?: MythCheck[];             // falsi miti del gruppo (+ quelli 'all-potted-plants')
  furtherReading?: FurtherReading[];
  sources: Source[];           // almeno una
}

interface MythCheck {            // F21: "Falsi miti"
  claim: string;               // il mito, come lo dice la gente: "Il pothos purifica l'aria di casa"
  // false = le fonti dicono il contrario; overstated = c'è del vero ma l'effetto in casa è trascurabile;
  // partly-true = vero solo in parte; sources-disagree = le fonti non sono d'accordo (si mostrano entrambe)
  verdict: 'false' | 'overstated' | 'partly-true' | 'sources-disagree';
  origin?: string;             // da dove nasce il mito, se una fonte lo dice
  whatSourcesSay: string;      // parole nostre
  inPractice: string;          // cosa fare, in una frase
  scope: 'species' | 'group' | 'all-potted-plants';
  sources: Source[];           // almeno una; studi, università, orti botanici (mai blog o riviste)
}

interface FurtherReading {       // F22: "Approfondimenti", articoli esterni scelti a mano
  title: string;               // titolo dell'articolo, così com'è
  siteName: string;            // "Gardenia", "Vivai Le Georgiche"
  siteKind: 'magazine' | 'nursery' | 'public-body' | 'university' | 'association';  // 'nursery' → "sito di un vivaio"
  url: string;                 // articolo originale, leggibile gratis
  ourLine: string;             // UNA riga scritta da noi: mai citazioni né riassunti punto per punto
  author?: string;
  publishedAt?: string;        // data dell'articolo o del suo ultimo aggiornamento
  checkedAt: string;           // quando una persona l'ha confrontato con le fonti della scheda
  consistentWith?: string[];   // sezioni o miti con cui è stato confrontato (es. 'myths[1]')
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'any';  // tradotta in mesi secondo l'emisfero

interface PropagationGuide {     // "Coltivarla da zero"
  methods: {
    method: 'seed' | 'stem-cutting' | 'tip-cutting' | 'division' | 'leaf' | 'layering';
    suitable: boolean;           // false = sconsigliato; il motivo va in `whyNot`
    whyNot?: string;
    recommendedForBeginners?: boolean;
    bestSeasons: Season[];
    steps: string[];             // passaggi semplici, in ordine
    materials?: string[];
    timeToRootsWeeks?: { min: number; max: number };
    timeToNewPlantWeeks?: { min: number; max: number };
    commonMistakes: string[];
    sources: Source[];           // almeno una per ogni metodo "adatto"
  }[];
}

interface RepottingGuide {       // "Travaso"
  signs: string[];               // segnali che serve
  everyYears?: { min: number; max: number };  // intervallo indicativo (le fonti possono differire)
  bestSeasons: Season[];
  pot: string;                   // es. "una misura più grande, con fori di drenaggio"
  soil: string;
  steps: string[];
  aftercare: string[];           // cure dei giorni successivi
  outdoorWeatherRules?: { avoidFrostDays: number; avoidHeatAboveC?: number };  // solo piante all'aperto
  sources: Source[];
}

interface AppSettings {
  deviceId: ID;                // codice anonimo per le quote (§4)
  onboardingCompletedAt?: ISODate;
  lastBackupAt?: ISODate;      // per ricordare il backup se è passato molto tempo (D3)
  seenSectionIntros: string[]; // sezioni di cui è già stata mostrata la spiegazione (F02)
  defaultLocation?: { lat: number; lon: number; source: 'gps' | 'city' };
  units: 'metric';
}
```

**Sul server (Upstash Redis)** ci sono solo i contatori del §4, senza dati personali e con scadenza di 48 ore.

## 6. Adattatori (servizi sostituibili)
| Adattatore | Implementazione v1 | Dove gira | Alternativa gratuita / ripiego |
|---|---|---|---|
| `PlantRecognitionProvider` | `PlantNetProvider` tramite `/api/identify` | server | Ricerca per nome (F06) |
| `LivePreviewClassifier` | BioCLIP v1 compresso int8 + impronte del catalogo (D10, 2026-11-18) | telefono | Modello nostro piccolo; `NoopClassifier` (solo consigli di inquadratura) |
| `TaxonomyProvider` | `StaticSynonymTable` (file JSON generato sul PC da GBIF, [scheda](../api-documentation/sinonimi-botanici.md)) | telefono e server | World Flora Online **(da verificare)**; tabella a mano per il catalogo |
| `WeatherProvider` | `OpenMeteoProvider` | telefono | MET Norway **(da verificare)**; intervalli standard |
| `SunProvider` | `SunCalcProvider` | telefono | astronomy-engine **(da verificare)**; formule NOAA |
| `AiProvider` | `RuleBasedAssistant` | telefono | v2: `OllamaProvider` personale |
| `StorageProvider` | `IndexedDbStorage` | telefono | v2: sincronizzazione (D3) |
| `QuotaStore` | `UpstashQuotaStore` | server | Cloudflare D1 o Supabase **(da verificare)**; ripiego: solo il dato di Pl@ntNet |
| `ArticleFeedProvider` (v1.1, proposta V-13) | `RssFeedProvider`: solo feed autorizzati per iscritto, una lettura al giorno, tiene solo titolo/data/link ([scheda](../api-documentation/fonti-editoriali.md)) | server | Approfondimenti scelti a mano (F22), sempre presenti |

## 7. Sicurezza e privacy (riassunto)
- Chiavi solo sul server, mai nel repository (CLAUDE.md §7). Variabili segrete: `PLANTNET_API_KEY`, `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN` (solo nomi; i valori in `.env.local`). Variabili non segrete di configurazione:
  `QUOTA_TOTAL_PER_DAY`, `QUOTA_PER_DEVICE_PER_DAY`, `QUOTA_PER_IP_PER_DAY` (§4).
- `/api/identify` accetta solo richieste dal nostro dominio, foto JPEG/PNG fino a 5 e una dimensione massima.
- Le foto vengono ridotte sul telefono, eliminando i dati EXIF (posizione GPS).
- La posizione viene arrotondata a circa 1 km prima di ogni uso esterno.
- Niente servizi di analisi del traffico né pubblicità.

## 8. Rischi
| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Pl@ntNet poco preciso sulle piante di casa | Media | Alto | Test con 30 foto prima di sviluppare (D9); alternative; ricerca per nome |
| 500 identificazioni al giorno insufficienti | Bassa all'inizio | Medio | Quote, messaggi chiari, cache; piano non profit solo se nascerà un'organizzazione |
| Termini di Vercel Hobby incompatibili con il progetto | Bassa-media | Medio | Verificare i termini (D2); server piccolo e spostabile su Cloudflare |
| iPhone cancella i dati | Bassa con l'app installata | Alto | Installazione sulla Home, `persist()`, backup su file |
| Nessuna AI gratuita online per utenti UE | Alta (già verificato per Gemini) | Basso | AI non essenziale; assistente a regole; Ollama personale |
| Notifiche non disponibili nella v1 | Certa | Medio | Promemoria in-app + calendario `.ics`; push in v2 |
| Nessun modello aperto riconosce bene le piante di casa nel browser | Alta (verificato su 3 candidati) | Medio | BioCLIP con lista nostra o modello nostro (D10); prova su iPhone (D11); ripiego senza nomi |
| Anteprima live lenta, pesante o che scalda il telefono | Media | Medio | D11 prima di sviluppare; frequenza adattiva; download facoltativo; pausa automatica |
| L'utente prende l'anteprima per un risultato certo | Media | Medio | Testo "Forse…", soglie e stabilità; mai salvata; vale sempre Pl@ntNet |

## 9. Decisioni
D1-D9 decise il 2026-11-16: vedi [decisioni-da-prendere.md](decisioni-da-prendere.md). Ancora aperti: esito della
verifica dei termini di Vercel (D2) e risultato del test delle foto (D9: flora e soglie definitive).
**Aggiornamento 2026-11-17:** D9 chiusa (`k-world-flora`, soglie, tabella dei sinonimi); D11 approvata (prova su
iPhone 16, iOS 26.5.2); D10 rimandata all'esito di D11.
**Aggiornamento 2026-11-18:** D11 chiusa (fattibile sull'iPhone 16); D10 approvata (BioCLIP compresso int8, versione
bloccata su Hugging Face); regole del popup aggiornate (ritmo adattivo, stabilità in secondi, piante gemelle).
**Aggiornamento 2026-11-18 (sera):** schede con "Falsi miti" e "Approfondimenti" (`MythCheck`, `FurtherReading`; D8
ampliata); feed RSS proposto per la v1.1 (`ArticleFeedProvider`); nuova decisione aperta **D12** (community, v2 o oltre).

## Fonti
1. Pl@ntNet API, "Introduction" e "Single-species identification" — https://my.plantnet.org/doc/getting-started/introduction , https://my.plantnet.org/doc/api/identify — consultati il 2026-11-16
2. Vercel, "Fair Use Guidelines" (aggiornata il 2026-11-12) — https://vercel.com/docs/limits/fair-use-guidelines — consultato il 2026-11-16
3. Vercel, "Vercel Hobby Plan" (aggiornata il 2026-11-12) — https://vercel.com/docs/plans/hobby — consultato il 2026-11-16
4. Cloudflare, "Workers pricing" — https://developers.cloudflare.com/workers/platform/pricing/ — consultato il 2026-11-16
5. Google, "Gemini API Additional Terms of Service" (in vigore dal 2026-03-23) — https://aistudio.google.com/docs/terms — consultato il 2026-11-16
6. WebKit, "Tracking Prevention in WebKit" — https://webkit.org/tracking-prevention/ ; "Full Third-Party Cookie Blocking and More" (2020) — https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ ; "Web Push for Web Apps on iOS and iPadOS" (2023) — https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ — consultati il 2026-11-16 tramite risultati di ricerca
7. Supabase, "Pricing" — https://supabase.com/pricing — consultato il 2026-11-16
8. Pl@ntNet API, "Pricing and conditions" — https://my.plantnet.org/pricing — consultato il 2026-11-16
9. Upstash, "Redis pricing" — https://upstash.com/pricing/redis — consultato il 2026-11-16
