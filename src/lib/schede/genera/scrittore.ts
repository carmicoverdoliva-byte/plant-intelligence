// Adattatore CardWriter (D6 rivista, D13): Cloudflare Workers AI, piano gratuito. SOLO SERVER.
// Chiavi: CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_AI_TOKEN, solo nelle variabili d'ambiente (mai nel codice, mai nei log).
// CLOUDFLARE_API_URL (facoltativa, non segreta) serve solo alle prove con un Cloudflare finto.
// Quali modelli usare si decide in UN SOLO posto: ./modelli.ts (MODELLI_SCHEDE).

export interface CardWriter {
  nome: string;
  scrivi(messaggi: { role: "system" | "user"; content: string }[]): Promise<{ testo: string; neuron: number; ms: number; errore?: string }>;
}

export class WorkersAiCardWriter implements CardWriter {
  constructor(
    readonly nome: string,
    private readonly modello: string,
    private readonly tempoMassimoMs = 90_000,
  ) {}

  async scrivi(messaggi: { role: "system" | "user"; content: string }[]) {
    const t0 = Date.now();
    const account = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_AI_TOKEN;
    if (!account || !token) return { testo: "", neuron: 0, ms: 0, errore: "configurazione" };
    try {
      const base = process.env.CLOUDFLARE_API_URL || "https://api.cloudflare.com/client/v4";
      const r = await fetch(`${base}/accounts/${account}/ai/run/${this.modello}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messaggi,
          max_tokens: 3500,
          temperature: 0.2,
          response_format: { type: "json_object" },
          // Questi modelli "ragionano" prima di rispondere: per una scheda non serve e costa tempo e neuron
          chat_template_kwargs: { enable_thinking: false },
          // Per i modelli che ragionano sempre (es. gpt-oss): il meno possibile (provato il 2026-11-23 su 4 modelli)
          reasoning_effort: "low",
        }),
        signal: AbortSignal.timeout(this.tempoMassimoMs),
      });
      const j = (await r.json().catch(() => ({}))) as {
        success?: boolean;
        errors?: { code?: number; message?: string }[];
        result?: { response?: string; usage?: { neurons?: number }; choices?: { message?: { content?: string; reasoning_content?: string } }[] };
      };
      const msg = j.result?.choices?.[0]?.message ?? {};
      // Alcuni modelli mettono il testo in reasoning_content anche con il ragionamento spento
      const testo = msg.content || msg.reasoning_content || j.result?.response || "";
      // Quota gratuita del giorno finita (10.000 neuron): Cloudflare risponde 429 o con un messaggio sulla quota
      const quota = r.status === 429 || (j.errors ?? []).some((e) => /allocation|neuron|quota|daily|limit/i.test(e.message ?? ""));
      const errore = !r.ok || j.success === false ? (quota ? "quota" : "errore del servizio") : undefined;
      return { testo, neuron: j.result?.usage?.neurons ?? 0, ms: Date.now() - t0, errore };
    } catch (e) {
      return { testo: "", neuron: 0, ms: Date.now() - t0, errore: (e as Error).name === "TimeoutError" ? "tempo scaduto" : "rete" };
    }
  }
}
