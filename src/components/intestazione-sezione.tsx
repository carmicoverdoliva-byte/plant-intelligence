"use client";

import { useSyncExternalStore } from "react";
import { CircleHelp } from "lucide-react";
import { sezioni, type IdSezione } from "@/content/guida";
import { ascolta, leggi, scrivi } from "@/lib/memoria-locale";
import { Bolla } from "./bolla";
import { TRATTO } from "./icona";

// Titolo della sezione + pulsante "?" + riquadro di spiegazione della prima visita (specifiche F02).
// Il riquadro compare finché l'utente non tocca "Ho capito"; il "?" lo fa ricomparire.
export function IntestazioneSezione({ id }: { id: IdSezione }) {
  const chiave = `mandragola:spiegazione:${id}`;
  // Sul server non sappiamo cosa ha letto l'utente: il riquadro compare solo dopo, sul telefono
  const stato = useSyncExternalStore(ascolta, () => leggi(chiave), () => "server");
  const visibile = stato === null;
  const { titolo, testo } = sezioni[id];

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[30px] leading-tight font-black">{titolo}</h1>
        <button
          type="button"
          aria-label={`Cos'è la sezione ${titolo}?`}
          aria-expanded={visibile}
          onClick={() => scrivi(chiave, visibile ? "letta" : null)}
          className="vetro flex size-11 shrink-0 items-center justify-center rounded-pillola text-testo"
        >
          <CircleHelp size={20} strokeWidth={TRATTO} aria-hidden="true" />
        </button>
      </header>

      {visibile && (
        <section aria-label={`Spiegazione: ${titolo}`} className="vetro flex gap-3 rounded-riquadro p-4">
          <Bolla tipo="lime" lato={44}>
            <CircleHelp size={22} strokeWidth={TRATTO} aria-hidden="true" />
          </Bolla>
          <div className="flex flex-1 flex-col items-start gap-3">
            <p className="text-[15px] leading-snug text-testo-2">{testo}</p>
            <button
              type="button"
              onClick={() => scrivi(chiave, "letta")}
              className="h-11 rounded-pillola bg-verde px-5 text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
            >
              Ho capito
            </button>
          </div>
        </section>
      )}
    </>
  );
}
