# Decisioni da prendere insieme

> Ultimo aggiornamento: 2026-11-16 · Collegati: [architettura](architettura.md), [specifiche funzionali](../requirements/specifiche-funzionali.md)

Queste scelte sono importanti o difficili da cambiare dopo, quindi **non le prende Claude da solo**. Per ognuna ci sono le
opzioni, i pro e i contro e una **raccomandazione**. Quando una decisione è presa, scriviamo qui la scelta e la data, e
aggiorniamo i documenti collegati.

**Stato:** D1-D9 **decise il 2026-11-16** (tutte secondo la raccomandazione, con le aggiunte indicate in D3, D5 e D8).
**Prossimo passo:** il test delle foto (D9), poi la verifica dei termini di Vercel (D2).
**Aperte dal 2026-11-17:** D10 e D11 (anteprima live).

---

## D1 — L'app resterà non commerciale?
**Perché conta:** Open-Meteo è gratis solo senza pubblicità né abbonamenti, e il piano Hobby di Vercel è probabilmente
riservato all'uso non commerciale. Pl@ntNet invece permette l'uso commerciale fino a 500 al giorno.

| Opzione | Pro | Contro |
|---|---|---|
| **A. Non commerciale: open source, niente pubblicità né abbonamenti, donazioni volontarie ammesse** | Tutti i servizi scelti restano gratuiti; coerente con la visione | Nessun guadagno |
| B. Commerciale (pubblicità o abbonamenti) | Possibili entrate | Open-Meteo e probabilmente l'hosting andrebbero pagati; contro il vincolo di gratuità |

**Raccomandazione: A.** È già nella visione del prodotto. Va solo scritta nero su bianco, per esempio nel README.

**Scelta: ✅ DECISA il 2026-11-16 — A.** Non commerciale, open source, donazioni volontarie ammesse.
Da fare: scriverlo nel README.

---

## D2 — Dove pubblichiamo l'app (hosting)?
| Opzione | Pro | Contro |
|---|---|---|
| **A. Vercel Hobby** | Pensato per Next.js, configurazione minima, limiti abbondanti | Va verificato nei termini che il nostro uso sia ammesso (personale / non commerciale) |
| B. Cloudflare Workers + OpenNext | 100.000 richieste al giorno, database D1 incluso | Più configurazione; compatibilità di Next.js da verificare |
| C. Netlify | Supporta Next.js | Limiti gratuiti da verificare |

**Raccomandazione: A**, dopo aver letto insieme i termini di servizio di Vercel. Il codice resta portabile: se Vercel non
andasse bene, si passa a B.

**Scelta: ✅ DECISA il 2026-11-16 — A, Vercel Hobby**, a condizione che la lettura dei termini di servizio confermi che il
nostro uso è ammesso. Se non lo fosse: B (Cloudflare).

---

## D3 — Dove salviamo i dati dell'utente?
| Opzione | Pro | Contro |
|---|---|---|
| **A. Solo sul telefono + backup su file (v1)** | Gratis, privacy massima, nessun account, funziona offline | Se il telefono si perde e non c'è backup, i dati si perdono; niente uso da più dispositivi |
| B. Telefono + sincronizzazione online con Supabase | Dati su più dispositivi | Serve un account; 1 GB di foto in tutto; il progetto si mette in pausa dopo 7 giorni senza attività; più responsabilità sulla privacy (GDPR) |

**Raccomandazione: A per la v1.** Rivalutiamo B in v2, se gli utenti la chiedono.

**Scelta: ✅ DECISA il 2026-11-16 — A per la v1**, con questa aggiunta:
- l'onboarding **guida passo per passo** ad aggiungere l'app alla schermata Home dell'iPhone, spiegando che altrimenti
  Safari può cancellare i dati dopo un periodo senza visite;
- l'onboarding **propone il backup su file** (F14).

---

