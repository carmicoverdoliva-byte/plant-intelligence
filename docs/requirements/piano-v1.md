# Piano della versione 1 — da rivedere insieme

> Proposto il 2026-11-18 · Aggiornato il 2026-11-18 con i nuovi requisiti (schede più complete, problemi più comuni,
> "Nuova pianta") · **Stato: ✅ APPROVATO il 2026-11-18** (decisioni in fondo). Ordine di esecuzione: fasi 0 → 1 → 2 → 3 →
> 4 → 5 → 6, dopo la rinumerazione (la vecchia fase 4 "Collezione e schede" ora è la 3, l'anteprima live è la 4).
> Collegati: [visione del prodotto](visione-prodotto.md), [specifiche funzionali](specifiche-funzionali.md),
> [architettura](../architecture/architettura.md), [decisioni](../architecture/decisioni-da-prendere.md)

**Obiettivo della versione 1** (dalle specifiche, §2): chi apre l'app per la prima volta riesce a **riconoscere una pianta
di casa**, **salvarla** nella collezione e **ricevere promemoria di cura** adattati alla sua finestra e al meteo, senza
pagare e senza registrarsi.

## Nuovi requisiti del 2026-11-18: cosa entra nella v1 e cosa dopo
| Requisito | Dove | Versione | Perché |
|---|---|---|---|
| Schede più complete: acqua **quanto**, concime **tipo preciso**, temperatura **minima/ideale/massima** | F08, passo 3.3 | **v1** | Sono contenuti della scheda, non funzioni nuove: costa scriverli, non programmarli. Servono anche ai promemoria (5.3), che devono dire *quanto* annaffiare e *che* concime usare |
| Sezione **"Problemi più comuni"** (frequenza a parole, segnali, prevenzione) | F20, passo 3.3 | **v1** | Contenuto statico con fonti, come le altre sezioni: aiuta a prevenire, che è più facile che curare |
| **Avviso di rischio personalizzato** (es. poca luce + molta acqua → marciume) | V-11 | **v1.1** | Va bene solo se ogni regola "ambiente → rischio" ha una fonte. Per ora la fonte c'è per "troppa acqua → marciume", non per il ruolo della poca luce. Le abitudini di annaffiatura si conoscono solo dopo settimane d'uso. Si costruisce insieme alla diagnosi guidata (V-01), che usa lo stesso tipo di regole. Un avviso sbagliato spaventerebbe senza motivo |
| **"Nuova pianta"**: stanze e finestre salvate, posto migliore con il motivo, piano delle prime settimane con promemoria | F19, passo 5.4 | **v1** | È esattamente l'obiettivo della v1 (riconoscere, salvare, promemoria adattati alla finestra). Riusa pezzi già nel piano (riconoscimento, ricerca, stima del sole, promemoria): il lavoro nuovo è soprattutto collegarli |

### Nuovi requisiti del 2026-11-18 (sera)
| Requisito | Dove | Versione | Perché |
|---|---|---|---|
| Sezione **"Falsi miti"** in ogni scheda (mito, verdetto, cosa dicono le fonti, cosa fare) | F21, passo 3.3 | **v1** | Contenuto statico con fonti, come le altre sezioni: costa ricerca, non programmazione. I miti generali (es. la ghiaia sul fondo) si scrivono una volta per tutte le schede |
| Sezione **"Approfondimenti"**: articoli scelti a mano, solo titolo, sito, riga nostra e link | F22, passo 3.3 | **v1** | Un elenco statico nella scheda: nessun servizio esterno. Solo link, quindi consentiti; il lavoro è controllare che ogni articolo sia coerente con le fonti |
| **"Ultimi articoli su questa pianta"** dal feed RSS | V-13 | **v1.1** | I feed esistono (Le Georgiche, Gardenia), ma nessun sito concede esplicitamente di usarli in un'app: servono un **permesso scritto** e il **controllo umano** di ogni articolo ([fonti editoriali](../api-documentation/fonti-editoriali.md), [email](../api-documentation/email-permesso-feed.md)) |
| **Community** con consigli e voti | V-14, D12 | **da rivalutare nella v2** | Richiede account, server, moderazione quotidiana e obblighi privacy: tutto ciò che la v1 evita (D3). **D12 decisa: A**, solo link a community esistenti |

Revisione del piano: mancavano due funzioni già previste per la v1, ora aggiunte:
- **ricerca per nome (F06)**, che serve a "Nuova pianta" per chi non vuole fotografare;
- **riconoscimento guidato (F05)**.

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
- **✅ Fatto il 2026-11-18.**
  - Copia di sicurezza: `backup-git/plant-intelligence-prima-della-pulizia-2026-11-18.bundle`, nella cartella utente,
    fuori dal progetto e dalle cartelle sincronizzate nel cloud, verificata con `git bundle verify`.
  - Il percorso è stato sostituito con `<cartella-utente>` nell'unico commit che lo conteneva, "Pagina di prova D11"
    (prima `f6b0700`): 5 righe in 3 file.
  - Verifiche:
    - l'impronta dei file attuali (albero dell'ultimo commit) è identica a prima della pulizia;
    - nessun altro commit è cambiato nel contenuto;
    - nessun oggetto del repository contiene più il percorso.
  - Gli identificativi dei commit da quello in poi sono cambiati.
  - Nota: i commit riportano l'email dell'autore, che diventerà pubblica con il codice. Si può sostituire con l'indirizzo
    anonimo di GitHub (`…@users.noreply.github.com`), ma solo se lo decidi tu.

