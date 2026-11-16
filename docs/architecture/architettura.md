# Architettura — Plant Intelligence

> Ultimo aggiornamento: 2026-11-16 · Collegati: [specifiche funzionali](../requirements/specifiche-funzionali.md),
> [decisioni da prendere](decisioni-da-prendere.md), schede [Pl@ntNet](../api-documentation/plantnet-api.md),
> [Open-Meteo](../api-documentation/open-meteo.md), [SunCalc](../api-documentation/suncalc.md)

Questo documento spiega **come è fatta l'app**: quali pezzi la compongono, dove girano, come si parlano e dove finiscono i dati.
Le scelte segnate **"proposta"** aspettano la conferma dell'utente (vedi [decisioni](decisioni-da-prendere.md)).

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
3. Server    ──POST https://my-api.plantnet.org/v2/identify/all?api-key=SEGRETA&lang=it──>  Pl@ntNet
4. Pl@ntNet  ──lista di specie con punteggi + richieste rimaste──>  Server
5. Server    aggiorna i contatori e traduce la risposta nel nostro formato
6. Server    ──risultato (senza chiave, senza dati interni)──>  Telefono
```

- La chiave sta **solo** nelle variabili d'ambiente del server (in locale nel file `.env.local`, online nelle impostazioni
  dell'hosting). Nel repository c'è solo `.env.example` con il **nome** `PLANTNET_API_KEY` e un valore finto.
- Pl@ntNet permette anche di "esporre" la chiave nel browser limitandola a certi domini [1], ma **non lo facciamo**: un
  dominio si può falsificare fuori dal browser, e non potremmo contare le quote per dispositivo.
- Il server **non salva le foto**: le inoltra e le dimentica.

**Dimensione delle foto.** Il telefono riduce ogni foto (lato corto 1280 pixel, JPEG 90%), che pesa così circa 0,3-0,6 MB.
Anche 5 foto restano sotto il limite di dimensione delle funzioni dell'hosting (su Vercel circa 4,5 MB **(da verificare)**).

### Hosting gratuito (proposta)
| Opzione | Gratis | Limiti principali (piano gratuito) | Pro | Contro |
|---|---|---|---|---|
| **Vercel Hobby** (proposta) | Sì | 1.000.000 di esecuzioni di funzioni al mese, 4 ore di CPU, 100 GB di traffico, funzioni fino a 5 minuti; superati i limiti, la funzione si ferma fino a 30 giorni [2][3] | Creato da chi sviluppa Next.js: configurazione quasi nulla | Il piano Hobby è storicamente riservato a **uso personale non commerciale**: la pagina consultata non lo dice, **da verificare nei termini** [3] |
| **Cloudflare Workers** | Sì | 100.000 richieste al giorno, 10 ms di CPU per richiesta [4] | Limiti generosi; database D1 incluso | Next.js richiede un adattatore (OpenNext) **(da verificare)**; più passaggi di configurazione |
| **Netlify** | Sì | **(da verificare)** | Supporta Next.js | Limiti da verificare |

Con circa 500 identificazioni al giorno siamo **molto lontani** dai limiti di tutti e tre. Il codice del server resta
piccolo e standard, quindi si può spostare da un hosting all'altro. Decisione [D2](decisioni-da-prendere.md).

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

**Proposta: tre livelli, tutti dietro lo stesso adattatore `AiProvider`.**

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

**Proposta per la v1: tutto sul telefono, nessun account, nessun dato personale sul server.**

| Dove | Cosa | Perché |
|---|---|---|
| **IndexedDB sul telefono** | Piante, foto ridotte, identificazioni, finestre, promemoria, impostazioni | Gratis, veloce, funziona offline, privacy massima |
| **File di backup** (esporta/importa) | Copia completa della collezione | Protegge da cancellazioni e cambio telefono (F14) |
| **Server (Upstash Redis)** | **Solo contatori** anonimi delle identificazioni, cancellati dopo 48 ore | Necessari per il limite di 500 al giorno (§4) |

**Come iPhone conserva i dati.** Safari cancella i dati salvati dai siti dopo **7 giorni senza visite**, ma le web app
**installate sulla schermata Home** sono esentate da questa regola [6]. Per questo:
- l'onboarding invita a installare l'app (F01, F16);
- l'app chiede al browser di rendere i dati "persistenti" (`navigator.storage.persist()`) [6];
- il backup su file resta comunque consigliato. Le fonti di WebKit sono del 2019-2023 e Safari 26 ha reso più severe
  alcune regole sui dati salvati dai siti: **da riverificare** quando l'app sarà installabile [6].

**Foto:** due versioni per ogni foto, una miniatura (circa 400 pixel) per gli elenchi e una media (1280 pixel) per la scheda.
Le foto originali non vengono conservate, così risparmiamo spazio.

**In futuro (v2): sincronizzazione online facoltativa.** Opzione gratuita: **Supabase** (database 500 MB, file 1 GB, 50.000
utenti al mese). Attenzione: il progetto **si mette in pausa dopo 7 giorni senza attività** e i backup automatici non sono
inclusi [7]. 1 GB di file vale circa 2.000-3.000 foto in tutto: per molti utenti non basterebbe. Decisione
[D3](decisioni-da-prendere.md).

## 4. Il limite di 500 identificazioni al giorno

**Regole di Pl@ntNet** [8]: 500 identificazioni al giorno, azzerate a mezzanotte UTC (01:00 italiane d'inverno, 02:00 d'estate).
Oltre il limite il servizio risponde con l'errore 429. **Ogni risposta riporta quante richieste restano**
(`remainingIdentificationRequests`) [1].

**Dove contiamo.** Le funzioni del server non hanno memoria tra una richiesta e l'altra, quindi serve un piccolo
archivio esterno. Proposta: **Upstash Redis** (piano gratuito: 500.000 comandi al mese, 256 MB, senza carta di credito) [9].
Ogni identificazione usa circa 4 comandi: 500 al giorno × 30 giorni × 4 = **60.000 comandi al mese**, ben dentro il limite.

> **Redis**: un archivio molto veloce di coppie "nome → valore", ideale per i contatori.

**Tre contatori:**
| Contatore | Chiave (esempio) | Limite (proposta) | Scade |
|---|---|---|---|
| Totale del giorno | `id:2026-11-16` | **480** (20 di riserva per i test e gli imprevisti) | 48 ore |
| Per dispositivo | `dev:<impronta>:2026-11-16` | **10 al giorno** (decisione [D5](decisioni-da-prendere.md)) | 48 ore |
| Per rete (IP) | `ip:<impronta>:2026-11-16` | **30 al giorno** (contro chi reinstalla l'app per avere nuovi riconoscimenti) | 48 ore |

L'**ID del dispositivo** è un codice casuale creato dall'app al primo avvio. Non contiene dati personali. Il server conserva
solo un'**impronta** (hash) di ID e IP: un codice da cui non si può risalire all'originale.

**Il flusso:**
```text
richiesta ──> il totale di oggi è sotto 480? ── no ──> "Riconoscimenti di oggi esauriti, riprova dopo le 01:00"
                 │ sì
                 v
              il dispositivo e la rete sono sotto la loro quota? ── no ──> "Hai usato i tuoi 10 riconoscimenti di oggi"
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
```

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
  acquiredAt?: ISODate;
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
  project: string;             // flora usata, es. "all"
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
  score: number;               // 0-1, come restituito da Pl@ntNet
  confidenceLabel: 'molto probabile' | 'possibile' | 'incerto';  // calcolata con le soglie (D9)
  gbifId?: number;             // collegamento alla banca dati GBIF
  speciesId?: ID;              // collegamento al nostro catalogo, se la specie c'è
}

interface Reminder {
  id: ID;
  plantId: ID;
  kind: 'water' | 'fertilize' | 'repot' | 'check';
  baseIntervalDays: number;    // dalla scheda di cura
  adjustedIntervalDays: number;// corretto per stagione, luce stimata e meteo
  adjustmentReason?: string;   // "più caldo del solito: anticipato di 1 giorno"
  nextDueAt: ISODate;
  lastDoneAt?: ISODate;
  history: { doneAt: ISODate; action: 'done' | 'snoozed' }[];
  enabled: boolean;
}

interface Window {
  id: ID;
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
  care?: {                     // presente solo per le specie con scheda di cura scritta da noi
    light: { minSunHours: number; maxSunHours: number; note: string };
    waterIntervalDays: { summer: number; winter: number };
    temperatureC: { min: number; max: number };
    soil: string;
    fertilizeEveryDays?: number;
    repotEveryYears?: number;
  };
  toxicity?: { pets: 'toxic' | 'non-toxic' | 'unknown'; children: 'toxic' | 'non-toxic' | 'unknown'; source: string };
  sources: { title: string; url: string; accessedAt: string }[];
}

interface AppSettings {
  deviceId: ID;                // codice anonimo per le quote (§4)
  onboardingCompletedAt?: ISODate;
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
| `WeatherProvider` | `OpenMeteoProvider` | telefono | MET Norway **(da verificare)**; intervalli standard |
| `SunProvider` | `SunCalcProvider` | telefono | astronomy-engine **(da verificare)**; formule NOAA |
| `AiProvider` | `RuleBasedAssistant` | telefono | v2: `OllamaProvider` personale |
| `StorageProvider` | `IndexedDbStorage` | telefono | v2: sincronizzazione (D3) |
| `QuotaStore` | `UpstashQuotaStore` | server | Cloudflare D1 o Supabase **(da verificare)**; ripiego: solo il dato di Pl@ntNet |

## 7. Sicurezza e privacy (riassunto)
- Chiavi solo sul server, mai nel repository (CLAUDE.md §7). Variabili: `PLANTNET_API_KEY`, `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN` (solo nomi; i valori in `.env.local`).
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

## 9. Decisioni aperte
Tutte in [decisioni-da-prendere.md](decisioni-da-prendere.md).

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
