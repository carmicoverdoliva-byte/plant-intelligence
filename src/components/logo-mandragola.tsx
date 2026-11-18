import Image from "next/image";

// Logo di Mandragola: è la stessa icona approvata della schermata Home (docs/design/icona-mandragola-master.png),
// ridotta e con gli angoli arrotondati da `node scripts/genera-icone.mjs`. Così app e icona coincidono.
// File già alla misura giusta (3x per gli schermi Retina): niente ottimizzazione di Vercel.
// È decorativo (alt vuoto): accanto o sotto c'è sempre il nome scritto.
const file = { 44: "/icons/logo-44.webp", 96: "/icons/logo-96.webp" } as const;

export function LogoMandragola({ size = 44 }: { size?: 44 | 96 }) {
  return <Image src={file[size]} width={size} height={size} alt="" unoptimized className="shrink-0" />;
}
