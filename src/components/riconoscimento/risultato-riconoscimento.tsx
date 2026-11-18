import Image from "next/image";
import { Camera, ExternalLink, Leaf, Plus, Sun, Sprout } from "lucide-react";
import type { Candidato, Risultato } from "@/lib/riconoscimento/classifica";
import { Bolla } from "../bolla";
import { TRATTO } from "../icona";
import { SchedaCura } from "../schede/scheda-cura";
import { CosE } from "./cos-e";

// Schermata del risultato (passo 2.3, F04), dal riferimento docs/design/riferimenti/scheda.html: foto della pianta in
// alto, card in vetro sovrapposta con nome comune + genere e "probabilmente" + specie. Nessuna percentuale.

const affidabilita = {
  "molto-probabile": { testo: "Affidabilità alta", classi: "bg-bolla-verde text-verde-scuro" },
  probabile: { testo: "Affidabilità buona", classi: "bg-bolla-lime text-icona-lime" },
  incerto: { testo: "Affidabilità bassa", classi: "bg-bolla-luce text-icona-luce" },
} as const;

const consigliScatto = [
  { icona: Leaf, testo: "Avvicinati a una foglia o, se c'è, a un fiore o a un frutto: aiutano più di tutto." },
  { icona: Sun, testo: "Cerca più luce, meglio quella del giorno, senza controluce." },
  { icona: Sprout, testo: "Una sola pianta nella foto, a fuoco, che riempie l'inquadratura." },
];

