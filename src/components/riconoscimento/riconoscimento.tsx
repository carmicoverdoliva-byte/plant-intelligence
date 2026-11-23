"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Camera, ImagePlus, LoaderCircle, Search, X } from "lucide-react";
import type { Risultato } from "@/lib/riconoscimento/classifica";
import { riduciFoto } from "@/lib/riconoscimento/foto";
import { ascolta } from "@/lib/memoria-locale";
import { ascoltaNuovaFoto, segnaRisultatoAperto } from "@/lib/risultato-aperto";
import { oraRipartenza, quotaGiornaliera, registraUso, rimastiOggi, salvaQuota } from "@/lib/riconoscimento/quota-telefono";
import { TRATTO } from "../icona";
import { ConsigliScatto, RisultatoRiconoscimento } from "./risultato-riconoscimento";

// Riconoscimento da foto (passi 2.2-2.4): scatto o galleria, parte della pianta, invio al nostro server, risultato.
// Mai una pagina vuota o un errore tecnico: ogni problema ha un messaggio chiaro in italiano (F13).

type Organo = "auto" | "leaf" | "flower" | "fruit" | "bark";
const ORGANI: { valore: Organo; etichetta: string }[] = [
  { valore: "auto", etichetta: "Non so" },
  { valore: "leaf", etichetta: "Foglia" },
  { valore: "flower", etichetta: "Fiore" },
  { valore: "fruit", etichetta: "Frutto" },
  { valore: "bark", etichetta: "Corteccia" },
];
const MAX_FOTO = 5;

interface FotoScelta {
  id: string;
  dati: Blob; // già ridotta
  anteprima: string; // indirizzo locale per mostrarla
  organo: Organo;
}

type CodiceProblema =
  | "limite-giornaliero"
  | "limite-server"
  | "non-risponde"
  | "foto-non-valida"
  | "configurazione"
  | "senza-rete"
  | "quota-telefono"
  | "foto-illeggibile";

function messaggio(codice: CodiceProblema): { titolo: string; testo: string } {
  const ora = oraRipartenza();
  switch (codice) {
    case "quota-telefono":
      return {
        titolo: "Per oggi hai finito i riconoscimenti",
        testo: `Su questo telefono hai usato i ${quotaGiornaliera()} riconoscimenti di oggi. Si riparte alle ${ora}. I riconoscimenti gratuiti sono divisi tra tutti, così bastano per ognuno.`,
      };
    case "limite-giornaliero":
      return {
        titolo: "Riconoscimenti finiti per oggi",
        testo: `Oggi sono finiti i riconoscimenti gratuiti che il servizio Pl@ntNet ci concede. Riprova dopo le ${ora}.`,
      };
    case "limite-server":
      return {
        titolo: "Troppi riconoscimenti da questa rete",
        testo: `Da questa connessione ne sono già stati fatti molti oggi. Riprova dopo le ${ora}, oppure da un'altra rete.`,
      };
    case "non-risponde":
      return {
        titolo: "Il riconoscimento non risponde",
        testo: "Il servizio Pl@ntNet in questo momento non risponde. Le tue foto sono ancora qui: riprova tra qualche minuto.",
      };
    case "senza-rete":
      return {
        titolo: "Sei senza rete",
        testo: "Per riconoscere una pianta serve internet. Collegati e riprova: le tue foto sono ancora qui.",
      };
    case "foto-non-valida":
      return { titolo: "Questa foto non va bene", testo: "Il servizio non è riuscito a leggerla. Prova con un'altra foto." };
    case "foto-illeggibile":
      return { titolo: "Non riesco ad aprire la foto", testo: "Prova a sceglierne un'altra, oppure scattane una nuova." };
    case "configurazione":
      return {
        titolo: "Riconoscimento non disponibile",
        testo: "C'è un problema dalla nostra parte. Riprova più tardi.",
      };
  }
}

