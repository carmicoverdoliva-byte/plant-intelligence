# Piano della versione 1 — da rivedere insieme

> Proposto il 2026-11-18 · **Stato: bozza da rivedere, nessun passo iniziato.**
> Collegati: [visione del prodotto](visione-prodotto.md), [specifiche funzionali](specifiche-funzionali.md),
> [architettura](../architecture/architettura.md), [decisioni](../architecture/decisioni-da-prendere.md)

**Obiettivo della versione 1** (dalle specifiche, §2): chi apre l'app per la prima volta riesce a **riconoscere una pianta
di casa**, **salvarla** nella collezione e **ricevere promemoria di cura** adattati alla sua finestra e al meteo, senza
pagare e senza registrarsi.

## Regole che valgono per ogni passo
- Un passo alla volta. Prima di iniziarlo spiego cosa farò; alla fine riassumo cosa è cambiato (CLAUDE.md §2).
- Un passo è **"fatto" solo dopo la verifica** indicata. Se una verifica fallisce lo dico e mostro l'errore (§3).
- Ogni passo si chiude con un **commit** in italiano e con il controllo che non ci siano chiavi o dati personali (§7).
- Ogni funzione visibile all'utente ha la sua **voce nella Guida** e la sua spiegazione al primo ingresso (§6).
- Niente viene pubblicato online senza la tua conferma esplicita.
- Le prove sull'iPhone le fai tu. Io ti preparo i passi da seguire e una scheda da compilare o un testo da copiare.

Legenda della colonna "Tu": **—** = non serve niente da parte tua, oltre a leggere il riepilogo.

---

## Fase 0 — Basi

### 0.1 Pulizia della cronologia git
- **Cosa si costruisce:** si toglie dalla cronologia dei commit il percorso personale di Windows rimasto nel commit
  `f6b0700`, prima che il codice venga pubblicato. Nella versione attuale dei file non c'è più: resta solo nella storia.
- **Come si verifica:** una ricerca su tutta la cronologia (`git log -S`) non trova più il percorso; i file del progetto
  restano identici a prima. Prima della pulizia faccio una copia di sicurezza della cartella `.git`, fuori dal progetto.
- **Tu:** confermi la pulizia. Riscrive la cronologia, ma non è ancora stato pubblicato nulla, quindi non crea
  problemi ad altri.

### 0.2 Verifica dei termini di Vercel e Upstash
- **Cosa si costruisce:** due schede in `docs/api-documentation/` (Vercel Hobby per D2, Upstash Redis per D4). Ognuna
  riporta i limiti gratuiti, l'uso non commerciale e se serve una carta di credito, con fonti ufficiali e data.
- **Come si verifica:** ogni dato ha una fonte ufficiale con data; quello che non si trova è marcato "(da verificare)".
  Se i termini non vanno bene, si torna a D2 o D4 con le alternative (es. Cloudflare).
- **Tu:** leggi il riassunto e confermi, oppure scegli l'alternativa.

### 0.3 Scheletro dell'app
- **Cosa si costruisce:** il progetto Next.js + React + TypeScript + Tailwind CSS in `src/`, con una pagina vuota
  "Plant Intelligence" e il file `.env.example` (solo nomi delle variabili, valori finti). Prima di installare controllo
  licenze e versioni dei pacchetti.
- **Come si verifica:** compilazione (`npm run build`) e controllo del codice (`npm run lint`) senza errori; la pagina si
  apre sul PC all'indirizzo `localhost` (solo dal PC, non da altri dispositivi).
- **Tu:** —

### 0.4 App installabile (PWA)
- **Cosa si costruisce:** il "manifest" (nome, icona, colori), un'icona provvisoria nostra e un service worker minimo,
  cioè il pezzo che lavora in sottofondo e conserva i file per l'uso offline.
- **Come si verifica:** Edge sul PC riconosce l'app come installabile e la pagina si riapre anche offline (prova
  automatica su localhost).
- **Tu:** —

### 0.5 Primo indirizzo online (Vercel)
- **Cosa si costruisce:** il collegamento del progetto a Vercel (D2), così l'app ha un indirizzo `https` da aprire
  sull'iPhone. Prima ti spiego i passi e aspetto la tua conferma.
- **Come si verifica:** l'indirizzo risponde. Lo controllo da qui: la pagina c'è e non contiene chiavi.
- **Tu:** crei l'account Vercel (se serve, collegato a GitHub), carichi il codice seguendo i passi e apri l'indirizzo in
  Safari sull'iPhone. Mai password o token in chat.

---

## Fase 1 — Guscio e Guida

### 1.1 Menu e Guida (F02)
- **Cosa si costruisce:** la navigazione principale (Home, Fotocamera, Collezione, Guida) e la sezione **Guida** con FAQ,
  tutorial singoli e "Ripeti il tutorial". I testi stanno anche in `docs/user-guide/`.
- **Come si verifica:** una prova automatica apre ogni schermata e controlla che la Guida sia raggiungibile da tutte.
  Controllo anche la larghezza del telefono (niente scorrimento laterale).
