import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegistraServiceWorker } from "./registra-service-worker";

// Testi dell'interfaccia in italiano (CLAUDE.md §1). Nessun carattere scaricato da servizi esterni:
// si usano quelli del telefono, così la pagina è più leggera e non dipende da altri servizi.
export const metadata: Metadata = {
  title: "Plant Intelligence",
  description:
    "Riconosci e cura le tue piante: gratis, senza pubblicità, senza account.",
  // iPhone: aperta dalla schermata Home si comporta come un'app (schermo intero, nome sotto l'icona)
  appleWebApp: { capable: true, title: "Plant Intel", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f6b3a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <RegistraServiceWorker />
      </body>
    </html>
  );
}
