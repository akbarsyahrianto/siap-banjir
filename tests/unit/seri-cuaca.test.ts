import { describe, expect, it } from "vitest";
import { openMeteoResponseSchema } from "@/server/integrations/open-meteo";
import { ringkasanHarian, seriHujan48Jam, seriPerJamPerHari, seriPrakiraanPerJam } from "@/server/services/seri-cuaca";

const hari = ["2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];
const time = hari.flatMap((h) => Array.from({ length: 24 }, (_, j) => `${h}T${String(j).padStart(2, "0")}:00`));

const raw = openMeteoResponseSchema.parse({
  latitude: -6.22,
  longitude: 106.9,
  utc_offset_seconds: 25200,
  timezone: "Asia/Jakarta",
  current: {
    time: "2026-09-25T13:15",
    interval: 900,
    temperature_2m: 30,
    relative_humidity_2m: 70,
    precipitation: 0,
    weather_code: 3,
    wind_speed_10m: 10,
  },
  hourly: {
    time,
    precipitation: time.map(() => 1),
    precipitation_probability: time.map(() => 40),
    temperature_2m: time.map((t) => 24 + Number(t.slice(11, 13)) / 2),
  },
  daily: {
    time: hari,
    precipitation_sum: [1, 2, 3, 4, 5],
    precipitation_probability_max: [10, 20, 30, 40, 50],
  },
});

describe("seri-cuaca", () => {
  it("48 jam: 24 titik lalu (termasuk jam sekarang) + 24 titik prakiraan", () => {
    const seri = seriHujan48Jam(raw);
    expect(seri).toHaveLength(48);
    expect(seri.filter((t) => t.lalu)).toHaveLength(24);
    expect(seri[23]?.waktu).toBe("2026-09-25T13:00");
  });

  it("prakiraan per jam dimulai dari jam sekarang", () => {
    const seri = seriPrakiraanPerJam(raw);
    expect(seri[0]?.waktu).toBe("2026-09-25T13:00");
    expect(seri.at(-1)?.waktu).toBe("2026-09-27T23:00");
  });

  it("ringkasan harian mulai hari ini, dengan suhu min/maks dari data per jam", () => {
    const harian = ringkasanHarian(raw);
    expect(harian.map((h) => h.tanggal)).toEqual(["2026-09-25", "2026-09-26", "2026-09-27"]);
    expect(harian[0]).toMatchObject({ hujan: 3, peluangMaks: 30, suhuMin: 24, suhuMaks: 35.5 });
  });

  it("per jam per hari: mulai hari ini, 24 jam per tanggal, jam yang sudah lewat bertanda lalu", () => {
    const hari = seriPerJamPerHari(raw);
    expect(hari.map((h) => h.tanggal)).toEqual(["2026-09-25", "2026-09-26", "2026-09-27"]);
    expect(hari.map((h) => h.titik.length)).toEqual([24, 24, 24]);
    expect(hari[0]!.titik.filter((t) => t.lalu).map((t) => t.jam).at(-1)).toBe("13:00");
    expect(hari[1]!.titik.some((t) => t.lalu)).toBe(false);
  });
});
