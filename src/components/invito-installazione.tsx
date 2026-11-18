"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { ascolta, leggi, scrivi } from "@/lib/memoria-locale";
import { CHIAVE_INVITO_INSTALLAZIONE, installata } from "@/lib/primo-avvio";
import { Bolla } from "./bolla";
import { Icona, TRATTO } from "./icona";

// Invito discreto e chiudibile a installare l'app, solo se è aperta da Safari (specifiche F01, decisione D3).
export function InvitoInstallazione() {
  const visibile = useSyncExternalStore(
    ascolta,
    () => !installata() && leggi(CHIAVE_INVITO_INSTALLAZIONE) !== "chiuso",
    () => false,
  );
  if (!visibile) return null;

  return (
    <aside aria-label="Installa l'app" className="vetro flex items-center gap-3 rounded-riquadro py-2 pr-1 pl-3">
      <Bolla tipo="verde" lato={40}>
        <Icona nome="telefono" size={20} />
      </Bolla>
      <Link href="/guida/installare-l-app" className="flex min-h-11 flex-1 flex-col justify-center">
        <span className="text-sm font-extrabold">Mettila sulla schermata Home</span>
        <span className="text-[13px] leading-snug text-testo-3">Così Safari non cancella le tue piante.</span>
      </Link>
      <button
        type="button"
        aria-label="Chiudi l'invito"
        onClick={() => scrivi(CHIAVE_INVITO_INSTALLAZIONE, "chiuso")}
        className="flex size-11 shrink-0 items-center justify-center rounded-pillola text-testo-3"
      >
        <X size={20} strokeWidth={TRATTO} aria-hidden="true" />
      </button>
    </aside>
  );
}
