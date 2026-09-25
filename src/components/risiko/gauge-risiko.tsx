import type { TingkatRisiko } from "@prisma/client";
import { GAYA_LEVEL } from "./gaya-level";

// Setengah lingkaran: skor 0 di kiri (180°), 100 di kanan (0°).
const CX = 100;
const CY = 100;
const R = 80;

function titik(skor: number, radius = R) {
  const sudut = Math.PI * (1 - skor / 100);
  return { x: CX + radius * Math.cos(sudut), y: CY - radius * Math.sin(sudut) };
}

function busur(dari: number, ke: number) {
  const a = titik(dari);
  const b = titik(ke);
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
}

// Segmen sesuai rentang skor per level di risk.service (0–33, 34–66, 67–100).
const SEGMEN: { level: TingkatRisiko; dari: number; ke: number }[] = [
  { level: "RENDAH", dari: 0, ke: 33.5 },
  { level: "SEDANG", dari: 33.5, ke: 66.5 },
  { level: "TINGGI", dari: 66.5, ke: 100 },
];

export function GaugeRisiko({ skor, level }: { skor: number; level: TingkatRisiko }) {
  const s = Math.min(Math.max(skor, 0), 100);
  const ujung = titik(s, R - 18);
  const gaya = GAYA_LEVEL[level];

  return (
    <figure className="mx-auto w-full max-w-xs">
      <svg viewBox="0 0 200 118" role="img" aria-label={`Skor risiko ${s} dari 100, ${gaya.label}`}>
        {SEGMEN.map((seg) => (
          <path
            key={seg.level}
            d={busur(seg.dari, seg.ke)}
            fill="none"
            stroke={GAYA_LEVEL[seg.level].warna}
            strokeWidth={16}
            opacity={seg.level === level ? 1 : 0.35}
          />
        ))}
        <line
          x1={CX}
          y1={CY}
          x2={ujung.x}
          y2={ujung.y}
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          className="text-foreground"
        />
        <circle cx={CX} cy={CY} r={7} className="fill-foreground" />
        <text x={CX} y={CY + 17} textAnchor="middle" className="fill-foreground text-[15px] font-bold">
          {s}/100
        </text>
      </svg>
      <figcaption className="sr-only">Skor risiko banjir</figcaption>
    </figure>
  );
}
