import type { Metadata } from "next";
import { Vivaio } from "@/components/vivaio/vivaio";

export const metadata: Metadata = { title: "Vivaio · Mandragola" };

// Sezione "Vivaio" (fase 3.1, F09): le piante salvate, solo sul telefono (D3). Tutto il contenuto è nel telefono,
// quindi la pagina è la stessa per tutti e il service worker la conserva per aprirla anche senza internet.
export default function Pagina() {
  return (
    <main className="pagina">
      <Vivaio />
    </main>
  );
}
