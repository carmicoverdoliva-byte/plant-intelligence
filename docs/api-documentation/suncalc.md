# SunCalc — scheda

> Ultima verifica: 2026-11-16 · Sito ufficiale: https://github.com/mourner/suncalc

## In breve
SunCalc è una **libreria** JavaScript, cioè un pezzo di codice già pronto da includere nell'app. Data un'ora e un luogo,
calcola **dove si trova il sole nel cielo**: altezza sull'orizzonte e direzione. Calcola anche gli orari di alba e tramonto
[1]. Il calcolo avviene **sul telefono**: **nessun servizio esterno, nessuna chiave, nessun limite**, e funziona anche senza
internet.

## Cosa usiamo e perché
- `getPosition(data, lat, lon)` → `altitude` (altezza del sole) e `azimuth` (direzione) [1].
- `getTimes(data, lat, lon)` → alba, tramonto, mezzogiorno solare [1].

Con questi dati e con l'**orientamento della finestra** (es. "finestra verso sud-est") stimiamo **quante ore di sole diretto**
possono arrivare alla pianta in un giorno e in quale fascia oraria. Il meteo di Open-Meteo corregge la stima in caso di nuvole.

**È una stima, non una misura** (CLAUDE.md §8): non conosciamo palazzi, alberi o tende davanti alla finestra. Per questo
l'utente può **calibrare** a mano, per esempio indicando "qui il sole arriva solo dalle 10 alle 13" (vedi
[specifiche](../requirements/specifiche-funzionali.md)).

**Attenzione alle unità** (versione 2): altezza in **gradi** (0 all'orizzonte, 90 allo zenit, con correzione per la
rifrazione); direzione in **gradi da Nord in senso orario** (0 = Nord, 90 = Est, 180 = Sud, 270 = Ovest) [1]. La versione 1
usava convenzioni diverse: molti esempi trovati in rete sono scritti per la versione vecchia e **non vanno copiati così come sono**.

## Limiti
| Voce | Valore | Fonte |
|---|---|---|
| Richieste | Nessun limite (calcolo locale) | [1] |
| Precisione dichiarata | circa 0,08° per il sole, verificata con JPL Horizons e USNO | [1] |
| Versione su npm (registro delle librerie) | **2.1.4**, aggiornata il 2026-11-10 | [2] |
| Dipendenze | Nessuna; include le definizioni per TypeScript | [1] |

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì, open source | [1] |
| Uso commerciale consentito? | **Sì**: licenza BSD-2-Clause, che permette qualsiasi uso | [1] |
| Serve una chiave API? | No | [1] |
| Obblighi (attribuzione, logo…) | Conservare l'avviso di copyright e la licenza nel codice distribuito (regola della BSD-2) | [1] |

Nota: nei dati di npm il campo "licenza" risulta vuoto [2]. La licenza BSD-2 è dichiarata su GitHub [1]. Al momento
dell'installazione va controllato il file LICENSE dentro il pacchetto **(da verificare)**.

## Come lo usiamo nel codice (adattatore)
```text
[Telefono]  lat/lon + data + orientamento finestra
     |
     v
 SunProvider (SunCalc) --> posizioni del sole ogni 15 minuti --> stima ore di sole diretto
     |                                                                  |
     +---- nuvole da WeatherProvider (se disponibili) ----------------->+--> "circa 3 ore (stima)"
```

```ts
// src/lib/sun/SunProvider.ts (da creare)
interface SunProvider {
  getSunPosition(date: Date, lat: number, lon: number): { altitudeDeg: number; azimuthDeg: number };
}
```

## Cosa succede se qualcosa non funziona
SunCalc non dipende da internet. Se manca la posizione, l'utente può scegliere il comune a mano. Se manca l'orientamento
della finestra, l'app chiede di indicarlo con 8 pulsanti (N, NE, E, SE, S, SO, O, NO) oppure usa la bussola del telefono.

## Alternative gratuite
| Alternativa | Gratuita? | Note |
|---|---|---|
| **astronomy-engine** (libreria JavaScript) | Sì, licenza MIT **(da verificare)** | Più completa e più pesante |
| **Formule NOAA** implementate da noi | Sì | Algoritmi pubblici del servizio meteorologico USA; più lavoro da fare |

## Rischi
| Rischio | Probabilità | Come lo mitighiamo |
|---|---|---|
| Errori di unità tra la versione 1 e la 2 | Media | Test automatici con valori noti (es. sole a mezzogiorno a Roma il 21 giugno) |
| Utente che scambia la stima per una misura | Media | Scritta "stima" sempre visibile; spiegazione nella Guida; calibrazione |
| Libreria non più mantenuta | Bassa | Le formule sono stabili; adattatore `SunProvider`; alternative pronte |

## Fonti
1. SunCalc, repository GitHub (README e licenza) — https://github.com/mourner/suncalc — consultato il 2026-11-16
2. npm, pacchetto `suncalc` (comando `npm view suncalc`) — https://www.npmjs.com/package/suncalc — consultato il 2026-11-16
