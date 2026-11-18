import type { Metadata, Viewport } from "next";
// Carattere Nunito (licenza OFL) ospitato da noi: i file arrivano dal nostro sito, non da Google
import "@fontsource-variable/nunito";
import "./globals.css";
import { RegistraServiceWorker } from "./registra-service-worker";

// Testi dell'interfaccia in italiano (CLAUDE.md §1). Stile grafico: docs/design/stile-grafico.md.
// Le icone (icon.png, apple-icon.png in questa cartella) le collega Next.js da solo.
export const metadata: Metadata = {
  title: "Mandragola",
  description:
    "Riconosci e cura le tue piante: gratis, senza pubblicità, senza account.",
  // iPhone: aperta dalla schermata Home si comporta come un'app (schermo intero, nome sotto l'icona)
  appleWebApp: { capable: true, title: "Mandragola", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7FBF6",
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
