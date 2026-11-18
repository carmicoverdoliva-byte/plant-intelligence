import {
  Bell,
  BookOpen,
  Camera,
  CircleHelp,
  Flower2,
  House,
  type LucideIcon,
  Smartphone,
  Sprout,
  Droplet,
} from "lucide-react";
import type { NomeIcona } from "@/content/guida";

// Icone Lucide (licenza ISC) con il tratto deciso nello stile grafico: 2,6, punte arrotondate.
// Sono decorative (aria-hidden): il testo o l'aria-label del pulsante dice cosa fanno.
const icone: Record<NomeIcona, LucideIcon> = {
  casa: House,
  campanella: Bell,
  piante: Sprout,
  fotocamera: Camera,
  promemoria: Droplet,
  guida: BookOpen,
  aiuto: CircleHelp,
  "nuova-pianta": Flower2,
  telefono: Smartphone,
};

export const TRATTO = 2.6;

export function Icona({ nome, size = 24, className }: { nome: NomeIcona; size?: number; className?: string }) {
  const Componente = icone[nome];
  return <Componente size={size} strokeWidth={TRATTO} aria-hidden="true" className={className} />;
}
