import type { Metadata } from "next";
import { InArrivo } from "@/components/in-arrivo";
import { IntestazioneSezione } from "@/components/intestazione-sezione";

export const metadata: Metadata = { title: "Fotocamera · Mandragola" };

// Sezione "Fotocamera": per ora solo la spiegazione e l'avviso onesto "in costruzione" (fase 2).
export default function Pagina() {
  return (
    <main className="pagina">
      <IntestazioneSezione id="fotocamera" />
      <InArrivo fase="fase 2" bolla="verde" icona="fotocamera" />
    </main>
  );
}
