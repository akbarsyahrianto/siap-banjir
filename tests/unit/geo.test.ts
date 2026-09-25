import { describe, expect, it } from "vitest";
import { wilayahSeed } from "../../prisma/seed-data";
import { cariWilayahTerdekat, jarakKm } from "@/lib/geo";

const daftar = wilayahSeed.map((w) => ({
  idWilayah: w.idWilayah,
  koordinatLatitude: w.koordinatLatitude,
  koordinatLongitude: w.koordinatLongitude,
}));

describe("geo", () => {
  it("jarak Jakarta–Bandung sekitar 120 km (garis lurus)", () => {
    const km = jarakKm(-6.2, 106.8167, -6.9175, 107.6191);
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(130);
  });

  it("titik di Monas → wilayah Jakarta", () => {
    expect(cariWilayahTerdekat(-6.1754, 106.8272, daftar)?.wilayah.idWilayah).toMatch(/^jakarta-/);
  });

  it("titik di Kota Bandung → Dayeuhkolot", () => {
    expect(cariWilayahTerdekat(-6.9175, 107.6191, daftar)?.wilayah.idWilayah).toBe("dayeuhkolot");
  });

  it("daftar kosong → null", () => {
    expect(cariWilayahTerdekat(0, 0, [])).toBeNull();
  });
});
