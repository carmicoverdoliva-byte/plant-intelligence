"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookmarkPlus, Check, Loader2, Plus, Sprout } from "lucide-react";
import type { Candidato } from "@/lib/riconoscimento/classifica";
import { ascoltaVivaio, vivaio } from "@/lib/vivaio/archivio";
import { fotoPerVivaio } from "@/lib/vivaio/foto";
import type { PiantaVivaio, SchedaMostrata } from "@/lib/vivaio/tipi";
import { TRATTO } from "../icona";

// "Salva nel Vivaio" sotto il risultato (richiesta dell'utente del 2026-11-23).
// Salva foto ridotta, nomi, data e la scheda di cura MOSTRATA in quel momento. Se la scheda della specie sta ancora
// arrivando, aspetta e salva quando arriva (o quando l'app resta sulla scheda del tipo).
// Se la stessa specie è già nel Vivaio: "Già nel tuo Vivaio · Apri", con la possibilità di salvarla come pianta diversa.

type Stato = "pronto" | "in-attesa" | "salvataggio" | "salvata" | "errore";

export function SalvaNelVivaio({
  pianta,
  foto,
  scheda,
  inArrivo,
}: {
  pianta: Candidato;
  foto?: Blob;
  scheda: SchedaMostrata | null;
  inArrivo: boolean;
}) {
  const [stato, setStato] = useState<Stato>("pronto");
  const [salvataId, setSalvataId] = useState<string | null>(null);
  const [gia, setGia] = useState<PiantaVivaio | null>(null);
  const [comunque, setComunque] = useState(false);

  // Cerca la stessa specie nel Vivaio (e ricontrolla quando il Vivaio cambia)
  useEffect(() => {
    let attivo = true;
    const cerca = () =>
      vivaio
        .elenco()
        .then((tutte) => attivo && setGia(tutte.find((p) => p.nomeScientifico === pianta.nomeScientifico) ?? null))
        .catch(() => attivo && setGia(null));
    void cerca();
    const smetti = ascoltaVivaio(() => void cerca());
    return () => {
      attivo = false;
      smetti();
    };
  }, [pianta.nomeScientifico]);

  // Salvataggio rimandato: parte appena la scheda è arrivata (una volta sola, anche se lo stato cambia nel frattempo)
  const avviato = useRef(false);
  useEffect(() => {
    if (stato !== "in-attesa" || inArrivo || !scheda || avviato.current) return;
    avviato.current = true;
    void (async () => {
      setStato("salvataggio");
      try {
        const immagini = foto ? await fotoPerVivaio(foto) : {};
        const p = await vivaio.aggiungi({
          nomeComune: pianta.nomeComune || undefined,
          nomeScientifico: pianta.nomeScientifico,
          genere: pianta.genere,
          famiglia: pianta.famiglia,
          ...immagini,
          scheda,
        });
        setSalvataId(p.id);
        setStato("salvata");
      } catch {
        setStato("errore");
      } finally {
        avviato.current = false;
      }
    })();
  }, [stato, inArrivo, scheda, foto, pianta]);

  const salva = () => setStato("in-attesa");

  if (stato === "salvata" && salvataId) {
    return (
      <p role="status" className="vetro flex min-h-12 items-center gap-2 rounded-riquadro px-4 py-2 text-[15px] font-extrabold">
        <Check size={20} strokeWidth={TRATTO} aria-hidden="true" className="shrink-0 text-verde" />
        <span className="flex-1">Salvata nel tuo Vivaio</span>
        <Link href={`/vivaio#p-${salvataId}`} className="inline-flex min-h-11 items-center px-2 text-verde underline-offset-4 hover:underline">
          Apri
        </Link>
      </p>
    );
  }

  if (stato === "in-attesa" || stato === "salvataggio") {
    return (
      <p role="status" className="flex min-h-12 items-center gap-2 rounded-riquadro bg-bolla-verde px-4 py-2 text-[15px] font-bold text-verde-scuro">
        <Loader2 size={18} strokeWidth={TRATTO} aria-hidden="true" className="shrink-0 animate-spin" />
        {inArrivo ? "Salvo appena arriva la scheda di questa specie…" : "Salvo nel tuo Vivaio…"}
      </p>
    );
  }

  if (gia && !comunque) {
    return (
      <div className="vetro flex flex-col gap-1 rounded-riquadro px-4 py-2">
        <p className="flex min-h-11 items-center gap-2 text-[15px] font-extrabold">
          <Sprout size={20} strokeWidth={TRATTO} aria-hidden="true" className="shrink-0 text-verde" />
          <span className="flex-1">Già nel tuo Vivaio</span>
          <Link href={`/vivaio#p-${gia.id}`} className="inline-flex min-h-11 items-center px-2 text-verde underline-offset-4 hover:underline">
            Apri
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setComunque(true)}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-extrabold text-verde"
        >
          <Plus size={16} strokeWidth={TRATTO} aria-hidden="true" />
          È un&apos;altra pianta: salvala comunque
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={salva}
        disabled={!inArrivo && !scheda}
        className="flex h-12 items-center justify-center gap-2 rounded-pillola bg-verde text-[15px] font-extrabold text-su-verde active:bg-verde-scuro disabled:opacity-60"
      >
        <BookmarkPlus size={20} strokeWidth={TRATTO} aria-hidden="true" />
        {gia ? "Salva come pianta diversa" : "Salva nel Vivaio"}
      </button>
      {stato === "errore" && (
        <p role="alert" className="px-1 text-sm leading-snug text-icona-pesca">
          Non sono riuscita a salvarla. Forse lo spazio del telefono è pieno: riprova tra poco.
        </p>
      )}
      {!inArrivo && !scheda && (
        <p className="px-1 text-sm leading-snug text-testo-3">La scheda di cura non è arrivata: riprova quando torna la rete.</p>
      )}
    </div>
  );
}
