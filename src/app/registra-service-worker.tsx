"use client";

import { useEffect } from "react";

// Registra il service worker (public/sw.js) solo nella versione finale dell'app:
// in sviluppo i file cambiano di continuo e una copia salvata confonderebbe le prove.
export function RegistraServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Senza service worker l'app funziona lo stesso, solo non si riapre senza rete
      });
  }, []);
  return null;
}
