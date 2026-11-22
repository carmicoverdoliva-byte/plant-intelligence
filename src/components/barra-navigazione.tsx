"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import type { NomeIcona } from "@/content/guida";
import { chiediNuovaFoto, risultatoAperto } from "@/lib/risultato-aperto";
import { Icona } from "./icona";

// Barra di navigazione principale (specifiche F02), come nel riferimento Home: vetro flottante in basso,
// pulsante verde della fotocamera al centro. La Guida è sempre l'ultima voce, su ogni schermata.
const voci: { href: string; etichetta: string; icona: NomeIcona }[] = [
  { href: "/", etichetta: "Home", icona: "casa" },
  { href: "/piante", etichetta: "Le mie piante", icona: "piante" },
  { href: "/fotocamera", etichetta: "Fotocamera", icona: "fotocamera" },
  { href: "/promemoria", etichetta: "Promemoria", icona: "campanella" },
  { href: "/guida", etichetta: "Guida", icona: "guida" },
];

export function BarraNavigazione() {
  const percorso = usePathname();
  const finestra = useRef<HTMLDialogElement>(null);
  // Il tutorial iniziale occupa tutto lo schermo: lì la barra non serve (c'è "Salta")
  if (percorso.startsWith("/benvenuto")) return null;
  const attiva = (href: string) => (href === "/" ? percorso === "/" : percorso.startsWith(href));

  // Tasto verde: con un risultato aperto chiede prima se riconoscere un'altra pianta; altrimenti va alla fotocamera
  function tastoFotocamera(e: MouseEvent<HTMLAnchorElement>) {
    if (!risultatoAperto()) return;
    e.preventDefault();
    finestra.current?.showModal();
  }

  return (
    <>
    <dialog
      ref={finestra}
      aria-labelledby="domanda-nuova-foto"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close(); // tocco fuori dalla finestrella = "No"
      }}
      className="vetro-forte m-auto w-[calc(100%-40px)] max-w-sm rounded-card p-0 text-testo backdrop:bg-testo/35"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id="domanda-nuova-foto" className="text-[22px] leading-tight font-black">
          Vuoi riconoscere un&apos;altra pianta?
        </h2>
        <p className="text-[15px] leading-snug text-testo-2">Il risultato che stai guardando si chiude.</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              finestra.current?.close();
              chiediNuovaFoto();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-pillola bg-verde text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
          >
            <Icona nome="fotocamera" size={20} />
            Sì, nuova foto
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => finestra.current?.close()}
            className="vetro flex h-12 items-center justify-center rounded-pillola text-[15px] font-extrabold text-verde focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
          >
            No, resto qui
          </button>
        </div>
      </div>
    </dialog>
    <nav
      aria-label="Navigazione principale"
      className="vetro-forte barra-flottante fixed inset-x-4 z-10 mx-auto flex h-[68px] max-w-md items-center justify-around rounded-pillola px-2"
    >
      {voci.map((v) =>
        v.icona === "fotocamera" ? (
          <Link
            key={v.href}
            href={v.href}
            onClick={tastoFotocamera}
            aria-label={v.etichetta}
            aria-current={attiva(v.href) ? "page" : undefined}
            className="flex size-[58px] items-center justify-center rounded-pillola bg-verde text-su-verde ombra-pulsante active:bg-verde-scuro"
          >
            <Icona nome="fotocamera" size={24} />
          </Link>
        ) : (
          <Link
            key={v.href}
            href={v.href}
            aria-label={v.etichetta}
            aria-current={attiva(v.href) ? "page" : undefined}
            className={`flex size-12 items-center justify-center rounded-pillola ${
              attiva(v.href) ? "bg-verde/12 text-verde" : "text-testo-3"
            }`}
          >
            <Icona nome={v.icona} size={22} />
          </Link>
        ),
      )}
    </nav>
    </>
  );
}