### 0.2 Verifica dei termini di Vercel e Upstash
- **Cosa si costruisce:** due schede in `docs/api-documentation/` (Vercel Hobby per D2, Upstash Redis per D4). Ognuna
  riporta i limiti gratuiti, l'uso non commerciale e se serve una carta di credito, con fonti ufficiali e data.
- **Come si verifica:** ogni dato ha una fonte ufficiale con data; quello che non si trova è marcato "(da verificare)".
  Se i termini non vanno bene, si torna a D2 o D4 con le alternative (es. Cloudflare).
- **Tu:** leggi il riassunto e confermi, oppure scegli l'alternativa.
- **✅ Fatto il 2026-11-18.**
  - Schede [vercel.md](../api-documentation/vercel.md) e [upstash.md](../api-documentation/upstash.md), fonti ufficiali
    con data.
  - Esito: entrambi vanno bene per il nostro uso.
  - Resta un dubbio, le donazioni su Vercel Hobby: per ora nessuna richiesta di donazioni nell'app; non blocca il passo 0.5.

### 0.3 Scheletro dell'app
- **Cosa si costruisce:** il progetto Next.js + React + TypeScript + Tailwind CSS in `src/`, con una pagina vuota
  "Mandragola" e il file `.env.example` (solo nomi delle variabili, valori finti). Prima di installare controllo
  licenze e versioni dei pacchetti.
- **Come si verifica:** compilazione (`npm run build`) e controllo del codice (`npm run lint`) senza errori; la pagina si
  apre sul PC all'indirizzo `localhost` (solo dal PC, non da altri dispositivi).
- **Tu:** —
- **✅ Fatto il 2026-11-18.**
  - Next.js 16.4.6, React 19.3, Tailwind CSS 4.3, TypeScript 5 ed ESLint 9 (scheda
    [dipendenze.md](../api-documentation/dipendenze.md)).
  - Verifiche: `npm run lint` e `npm run build` senza errori; pagina in italiano che risponde su `127.0.0.1:3000`, in
    ascolto solo sul PC.
  - Statistiche anonime di Next.js disattivate sul PC; README aggiornato, con la frase "progetto non commerciale" (D1).

### 0.4 App installabile (PWA)
- **Cosa si costruisce:** il "manifest" (nome, icona, colori), un'icona provvisoria nostra e un service worker minimo,
  cioè il pezzo che lavora in sottofondo e conserva i file per l'uso offline.
- **Come si verifica:** Edge sul PC riconosce l'app come installabile e la pagina si riapre anche offline (prova
  automatica su localhost).
- **Tu:** —
- **✅ Fatto il 2026-11-18.** Costruito:
  - icona nostra (foglia, SVG + PNG 180/192/512) e manifest (`src/app/manifest.ts`);
  - impostazioni per iPhone (`appleWebApp`, colore della barra);
  - service worker scritto a mano (`public/sw.js`): pagine prima dalla rete, file dell'app dalla copia salvata, **mai**
    `/api/` né altri siti;
  - intestazioni di sicurezza consigliate dalla guida PWA di Next.js.

  Verifica automatica in Edge su 127.0.0.1, 15 controlli superati: manifest letto senza errori, app installabile,
  service worker attivo, pagina riaperta con testi e stili **a server spento**, nessun errore. Sull'iPhone si verifica
  dopo il passo 0.5; la spiegazione dell'installazione arriva con l'onboarding (1.2).

### 0.5 Primo indirizzo online (Vercel)
- **Cosa si costruisce:** il collegamento del progetto a Vercel (D2), così l'app ha un indirizzo `https` da aprire
  sull'iPhone. Prima ti spiego i passi e aspetto la tua conferma.
