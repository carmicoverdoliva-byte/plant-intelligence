// "Cos'è": riassunto della voce di Wikipedia (italiano, altrimenti inglese). SOLO SERVER.
// È una DESCRIZIONE, non una scheda di cura. Testo con licenza CC BY-SA 4.0: si mostra con titolo, link alla voce,
// link agli autori (cronologia) e licenza (regole di riuso di Wikimedia, docs/api-documentation/ai-schede-generate.md).
// Le richieste portano un User-Agent con il nome dell'app e un contatto (politica di accesso di Wikimedia).

export interface Descrizione {
  titolo: string; // titolo della voce
  estratto: string; // riassunto iniziale della voce, così com'è
  url: string; // voce su Wikipedia
  autori: string; // cronologia della voce (chi l'ha scritta)
  lingua: "it" | "en";
  livello: "specie" | "genere"; // se manca la voce sulla specie, si usa quella sul genere (e lo si dice)
  licenza: "CC BY-SA 4.0";
}

interface Riassunto {
  type?: string;
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
}

const USER_AGENT = "Mandragola/0.1 (https://mandragola-app.vercel.app; app open source non commerciale)";
// Indirizzo modificabile solo per le prove automatiche: "{lingua}" viene sostituito con "it" o "en"
const base = (lingua: string) =>
  (process.env.WIKIPEDIA_BASE_URL || "https://{lingua}.wikipedia.org").replace("{lingua}", lingua);

const memoria = new Map<string, Descrizione | null>();

async function riassunto(lingua: "it" | "en", titolo: string): Promise<Riassunto | null | "errore"> {
  try {
    const r = await fetch(`${base(lingua)}/api/rest_v1/page/summary/${encodeURIComponent(titolo.replace(/ /g, "_"))}`, {
      headers: { "User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (r.status === 404) return null; // la voce non esiste
    if (!r.ok) return "errore"; // Wikipedia in difficoltà: non è una risposta definitiva
    const j = (await r.json()) as Riassunto;
    // Le pagine di disambiguazione ("può riferirsi a…") non descrivono la pianta
    if (j.type === "disambiguation" || !j.extract?.trim() || !j.content_urls?.desktop?.page) return null;
    return j;
  } catch {
    return "errore"; // tempo scaduto o rete: non è una risposta definitiva
  }
}

/** Cerca nell'ordine: specie in italiano, specie in inglese, genere in italiano, genere in inglese. */
export async function descrizione(
  specie: string,
  genere?: string,
): Promise<{ descrizione: Descrizione | null; definitiva: boolean }> {
  const chiave = `${specie}|${genere ?? ""}`;
  if (memoria.has(chiave)) return { descrizione: memoria.get(chiave) ?? null, definitiva: true };
  const tentativi: { titolo: string; lingua: "it" | "en"; livello: Descrizione["livello"] }[] = [
    { titolo: specie, lingua: "it", livello: "specie" },
    { titolo: specie, lingua: "en", livello: "specie" },
  ];
  if (genere && genere !== specie) {
    tentativi.push({ titolo: genere, lingua: "it", livello: "genere" }, { titolo: genere, lingua: "en", livello: "genere" });
  }
  let trovata: Descrizione | null = null;
  let definitiva = true; // falsa se un tentativo è fallito per lentezza o errore: allora non si ricorda la risposta
  for (const t of tentativi) {
    const r = await riassunto(t.lingua, t.titolo);
    if (r === "errore") {
      definitiva = false;
      continue;
    }
    if (!r) continue;
    const url = r.content_urls!.desktop!.page!;
    trovata = {
      titolo: r.title ?? t.titolo,
      estratto: r.extract!.trim(),
      url,
      autori: `${url}?action=history`,
      lingua: t.lingua,
      livello: t.livello,
      licenza: "CC BY-SA 4.0",
    };
    break;
  }
  // Si ricorda solo una risposta certa: nessun tentativo fallito per lentezza prima di quello buono
  // (altrimenti, per esempio, la voce inglese resterebbe al posto di quella italiana solo perché Wikipedia era lenta)
  if (definitiva) memoria.set(chiave, trovata);
  return { descrizione: trovata, definitiva };
}
