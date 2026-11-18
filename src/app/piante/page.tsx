import type { Metadata } from "next";
import { InArrivo } from "@/components/in-arrivo";
import { IntestazioneSezione } from "@/components/intestazione-sezione";

export const metadata: Metadata = { title: "Le mie piante · Mandragola" };

// Sezione "Le mie piante": per ora solo la spiegazione e l'avviso onesto "in costruzione" (fase 3).
export default function Pagina() {
  return (
    <main className="pagina">
      <IntestazioneSezione id="piante" />
      <InArrivo fase="fase 3" bolla="verde" icona="piante" />
    </main>
  );
}