## D4 — Dove teniamo i contatori delle identificazioni?
| Opzione | Pro | Contro |
|---|---|---|
| **A. Upstash Redis (piano gratuito)** | 500.000 comandi al mese (a noi ne servono circa 60.000), semplice, nessuna carta di credito | Un servizio in più da configurare |
| B. Cloudflare D1 | Incluso se scegliamo Cloudflare (D2-B) | Ha senso solo con Cloudflare |
| C. Nessun contatore, solo il dato "rimaste" di Pl@ntNet | Zero servizi in più | Nessuna quota per dispositivo: un solo utente può consumare tutte le 500 |

**Raccomandazione: A** (oppure B se in D2 scegliamo Cloudflare).

**Scelta: ✅ DECISA il 2026-11-16 — A, Upstash Redis** (B solo se in D2 si passa a Cloudflare).

---

## D5 — Quanti riconoscimenti al giorno per dispositivo?
| Opzione | Pro | Contro |
|---|---|---|
| 5 | Spazio per circa 96 utenti attivi al giorno | Poco per chi sistema tutte le piante di casa il primo giorno |
| **10** | Equilibrio: circa 48 utenti "intensi" al giorno, molti di più se occasionali | Un nuovo utente con molte piante deve aspettare il giorno dopo |
| 20 | Comodo per l'utente | Pochi utenti intensi esauriscono il totale |

**Raccomandazione: 10**, con il conteggio sempre visibile. Riguardiamo il numero dopo un mese di uso reale.

