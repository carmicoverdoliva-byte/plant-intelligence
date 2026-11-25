// Tetti prudenti sul server, oltre alla quota per telefono di Upstash (quota-server.ts). SOLO SERVER.
// Se Upstash non risponde restano questi, insieme al conteggio del telefono.
// Sono "al meglio delle possibilità": su Vercel il server può avere più copie in parallelo e ripartire da zero,
// quindi questi contatori non sono precisi.
// Valori configurabili con le variabili d'ambiente (non segrete), con questi predefiniti.

const oggiUtc = () => new Date().toISOString().slice(0, 10); // Pl@ntNet azzera il contatore a mezzanotte UTC

export const CONFIG = {
  /** Quota per dispositivo (D5): la conta Upstash; il telefono la mostra. */
  quotaPerDispositivo: Number(process.env.QUOTA_PER_DEVICE_PER_DAY) || 10,
  /** Tetto per indirizzo di rete, per copia del server: un po' sopra la quota, per la foto aggiunta (F05). */
  tettoPerIndirizzo: Number(process.env.IDENTIFY_PER_IP_PER_DAY) || 15,
  /** Riserva: quando Pl@ntNet dice che restano così poche identificazioni, il server si ferma. */
  riserva: Number(process.env.IDENTIFY_DAILY_RESERVE) || 25,
};

let giorno = oggiUtc();
let rimasteSecondoPlantNet: number | undefined;
const perIndirizzo = new Map<string, number>(); // indirizzo → richieste di oggi (solo in memoria, mai salvato)

function nuovoGiorno() {
  const oggi = oggiUtc();
  if (oggi !== giorno) {
    giorno = oggi;
    rimasteSecondoPlantNet = undefined;
    perIndirizzo.clear();
  }
}

/** Prima di chiamare Pl@ntNet: si può? */
export function puoChiedere(indirizzo: string): "si" | "tetto-indirizzo" | "riserva" {
  nuovoGiorno();
  if (rimasteSecondoPlantNet !== undefined && rimasteSecondoPlantNet <= CONFIG.riserva) return "riserva";
  if ((perIndirizzo.get(indirizzo) ?? 0) >= CONFIG.tettoPerIndirizzo) return "tetto-indirizzo";
  return "si";
}

/** Dopo una richiesta a Pl@ntNet: conta e ricorda quante ne restano oggi. */
export function registra(indirizzo: string, rimaste?: number) {
  nuovoGiorno();
  perIndirizzo.set(indirizzo, (perIndirizzo.get(indirizzo) ?? 0) + 1);
  if (typeof rimaste === "number") rimasteSecondoPlantNet = rimaste;
}

/** Quando Pl@ntNet risponde 429: per oggi è finita. */
export function segnaEsaurito() {
  nuovoGiorno();
  rimasteSecondoPlantNet = 0;
}
