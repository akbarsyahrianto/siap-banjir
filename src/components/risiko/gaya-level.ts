import type { TingkatRisiko } from "@prisma/client";
import { OctagonAlert, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";

/** Level tidak boleh hanya dibedakan warna: selalu pakai ikon + teks juga. */
export const GAYA_LEVEL: Record<
  TingkatRisiko,
  { label: string; ikon: LucideIcon; solid: string; lembut: string; teks: string; warna: string; pesan: string }
> = {
  RENDAH: {
    label: "Risiko Rendah",
    ikon: ShieldCheck,
    solid: "bg-risk-rendah text-risk-rendah-foreground",
    lembut: "border-risk-rendah/40 bg-risk-rendah/10",
    teks: "text-risk-rendah",
    warna: "var(--risk-rendah)",
    pesan: "Kondisi normal. Tetap pantau informasi cuaca.",
  },
  SEDANG: {
    label: "Risiko Sedang",
    ikon: TriangleAlert,
    solid: "bg-risk-sedang text-risk-sedang-foreground",
    lembut: "border-risk-sedang/60 bg-risk-sedang/15",
    teks: "text-amber-800 dark:text-risk-sedang",
    warna: "var(--risk-sedang)",
    pesan: "Waspada. Siapkan persiapan dini dan pantau perkembangan.",
  },
  TINGGI: {
    label: "Risiko Tinggi",
    ikon: OctagonAlert,
    solid: "bg-risk-tinggi text-risk-tinggi-foreground",
    lembut: "border-risk-tinggi/40 bg-risk-tinggi/10",
    teks: "text-risk-tinggi",
    warna: "var(--risk-tinggi)",
    pesan: "Bahaya potensi banjir. Siap mengungsi dan ikuti arahan petugas.",
  },
};