- **Tu:** dai un'occhiata sull'iPhone e mi dici se i testi sono chiari.

### 1.2 Onboarding al primo avvio (F01)
- **Cosa si costruisce:** benvenuto, tutorial "come fotografare una pianta", come leggere i risultati, spiegazione dei
  permessi **prima** della richiesta di iOS, guida all'installazione sulla schermata Home (D3), proposta del backup.
  Si può saltare e ripetere dalla Guida.
- **Come si verifica:** una prova automatica percorre l'onboarding fino in fondo, lo salta, lo ripete dalla Guida, e
  controlla che al secondo avvio non ricompaia.
- **Tu:** lo provi sull'iPhone, anche aggiungendo l'app alla schermata Home, e mi dici cosa non è chiaro.

---

## Fase 2 — Riconoscimento completo (Pl@ntNet)

### 2.1 Collegamento a Pl@ntNet (F03)
- **Cosa si costruisce:** l'adattatore `PlantRecognitionProvider` e la richiesta al server `/api/identify` (flora
  `k-world-flora`, D9). La chiave resta **solo sul server**, letta da `.env.local` sul PC e dalle impostazioni segrete di
  Vercel online.
- **Come si verifica:** 3 foto del test D9 danno gli stessi risultati di allora. Controllo che la chiave non compaia
  in nessun file inviato al telefono.
- **Tu:** quando andiamo online, inserisci la chiave Pl@ntNet nelle impostazioni segrete di Vercel (ti spiego dove).
  Non va mai scritta in chat.

### 2.2 Foto dal telefono
- **Cosa si costruisce:** scatto o scelta dalla galleria, da 1 a 5 foto, scelta della parte (foglia, fiore, frutto,
  corteccia, "non so"); riduzione della foto sul telefono (lato corto 1280 pixel, JPEG al 90%).
- **Come si verifica:** prova automatica con le foto di prova (peso prima e dopo la riduzione), più un riconoscimento
  vero dal PC.
- **Tu:** fai 2-3 riconoscimenti dall'iPhone con piante di casa.

### 2.3 Risultati onesti (F04)
- **Cosa si costruisce:** la schermata del risultato con le regole di CLAUDE.md §8:
  - titolo con nome comune + genere, la specie introdotta da "probabilmente";
  - nessuna percentuale; alternative;
  - "Non riesco a riconoscerla" con consigli di scatto;
  - sinonimi dalla tabella GBIF (stessa scheda di cura).
- **Come si verifica:** test automatici sulle **risposte di Pl@ntNet già salvate** nel test D9 (nessuna richiesta nuova,
  nessun consumo della quota): ogni foto deve finire nel livello previsto dalle soglie D9, e le trappole in
  "Non riesco a riconoscerla".
- **Tu:** —

### 2.4 Limiti e messaggi d'errore (F13)
- **Cosa si costruisce:** contatore delle identificazioni con Upstash (D4); limite di **10 al giorno per dispositivo**
  (D5, configurabile); messaggi chiari quando la quota è finita, quando non c'è rete o quando Pl@ntNet non risponde.
- **Come si verifica:** test automatici: l'11ª richiesta del giorno riceve il messaggio giusto; Pl@ntNet simulato "spento"
  non fa rompere l'app.
- **Tu:** crei l'account gratuito Upstash e inserisci le sue chiavi nelle impostazioni segrete (ti spiego dove).

---

## Fase 3 — Anteprima live (dalla pagina D11 all'app)

