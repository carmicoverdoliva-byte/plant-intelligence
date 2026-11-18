import Link from "next/link";
import type { Bolla as TipoBolla, NomeIcona } from "@/content/guida";
import { Bolla } from "./bolla";
import { Icona } from "./icona";

// Riquadro onesto per le sezioni non ancora costruite: dice in quale fase arrivano, senza pulsanti finti.
export function InArrivo({ fase, bolla, icona }: { fase: string; bolla: TipoBolla; icona: NomeIcona }) {
  return (
    <section className="vetro-forte flex flex-col items-center gap-3 rounded-card px-6 py-8 text-center">
      <Bolla tipo={bolla} lato={64}>
        <Icona nome={icona} size={30} />
      </Bolla>
      <h2 className="text-xl font-black">In costruzione</h2>
      <p className="text-[15px] leading-snug text-testo-2">Questa sezione arriva nella {fase} della versione 1.</p>
      <Link
        href="/guida"
        className="mt-1 inline-flex h-11 items-center rounded-pillola px-4 text-[15px] font-extrabold text-verde underline-offset-4 hover:underline"
      >
        Apri la Guida
      </Link>
    </section>
  );
}
