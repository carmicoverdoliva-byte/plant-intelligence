# Librerie dell'app (dipendenze) — scheda

> Ultima verifica: 2026-11-18 · Elenco completo e versioni esatte: `package.json` e `package-lock.json`

## In breve
Le **dipendenze** sono librerie scritte da altri che l'app usa. Sono tutte **open source e gratuite**. Non sono servizi
esterni: girano dentro l'app o sul PC durante lo sviluppo, e non mandano dati a nessuno.

## Librerie dell'app (arrivano sul telefono o sul server)
| Libreria | Versione | A cosa serve | Licenza | Costo |
|---|---|---|---|---|
| Next.js (`next`) | 16.4.6 | Struttura dell'app: pagine, server per le chiavi segrete, compilazione | MIT | Gratis |
| React (`react`, `react-dom`) | 19.3.0 | Costruisce l'interfaccia | MIT | Gratis |
| Nunito (`@fontsource-variable/nunito`) | 5.3.0 | Carattere dell'app (stile grafico), ospitato da noi | SIL OFL 1.1 | Gratis |

## Strumenti di sviluppo (restano sul PC)
| Strumento | Versione | A cosa serve | Licenza |
|---|---|---|---|
| Tailwind CSS (`tailwindcss`, `@tailwindcss/turbopack`) | 4.3.3 | Stili grafici | MIT |
| TypeScript (`typescript`) | 5.x | Controlla gli errori di tipo nel codice | Apache 2.0 |
| ESLint (`eslint`, `eslint-config-next`) | 9.x / 16.4.6 | Controllo automatico del codice (`npm run lint`) | MIT |
| Tipi per TypeScript (`@types/node`, `@types/react`, `@types/react-dom`) | — | Descrizioni dei tipi | MIT |

Licenza di Nunito letta nel file `LICENSE` del pacchetto e con `npm view` il 2026-11-18; `npm audit --omit=dev`: 0 problemi.
Le versioni di Next.js, React e strumenti sono quelle scelte dallo strumento ufficiale `create-next-app` 16.4.6, che le prova insieme. Licenze lette con
`npm view <pacchetto> license` il 2026-11-18.

## Scelte fatte
- **Niente caratteri scaricati da Google** (`next/font/google`, presente nel modello iniziale): si usano i caratteri del
  telefono. Una dipendenza esterna in meno, pagina più leggera.
- **Statistiche anonime di Next.js disattivate sul PC di sviluppo** (`npx next telemetry disable`, 2026-11-18). Next.js
  le invia per migliorare il prodotto [1]; sul PC di sviluppo preferiamo non inviare nulla. Si riattivano con
  `npx next telemetry enable`.
- **Server di prova solo su `127.0.0.1`**: gli script `dev` e `start` usano `-H 127.0.0.1`, quindi l'app non è
  raggiungibile dagli altri dispositivi della rete.
- La cartella `tests/` (pagine di prova come D11) è esclusa da TypeScript ed ESLint: ha le sue regole e le sue librerie.

## Avvisi di sicurezza (`npm audit`)
- **Librerie dell'app: 0 problemi** (`npm audit --omit=dev`, 2026-11-18).
- **Strumenti di sviluppo: 14 avvisi "high"** che vengono tutti da **una** libreria, `picomatch`: un'espressione di
  ricerca costruita apposta può rallentarla molto (ReDoS, GHSA-fc5q-39xc-vjpf). La usano solo ESLint e i suoi plugin
  sul PC, con file e regole nostri: **non arriva sul telefono** e non tratta dati degli utenti.
  - Non abbiamo forzato l'aggiornamento (`npm audit fix --force`), che cambierebbe versioni principali di ESLint e
    potrebbe rompere la configurazione.
  - Si ricontrolla a ogni aggiornamento di `eslint-config-next`.

## Rischi
| Rischio | Probabilità | Come lo gestiamo |
|---|---|---|
| Next.js 16 ha API nuove rispetto a esempi e guide vecchie | Alta | Si legge la guida inclusa nel pacchetto (`node_modules/next/dist/docs/`, vedi `AGENTS.md`) prima di scrivere codice |
| Avvisi di sicurezza negli strumenti di sviluppo | Bassa (solo PC) | `npm audit` a ogni aggiornamento; le librerie dell'app restano a 0 avvisi |
| Node.js 26 sul PC più nuovo di quello provato dagli autori | Bassa | Compilazione e controlli passano; online Vercel usa la sua versione di Node.js **(da verificare al passo 0.5)** |

## Fonti
1. Next.js, "Telemetry" — https://nextjs.org/telemetry — indicato dallo strumento durante la compilazione, 2026-11-18
2. GitHub Advisory Database, GHSA-fc5q-39xc-vjpf (picomatch) — https://github.com/advisories/GHSA-fc5q-39xc-vjpf — riportato da `npm audit` il 2026-11-18
