// Adattatore StorageProvider del Vivaio (architettura.md §6, D3): le piante restano SOLO sul telefono, in IndexedDB
// (il database del browser, adatto anche alle foto). Nessun server, nessun account.
// Per cambiare dove si salvano (es. sincronizzazione in v2) basta scrivere un'altra classe con la stessa interfaccia.
import type { PiantaVivaio } from "./tipi";

export interface ArchivioVivaio {
  elenco(): Promise<PiantaVivaio[]>; // dalla più recente
  leggi(id: string): Promise<PiantaVivaio | undefined>;
  aggiungi(p: Omit<PiantaVivaio, "id" | "salvataIl">): Promise<PiantaVivaio>;
  rimetti(p: PiantaVivaio): Promise<void>; // per l'importazione del backup: tiene id e data
  aggiorna(id: string, modifiche: Pick<PiantaVivaio, "soprannome">): Promise<void>;
  elimina(id: string): Promise<void>;
}

const NOME_DB = "mandragola-vivaio";
const RACCOLTA = "piante";
const EVENTO = "mandragola:vivaio";

const promessa = <T>(r: IDBRequest<T>) =>
  new Promise<T>((risolvi, rifiuta) => {
    r.onsuccess = () => risolvi(r.result);
    r.onerror = () => rifiuta(r.error);
  });

class IndexedDbVivaio implements ArchivioVivaio {
  private db: Promise<IDBDatabase> | null = null;

  private apri() {
    this.db ??= new Promise<IDBDatabase>((risolvi, rifiuta) => {
      const r = indexedDB.open(NOME_DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(RACCOLTA, { keyPath: "id" });
      r.onsuccess = () => risolvi(r.result);
      r.onerror = () => rifiuta(r.error);
    });
    this.db.catch(() => (this.db = null)); // se fallisce si riprova la volta dopo
    return this.db;
  }

  private async raccolta(modo: IDBTransactionMode) {
    return (await this.apri()).transaction(RACCOLTA, modo).objectStore(RACCOLTA);
  }

  private async scrivi(azione: (r: IDBObjectStore) => IDBRequest) {
    await promessa(azione(await this.raccolta("readwrite")));
    window.dispatchEvent(new Event(EVENTO));
  }

  async elenco() {
    const tutte = (await promessa((await this.raccolta("readonly")).getAll())) as PiantaVivaio[];
    return tutte.sort((a, b) => b.salvataIl.localeCompare(a.salvataIl));
  }

  async leggi(id: string) {
    return (await promessa((await this.raccolta("readonly")).get(id))) as PiantaVivaio | undefined;
  }

  async aggiungi(dati: Omit<PiantaVivaio, "id" | "salvataIl">) {
    const p: PiantaVivaio = { ...dati, id: crypto.randomUUID(), salvataIl: new Date().toISOString() };
    await this.scrivi((r) => r.put(p));
    // Chiede al browser di non cancellare i dati quando serve spazio (architettura.md §3); se dice di no, pazienza
    void navigator.storage?.persist?.().catch(() => false);
    return p;
  }

  async rimetti(p: PiantaVivaio) {
    await this.scrivi((r) => r.put(p));
  }

  async aggiorna(id: string, modifiche: Pick<PiantaVivaio, "soprannome">) {
    const p = await this.leggi(id);
    if (!p) return;
    const soprannome = modifiche.soprannome?.trim() || undefined;
    await this.scrivi((r) => r.put({ ...p, soprannome }));
  }

  async elimina(id: string) {
    await this.scrivi((r) => r.delete(id));
  }
}

export const vivaio: ArchivioVivaio = new IndexedDbVivaio();

/** Avvisa quando il Vivaio cambia (per ridisegnare bacheca e pulsanti). */
export function ascoltaVivaio(avvisa: () => void) {
  window.addEventListener(EVENTO, avvisa);
  return () => window.removeEventListener(EVENTO, avvisa);
}
