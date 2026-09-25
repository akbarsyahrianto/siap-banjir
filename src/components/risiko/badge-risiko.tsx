import type { TingkatRisiko } from "@prisma/client";
import { cn } from "@/lib/utils";
import { GAYA_LEVEL } from "./gaya-level";

export function BadgeRisiko({
  level,
  ukuran = "besar",
  className,
}: {
  level: TingkatRisiko;
  ukuran?: "besar" | "kecil";
  className?: string;
}) {
  const gaya = GAYA_LEVEL[level];
  const Ikon = gaya.ikon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-bold",
        gaya.solid,
        ukuran === "besar" ? "px-5 py-2.5 text-xl" : "px-3 py-1 text-sm",
        className,
      )}
    >
      <Ikon className={ukuran === "besar" ? "size-7" : "size-4"} aria-hidden="true" />
      {gaya.label}
    </span>
  );
}
