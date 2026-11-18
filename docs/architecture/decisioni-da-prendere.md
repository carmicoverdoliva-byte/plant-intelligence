# Decisioni da prendere insieme

> Ultimo aggiornamento: 2026-11-18 · Collegati: [architettura](architettura.md), [specifiche funzionali](../requirements/specifiche-funzionali.md)

Queste scelte sono importanti o difficili da cambiare dopo, quindi **non le prende Claude da solo**. Per ognuna ci sono le
opzioni, i pro e i contro e una **raccomandazione**. Quando una decisione è presa, scriviamo qui la scelta e la data, e
aggiorniamo i documenti collegati.

**Stato:** D1-D9 **decise il 2026-11-16** (tutte secondo la raccomandazione, con le aggiunte indicate in D3, D5 e D8).
**Prossimo passo:** il test delle foto (D9), poi la verifica dei termini di Vercel (D2).
**Aggiornamento 2026-11-17:** D9 chiusa; D11 approvata; D10 rimandata all'esito di D11.
**Aggiornamento 2026-11-18:** prova D11 fatta sull'iPhone 16 → **D10 approvata** (BioCLIP compresso int8), **D11 chiusa**
sulla fattibilità tecnica. Restano da misurare nella versione 1: calore e rallentamento su 5 minuti, trappole.
**Aggiornamento 2026-11-18 (sera):** [piano della versione 1](../requirements/piano-v1.md) approvato; D8 rivista
(22 schede complete nella v1).

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

**Verifica dei termini (2026-11-18, passo 0.2): ✅ uso ammesso.**
- Il piano Hobby è gratuito, senza carta di credito, solo per "uso personale o non commerciale" (termini del 19 ottobre
  2026): il nostro progetto lo è.
- Limiti ampiamente sufficienti; ogni richiesta al server al massimo 4,5 MB (conta per le foto).
- **Dubbio:** le donazioni (ammesse in D1) non sono menzionate da nessuna pagina ufficiale attuale. Proposta: nessuna
  richiesta di donazioni nell'app finché non è chiarito. Non blocca la v1, che non prevede donazioni.

Dettagli: [scheda Vercel](../api-documentation/vercel.md).

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

**Verifica (2026-11-18, passo 0.2): ✅ confermata.**
- Gratuito, senza carta di credito: 500.000 comandi al mese e 250 MB.
- Oltre il limite, i comandi danno errore e l'app deve gestirlo.
- Database archiviato dopo almeno 30 giorni senza uso, ripristinabile.
- ⚠️ Non aggiungere una carta di credito: il database passerebbe al piano a consumo.

