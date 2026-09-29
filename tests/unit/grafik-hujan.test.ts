import { describe, expect, it } from "vitest";
import { grafikHujanPerJam } from "@/lib/grafik-hujan";

/** Mulai Sabtu 26 September 2026 pukul 14.00, sampai Senin 28 September 23.00 (58 jam). */
function seri(hujan: (i: number) => number | null) {
  const mulai = Date.UTC(2026, 8, 26, 14);
  return Array.from({ length: 58 }, (_, i) => ({
    waktu: new Date(mulai + i * 3_600_000).toISOString().slice(0, 16),
    hujan: hujan(i),
  }));
}

describe("grafikHujanPerJam", () => {
  it("skala 0,5 mm per selang, hari dibagi per tanggal, puncak di ringkasan", () => {
    const g = grafikHujanPerJam(seri((i) => (i === 48 ? 1.4 : i === 0 ? 0.7 : 0)))!;
    expect(g.sumbuY).toEqual(["1,5", "1,0", "0,5", "0 mm"]);
    expect(g.hari).toEqual([
      { tanggal: "2026-09-26", label: "Sab 26", jam: 10 },
      { tanggal: "2026-09-27", label: "Min 27", jam: 24 },
      { tanggal: "2026-09-28", label: "Sen 28", jam: 24 },
    ]);
    expect(g.batang).toHaveLength(58);
    expect(g.batang[48]?.persen).toBeCloseTo((1.4 / 1.5) * 100);
    expect(g.jamMulai).toBe("14.00");
    expect(g.ringkasan).toBe(
      "Grafik curah hujan per jam, Sabtu 26 hingga Senin 28 September. Tertinggi 1,4 mm pada Senin pukul 14.00.",
    );
  });

  it("skala membulat ke langkah berikutnya; null dan negatif dianggap 0", () => {
    const g = grafikHujanPerJam(seri((i) => (i === 3 ? 13 : i === 4 ? null : -1)))!;
    expect(g.sumbuY).toEqual(["15", "10", "5", "0 mm"]);
    expect(g.batang[4]).toMatchObject({ hujan: 0, persen: 0 });
    expect(g.batang[3]?.persen).toBeCloseTo((13 / 15) * 100);
  });

  it("tanpa hujan: skala minimum dan ringkasan menyebut tidak ada hujan", () => {
    const g = grafikHujanPerJam(seri(() => 0))!;
    expect(g.sumbuY[0]).toBe("1,5");
    expect(g.ringkasan).toMatch(/Tidak ada hujan yang diprakirakan\.$/);
  });

  it("rentang lintas bulan menyebut kedua bulan; data kosong → null", () => {
    const g = grafikHujanPerJam([
      { waktu: "2026-09-30T22:00", hujan: 0 },
      { waktu: "2026-10-01T01:00", hujan: 2 },
    ])!;
    expect(g.ringkasan).toMatch(/^Grafik curah hujan per jam, Rabu 30 September hingga Kamis 1 Oktober\. /);
    expect(grafikHujanPerJam([])).toBeNull();
  });
});
