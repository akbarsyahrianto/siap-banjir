import { describe, expect, it } from "vitest";
import { bacaDataWilayah } from "../../prisma/data-wilayah";
import {
  ambangSeed,
  informasiSeed,
  persiapanSeed,
  profilWilayahSeed,
  rekomendasiSeed,
} from "../../prisma/seed-data";
import { indukKode, kodeValid, levelKode } from "@/lib/kode-wilayah";
import {
  ambangRisikoInputSchema,
  informasiInputSchema,
  persiapanDiniInputSchema,
  rekomendasiInputSchema,
  wilayahInputSchema,
} from "@/server/validators/konten";

const LEVEL = ["RENDAH", "SEDANG", "TINGGI"] as const;

const wilayah = bacaDataWilayah();
const namaPerKode = new Map(wilayah.map((w) => [w.idWilayah, w.namaWilayah]));

describe("data wilayah Kemendagri (prisma/data/wilayah.tsv.gz)", () => {
  it("jumlah per tingkat sesuai Kepmendagri 300.2.2-2430/2025", () => {
    const jumlah = { PROVINSI: 0, KABKOTA: 0, KECAMATAN: 0, DESA: 0 };
    for (const w of wilayah) jumlah[levelKode(w.idWilayah)]++;
    expect(jumlah).toEqual({ PROVINSI: 38, KABKOTA: 514, KECAMATAN: 7285, DESA: 83762 });
  });

  // Kumpulkan pelanggaran lalu cek sekali (91 ribu baris; expect per baris terlalu lambat).
  it("kode unik, format valid, dan setiap wilayah punya induk", () => {
    expect(namaPerKode.size).toBe(wilayah.length);
    const salah = wilayah.filter((w) => {
      const induk = indukKode(w.idWilayah);
      return !kodeValid(w.idWilayah) || (induk !== null && !namaPerKode.has(induk));
    });
    expect(salah).toEqual([]);
  });

  it("semua baris valid dan koordinat berada di wilayah Indonesia", () => {
    const salah = wilayah.filter(
      (w) =>
        !wilayahInputSchema.safeParse(w).success ||
        !(w.koordinatLatitude > -11.5 && w.koordinatLatitude < 6.5) ||
        !(w.koordinatLongitude > 94.5 && w.koordinatLongitude < 141.5),
    );
    expect(salah).toEqual([]);
  });
});

describe("seed profil wilayah", () => {
  it("kode ada di data Kemendagri dan namanya cocok", () => {
    for (const p of profilWilayahSeed) expect(namaPerKode.get(p.idWilayah)).toBe(p.namaWilayah);
  });

  it("kode unik", () => {
    const ids = profilWilayahSeed.map((p) => p.idWilayah);
    expect(new Set(ids).size).toBe(ids.length);
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
  it("persiapan & rekomendasi global tersedia untuk setiap level", () => {
    for (const level of LEVEL) {
      expect(persiapanSeed.some((p) => p.levelRisiko === level && p.idWilayah == null)).toBe(true);
      expect(rekomendasiSeed.some((r) => r.levelRisiko === level && r.idWilayah == null)).toBe(true);
    }
  });

  it("semua konten valid dan hanya merujuk kode wilayah yang ada", () => {
    for (const p of persiapanSeed) {
      expect(() => persiapanDiniInputSchema.parse(p)).not.toThrow();
      if (p.idWilayah) expect(namaPerKode.has(p.idWilayah)).toBe(true);
    }
    for (const r of rekomendasiSeed) {
      expect(() => rekomendasiInputSchema.parse(r)).not.toThrow();
      if (r.idWilayah) expect(namaPerKode.has(r.idWilayah)).toBe(true);
    }
    for (const i of informasiSeed) {
      expect(() => informasiInputSchema.parse(i)).not.toThrow();
      if (i.idWilayah) expect(namaPerKode.has(i.idWilayah)).toBe(true);
    }
  });

  it("ada informasi UMUM dan RIWAYAT_KEJADIAN", () => {
    expect(informasiSeed.some((i) => i.kategori === "UMUM")).toBe(true);
    expect(informasiSeed.some((i) => i.kategori === "RIWAYAT_KEJADIAN")).toBe(true);
  });

  it("setiap riwayat kejadian punya nama sumber dan tautan https yang unik", () => {
    const riwayat = informasiSeed.filter((i) => i.kategori === "RIWAYAT_KEJADIAN");
    for (const r of riwayat) {
      expect(r.sumberNama, r.judul).toBeTruthy();
      expect(r.sumberUrl, r.judul).toMatch(/^https:\/\//);
    }
    expect(new Set(riwayat.map((r) => r.sumberUrl)).size).toBe(riwayat.length);
  });

  it("sumber riwayat seed adalah situs resmi pemerintah (BNPB/BMKG diutamakan)", () => {
    for (const r of informasiSeed.filter((i) => i.kategori === "RIWAYAT_KEJADIAN")) {
      expect(new URL(r.sumberUrl ?? "").hostname, r.judul).toMatch(/\.go\.id$/);
    }
  });

  it("sumberUrl selain https ditolak validator", () => {
    const dasar = { kategori: "RIWAYAT_KEJADIAN" as const, judul: "Uji", isi: "Uji", sumberNama: "Uji" };
    expect(informasiInputSchema.safeParse({ ...dasar, sumberUrl: "http://contoh.go.id/a" }).success).toBe(false);
    expect(informasiInputSchema.safeParse({ ...dasar, sumberUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(informasiInputSchema.safeParse({ ...dasar, sumberUrl: "https://contoh.go.id/a" }).success).toBe(true);
  });
});