export function Riconoscimento() {
  const [foto, setFoto] = useState<FotoScelta[]>([]);
  const [fase, setFase] = useState<"scelta" | "invio" | "risultato">("scelta");
  const [risultato, setRisultato] = useState<Risultato | null>(null);
  const [problema, setProblema] = useState<CodiceProblema | null>(null);
  const scatta = useRef<HTMLInputElement>(null);
  const galleria = useRef<HTMLInputElement>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const rimasti = useSyncExternalStore(ascolta, rimastiOggi, () => null);

  // Libera la memoria delle anteprime quando la pagina si chiude
  const fotoRef = useRef(foto);
  useEffect(() => {
    fotoRef.current = foto;
  }, [foto]);
  useEffect(() => () => fotoRef.current.forEach((f) => URL.revokeObjectURL(f.anteprima)), []);

  async function aggiungi(files: FileList | null) {
    if (!files?.length) return;
    setProblema(null);
    const spazio = MAX_FOTO - foto.length;
    const nuove: FotoScelta[] = [];
    for (const file of [...files].slice(0, spazio)) {
      try {
        const dati = await riduciFoto(file);
        nuove.push({ id: crypto.randomUUID(), dati, anteprima: URL.createObjectURL(dati), organo: "auto" });
      } catch {
        setProblema("foto-illeggibile");
      }
    }
    setFoto((f) => [...f, ...nuove]);
  }

  function togli(id: string) {
    setFoto((f) => {
      const via = f.find((x) => x.id === id);
      if (via) URL.revokeObjectURL(via.anteprima);
      return f.filter((x) => x.id !== id);
    });
  }

  async function riconosci() {
    if (!foto.length) return;
    if (rimastiOggi() <= 0) {
      setProblema("quota-telefono");
      return;
    }
    setProblema(null);
    setFase("invio");
    const modulo = new FormData();
    foto.forEach((f, i) => {
      modulo.append("foto", f.dati, `foto-${i + 1}.jpg`);
      modulo.append("organo", f.organo);
    });
    try {
      const r = await fetch("/api/identify", { method: "POST", body: modulo });
      const dati = await r.json().catch(() => null);
      if (dati?.quotaPerDispositivo) salvaQuota(dati.quotaPerDispositivo);
      if (dati?.ok && dati.risultato) {
        registraUso();
        setRisultato(dati.risultato as Risultato);
        setFase("risultato");
        requestAnimationFrame(() => titolo.current?.focus());
        return;
      }
      setProblema((dati?.codice as CodiceProblema) ?? "non-risponde");
    } catch {
      setProblema(navigator.onLine === false ? "senza-rete" : "non-risponde");
    }
    setFase("scelta");
  }

  function nuovo() {
    foto.forEach((f) => URL.revokeObjectURL(f.anteprima));
    setFoto([]);
    setRisultato(null);
    setProblema(null);
    setFase("scelta");
  }

  // Il tasto verde della barra in basso deve sapere se c'è un risultato aperto (per chiedere prima di chiuderlo)
  const conRisultato = fase === "risultato" && risultato !== null;
  useEffect(() => {
    segnaRisultatoAperto(conRisultato);
    return () => segnaRisultatoAperto(false);
  }, [conRisultato]);
  // "Sì, nuova foto" nella finestrella della barra: come il pulsante "Riconosci un'altra pianta", poi in cima
  const nuovoRef = useRef(nuovo);
  useEffect(() => {
    nuovoRef.current = nuovo;
  });
  useEffect(
    () =>
      ascoltaNuovaFoto(() => {
        nuovoRef.current();
        window.scrollTo({ top: 0 });
      }),
    [],
  );

  if (fase === "risultato" && risultato) {
    const puoiAggiungere =
      (risultato.livello === "probabile" || risultato.livello === "incerto") && foto.length < MAX_FOTO;
    return (
      <>
        <h2 ref={titolo} tabIndex={-1} className="sr-only">
          Risultato del riconoscimento
        </h2>
        <RisultatoRiconoscimento
          risultato={risultato}
          fotoUtente={foto[0]?.anteprima}
          fotoDati={foto[0]?.dati}
          onAggiungiFoto={puoiAggiungere ? () => setFase("scelta") : undefined}
          onNuovo={nuovo}
        />
      </>
    );
  }

  const inInvio = fase === "invio";
  const avviso = problema ? messaggio(problema) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Campi nascosti: il primo apre la fotocamera dell'iPhone, il secondo la galleria (più foto insieme) */}
      <input
        ref={scatta}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void aggiungi(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleria}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void aggiungi(e.target.files);
          e.target.value = "";
        }}
      />

      {risultato && foto.length > 0 && (
        <p className="vetro rounded-riquadro p-4 text-[15px] leading-snug text-testo-2">
          Aggiungi una foto di un&apos;altra parte della stessa pianta (per esempio il fiore) e indica quale parte è: la
          invio insieme alle altre.
        </p>
      )}

      {foto.length === 0 ? (
        <section className="vetro-forte flex flex-col items-center gap-3 rounded-card px-6 py-8 text-center">
          <span className="flex size-16 items-center justify-center rounded-bolla bg-bolla-verde text-icona-verde">
            <Camera size={30} strokeWidth={TRATTO} aria-hidden="true" />
          </span>
          <h2 className="text-xl font-black">Fotografa una pianta</h2>
          <p className="text-[15px] leading-snug text-testo-2">
            Da vicino, con buona luce. Se ha fiori o frutti, fotografa anche quelli: aiutano di più.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-2.5" aria-label="Foto scelte">
          {foto.map((f, i) => (
            <li key={f.id} className="vetro flex gap-3 rounded-riquadro p-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-bolla">
                <Image src={f.anteprima} alt={`Foto ${i + 1}`} fill unoptimized className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">Foto {i + 1}: che parte è?</span>
                  <button
                    type="button"
                    aria-label={`Togli la foto ${i + 1}`}
                    onClick={() => togli(f.id)}
                    disabled={inInvio}
                    className="-mt-2 -mr-2 flex size-11 items-center justify-center rounded-pillola text-testo-3"
                  >
                    <X size={20} strokeWidth={TRATTO} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Parte della pianta nella foto ${i + 1}`}>
                  {ORGANI.map((o) => {
                    const scelto = f.organo === o.valore;
                    return (
                      <button
                        key={o.valore}
                        type="button"
                        role="radio"
                        aria-checked={scelto}
                        disabled={inInvio}
                        onClick={() => setFoto((tutte) => tutte.map((x) => (x.id === f.id ? { ...x, organo: o.valore } : x)))}
                        className={`h-11 rounded-pillola px-3 text-[13px] font-extrabold ${
                          scelto ? "bg-verde text-su-verde" : "bg-bolla-verde text-verde-scuro"
                        }`}
                      >
                        {o.etichetta}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {avviso && (
        <section role="alert" className="vetro flex flex-col gap-1 rounded-riquadro border-l-4 border-l-icona-luce p-4">
          <h2 className="text-[17px] font-black">{avviso.titolo}</h2>
          <p className="text-[15px] leading-snug text-testo-2">{avviso.testo}</p>
        </section>
      )}

      {foto.length < MAX_FOTO && (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={inInvio}
            onClick={() => scatta.current?.click()}
            className="vetro flex h-12 items-center justify-center gap-2 rounded-pillola text-[15px] font-extrabold text-verde"
          >
            <Camera size={20} strokeWidth={TRATTO} aria-hidden="true" />
            Scatta
          </button>
          <button
            type="button"
            disabled={inInvio}
            onClick={() => galleria.current?.click()}
            className="vetro flex h-12 items-center justify-center gap-2 rounded-pillola text-[15px] font-extrabold text-verde"
          >
            <ImagePlus size={20} strokeWidth={TRATTO} aria-hidden="true" />
            Galleria
          </button>
        </div>
      )}

      {foto.length > 0 && (
        <button
          type="button"
          disabled={inInvio}
          onClick={() => void riconosci()}
          className="flex h-12 items-center justify-center gap-2 rounded-pillola bg-verde text-[15px] font-extrabold text-su-verde active:bg-verde-scuro disabled:bg-verde-scuro"
        >
          {inInvio ? (
            <>
              <LoaderCircle size={20} strokeWidth={TRATTO} aria-hidden="true" className="animate-spin" />
              Sto guardando la tua pianta…
            </>
          ) : (
            <>
              <Search size={20} strokeWidth={TRATTO} aria-hidden="true" />
              Riconosci {foto.length > 1 ? `(${foto.length} foto)` : ""}
            </>
          )}
        </button>
      )}

      {rimasti !== null && (
        <p className="text-center text-[13px] text-testo-3" aria-live="polite">
          Oggi ti restano {rimasti} riconoscimenti su questo telefono.
        </p>
      )}

      {problema === "foto-non-valida" && <ConsigliScatto />}
      <p className="text-center text-xs text-testo-3">Riconoscimento: Pl@ntNet · le foto non vengono conservate</p>
    </div>
  );
}
