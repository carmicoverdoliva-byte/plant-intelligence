import { redirect } from "next/navigation";

// "Le mie piante" è diventata "Vivaio" (2026-11-23): il vecchio indirizzo porta lì.
export default function Pagina() {
  redirect("/vivaio");
}
