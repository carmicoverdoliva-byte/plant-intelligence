import { useId } from "react";

// Illustrazione della card "Riconosci una pianta" (riferimento Home): mirino con angoli verdi, pianta e goccioline.
// Le goccioline stanno solo sulle immagini delle piante (stile-grafico.md). Colori presi dai token del tema.
const gocce = [
  { cx: 45, cy: 56, rx: 5, ry: 6.1 },
  { cx: 51, cy: 57, rx: 8, ry: 8 },
  { cx: 61, cy: 48, rx: 4, ry: 4.2 },
  { cx: 58, cy: 56, rx: 8, ry: 9 },
  { cx: 56, cy: 45, rx: 10, ry: 10.4 },
];

export function IllustrazioneRiconosci() {
  const id = useId();
  const angoli = ["M14 30 L14 14 L30 14", "M74 14 L90 14 L90 30", "M90 74 L90 90 L74 90", "M30 90 L14 90 L14 74"];
  return (
    <div className="flex size-[104px] shrink-0 items-center justify-center rounded-riquadro bg-verde/12">
      <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
        <defs>
          <radialGradient id={id} cx="40%" cy="35%" r="65%">
            <stop offset="0" stopColor="white" stopOpacity="0.75" />
            <stop offset="0.6" stopColor="white" stopOpacity="0.15" />
            <stop offset="1" stopColor="var(--color-verde-scuro)" stopOpacity="0.35" />
          </radialGradient>
        </defs>
        {angoli.map((d) => (
          <path key={d} d={d} stroke="var(--color-verde)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ))}
        <path
          d="M52 78 C30 66 26 44 36 32 C44 36 52 44 52 56 C52 44 60 36 68 32 C78 44 74 66 52 78 Z"
          fill="var(--color-illustrazione-2)"
        />
        <path d="M52 78 L52 50" stroke="white" strokeOpacity="0.7" strokeWidth="2.6" strokeLinecap="round" />
        {gocce.map((g) => (
          <g key={`${g.cx}-${g.cy}`}>
            <ellipse {...g} fill={`url(#${id})`} stroke="white" strokeOpacity="0.45" strokeWidth="0.8" />
            <ellipse
              cx={g.cx - g.rx * 0.28}
              cy={g.cy - g.ry * 0.35}
              rx={g.rx * 0.28}
              ry={g.rx * 0.18}
              fill="white"
              opacity="0.95"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
