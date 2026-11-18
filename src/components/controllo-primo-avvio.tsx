"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { leggi } from "@/lib/memoria-locale";
import { CHIAVE_ONBOARDING } from "@/lib/primo-avvio";

// Alla prima apertura porta al tutorial iniziale. Se la memoria del telefono non è disponibile (es. navigazione
// privata) il tutorial ricomparirebbe a ogni apertura: "Salta" basta a chiuderlo.
export function ControlloPrimoAvvio() {
  const router = useRouter();
  useEffect(() => {
    if (leggi(CHIAVE_ONBOARDING) !== "visto") router.replace("/benvenuto");
  }, [router]);
  return null;
}
