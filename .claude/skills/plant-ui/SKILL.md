---
name: plant-ui
description: Regole grafiche obbligatorie di Mandragola per ogni schermata, componente o modifica visiva (pagine, card, pulsanti, icone, popup, barra di navigazione, onboarding, Guida). Usala SEMPRE prima di scrivere o cambiare interfaccia (file .tsx con markup, globals.css, icone, immagini), quando l'utente chiede una nuova schermata o un ritocco grafico, o scrive "/plant-ui <schermata>". Impone lo stile "Serra di vetro" di docs/design/stile-grafico.md (colori come token, vetro con ripiego, Nunito, angoli, icone Lucide tratto 2.6, bolle colorate, viola per la magia, goccioline solo sulle piante, target 44 px, contrasto 4.5:1) e il confronto con le schermate di riferimento in docs/design/riferimenti/.
---

# Skill: plant-ui — ogni schermata segue lo stile di Mandragola

Scopo: tutte le schermate devono sembrare la stessa app, quella approvata dall'utente. L'argomento passato alla skill
indica la schermata o il componente (es. `home`, `scheda`, `onboarding`). Se manca, chiedilo.

**Lingua:** italiano semplice; prima di ogni fase dì cosa farai, dopo riassumi cosa è cambiato.

## Fase 1 — Leggere prima di disegnare (obbligatorio)
1. `docs/design/stile-grafico.md` — **le regole**: valgono più di qualsiasi altra idea di stile.
2. Le schermate di riferimento in `docs/design/riferimenti/` (`home.html`, `fotocamera.html`, `scheda.html`).
   Non si aprono bene nel browser (manca `support.js`): **leggi gli stili dal sorgente** (attributi `style`).
   Scegli quella più vicina alla schermata da fare e annota misure, colori, raggi, pesi del carattere.
3. `src/app/globals.css` — i **token** già definiti (colori, raggi, carattere) e le classi `vetro`, `vetro-forte`, `magia`.
4. `CLAUDE.md` §6 (onboarding e Guida) e §8 (onestà dei risultati): lo stile giocoso non cambia i contenuti.

## Fase 2 — Regole obbligatorie
| Tema | Regola |
|---|---|
| Colori | Solo i token di `globals.css` (`bg-sfondo`, `text-testo`, `text-verde`, `bg-bolla-acqua`…). **Mai colori scritti a mano** nelle pagine: se ne serve uno nuovo, si aggiunge a `stile-grafico.md` e a `globals.css`, con il contrasto verificato. |
| Sfondo | `#F7FBF6` con gli aloni menta/lime (già in `body::before`). Niente foglie o goccioline disegnate sullo sfondo. |
| Vetro | Classe `vetro` (o `vetro-forte` per le card importanti). **Sempre col ripiego**: senza `backdrop-filter` il fondo diventa `rgba(255,255,255,0.9)`. Barra in basso e popup: vetro flottante con ombra più forte. Non copiare il vetro a mano in `style`. |
| Carattere | Nunito (ospitato da noi). Titoli 900 (`font-black`), testo 600-700, etichette 800 (`font-extrabold`). |
| Angoli | Card grandi `rounded-card` (32) · riquadri `rounded-riquadro` (24) · bolle `rounded-bolla` (14-18) · pulsanti a pillola `rounded-pillola`, alti 44-48. |
| Icone | Stile **Lucide** (licenza ISC), `strokeWidth={2.6}`, punte e giunzioni arrotondate. **Mai emoji al posto delle icone.** Ogni icona decorativa ha `aria-hidden`; i pulsanti con sola icona hanno `aria-label` in italiano. Se si aggiunge la libreria `lucide-react`, prima si documenta in `docs/api-documentation/dipendenze.md`. |
| Bolle colorate | Ogni tipo di contenuto ha la sua bolla (sfondo / icona): verde, acqua, viola, lime, luce, azzurro, pesca, tossica. Stesso tipo = stessa bolla in tutta l'app. |
| Viola "magia" | Solo per ciò che è magico o speciale: bacchetta, scintille del "Forse:", riquadro Falso mito (classe `magia`). Non usarlo per pulsanti normali o errori. |
| Goccioline | **Solo sulle immagini delle piante** (card "Riconosci", immagine della scheda, mirino). Mai sullo sfondo né su card di testo. |
| Tocco | Ogni elemento toccabile almeno **44 × 44 px**. |
| Contrasto | Testo normale almeno **4,5:1**, icone e grafica almeno 3:1. Coppie già verificate in `stile-grafico.md`; ogni coppia nuova si calcola (formula WCAG) e si annota lì. |
| Tono | Giocoso nelle forme, serio nei contenuti: "probabilmente", fonti citate, nessuna percentuale inventata (CLAUDE.md §8). |
| Telefono | Mobile-first, larghezza di riferimento 390 px (iPhone 16), margini laterali 20 px, rispetto delle zone sicure (`env(safe-area-inset-*)`). |

## Fase 3 — Costruire
- Riusa i componenti esistenti in `src/components/` (es. `LogoMandragola`) prima di crearne di nuovi.
- Testi dell'interfaccia in italiano; ogni nuova schermata ha la sua voce nella Guida e la spiegazione al primo ingresso
  (CLAUDE.md §6).
- Immagini e icone solo nostre o con licenza libera verificata; niente asset dei concorrenti (CLAUDE.md §5).

## Fase 4 — Confronto con i riferimenti (obbligatorio prima di dire "fatto")
1. Avvia l'app (`npm run dev`) e guarda la schermata a **390 px di larghezza**.
2. Confrontala con il riferimento più vicino e compila questa lista, scrivendo l'esito all'utente:
   - colori e sfondo con aloni · vetro (e ripiego) · carattere e pesi · angoli · icone (Lucide, tratto 2.6) ·
     bolle · viola solo per la magia · goccioline solo sulle piante · target 44 px · contrasto 4,5:1.
3. Ogni differenza voluta dal riferimento va **detta e motivata** (es. contrasto); quelle non volute si correggono.
4. Poi `npm run lint` e `npm run build`. Se qualcosa non si può verificare (es. il vetro su iPhone), dillo.
