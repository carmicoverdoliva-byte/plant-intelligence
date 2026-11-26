# AI gratuita per le schede generate al momento — scheda

> Ultima verifica: 2026-11-18 · Servizio proposto: Cloudflare Workers AI — https://developers.cloudflare.com/workers-ai/
> Collegati: [D6 rivista](../architecture/decisioni-da-prendere.md#d6--come-funziona-il-botanico-ai),
> [D13](../architecture/decisioni-da-prendere.md#d13--schede-complete-per-qualsiasi-pianta-riconosciuta),
> [schede su larga scala §6](../architecture/schede-su-larga-scala.md#6-schede-generate-al-momento-opzione-b-corretta)

## In breve
Quando Pl@ntNet riconosce una specie che **non ha ancora una scheda di specie verificata**, il nostro server genera la
scheda **una sola volta** con un servizio di intelligenza artificiale gratuito, la controlla e la salva. Da quel momento
la usano tutti.

L'AI non scrive "a memoria": riceve **dati reali** e deve citarli. I dati sono:
- la nostra scheda del genere;
- la scheda del tipo di pianta;
- le note di famiglia;
- Wikidata;
- Wikipedia;
- i dati aperti EIVE e WCVP.

**Proposta:**
- **Cloudflare Workers AI**, piano gratuito, per scrivere;
- **Upstash Redis**, già previsto nel progetto, per salvare.

Alternative di riserva: Groq (piano gratuito) e OpenRouter (modelli gratuiti), con alcuni punti **(da verificare)**.

**Glossario:**
- **LLM:** il programma di intelligenza artificiale che scrive testi.
- **Token:** un pezzetto di parola: 1.000 token sono circa 700 parole.
- **Neuron:** l'unità con cui Cloudflare misura il lavoro dell'AI. Il piano gratuito ne dà 10.000 al giorno.
- **Cache:** una copia salvata, riusata invece di rifare il lavoro.

## Cosa usiamo e perché
| Servizio | Piano gratuito | Dati inviati usati per addestrare? | Utenti in Europa / app pubblica | Esito |
|---|---|---|---|---|
| **Cloudflare Workers AI** | **10.000 neuron al giorno**, poi le richieste falliscono con un errore; si azzera alle 00:00 UTC [1] | **No**: "Cloudflare does not use Customer Content processed by Workers AI to train AI models" [2] | Nessun divieto trovato nei termini [3] **(da verificare con una domanda al supporto se serve)** | ✅ **Proposto** |
| Groq (GroqCloud) | Esiste un "Free Plan"; i limiti si vedono solo dentro l'account [4] **(da verificare)** | No: "We will never access Customer Data for training purposes" (termini di vendita); di norma non conserva le richieste [5] | Nessun divieto trovato **(da verificare)** | ⏸️ Riserva 1 |
| OpenRouter, modelli `:free` | **50 richieste al giorno** e 20 al minuto senza credito acquistato [6] | Dipende dal fornitore del singolo modello **(da verificare, modello per modello)** | Nessun divieto trovato **(da verificare)** | ⏸️ Riserva 2 |
| Google Gemini API, piano gratuito | Sì | **Sì**: i contenuti servono "to provide, improve…" e possono essere letti da persone [7] | ❌ **Vietato** offrire il piano gratuito a utenti in UE, Svizzera e Regno Unito: "You may use only Paid Services when making API Clients available to users in the European Economic Area" [7] | ❌ Esclusa |
| Mistral, piano "Experiment" | Sì, con numero di telefono | **Sì**: le richieste "may be used to train" [8] | Pensato "for testing and prototyping" [9], non per un'app pubblica | ❌ Esclusa |
| GitHub Models, Hugging Face (crediti gratuiti) | Pensati per prove o con crediti molto piccoli **(da verificare)** | — | — | ❌ Esclusi per ora |

**Quante schede al giorno con Cloudflare (stima).** Una scheda richiede circa 8.000 token in ingresso (le fonti) e
4.000 in uscita (la scheda completa, in formato dati). Con i costi in neuron della pagina prezzi [1]:

| Modello (Workers AI) | Neuron per scheda (stima) | Schede al giorno con 10.000 neuron |
|---|---|---|
| `gemma-4-26b-a4b-it` (Google, multilingue) | ~180 | **~55** |
| `qwen3-30b-a3b-fp8` | ~160 | ~60 (i modelli "che ragionano" scrivono più token: da misurare) |
| `mistral-small-3.1-24b-instruct` | ~460 | ~20 |
| `gpt-oss-120b` | ~530 | ~19 |
| `llama-3.3-70b-instruct-fp8-fast` | ~1.030 | ~9 |

**Scelta del modello:** si decide con una **prova su 10 specie**, confrontando le schede generate con le nostre schede
verificate. Contano tre cose:
- la qualità dell'italiano;
- il rispetto delle fonti;
- il rispetto del formato dei dati.

Candidato di partenza: `gemma-4-26b-a4b-it` **(da verificare con la prova)**.

Con la cache ogni specie si genera **una volta sola**. Circa 50 specie nuove al giorno fanno 1.500 al mese: bastano per
tutte le specie fotografate di frequente in Italia. Per quelle rare, l'eventuale attesa è di un giorno; intanto l'app
mostra la scheda del genere o del tipo di pianta.

## Dove salvare gratis le schede generate
| Servizio | Limite gratuito | Basta? | Esito |
|---|---|---|---|
| **Upstash Redis** (già nel progetto per i contatori, [scheda](upstash.md)) | 256 MB, 500.000 comandi al mese | Circa **10.000 schede** da ~20 KB. Ogni lettura costa 1 comando: anche 100.000 aperture al mese lasciano spazio ai contatori | ✅ **Proposto** |
| Cloudflare Workers KV | 1 GB; 100.000 letture e 1.000 scritture al giorno [10] | Sì, ed è nello stesso account dell'AI | ⏸️ Alternativa |
| Copia nel repository GitHub (export periodico) | — | Utile come **archivio pubblico** e per trasformare le schede generate in schede verificate | ➕ In più, non al posto |

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì: Workers Free, 10.000 neuron al giorno | [1] |
| Uso commerciale consentito? | Non ci riguarda (progetto non commerciale, D1); i termini non distinguono | [3] |
| Serve una chiave API? | Sì: **ID dell'account + token** con permessi Workers AI, solo sul server (variabili segrete su Vercel) | [11] |
| Serve la carta di credito? | La guida non la nomina **(da verificare alla creazione dell'account)** | [11] |
| Di chi sono le schede generate? | "Inputs and Outputs… constitute Customer Content and you retain all applicable intellectual property"; la responsabilità dei contenuti è nostra | [3] |
| Obblighi | Rispettare le regole d'uso del modello scelto; per Wikipedia: citare titolo, autori (link alla cronologia), licenza CC BY-SA 4.0, e dire che il testo è stato modificato | [3][12] |

**Licenza delle schede generate.** Se una scheda usa informazioni prese da Wikipedia, la trattiamo come **opera
derivata**: licenza **CC BY-SA 4.0**, con il link alla voce e la scritta "informazioni rielaborate". È una scelta
prudente: non è chiaro se un riassunto fatto da un'AI sia un'opera derivata **(da verificare)**. Le schede verificate
scritte da noi restano nostre.

**Wikipedia e Wikidata dal server.**
- Ogni richiesta porta un `User-Agent` con il nome dell'app e un contatto [13]. Come contatto usiamo **l'indirizzo
  del repository**, non un'email personale.
- Wikidata è CC0.
- Wikipedia è CC BY-SA 4.0 [12].

## Come lo usiamo nel codice (adattatore)
```text
[Telefono] apre la scheda di "Ficus microcarpa"
     |
     v
[Server /api/scheda?specie=…] --1--> Upstash: esiste già una scheda generata?   sì → la restituisce
     |  no (e la specie viene da un riconoscimento vero, con quota per dispositivo D5)
     |--2--> raccoglie i DATI: scheda del genere Ficus (nostra), tipo di pianta, note di famiglia,
     |       Wikidata (CC0), Wikipedia it/en (CC BY-SA), EIVE/WCVP (dati aperti)
     |--3--> CardWriter (Workers AI) scrive la scheda nel formato CareSheet, citando SOLO le fonti ricevute
     |--4--> CONTROLLI automatici (sotto). Falliti? → non salva, restituisce la scheda del genere o del tipo
     |--5--> salva in Upstash (chiave "generata:<specie>") e la restituisce
     v
[Telefono] mostra "Scheda generata automaticamente" + fonti; il service worker la conserva
```

Adattatori:
- `CardWriter`: implementazione `WorkersAiCardWriter`; riserve `GroqCardWriter` e `OpenRouterCardWriter`;
- `GeneratedCardStore`: implementazione `UpstashCardStore`; alternativa `KvCardStore`.

Le chiavi restano solo sul server: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_TOKEN` (CLAUDE.md §7).

**Controlli automatici sulla scheda generata**, prima di salvarla:
1. formato `CareSheet` valido, con tutte le sezioni;
2. ogni affermazione cita una fonte **tra quelle ricevute** (identificativo della fonte), mai fonti nuove;
3. ogni **numero** compare davvero in una delle fonti ricevute; altrimenti la riga viene tolta;
4. **"Linee guida"** solo con fonti di livello A (la nostra scheda di genere o di tipo, EIVE, WCVP). Wikipedia vale
   come fonte C: va solo nei "Consigli dal pollice verde" e nelle differenze della specie, con l'etichetta "non ufficiale";
5. **tossicità:** mai "innocua". Si scrive solo ciò che dicono le nostre fonti verificate (scheda di genere, note di
   famiglia); altrimenti **"non verificata"** con il consiglio prudente;
6. i "Consigli dal pollice verde" non contraddicono le linee guida (per esempio una temperatura fuori dall'intervallo):
   se lo fanno, vengono tolti;
7. l'anti-copia si applica anche a Wikipedia (nessuna frase di 8 o più parole uguali).

## Cosa succede se il servizio non risponde o il limite è superato
L'app mostra **subito** la scheda del genere, o quella del tipo di pianta, con la scritta "La scheda di questa specie
non è ancora pronta". **Mai una risposta vuota.** La specie entra in una lista d'attesa: la si genera al giorno dopo,
oppure con la riserva (Groq, poi OpenRouter). Se Upstash non risponde, si genera senza salvare, al massimo una volta
per richiesta.

## Alternative gratuite
- Riserve online: Groq, OpenRouter **(da verificare)**.
- **Senza AI online:** le schede di genere e di tipo, già complete, più la produzione settimanale di schede verificate.
- In futuro: generazione notturna, sul PC, delle specie in lista d'attesa, con un modello locale (Ollama, D6).

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| L'AI inventa un dato | Media | Solo fonti ricevute, controllo dei numeri, linee guida solo da fonti A, tossicità mai "innocua"; etichetta "generata automaticamente" ben visibile |
| Il piano gratuito cambia o finisce | Media | Adattatore `CardWriter` con 2 riserve; le schede già salvate restano; senza AI restano genere e tipo |
| Abuso (qualcuno chiede migliaia di specie inventate) | Media | Si genera solo per specie arrivate da un vero riconoscimento Pl@ntNet e presenti nella tabella dei sinonimi; quota per dispositivo (D5); tetto giornaliero |
| Qualità dell'italiano di un modello medio | Media | Prova su 10 specie prima di scegliere; confronto con le schede verificate |
| Licenza dei testi derivati da Wikipedia | Bassa | CC BY-SA 4.0 per le schede generate, con attribuzione e la scritta "rielaborato" |

## Decisioni aperte
- Creare l'account Cloudflare (lo fa l'utente; serve il suo permesso per ogni nuovo servizio) e scegliere il modello
  dopo la prova su 10 specie.
- Confermare Upstash come archivio delle schede generate (stesso database dei contatori).

## Fonti
1. Cloudflare, "Workers AI — Pricing" (aggiornata il 2026-11-12) — https://developers.cloudflare.com/workers-ai/platform/pricing/ — consultato il 2026-11-18
2. Cloudflare, "Workers AI — Data usage" — https://developers.cloudflare.com/workers-ai/platform/data-usage/ — consultato il 2026-11-18
3. Cloudflare, "Service-Specific Terms — Developer Platform" — https://www.cloudflare.com/service-specific-terms-developer-platform/ — consultato il 2026-11-18
4. Groq, "Rate Limits" — https://console.groq.com/docs/rate-limits — consultato il 2026-11-18
5. Groq, "Your Data in GroqCloud" — https://console.groq.com/docs/your-data ; "Groq Services Agreement" — https://console.groq.com/docs/legal/services-agreement — consultati il 2026-11-18 (citazione dei termini di vendita da risultati di ricerca: **da rileggere sulla pagina**)
6. OpenRouter, "Limits" — https://openrouter.ai/docs/api-reference/limits — consultato il 2026-11-18
7. Google, "Gemini API Additional Terms of Service" (in vigore dal 2026-03-23) — https://aistudio.google.com/docs/terms — consultato il 2026-11-18
8. Mistral AI, Help Center, "How can I try the API for free with the Experiment plan?" — https://help.mistral.ai/en/articles/450104-how-can-i-try-the-api-for-free-with-the-experiment-plan — dai risultati di ricerca del 2026-11-18 (pagina non raggiungibile direttamente: **da verificare**)
9. Mistral AI, "Mistral Vibe 2.0" — https://mistral.ai/news/mistral-vibe-2-0/ — consultato il 2026-11-18
10. Cloudflare, "Workers KV — Pricing" — https://developers.cloudflare.com/kv/platform/pricing/ — consultato il 2026-11-18
11. Cloudflare, "Workers AI — REST API" — https://developers.cloudflare.com/workers-ai/get-started/rest-api/ — consultato il 2026-11-18
12. MediaWiki, "Wikimedia APIs/Content reuse" — https://www.mediawiki.org/wiki/Wikimedia_APIs/Content_reuse — consultato il 2026-11-18
13. MediaWiki, "Wikimedia APIs/Access policy" — https://www.mediawiki.org/wiki/Wikimedia_APIs/Access_policy — consultato il 2026-11-18
14. Vercel, "Vercel Functions Limits" (durata massima 300 s sul piano Hobby; aggiornata il 2026-08-24) — https://vercel.com/docs/functions/limitations — consultato il 2026-11-18

## Decisione e misure reali (2026-11-19)

- **Modello principale:** `@cf/qwen/qwen3-30b-a3b-fp8`. **Riserva:** `@cf/google/gemma-4-26b-a4b-it`, usata se qwen non
  risponde o la scheda non passa i controlli. Mistral escluso (decisione dell'utente).
- **Misure nella prova (8 schede):** qwen circa 10 secondi e **circa 63 neuron** per scheda (7 su 8 senza problemi);
  gemma circa 37 secondi e 72 neuron (1 su 8). Con 10.000 neuron al giorno: circa 150 schede al giorno.
- **Quota finita:** l'adattatore (`src/lib/schede/genera/scrittore.ts`) riconosce l'errore di quota e l'app mostra
  subito la scheda del tipo, senza riprovare e senza passare alla riserva (che userebbe la stessa quota).
- **Dove è accesa:** in locale con `R2_SPERIMENTALE=1` e nelle anteprime di Vercel; in produzione **dal 2026-11-26**
  (vedi "Pubblicazione" in fondo).
- Le regole che rendono sicura la scheda sono in `src/lib/schede/genera/regole.ts` e si provano con
  `tests/app/prova-regole-r2.mjs` (nessuna rete, nessun consumo).

## Avviso (2026-11-22): il modello principale è stato ritirato

- Cloudflare ha **ritirato `@cf/qwen/qwen3-30b-a3b-fp8` il 2026-11-20**: risponde con errore 410 ("Model has been
  deprecated"). L'adattatore lo tratta come un errore e passa alla riserva (gemma), quindi l'app non si rompe: o arriva la
  scheda di gemma, o resta la scheda del tipo.
- Prova del 2026-11-22: albero di giada → scheda di gemma, verificata; Monstera → gemma ha copiato da Wikipedia → ripiego
  sulla scheda del tipo.
- **Decisione aperta (dell'utente):** quale modello mettere al posto di qwen. Nel catalogo Cloudflare del 2026-11-22 ci
  sono, tra gli altri, `@cf/qwen/qwen3.8-27b`, `@cf/openai/gpt-oss-20b`, `@cf/zai-org/glm-4.7-flash` (da provare con le
  stesse schede prima di scegliere).
- Nel registro del server, ogni ripiego scrive il motivo e l'esito dei tentativi (`[scheda-generata] ripiego per …`).

## Gara per il sostituto (2026-11-23)

Script `scripts/gara-modelli.mjs` (codice vero dell'app, tutte le regole, ogni modello da solo, senza riserva),
10 specie della prima gara, schede in `~/test-piante/prova-r2/gara2`. Nessun modello è segnato "deprecated" nel catalogo.

| Modello | Al primo colpo | Riprova per copia | Ripiego | Secondi medi | Neuron medi |
|---|---|---|---|---|---|
| gemma-4-26b | 7 | 3 | 1 | 37 | 84 |
| glm-4.7-flash | 4 | 5 | 3 (1 tempo scaduto) | 83 | 93 |
| gpt-oss-20b | 1 | 0 | 9 ("formato non valido") | 21 | 86 |
| qwen3.8-27b | 3 | 2 | 7 (6 per tempo scaduto a 90 s) | 92 | ~600 per scheda riuscita |

- gpt-oss-20b: la risposta non è nel formato atteso dall'adattatore (causa non ancora indagata: non è detto che sia
  la qualità del modello).
- qwen3.8-27b costa circa 7-10 volte gli altri e spesso supera i 90 secondi: con 10.000 neuron al giorno farebbe solo
  15 schede circa.
- Le chiamate interrotte per tempo scaduto probabilmente si pagano lo stesso, ma lo script non ne vede i neuron: il
  consumo reale della gara può essere stato fino a circa 9.900 neuron (stima prudente; il token non può leggere le
  statistiche d'uso).
- **Scelta dell'utente (2026-11-23): principale `gemma-4-26b`, riserva `glm-4.7-flash`** (riserva cambiata il
  2026-11-25, vedi sotto). I modelli si cambiano in un
  solo punto: `src/lib/schede/genera/modelli.ts` (il commento in cima spiega come).
- Lo script della gara ora conta nel tetto il costo pieno previsto delle chiamate interrotte.

### gpt-oss-20b riparato (2026-11-23)

- Causa del "formato non valido": gpt-oss chiude il JSON con **una graffa in meno** alla fine. La lettura del JSON
  (`src/lib/schede/genera/json.ts`) ora aggiunge solo le chiusure mancanti in fondo; un JSON rotto in mezzo resta rifiutato.
- Prova (186 neuron in tutto): albero di giada 9,3 s e 111 neuron, la scheda si legge ma ha una frase copiata da
  Wikipedia (servirebbe la riprova, non fatta per restare sotto 300 neuron); Monstera **al primo colpo, 16,1 s e 75 neuron**.
- Contenuto della Monstera: corretto ma quasi uguale alla nostra scheda del tipo, nessun consiglio dal pollice verde,
  un errore di italiano ("marcare" invece di "marcire"). Due schede sono poche per sceglierlo come principale.

## Gara di gpt-oss-20b riparato e nuova riserva (2026-11-25)

Stesse 10 specie, stesso script e stesso codice di generazione del 2026-11-23, riprova per copia attiva, nessuna riserva.
Consumo: **894 neuron** (tetto 1.490), nessuna specie saltata. Schede ed esempi in `~/test-piante/prova-r2/gara3`.

| | gemma-4-26b (23/11) | glm-4.7-flash (23/11) | gpt-oss-20b riparato (25/11) |
|---|---|---|---|
| Al primo colpo | 7 | 4 | 6 |
| Riprove per copia (riuscite) | 3 (2) | 5 (3) | 1 (0) |
| Ripieghi | 1 | 3 | 4 |
| Secondi medi | 37,3 | 83,4 | 8,9 |
| Neuron medi | 84 | 93 (senza la chiamata scaduta) | 89 |
| Schede riuscite (di cui "non verificate") | 9 (2) | 7 (1) | 6 (1) |
| Neuron per scheda riuscita | 94 | 133 (senza la chiamata scaduta) | 149 |
| Frasi identiche alla nostra scheda del tipo | 0% | 16% | 65% |
| Consigli dal pollice verde in tutto | 34 | 16 | 11 (3 sono "Non indicata dalle fonti.") |

- "Frasi identiche": riassunti e cose da fare delle sezioni, parola per parola (senza accenti e punteggiatura), solo specie
  con una fonte A. L'anti-copia guarda solo Wikipedia: copiare la nostra scheda del tipo non è vietato, ma aggiunge poco.
- Ripieghi di gpt-oss: albero di giada e Kalanchoe "formato non valido" (causa non accertata: il testo grezzo non si
  salvava), spatifillo "riassunto vuoto" (linee guida senza fonti A valide), Ficus copia → copia.
- I secondi sono di giorni diversi: il 23/11 lo stesso gpt-oss impiegava 20,7 s di media.
- Difetti visti leggendo le schede di gpt-oss: Zamioculcas, "ideale 16-29 °C" (nella fonte vale per la monstera) e
  "guarda la scheda della specie quando sarà pronta"; Aloe, un consiglio che riguarda l'albero di giada.
- **Da correggere (non ancora fatto):** nei consigli dal pollice verde le regole lasciano passare "Non indicata dalle
  fonti." (visto sul basilico).
- **Scelta dell'utente (2026-11-25): principale `gemma-4-26b`, riserva `gpt-oss-20b`** al posto di `glm-4.7-flash`, troppo
  lento come riserva. Si applica in `src/lib/schede/genera/modelli.ts`.
- **Testo grezzo nel registro (2026-11-25):** quando una risposta è scartata per "formato non valido", il server scrive
  `[scheda-generata] formato non valido · modello · specie · … · testo grezzo: …`, anche se poi la riserva riesce. Il testo
  è su una riga, al massimo circa 20.000 caratteri, con le chiavi oscurate (`src/lib/schede/genera/registro.ts`). Non
  arriva mai al telefono. Sui piani gratuiti di Vercel il registro dura poco **(da verificare)**: va copiato presto.

## Schede salvate e riusate in Upstash (2026-11-25)

- **Ordine:** memoria del server → Upstash → generazione. Se la scheda c'è, Cloudflare non viene chiamato (0 neuron).
- **Si salva solo** una scheda che ha passato i controlli, comprese quelle "NON VERIFICATA". **I ripieghi non si salvano:**
  la volta dopo si riprova, quindi una specie che fallisce sempre consuma neuron a ogni tentativo.
- **Versione delle regole:** `VERSIONE_REGOLE` in `src/lib/schede/genera/versione-regole.ts`, dentro la chiave. Va aumentata
  di 1 quando cambiano regole o istruzioni al modello: nessuna scheda vecchia si usa più (spariscono dopo un anno). Se
  qualcuno se ne dimentica, `tests/app/prova-regole-r2.mjs` fallisce e scrive l'impronta nuova.
- **Impronta delle fonti A (2026-11-25):** nella chiave c'è anche l'impronta della scheda del tipo e della nota di famiglia
  (per intero, tossicità compresa). Se una cambia, si rigenerano **da sole** solo le schede che la usano, alla prima
  richiesta. Wikipedia (fonte C) non è nell'impronta.
- **Data in fondo alla scheda:** "generato al momento" solo per chi l'ha appena fatta generare; dal salvataggio e dal Vivaio
  "generato il [data]". Le piante messe nel Vivaio prima di questa modifica non hanno la data: "generato automaticamente".
- **Cambiare modello non cambia la versione:** le schede già salvate restano quelle del modello precedente.
- **Scheda rovinata nell'archivio:** si rigenera.
- **Upstash fermo o quota mensile finita:** si genera senza salvare, come prima.
- `CLOUDFLARE_API_URL` (facoltativa, non segreta) serve solo alle prove automatiche con un Cloudflare finto.

Chiavi, scadenze e numero di comandi: [scheda Upstash](upstash.md).

## Preparazione anticipata (2026-11-25)

`node scripts/prepara-schede.mjs` genera e salva in Upstash le schede delle specie di `data/elenco-priorita.json` che hanno
una scheda del tipo con fonti A, con lo stesso codice dell'app (`servizio.ts`). `--elenco` dice solo cosa farebbe.
- **Tetto per giorno** (`TETTO_NEURON`, predefinito 6.000): si ferma prima di poterlo superare. Conta solo i neuron di questo
  script: il token non può leggere il consumo dell'account. Se Cloudflare dice che la quota è finita, si ferma.
- **Ripresa:** le schede già salvate si saltano; i ripieghi di prima si riprovano per ultimi. Il ricordo sta in
  `~/test-piante/prepara-schede`.
- Nome e famiglia vengono da GBIF, come quelli che manda il telefono (controllati con le risposte Pl@ntNet del test D9,
  flora `k-world-flora`: coincidono per le specie viste; 6 specie non erano in quelle risposte).
- Prova senza neuron: `tests/app/prova-prepara-schede.mjs`.

**Primo lancio:** 24 generate (tutte con gemma, 22 al primo colpo e 2 dopo la riprova per copia), 0 ripieghi, 42 saltate
senza fonte A, 1 saltata perché solo genere (Phalaenopsis). **1.694 neuron**, circa 71 a scheda.

**Difetti trovati rileggendo le 24 schede (corretti con la versione 2 delle regole, vedi sotto):**
- **Monstera (serio):** "Mantieni la temperatura tra i 10 e i 13 °C" nelle linee guida; nella fonte è la *minima*. Il
  controllo dei numeri vede che il numero c'è, non che cosa significa.
- **Moltiplicazione:** il consiglio generico del tipo ("talea con un nodo") diventa un consiglio della specie anche dove
  probabilmente non è il metodo giusto (Strelitzia, spatifillo, sansevieria, zamioculcas: da verificare con fonti).
- **Dracaena fragrans e Maranta:** parti delle linee guida finite nel pollice verde o "Non indicata dalle fonti", perché il
  modello ha citato insieme fonti A e Wikipedia.
- **Zamioculcas:** "può purificare l'aria" nel riassunto, che non cita fonti.
- **Falangio:** "consulta la scheda specifica della specie quando sarà pronta" dentro la scheda della specie.
- **Hoya:** un consiglio del pollice verde che non è un consiglio ("portamento lianoso").

## Versione 2 delle regole (2026-11-25)

Nate dai difetti qui sopra, sono in `regole.ts` (regole 7a-7e) e nelle istruzioni al modello; prove in `prova-regole-r2.mjs`.
- **7a, significato dei numeri:** se nella fonte un numero è solo una minima, una massima, un "almeno" o una soglia di danno,
  la frase deve dirlo, con la stessa unità; altrimenti si toglie. Vale per linee guida e pollice verde. Sulle 73 frasi con
  numeri delle prime schede ne toglie una: quella sbagliata della Monstera.
- **7b, moltiplicazione nota solo per il tipo:** "Per molte piante di questo tipo: … Non è detto che valga per questa specie.";
  le azioni iniziano con "In generale:"; niente tra le cose da fare in cima né nel riassunto.
- **7c, vietate** promesse (aria pulita, fortuna, usi medicinali) e frasi sull'app o sulle schede, anche nel pollice verde.
- **7d, fonte A e Wikipedia citate insieme:** nelle linee guida resta solo ciò che la fonte A dice; il resto va nel pollice verde.
- **7e, pollice verde:** il consiglio deve contenere un'azione, altrimenti si toglie (anche "Non indicata dalle fonti.").

**Rigenerazione:** 24 schede su 24 (23 gemma; Monstera con la riserva gpt-oss dopo due copie), 0 ripieghi, **1.786 neuron**.

| | Versione 1 | Versione 2 |
|---|---|---|
| Sezioni "Non indicata dalle fonti." con fonte A | 9 | 0 |
| Consigli dal pollice verde | 47 | 27 |
| Cose da fare nelle sezioni | 573 | 603 |

Rilette per intero Monstera, Strelitzia, Zamioculcas, falangio, le tre Dracaena e Hoya; delle altre 16 riassunto, temperature
e pollice verde. I difetti segnalati sono spariti.

**Restano da valutare:**
- **Pollice verde in contrasto con le linee guida** (Dracaena fragrans): Wikipedia dice "due volte a settimana in estate", la
  fonte A dice di controllare con il dito. La frase è davvero nella fonte, ma non dovrebbe stare accanto alla linea guida.
- **Azioni forzate:** per dire sempre cosa fare, il modello trasforma descrizioni in consigli (sansevieria: "Usa un terreno
  sabbioso o roccioso se vuoi replicare l'habitat naturale").
- **Consigli utili persi:** la talea di foglia della Zamioculcas e il rizoma della sansevieria non compaiono più.
- **Monstera (gpt-oss):** corretta, ma molte frasi sono uguali alla scheda del tipo, con qualche plurale ("Tienile lontane").
  Dice "in generale" anche cose che la fonte riferisce proprio alla monstera.
- **Strelitzia:** "è importante seguire le indicazioni specifiche per la specie", frase senza contenuto.

## Versione 3 delle regole (2026-11-25)

- **8a, pollice verde in contrasto:** si toglie un consiglio con frequenza, quantità o temperatura diversa dalle linee guida
  della stessa sezione. In "acqua", se la linea guida dice di controllare il terriccio, si toglie ogni frequenza fissa.
  Se la linea guida non dà il dato, non c'è contrasto. Effetto da sapere: cade anche una minima più prudente di Wikipedia
  (15 °C contro i 10 °C della scheda del tipo: spatifillo, filodendro, scindapsus, Dracaena fragrans).
- **8b, frasi senza contenuto pratico** tolte da riassunto e linee guida ("segui le indicazioni specifiche", "richiede
  un'attenzione particolare", "esistono diversi metodi"); se il resto della frase è utile, si taglia solo il pezzo vuoto.
- **Moltiplicazione della specie:** le istruzioni chiedono di riportare nel pollice verde il metodo che Wikipedia cita, con le
  parole della fonte; se non ne cita, non inventarlo (Strelitzia).
- **8c, scheda quasi vuota (aggiunta durante la prova):** con la scheda del tipo disponibile, 3 o più sezioni su 8 senza linee
  guida → non passa (riserva, poi ripiego). Il testo grezzo va nel registro, come per "formato non valido".

**Cosa è successo nella prova.** Il primo lancio (24 schede, 1.872 neuron) ha dato **10 schede quasi vuote** che passavano i
controlli: non sono mai state usate dall'app e sono state tolte da Upstash. Causa probabile: gemma a volte lascia vuoto il
campo "fonti" delle linee guida (visto in una sezione della Strelitzia) e le regole le cancellano. Nelle 10 schede non si può
dimostrare, perché il testo grezzo non era salvato. Tre chiamate di diagnosi (201 neuron) sono uscite buone e sono state
salvate, poi due rigenerate (153 neuron). In tutto **2.226 neuron** su 2.500.

**Stato in Upstash: 17 schede su 24.** Mancano pothos, spatifillo, Aloe, anturio, Maranta, Peperomia e Curio: si generano alla
prima richiesta o rilanciando `prepara-schede.mjs`. La Zamioculcas è quella del primo lancio con la regola 8b riapplicata a
mano (la rigenerata aveva due sezioni vuote).

**Restano:** le fonti dimenticate (qualche sezione "Non indicata dalle fonti": falangio e Strelitzia in "Coltivarla da zero");
la Monstera di gpt-oss che parla del pothos in "Coltivarla da zero"; nel falangio restano solo gli stoloni del pollice verde.

## Versione 4 delle regole (2026-11-26)

Regole 9a-9d in `regole.ts`, nomi delle altre piante in `altre-piante.ts`, prove in `prova-regole-r2.mjs` (143 controlli).
- **9a, fonte dimenticata:** se una sezione delle linee guida non cita fonti, ogni frase che la fonte A dice davvero (parole,
  numeri e frequenze, come in 7d) si attribuisce a lei; le altre vanno nel pollice verde e restano solo se Wikipedia le dice.
- **9b, consigli più prudenti:** la regola 8a non toglie più dal pollice verde una minima più alta, una massima più bassa,
  annaffiature o concimazioni meno frequenti, metà dose. Toglie solo ciò che è meno prudente o contraddice (per il travaso
  "meno spesso" resta un contrasto). Lo spatifillo ha di nuovo "sempre sopra i 15 °C" nel pollice verde.
- **9c, altre piante:** si toglie il pezzo di frase (tra virgole) che nomina un'altra pianta dell'elenco
  (`data/elenco-priorita.json`, nomi scientifici e comuni, "rosa" esclusa perché è anche un colore). Restano i confronti che
  una fonte su QUESTA pianta fa (Wikipedia, non la scheda del tipo) e i prodotti ("concime per i pomodori").
- **9d, riassunto della sezione mancante (trovata durante la prova):** il modello a volte scrive solo le "cose da fare", con
  la fonte giusta, ma senza riassunto: la sezione veniva buttata. Ora la prima cosa da fare fa da riassunto.
- **8b ampliata:** "tramite strutture specifiche della pianta", "dipende dalla specie".
- **Testo grezzo delle schede scartate:** ogni tentativo scartato (copia, formato, quasi vuota, controlli) va nel registro del
  server e nel tentativo; `prepara-schede.mjs` lo salva in `~/test-piante/prepara-schede/scartate` (fuori dal repository).

**Cosa ha mostrato il testo grezzo.** Le schede quasi vuote del 25 novembre NON erano fonti dimenticate: in tutte le 8 sezioni
gemma aveva scritto le cose da fare con la fonte "S1", ma senza "riassunto" (falangio, Dracaena marginata, Aloe). Da qui la 9d.

**Generazione:** **24 schede su 24 in Upstash** (23 gemma, Aloe con la riserva gpt-oss), **2.417 neuron** su un tetto di 4.000,
compresi i tentativi scartati (9) e la rigenerazione di falangio e Strelitzia dopo l'ampliamento della 8b. Schede quasi vuote
salvate: **0**. Sezioni "Non indicata dalle fonti": 3 su 192, tutte "Coltivarla da zero" (falangio, Maranta, Strelitzia),
perché la scheda del tipo "foglia tropicale" dice solo "talea di fusto" in generale.

**Restano:** il pollice verde è scarno (in 10 schede su 24 nessun consiglio); la nota sulla tossicità della scheda del tipo "foglia
tropicale" parla di aracee anche per falangio e Strelitzia (è un nostro testo copiato apposta, regola 4b, non lo tocca la 9c).

## Versione 5: tossicità solo per la pianta riconosciuta (2026-11-26)

**Problema:** la nota di tossicità della scheda del tipo "foglia tropicale" parlava delle aracee anche per falangio e
Strelitzia, e il valore in grande ("Dipende dalla specie") non aveva senso per una specie già riconosciuta.

**Soluzione** (`src/lib/schede/tossicita.ts`, usata sia dalla scheda del tipo sia dalle schede generate):
1. **Caso verificato** per genere o specie (pothos, monstera, filodendro, Crassula, Kalanchoe, Phalaenopsis): come prima.
2. Altrimenti le **frasi** della nota (`tossicita.frasi` nelle 4 schede del tipo) che riguardano il **genere o la famiglia**
   della pianta, più quelle valide per tutte (senza `per`), con il valore **"Non verificata"**, coerente con frasi come
   "non abbiamo ancora due fonti".
3. Se non ne resta nessuna: **"Non verificata" con la nota prudente** ("Non abbiamo dati verificati sulla tossicità: per
   prudenza tienila lontana da bambini e animali."), senza fonti.

Le frasi riprendono le parole già verificate delle note, divise per gruppo (Araceae, Crassulaceae, Orchidaceae): nessun
fatto nuovo. `npm run schede:controlla` controlla anche le frasi (testo, solo fonti A). Il Vivaio passa la famiglia salvata;
per le piante salvate senza famiglia restano solo le frasi del genere o valide per tutte.

**Schede generate:**
- la tossicità **non si dà più al modello** nel testo della scheda del tipo (non la scrive lui: regola 4);
- **si ricalcola a ogni lettura** dalle nostre fonti di oggi (`trovaOGenera`), quindi non resta mai vecchia in Upstash;
- per questo l'**impronta delle fonti A non comprende più la tossicità**: cambiarla non obbliga a rigenerare.

**Migrazione, 0 neuron:** le chiavi sono cambiate tutte (versione 5 e impronta nuova). Rigenerare le 24 schede sarebbe
costato circa 1.700 neuron, oltre il tetto di 1.000. Il testo scritto dal modello non dipende dalla tossicità (la regola 4
la toglie sempre), quindi le **24 schede r4 sono state copiate sotto le chiavi r5** con la tossicità ricalcolata e la loro
data originale. Le chiavi r4 restano e scadono da sole. Risultato: 24 su 24 in Upstash; 19 con la tossicità cambiata, 5 invariate.
- falangio, Strelitzia, Maranta, Dracaena, Aloe, Hoya e le altre non aracee: "Non verificata" con la nota prudente;
- aracee senza caso (spatifillo, anturio, aglaonema, dieffenbachia, zamioculcas, scindapsus, singonio): "Non verificata"
  con le sole frasi sulle aracee;
- pothos, monstera, filodendro, Crassula e Kalanchoe: invariati ("Tossica").

## Pubblicazione in produzione (2026-11-26)

Dopo la prova finale sull'iPhone (versione 5 delle regole, 24 schede pronte in Upstash) il ramo `anteprima-r2` è stato
portato su `main`. Etichetta git **`prima-di-r2`** sul main di prima (62bbf33), per tornare indietro.
- **Accesa su Vercel** (anteprime e produzione) da `route.ts`; in locale solo con `R2_SPERIMENTALE=1`, così le prove
  automatiche non consumano neuron.
- **Spegnerla in emergenza, senza toccare il codice:** su Vercel, Settings → Environment Variables, aggiungere
  `R2_SPENTA` = `1` (Production), poi Deployments → Redeploy. L'app torna alla scheda del tipo, senza messaggi d'errore.
- **Tornare del tutto a prima:** su Vercel, Deployments → l'ultima pubblicazione di `62bbf33` → "Promote to Production";
  oppure un nuovo commit su `main` con i file
  dell'etichetta (`git checkout prima-di-r2 -- .`), senza riscrivere la storia. Le schede in Upstash non danno fastidio.
- **Rischio noto:** `/api/scheda-generata` non ha un limite per telefono. Chi la chiamasse di continuo con nomi diversi
  esaurirebbe i 10.000 neuron del giorno (gratuiti: nessun costo); l'app ripiegherebbe sulla scheda del tipo fino a
  mezzanotte UTC. Da legare alla quota del telefono in un passo successivo.
