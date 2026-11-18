// Marchio piccolo di Mandragola (foglia + bacchetta viola con stella), dalla schermata Home di riferimento
// (docs/design/riferimenti/home.html). Disegno vettoriale nostro: resta nitido a ogni dimensione.
// È decorativo (aria-hidden): accanto c'è sempre il nome scritto.
export function LogoMandragola({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="logo-fondo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D6F5DC" />
        </linearGradient>
        <linearGradient id="logo-bacchetta" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4B2DB8" />
          <stop offset="1" stopColor="#9B7BFF" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="26" fill="url(#logo-fondo)" stroke="#C9EED2" strokeWidth="2" />
      <path d="M30 74 C22 44 42 20 78 16 C84 50 62 76 30 74 Z" fill="#2DB36B" />
      <path d="M34 70 C46 56 58 42 72 24" stroke="#C9F7D5" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path
        d="M13 87 L17 91 L47 58 L42 54 Z"
        fill="url(#logo-bacchetta)"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M44 45 L47 52 L54 55 L47 58 L44 65 L41 58 L34 55 L41 52 Z"
        fill="#FFD43B"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
