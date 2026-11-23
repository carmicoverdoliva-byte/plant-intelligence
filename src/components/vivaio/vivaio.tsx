"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, Download, Sprout, Trash2, Upload } from "lucide-react";
import { ascolta, leggi, scrivi } from "@/lib/memoria-locale";
import { ascoltaVivaio, vivaio } from "@/lib/vivaio/archivio";
import { CHIAVE_ULTIMO_BACKUP, creaBackup, importaBackup } from "@/lib/vivaio/backup";
import { dataBreve, nomePianta, type PiantaVivaio } from "@/lib/vivaio/tipi";
import { Bolla } from "../bolla";
import { Finestrella } from "../finestrella";
import { Icona, TRATTO } from "../icona";
import { IntestazioneSezione } from "../intestazione-sezione";
import { SchedaSalvata } from "../schede/scheda-cura";

// VIVAIO (richiesta dell'utente del 2026-11-23, sostituisce "Le mie piante"). Tutto sul telefono (D3).
// Una sola pagina: la bacheca, e la scheda di una pianta quando l'indirizzo finisce con #p-<codice>. Così la pagina
// salvata dal service worker basta per aprire ogni pianta anche senza internet, senza chiamate a Pl@ntNet o all'AI.

const ascoltaIndirizzo = (avvisa: () => void) => {
  window.addEventListener("hashchange", avvisa);
  return () => window.removeEventListener("hashchange", avvisa);
};

function chiudiPianta() {
  history.replaceState(null, "", location.pathname);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/** Foto salvata sul telefono (un Blob): l'indirizzo temporaneo si crea e si libera qui. */
function FotoSalvata({ foto, alt, className }: { foto: Blob; alt: string; className: string }) {
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(foto);
    if (img.current) img.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [foto]);
  // Foto locale (Blob) disegnata dal browser: l'ottimizzazione di next/image non serve e non si applica
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={img} alt={alt} className={className} />;
}

