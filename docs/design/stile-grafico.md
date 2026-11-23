# Stile grafico di Mandragola

> Deciso il 2026-11-18 in chat con Claude, sul canvas "Mandragola — proposte grafiche" (claude.ai).
> Le tre schermate di riferimento sono in `docs/design/riferimenti/` (HTML con stili inline: si aprono nel browser
> solo come riferimento, perché usano un file `support.js` dell'editor che qui non c'è; leggere gli stili dal sorgente).
> L'icona master è `docs/design/icona-mandragola-master.png` (1254×1254, generata con ChatGPT dall'utente).

## Il carattere dello stile, in una frase
**"Serra di vetro" giocosa**: sfondo quasi bianco, riquadri di vetro smerigliato, verde come colore principale, viola
per la "magia", forme tonde e spesse come in un'app per bambini, ma con contenuti seri e onesti.

## Colori

| Ruolo | Valore | Uso |
|---|---|---|
| Sfondo | `#F7FBF6` | Fondo di tutte le schermate |
| Aloni di sfondo | menta `#9BE8AE` al 55% → trasparente; lime `#D9F7A8` al 60% → trasparente | 2-3 aloni radiali grandi e sfumati, servono a far "lavorare" il vetro. Niente foglie disegnate sullo sfondo (al massimo una sagoma al 12%) |
| Testo principale | `#12261C` | |
| Testo secondario | `#33553F` / `#3D5A4A` | Sottotitoli, etichette |
| Verde principale | `#17804A` (hover/premuto `#0B5A33`) | Pulsanti pieni con testo bianco, link, icone attive. Non usare verdi più chiari per i pulsanti: il bianco sopra perde contrasto |
| Verdi illustrazioni | `#2DB36B`, `#45C27A`, `#7ED957`, foglie scure `#1B7A4B` | Solo disegni e immagini delle piante |
| Lime accento | `#C6F26B` | Puntini di stato, dettagli |
| Viola "magia" | bacchetta `#9B7BFF`→`#4B2DB8`; riquadri `rgba(88,58,210,0.92)`→`rgba(75,45,184,0.9)` (vedi nota sul contrasto); scintille `#8B6BFF` | Tutto ciò che è "magico" o speciale: bacchetta, scintille nel popup "Forse:", riquadro Falso mito |
| Giallo stella | `#FFD43B`; etichette su viola `#FFE36E` | Stella della bacchetta, etichette sul viola |

**Bolle colorate delle icone** (sfondo / colore icona), una per tipo di contenuto:
verde `#C3F0C6`/`#17804A` · acqua `#C8F1EC`/`#0B7F74` · viola `#E7DEFF`/`#5B3FD6` · lime `#F1F9C4`/`#4D7A0C` ·
giallo (luce) `#FFF3B0`/`#8A6A00` · azzurro (acqua) `#CDEEFF`/`#1D6FB8` · pesca (temperatura) `#FFE0D6`/`#B4441E`.
Avviso tossicità: `#F7DDD0` / `#8A3412`.

Contrasto: testo normale almeno 4,5:1 (verificare ogni nuova coppia); icone e grafica almeno 3:1.
Verifica del 2026-11-18 (formula WCAG 2.x):
- testo `#12261C` su sfondo 15,2:1 · `#33553F` 8,0:1 · `#3D5A4A` 7,3:1 · link `#17804A` 4,8:1 ·
  testo `#F2F8EC` su pulsante `#17804A` 4,6:1 (non schiarire né il verde né il testo);
