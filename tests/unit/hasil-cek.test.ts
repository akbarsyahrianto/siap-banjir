import { describe, expect, it } from "vitest";
import { teksHasilCek } from "@/lib/hasil-cek";
import { WIB, WIT } from "@/lib/zona-waktu";

// 01:33 / 01:46 / 01:48 WIB (UTC+7).
const DATA_0133 = "2026-09-29T18:33:21.000Z";
const DICEK_0146 = new Date("2026-09-29T18:46:05.000Z");

describe("teksHasilCek (D-057)", () => {
  it("data baru → jam data baru", () => {
    const teks = teksHasilCek({
      dicek: DICEK_0146,
      waktuDataSebelum: DATA_0133,
      waktuData: "2026-09-29T18:48:02.000Z",
      sumber: "api",
      zona: WIB,
    });
    expect(teks).toBe("Data diperbarui pukul 01:48 WIB.");
  });

  it("cache < 15 menit → sudah dicek, data terbaru, dan kapan data baru bisa diambil", () => {
    const teks = teksHasilCek({ dicek: DICEK_0146, waktuDataSebelum: DATA_0133, waktuData: DATA_0133, sumber: "cache", zona: WIB });
    expect(teks).toBe(
      "Sudah dicek 01:46 · data terbaru dari 01:33 WIB. Data cuaca diambil ulang paling cepat 15 menit sekali, berikutnya 01:48 WIB.",
    );
  });

  it("jam mengikuti zona wilayah: 01:46 WIB = 03:46 WIT (D-060)", () => {
    const teks = teksHasilCek({ dicek: DICEK_0146, waktuDataSebelum: DATA_0133, waktuData: DATA_0133, sumber: "cache", zona: WIT });
    expect(teks).toBe(
      "Sudah dicek 03:46 · data terbaru dari 03:33 WIT. Data cuaca diambil ulang paling cepat 15 menit sekali, berikutnya 03:48 WIT.",
    );
  });

  it("data cadangan / hemat kuota → tanpa janji jam berikutnya (dijelaskan StatusData)", () => {
    for (const sumber of ["cadangan", "hemat-kuota"] as const) {
      expect(teksHasilCek({ dicek: DICEK_0146, waktuDataSebelum: DATA_0133, waktuData: DATA_0133, sumber, zona: WIB })).toBe(
        "Sudah dicek 01:46 · data terbaru dari 01:33 WIB.",
      );
    }
  });
});