Dettagli: [scheda Upstash](../api-documentation/upstash.md).

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
- **Ampliamento del 2026-11-18 (nuovo requisito):**
  - acqua con **quanto** oltre a quando, e come cambia con stagione e vaso;
  - concime con **tipo preciso** (forma, piante verdi o da fiore, NPK indicativo, diluizione, frequenza, periodo);
  - temperatura **minima, ideale e massima**;
  - sezione **"Problemi più comuni"** (F20), con frequenza solo a parole e come la dicono le fonti
    (frequente/occasionale/raro/non indicata), mai percentuali.

  Ogni numero compare solo con una fonte. Schema dei dati in
  [architettura §5](architettura.md#5-schema-dei-dati).
- **Revisione del 2026-11-18 (piano della v1 approvato):** nella **versione 1** le schede complete sono **22**, cioè le
  piante del catalogo dell'anteprima live (così il tocco sul popup apre sempre una scheda completa). Tutte le altre
  piante usano il **ripiego per gruppo**, dichiarato come tale. Si arriva a circa 50 schede nelle versioni successive.
  Motivo: con le sezioni nuove (acqua "quanto", concime, temperature, problemi più comuni) ogni scheda richiede molta
  più ricerca sulle fonti.

---

## D9 — Quale flora di Pl@ntNet e quali soglie di confidenza?
**Perché conta:** non esiste un test pubblico su Pl@ntNet con le piante d'appartamento.

| Opzione | Pro | Contro |
|---|---|---|
| **A. Prima un test: circa 30 foto di piante di casa (le 7 del protocollo + 20-25), inviate all'API con `all`, `k-world-flora` e `useful`; poi scegliamo flora e soglie** | Decisione basata su dati reali; costa circa 90 identificazioni (meno di un giorno di quota) | Un paio d'ore di lavoro prima di scrivere l'interfaccia |
| B. Usare subito `all` con soglie 70% / 30% | Si parte subito | Rischio di scoprire tardi che le piante di casa vengono riconosciute male |

**Raccomandazione: A.** Sarebbe il primo passo di sviluppo: un piccolo script sul PC, con la chiave in `.env.local`.

**Scelta: ✅ DECISA il 2026-11-16 — A, prima il test.** Test eseguito il 2026-11-17: 46 foto × 3 flore = 138
riconoscimenti. Risultati completi nella [scheda Pl@ntNet](../api-documentation/plantnet-api.md#test-d9-2026-11-17).

**Decisione finale: ✅ CHIUSA il 2026-11-17.**
1. **Flora: `k-world-flora`.**
2. **Sinonimi accettati come la stessa pianta:**
   - *Sansevieria trifasciata* = *Dracaena trifasciata*;
   - *Peperomia argyreia* = *Peperomia argyraea*;
   - *Aloe officinalis* = *Aloe vera*;
   - genere *Calathea* = *Goeppertia*.

   **Non** accettato: *Philodendron cordatum* = *P. hederaceum*.

   **Precisazione del 2026-11-17:** i **nomi scientifici seguono GBIF**. Per GBIF *Aloe officinalis* / *Aloe vera* e
   *Peperomia argyraea* / *argyreia* sono nomi distinti: l'app mostra il nome GBIF, ma ciascuna coppia apre **la stessa
   scheda di cura** ([scheda sinonimi](../api-documentation/sinonimi-botanici.md)). Risultati su `k-world-flora` (43 foto):

   | Misura | Nome secondo GBIF | Stessa scheda di cura |
   |---|---|---|
   | Specie giusta al 1° posto | **60%** | 65% |
   | Specie giusta fra le prime 5 | 95% | 95% |
   | Genere giusto al 1° posto | 93% | 93% |
3. **Come si presenta il risultato** (F04):
   - titolo = **nome comune + genere** ("Basilico, genere *Ocimum*");
   - poi la specie più probabile, introdotta da "**probabilmente**";
   - poi le alternative, con foto di confronto;
   - **nessuna percentuale mostrata all'utente**.
4. **Soglie tarate sui dati del test** (valori configurabili). s1 = punteggio della 1ª specie, s2 = della 2ª.

   | Livello | Regola | Cosa mostra | Nel test (`k-world-flora`) |
   |---|---|---|---|
   | **Non riconosciuta** | risposta "nessuna pianta" (404), oppure s1 < **10%** e s1 < **5 ×** s2 | *"Non riesco a riconoscerla, prova con un'altra foto"* + consigli di scatto | Scarta la foglia secca (5,6%, 2,7×) e 2 risposte sbagliate; **nessuna** risposta giusta scartata |
   | **Incerto** | s1 < **30%** (e non scartata) | *"Non ne sono sicuro"* + "forse" genere + alternative in evidenza | 5 foto: 3 giuste, 1 con genere sbagliato |
   | **Normale** | s1 ≥ 30% | titolo nome comune + genere; specie "probabilmente" | genere giusto **36 su 36**, specie giusta 25 su 36 |
   | **Molto probabile** | s1 ≥ **80%** **e** distacco s1 − s2 ≥ **75 punti** | specie "molto probabilmente" | specie giusta **5 su 8** secondo GBIF (6 su 8 come scheda di cura), genere 8 su 8 |

   **Limiti della taratura:** sono solo 43 foto, e **nessuna combinazione** di soglie ha superato il 90% di specie
   giuste. Anche con punteggio dell'89% e distacco di 87 punti, Pl@ntNet ha confuso due basilici. Per questo il titolo
   mostra il **genere**, che è affidabile, mentre la specie è sempre un "probabilmente". La soglia minima si basa su
   **una sola** foto trappola: va ricontrollata con più foto.
   Perché la regola usa anche il rapporto con la 2ª specie: con `k-world-flora` la tua foto della maranta ha avuto solo il
   4,8% (88,4% con `all`, stessa classifica), ma la 1ª specie era **13,5 volte** la 2ª. Una soglia basata solo sul
   punteggio l'avrebbe scartata.
5. **Tabella dei sinonimi** con fonte verificabile (GBIF Backbone Taxonomy, CC BY 4.0), così l'app mostra sempre lo
   stesso nome. Seconda fonte (World Flora Online / POWO) da verificare.

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

**Scelta: ⏸️ RIMANDATA il 2026-11-17 all'esito di D11**, con queste indicazioni:
- **candidato principale: BioCLIP**, limitato al nostro catalogo, in **versione compressa (quantizzata)** per ridurne il
  peso. "Quantizzata" vuol dire che i numeri del modello vengono salvati con meno cifre: il file pesa molto meno e
  la precisione cambia di poco **(da misurare)**;
- **download solo alla prima apertura della fotocamera**, con un avviso che dice quanto pesa (non nell'onboarding);
- il popup live mostra **nome comune o genere, mai la specie** ("Forse: Pothos", "Forse un *Philodendron*").

**Dati raccolti finora (2026-11-17, sul PC):**
- BioCLIP limitato al catalogo riconosce la pianta giusta all'**88%** (originale, 173 MB) e all'**86%** (compresso int8,
  **87 MB**). Con il compresso il popup si comporta allo stesso modo e la velocità con WebGPU è uguale (~170 ms).
- La probabilità è stata ritarata (scala 30 invece di 100), perché prima era troppo sicura.
- Prova con la webcam dell'utente: ~190 ms per analisi, rallentamento 3% in 4 minuti. Davanti a una foto mostrata sullo
  schermo di un telefono, nessun popup: corretto.

Dettagli nella [scheda dei modelli](../api-documentation/modelli-riconoscimento-live.md).

**Scelta: ✅ APPROVATA il 2026-11-18 — A, BioCLIP v1 compresso int8 (87,3 MB).**
- Modello: Hugging Face [`carmineverdoliva-byte/d11-bioclip-int8`](https://huggingface.co/carmineverdoliva-byte/d11-bioclip-int8), **versione bloccata** al commit
  `ca03b3ace7d6f841d4a11cd35d53f5ec10f90982`, SHA-256 `b7e02af2f88d77ae8019e3f3429d4c7d755e7de3d630cad87cea4bbd6282b1d3` (controllato dal telefono
  a ogni download). Licenza MIT, deriva da BioCLIP (Imageomics) tramite `m3r1al/naturalist-bioclip-v1`.
- Motore: ONNX Runtime Web, WebGPU con ripiego WebAssembly, in un Web Worker.
- Download alla prima apertura della fotocamera; popup con nome comune o genere, mai la specie; piante "gemelle" mostrate
  come "Forse: X o Y – scatta per saperlo".
- Dati della prova sull'iPhone 16 (2026-11-18): WebGPU, ~0,3 s per analisi, 0 errori, modello conservato da Safari
  (riapertura in 2,6-4,3 s). Riconoscimento: campione piccolo (3 annotazioni), confusione Pothos/Filodendro/Monstera coerente
  con il PC. Dettagli: [`risultati-iphone-2026-11-18.md`](../../tests/d11-anteprima-live/risultati-iphone-2026-11-18.md).

---

## D11 — Prova pratica sull'iPhone 16 prima di sviluppare l'interfaccia? *(aggiunta il 2026-11-17)*
**Perché conta:** velocità, calore e batteria di un modello nel browser non si possono sapere dai documenti.
Telefono di prova: **iPhone 16 con iOS 26.5.2** (dato fornito dall'utente il 2026-11-17), quindi con WebGPU disponibile.

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
6 casi su 10 e **nessun nome sbagliato mostrato con sicurezza** sulle piante del catalogo.

**Raccomandazione: A.** È lo stesso metodo del test D9: prima i dati, poi l'interfaccia.

**Scelta: ✅ APPROVATA il 2026-11-17 — A.** La pagina di prova è in `tests/d11-anteprima-live/`. Prima di metterla online
va spiegato all'utente cosa serve (account, servizio gratuito, passi) e si aspetta la sua conferma.

**Esito: ✅ CHIUSA il 2026-11-18 sulla fattibilità tecnica.** Pagina pubblicata dall'utente su GitHub Pages, modello
compresso da Hugging Face. Sull'iPhone 16, in Safari, 4 sessioni brevi:

| Criterio | Risultato | Esito |
|---|---|---|
| Analisi in meno di 500 ms | 291-323 ms in media, WebGPU | ✅ |
| Download sotto i 150 MB | 87,3 MB la prima volta; poi 0 (modello conservato da Safari) | ✅ |
| Mirino fluido | blocchi della pagina 31-109 ms; un "blocco" di 4688 ms quasi certamente dovuto al passaggio a un'altra app (vedi sotto) | ✅ con nota |
| Nome giusto in almeno 6 casi su 10 | 3 annotazioni soltanto: Maranta giusta, Monstera giusta, Pothos scambiato per Filodendro | ⚠️ campione troppo piccolo |
| Trappole senza nome | non registrate | ⏳ da fare nella v1 |
| Calore e rallentamento su 5 minuti | sessioni di massimo 1 min 20 s ("tiepido" dopo 2 minuti) | ⏳ da fare nella v1 |

**Cosa è cambiato dopo la prova (2026-11-18):**
- **Il blocco di 4688 ms.** Era nella seconda "sessione", che in realtà era la stessa pagina della prima: dopo il "Copia" la
  pagina è rimasta ferma qualche secondo (mancano circa 11 s di analisi), probabilmente per incollare i risultati nella
  chat. Al ritorno su Safari il misuratore scattava **prima** che la pagina risultasse di nuovo visibile, e contava il
  tempo passato altrove come "blocco". Causa probabile, non dimostrata sul telefono. Correzione: ogni ritardo si giudica
  1 secondo dopo, e se nel frattempo la pagina è stata nascosta o ha perso il fuoco diventa una "pausa per cambio app",
  elencata a parte. Verifica sul PC: un finto cambio app di 3 s non è più un blocco, uno vero di 0,8 s sì.
- **Analisi al secondo ~1 invece di 2.** La pausa fissa di 500 ms si sommava ai ~300 ms dell'analisi. Ora la pausa è
  **adattiva**: lunga quanto l'analisi, quindi il modello lavora al massimo metà del tempo (prima circa il 37%). Se le
  analisi rallentano del 25% (segno di telefono caldo), lavora al massimo un terzo del tempo. Atteso sull'iPhone: circa
  1,6 analisi al secondo, **da misurare**. In più la stabilità del popup ora si misura **in secondi** e non in numero di
  analisi: il nome compare dopo circa 1 s di risultati concordi, invece di circa 1,7 s.
- **Piante gemelle.** 4 gruppi: Pothos/Filodendro/Monstera, Filodendro/Peperomia, Maranta/Calathea, Anthurium/Spatifillo.
  Se i primi due nomi sono dello stesso gruppo e vicini, il popup dice **"Forse: X o Y – scatta per saperlo"**. Foto di
  riferimento portate da 6 a 15 per queste 8 piante. Sul PC il modello compresso passa dall'86% al **93%** di piante
  giuste al 1° posto, nessuna trappola con un nome.

---

## Riepilogo
| Decisione | Scelta (2026-11-16) |
|---|---|
| D1 Commerciale? | ✅ No: open source, niente pubblicità, donazioni ammesse |
| D2 Hosting | ✅ Vercel Hobby; termini verificati il 2026-11-18 (uso non commerciale ammesso; donazioni da chiarire, nessuna nell'app per ora) |
| D3 Dati utente | ✅ Solo telefono + backup su file; onboarding guida all'installazione sulla Home e propone il backup |
| D4 Contatori | ✅ Upstash Redis; piano gratuito verificato il 2026-11-18 |
| D5 Quota per dispositivo | ✅ 10 al giorno, valore configurabile |
| D6 Botanico AI | ✅ Assistente a regole in v1; Ollama personale in v2 |
| D7 Promemoria | ✅ In-app + Calendario; push in v2 |
| D8 Consigli di cura | ✅ Schede nostre con fonti citate + dati botanici aperti; ripiego generico per famiglia/tipo. Rivista il 2026-11-18: 22 schede complete nella v1 (catalogo dell'anteprima live) |
| D9 Flora e soglie | ✅ (2026-11-17) `k-world-flora`; titolo nome comune + genere, specie "probabilmente", nessuna percentuale; soglie tarate; tabella sinonimi GBIF |
| D10 Modello anteprima live | ✅ (2026-11-18) BioCLIP v1 compresso int8 (87 MB) da Hugging Face, versione bloccata; download alla prima apertura della fotocamera; nome comune o genere; gemelle "X o Y" |
| D11 Prova su iPhone 16 | ✅ Chiusa (2026-11-18): fattibile (WebGPU, ~0,3 s, 0 errori); calore su 5 minuti e trappole da misurare nella v1 |
