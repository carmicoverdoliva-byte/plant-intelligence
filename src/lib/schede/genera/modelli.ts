// IMPOSTAZIONE UNICA dei modelli AI che scrivono le schede di specie generate (R2, D13).
// Servizio: Cloudflare Workers AI, piano gratuito (10.000 neuron al giorno). SOLO SERVER.
//
// COME CAMBIARE UN MODELLO (per esempio se Cloudflare lo ritira):
//   1. scegli il sostituto nel catalogo https://developers.cloudflare.com/workers-ai/models/
//      (deve essere di tipo "Text Generation" e NON segnato come "deprecated");
//   2. scrivi qui sotto il suo identificativo in `id` (inizia con "@cf/") e un nome breve in `nome`
//      (il nome compare solo nei registri e nelle prove);
//   3. prova con `node scripts/gara-modelli.mjs` (consuma neuron: guarda il tetto nello script)
//      e con `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/app/prova-regole-r2.mjs`;
//   4. aggiorna docs/api-documentation/ai-schede-generate.md.
// Non serve cambiare altro: genera.ts e scrittore.ts leggono i modelli solo da qui.
//
// Storia: 2026-11-19 l'utente sceglie qwen3-30b (principale) e gemma-4-26b (riserva); Mistral escluso.
//         2026-11-20 Cloudflare ritira qwen3-30b (errore 410).
//         2026-11-23 dopo la gara (test-piante/prova-r2/gara2) l'utente sceglie gemma-4-26b principale
//         (7 schede su 10 al primo colpo, 37 s e 84 neuron di media) e glm-4.7-flash riserva.

export interface ModelloScheda {
  nome: string;
  id: string;
}

export const MODELLI_SCHEDE: { principale: ModelloScheda; riserva: ModelloScheda } = {
  principale: { nome: "gemma-4-26b", id: "@cf/google/gemma-4-26b-a4b-it" },
  riserva: { nome: "glm-4.7-flash", id: "@cf/zai-org/glm-4.7-flash" },
};
