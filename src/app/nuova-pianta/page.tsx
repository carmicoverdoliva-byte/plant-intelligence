import type { Metadata } from "next";
import { InArrivo } from "@/components/in-arrivo";
import { IntestazioneSezione } from "@/components/intestazione-sezione";

export const metadata: Metadata = { title: "Nuova pianta · Mandragola" };

// Sezione "Nuova pianta": per ora solo la spiegazione e l'avviso onesto "in costruzione" (fase 5).
export default function Pagina() {
  return (
    <main className="pagina">
      <IntestazioneSezione id="nuova-pianta" />
      <InArrivo fase="fase 5" bolla="viola" icona="nuova-pianta" />
    </main>
  );
}
