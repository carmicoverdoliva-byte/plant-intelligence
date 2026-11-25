// Fonti REALI da dare al modello (D13, R2). SOLO SERVER.
// A = nostre schede verificate (tipo di pianta, nota di famiglia) · C = Wikipedia (CC BY-SA 4.0).
import type { SchedaCura } from "../tipi";
import { scegliScheda, type SceltaScheda } from "../scegli";
import { casoTossicita } from "../tossicita";
import { tossicitaPrudente, type FonteData, type SchedaGenerata } from "./regole";

const UA = "Mandragola/0.1 (https://mandragola-app.vercel.app; app open source non commerciale)";

function testoScheda(s: SchedaCura): string {
  const righe = [`Scheda del tipo "${s.nome}". Si applica a: ${s.siApplicaA}`];
  for (const [k, sez] of Object.entries(s.sezioni)) {
    righe.push(`[${k}] ${sez.lineeGuida.riassunto} Cose da fare: ${sez.lineeGuida.coseDaFare.join("; ")}.`);
    for (const v of sez.lineeGuida.valori ?? []) righe.push(`  - ${v.etichetta}: ${v.valore}`);
  }
  righe.push(`[tossicità] persone: ${s.tossicita.persone}; animali: ${s.tossicita.animali}. ${s.tossicita.nota}`);
  return righe.join("\n");
}

/** Testo della voce di Wikipedia (italiano, altrimenti inglese), al massimo 7.000 caratteri. */
async function voceWikipedia(nome: string): Promise<FonteData | null> {
  for (const lingua of ["it", "en"]) {
    try {
      const u = `https://${lingua}.wikipedia.org/w/api.php?action=query&prop=extracts|info&inprop=url&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(nome)}`;
      const r = await fetch(u, { headers: { "User-Agent": UA, "Api-User-Agent": UA }, signal: AbortSignal.timeout(6000) });
      const j = (await r.json()) as { query?: { pages?: Record<string, { missing?: string; title?: string; extract?: string; fullurl?: string }> } };
      const p = Object.values(j.query?.pages ?? {})[0];
      if (p && !("missing" in p) && (p.extract?.length ?? 0) > 300) {
        return { livello: "C", titolo: `Wikipedia (${lingua}): ${p.title}`, url: p.fullurl, testo: p.extract!.slice(0, 7000) };
      }
    } catch {
      /* si prova l'altra lingua */
    }
  }
  return null;
}

export interface FontiRaccolte {
  fonti: Record<string, FonteData>;
  tossicita: SchedaGenerata["tossicita"]; // copiata dalle nostre fonti A (mai scritta dal modello)
  scelta: SceltaScheda; // la scheda di tipo (o "in preparazione") usata come ripiego
}

export async function raccogliFonti(specie: string, genere: string, famiglia?: string): Promise<FontiRaccolte> {
  const scelta = scegliScheda(specie, genere, famiglia);
  const fonti: Record<string, FonteData> = {};
  if (scelta.scheda) fonti.S1 = { livello: "A", titolo: `Scheda Mandragola del tipo "${scelta.nomeTipo}"`, generale: true, copreTutto: true, testo: testoScheda(scelta.scheda) };
  if (scelta.notaFamiglia) {
    fonti.S2 = {
      livello: "A",
      titolo: `Nota Mandragola sulla famiglia ${scelta.notaFamiglia.famiglia}`,
      generale: true,
      testo: scelta.notaFamiglia.note.map((n) => `${n.tema}: ${n.testo}`).join("\n"),
    };
  }
  const w = await voceWikipedia(specie);
  if (w) fonti.S3 = w;
  return { fonti, scelta, tossicita: tossicitaDalleNostreFonti(scelta, specie, genere) };
}

/**
 * Tossicità copiata dalle NOSTRE fonti A (decisione dell'utente del 2026-11-19): il modello non la scrive.
 * 1. caso verificato per la specie o il genere nella scheda del tipo (es. Phalaenopsis: non tossica per cani e gatti);
 * 2. altrimenti valore e nota della scheda del tipo (la nota della famiglia si usa solo se manca la scheda del tipo);
 * 3. senza scheda del tipo ma con nota di famiglia sulla tossicità: "dipende dalla specie" con quella nota;
 * 4. senza fonti A: "non verificata" con la nota prudente.
 */
function tossicitaDalleNostreFonti(scelta: SceltaScheda, specie: string, genere: string): SchedaGenerata["tossicita"] {
  const t = scelta.scheda?.tossicita;
  const notaFam = scelta.notaFamiglia?.note.find((n) => n.tema === "tossicità")?.testo;
  const caso = casoTossicita(t, specie, genere);
  if (caso) return { persone: caso.persone, animali: caso.animali, nota: caso.nota, fonti: ["S1"] };
  if (t) return { persone: t.persone, animali: t.animali, nota: senzaRipetizioni(t.nota), fonti: ["S1"] };
  if (notaFam) return { persone: "varia", animali: "varia", nota: senzaRipetizioni(`Dipende dalla specie. ${notaFam}`), fonti: ["S2"] };
  return tossicitaPrudente();
}

/** Toglie le frasi ripetute da una nota. */
function senzaRipetizioni(t: string): string {
  const viste = new Set<string>();
  return t
    .split(/(?<=[.!?])\s+/)
    .filter((x) => {
      const k = x.toLowerCase().replace(/[^a-zà-ù0-9]/g, "");
      if (!k || viste.has(k)) return false;
      viste.add(k);
      return true;
    })
    .join(" ");
}
