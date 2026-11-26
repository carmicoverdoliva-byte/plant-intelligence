// Riga fissa di sicurezza sotto la tossicità (decisione dell'utente del 2026-11-26): compare per ogni pianta con valore
// "tossica" o "tossica (una fonte)", nelle schede del tipo e in quelle generate. Niente numeri di telefono scritti da
// noi: solo il link alla pagina ufficiale del Ministero della Salute (l'ASPCA è stata tolta: servizio americano e a
// pagamento, non serve a un utente italiano).
import type { Tossicita } from "@/lib/schede/tipi";

export const LINK_ANTIVELENI = {
  testo: "Centri Antiveleni (Ministero della Salute)",
  url: "https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/strutture-le-intossicazioni/",
};

const PERICOLO: Tossicita[] = ["tossica", "tossica (una fonte)"];
export const mostraAvviso = (persone: Tossicita, animali: Tossicita) => PERICOLO.includes(persone) || PERICOLO.includes(animali);

export function AvvisoAntiveleni({ persone, animali }: { persone: Tossicita; animali: Tossicita }) {
  if (!mostraAvviso(persone, animali)) return null;
  return (
    <p className="border-t border-icona-tossica/30 pt-2 text-sm font-bold leading-snug" data-avviso-antiveleni>
      Se un bambino o un animale ne ha mangiata una parte, contatta subito il medico, il veterinario o un Centro
      Antiveleni.{" "}
      <a href={LINK_ANTIVELENI.url} target="_blank" rel="noopener noreferrer" data-inline className="underline">
        {LINK_ANTIVELENI.testo}
      </a>
    </p>
  );
}
