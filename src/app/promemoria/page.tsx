import type { Metadata } from "next";
import { InArrivo } from "@/components/in-arrivo";
import { IntestazioneSezione } from "@/components/intestazione-sezione";

export const metadata: Metadata = { title: "Promemoria · Mandragola" };

// Sezione "Promemoria": per ora solo la spiegazione e l'avviso onesto "in costruzione" (fase 5).
export default function Pagina() {
  return (
    <main className="pagina">
      <IntestazioneSezione id="promemoria" />
      <InArrivo fase="fase 5" bolla="acqua" icona="promemoria" />
    </main>
  );
}