### 3.1 Anteprima nel mirino (F17)
- **Cosa si costruisce:** l'adattatore `LivePreviewClassifier`, con il modello BioCLIP compresso (D10, versione bloccata e
  controllo SHA-256) che gira in un Web Worker, e `NoopClassifier` come ripiego (solo consigli di inquadratura). Più:
  - il download alla prima apertura della fotocamera, con il peso indicato e il consiglio del Wi-Fi;
  - il popup con le regole di [architettura §1b](../architecture/architettura.md#1b-riconoscimento-a-due-livelli),
    comprese le piante gemelle;
  - il tocco sul popup, che equivale a scattare;
  - i valori in un solo file di configurazione.
- **Come si verifica:** la stessa prova automatica usata per la pagina D11 (ritmo, pause, popup "X o Y", nessun
  blocco), più un controllo: se il modello non è scaricato, l'app funziona lo stesso.
- **Tu:** —

### 3.2 Prova lunga sull'iPhone (completa D11)
- **Cosa si costruisce:** niente di nuovo: la scheda di prova, con i passi da seguire e cosa annotare.
- **Come si verifica:** **5 minuti continui** di mirino (calore e rallentamento), le 3 trappole (nessun nome deve
  comparire), almeno 10 piante di casa annotate. Criteri di D11: nome giusto in almeno 6 casi su 10 e nessun nome
  sbagliato mostrato con sicurezza.
- **Tu:** fai la prova e incolli i risultati. Se il telefono scalda troppo, riduciamo il ritmo prima di andare avanti.

---

## Fase 4 — Collezione e schede

### 4.1 Collezione personale (F09)
- **Cosa si costruisce:** salvataggio delle piante **solo sul telefono** (D3), tramite l'adattatore `StorageProvider`:
  nome, foto ridotta, data, posizione in casa. Si salva il risultato completo o la scelta manuale, **mai** l'anteprima.
- **Come si verifica:** prova automatica: salva, riapri la pagina, la pianta c'è ancora; modifica ed elimina funzionano.
- **Tu:** salvi 2-3 piante sull'iPhone e controlli che restino dopo aver chiuso l'app.

### 4.2 Schede botaniche e di cura (F07, F08, F18)
- **Cosa si costruisce:** la scheda del pothos (dall'[esempio](esempio-scheda-pothos.md)) con fonti per ogni sezione,
  "Coltivarla da zero" e "Travaso", più il **ripiego per famiglia o tipo di pianta**, dichiarato come tale (D8).
- **Come si verifica:** test automatici:
  - ogni sezione ha almeno una fonte;
  - una pianta senza scheda mostra il ripiego con l'avviso;
  - i sinonimi aprono la stessa scheda.
- **Tu:** rileggi la scheda del pothos.

### 4.3 Backup su file (F14)
- **Cosa si costruisce:** esportazione della collezione in un file (es. da salvare su iCloud Drive) e importazione.
- **Come si verifica:** prova automatica: esporta, cancella tutto, importa, i dati sono identici.
- **Tu:** fai un backup dall'iPhone e lo ripristini.

---

## Fase 5 — Ambiente e promemoria

### 5.1 Posizione e meteo (F11)
- **Cosa si costruisce:** posizione facoltativa (oppure il nome del comune) e meteo da Open-Meteo, tramite l'adattatore
  `WeatherProvider`, con un messaggio chiaro se il servizio non risponde.
- **Come si verifica:** test automatici con risposte salvate; una richiesta vera dal PC.
- **Tu:** —

### 5.2 Stima del sole (F10)
- **Cosa si costruisce:** stima delle ore di sole della finestra con SunCalc (orientamento, piano, ostacoli),
  **presentata come stima** e con calibrazione manuale.
- **Come si verifica:** test con casi noti (finestra a sud d'inverno e d'estate); il testo dice sempre che è una stima.
- **Tu:** inserisci una tua finestra vera e mi dici se il risultato è credibile.

### 5.3 Promemoria (F12)
- **Cosa si costruisce:** promemoria di cura nell'app, adattati a stagione, meteo e finestra, ed esportazione nel
  Calendario (file `.ics`) (D7). Niente notifiche push nella v1.
- **Come si verifica:** test automatici: un periodo caldo anticipa l'annaffiatura, l'inverno la ritarda; il file `.ics`
  si apre in un calendario.
- **Tu:** aggiungi un promemoria al Calendario dell'iPhone.

---

## Fase 6 — Rifiniture

### 6.1 Informazioni e privacy (F15)
- **Cosa si costruisce:** pagina con cosa resta sul telefono e cosa esce (solo le foto inviate a Pl@ntNet allo scatto), i
  servizi usati, le licenze e i crediti (BioCLIP, foto iNaturalist, GBIF, Open-Meteo).
- **Come si verifica:** ogni servizio usato nel codice compare nella pagina, con il suo link.
- **Tu:** rileggi.

### 6.2 Controllo finale della v1
- **Cosa si costruisce:** completamento della Guida (una voce per ogni funzione), accessibilità di base (testi leggibili,
  VoiceOver sul popup), correzioni emerse dalle prove.
- **Come si verifica:** l'elenco delle funzioni v1 è spuntato tutto; compilazione, test e prova automatica completa passano.
- **Tu:** prova completa sull'iPhone, dall'installazione al primo promemoria, seguendo una scheda di prova che ti preparo.

---

## Da decidere in revisione
- **L'ordine delle fasi:** l'anteprima live (fase 3) potrebbe venire dopo la collezione (fase 4), se preferisci avere
  prima un'app "completa" anche senza anteprima.
- **Il punto in cui andare online (0.5):** subito, così ogni passo si prova sull'iPhone, oppure più tardi.
- **Cosa resta fuori dalla v1:** già previsto per la v2: notifiche push (D7) e botanico AI con Ollama (D6).

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| I termini di Vercel o Upstash non vanno bene | Bassa-media | Passo 0.2 prima di tutto; alternative già indicate in D2/D4 |
| Installare i pacchetti sul PC di sviluppo crea problemi | Bassa | Solo pacchetti open source verificati, niente programmi di sistema; se serve ci fermiamo e valutiamo |
| Il telefono scalda con l'anteprima su 5 minuti | Media | Ritmo adattivo già pronto; prova 3.2 prima di proseguire; ripiego senza nomi |
| Safari cancella i dati di chi non installa l'app | Media | Guida all'installazione sulla Home (1.2) e backup (4.3) |
| La quota di Pl@ntNet finisce durante le prove | Bassa | Test sulle risposte salvate; prove vere solo quando servono |
