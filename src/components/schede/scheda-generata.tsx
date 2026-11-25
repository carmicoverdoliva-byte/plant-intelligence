"use client";

import { ChevronDown, Droplet, ExternalLink, FlaskConical, Layers, Shovel, Sprout, Sun, Thermometer, TriangleAlert, Bug } from "lucide-react";
import type { RispostaSchedaGenerata } from "@/app/api/scheda-generata/route";
import type { SezioneGenerata, Tossicita } from "@/lib/schede/genera/regole";
import { dataBreve } from "@/lib/vivaio/tipi";
import type { Bolla as TipoBolla } from "@/content/guida";
import { Bolla } from "../bolla";
import { TRATTO } from "../icona";

// Scheda di SPECIE generata (R2, D13): arriva qualche secondo dopo il risultato e prende il posto della scheda del tipo.
// Stesso aspetto della scheda del tipo (riferimento scheda.html); in cima il livello, sempre visibile (CLAUDE.md §8):
// "generata, basata sulle nostre fonti verificate" oppure "NON VERIFICATA".

const SEZIONI: { chiave: string; titolo: string; bolla: TipoBolla; icona: typeof Sun }[] = [
  { chiave: "luce", titolo: "Luce", bolla: "luce", icona: Sun },
  { chiave: "acqua", titolo: "Acqua", bolla: "azzurro", icona: Droplet },
  { chiave: "temperatura", titolo: "Temperatura", bolla: "pesca", icona: Thermometer },
  { chiave: "terriccio", titolo: "Terriccio", bolla: "lime", icona: Layers },
  { chiave: "concime", titolo: "Concime", bolla: "verde", icona: FlaskConical },
  { chiave: "travaso", titolo: "Travaso", bolla: "acqua", icona: Shovel },
  { chiave: "coltivarla", titolo: "Coltivarla da zero", bolla: "verde", icona: Sprout },
  { chiave: "problemi", titolo: "Problemi e malattie più comuni", bolla: "viola", icona: Bug },
];

const testoTossicita: Record<Tossicita, string> = {
  tossica: "Tossica",
  "non tossica": "Non tossica",
  varia: "Dipende dalla specie",
  "non verificata": "Non verificata",
};