export function ConsigliScatto() {
  return (
    <section aria-label="Consigli per rifare la foto" className="vetro flex flex-col gap-3 rounded-riquadro p-4">
      <h2 className="text-[17px] font-black">Come rifare la foto</h2>
      <ul className="flex flex-col gap-2.5">
        {consigliScatto.map(({ icona: Icona, testo }) => (
          <li key={testo} className="flex items-start gap-3">
            <Bolla tipo="luce" lato={36}>
              <Icona size={18} strokeWidth={TRATTO} aria-hidden="true" />
            </Bolla>
            <span className="pt-1.5 text-sm leading-snug text-testo-2">{testo}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function nomeConGenere(c: Candidato) {
  return c.nomeComune ? c.nomeComune : `Genere ${c.genere}`;
}

export function RisultatoRiconoscimento({
  risultato,
  fotoUtente,
  onAggiungiFoto,
  onNuovo,
}: {
  risultato: Risultato;
  fotoUtente?: string;
  onAggiungiFoto?: () => void;
  onNuovo: () => void;
}) {
  const p = risultato.principale;

  if (risultato.livello === "non-riconosciuta" || !p) {
    return (
      <div className="flex flex-col gap-4">
        <section className="vetro-forte flex flex-col gap-2 rounded-card p-5">
          <h2 className="text-[26px] leading-tight font-black">Non riesco a riconoscerla</h2>
          <p className="text-[15px] leading-snug text-testo-2">
            Nella foto non vedo una pianta abbastanza chiara per dire un nome. Preferisco non inventare: prova con
            un&apos;altra foto.
          </p>
        </section>
        <ConsigliScatto />
        <button
          type="button"
          onClick={onNuovo}
          className="flex h-12 items-center justify-center gap-2 rounded-pillola bg-verde text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
        >
          <Camera size={20} strokeWidth={TRATTO} aria-hidden="true" />
          Riprova con un&apos;altra foto
        </button>
      </div>
    );
  }

  const incerto = risultato.livello === "incerto";
  const parola = risultato.livello === "molto-probabile" ? "molto probabilmente" : "probabilmente";
  const aff = affidabilita[risultato.livello];

  return (
    <div className="flex flex-col gap-4">
      {fotoUtente && (
        <div className="relative -mx-2 h-[260px] overflow-hidden rounded-[34px] ombra-foto">
          <Image src={fotoUtente} alt="La tua foto" fill unoptimized className="object-cover" />
        </div>
      )}

      <section className={`vetro-forte flex flex-col gap-2.5 rounded-card p-[18px] ${fotoUtente ? "-mt-16" : ""}`}>
        {incerto && <span className="text-sm font-extrabold text-icona-pesca">Non ne sono sicuro</span>}
        <h2 className="text-[30px] leading-tight font-black">
          {incerto ? "Forse " : ""}
          {nomeConGenere(p)}
        </h2>
        <p className="text-sm text-testo-2">
          genere <i>{p.genere}</i> · {incerto ? "forse" : parola} <i>{p.nomeScientifico}</i>
          {p.famiglia ? <> · famiglia {p.famiglia}</> : null}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className={`flex h-[30px] items-center rounded-pillola px-3 text-[13px] font-extrabold ${aff.classi}`}>
            {aff.testo}
          </span>
        </div>
        <a
          href={p.approfondisci}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-extrabold text-verde"
        >
          Approfondisci su Wikipedia
          <ExternalLink size={16} strokeWidth={TRATTO} aria-hidden="true" />
        </a>
      </section>

      <CosE specie={p.nomeScientifico} genere={p.genere} />

      {risultato.gemelle.length > 0 && (
        <section aria-label="Specie simili" className="flex flex-col gap-2.5">
          <h2 className="text-[19px] font-black">{incerto ? "Potrebbe essere anche" : "Piante simili da confrontare"}</h2>
          <ul className="flex flex-col gap-2.5">
            {[p, ...risultato.gemelle].map((c, i) => (
              <li key={c.nomeScientifico} className="vetro flex items-center gap-3 rounded-riquadro p-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-bolla bg-bolla-verde">
                  {c.foto ? (
                    <Image src={c.foto.url} alt={`Foto di esempio: ${c.nomeScientifico}`} fill unoptimized className="object-cover" />
                  ) : (
                    <Leaf size={26} strokeWidth={TRATTO} aria-hidden="true" className="m-auto mt-5 text-icona-verde" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-extrabold">
                    {nomeConGenere(c)}
                    {i === 0 ? <span className="font-bold text-testo-3"> · la più probabile</span> : null}
                  </span>
                  <span className="truncate text-[13px] text-testo-3">
                    <i>{c.nomeScientifico}</i>
                  </span>
                  {c.foto?.autore && (
                    <span className="truncate text-[11px] text-testo-3">
                      Foto: {c.foto.autore}
                      {c.foto.licenza ? ` · ${c.foto.licenza}` : ""} · Pl@ntNet
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {incerto ? (
        <p className="vetro rounded-riquadro p-4 text-[15px] leading-snug text-testo-2">
          La scheda di cura compare quando il riconoscimento è più sicuro: prova ad aggiungere una foto di un&apos;altra parte
          della pianta.
        </p>
      ) : (
        <SchedaCura specie={p.nomeScientifico} genere={p.genere} famiglia={p.famiglia} />
      )}

      {incerto && <ConsigliScatto />}

      {onAggiungiFoto && (
        <button
          type="button"
          onClick={onAggiungiFoto}
          className="vetro flex h-12 items-center justify-center gap-2 rounded-pillola text-[15px] font-extrabold text-verde"
        >
          <Plus size={20} strokeWidth={TRATTO} aria-hidden="true" />
          Aggiungi una foto di un&apos;altra parte
        </button>
      )}
      <button
        type="button"
        onClick={onNuovo}
        className="flex h-12 items-center justify-center gap-2 rounded-pillola bg-verde text-[15px] font-extrabold text-su-verde active:bg-verde-scuro"
      >
        <Camera size={20} strokeWidth={TRATTO} aria-hidden="true" />
        Riconosci un&apos;altra pianta
      </button>
      <p className="text-center text-xs text-testo-3">Riconoscimento: Pl@ntNet · i nomi seguono GBIF</p>
    </div>
  );
}
