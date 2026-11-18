# Prova D11 sull'iPhone 16 — risultati grezzi (18/11/2026)

Incollati dall'utente da "Copia i risultati" della pagina https://<utente-github>.github.io/d11-prova-anteprima/?variante=int8
Quattro sessioni brevi, stesso telefono, Safari, piante vere.

```
Prova D11 — risultati
Data: 2026-11-18T10:10:55.257Z
Browser: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E148 Safari/604.1
Variante del modello: int8 · Motore: webgpu · Modello scaricato dalla rete: 87.3 MB · Altro: 0.0 MB
Caricamento: 12.7 s in tutto (motore: 3.5 s)
Analisi: 53 · media 293 ms · ultimo minuto 293 ms · al secondo 1.2 · rallentamento dopo 2 minuti · durata 0 min 43 s
Blocco più lungo della pagina: 31 ms · errori: 0
Soglie: prob 0.3 · somiglianza 0.42 · intervallo 500 ms · scala 30
Calore annotato: 1 min freddo
Annotazioni: 0 (popup giusto 0, popup vuoto 0)

Prova D11 — risultati
Data: 2026-11-18T10:11:50.638Z
Variante del modello: int8 · Motore: webgpu · Modello scaricato dalla rete: 87.3 MB · Altro: 0.0 MB
Caricamento: 12.7 s in tutto (motore: 3.5 s)
Analisi: 84 · media 302 ms · ultimo minuto 308 ms · al secondo 1.0 · rallentamento dopo 2 minuti · durata 1 min 20 s
Blocco più lungo della pagina: 4688 ms · errori: 0
Soglie: prob 0.3 · somiglianza 0.42 · intervallo 500 ms · scala 30
Calore annotato: 1 min freddo, 2 min tiepido
Annotazioni: 2 (popup giusto 1, popup vuoto 0)
· Monstera → popup: Monstera · 1° nome: Filodendro 52% · somigl. 0.66 · 277 ms
· Pothos → popup: Filodendro · 1° nome: Filodendro 64% · somigl. 0.66 · 335 ms

Prova D11 — risultati
Data: 2026-11-18T10:13:12.115Z
Variante del modello: int8 · Motore: webgpu · Modello scaricato dalla rete: 0 (memoria) · Altro: 0.0 MB
Caricamento: 2.6 s in tutto (motore: 2.4 s)
Analisi: 22 · media 323 ms · ultimo minuto 323 ms · al secondo 1.2 · rallentamento dopo 2 minuti · durata 0 min 18 s
Blocco più lungo della pagina: 109 ms · errori: 0
Soglie: prob 0.3 · somiglianza 0.42 · intervallo 500 ms · scala 30
Calore annotato: 0 min freddo
Annotazioni: 1 (popup giusto 1, popup vuoto 0)
· Maranta → popup: Maranta · 1° nome: Maranta 88% · somigl. 0.70 · 338 ms

Prova D11 — risultati
Data: 2026-11-18T10:18:17.464Z
Variante del modello: int8 · Motore: webgpu · Modello scaricato dalla rete: 0 (memoria) · Altro: non misurabile
Caricamento: 4.3 s in tutto (motore: 4.0 s)
Analisi: 26 · media 291 ms · ultimo minuto 291 ms · al secondo 1.3 · rallentamento dopo 2 minuti · durata 0 min 21 s
Blocco più lungo della pagina: 69 ms · errori: 0
Soglie: prob 0.3 · somiglianza 0.42 · intervallo 500 ms · scala 30
Calore annotato: 0 min tiepido
Annotazioni: 0 (popup giusto 0, popup vuoto 0)
```

## Note di lettura (Claude, chat)
- Fattibilità tecnica confermata: WebGPU su iPhone 16, ~0,3 s per analisi, 0 errori, modello conservato da Safari (2,6-4,3 s alla riapertura).
- Analisi al secondo ~1,0-1,3 invece delle 2 previste.
- Una sessione ha avuto un blocco della pagina di 4,7 s: da indagare.
- Sessioni brevi (max 1 min 20 s): rallentamento e calore su 5 minuti non ancora misurati; trappole non registrate.
- Riconoscimento: 3 annotazioni (Maranta giusta, Monstera giusta nel popup ma 1° nome Filodendro, Pothos scambiato per Filodendro). Campione troppo piccolo per una percentuale; la confusione Pothos/Filodendro/Monstera è coerente con la prova sul PC.
