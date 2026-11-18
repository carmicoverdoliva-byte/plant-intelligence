# Vercel (piano Hobby) — scheda

> Ultima verifica: 2026-11-18 · Sito ufficiale: https://vercel.com · Decisione collegata: [D2](../architecture/decisioni-da-prendere.md)

## In breve
Vercel è il servizio che **ospita l'app online**: tiene i file della PWA e fa girare le piccole parti di server di Next.js
(le "funzioni", per esempio `/api/identify`, che usa la chiave di Pl@ntNet senza mandarla al telefono). Il piano **Hobby**
è gratuito e non chiede la carta di credito. Vale solo per uso **personale o non commerciale**: il nostro progetto lo è
(D1), con un dubbio sulle donazioni, spiegato sotto.

## Cosa usiamo e perché
- **Hosting della PWA** (pagine, file statici, service worker) con indirizzo `https`, necessario per usare fotocamera e
  installazione sulla Home dell'iPhone.
- **Funzioni di Next.js** per le chiamate che usano chiavi segrete (Pl@ntNet, contatori su Upstash): le chiavi stanno
  nelle **impostazioni segrete** del progetto su Vercel, mai nel codice (CLAUDE.md §7).
- Pensato per Next.js: nessuna configurazione particolare.

## Limiti del piano gratuito
Valori del piano Hobby al mese [1][2]:

| Risorsa | Inclusa | Cosa vuol dire per noi |
|---|---|---|
| Traffico in uscita (Fast Data Transfer) | 100 GB | La PWA pesa pochi MB. Il modello dell'anteprima live (87 MB) **non** passa da Vercel: si scarica da Hugging Face (D10) |
| Richieste alla rete di distribuzione (CDN Requests) | 1.000.000 | Ampiamente sufficiente per un progetto personale |
| Esecuzioni delle funzioni (Function Invocations) | 1.000.000 | Al massimo 500 riconoscimenti al giorno (~15.000 al mese) più i contatori: molto sotto il limite |
| Tempo di calcolo delle funzioni (Active CPU) | 4 ore | Le nostre funzioni aspettano soprattutto Pl@ntNet: l'attesa non conta come calcolo [3] |
| Memoria delle funzioni (Provisioned Memory) | 360 GB-ore | Da tenere d'occhio nella dashboard **(da verificare con l'uso reale)** |
| Trasformazioni di immagini | 5.000 | Non le useremo: le foto si riducono sul telefono |
| Pubblicazioni al giorno | 100 | Sufficienti |
| Durata massima di una funzione | 300 s | Pl@ntNet risponde in pochi secondi |
| **Dimensione massima di una richiesta** | **4,5 MB** [3] | Conta per l'invio delle foto: 1-5 foto ridotte (lato corto 1280 px, JPEG 90%) devono stare insieme sotto i 4,5 MB. Oltre, errore 413 |

**Se si superano i limiti:** "nella maggior parte dei casi" bisogna aspettare **30 giorni** prima di poter usare di nuovo
la funzione [2]. Non si paga nulla in automatico: il piano Hobby non ha fatturazione [2].

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì, piano Hobby gratuito | [2] |
| Uso commerciale consentito? | **No.** Termini di servizio, §4: il piano Hobby è solo per "uso personale o non commerciale" | [4] |
| Cosa conta come "commerciale"? | Le pagine ufficiali attuali **non lo definiscono**: nessuna occorrenza di "commercial" nelle linee guida d'uso, nei prezzi e nelle FAQ, verificato il 2026-11-18 | [1][4] |
| Le **donazioni** sono ammesse? | **Da verificare.** Nessuna pagina ufficiale attuale ne parla. Versioni precedenti delle linee guida e alcuni messaggi del forum dicevano che chiedere donazioni non è uso commerciale, ma oggi quella frase non c'è più | [1][5] |
| Serve una chiave API? | No per ospitare l'app. Serve un account Vercel, collegato a GitHub per pubblicare dal repository | [2] |
| Serve la carta di credito? | No per Hobby. La carta serve solo per passare a Pro | [2] |
| Obblighi (attribuzione, logo…) | Nessuno indicato | [4] |

