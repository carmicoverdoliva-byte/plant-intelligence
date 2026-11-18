import type { Metadata } from "next";
import { IntestazioneSezione } from "@/components/intestazione-sezione";
import { Riconoscimento } from "@/components/riconoscimento/riconoscimento";

export const metadata: Metadata = { title: "Fotocamera · Mandragola" };

// Sezione "Fotocamera" (rilascio R0, passi 2.1-2.4): riconoscimento da foto con Pl@ntNet.
// L'anteprima live nel mirino (D10) arriverà nella fase 4.
export default function Pagina() {
  return (
    <main className="pagina">
      <IntestazioneSezione id="fotocamera" />
      <Riconoscimento />
    </main>
  );
}
