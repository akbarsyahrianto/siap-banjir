import { describe, expect, it } from "vitest";
import {
  ambangSeed,
  informasiSeed,
  persiapanSeed,
  rekomendasiSeed,
  wilayahSeed,
} from "../../prisma/seed-data";
import {
  ambangRisikoInputSchema,
  informasiInputSchema,
  persiapanDiniInputSchema,
  rekomendasiInputSchema,
  wilayahInputSchema,
} from "@/server/validators/konten";

const LEVEL = ["RENDAH", "SEDANG", "TINGGI"] as const;

describe("seed wilayah", () => {
  it("minimal 10 wilayah, semuanya valid", () => {
    expect(wilayahSeed.length).toBeGreaterThanOrEqual(10);
    for (const w of wilayahSeed) expect(() => wilayahInputSchema.parse(w)).not.toThrow();
  });

  it("idWilayah unik", () => {
    const ids = wilayahSeed.map((w) => w.idWilayah);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("setiap wilayah punya nomor 112", () => {
    for (const w of wilayahSeed) {
      expect(w.kontakDarurat?.some((k) => k.telepon === "112")).toBe(true);
    }
  });
});

describe("seed ambang risiko", () => {
  it("semua ambang valid", () => {
    for (const a of ambangSeed) expect(() => ambangRisikoInputSchema.parse(a)).not.toThrow();
  });

  it("rentang per parameter bersambung dari 0 sampai tak hingga tanpa celah/tumpang tindih", () => {
    const parameters = [...new Set(ambangSeed.map((a) => a.parameter))];
    for (const p of parameters) {
      const rentang = ambangSeed
        .filter((a) => a.parameter === p && a.idWilayah == null)
        .sort((x, y) => x.nilaiMinimum - y.nilaiMinimum);
      expect(rentang[0]?.nilaiMinimum).toBe(0);
      for (let i = 1; i < rentang.length; i++) {
        expect(rentang[i]?.nilaiMinimum).toBe(rentang[i - 1]?.nilaiMaksimum);
      }
      expect(rentang.at(-1)?.nilaiMaksimum ?? null).toBeNull();
      expect(rentang.map((r) => r.levelRisiko)).toEqual([...LEVEL]);
    }
  });
});

describe("seed konten", () => {
  const idWilayah = new Set(wilayahSeed.map((w) => w.idWilayah));

  it("persiapan & rekomendasi global tersedia untuk setiap level", () => {
    for (const level of LEVEL) {
      expect(persiapanSeed.some((p) => p.levelRisiko === level && p.idWilayah == null)).toBe(true);
      expect(rekomendasiSeed.some((r) => r.levelRisiko === level && r.idWilayah == null)).toBe(true);
    }
  });

  it("semua konten valid dan hanya merujuk wilayah yang ada", () => {
    for (const p of persiapanSeed) {
      expect(() => persiapanDiniInputSchema.parse(p)).not.toThrow();
      if (p.idWilayah) expect(idWilayah.has(p.idWilayah)).toBe(true);
    }
    for (const r of rekomendasiSeed) {
      expect(() => rekomendasiInputSchema.parse(r)).not.toThrow();
      if (r.idWilayah) expect(idWilayah.has(r.idWilayah)).toBe(true);
    }
    for (const i of informasiSeed) {
      expect(() => informasiInputSchema.parse(i)).not.toThrow();
      if (i.idWilayah) expect(idWilayah.has(i.idWilayah)).toBe(true);
    }
  });

  it("ada informasi UMUM dan RIWAYAT_KEJADIAN", () => {
    expect(informasiSeed.some((i) => i.kategori === "UMUM")).toBe(true);
    expect(informasiSeed.some((i) => i.kategori === "RIWAYAT_KEJADIAN")).toBe(true);
  });
});