**Scelta: ✅ DECISA il 2026-11-16 — 10 al giorno**, con questa aggiunta: il numero è un **valore configurabile**, non
scritto nel codice (variabile d'ambiente `QUOTA_PER_DEVICE_PER_DAY`, valore predefinito 10). Così si può cambiare senza
modificare il programma. Vedi [architettura §4](architettura.md#4-il-limite-di-500-identificazioni-al-giorno).

---

## D6 — Come funziona il "botanico AI"?
| Opzione | Pro | Contro |
|---|---|---|
| **A. v1: assistente a regole (senza AI) per tutti; v2: Ollama personale per chi lo configura** | Gratis, onesto, funziona offline; nessun dato a terzi | Nella v1 non c'è una chat libera |
| B. AI online con piano gratuito | Chat libera per tutti | **Gemini gratuito escluso** per utenti UE e minori di 18 anni; gli altri servizi vanno verificati e possono cambiare in qualsiasi momento |
| C. AI dentro il browser del telefono | Gratis e privata | Download pesante, lenta e non supportata da tutti gli iPhone (da verificare) |

**Raccomandazione: A.** La chat AI è un "di più", non una funzione essenziale. Ne riparliamo in v2 con nuove verifiche.

**Scelta: ✅ DECISA il 2026-11-16 — A.** v1 assistente a regole; v2 Ollama personale.

---

## D7 — Come arrivano i promemoria nella v1?
| Opzione | Pro | Contro |
|---|---|---|
| **A. Dentro l'app + esportazione nel Calendario (`.ics`)** | Nessun server in più; il Calendario dell'iPhone manda le sue notifiche | Le date nel Calendario non si aggiornano da sole quando il meteo le cambia |
| B. Notifiche push già nella v1 | Esperienza da app vera | Serve un server che invii le notifiche ogni giorno e conservi gli "indirizzi" dei telefoni; funziona solo con l'app installata sulla Home (iOS 16.4+) |

**Raccomandazione: A per la v1**, notifiche push (V-03) in v2.

**Scelta: ✅ DECISA il 2026-11-16 — A.** In-app + Calendario nella v1; push in v2.

---

## D8 — Da dove prendiamo i consigli di cura?
Pl@ntNet dice **che pianta è**, non **come curarla**. Serve un'altra fonte.

| Opzione | Pro | Contro |
|---|---|---|
| **A. Schede scritte da noi per ~50 piante comuni, con fonti citate (orti botanici, università, servizi pubblici)** | Qualità controllata, nessuna dipendenza esterna, nessun problema di licenza se le scriviamo con parole nostre | Richiede tempo (circa 50 schede) |
| B. Contenuti di Wikipedia / Wikidata | Molte specie, licenze libere (CC BY-SA / CC0, **da verificare**) | Pochi dati di cura strutturati; obbligo di attribuzione; qualità variabile |
| C. Banche dati di cura di terzi | Molte specie | Spesso a pagamento o con licenze restrittive (**da verificare**) |

**Raccomandazione: A per la cura, B (Wikidata / GBIF) per i dati botanici** (famiglia, nomi). Per le specie senza scheda
mostriamo consigli generici dichiarati come tali.

**Scelta: ✅ DECISA il 2026-11-16 — A per la cura, B per i dati botanici**, con queste regole:
- ogni scheda di cura si basa su **fonti verificabili, citate nella scheda stessa** (titolo, indirizzo, data di consultazione);
- i testi sono **scritti con parole nostre**: vietato copiare testi dei concorrenti (CLAUDE.md §5);
- **ripiego per le piante senza scheda**: consigli generici per famiglia o tipo di pianta (es. "piante grasse",
  "aracee"), anch'essi con fonti, più un messaggio chiaro: *"La scheda completa per questa pianta non è ancora disponibile.
  Questi sono consigli generici per il suo gruppo."*
- **Ampliamento del 2026-11-17 (nuovo requisito):** ogni scheda, e ogni gruppo del ripiego, ha anche le sezioni
  **"Coltivarla da zero"** e **"Travaso"**, con fonti per ogni sezione, periodo consigliato collegato a stagione e meteo
  e promemoria facoltativo (F18). Esempio: [scheda del pothos](../requirements/esempio-scheda-pothos.md).

---

## D9 — Quale flora di Pl@ntNet e quali soglie di confidenza?
**Perché conta:** non esiste un test pubblico su Pl@ntNet con le piante d'appartamento.

| Opzione | Pro | Contro |
|---|---|---|
| **A. Prima un test: circa 30 foto di piante di casa (le 7 del protocollo + 20-25), inviate all'API con `all`, `k-world-flora` e `useful`; poi scegliamo flora e soglie** | Decisione basata su dati reali; costa circa 90 identificazioni (meno di un giorno di quota) | Un paio d'ore di lavoro prima di scrivere l'interfaccia |
| B. Usare subito `all` con soglie 70% / 30% | Si parte subito | Rischio di scoprire tardi che le piante di casa vengono riconosciute male |

**Raccomandazione: A.** Sarebbe il primo passo di sviluppo: un piccolo script sul PC, con la chiave in `.env.local`.

**Scelta: ✅ DECISA il 2026-11-16 — A, prima il test.** Fino al risultato del test, flora e soglie restano provvisorie
(`all`, 70% / 30%). Il risultato andrà scritto qui e nella [scheda Pl@ntNet](../api-documentation/plantnet-api.md).

---

## D10 — Quale modello per l'anteprima live? *(aggiunta il 2026-11-17)*
**Perché conta:** è il pezzo che rende possibile il nuovo requisito (nome probabile mentre si inquadra). Abbiamo verificato
che **nessun modello aperto pronto all'uso copre bene le piante d'appartamento**: Plants V1 ne conosce 6 su 22, PlantNet-300K
3 su 22 (dettagli e fonti nella [scheda dei modelli](../api-documentation/modelli-riconoscimento-live.md)).

| Opzione | Pro | Contro |
|---|---|---|
| **A. BioCLIP, limitato alla lista delle specie del nostro catalogo** | Licenza MIT; nessun addestramento: basta dargli la lista dei nomi; la lista si allarga senza rifare il modello | Pesante: download stimato 90-170 MB **(da verificare)**; velocità e precisione sulle piante di casa **da verificare** |
| B. Google AIY Plants V1 | Licenza Apache 2.0; circa 5 MB; molto veloce | Conosce solo 6 delle nostre 22 piante: sbaglierebbe quasi sempre |
| C. Un modello nostro piccolo, addestrato sulle piante del catalogo (foto iNaturalist con licenza aperta) | Leggero (stimato 5-15 MB) e veloce; copre esattamente le piante che ci interessano | Lavoro in più: raccogliere foto, addestrare, citare le licenze, mantenerlo; servono competenze da imparare |
| D. Modelli Pl@ntNet (PlantNet-300K, PlantCLEF 2024) | Aperti (PlantCLEF: CC BY 4.0), molto rigorosi | Pensati per la flora selvatica europea; PlantCLEF pesa gigabyte |
| E. Nessun modello: il mirino dà solo consigli di inquadratura | Zero rischi, zero peso | Non soddisfa il nuovo requisito |

**Raccomandazione: A per la prova D11**, misurando insieme anche B come riferimento di velocità. Se A risulta troppo lento o
pesante sull'iPhone, si passa a **C**. **E** resta sempre come ripiego automatico sui telefoni che non reggono il modello.

**Scelta:** _da decidere (dopo D11)_

---

## D11 — Prova pratica sull'iPhone 13 Pro Max prima di sviluppare l'interfaccia? *(aggiunta il 2026-11-17)*
**Perché conta:** velocità, calore e batteria di un modello nel browser non si possono sapere dai documenti. Le fonti non
concordano nemmeno su quali iPhone abbiano WebGPU con iOS 26.

| Opzione | Pro | Contro |
|---|---|---|
| **A. Pagina di prova minima (non l'app): mirino + modello + misure, aperta sul tuo iPhone** | Dati reali sul telefono vero prima di investire nell'interfaccia; poche ore di lavoro | Serve un indirizzo `https` per usare la fotocamera (es. un'anteprima su Vercel o un tunnel gratuito) **(da verificare)** |
| B. Sviluppare subito l'interfaccia completa | Si vede prima il prodotto | Rischio di rifare tutto se il modello è troppo lento |
| C. Provare solo sul PC | Facile | Il PC è molto più potente: risultati non realistici |

**Cosa misuriamo con A** (modello A e B di D10, con WebGPU e con WebAssembly):
- peso del download e tempo del primo caricamento;
- millisecondi per analisi e analisi al secondo possibili;
- calore e consumo di batteria dopo 5 minuti di mirino acceso;
- su piante vere di casa: quante volte il popup dice il nome giusto, quante volte sbaglia, quante volte giustamente tace;
- con la tazza della foto trappola: nessun nome deve comparire;
- se la fotocamera funziona anche con l'app aggiunta alla schermata Home **(da verificare)**.

**Criteri di successo proposti:** analisi in meno di 500 ms; download sotto i 150 MB; mirino fluido; nome giusto in almeno
6 casi su 10 e **nessun nome sbagliato mostrato con sicurezza** sulle piante del catalogo. Prima della prova controlla la
versione di iOS (Impostazioni → Generali → Info): per WebGPU serve iOS 26.

**Raccomandazione: A.** È lo stesso metodo del test D9: prima i dati, poi l'interfaccia.

**Scelta:** _da decidere_

---

## Riepilogo
| Decisione | Scelta (2026-11-16) |
|---|---|
| D1 Commerciale? | ✅ No: open source, niente pubblicità, donazioni ammesse |
| D2 Hosting | ✅ Vercel Hobby, dopo aver verificato i termini (altrimenti Cloudflare) |
| D3 Dati utente | ✅ Solo telefono + backup su file; onboarding guida all'installazione sulla Home e propone il backup |
| D4 Contatori | ✅ Upstash Redis |
| D5 Quota per dispositivo | ✅ 10 al giorno, valore configurabile |
| D6 Botanico AI | ✅ Assistente a regole in v1; Ollama personale in v2 |
| D7 Promemoria | ✅ In-app + Calendario; push in v2 |
| D8 Consigli di cura | ✅ Schede nostre con fonti citate + dati botanici aperti; ripiego generico per famiglia/tipo |
| D9 Flora e soglie | ✅ Test con 30 foto prima di sviluppare (in attesa del test) |
| D10 Modello anteprima live | ⏳ Da decidere — raccomandazione: BioCLIP con lista del catalogo (prova), poi eventualmente modello nostro |
| D11 Prova su iPhone 13 Pro Max | ⏳ Da decidere — raccomandazione: pagina di prova minima prima dell'interfaccia |