function Rimandi({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return <sup className="ml-0.5 text-[11px] font-bold text-testo-3">[{ids.join(",")}]</sup>;
}

function BloccoSezione({ sez }: { sez: SezioneGenerata }) {
  const lg = sez.lineeGuida;
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-extrabold tracking-[0.6px] text-verde-scuro uppercase">Linee guida</span>
        <p className="text-[15px] leading-snug text-testo-2">
          {lg.riassunto}
          <Rimandi ids={lg.fonti} />
        </p>
        {lg.coseDaFare.length > 0 && (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-snug">
            {lg.coseDaFare.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </div>
      {sez.pollice.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold tracking-[0.6px] text-icona-lime uppercase">
            Consigli dal pollice verde · non ufficiali
          </span>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-snug text-testo-2">
            {sez.pollice.map((p) => (
              <li key={p.consiglio}>
                {p.consiglio}
                <Rimandi ids={p.fonti} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Quando è stato scritto il testo: "al momento" solo per chi l'ha appena fatta generare, altrimenti la data vera. */
function quandoGenerata(dati: RispostaSchedaGenerata, dalVivaio: boolean): string {
  if (dati.appenaGenerata && !dalVivaio) return "al momento";
  return dati.generataIl ? `il ${dataBreve(dati.generataIl)}` : "automaticamente"; // salvata prima che si tenesse la data
}

export function SchedaGenerata({
  dati,
  nomeTipo,
  dalVivaio = false,
}: {
  dati: RispostaSchedaGenerata;
  nomeTipo?: string;
  dalVivaio?: boolean;
}) {
  const s = dati.scheda;
  const fonti = Object.entries(dati.fonti);
  return (
    <section aria-label="Scheda di cura della specie" className="flex flex-col gap-3">
      <div className="vetro-forte flex flex-col gap-2 rounded-card p-[18px]">
        {dati.verificata ? (
          <span className="self-start rounded-pillola bg-bolla-verde px-3 py-1 text-[13px] font-extrabold text-verde-scuro">
            Scheda della specie (generata, basata sulle nostre fonti verificate)
          </span>
        ) : (
          <span className="self-start rounded-pillola bg-bolla-luce px-3 py-1 text-[13px] font-extrabold text-icona-luce">
            Scheda della specie · NON VERIFICATA
          </span>
        )}
        {/* Se non è verificata lo spiega già il riassunto qui sotto: niente doppione */}
        {dati.verificata && (
          <p className="text-[13px] leading-snug text-testo-3">
            Scritta da un&apos;intelligenza artificiale gratuita a partire dalle nostre schede verificate
            {nomeTipo ? ` (tipo "${nomeTipo}")` : ""} e da Wikipedia, poi controllata da regole automatiche. Le linee guida
            vengono solo dalle nostre fonti verificate.
          </p>
        )}
        <h2 className="text-[22px] leading-tight font-black">Come curarla</h2>
        <p className="text-[15px] leading-snug text-testo-2">{s.riassunto}</p>
        {s.coseDaFare.length > 0 && (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-snug">
            {s.coseDaFare.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="vetro flex flex-col overflow-hidden rounded-[26px]">
        {SEZIONI.map(({ chiave: k, titolo, bolla, icona: Icona }) =>
          s.sezioni[k] ? (
            <details key={k} className="group border-b border-verde/12 last:border-b-0">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-2 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                <Bolla tipo={bolla} lato={36}>
                  <Icona size={18} strokeWidth={TRATTO} aria-hidden="true" />
                </Bolla>
                <span className="flex-1">{titolo}</span>
                <ChevronDown size={16} strokeWidth={TRATTO} aria-hidden="true" className="text-verde transition-transform group-open:rotate-180" />
              </summary>
              <BloccoSezione sez={s.sezioni[k]} />
            </details>
          ) : null,
        )}
      </div>

      <section aria-label="Tossicità" className="flex flex-col gap-2 rounded-riquadro bg-bolla-tossica p-4 text-icona-tossica">
        <div className="flex items-center gap-2">
          <TriangleAlert size={20} strokeWidth={TRATTO} aria-hidden="true" />
          <h3 className="text-[17px] font-black">Tossicità</h3>
        </div>
        <p className="text-sm font-extrabold">
          Persone: {testoTossicita[s.tossicita.persone]} · Animali: {testoTossicita[s.tossicita.animali]}
        </p>
        <p className="text-sm leading-snug">
          {s.tossicita.nota}
          <Rimandi ids={s.tossicita.fonti} />
        </p>
      </section>

      <details className="group vetro rounded-riquadro">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[15px] font-extrabold [&::-webkit-details-marker]:hidden">
          Fonti della scheda ({fonti.length})
          <ChevronDown size={16} strokeWidth={TRATTO} aria-hidden="true" className="text-verde transition-transform group-open:rotate-180" />
        </summary>
        <ol className="flex flex-col gap-2 px-4 pb-4 text-[13px] leading-snug text-testo-2">
          {fonti.map(([id, f]) => (
            <li key={id}>
              [{id}]{" "}
              {f.url ? (
                <a href={f.url} target="_blank" rel="noopener noreferrer" data-inline className="font-bold text-verde underline">
                  {f.titolo}
                  <ExternalLink size={11} strokeWidth={TRATTO} aria-hidden="true" className="ml-0.5 inline align-[-1px]" />
                </a>
              ) : (
                <span className="font-bold">{f.titolo}</span>
              )}{" "}
              — {f.livello === "A" ? "nostra scheda verificata (A)" : "enciclopedia, non ufficiale (C)"}
            </li>
          ))}
        </ol>
      </details>
      <p className="px-1 text-xs leading-snug text-testo-3">
        Testo generato {quandoGenerata(dati, dalVivaio)} e controllato da regole automatiche, non rivisto da una persona.
      </p>
    </section>
  );
}
