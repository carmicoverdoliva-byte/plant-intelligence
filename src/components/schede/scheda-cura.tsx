"use client";

import { useEffect, useMemo, useState } from "react";
import type { DatiSchedaTipo, SchedaMostrata } from "@/lib/vivaio/tipi";
import { ChevronDown, Loader2, Droplet, ExternalLink, FlaskConical, Layers, Leaf, Shovel, Sprout, Sun, Thermometer, TriangleAlert, Bug } from "lucide-react";
import type { SceltaScheda } from "@/lib/schede/scegli";
import type { Fonte, Sezione, SchedaCura as Scheda, Tossicita } from "@/lib/schede/tipi";
import { tossicitaPerPianta } from "@/lib/schede/tossicita";
import type { Bolla as TipoBolla } from "@/content/guida";
import { Bolla } from "../bolla";
import { TRATTO } from "../icona";
import { SchedaGenerata } from "./scheda-generata";
import type { RispostaSchedaGenerata } from "@/app/api/scheda-generata/route";

// Scheda di cura sotto il risultato del riconoscimento (rilascio R1, D13). Dal riferimento scheda.html:
// elenco di sezioni in vetro; ogni sezione ha "Linee guida" (fonti ufficiali) e "Consigli dal pollice verde"
// (non ufficiali). In cima il LIVELLO della scheda, sempre visibile (CLAUDE.md §8).

const SEZIONI: { chiave: keyof Scheda["sezioni"]; titolo: string; bolla: TipoBolla; icona: typeof Sun }[] = [
  { chiave: "luce", titolo: "Luce", bolla: "luce", icona: Sun },
  { chiave: "acqua", titolo: "Acqua", bolla: "azzurro", icona: Droplet },
  { chiave: "temperatura", titolo: "Temperatura", bolla: "pesca", icona: Thermometer },
  { chiave: "terriccio", titolo: "Terriccio", bolla: "lime", icona: Layers },
  { chiave: "concime", titolo: "Concime", bolla: "verde", icona: FlaskConical },
  { chiave: "travaso", titolo: "Travaso", bolla: "acqua", icona: Shovel },
  { chiave: "coltivarla", titolo: "Coltivarla da zero", bolla: "verde", icona: Sprout },
  { chiave: "problemi", titolo: "Problemi e malattie più comuni", bolla: "viola", icona: Bug },
];

const BASE: Record<SceltaScheda["base"], string> = {
  manuale: "abbiamo indicato a mano il tipo di questa pianta",
  famiglia: "il tipo deriva dalla sua famiglia botanica",
  wcvp: "il tipo deriva da forma e clima d'origine delle specie del genere (dati WCVP, Kew)",
  "famiglia-maggioranza": "il tipo deriva dalle piante più comuni della sua famiglia (dati WCVP, Kew)",
  "nessun-dato": "non abbiamo dati sul genere: consigli generali",
  "genere-sconosciuto": "genere non presente nei nostri dati: consigli generali",
};

const testoTossicita: Record<Tossicita, string> = {
  tossica: "Tossica",
  "non tossica": "Non tossica",
  varia: "Dipende dalla specie",
  "non verificata": "Non verificata",
};

function Rimandi({ ids }: { ids: number[] }) {
  if (!ids.length) return null;
  return <sup className="ml-0.5 text-[11px] font-bold text-testo-3">[{ids.join(",")}]</sup>;
}