## Come lo usiamo nel codice (adattatore)
Vercel non è un servizio chiamato dal codice: è il posto dove il codice gira. Per restare **sostituibili** (CLAUDE.md §4):
- niente funzioni proprie di Vercel nel codice dell'app (niente `@vercel/*` obbligatori). Si usano solo funzioni standard
  di Next.js, che girano anche su altri hosting;
- le chiavi si leggono da variabili d'ambiente standard (`process.env`), uguali in locale (`.env.local`) e online.

## Cosa succede se il servizio non risponde o il limite è superato
- **Limite mensile superato:** la funzione interessata si ferma fino a 30 giorni [2]. Se succedesse con le funzioni,
  l'app sul telefono continua a mostrare collezione e schede (sono sul telefono), ma il riconoscimento completo si ferma:
  messaggio chiaro, come per la quota di Pl@ntNet (F13).
- **Vercel non raggiungibile:** se l'app è installata sulla Home, il service worker mostra comunque le pagine salvate
  (F16); riconoscimento e contatori non funzionano finché il servizio non torna.

## Alternative gratuite
- **Cloudflare Workers con OpenNext** (D2, opzione B): 100.000 richieste al giorno, uso commerciale da verificare nei loro
  termini; serve più configurazione.
- **Netlify** (D2, opzione C): limiti e termini da verificare.
- **Solo pagine statiche** (es. GitHub Pages, già usato per la prova D11) **più** un piccolo server altrove per la chiave
  di Pl@ntNet: possibile, ma più pezzi da gestire.

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| Le donazioni vengono considerate uso commerciale | Media | Nessuna richiesta di donazioni dentro l'app finché non è chiarito (vedi "Decisioni aperte") |
| Vercel cambia le condizioni del piano Hobby | Media | Possono farlo in qualsiasi momento [4]. Il codice resta portabile, senza funzioni proprie di Vercel |
| Foto troppo pesanti per il limite di 4,5 MB | Bassa | Riduzione sul telefono (F03); controllo del peso totale prima dell'invio |
| Le funzioni girano negli Stati Uniti (regione predefinita `iad1`) | Certa, se non la cambiamo | Si può cambiare la regione predefinita [3], per esempio Francoforte o Parigi, più vicine a Pl@ntNet (Montpellier). Che si possa fare anche con Hobby è **da verificare** al momento della configurazione. La pagina Privacy (F15) dirà dove passano le foto |

## Decisioni aperte
- **Donazioni con Vercel Hobby.** D1 ammette le donazioni volontarie, ma i termini di Vercel non dicono se sono ammesse.
  - **A. (consigliata)** Per ora **nessuna richiesta di donazioni nell'app**; se mai servirà, un link solo nel repository
    GitHub. Si può chiedere conferma al supporto di Vercel prima di aggiungerle.
  - B. Chiedere subito al supporto di Vercel.
  - C. Usare un altro hosting (Cloudflare) se le donazioni dentro l'app sono importanti.

  La v1 non prevede donazioni, quindi questa scelta **non blocca** il passo 0.5.

## Fonti
1. Vercel Docs, "Fair Use Guidelines" (aggiornata il 2026-11-12) — https://vercel.com/docs/limits/fair-use-guidelines — consultato il 2026-11-18
2. Vercel Docs, "Vercel Hobby Plan" (aggiornata il 2026-11-12) — https://vercel.com/docs/plans/hobby — consultato il 2026-11-18
3. Vercel Docs, "Vercel Functions Limits" (aggiornata il 2026-08-24) — https://vercel.com/docs/functions/limitations — consultato il 2026-11-18
4. Vercel, "Terms of Service" (ultimo aggiornamento 19 ottobre 2026), §4 — https://vercel.com/legal/terms — consultato il 2026-11-18
5. Vercel Community, "Donations on the Hobby plan" (domanda di un utente del 2026-10-13, senza risposta dello staff) — https://community.vercel.com/t/donations-on-the-hobby-plan/50665 — consultato il 2026-11-18 (solo come segnale, non come fonte ufficiale)
