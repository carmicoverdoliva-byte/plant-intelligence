# Visione prodotto — Plant Intelligence

## In una frase
Una web app **open source**, **mobile-first** e **installabile come PWA** che riconosce le piante dalla fotocamera
e aiuta a curarle, in modo **completamente gratuito**.

## Funzioni principali

### 1. Riconoscimento da foto
- Identifica la specie a partire da una o più foto.
- Mostra **specie simili** e il **livello di confidenza**.
- Se il riconoscimento non è sicuro, **mostra alternative invece di inventare** una risposta.

### 2. Scheda botanica
- Informazioni sulla specie riconosciuta (nome scientifico, nomi comuni, famiglia, caratteristiche).

### 3. Consigli di cura
- Acqua, luce, terreno, temperatura, concimazione, rinvaso.

### 4. Diagnosi dei problemi
- Aiuto a riconoscere malattie, parassiti o carenze e indicazioni su cosa fare.

### 5. Collezione personale con promemoria
- Elenco delle proprie piante con promemoria (es. annaffiatura, concimazione).

### 6. Chat "botanico AI"
- Domande libere su piante e cura, con un assistente AI che dichiara le proprie incertezze.

### 7. Geolocalizzazione, meteo e posizione del sole
- Usa posizione, meteo e calcolo della posizione del sole per **stimare** l'esposizione della pianta.
- È una **stima, non una misura esatta**; l'utente può fare una **calibrazione manuale**.

## Requisito obbligatorio: onboarding e Guida

### Al primo avvio
1. Schermata di benvenuto.
2. Tutorial su **come fotografare** una pianta (luce, inquadratura, foglie/fiori/frutti).
3. Spiegazione di **come leggere i risultati** (confidenza, specie simili, alternative).
4. Richiesta dei permessi **fotocamera** e **posizione**, spiegando prima **perché** servono.

### Sempre disponibile
- Sezione **"Guida"** raggiungibile dal menu, con:
  - tutorial singoli per ogni funzione;
  - FAQ;
  - possibilità di **ripetere il tutorial** iniziale.
- **Brevi spiegazioni la prima volta** che si entra in ogni sezione.

## Vincoli
- **Tutto gratuito**: nessuna funzione essenziale deve dipendere da un servizio a pagamento.
- **Ogni servizio esterno deve essere sostituibile** (architettura ad adattatori).
- Chiavi API mai nel codice: solo in `.env.local`, escluso da git.

## Stack tecnico previsto
| Ambito | Scelta | Note |
|---|---|---|
| Framework | Next.js + React + TypeScript | |
| Stile | Tailwind CSS | |
| Distribuzione | PWA installabile | mobile-first |
| Riconoscimento | Pl@ntNet API | piano gratuito |
| Meteo | Open-Meteo | gratuito, senza chiave |
| Posizione del sole | SunCalc | libreria open source, calcolo locale |
| AI botanica | Ollama (modello locale) | quando possibile; provider configurabile |

## Benchmark da studiare
| App | Cosa studiare |
|---|---|
| PictureThis | Esperienza di riconoscimento |
| Planta | Cura e promemoria |
| Pl@ntNet | Rigore scientifico |
| Flora Incognita | Rigore scientifico |

**Regola:** il reverse engineering riguarda **solo comportamento e funzionalità osservabili**.
Niente codice proprietario, asset, API private o aggiramento di protezioni.

## Destinatario e modo di lavorare
- Chi sviluppa il progetto è alle prime armi: ogni passaggio va spiegato in italiano semplice.
- Si lavora a piccoli passi, verificando ogni passaggio prima di dichiararlo concluso.