function BloccoSezione({ sez }: { sez: Sezione }) {
  const lg = sez.lineeGuida;
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-extrabold tracking-[0.6px] text-verde-scuro uppercase">Linee guida</span>
        <p className="text-[15px] leading-snug text-testo-2">
          {lg.riassunto}
          <Rimandi ids={lg.fonti} />
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-snug">
          {lg.coseDaFare.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {lg.valori?.length ? (
          <dl className="flex flex-col gap-1.5 rounded-bolla bg-bolla-verde/40 p-3">
            {lg.valori.map((v) => (
              <div key={v.etichetta} className="flex flex-col">
                <dt className="text-[13px] font-extrabold text-testo-3">{v.etichetta}</dt>
                <dd className="text-[15px] font-bold">
                  {v.valore}
                  <Rimandi ids={v.fonti} />
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {lg.disaccordi?.map((d) => (
          <div key={d.tema} className="rounded-bolla bg-bolla-luce p-3 text-sm leading-snug text-testo">
            <p className="font-extrabold">Le fonti non sono d&apos;accordo: {d.tema.toLowerCase()}</p>
            <ul className="mt-1 list-disc pl-5">
              {d.posizioni.map((p) => (
                <li key={p.dice}>
                  {p.dice}
                  <Rimandi ids={p.fonti} />
                </li>
              ))}
            </ul>
            <p className="mt-1">
              <span className="font-extrabold">Scelta prudente:</span> {d.sceltaPrudente}
            </p>
          </div>
        ))}
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

function ElencoFonti({ fonti, titolo }: { fonti: Fonte[]; titolo: string }) {
  return (
    <details className="group vetro rounded-riquadro">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[15px] font-extrabold [&::-webkit-details-marker]:hidden">
        {titolo}
        <ChevronDown size={16} strokeWidth={TRATTO} aria-hidden="true" className="text-verde transition-transform group-open:rotate-180" />
      </summary>
      <ol className="flex flex-col gap-2 px-4 pb-4 text-[13px] leading-snug text-testo-2">
        {fonti.map((f) => (
          <li key={f.id}>
            [{f.id}]{" "}
            <a href={f.url} target="_blank" rel="noopener noreferrer" data-inline className="font-bold text-verde underline">
              {f.titolo}
              <ExternalLink size={11} strokeWidth={TRATTO} aria-hidden="true" className="ml-0.5 inline align-[-1px]" />
            </a>{" "}
            — {f.sito} · fonte {f.livello === "A" ? "ufficiale (A)" : f.livello === "B" ? "vivaio o associazione (B)" : "rivista o blog (C)"} ·
            consultata il {f.consultato.split("-").reverse().join("/")}
          </li>
        ))}
      </ol>
    </details>
  );
}

// Una sola richiesta per pianta: se la scheda si ricarica mentre aspetta, riusa la stessa (niente neuron sprecati)
const richiesteGenerate = new Map<string, Promise<RispostaSchedaGenerata | null>>();
function chiediGenerata(chiave: string, specie: string, genere: string, famiglia: string) {
  let p = richiesteGenerate.get(chiave);
  if (!p) {
    const q = new URLSearchParams({ specie, genere, ...(famiglia ? { famiglia } : {}) });
    p = fetch(`/api/scheda-generata?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.ok && j.tipo === "generata" ? (j as RispostaSchedaGenerata) : null))
      .catch(() => null);
    richiesteGenerate.set(chiave, p);
    // Se non è arrivata (ripiego, errore) si potrà riprovare la prossima volta che si apre questa pianta
    void p.then((d) => {
      if (!d) richiesteGenerate.delete(chiave);
    });
  }
  return p;
}

export function SchedaCura({
  specie,
  genere,
  famiglia,
  onMostrata,
}: {
  specie: string;
  genere: string;
  famiglia: string;
  /** Avvisa quale scheda si vede adesso e se ne sta arrivando una più precisa (per "Salva nel Vivaio") */
  onMostrata?: (scheda: SchedaMostrata | null, inArrivo: boolean) => void;
}) {
  const chiave = `${specie}|${genere}|${famiglia}`;
  const [stato, setStato] = useState<{ per: string; dati: (SceltaScheda & { ok: true }) | null } | null>(null);
  // Scheda della SPECIE generata (R2): si chiede subito, in parallelo; intanto si vede la scheda del tipo.
  // Se non arriva (spenta, quota finita, errore) resta la scheda del tipo, senza messaggi tecnici.
  const [generata, setGenerata] = useState<{ per: string; dati: RispostaSchedaGenerata | null } | null>(null);
  const conSpecie = specie.trim().split(/\s+/).length >= 2;

  useEffect(() => {
    if (!conSpecie) return;
    let attivo = true;
    chiediGenerata(chiave, specie, genere, famiglia).then((dati) => attivo && setGenerata({ per: chiave, dati }));
    return () => {
      attivo = false;
    };
  }, [chiave, conSpecie, specie, genere, famiglia]);
  const inPreparazione = conSpecie && (!generata || generata.per !== chiave);
  const datiGenerata = generata?.per === chiave ? generata.dati : null;

  useEffect(() => {
    let attivo = true;
    const q = new URLSearchParams({ specie, genere, ...(famiglia ? { famiglia } : {}) });
    fetch(`/api/scheda?${q}`)
      .then((r) => r.json())
      .then((j) => attivo && setStato({ per: chiave, dati: j?.ok ? j : null }))
      .catch(() => attivo && setStato({ per: chiave, dati: null }));
    return () => {
      attivo = false;
    };
  }, [chiave, specie, genere, famiglia]);

  const pronta = !!stato && stato.per === chiave;
  const d = stato && stato.per === chiave ? stato.dati : null;
  // Cosa si vede adesso (e se sta ancora arrivando qualcosa): serve al pulsante "Salva nel Vivaio"
  const mostrata = useMemo<SchedaMostrata | null>(
    () => (datiGenerata ? { tipo: "generata", dati: datiGenerata, nomeTipo: d?.nomeTipo } : d ? { tipo: "tipo", dati: d } : null),
    [datiGenerata, d],
  );
  const inArrivo = !pronta || inPreparazione;
  useEffect(() => {
    onMostrata?.(mostrata, inArrivo);
  }, [mostrata, inArrivo, onMostrata]);

  if (!pronta) {
    return <p className="vetro rounded-riquadro p-4 text-sm text-testo-3">Preparo la scheda di cura…</p>;
  }
  if (datiGenerata) return <SchedaGenerata dati={datiGenerata} nomeTipo={d?.nomeTipo} />;
  if (!d) {
    return (
      <p className="vetro rounded-riquadro p-4 text-[15px] text-testo-2">
        Non riesco a caricare la scheda di cura adesso. Riprova tra poco.
      </p>
    );
  }
  return <SchedaTipo dati={d} specie={specie} genere={genere} inPreparazione={inPreparazione} />;
}

/** Una scheda salvata nel Vivaio: si ridisegna dai dati conservati, senza internet e senza chiamate. */
export function SchedaSalvata({ scheda, specie, genere }: { scheda: SchedaMostrata; specie: string; genere: string }) {
  return scheda.tipo === "generata" ? (
    <SchedaGenerata dati={scheda.dati} nomeTipo={scheda.nomeTipo} dalVivaio />
  ) : (
    <SchedaTipo dati={scheda.dati} specie={specie} genere={genere} />
  );
}

/** La scheda del TIPO di pianta, disegnata dai suoi dati (presi dal server o dal Vivaio). */
function SchedaTipo({
  dati: d,
  specie,
  genere,
  inPreparazione = false,
}: {
  dati: DatiSchedaTipo;
  specie: string;
  genere: string;
  inPreparazione?: boolean;
}) {
  const s = d.scheda;
  // Tossicità per QUESTA pianta: se le nostre fonti nominano il suo genere vale quel caso, non "Dipende dalla specie"
  const tossicita = s ? tossicitaPerPianta(s.tossicita, specie, genere) : null;

  return (
    <section aria-label="Scheda di cura" className="flex flex-col gap-3">
      <div className="vetro-forte flex flex-col gap-2 rounded-card p-[18px]">
        <span className="self-start rounded-pillola bg-bolla-acqua px-3 py-1 text-[13px] font-extrabold text-testo-2">
          Scheda del tipo: {d.nomeTipo}
        </span>
        <p className="text-[13px] leading-snug text-testo-3">
          Vale per molte piante di questo tipo, non solo per la tua: {BASE[d.base]}.
        </p>
        {inPreparazione && (
          <p role="status" className="flex items-center gap-2 rounded-bolla bg-bolla-verde px-3 py-2 text-[13px] font-bold text-verde-scuro">
            <Loader2 size={16} strokeWidth={TRATTO} aria-hidden="true" className="shrink-0 animate-spin" />
            Sto preparando la scheda di questa specie… circa 10 secondi
          </p>
        )}
        {s ? (
          <>
            <h2 className="text-[22px] leading-tight font-black">Come curarla</h2>
            <p className="text-[15px] leading-snug text-testo-2">{s.riassunto}</p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-snug">
              {s.coseDaFare.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            {s.eccezioni.length > 0 && (
              <p className="text-[13px] leading-snug text-testo-3">
                <span className="font-extrabold">Attenzione:</span> {s.eccezioni.join(" ")}
              </p>
            )}
          </>
        ) : (
          <p className="text-[15px] leading-snug text-testo-2">
            La scheda per questo tipo di pianta è <strong>in preparazione</strong>: la pubblichiamo appena è verificata con
            le fonti.
          </p>
        )}
      </div>

      {s && (
        <div className="vetro flex flex-col overflow-hidden rounded-[26px]">
          {SEZIONI.map(({ chiave: k, titolo, bolla, icona: Icona }) => (
            <details key={k} className="group border-b border-verde/12 last:border-b-0">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-2 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                <Bolla tipo={bolla} lato={36}>
                  <Icona size={18} strokeWidth={TRATTO} aria-hidden="true" />
                </Bolla>
                <span className="flex-1">{titolo}</span>
                <ChevronDown size={16} strokeWidth={TRATTO} aria-hidden="true" className="text-verde transition-transform group-open:rotate-180" />
              </summary>
              <BloccoSezione sez={s.sezioni[k]} />
              {k === "problemi" && (
                <ul className="flex flex-col gap-2 px-4 pb-4">
                  {s.sezioni.problemi.elenco.map((p) => (
                    <li key={p.nome} className="rounded-bolla bg-bolla-viola/50 p-3 text-sm leading-snug">
                      <p className="font-extrabold">
                        {p.nome}
                        <Rimandi ids={p.fonti} />
                      </p>
                      <p className="text-testo-2">Cosa vedi: {p.segni.join("; ")}.</p>
                      <p className="text-testo-2">Come prevenirlo: {p.prevenzione.join("; ")}.</p>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>
      )}

      {s?.falsiMiti.map((m) => (
        <section key={m.mito} aria-label="Falso mito" className="magia flex flex-col gap-1.5 rounded-[26px] px-4 py-3.5">
          <span className="text-xs font-extrabold tracking-[0.8px] text-etichetta-su-viola uppercase">
            Falso mito · {m.verdetto}
          </span>
          <p className="text-[15px] font-bold leading-snug">&ldquo;{m.mito}&rdquo;</p>
          <p className="text-[15px] leading-snug">{m.cosaDiconoLeFonti}</p>
          <p className="text-[15px] leading-snug">
            <span className="font-extrabold">In pratica:</span> {m.inPratica} <span className="text-[13px]">[{m.fonti.join(",")}]</span>
          </p>
        </section>
      ))}

      {tossicita && (
        <section aria-label="Tossicità" className="flex flex-col gap-2 rounded-riquadro bg-bolla-tossica p-4 text-icona-tossica">
          <div className="flex items-center gap-2">
            <TriangleAlert size={20} strokeWidth={TRATTO} aria-hidden="true" />
            <h3 className="text-[17px] font-black">Tossicità</h3>
          </div>
          <p className="text-sm font-extrabold">
            Persone: {testoTossicita[tossicita.persone]} · Animali: {testoTossicita[tossicita.animali]}
          </p>
          <p className="text-sm leading-snug">
            {tossicita.nota}
            <Rimandi ids={tossicita.fonti} />
          </p>
        </section>
      )}

      {d.notaFamiglia && (
        <section aria-label="Nota sulla famiglia" className="vetro flex flex-col gap-2 rounded-riquadro p-4">
          <div className="flex items-center gap-2">
            <Leaf size={18} strokeWidth={TRATTO} aria-hidden="true" className="text-verde" />
            <h3 className="text-[17px] font-black">
              Nota sulla famiglia: {d.notaFamiglia.nomeComune} ({d.notaFamiglia.famiglia})
            </h3>
          </div>
          {d.notaFamiglia.note.map((n) => (
            <p key={n.tema} className="text-sm leading-snug text-testo-2">
              <span className="font-extrabold capitalize">{n.tema}:</span> {n.testo}
              <Rimandi ids={n.fonti} />
            </p>
          ))}
          <ElencoFonti fonti={d.notaFamiglia.fonti} titolo="Fonti della nota" />
        </section>
      )}

      {s && (
        <>
          {s.approfondimenti.length === 0 && (
            <p className="px-1 text-[13px] leading-snug text-testo-3">
              Approfondimenti: non abbiamo ancora scelto articoli adatti per questo tipo di pianta.
            </p>
          )}
          <ElencoFonti fonti={s.fonti} titolo={`Fonti della scheda (${s.fonti.length})`} />
          <p className="px-1 text-xs leading-snug text-testo-3">
            Testi scritti da noi a partire dalle fonti, versione {s.versione} del{" "}
            {s.aggiornata.split("-").reverse().join("/")}
            {s.verifica.verificaIndipendente ? " · verificata con le fonti" : ""}.
          </p>
        </>
      )}
    </section>
  );
}