- **Come si verifica:** l'indirizzo risponde. Lo controllo da qui: la pagina c'è e non contiene chiavi.
- **Tu:** crei l'account Vercel (se serve, collegato a GitHub), carichi il codice seguendo i passi e apri l'indirizzo in
  Safari sull'iPhone. Mai password o token in chat.
- **✅ Fatto il 2026-11-18.** App online su **https://mandragola-app.vercel.app** (il primo indirizzo,
  `plant-intelligence-six.vercel.app`, resta attivo), collegata al repository GitHub:
  Vercel la aggiorna da solo a ogni push sul ramo `main`.
  - Controllo da qui: pagina, manifest e service worker rispondono (200), `.env.local` non esiste online (404), nessuna
    chiave nella pagina.
  - Regola per i push (decisa dall'utente): alla fine di ogni passo verificato si può fare il push su `origin/main`,
    **solo dopo** aver controllato che non ci siano chiavi, file `.env`, dati personali o percorsi del PC. Ogni altra
    pubblicazione (nuovi servizi, account, repository, impostazioni di Vercel) si chiede prima.

### 0.6 Nome, stile grafico e icona
- **Cosa si costruisce:** il nome **Mandragola** (repository, app, documenti), lo stile "Serra di vetro"
  ([stile-grafico.md](../design/stile-grafico.md)) applicato allo scheletro, la skill `plant-ui` e le icone
  dall'icona master.
- **Come si verifica:** `npm run lint` e `npm run build` senza errori; pagina iniziale confrontata con il riferimento Home;
  anteprima dell'icona a 60 px; contrasto dei colori calcolato.
- **Tu:** rinomini il repository su GitHub e l'indirizzo su Vercel (`mandragola-app.vercel.app`); approvi l'icona.
- **✅ Fatto il 2026-11-18** (commit "Passo 0.6"). Icona approvata dall'utente; nuovo indirizzo verificato (risponde, titolo
  "Mandragola"). Il repository su GitHub risulta ancora `plant-intelligence` (il push funziona lo stesso).

---

## Fase 1 — Guscio e Guida

### 1.1 Menu e Guida (F02)
- **Cosa si costruisce:** la navigazione principale (Home, Fotocamera, Collezione, Guida) e la sezione **Guida** con FAQ,
  tutorial singoli e "Ripeti il tutorial". I testi stanno anche in `docs/user-guide/`.
- **Come si verifica:** una prova automatica apre ogni schermata e controlla che la Guida sia raggiungibile da tutte.
  Controllo anche la larghezza del telefono (niente scorrimento laterale).
- **Tu:** dai un'occhiata sull'iPhone e mi dici se i testi sono chiari.
- **✅ Fatto il 2026-11-18.** Costruito, seguendo la skill `plant-ui` e il riferimento Home:
  - Home come nel riferimento; barra in basso in vetro (Home, Le mie piante, Fotocamera al centro, Promemoria, Guida);
  - Guida con 3 tutorial e 5 domande frequenti; testi in `src/content/guida.ts`, copiati in
    [docs/user-guide/guida.md](../user-guide/guida.md) con `npm run guida` (una sola fonte);
  - spiegazione alla prima visita in ogni sezione, chiudibile e richiamabile con "?";
  - sezioni non ancora pronte con un avviso onesto ("arriva nella fase N"), senza pulsanti finti.
  - Differenze volute dal riferimento: niente campo di ricerca finché la ricerca non funziona (3.2); "Da fare oggi"
    vuoto finché non ci sono promemoria; il Falso mito cita la sua fonte.
  - Verifica: `tests/app/prova-app.mjs` in Edge a 390 px, 54/54 controlli (Guida raggiungibile da ogni schermata,
    niente scorrimento laterale, tocchi ≥ 44 px, Nunito, spiegazioni, domande frequenti, console senza errori);
    lint, controllo dei tipi e build senza errori.

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
  - sinonimi dalla tabella GBIF (stessa scheda di cura);
  - **riconoscimento guidato (F05)**: se il risultato è incerto, l'app propone una seconda foto di un'altra parte della
    pianta.
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

## Fase 3 — Collezione e schede

### 3.1 Collezione personale (F09)
- **Cosa si costruisce:** salvataggio delle piante **solo sul telefono** (D3), tramite l'adattatore `StorageProvider`:
  nome, foto ridotta, data, posizione in casa. Si salva il risultato completo o la scelta manuale, **mai** l'anteprima.
