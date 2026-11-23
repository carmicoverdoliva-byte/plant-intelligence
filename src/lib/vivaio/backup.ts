// Copia di sicurezza del Vivaio in UN file (F14, D3): l'utente lo salva dove vuole (es. iCloud Drive).
// Formato JSON leggibile; le foto sono dentro il file come testo (base64). Nessun server.
import { vivaio } from "./archivio";
import type { PiantaVivaio } from "./tipi";

const FORMATO = "mandragola-vivaio-backup";
const VERSIONE = 1;
export const CHIAVE_ULTIMO_BACKUP = "mandragola:vivaio:ultimo-backup";

type PiantaNelFile = Omit<PiantaVivaio, "foto" | "miniatura"> & { foto?: string; miniatura?: string };

const inTesto = (b: Blob) =>
  new Promise<string>((risolvi, rifiuta) => {
    const r = new FileReader();
    r.onload = () => risolvi(r.result as string);
    r.onerror = () => rifiuta(r.error);
    r.readAsDataURL(b);
  });

function inBlob(dataUrl: string): Blob | undefined {
  const m = /^data:([^;,]+);base64,(.*)$/.exec(dataUrl);
  if (!m) return undefined;
  const bin = atob(m[2]);
  const byte = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) byte[i] = bin.charCodeAt(i);
  return new Blob([byte], { type: m[1] });
}

/** Il file di backup con tutte le piante del Vivaio. */
export async function creaBackup(): Promise<File> {
  const piante: PiantaNelFile[] = [];
  for (const p of await vivaio.elenco()) {
    piante.push({ ...p, foto: p.foto && (await inTesto(p.foto)), miniatura: p.miniatura && (await inTesto(p.miniatura)) });
  }
  const oggi = new Date().toISOString().slice(0, 10);
  const contenuto = JSON.stringify({ formato: FORMATO, versione: VERSIONE, esportatoIl: new Date().toISOString(), piante });
  return new File([contenuto], `mandragola-vivaio-${oggi}.json`, { type: "application/json" });
}

const valida = (p: unknown): p is PiantaNelFile => {
  const x = p as PiantaNelFile;
  return (
    !!x && typeof x.id === "string" && typeof x.salvataIl === "string" && typeof x.nomeScientifico === "string" &&
    typeof x.genere === "string" && (x.scheda?.tipo === "generata" || x.scheda?.tipo === "tipo") && !!x.scheda.dati
  );
};

/** Rimette nel Vivaio le piante del file. Quelle già presenti (stesso codice) si lasciano come sono. */
export async function importaBackup(file: File): Promise<{ aggiunte: number; giaPresenti: number; scartate: number }> {
  let dati: { formato?: string; piante?: unknown[] };
  try {
    dati = JSON.parse(await file.text());
  } catch {
    throw new Error("non è un file di backup di Mandragola");
  }
  if (dati?.formato !== FORMATO || !Array.isArray(dati.piante)) throw new Error("non è un file di backup di Mandragola");
  const esito = { aggiunte: 0, giaPresenti: 0, scartate: 0 };
  for (const p of dati.piante) {
    if (!valida(p)) {
      esito.scartate++;
      continue;
    }
    if (await vivaio.leggi(p.id)) {
      esito.giaPresenti++;
      continue;
    }
    await vivaio.rimetti({ ...p, foto: p.foto ? inBlob(p.foto) : undefined, miniatura: p.miniatura ? inBlob(p.miniatura) : undefined });
    esito.aggiunte++;
  }
  return esito;
}
