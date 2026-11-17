# Pubblicare la pagina di prova D11 (guida — NON ancora eseguita)

> Scritta il 2026-11-17. Niente viene pubblicato senza la conferma esplicita dell'utente.
> Vincoli dati dall'utente: **niente tunnel, niente programmi da installare** (PC di sviluppo), hosting gratuito
> (GitHub Pages o Vercel, coerente con D2), modello caricato da Hugging Face.

## Cosa va online (e cosa no)
La pagina è **statica**: sono pochi file che il browser scarica e fa girare da solo, senza un server nostro.

| Cosa | Dove | Peso |
|---|---|---|
| `index.html`, `app.js`, `worker.js`, `prototypes.json`, `prototypes-int8.json`, `crediti-riferimenti.md`, un breve README e la licenza MIT | **GitHub Pages**, in un repository **nuovo e separato**, che contiene solo la pagina di prova | ~0,3 MB in tutto |
| Modello originale (173 MB) | Resta dov'è: Hugging Face, `m3r1al/naturalist-bioclip-v1` (già pubblico, accesso da altri siti verificato) | — |
| Modello **compresso** (87 MB) | **Hugging Face**, in un repository di modelli tuo, con licenza MIT e riconoscimento degli autori di BioCLIP | 87,3 MB |

**Non** vanno online: il resto del progetto, le foto di prova, la chiave di Pl@ntNet, le risposte grezze dei test.

## Perché GitHub Pages (e non Vercel, per ora)
- La pagina è statica: GitHub Pages basta ed è gratuito. Limiti verificati [1][2]:
  - sito pubblicato al massimo di 1 GB;
  - 100 GB al mese di traffico (limite "morbido");
  - vietato usarlo per attività commerciali, e noi non lo facciamo (D1).
- Il caricamento si fa **dal browser**, trascinando i file: **niente da installare**. Dal browser GitHub accetta file
  fino a **25 MiB** [3]. I nostri file della pagina sono molto più piccoli; il modello compresso no, e per questo va su
  Hugging Face.
- **Vercel** (l'hosting scelto in D2 per l'app) richiede comunque un repository GitHub da importare, oppure un programma
  da installare, e i termini del piano Hobby vanno ancora verificati (D2). Lo useremo per l'app; per questa prova non
  serve.
- **Da sapere:**
  - con un account gratuito il repository della pagina dovrà quasi certamente essere **pubblico**: i piani
    disponibili non sono indicati nelle pagine consultate, quindi è **da verificare** quando lo crei;
  - GitHub registra l'indirizzo IP di chi visita la pagina, per sicurezza [4].

## Cosa devi fare tu (passo per passo)
1. **Crea un account GitHub gratuito**: https://github.com/signup.
   - Usa un'email **personale**.
   - Il nome utente comparirà nell'indirizzo della pagina (`https://<nome-utente>.github.io/…`): se preferisci, scegline
     uno che non contenga il tuo nome e cognome.
2. **Crea un account Hugging Face gratuito**: https://huggingface.co/join, con le stesse avvertenze sul nome utente.
3. **Scrivimi in chat solo i due nomi utente.** ⚠️ Mai password, codici o "token".
4. Io preparo, **sul PC e fuori dal progetto**, una cartella `test-piante\pubblica-d11\` con due sottocartelle:
   - `modello\`: il file compresso, una scheda README che spiega da dove viene, e la licenza MIT di BioCLIP;
   - `sito\`: i file della pagina.
5. **Carichi il modello su Hugging Face**: "New model" → nome `d11-bioclip-int8` → **Public** → "Files" → "Add file" →
   "Upload files" → trascini i 3 file di `modello\` → "Commit". Il caricamento dal browser di file grandi è previsto da
   Hugging Face, ma i limiti precisi sono **da verificare**: se il caricamento non va, ci fermiamo e valutiamo.
6. Io leggo l'indirizzo pubblico del modello appena caricato. Lo **blocco su quella versione** e ne verifico l'impronta
   SHA-256, poi aggiorno `prototypes-int8.json` nella cartella `sito\`.
7. **Crei il repository su GitHub**: "New repository" → nome `d11-prova-anteprima` → **Public** → "Create". Poi "Add file"
   → "Upload files" → trascini i file di `sito\` → "Commit changes".
8. **Attivi GitHub Pages**: "Settings" → "Pages" → "Deploy from a branch" → branch `main`, cartella `/ (root)` → "Save".
   Dopo 1-2 minuti l'indirizzo sarà `https://<nome-utente>.github.io/d11-prova-anteprima/`.
9. Io **controllo da qui** che la pagina e il modello rispondano correttamente, senza aprire niente sul tuo telefono.
10. **Sull'iPhone 16**, in Wi-Fi, apri in Safari prima `…/d11-prova-anteprima/?variante=int8` (compresso), poi
    l'indirizzo senza `?variante` (originale), e segui il README della prova.

**Alternativa più semplice** (solo GitHub, senza Hugging Face): salti i passi 2, 5 e 6 e provi solo il modello
**originale** da 173 MB. Però D10 ha bisogno del dato sul modello compresso, quindi la consiglio solo se Hugging Face crea
problemi.

## Licenze da rispettare nella pubblicazione
- Pagina: licenza MIT del progetto.
- Modello compresso: deriva da BioCLIP (MIT, Imageomics) tramite la conversione `m3r1al/naturalist-bioclip-v1` (MIT).
  Va pubblicato con il testo della licenza MIT, il riconoscimento degli autori e il link all'originale. Gli autori di
  BioCLIP chiedono che i derivati restino open source.
- Foto iNaturalist: **non** si pubblicano. Si pubblicano solo le impronte numeriche e il file dei crediti.

## Fonti
1. GitHub Docs, "GitHub Pages limits" — https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits — consultato il 2026-11-17
2. GitHub Docs, uso vietato per attività commerciali (stessa pagina della fonte 1) — consultato il 2026-11-17
3. GitHub Docs, "About large files on GitHub" (25 MiB dal browser, blocco oltre 100 MiB) — https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github — consultato il 2026-11-17
4. GitHub Docs, "What is GitHub Pages?" — https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages — consultato il 2026-11-17
5. Hugging Face Docs, "Storage limits" (spazio pubblico gratuito "best-effort"; file consigliati sotto i 200 GB) — https://huggingface.co/docs/hub/storage-limits — consultato il 2026-11-17