- **Come si verifica:** prova automatica: salva, riapri la pagina, la pianta c'è ancora; modifica ed elimina funzionano.
- **Tu:** salvi 2-3 piante sull'iPhone e controlli che restino dopo aver chiuso l'app.

### 3.2 Ricerca per nome (F06)
- **Cosa si costruisce:** ricerca di una pianta per nome comune o scientifico nel catalogo dell'app, passando dalla
  tabella dei sinonimi (stesso nome per la stessa pianta).
- **Come si verifica:** test automatici: "pothos", "potos" ed *Epipremnum aureum* portano alla stessa scheda; un nome
  sconosciuto dà un messaggio chiaro, non una pagina vuota.
- **Tu:** —

### 3.3 Schede botaniche e di cura (F07, F08, F18, F20, F21, F22)
- **Cosa si costruisce:** la scheda del pothos (dall'[esempio](esempio-scheda-pothos.md)) con fonti per ogni sezione,
  più il **ripiego per famiglia o tipo di pianta**, dichiarato come tale (D8). Sezioni:
  - **acqua**: quando, **quanto**, come cambia con stagione e vaso;
  - **concime**: tipo, NPK indicativo, diluizione, frequenza, periodo;
  - **temperatura**: minima, ideale, massima;
  - **"Coltivarla da zero"** e **"Travaso"**;
  - **"Problemi più comuni"**, con la frequenza solo a parole;
  - **"Falsi miti"** (F21), con i miti generali condivisi da tutte le schede;
  - **"Approfondimenti"** (F22), con il testo "Come scegliamo gli articoli".
- **Come si verifica:** test automatici:
  - ogni sezione e ogni problema ha almeno una fonte;
  - ogni scheda ha almeno un falso mito con verdetto e fonte scientifica o istituzionale;
  - ogni articolo degli Approfondimenti ha titolo, sito, riga nostra, link e data del controllo, e il link risponde;
  - nessuna percentuale nei problemi;
  - un valore senza fonte compare come "non indicata dalle fonti";
  - una pianta senza scheda mostra il ripiego con l'avviso;
  - i sinonimi aprono la stessa scheda.
- **Tu:** rileggi la scheda del pothos, soprattutto i punti segnati "(da verificare)", e gli articoli degli
  Approfondimenti di Le Georgiche (li ho controllati su sintesi automatiche). **Gli articoli di Gardenia li leggi e li
  scegli tu** (regola del 2026-11-18): io non apro le loro pagine.

### 3.4 Backup su file (F14)
- **Cosa si costruisce:** esportazione della collezione in un file (es. da salvare su iCloud Drive) e importazione.
- **Come si verifica:** prova automatica: esporta, cancella tutto, importa, i dati sono identici.
- **Tu:** fai un backup dall'iPhone e lo ripristini.

---

## Fase 4 — Anteprima live (dalla pagina D11 all'app)
> Viene **dopo** collezione e schede (decisione del 2026-11-18): il tocco sul popup deve aprire una scheda già esistente.

### 4.1 Anteprima nel mirino (F17)
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

### 4.2 Prova lunga sull'iPhone (completa D11)
- **Cosa si costruisce:** niente di nuovo: la scheda di prova, con i passi da seguire e cosa annotare.
- **Come si verifica:** **5 minuti continui** di mirino (calore e rallentamento), le 3 trappole (nessun nome deve
  comparire), almeno 10 piante di casa annotate. Criteri di D11: nome giusto in almeno 6 casi su 10 e nessun nome
  sbagliato mostrato con sicurezza.
- **Tu:** fai la prova e incolli i risultati. Se il telefono scalda troppo, riduciamo il ritmo prima di andare avanti.

---

## Fase 5 — Ambiente e promemoria

### 5.1 Posizione e meteo (F11)
- **Cosa si costruisce:** posizione facoltativa (oppure il nome del comune) e meteo da Open-Meteo, tramite l'adattatore
  `WeatherProvider`, con un messaggio chiaro se il servizio non risponde.
- **Come si verifica:** test automatici con risposte salvate; una richiesta vera dal PC.
- **Tu:** —

### 5.2 Stanze, finestre e stima del sole (F10)
- **Cosa si costruisce:** stanze e finestre di casa salvate **una volta** e riusabili (orientamento, piano, ostacoli;
  distanza di ogni posto dalla finestra); stima delle ore di sole con SunCalc, **presentata come stima** e con
  calibrazione manuale.
- **Come si verifica:** test con casi noti (finestra a sud d'inverno e d'estate); il testo dice sempre che è una stima.
- **Tu:** inserisci una tua finestra vera e mi dici se il risultato è credibile.

### 5.3 Promemoria (F12)
- **Cosa si costruisce:** promemoria di cura nell'app, adattati a stagione, meteo e finestra, ed esportazione nel
  Calendario (file `.ics`) (D7). Niente notifiche push nella v1.
- **Come si verifica:** test automatici: un periodo caldo anticipa l'annaffiatura, l'inverno la ritarda; il file `.ics`
  si apre in un calendario.
- **Tu:** aggiungi un promemoria al Calendario dell'iPhone.

### 5.4 Nuova pianta (F19)
- **Cosa si costruisce:** il percorso per una pianta appena comprata:
  1. fotografia o ricerca della pianta;
  2. scelta fra le stanze e finestre salvate (5.2);
  3. **posto consigliato con il motivo**, confrontando la stima del sole con il bisogno della pianta;
  4. **piano delle prime settimane** con promemoria (isolamento e controlli, niente travaso subito, prima annaffiatura,
     prima concimazione solo se una fonte dice quando). Ogni passo ha la sua fonte.
- **Come si verifica:** test automatici:
  - stanze e finestre inserite per una pianta ricompaiono per la successiva;
  - con due finestre l'app sceglie il posto giusto e la frase contiene "stima";
  - una correzione manuale del sole cambia il consiglio;
  - ogni promemoria del piano ha una fonte, e senza fonte non nasce.
- **Tu:** provi il percorso sull'iPhone con una pianta vera (anche una che hai già) e mi dici se il consiglio del posto
  ti sembra sensato.

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

## Decisioni della revisione (2026-11-18)
1. **Ordine delle fasi:** collezione e schede **prima** dell'anteprima live, perché il tocco sul popup deve aprire una
   scheda già esistente. Le fasi sono state rinumerate di conseguenza (3 = Collezione e schede, 4 = Anteprima live).
2. **Online subito:** passo 0.5 appena dopo la verifica dei termini (0.2), così ogni passo si prova sull'iPhone.
3. **Fuori dalla v1:** avviso di rischio personalizzato (V-11) e diagnosi guidata (V-01) in v1.1; notifiche push (D7) e
   botanico AI con Ollama (D6) in v2.
4. **Schede:** nella v1, **22 schede complete** (le piante del catalogo dell'anteprima live) più il **ripiego per gruppo**
   per tutte le altre; circa 50 nelle versioni successive. Aggiornata D8.
5. **Pulizia della cronologia git (0.1):** confermata, con copia di sicurezza.
6. **Nuovi requisiti della sera (confermati il 2026-11-18):** "Falsi miti" e "Approfondimenti" nella v1, dentro il
   passo 3.3; siti confermati: Le Georgiche, Gardenia, Vita in Campagna, Georgofili, CREA (escluso Il Floricultore);
   articoli di Gardenia scelti dall'utente; "Ultimi articoli" dal feed in v1.1 con permesso scritto e controllo umano;
   community: **D12 decisa A** (solo link a community esistenti nella v1 e v1.x, da rivalutare nella v2).

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| I termini di Vercel o Upstash non vanno bene | Bassa-media | Passo 0.2 prima di tutto; alternative già indicate in D2/D4 |
| Installare i pacchetti sul PC di sviluppo crea problemi | Bassa | Solo pacchetti open source verificati, niente programmi di sistema; se serve ci fermiamo e valutiamo |
| Il telefono scalda con l'anteprima su 5 minuti | Media | Ritmo adattivo già pronto; prova 4.2 prima di proseguire; ripiego senza nomi |
| Safari cancella i dati di chi non installa l'app | Media | Guida all'installazione sulla Home (1.2) e backup (3.4) |
| La quota di Pl@ntNet finisce durante le prove | Bassa | Test sulle risposte salvate; prove vere solo quando servono |
| Le schede più complete richiedono molto lavoro di ricerca | Alta | Nella v1 22 schede complete, non 50 (decisione del 2026-11-18); ripiego per gruppo dichiarato; i valori senza fonte restano "non indicati" invece di essere inventati |
| Le fonti non indicano alcuni valori (es. temperatura minima del pothos, prima concimazione) | Alta | La scheda lo dice; nessun promemoria senza fonte; si cercano fonti migliori prima della pubblicazione |
| Il consiglio del posto sembra preciso ma si basa su una stima | Media | Parola "stima" sempre visibile, motivo spiegato, correzione manuale (F10) |
| Trovare articoli coerenti con le fonti per tutte le 22 schede richiede tempo | Alta | La sezione Approfondimenti può restare vuota, con un messaggio onesto; i falsi miti generali coprono ogni scheda |
