// Upstash Redis (piano gratuito, D4) con normali richieste HTTPS: nessuna libreria in più. SOLO SERVER.
// Chiavi: UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN, solo nelle variabili d'ambiente (mai nel codice né nei registri).
// Se non risponde, o la quota mensile gratuita è finita, si torna { ok: false } e l'app prosegue come senza Upstash:
// per un minuto non lo si richiama più, così nessuno aspetta inutilmente.

const TEMPO_MASSIMO_MS = Number(process.env.UPSTASH_TIMEOUT_MS) || 1500;
const PAUSA_MS = Number(process.env.UPSTASH_PAUSA_MS) || 60_000;
let fermoFino = 0;

export type EsitoUpstash = { ok: true; valore: unknown } | { ok: false };

function ferma(motivo: string): EsitoUpstash {
  fermoFino = Date.now() + PAUSA_MS;
  console.warn(`[upstash] non disponibile (${motivo}): per un po' si prosegue senza`);
  return { ok: false };
}

/** Esegue UN comando Redis, per esempio ["GET", "chiave"]. Ogni chiamata conta 1 sui 500.000 del mese. */
export async function comandoUpstash(comando: (string | number)[]): Promise<EsitoUpstash> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || Date.now() < fermoFino) return { ok: false };
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(comando),
      cache: "no-store",
      signal: AbortSignal.timeout(TEMPO_MASSIMO_MS),
    });
    const j = (await r.json().catch(() => null)) as { result?: unknown; error?: string } | null;
    if (!r.ok || !j || j.error !== undefined) {
      return ferma(/max requests limit/i.test(j?.error ?? "") ? "quota mensile finita" : `risposta ${r.status}`);
    }
    return { ok: true, valore: j.result ?? null };
  } catch (e) {
    return ferma((e as Error).name === "TimeoutError" ? "tempo scaduto" : "rete");
  }
}
