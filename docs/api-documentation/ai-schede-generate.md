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
- **Dove è accesa:** in locale con `R2_SPERIMENTALE=1` e nelle anteprime di Vercel; **spenta in produzione** finché
  l'utente non dà l'ok.
- Le regole che rendono sicura la scheda sono in `src/lib/schede/genera/regole.ts` e si provano con
  `tests/app/prova-regole-r2.mjs` (nessuna rete, nessun consumo).
