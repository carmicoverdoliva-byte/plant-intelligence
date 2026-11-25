# Upstash Redis (piano gratuito) — scheda

> Ultima verifica dei limiti: 2026-11-18 · **In uso nel ramo di anteprima dal 2026-11-25** · Sito ufficiale: https://upstash.com · Decisione collegata: [D4](../architecture/decisioni-da-prendere.md)

## In breve
Upstash Redis è un piccolo **database online**. Ci teniamo due cose:
- il **contatore dei riconoscimenti** di ogni telefono (10 al giorno, D5);
- le **schede di cura generate** (D6, D13), una per specie, uguali per tutti.

Il piano gratuito basta e non chiede la carta di credito. Non contiene dati personali: solo impronte anonime, numeri e
testi delle schede. Il database è a Francoforte, creato dall'utente il 2026-11-25.

## Cosa usiamo e perché
- Lo legge e lo scrive solo il **server** (funzioni di Next.js su Vercel). Le chiavi `UPSTASH_REDIS_REST_URL` e
  `UPSTASH_REDIS_REST_TOKEN` stanno in `.env.local` e nelle impostazioni segrete di Vercel: il telefono non le vede mai.
- Si usa con normali richieste HTTPS, un comando alla volta: **nessuna libreria in più** (`src/lib/upstash.ts`).

| Cosa | Chiave | Contenuto | Scade |
|---|---|---|---|
| Quota del telefono | `quota:<data italiana>:<impronta>` | un numero | a **mezzanotte ora italiana** (ora legale compresa) |
| Scheda generata | `scheda:r<versione>:<specie>\|<genere>\|<famiglia>:<impronta delle fonti A>` | la scheda completa, circa 6 KB | dopo 1 anno |

- **Codice del telefono:** un codice casuale creato dall'app e ricordato sul telefono (`src/lib/riconoscimento/telefono.ts`).
  Il server ne conserva solo un'**impronta** (SHA-256 accorciata), mai il codice né l'indirizzo di rete.
- **Genere e famiglia nella chiave della scheda:** arrivano dal telefono e decidono il tipo e la tossicità. Se qualcuno li
  mandasse sbagliati, la sua scheda non finirebbe mai al posto di quella giusta.
- **Versione delle regole:** `src/lib/schede/genera/versione-regole.ts`. Vedi [schede generate](ai-schede-generate.md).
- **Spazio:** 250 MB bastano per circa 40.000 schede (stima).

### Quanti comandi si usano
| Caso | Comandi |
|---|---|
| Riconoscimento | **1** (INCR); **2** al primo della giornata (più EXPIREAT) |
| Riconoscimento non riuscito (Pl@ntNet fermo) | 2 (INCR e DECR: viene restituito) |
| Scheda già ricordata dal server acceso | **0** |
| Scheda già in Upstash | **1** (GET) |
| Scheda nuova, generata e salvata | **2** (GET e SET) |
| Scheda nuova ma scartata (ripiego) | 1 (GET) |

**Un riconoscimento con scheda usa di solito 2 comandi, al massimo 4** (primo della giornata e scheda nuova). Con tutte le
500 identificazioni gratuite di Pl@ntNet ogni giorno: 30.000-60.000 al mese, cioè **il 6-12% dei 500.000** (stima).
Riaprire una pianta dal Vivaio: 0 comandi.

## Limiti del piano gratuito
| Risorsa | Limite gratuito | Fonte |
|---|---|---|
| Comandi al mese | **500.000** | [1][2] |
| Spazio dati | 250 MB (una tabella della stessa pagina indica 256 MB) | [1][2] |
| Traffico al mese | 10 GB | [1][2] |
| Database | 1 per account gratuito | [2][3] |
| Comandi al secondo | 10.000 | [1] |
| Dimensione massima di una richiesta | 10 MB | [1] |

**Quando si supera un limite:**
- **comandi del mese:** i comandi in più "restituiscono un errore" [4]. L'app lo deve gestire (vedi sotto);
- **comandi al secondo:** le richieste vengono rallentate per un po' [4].

**Inattività:** un database gratuito viene **archiviato** dopo **almeno 30 giorni senza uso**, con più email di avviso
prima. Upstash fa una copia dei dati, che si può ripristinare dalla console [4]. Per noi:
- con l'app in uso i contatori lavorano tutti i giorni;
- durante lo sviluppo, se il progetto restasse fermo più di un mese, potrebbe servire un ripristino. Nessun dato importante
  andrebbe perso: i contatori sono giornalieri e le schede si rigenerano.

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì: "ogni account parte con un database gratuito" | [3] |
| Uso commerciale consentito? | Le condizioni generali non lo vietano e non lo citano per il piano gratuito; il nostro uso comunque non è commerciale (D1) | [5] |
| Serve una chiave API? | Sì: indirizzo e token del database, da tenere **solo** nelle variabili d'ambiente del server (`.env.local` sul PC, impostazioni segrete su Vercel) | [3] |
| Serve la carta di credito? | **No** per il piano gratuito [3]. ⚠️ **Non aggiungere una carta**: "un account con un metodo di pagamento non può avere database gratuiti" e inserendola il database passa al piano a consumo [1][3] | [1][3] |
| Obblighi (attribuzione, logo…) | Nessuno indicato | [5] |

