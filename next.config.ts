import type { NextConfig } from "next";

// Versione dell'app: su Vercel è il codice del commit pubblicato; sul PC un'ora di compilazione.
// Finisce sia nel codice del telefono sia nel server: se non coincidono, il telefono ha una versione vecchia
// e mostra "Nuova versione disponibile" (componente AvvisoAggiornamento).
const VERSIONE_APP = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || `locale-${Date.now()}`;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_VERSIONE_APP: VERSIONE_APP },
  cacheComponents: true,
  partialPrefetching: true,
  // Intestazioni di sicurezza consigliate dalla guida PWA di Next.js (node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Il service worker non va mai conservato dal browser: così gli aggiornamenti arrivano subito
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
