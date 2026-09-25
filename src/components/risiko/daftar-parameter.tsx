import { PARAMETER_RISIKO, formatNilaiParameter } from "@/lib/risiko";
import type { HasilParameter } from "@/server/validators/risiko";
import { BadgeRisiko } from "./badge-risiko";

/** Nilai tiap parameter dan level yang dicapainya; parameter pemicu ditandai. */
export function DaftarParameter({ hasil }: { hasil: HasilParameter[] }) {
  if (hasil.length === 0) {
    return <p className="text-muted-foreground">Data parameter belum tersedia.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border">
      {hasil.map((h) => (
        <li key={h.parameter} className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div>
            <p className="font-medium">
              {PARAMETER_RISIKO[h.parameter].label}
              {h.pemicu && h.level !== "RENDAH" ? (
                <span className="ml-2 rounded bg-foreground px-1.5 py-0.5 text-xs font-semibold text-background">
                  Pemicu
                </span>
              ) : null}
            </p>
            <p className="text-2xl font-bold tabular-nums">{formatNilaiParameter(h.parameter, h.nilai)}</p>
            {h.ambangKhusus ? <p className="text-xs text-muted-foreground">Memakai ambang khusus wilayah</p> : null}
          </div>
          <BadgeRisiko level={h.level} ukuran="kecil" />
        </li>
      ))}
    </ul>
  );
}
