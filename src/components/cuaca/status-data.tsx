import { CloudOff, RefreshCw } from "lucide-react";
import { formatJam } from "@/lib/format";
import type { SumberData } from "@/server/services/weather.service";

/** Label waktu pembaruan; jika API gagal, beri tahu bahwa ini data terakhir yang tersimpan. */
export function StatusData({ sumber, waktuAmbil }: { sumber: SumberData; waktuAmbil: Date }) {
  const jam = formatJam(waktuAmbil);
  if (sumber === "cadangan") {
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100"
      >
        <CloudOff className="size-4 shrink-0" aria-hidden="true" />
        Open-Meteo sedang tidak dapat dihubungi. Data terakhir diperbarui pukul {jam} WIB.
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <RefreshCw className="size-3.5" aria-hidden="true" />
      Data diperbarui pukul {jam} WIB
    </p>
  );
}
