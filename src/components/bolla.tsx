import type { Bolla as TipoBolla } from "@/content/guida";

// Bolla colorata dietro le icone (stile-grafico.md): ogni tipo di contenuto ha la sua coppia sfondo / icona.
// Le classi sono scritte per intero perché Tailwind le trovi nel codice.
const colori: Record<TipoBolla, string> = {
  verde: "bg-bolla-verde text-icona-verde",
  acqua: "bg-bolla-acqua text-icona-acqua",
  viola: "bg-bolla-viola text-icona-viola",
  lime: "bg-bolla-lime text-icona-lime",
  luce: "bg-bolla-luce text-icona-luce",
  azzurro: "bg-bolla-azzurro text-icona-azzurro",
  pesca: "bg-bolla-pesca text-icona-pesca",
};

export function Bolla({ tipo, lato = 46, children }: { tipo: TipoBolla; lato?: number; children: React.ReactNode }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-bolla ${colori[tipo]}`}
      style={{ width: lato, height: lato }}
    >
      {children}
    </span>
  );
}