export function Vivaio() {
  const indirizzo = useSyncExternalStore(ascoltaIndirizzo, () => location.hash, () => "");
  const id = indirizzo.startsWith("#p-") ? decodeURIComponent(indirizzo.slice(3)) : null;
  const [piante, setPiante] = useState<PiantaVivaio[] | null>(null);
  const [problema, setProblema] = useState(false);

  useEffect(() => {
    let attivo = true;
    const carica = () =>
      vivaio
        .elenco()
        .then((p) => attivo && setPiante(p))
        .catch(() => attivo && setProblema(true));
    void carica();
    const smetti = ascoltaVivaio(() => void carica());
    return () => {
      attivo = false;
      smetti();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  if (id) {
    const p = piante?.find((x) => x.id === id);
    if (piante && !p) {
      return (
        <div className="flex flex-col gap-4">
          <TornaAlVivaio />
          <p className="vetro rounded-riquadro p-4 text-[15px] text-testo-2">Questa pianta non è più nel tuo Vivaio.</p>
        </div>
      );
    }
    return p ? <SchedaDellaPianta key={p.id} p={p} /> : <p className="text-sm text-testo-3">Apro la pianta…</p>;
  }

  return (
    <>
      <IntestazioneSezione id="vivaio" />
      {problema ? (
        <p role="alert" className="vetro rounded-riquadro p-4 text-[15px] leading-snug text-testo-2">
          Non riesco ad aprire il Vivaio su questo telefono. Se sei in navigazione privata, aprilo in una finestra normale.
        </p>
      ) : piante === null ? (
        <p className="text-sm text-testo-3">Apro il Vivaio…</p>
      ) : piante.length === 0 ? (
        <VivaioVuoto />
      ) : (
        <Bacheca piante={piante} />
      )}
      <CopiaDiSicurezza quante={piante?.length ?? 0} />
    </>
  );
}

function VivaioVuoto() {
  return (
    <section className="vetro-forte flex flex-col items-center gap-3 rounded-card px-6 py-8 text-center">
      <Bolla tipo="verde" lato={64}>
        <Icona nome="piante" size={30} />
      </Bolla>
      <h2 className="text-xl font-black">Il tuo Vivaio è vuoto</h2>
      <p className="text-[15px] leading-snug text-testo-2">
        Riconosci una pianta e tocca &ldquo;Salva nel Vivaio&rdquo;: la ritrovi qui con la sua foto e la sua scheda di
        cura, anche senza internet.
      </p>
      <Link
        href="/fotocamera"
        className="mt-1 inline-flex h-11 items-center gap-2 rounded-pillola bg-verde px-[18px] text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
      >
        <Icona nome="fotocamera" size={18} />
        Fotografa una pianta
      </Link>
    </section>
  );
}

function Bacheca({ piante }: { piante: PiantaVivaio[] }) {
  return (
    <section aria-label="Le piante del Vivaio" className="flex flex-col gap-2.5">
      <p className="text-sm font-bold text-testo-3">
        {piante.length === 1 ? "1 pianta" : `${piante.length} piante`} su questo telefono
      </p>
      <ul className="grid grid-cols-2 gap-3">
        {piante.map((p) => (
          <li key={p.id}>
            <a href={`#p-${p.id}`} className="vetro flex h-full flex-col overflow-hidden rounded-riquadro">
              <div className="relative flex aspect-square items-center justify-center bg-bolla-verde">
                {p.miniatura ? (
                  <FotoSalvata foto={p.miniatura} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <Sprout size={36} strokeWidth={TRATTO} aria-hidden="true" className="text-icona-verde" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <span className="text-[15px] leading-tight font-extrabold">{nomePianta(p)}</span>
                {p.soprannome && p.nomeComune && <span className="text-[13px] text-testo-2">{p.nomeComune}</span>}
                <span className="text-[13px] text-testo-3">{dataBreve(p.salvataIl)}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TornaAlVivaio() {
  return (
    <button
      type="button"
      onClick={chiudiPianta}
      className="vetro inline-flex h-11 items-center gap-2 self-start rounded-pillola px-4 text-[15px] font-extrabold text-verde"
    >
      <ArrowLeft size={18} strokeWidth={TRATTO} aria-hidden="true" />
      Vivaio
    </button>
  );
}

function SchedaDellaPianta({ p }: { p: PiantaVivaio }) {
  const conferma = useRef<HTMLDialogElement>(null);
  const nome = nomePianta(p);
  return (
    <div className="flex flex-col gap-4">
      <TornaAlVivaio />
      {p.foto && (
        <div className="relative -mx-2 h-[260px] overflow-hidden rounded-[34px] ombra-foto">
          <FotoSalvata foto={p.foto} alt={`La tua foto: ${nome}`} className="absolute inset-0 size-full object-cover" />
        </div>
      )}
      <section className={`vetro-forte relative flex flex-col gap-2.5 rounded-card p-[18px] ${p.foto ? "-mt-16" : ""}`}>
        <h1 className="text-[30px] leading-tight font-black">{nome}</h1>
        <p className="text-sm text-testo-2">
          {p.soprannome && p.nomeComune ? `${p.nomeComune} · ` : ""}genere <i>{p.genere}</i> · probabilmente{" "}
          <i>{p.nomeScientifico}</i>
          {p.famiglia ? <> · famiglia {p.famiglia}</> : null}
        </p>
        <p className="text-[13px] text-testo-3">
          Salvata il {dataBreve(p.salvataIl)}
        </p>
        <Soprannome p={p} />
      </section>

      <SchedaSalvata scheda={p.scheda} specie={p.nomeScientifico} genere={p.genere} />

      <button
        type="button"
        onClick={() => conferma.current?.showModal()}
        className="vetro flex h-12 items-center justify-center gap-2 rounded-pillola text-[15px] font-extrabold text-icona-tossica"
      >
        <Trash2 size={20} strokeWidth={TRATTO} aria-hidden="true" />
        Elimina dal Vivaio
      </button>
      <Finestrella
        rif={conferma}
        pericolo
        titolo={`Vuoi eliminare “${nome}” dal Vivaio?`}
        testo="Spariscono la foto e la scheda salvata. Non si può annullare, a meno che tu non abbia un backup."
        si={{
          etichetta: "Sì, elimina",
          icona: <Trash2 size={20} strokeWidth={TRATTO} aria-hidden="true" />,
          azione: () => void vivaio.elimina(p.id).then(chiudiPianta),
        }}
        no="No, la tengo"
      />
    </div>
  );
}

function Soprannome({ p }: { p: PiantaVivaio }) {
  const [testo, setTesto] = useState(p.soprannome ?? "");
  const [salvato, setSalvato] = useState(false);
  const cambiato = testo.trim() !== (p.soprannome ?? "");

  async function salva(e: FormEvent) {
    e.preventDefault();
    await vivaio.aggiorna(p.id, { soprannome: testo });
    setSalvato(true);
  }

  return (
    <form onSubmit={salva} className="flex flex-col gap-1.5">
      <label htmlFor="soprannome" className="text-[13px] font-extrabold text-testo-3">
        Soprannome (facoltativo)
      </label>
      <div className="flex gap-2">
        {/* 16 px: con un carattere più piccolo l'iPhone ingrandisce la pagina quando si scrive */}
        <input
          id="soprannome"
          value={testo}
          maxLength={60}
          onChange={(e) => {
            setTesto(e.target.value);
            setSalvato(false);
          }}
          placeholder="es. quella del salotto"
          className="vetro h-11 min-w-0 flex-1 rounded-pillola px-4 text-base font-bold text-testo placeholder:font-semibold placeholder:text-testo-3"
        />
        <button
          type="submit"
          disabled={!cambiato}
          className="h-11 shrink-0 rounded-pillola bg-verde px-4 text-[15px] font-extrabold text-su-verde active:bg-verde-scuro disabled:opacity-60"
        >
          Salva
        </button>
      </div>
      {salvato && (
        <p role="status" className="text-[13px] font-bold text-verde-scuro">
          {testo.trim() ? "Soprannome salvato." : "Soprannome tolto."}
        </p>
      )}
    </form>
  );
}

function CopiaDiSicurezza({ quante }: { quante: number }) {
  const ultimo = useSyncExternalStore(ascolta, () => leggi(CHIAVE_ULTIMO_BACKUP), () => null);
  const scelta = useRef<HTMLInputElement>(null);
  const [messaggio, setMessaggio] = useState<{ testo: string; errore?: boolean } | null>(null);

  async function esporta() {
    setMessaggio(null);
    try {
      const file = await creaBackup();
      // Sull'iPhone il foglio "Condividi" permette di salvarlo in File / iCloud Drive; altrimenti si scarica
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Backup del Vivaio di Mandragola" });
        } catch (e) {
          if ((e as Error).name === "AbortError") return; // l'utente ha chiuso il foglio
          throw e;
        }
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
      scrivi(CHIAVE_ULTIMO_BACKUP, new Date().toISOString());
      setMessaggio({ testo: `Backup pronto: "${file.name}". Tienilo in un posto sicuro, per esempio iCloud Drive.` });
    } catch {
      setMessaggio({ testo: "Non sono riuscita a preparare il backup. Riprova tra poco.", errore: true });
    }
  }

  async function importa(file: File | undefined) {
    if (!file) return;
    setMessaggio(null);
    try {
      const r = await importaBackup(file);
      const parti = [r.aggiunte === 1 ? "Ho aggiunto 1 pianta." : `Ho aggiunto ${r.aggiunte} piante.`];
      if (r.giaPresenti) parti.push(r.giaPresenti === 1 ? "1 era già nel Vivaio." : `${r.giaPresenti} erano già nel Vivaio.`);
      if (r.scartate) parti.push(r.scartate === 1 ? "1 non si leggeva e l'ho lasciata fuori." : `${r.scartate} non si leggevano e le ho lasciate fuori.`);
      setMessaggio({ testo: parti.join(" ") });
    } catch {
      setMessaggio({ testo: "Questo file non è un backup del Vivaio di Mandragola.", errore: true });
    }
  }

  return (
    <section aria-label="Copia di sicurezza" className="vetro flex flex-col gap-3 rounded-riquadro p-4">
      <div className="flex items-center gap-3">
        <Bolla tipo="acqua" lato={44}>
          <Icona nome="file" size={22} />
        </Bolla>
        <h2 className="text-[17px] font-black">Copia di sicurezza</h2>
      </div>
      <p className="text-sm leading-snug text-testo-2">
        Le piante del Vivaio restano solo su questo telefono. Ogni tanto salvane una copia in un file, per esempio su
        iCloud Drive: con &ldquo;Importa backup&rdquo; le ritrovi anche su un altro telefono.
      </p>
      <p className="text-[13px] text-testo-3">Ultimo backup: {ultimo ? dataBreve(ultimo) : "mai"}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={esporta}
          disabled={quante === 0}
          className="vetro flex h-12 items-center justify-center gap-2 rounded-pillola text-[15px] font-extrabold text-verde disabled:opacity-60"
        >
          <Download size={18} strokeWidth={TRATTO} aria-hidden="true" />
          Esporta backup
        </button>
        <button
          type="button"
          onClick={() => scelta.current?.click()}
          className="vetro flex h-12 items-center justify-center gap-2 rounded-pillola text-[15px] font-extrabold text-verde"
        >
          <Upload size={18} strokeWidth={TRATTO} aria-hidden="true" />
          Importa backup
        </button>
      </div>
      <input
        ref={scelta}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          void importa(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {messaggio && (
        <p role="status" className={`text-sm leading-snug font-bold ${messaggio.errore ? "text-icona-pesca" : "text-verde-scuro"}`}>
          {messaggio.testo}
        </p>
      )}
    </section>
  );
}
