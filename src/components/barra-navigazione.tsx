"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import type { NomeIcona } from "@/content/guida";
import { chiediNuovaFoto, risultatoAperto } from "@/lib/risultato-aperto";
import { Finestrella } from "./finestrella";
import { Icona } from "./icona";

// Barra di navigazione principale (specifiche F02), come nel riferimento Home: vetro flottante in basso,
// pulsante verde della fotocamera al centro. La Guida è sempre l'ultima voce, su ogni schermata.
const voci: { href: string; etichetta: string; icona: NomeIcona }[] = [
  { href: "/", etichetta: "Home", icona: "casa" },
  { href: "/vivaio", etichetta: "Vivaio", icona: "piante" },
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
    <Finestrella
      rif={finestra}
      titolo="Vuoi riconoscere un'altra pianta?"
      testo="Il risultato che stai guardando si chiude."
      si={{ etichetta: "Sì, nuova foto", icona: <Icona nome="fotocamera" size={20} />, azione: chiediNuovaFoto }}
      no="No, resto qui"
    />
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
