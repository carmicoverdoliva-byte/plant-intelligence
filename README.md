# 🌿 Mandragola

Web app **open source**, **mobile-first** e **installabile (PWA)** che riconosce le piante dalla fotocamera e aiuta a curarle. Completamente gratuita.

**Progetto non commerciale** (decisione D1): niente pubblicità, niente abbonamenti, niente account.

## Funzioni previste
- Riconoscimento da foto con livello di confidenza e alternative
- Scheda botanica e consigli di cura
- Diagnosi dei problemi
- Collezione personale con promemoria
- Chat "botanico AI"
- Stima dell'esposizione al sole (posizione + meteo + calcolo solare)
- Onboarding al primo avvio e sezione "Guida" sempre disponibile

## Stato
🚧 Versione 1 in costruzione, seguendo il [piano della v1](docs/requirements/piano-v1.md).

**Provala sul telefono:** https://mandragola-app.vercel.app (si aggiorna da sola a ogni modifica pubblicata).
Su iPhone: aprila in Safari, poi Condividi → "Aggiungi a Home".

## Provarla sul PC
Serve [Node.js](https://nodejs.org) (versione 20.9 o successiva).

```bash
npm install        # scarica le librerie (solo la prima volta)
npm run dev        # versione di sviluppo: http://127.0.0.1:3000
npm run build      # controlla che l'app si compili
npm run start      # versione finale, dopo build: http://127.0.0.1:3000
npm run lint       # controllo automatico del codice
npm run guida      # copia i testi della Guida in docs/user-guide/guida.md
node tests/app/prova-app.mjs   # prova automatica in Edge (con npm run start acceso)
```

Il server di prova risponde solo dal PC stesso (`127.0.0.1`), non dagli altri dispositivi della rete.
Le chiavi dei servizi vanno solo in `.env.local`, mai nel codice (vedi `.env.example` quando ci sarà).

## Documentazione
- Visione prodotto: [`docs/requirements/visione-prodotto.md`](docs/requirements/visione-prodotto.md)
- Regole del progetto: [`CLAUDE.md`](CLAUDE.md)

## Stack previsto
Next.js · React · TypeScript · Tailwind CSS · Pl@ntNet API · Open-Meteo · SunCalc · Ollama

## Licenza
[MIT](LICENSE)
