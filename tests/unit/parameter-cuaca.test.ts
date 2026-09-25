import { describe, expect, it } from "vitest";
import type { OpenMeteoResponse } from "@/server/integrations/open-meteo";
import { openMeteoResponseSchema, parseWaktuLokal } from "@/server/integrations/open-meteo";
import { hitungParameterCuaca } from "@/server/services/parameter-cuaca";

/** Buat respons palsu: 5 hari × 24 jam, mulai 2026-09-23 (past_days=2, forecast_days=3). */
function buatRespons(opsi: {
  currentTime: string;
  currentPrecip?: number;
  hujanPerJam: (waktu: string) => number | null;
  peluangPerJam?: (waktu: string) => number | null;
  hujanHarian: (number | null)[];
}): OpenMeteoResponse {
  const hari = ["2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];
  const time = hari.flatMap((h) => Array.from({ length: 24 }, (_, j) => `${h}T${String(j).padStart(2, "0")}:00`));
  return openMeteoResponseSchema.parse({
    latitude: -6.22,
    longitude: 106.9,
    utc_offset_seconds: 25200,
    timezone: "Asia/Jakarta",
    current: {
      time: opsi.currentTime,
      interval: 900,
      temperature_2m: 30,
      relative_humidity_2m: 70,
      precipitation: opsi.currentPrecip ?? 0,
      weather_code: 61,
      wind_speed_10m: 10,
    },
    hourly: {
      time,
      precipitation: time.map(opsi.hujanPerJam),
      precipitation_probability: time.map(opsi.peluangPerJam ?? (() => 50)),
      temperature_2m: time.map(() => 28),
    },
    daily: {
      time: hari,
      precipitation_sum: opsi.hujanHarian,
      precipitation_probability_max: hari.map(() => 80),
    },
  });
}

describe("parseWaktuLokal", () => {
  it("mengonversi waktu WIB ke UTC", () => {
    expect(parseWaktuLokal("2026-09-25T13:00", 25200).toISOString()).toBe("2026-09-25T06:00:00.000Z");
  });
});

describe("hitungParameterCuaca", () => {
  it("menghitung jendela 24 jam lalu & 24 jam ke depan dari jam sekarang", () => {
    // 1 mm setiap jam → 24 jam = 24 mm di kedua jendela.
    const raw = buatRespons({
      currentTime: "2026-09-25T13:15",
      hujanPerJam: () => 1,
      hujanHarian: [10, 20, 30, 40, 50],
    });
    const nilai = hitungParameterCuaca(raw);
    expect(nilai.hujan_24jam).toBe(24);
    expect(nilai.prakiraan_hujan_24jam).toBe(24);
    // 3 hari = 23, 24, 25 September.
    expect(nilai.hujan_3hari).toBe(60);
    expect(nilai.peluang_hujan_max).toBe(50);
  });

  it("jendela 24 jam lalu mencakup jam sekarang, bukan jam berikutnya", () => {
    const raw = buatRespons({
      currentTime: "2026-09-25T13:00",
      hujanPerJam: (t) => (t === "2026-09-25T13:00" ? 30 : t === "2026-09-25T14:00" ? 7 : 0),
      hujanHarian: [0, 0, 0, 0, 0],
    });
    const nilai = hitungParameterCuaca(raw);
    expect(nilai.hujan_24jam).toBe(30);
    expect(nilai.prakiraan_hujan_24jam).toBe(7);
    // hujan_1jam = maks(current 15 menit, jam terakhir).
    expect(nilai.hujan_1jam).toBe(30);
  });

  it("hujan_1jam memakai current.precipitation jika lebih besar", () => {
    const raw = buatRespons({
      currentTime: "2026-09-25T13:30",
      currentPrecip: 12,
      hujanPerJam: () => 2,
      hujanHarian: [0, 0, 0, 0, 0],
    });
    expect(hitungParameterCuaca(raw).hujan_1jam).toBe(12);
  });

  it("parameter tanpa data (semua null) dihilangkan, bukan dianggap 0", () => {
    const raw = buatRespons({
      currentTime: "2026-09-25T13:00",
      hujanPerJam: () => null,
      peluangPerJam: () => null,
      hujanHarian: [null, null, null, null, null],
    });
    const nilai = hitungParameterCuaca(raw);
    expect(nilai.hujan_24jam).toBeUndefined();
    expect(nilai.hujan_3hari).toBeUndefined();
    expect(nilai.peluang_hujan_max).toBeUndefined();
    expect(nilai.hujan_1jam).toBe(0); // dari current
  });
});
