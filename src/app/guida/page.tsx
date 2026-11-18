import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Bolla } from "@/components/bolla";
import { Icona, TRATTO } from "@/components/icona";
import { IntestazioneSezione } from "@/components/intestazione-sezione";
import { domande, tutorial } from "@/content/guida";

export const metadata: Metadata = { title: "Guida · Mandragola" };

// Guida (specifiche F02): tutorial per ogni funzione e domande frequenti. Testi in src/content/guida.ts
// (stessa fonte di docs/user-guide/guida.md). Elenco in vetro come l'elenco delle sezioni nel riferimento Scheda.
export default function Guida() {
  return (
    <main className="pagina">
      <IntestazioneSezione id="guida" />

      <Link
        href="/benvenuto"
        className="flex h-12 items-center justify-center gap-2 rounded-pillola bg-verde text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
      >
        <Icona nome="scintille" size={20} />
        Ripeti il tutorial iniziale
      </Link>

      <h2 className="text-[19px] font-black">Tutorial</h2>
      <ul className="vetro flex flex-col overflow-hidden rounded-[26px]">
        {tutorial.map((t) => (
          <li key={t.slug} className="border-b border-verde/12 last:border-b-0">
            <Link href={`/guida/${t.slug}`} className="flex min-h-16 items-center gap-3 px-4 py-2.5 text-testo">
              <Bolla tipo={t.bolla} lato={44}>
                <Icona nome={t.icona} size={22} />
              </Bolla>
              <span className="flex flex-1 flex-col">
                <span className="text-[15px] font-bold">{t.titolo}</span>
                <span className="text-[13px] leading-snug text-testo-3">{t.riassunto}</span>
              </span>
              <ChevronRight size={16} strokeWidth={TRATTO} aria-hidden="true" className="text-verde" />
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="text-[19px] font-black">Domande frequenti</h2>
      <div className="vetro flex flex-col overflow-hidden rounded-[26px]">
        {domande.map((d) => (
          <details key={d.domanda} className="group border-b border-verde/12 last:border-b-0">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
              {d.domanda}
              <ChevronDown
                size={16}
                strokeWidth={TRATTO}
                aria-hidden="true"
                className="shrink-0 text-verde transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-4 text-[15px] leading-snug text-testo-2">{d.risposta}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
