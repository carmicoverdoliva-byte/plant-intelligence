# Upstash Redis (piano gratuito) — scheda

> Ultima verifica: 2026-11-18 · Sito ufficiale: https://upstash.com · Decisione collegata: [D4](../architecture/decisioni-da-prendere.md)

## In breve
Upstash Redis è un piccolo **database online** in cui teniamo i **contatori dei riconoscimenti**: quanti ne ha fatti oggi
ogni dispositivo (limite di 10 al giorno, D5) e quanti ne restano in tutto dei 500 gratuiti di Pl@ntNet. Il piano gratuito
basta e non chiede la carta di credito. Non contiene dati personali: solo un codice anonimo del dispositivo e dei numeri.

## Cosa usiamo e perché
- Un contatore per dispositivo e per giorno più un contatore totale giornaliero, che si cancellano da soli dopo 48 ore
  (architettura §4).
- Lo legge e lo scrive solo il **server** (funzioni di Next.js su Vercel), con la chiave nelle impostazioni segrete: il
  telefono non la vede mai (CLAUDE.md §7).
- Servono circa **60.000 comandi al mese** (stima di D4), molto sotto il limite gratuito.
- **Dal 2026-11-18 (D13, R2): archivio delle schede generate al momento**, una per specie, valida per tutti
  ([scheda](ai-schede-generate.md)). Circa 20 KB a scheda: i 256 MB bastano per circa 10.000 schede; ogni lettura costa
  1 comando, quindi anche 100.000 aperture al mese restano sotto il limite insieme ai contatori **(da ricontrollare con
  i numeri veri dopo R2)**.

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
  andrebbe perso: sono solo contatori giornalieri.

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì: "ogni account parte con un database gratuito" | [3] |
| Uso commerciale consentito? | Le condizioni generali non lo vietano e non lo citano per il piano gratuito; il nostro uso comunque non è commerciale (D1) | [5] |
| Serve una chiave API? | Sì: indirizzo e token del database, da tenere **solo** nelle variabili d'ambiente del server (`.env.local` sul PC, impostazioni segrete su Vercel) | [3] |
| Serve la carta di credito? | **No** per il piano gratuito [3]. ⚠️ **Non aggiungere una carta**: "un account con un metodo di pagamento non può avere database gratuiti" e inserendola il database passa al piano a consumo [1][3] | [1][3] |
| Obblighi (attribuzione, logo…) | Nessuno indicato | [5] |

## Come lo usiamo nel codice (adattatore)
Interfaccia `QuotaStore` (architettura §4 e §6), con due implementazioni:
- `UpstashQuotaStore`, per l'uso online;
- `MemoryQuotaStore`, contatori in memoria, solo per le prove sul PC e per i test automatici. Così i test non consumano
  comandi.

Cambiare servizio (per esempio Cloudflare D1 o KV) significa scrivere un'altra implementazione, senza toccare il resto.

## Cosa succede se il servizio non risponde o il limite è superato
- **Limite mensile superato o Upstash non raggiungibile:** la funzione del server non può controllare la quota
  personale. Scelta prudente proposta: il riconoscimento **resta possibile** finché Pl@ntNet dice che ci sono ancora
  identificazioni (`remainingIdentificationRequests`), ma senza la divisione equa per dispositivo. L'app non mostra
  errori tecnici (F13). Se invece si preferisce bloccare per sicurezza, va deciso nel passo 2.4.
- **Database archiviato per inattività:** stesso comportamento, finché non lo ripristini dalla console.

## Alternative gratuite
- **Cloudflare D1 o KV**, se in futuro si passasse a Cloudflare (D2-B, D4-B).
- **Nessun contatore per dispositivo** (D4-C): solo il numero di identificazioni rimaste che dà Pl@ntNet. Più semplice, ma
  un solo utente potrebbe consumare tutte le 500 del giorno.

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| Database archiviato durante una pausa dello sviluppo | Media | Ripristino dalla console [4]; i dati sono solo contatori |
| Carta di credito aggiunta per errore → passaggio al piano a consumo | Bassa | Avviso qui e nei passi di configurazione; non serve mai una carta |
| Superamento dei 500.000 comandi | Bassa (ne servono ~60.000) | Un solo comando per contatore dove possibile; ripiego descritto sopra |
| Upstash cambia i limiti gratuiti | Media | Adattatore `QuotaStore` sostituibile |

## Decisioni aperte
- **Comportamento se i contatori non sono disponibili** (riconoscimento permesso o bloccato): da decidere al passo 2.4.
  Proposta: permesso, finché Pl@ntNet ne ha ancora.

## Fonti
1. Upstash, "Redis Pricing" — https://upstash.com/pricing/redis — consultato il 2026-11-18
2. Upstash Docs, "Pricing & Limits" — https://upstash.com/docs/redis/overall/pricing — consultato il 2026-11-18
3. Upstash Docs, "Pricing & Billing" — https://upstash.com/docs/redis/overall/billing — consultato il 2026-11-18
4. Upstash Docs, "FAQ" (Redis) — https://upstash.com/docs/redis/help/faq — consultato il 2026-11-18
5. Upstash, "Terms of Service" (aggiornati ad aprile 2025, secondo il documento) — https://upstash.com/trust/terms.pdf — consultato il 2026-11-18 tramite i risultati di ricerca (testo completo **da rileggere**)
