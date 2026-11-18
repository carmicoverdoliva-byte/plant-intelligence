import Link from "next/link";
import { ArrowRight, CircleHelp, Sparkles } from "lucide-react";
import { Bolla } from "@/components/bolla";
import { Icona, TRATTO } from "@/components/icona";
import { IllustrazioneRiconosci } from "@/components/illustrazione-riconosci";
import { ControlloPrimoAvvio } from "@/components/controllo-primo-avvio";
import { InvitoInstallazione } from "@/components/invito-installazione";
import { LogoMandragola } from "@/components/logo-mandragola";
import type { Bolla as TipoBolla, NomeIcona } from "@/content/guida";

// Home (passo 1.1), dal riferimento docs/design/riferimenti/home.html.
// Differenze volute: niente campo di ricerca finché la ricerca non funziona (passo 3.2); "Da fare oggi" vuoto
// finché non ci sono promemoria (fase 5); il Falso mito cita la sua fonte (CLAUDE.md §8).
const azioni: { href: string; etichetta: string; bolla: TipoBolla; icona: NomeIcona }[] = [
  { href: "/piante", etichetta: "Le mie piante", bolla: "verde", icona: "piante" },
  { href: "/promemoria", etichetta: "Promemoria", bolla: "acqua", icona: "promemoria" },
  { href: "/nuova-pianta", etichetta: "Nuova pianta", bolla: "viola", icona: "nuova-pianta" },
  { href: "/guida", etichetta: "Guida", bolla: "lime", icona: "guida" },
];

export default function Home() {
  return (
    <main className="pagina">
      <ControlloPrimoAvvio />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMandragola size={44} />
          <span className="text-xl font-black tracking-[0.2px]">Mandragola</span>
        </div>
        <Link
          href="/guida"
          aria-label="Guida"
          className="vetro flex size-11 items-center justify-center rounded-pillola text-testo"
        >
          <CircleHelp size={20} strokeWidth={TRATTO} aria-hidden="true" />
        </Link>
      </header>

      <h1 className="text-[32px] leading-[1.12] font-black">
        Cosa scopriamo
        <br />
        <span className="text-verde">oggi?</span>
      </h1>

      <InvitoInstallazione />

      <section className="vetro-forte flex items-center justify-between gap-3 rounded-card p-5">
        <div className="flex max-w-[190px] flex-col gap-2">
          <h2 className="text-[22px] leading-tight font-black">
            Riconosci una pianta{" "}
            <Sparkles size={18} strokeWidth={TRATTO} aria-hidden="true" className="inline align-[-2px] text-scintilla" />
          </h2>
          <p className="text-sm leading-snug text-testo-2">Inquadrala: il nome compare mentre la guardi.</p>
          <Link
            href="/fotocamera"
            className="mt-1.5 inline-flex h-11 items-center gap-2 self-start rounded-pillola bg-verde px-[18px] text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
          >
            Inquadra
            <ArrowRight size={16} strokeWidth={TRATTO} aria-hidden="true" />
          </Link>
        </div>
        <IllustrazioneRiconosci />
      </section>

      <nav aria-label="Azioni rapide" className="grid grid-cols-4 gap-2.5">
        {azioni.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="vetro flex flex-col items-center gap-2 rounded-riquadro px-1 py-3.5 text-center text-xs font-extrabold text-testo"
          >
            <Bolla tipo={a.bolla}>
              <Icona nome={a.icona} size={24} />
            </Bolla>
            {a.etichetta}
          </Link>
        ))}
      </nav>

      <div className="flex items-baseline justify-between">
        <h2 className="text-[19px] font-black">Da fare oggi</h2>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="vetro flex items-center gap-3 rounded-[26px] p-3">
          <Bolla tipo="verde" lato={48}>
            <Icona nome="piante" size={26} />
          </Bolla>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-extrabold">Ancora niente da fare</span>
            <span className="text-[13px] text-testo-3">I promemoria arrivano quando salvi le tue piante.</span>
          </div>
        </div>

        <section aria-label="Falso mito" className="magia flex flex-col gap-1.5 rounded-[26px] px-4 py-3.5">
          <span className="text-xs font-extrabold tracking-[0.8px] text-etichetta-su-viola uppercase">Falso mito</span>
          <p className="text-[15px] leading-snug">
            &ldquo;La ghiaia sul fondo del vaso migliora il drenaggio.&rdquo; In realtà fa ristagnare l&apos;acqua più
            in alto.
          </p>
          <a
            href="https://s3.wp.wsu.edu/uploads/sites/403/2015/03/container-drainage.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="-my-2 inline-flex min-h-11 items-center self-start text-[13px] font-bold underline underline-offset-2"
          >
            Fonte: L. Chalker-Scott, Washington State University
          </a>
        </section>
      </div>
    </main>
  );
}