## Come lo usiamo nel codice (adattatore)
- `QuotaStore` → `UpstashQuotaStore` (`src/lib/riconoscimento/quota-server.ts`).
- `GeneratedCardStore` → `UpstashCardStore` (`src/lib/schede/genera/archivio.ts`).

Cambiare servizio (per esempio Cloudflare D1 o KV) significa scrivere un'altra implementazione, senza toccare il resto.
Nelle prove automatiche (`tests/app/prova-identify.mjs`) Upstash è finto: non consumano comandi.

## Cosa succede se il servizio non risponde o il limite è superato
Vale per: quota mensile finita, rete, chiave sbagliata, database archiviato. L'attesa massima è di 1,5 secondi; poi per
60 secondi Upstash non viene richiamato, così l'app non rallenta. Nel registro del server resta solo il motivo, senza chiavi.
- **Riconoscimento:** funziona. Valgono i limiti di prima: 10 al giorno contati dal telefono, 15 per rete, la riserva di Pl@ntNet.
- **Schede:** si generano senza salvarle.
- **Utente:** nessun errore tecnico. Quando Upstash torna, la quota torna a valere.

Il tetto di 15 per rete resta **anche con Upstash attivo**: chi cancella i dati del browser ottiene un codice nuovo, ma
trova comunque il tetto della rete (non preciso: vale per ogni copia del server).

## Alternative gratuite
- **Cloudflare D1 o KV**, se in futuro si passasse a Cloudflare (D2-B, D4-B).
- **Nessun contatore per dispositivo** (D4-C): solo il numero di identificazioni rimaste che dà Pl@ntNet. Più semplice, ma
  un solo utente potrebbe consumare tutte le 500 del giorno.

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| Database archiviato durante una pausa dello sviluppo | Media | Ripristino dalla console [4]; le schede si possono rigenerare |
| Carta di credito aggiunta per errore → passaggio al piano a consumo | Bassa | Avviso qui e nei passi di configurazione; non serve mai una carta |
| Superamento dei 500.000 comandi | Bassa (ne servono al massimo ~60.000) | Un solo comando per riconoscimento; ripiego descritto sopra |
| Schede vecchie dopo un cambio di regole o di tossicità | Media | Versione nella chiave; una prova automatica fallisce se regole o fonti cambiano |
| Upstash cambia i limiti gratuiti | Media | Adattatore `QuotaStore` sostituibile |

## Prova vera (2026-11-25)
Upstash e Cloudflare reali, Pl@ntNet finto:
- albero di giada: prima volta 44,1 s (gemma), seconda **10 ms** dalla memoria; dopo aver riacceso il server senza chiavi di
  Cloudflare **121 ms** da Upstash, scheda identica;
- quota: dal primo al decimo riconoscimento restano 9, 8, … 0; l'undicesimo è fermato. 12 comandi in tutto;
- scadenza del contatore letta da Upstash: 23:59:59 ora italiana;
- con la chiave sbagliata il riconoscimento funziona lo stesso.

## Decisioni aperte
- **Prima di accendere le schede generate in produzione:** `/api/scheda-generata` accetta qualunque nome di pianta. Qualcuno
  potrebbe chiamarla molte volte e consumare comandi e neuron. Si può legare alla quota del telefono o ai soli nomi
  riconosciuti da Pl@ntNet.
- Anteprima e produzione usano **lo stesso database**. Oggi la produzione non lo usa ancora.

## Fonti
1. Upstash, "Redis Pricing" — https://upstash.com/pricing/redis — consultato il 2026-11-18
2. Upstash Docs, "Pricing & Limits" — https://upstash.com/docs/redis/overall/pricing — consultato il 2026-11-18
3. Upstash Docs, "Pricing & Billing" — https://upstash.com/docs/redis/overall/billing — consultato il 2026-11-18
4. Upstash Docs, "FAQ" (Redis) — https://upstash.com/docs/redis/help/faq — consultato il 2026-11-18
5. Upstash, "Terms of Service" (aggiornati ad aprile 2025, secondo il documento) — https://upstash.com/trust/terms.pdf — consultato il 2026-11-18 tramite i risultati di ricerca (testo completo **da rileggere**)
