import type { MetadataRoute } from "next";

// "Carta d'identità" dell'app installabile (PWA, F16): nome, icone, colori, apertura a schermo intero.
// Next.js la pubblica all'indirizzo /manifest.webmanifest e la collega a tutte le pagine.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Plant Intelligence",
    short_name: "Plant Intel",
    description:
      "Riconosci e cura le tue piante: gratis, senza pubblicità, senza account.",
    lang: "it",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1f6b3a",
    icons: [
      { src: "/icons/icona-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icona-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Il fondo dell'icona riempie tutto il quadrato: va bene anche quando Android la ritaglia (maschera)
      { src: "/icons/icona-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
