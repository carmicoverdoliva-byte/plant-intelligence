# Decisioni da prendere insieme

> Ultimo aggiornamento: 2026-11-16 · Collegati: [architettura](architettura.md), [specifiche funzionali](../requirements/specifiche-funzionali.md)

Queste scelte sono importanti o difficili da cambiare dopo, quindi **non le prende Claude da solo**. Per ognuna ci sono le
opzioni, i pro e i contro e una **raccomandazione**. Quando una decisione è presa, scriviamo qui la scelta e la data, e
aggiorniamo i documenti collegati.

**Ordine consigliato:** D1 → D9 (il test delle foto) → D2 → le altre.

---

## D1 — L'app resterà non commerciale?
**Perché conta:** Open-Meteo è gratis solo senza pubblicità né abbonamenti, e il piano Hobby di Vercel è probabilmente
riservato all'uso non commerciale. Pl@ntNet invece permette l'uso commerciale fino a 500 al giorno.

| Opzione | Pro | Contro |
|---|---|---|
| **A. Non commerciale: open source, niente pubblicità né abbonamenti, donazioni volontarie ammesse** | Tutti i servizi scelti restano gratuiti; coerente con la visione | Nessun guadagno |
| B. Commerciale (pubblicità o abbonamenti) | Possibili entrate | Open-Meteo e probabilmente l'hosting andrebbero pagati; contro il vincolo di gratuità |

**Raccomandazione: A.** È già nella visione del prodotto. Va solo scritta nero su bianco, per esempio nel README.

**Scelta:** _da decidere_

---

## D2 — Dove pubblichiamo l'app (hosting)?
| Opzione | Pro | Contro |
|---|---|---|
| **A. Vercel Hobby** | Pensato per Next.js, configurazione minima, limiti abbondanti | Va verificato nei termini che il nostro uso sia ammesso (personale / non commerciale) |
| B. Cloudflare Workers + OpenNext | 100.000 richieste al giorno, database D1 incluso | Più configurazione; compatibilità di Next.js da verificare |
| C. Netlify | Supporta Next.js | Limiti gratuiti da verificare |

**Raccomandazione: A**, dopo aver letto insieme i termini di servizio di Vercel. Il codice resta portabile: se Vercel non
andasse bene, si passa a B.

**Scelta:** _da decidere_

---

## D3 — Dove salviamo i dati dell'utente?
| Opzione | Pro | Contro |
|---|---|---|
| **A. Solo sul telefono + backup su file (v1)** | Gratis, privacy massima, nessun account, funziona offline | Se il telefono si perde e non c'è backup, i dati si perdono; niente uso da più dispositivi |
| B. Telefono + sincronizzazione online con Supabase | Dati su più dispositivi | Serve un account; 1 GB di foto in tutto; il progetto si mette in pausa dopo 7 giorni senza attività; più responsabilità sulla privacy (GDPR) |

**Raccomandazione: A per la v1.** Rivalutiamo B in v2, se gli utenti la chiedono.

**Scelta:** _da decidere_

---

## D4 — Dove teniamo i contatori delle identificazioni?
| Opzione | Pro | Contro |
|---|---|---|
| **A. Upstash Redis (piano gratuito)** | 500.000 comandi al mese (a noi ne servono circa 60.000), semplice, nessuna carta di credito | Un servizio in più da configurare |
| B. Cloudflare D1 | Incluso se scegliamo Cloudflare (D2-B) | Ha senso solo con Cloudflare |
| C. Nessun contatore, solo il dato "rimaste" di Pl@ntNet | Zero servizi in più | Nessuna quota per dispositivo: un solo utente può consumare tutte le 500 |

**Raccomandazione: A** (oppure B se in D2 scegliamo Cloudflare).

**Scelta:** _da decidere_

---

## D5 — Quanti riconoscimenti al giorno per dispositivo?
| Opzione | Pro | Contro |
|---|---|---|
| 5 | Spazio per circa 96 utenti attivi al giorno | Poco per chi sistema tutte le piante di casa il primo giorno |
| **10** | Equilibrio: circa 48 utenti "intensi" al giorno, molti di più se occasionali | Un nuovo utente con molte piante deve aspettare il giorno dopo |
| 20 | Comodo per l'utente | Pochi utenti intensi esauriscono il totale |

**Raccomandazione: 10**, con il conteggio sempre visibile. Riguardiamo il numero dopo un mese di uso reale.

**Scelta:** _da decidere_

---

## D6 — Come funziona il "botanico AI"?
| Opzione | Pro | Contro |
|---|---|---|
| **A. v1: assistente a regole (senza AI) per tutti; v2: Ollama personale per chi lo configura** | Gratis, onesto, funziona offline; nessun dato a terzi | Nella v1 non c'è una chat libera |
| B. AI online con piano gratuito | Chat libera per tutti | **Gemini gratuito escluso** per utenti UE e minori di 18 anni; gli altri servizi vanno verificati e possono cambiare in qualsiasi momento |
| C. AI dentro il browser del telefono | Gratis e privata | Download pesante, lenta e non supportata da tutti gli iPhone (da verificare) |

**Raccomandazione: A.** La chat AI è un "di più", non una funzione essenziale. Ne riparliamo in v2 con nuove verifiche.

**Scelta:** _da decidere_

---

## D7 — Come arrivano i promemoria nella v1?
| Opzione | Pro | Contro |
|---|---|---|
| **A. Dentro l'app + esportazione nel Calendario (`.ics`)** | Nessun server in più; il Calendario dell'iPhone manda le sue notifiche | Le date nel Calendario non si aggiornano da sole quando il meteo le cambia |
| B. Notifiche push già nella v1 | Esperienza da app vera | Serve un server che invii le notifiche ogni giorno e conservi gli "indirizzi" dei telefoni; funziona solo con l'app installata sulla Home (iOS 16.4+) |

**Raccomandazione: A per la v1**, notifiche push (V-03) in v2.

**Scelta:** _da decidere_

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

**Scelta:** _da decidere_

---

## D9 — Quale flora di Pl@ntNet e quali soglie di confidenza?
**Perché conta:** non esiste un test pubblico su Pl@ntNet con le piante d'appartamento.

| Opzione | Pro | Contro |
|---|---|---|
| **A. Prima un test: circa 30 foto di piante di casa (le 7 del protocollo + 20-25), inviate all'API con `all`, `k-world-flora` e `useful`; poi scegliamo flora e soglie** | Decisione basata su dati reali; costa circa 90 identificazioni (meno di un giorno di quota) | Un paio d'ore di lavoro prima di scrivere l'interfaccia |
| B. Usare subito `all` con soglie 70% / 30% | Si parte subito | Rischio di scoprire tardi che le piante di casa vengono riconosciute male |

**Raccomandazione: A.** Sarebbe il primo passo di sviluppo: un piccolo script sul PC, con la chiave in `.env.local`.

**Scelta:** _da decidere_

---

## Riepilogo delle raccomandazioni
| Decisione | Raccomandazione |
|---|---|
| D1 Commerciale? | No: open source, niente pubblicità, donazioni ammesse |
| D2 Hosting | Vercel Hobby, dopo aver verificato i termini |
| D3 Dati utente | Solo telefono + backup su file |
| D4 Contatori | Upstash Redis |
| D5 Quota per dispositivo | 10 al giorno |
| D6 Botanico AI | Assistente a regole in v1; Ollama personale in v2 |
| D7 Promemoria | In-app + Calendario; push in v2 |
| D8 Consigli di cura | Schede scritte da noi per ~50 piante + dati botanici aperti |
| D9 Flora e soglie | Test con 30 foto prima di sviluppare |
