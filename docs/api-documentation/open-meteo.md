# Open-Meteo — scheda

> Ultima verifica: 2026-11-16 · Sito ufficiale: https://open-meteo.com/

## In breve
Open-Meteo è un servizio meteo **gratuito e senza chiave** per l'uso non commerciale. Dato un punto (latitudine e
longitudine), restituisce previsioni e dati recenti: temperatura, pioggia, nuvole, radiazione solare e altro. I dati hanno
licenza **CC BY 4.0**: si possono usare liberamente, **citando la fonte** [1].

## Cosa usiamo e perché
- **Previsioni orarie e giornaliere** nel punto in cui si trova la pianta: temperatura (per avvisi di freddo e caldo), pioggia
  (per le piante all'aperto), copertura nuvolosa e **radiazione solare** (per correggere la stima della luce fatta con SunCalc).
- **Geocoding** (cercare una città per nome) **(da verificare)**: utile se l'utente non vuole condividere la posizione GPS e
  preferisce scrivere il nome del comune.

Esempio delle informazioni che chiediamo (indicativo, da confermare sulla documentazione delle API al momento dello sviluppo):
`temperature_2m`, `precipitation`, `cloud_cover`, `shortwave_radiation`, `sunshine_duration`.

## Limiti del piano gratuito
| Voce | Valore | Fonte |
|---|---|---|
| Richieste al minuto / ora / giorno / mese | 600 / 5.000 / **10.000** / 300.000 | [1] |
| A chi si applicano | **per indirizzo IP e per applicazione** | [1] |
| Superato il limite | non descritto in dettaglio; il servizio può bloccare senza preavviso chi ne abusa | [1] |

**Conseguenza importante:** se tutte le richieste partissero dal nostro server (Vercel, Netlify, Render…), userebbero gli
stessi indirizzi IP di migliaia di altri siti e il limite potrebbe scattare prima del previsto. Open-Meteo stesso lo segnala [1].
Per questo **il telefono chiama Open-Meteo direttamente**: ogni utente usa il proprio limite, e non c'è nessuna chiave
segreta da proteggere.

## Licenza e condizioni d'uso
| Domanda | Risposta | Fonte |
|---|---|---|
| Gratuito? | Sì, per uso **non commerciale** | [1] |
| Uso commerciale consentito? | **No sul piano gratuito.** È commerciale un'app con **abbonamenti o pubblicità**. Sono gratuiti i siti o le app privati o senza scopo di lucro, senza abbonamenti né pubblicità; le **donazioni volontarie sono ammesse**. I piani a pagamento (Standard, Professional, Enterprise) servono per l'uso commerciale | [1] |
| Software open source | Non citato esplicitamente nei termini **(da verificare)** | [1] |
| Serve una chiave API? | No per il piano gratuito | [1] |
| Obblighi (attribuzione, logo…) | Dati con licenza **CC BY 4.0**: va citata la fonte (es. "Dati meteo: Open-Meteo.com" con link) | [1][2] |

**Plant Intelligence** è open source, gratuita e senza pubblicità: rientra nell'uso **non commerciale**. Se un giorno
aggiungessimo pubblicità o abbonamenti, Open-Meteo andrebbe pagato o sostituito. È la [decisione D1](../architecture/decisioni-da-prendere.md).

## Come lo usiamo nel codice (adattatore)
```text
[Telefono] --lat, lon--> [Open-Meteo]      (chiamata diretta, nessuna chiave)
     |
     +--> salva la risposta sul telefono per 1 ora (così non ripete richieste inutili)
```

```ts
// src/lib/weather/WeatherProvider.ts (da creare)
interface WeatherProvider {
  getForecast(place: { lat: number; lon: number }): Promise<WeatherForecast>;
}
// OpenMeteoProvider implementa questa interfaccia.
```

- **Privacy:** prima di chiamare il servizio arrotondiamo la posizione a circa 1 km (2 decimali). Per il meteo basta, e
  non riveliamo l'indirizzo esatto.
- **Attribuzione:** "Dati meteo: Open-Meteo.com (CC BY 4.0)" nella schermata del meteo e nella pagina Informazioni.

## Cosa succede se il servizio non risponde o il limite è superato
- L'app usa l'ultima previsione salvata e indica: "Meteo aggiornato alle 10:30 di ieri".
- Senza dati meteo, i promemoria tornano agli **intervalli standard** della scheda di cura, e la stima del sole usa solo
  SunCalc ("stima senza correzione per le nuvole"). **Nessuna funzione si blocca.**

## Alternative gratuite
| Alternativa | Gratuita? | Note |
|---|---|---|
| **MET Norway API** (istituto meteorologico norvegese) | Sì, dati CC BY 4.0 **(da verificare)** | Chiede di identificare l'app nelle richieste: andrebbe chiamata dal server **(da verificare)** |
| **Open-Meteo installato da noi** (il codice è open source) | Sì, ma serve un server | Licenza del codice **(da verificare)**; opzione se cambiassero i termini |
| **Nessun meteo** | Sì | Ripiego: promemoria a intervalli fissi |

## Rischi
| Rischio | Probabilità | Come lo mitighiamo |
|---|---|---|
| L'app diventa commerciale (pubblicità/abbonamenti) | Dipende da noi | Decisione D1; adattatore `WeatherProvider` |
| Cambio dei termini gratuiti | Bassa | Riverificare questa scheda ogni 6 mesi; alternative pronte |
| Limiti per IP raggiunti | Molto bassa (chiamate dal telefono, cache di 1 ora) | Cache; ripiego senza meteo |

## Fonti
1. Open-Meteo, "Terms & Privacy" — https://open-meteo.com/en/terms — consultato il 2026-11-16 (copyright 2022-2026, modifiche tracciate su GitHub)
2. Open-Meteo, pagina licenza — https://open-meteo.com/en/licence — citata da [1], **da leggere** per il testo esatto dell'attribuzione
