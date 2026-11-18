"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import type { Descrizione } from "@/lib/riconoscimento/wikipedia";
import { Bolla } from "../bolla";
import { TRATTO } from "../icona";

// "Cos'è": descrizione da Wikipedia sotto il nome. Ben distinta dalla scheda di cura: è un estratto di
// un'enciclopedia aperta, con titolo, link, autori e licenza CC BY-SA 4.0. Se non c'è, il riquadro non compare.
const LUNGHEZZA = 420;

export function CosE({ specie, genere }: { specie: string; genere: string }) {
  const [stato, setStato] = useState<{ per: string; d: Descrizione | null } | null>(null);
  const [tutto, setTutto] = useState(false);
  const chiave = `${specie}|${genere}`;

  useEffect(() => {
    let attivo = true;
    fetch(`/api/descrizione?specie=${encodeURIComponent(specie)}&genere=${encodeURIComponent(genere)}`)
      .then((r) => r.json())
      .then((j) => attivo && setStato({ per: chiave, d: j?.ok ? (j.descrizione as Descrizione) : null }))
      .catch(() => attivo && setStato({ per: chiave, d: null }));
    return () => {
      attivo = false;
    };
  }, [chiave, specie, genere]);

  if (!stato || stato.per !== chiave) {
    return (
      <p className="vetro rounded-riquadro p-4 text-sm text-testo-3" aria-live="polite">
        Cerco una descrizione su Wikipedia…
      </p>
    );
  }
  const d = stato.d;
  if (!d) return null;

  const lungo = d.estratto.length > LUNGHEZZA;
  const testo = lungo && !tutto ? `${d.estratto.slice(0, LUNGHEZZA).replace(/\s+\S*$/, "")}…` : d.estratto;

  return (
    <section aria-label="Cos'è" className="vetro flex flex-col gap-2.5 rounded-riquadro p-4">
      <div className="flex items-center gap-3">
        <Bolla tipo="azzurro" lato={40}>
          <Info size={20} strokeWidth={TRATTO} aria-hidden="true" />
        </Bolla>
        <div className="flex flex-col">
          <h2 className="text-[19px] leading-tight font-black">Cos&apos;è</h2>
          <span className="text-[13px] font-bold text-testo-3">
            Descrizione da Wikipedia · non è una scheda di cura
          </span>
        </div>
      </div>
      {d.livello === "genere" && (
        <p className="text-[13px] font-bold text-testo-2">
          Non c&apos;è una voce su questa specie: la descrizione riguarda il genere <i>{d.titolo}</i>.
        </p>
      )}
      {d.lingua === "en" && <p className="text-[13px] font-bold text-testo-2">Voce disponibile solo in inglese.</p>}
      <p lang={d.lingua} className="text-[15px] leading-relaxed text-testo-2">
        {testo}
      </p>
      {lungo && (
        <button
          type="button"
          onClick={() => setTutto(!tutto)}
          className="-my-1 min-h-11 self-start text-[15px] font-extrabold text-verde"
        >
          {tutto ? "Mostra meno" : "Leggi tutto il riassunto"}
        </button>
      )}
      <p className="text-xs leading-relaxed text-testo-3">
        Estratto dalla voce{" "}
        <a href={d.url} data-inline target="_blank" rel="noopener noreferrer" className="font-bold text-verde underline">
          «{d.titolo}»
          <ExternalLink size={12} strokeWidth={TRATTO} aria-hidden="true" className="ml-0.5 inline align-[-1px]" />
        </a>{" "}
        di Wikipedia,{" "}
        <a href={d.autori} data-inline target="_blank" rel="noopener noreferrer" className="font-bold text-verde underline">
          autori della voce
        </a>
        , licenza{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/deed.it"
          target="_blank"
          rel="noopener noreferrer"
          data-inline
          className="font-bold text-verde underline"
        >
          CC BY-SA 4.0
        </a>
        .{lungo && !tutto ? " Testo accorciato." : ""}
      </p>
    </section>
  );
}