- icone sulle bolle: tutte fra 3,9:1 e 6,3:1, quindi bene come grafica (3:1); **non usare quei colori per testo** sulle
  bolle verde, acqua, azzurro e pesca (sotto 4,5:1). Come testo vanno bene viola `#5B3FD6` su `#E7DEFF` (5,2:1, usato
  nell'etichetta "Forse: …"), lime `#4D7A0C` su `#F1F9C4` (4,7:1), tossica `#8A3412` su `#F7DDD0` (6,3:1);
- testo `#3D5A4A` su vetro (bianco) 7,6:1 · testo `#33553F` su vetro 8,4:1 (verificati il 2026-11-18, passi 1.1-1.2);
- etichette del risultato (R0): `#0B5A33` su `#C3F0C6` 6,6:1 (affidabilità alta) · `#4D7A0C` su `#F1F9C4` 4,7:1
  (buona) · `#8A6A00` su `#FFF3B0` 4,5:1 (bassa) · `#33553F` su `#C8F1EC` 6,9:1 ("Scheda di cura in arrivo") ·
  `#B4441E` su vetro 5,5:1 ("Non ne sono sicuro");
- azioni che cancellano (Vivaio, 2026-11-23): testo `#F2F8EC` su pulsante `#8A3412` (colore della tossicità) 7,5:1
  ("Sì, elimina"); pulsante "Elimina dal Vivaio" in vetro con testo `#8A3412` 7,8-8,1:1;
- **viola "magia" corretto:** con l'inizio della sfumatura del riferimento (`rgba(110,80,240,0.92)`) il testo chiaro era
  a 4,0:1 e l'etichetta gialla `#FFE36E` a 3,5:1. Con `rgba(88,58,210,0.92)` diventano 5,4:1 e 4,8:1. Il resto del
  riquadro è uguale.

## Vetro (la ricetta)
```css
background: rgba(255,255,255,0.62);           /* card importanti: linear-gradient(135deg, rgba(255,255,255,.82), rgba(255,255,255,.55)) */
border: 1px solid rgba(255,255,255,0.95);
box-shadow: inset 0 1px 1px rgba(255,255,255,0.95),
            inset 0 -1px 1px rgba(255,255,255,0.25),
            0 8px 24px rgba(10,80,45,0.14);
backdrop-filter: blur(26px) saturate(170%);    /* 26-32px; con -webkit- per Safari */
```
Barra di navigazione in basso e popup: stessa ricetta, flottanti, con ombra un po' più forte.
**Ripiego:** se il browser non supporta `backdrop-filter`, usare `rgba(255,255,255,0.9)` (deve restare leggibile).

## Carattere
- **Nunito** (Google Fonts, licenza OFL), pesi 600 / 700 / 800 / 900. Titoli 900, testo 600-700, etichette 800.
- **Ospitato da noi** (deciso il 2026-11-18): pacchetto npm `@fontsource-variable/nunito` (OFL 1.1). I file del
  carattere partono dal nostro sito: nessuna richiesta a Google (niente indirizzo IP dell'utente a terzi), funziona
  senza rete dopo la prima apertura. È la versione "variabile": un solo file contiene tutti i pesi.

## Forme
- Angoli: card grandi 32 px · riquadri 24 px · bolle icone 14-18 px · pulsanti a pillola (altezza 44-48, raggio metà altezza).
- Target tattili almeno 44 × 44 px.
- Icone: stile Lucide (licenza ISC), **tratto 2,6**, punte e giunzioni arrotondate. Mai emoji al posto delle icone.

## Goccioline
Solo **sulle immagini delle piante** (foglia nella card "Riconosci", immagine in alto nella scheda, mirino della
fotocamera), mai sullo sfondo. Goccia = ellisse con gradiente radiale (bianco al centro → verde scuro trasparente al
bordo), bordo bianco al 45%, piccolo riflesso bianco in alto a sinistra.

## Schermate di riferimento
1. **Home**: logo + nome, "Cosa scopriamo oggi?", ricerca in vetro, card "Riconosci una pianta" con pulsante
   "Inquadra", 4 azioni rapide con bolle colorate (Le mie piante, Promemoria, Nuova pianta, Guida), "Da fare oggi",
   card viola "Falso mito", barra di navigazione in vetro con pulsante fotocamera centrale.
2. **Fotocamera**: mirino come finestra arrotondata su sfondo bianco, chip "Anteprima sul telefono", angoli del mirino,
   popup in vetro con scintilla viola "Forse: Pothos" (o "Forse: Pothos o Filodendro" per le gemelle) e pulsante
   "Scatta per saperlo", comandi in basso (galleria, scatto, parte della pianta).
3. **Scheda**: immagine della pianta in card arrotondata con gocce, card in vetro sovrapposta con nome comune + genere,
   "probabilmente" + specie, chip (Facile, Tossica), alternative; 4 riquadri (Luce, Acqua, Temperatura, Concime) con
   bolle colorate; elenco sezioni (Coltivarla da zero, Travaso, Problemi più comuni, Falsi miti, Approfondimenti);
   barra in basso "Aggiungi alle mie piante" + Condividi.

## Icona dell'app
- Master: `docs/design/icona-mandragola-master.png` — foglia verde morbida con gocce, bacchetta viola con stella gialla.
- L'immagine ha già angoli arrotondati e un bordo chiaro: per le icone finali va resa **quadrata piena** (lo sfondo
  menta fino ai bordi), perché iOS e Android arrotondano da soli.
- Formati da produrre: 180 (apple-touch-icon), 192 e 512 (manifest), 512 "maskable" con margine di sicurezza, favicon.
- File prodotti il 2026-11-18 con `node scripts/genera-icone.mjs`: `docs/design/icona-mandragola-quadrata.png`
  (1024, quadrata piena), `src/app/apple-icon.png` (180), `public/icons/icona-192.png`, `icona-512.png`,
  `icona-512-maskable.png` (disegno al 78% con bordi sfumati sullo sfondo menta), `src/app/icon.png` (favicon 48), `public/icons/logo-44.webp` e `logo-96.webp` (logo dentro l'app, angoli arrotondati
  come su iOS: stessa icona della schermata Home).
- Licenza: immagine generata dall'utente con ChatGPT; verificare le condizioni d'uso di OpenAI sulle immagini generate
  prima della pubblicazione definitiva (annotare l'esito qui).

## Tono
Giocoso e amichevole come un'app per bambini (forme tonde, colori allegri, piccole scintille), ma i contenuti restano
quelli decisi: risultati onesti, fonti citate, nessuna percentuale inventata.
