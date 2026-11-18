"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Sparkles } from "lucide-react";
import { onboarding } from "@/content/guida";
import { scrivi } from "@/lib/memoria-locale";
import { CHIAVE_ONBOARDING, installata } from "@/lib/primo-avvio";
import { Bolla } from "./bolla";
import { Icona, TRATTO } from "./icona";
import { LogoMandragola } from "./logo-mandragola";

// Tutorial del primo avvio (specifiche F01): 6 schermate, ognuna si può saltare; si ripete dalla Guida.
// I permessi di iOS NON si chiedono qui: si spiegano, e si chiedono quando servono davvero (primo scatto, finestre).
const nessunaIscrizione = () => () => {};

export function Onboarding() {
  const router = useRouter();
  const [indice, setIndice] = useState(0);
  const titolo = useRef<HTMLHeadingElement>(null);
  const appInstallata = useSyncExternalStore(nessunaIscrizione, installata, () => false);
  const passo = onboarding[indice];
  const ultimo = indice === onboarding.length - 1;

  // A ogni cambio di schermata il lettore di schermo riparte dal titolo
  useEffect(() => {
    if (indice > 0) titolo.current?.focus();
  }, [indice]);

  const fine = () => {
    scrivi(CHIAVE_ONBOARDING, "visto");
    // Next.js tiene in memoria questa pagina: se l'utente ripete il tutorial dalla Guida deve ripartire dall'inizio
    setIndice(0);
    router.replace("/");
  };

  return (
    <main className="pagina pagina-intera">
      <div className="flex items-center justify-between">
        <ol className="flex gap-1.5" aria-label={`Schermata ${indice + 1} di ${onboarding.length}`}>
          {onboarding.map((p, i) => (
            <li
              key={p.id}
              aria-hidden="true"
              className={`h-2 rounded-pillola transition-all ${i === indice ? "w-6 bg-verde" : "w-2 bg-verde/25"}`}
            />
          ))}
        </ol>
        <button type="button" onClick={fine} className="h-11 rounded-pillola px-4 text-[15px] font-extrabold text-verde">
          Salta
        </button>
      </div>

      {passo.id === "benvenuto" && (
        <div className="flex justify-center pt-2">
          <LogoMandragola size={96} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 ref={titolo} tabIndex={-1} className="text-[30px] leading-tight font-black outline-none">
          {passo.titolo}
        </h1>
        <p className="text-[15px] leading-snug text-testo-2">{passo.testo}</p>
      </div>

      {passo.extra === "esempio-risultato" && (
        <section aria-label="Esempio di risultato" className="vetro-forte flex flex-col gap-2 rounded-card p-5">
          <span className="text-xs font-extrabold tracking-[0.8px] text-testo-3 uppercase">Esempio</span>
          <span className="text-[26px] leading-none font-black">Pothos</span>
          <span className="text-sm text-testo-2">
            genere <i>Epipremnum</i> · probabilmente <i>E. aureum</i>
          </span>
          <span className="mt-1 inline-flex items-center gap-2 self-start rounded-pillola bg-bolla-viola px-3 py-1.5 text-[13px] font-extrabold text-icona-viola">
            <Sparkles size={16} strokeWidth={TRATTO} aria-hidden="true" />
            Forse: Pothos o Filodendro
          </span>
        </section>
      )}

      {passo.extra === "installazione" && appInstallata && (
        <div className="vetro flex items-center gap-3 rounded-riquadro p-4">
          <CircleCheck size={26} strokeWidth={TRATTO} aria-hidden="true" className="shrink-0 text-verde" />
          <p className="text-[15px] font-bold">Fatto: stai già usando l&apos;app installata sulla Home.</p>
        </div>
      )}

      <ul className="flex flex-col gap-2.5">
        {passo.punti.map((p) => (
          <li key={p.titolo} className="vetro flex items-start gap-3 rounded-riquadro p-3.5">
            <Bolla tipo={p.bolla}>
              <Icona nome={p.icona} size={24} />
            </Bolla>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-extrabold">{p.titolo}</span>
              <span className="text-sm leading-snug text-testo-2">{p.testo}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex gap-3 pt-2">
        {indice > 0 && (
          <button
            type="button"
            onClick={() => setIndice(indice - 1)}
            className="vetro h-12 flex-1 rounded-pillola text-[15px] font-extrabold text-verde"
          >
            Indietro
          </button>
        )}
        <button
          type="button"
          onClick={() => (ultimo ? fine() : setIndice(indice + 1))}
          className="h-12 flex-[2] rounded-pillola bg-verde text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
        >
          {ultimo ? "Inizia" : "Avanti"}
        </button>
      </div>
    </main>
  );
}
