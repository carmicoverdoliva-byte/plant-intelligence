"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { TRATTO } from "./icona";

// "Nuova versione disponibile · Aggiorna" (richiesta dell'utente del 2026-11-18).
// Sull'iPhone l'app installata spesso viene "ripresa" dalla memoria invece di ricaricarsi: così resterebbe vecchia.
// Quando l'app torna in primo piano (e ogni 30 minuti) chiediamo al server la versione pubblicata; se è cambiata,
// mostriamo l'avviso. "Aggiorna" ricarica la pagina: i dati salvati sul telefono restano dove sono.
const MIA_VERSIONE = process.env.NEXT_PUBLIC_VERSIONE_APP;
const OGNI = 30 * 60 * 1000;

export function AvvisoAggiornamento() {
  const [nuova, setNuova] = useState(false);

  useEffect(() => {
    let ultimo = 0;
    const controlla = async () => {
      if (Date.now() - ultimo < 15_000 || document.visibilityState !== "visible") return;
      ultimo = Date.now();
      try {
        const r = await fetch("/api/versione", { cache: "no-store" });
        const { versione } = (await r.json()) as { versione?: string };
        if (versione && MIA_VERSIONE && versione !== MIA_VERSIONE) {
          setNuova(true);
          // Anche il service worker controlla se ce n'è uno nuovo
          navigator.serviceWorker?.getRegistration().then((reg) => reg?.update()).catch(() => {});
        }
      } catch {
        /* senza rete: si riprova alla prossima occasione */
      }
    };
    void controlla();
    document.addEventListener("visibilitychange", controlla);
    window.addEventListener("focus", controlla);
    const timer = window.setInterval(controlla, OGNI);
    return () => {
      document.removeEventListener("visibilitychange", controlla);
      window.removeEventListener("focus", controlla);
      window.clearInterval(timer);
    };
  }, []);

  if (!nuova) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="vetro-forte avviso-sopra-barra fixed inset-x-4 z-20 mx-auto flex max-w-md items-center gap-3 rounded-riquadro py-2 pr-2 pl-4"
    >
      <span className="flex-1 text-[15px] font-extrabold">Nuova versione disponibile</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex h-11 items-center gap-2 rounded-pillola bg-verde px-4 text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
      >
        <RefreshCw size={18} strokeWidth={TRATTO} aria-hidden="true" />
        Aggiorna
      </button>
    </div>
  );
}
