import type { Metadata } from "next";
import { Onboarding } from "@/components/onboarding";

export const metadata: Metadata = { title: "Benvenuto · Mandragola" };

// Tutorial del primo avvio (passo 1.2). La Home porta qui la prima volta; si ripete dalla Guida.
export default function Benvenuto() {
  return <Onboarding />;
}
