"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";

// Finestrella di conferma nello stile dell'app (vetro, angoli da card, non l'avviso grigio di sistema).
// Si apre con rif.current.showModal(). Il tocco fuori, il tasto Esc e il pulsante "no" la chiudono senza fare niente.
// Il pulsante "no" ha il focus all'apertura: è la scelta sicura. Anche il "sì" ha il contorno verde quando ha il focus.
export function Finestrella({
  rif,
  titolo,
  testo,
  si,
  no,
  pericolo = false,
}: {
  rif: RefObject<HTMLDialogElement | null>;
  titolo: string;
  testo: string;
  si: { etichetta: string; icona?: ReactNode; azione: () => void };
  no: string;
  /** true per le azioni che cancellano: pulsante "sì" nel colore della tossicità (contrasto 7,5:1) */
  pericolo?: boolean;
}) {
  const id = useId();
  // showModal() dà il focus all'elemento con l'attributo HTML "autofocus". La proprietà autoFocus di React non lo
  // scrive nella pagina (sposta il focus solo al montaggio, quando la finestrella è ancora chiusa): lo mettiamo noi,
  // così all'apertura il focus va sempre sul "no", la scelta sicura (prova del 2026-11-23: andava sul "sì").
  const pulsanteNo = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    pulsanteNo.current?.setAttribute("autofocus", "");
  }, []);
  return (
    <dialog
      ref={rif}
      aria-labelledby={id}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close(); // tocco fuori dalla finestrella = "no"
      }}
      className="vetro-forte m-auto w-[calc(100%-40px)] max-w-sm rounded-card p-0 text-testo backdrop:bg-testo/35"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id={id} className="text-[22px] leading-tight font-black">
          {titolo}
        </h2>
        <p className="text-[15px] leading-snug text-testo-2">{testo}</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              rif.current?.close();
              si.azione();
            }}
            className={`flex h-12 items-center justify-center gap-2 rounded-pillola text-[15px] font-extrabold text-su-verde focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde ${
              pericolo ? "bg-icona-tossica" : "bg-verde active:bg-verde-scuro"
            }`}
          >
            {si.icona}
            {si.etichetta}
          </button>
          <button
            ref={pulsanteNo}
            type="button"
            onClick={() => rif.current?.close()}
            className="vetro flex h-12 items-center justify-center rounded-pillola text-[15px] font-extrabold text-verde focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
          >
            {no}
          </button>
        </div>
      </div>
    </dialog>
  );
}
