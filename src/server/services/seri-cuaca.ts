/**
 * Penyusun data grafik dari respons Open-Meteo. Fungsi murni.
 * Waktu Open-Meteo sudah dalam zona Asia/Jakarta ("2026-09-25T13:00"), jadi dibandingkan sebagai string.
 */
import type { OpenMeteoResponse } from "@/server/integrations/open-meteo";

export type TitikGrafikJam = {
  waktu: string; // "2026-09-25T13:00"
  jam: string; // "13:00"
  tanggal: string; // "2026-09-25"
  hujan: number | null;
  peluang: number | null;
  suhu: number | null;
  /** true = data pengamatan (sudah lewat), false = prakiraan. */
  lalu: boolean;
};

export type RingkasanHarian = {
  tanggal: string;
  hujan: number | null;
  peluangMaks: number | null;
  suhuMin: number | null;
  suhuMaks: number | null;
};

function jamSekarang(raw: OpenMeteoResponse) {
  return `${raw.current.time.slice(0, 13)}:00`;
}

function semuaTitik(raw: OpenMeteoResponse): TitikGrafikJam[] {
  const sekarang = jamSekarang(raw);
  const { time, precipitation, precipitation_probability, temperature_2m } = raw.hourly;
  return time.map((waktu, i) => ({
    waktu,
    jam: waktu.slice(11, 16),
    tanggal: waktu.slice(0, 10),
    hujan: precipitation[i] ?? null,
    peluang: precipitation_probability[i] ?? null,
    suhu: temperature_2m[i] ?? null,
    lalu: waktu <= sekarang,
  }));
}

/** 24 jam terakhir (termasuk jam sekarang) + 24 jam ke depan. */
export function seriHujan48Jam(raw: OpenMeteoResponse): TitikGrafikJam[] {
  const titik = semuaTitik(raw);
  const idx = titik.findIndex((t) => t.waktu === jamSekarang(raw));
  if (idx < 0) return titik.slice(-48);
  return titik.slice(Math.max(0, idx - 23), idx + 25);
}

/** Prakiraan per jam dari jam sekarang sampai akhir data (±3 hari). */
export function seriPrakiraanPerJam(raw: OpenMeteoResponse): TitikGrafikJam[] {
  const sekarang = jamSekarang(raw);
  return semuaTitik(raw).filter((t) => t.waktu >= sekarang);
}

/** Ringkasan harian mulai hari ini. */
export function ringkasanHarian(raw: OpenMeteoResponse): RingkasanHarian[] {
  const hariIni = raw.current.time.slice(0, 10);
  const titik = semuaTitik(raw);
  return raw.daily.time
    .map((tanggal, i) => {
      const suhu = titik
        .filter((t) => t.tanggal === tanggal)
        .map((t) => t.suhu)
        .filter((s): s is number => s != null);
      return {
        tanggal,
        hujan: raw.daily.precipitation_sum[i] ?? null,
        peluangMaks: raw.daily.precipitation_probability_max[i] ?? null,
        suhuMin: suhu.length ? Math.min(...suhu) : null,
        suhuMaks: suhu.length ? Math.max(...suhu) : null,
      };
    })
    .filter((h) => h.tanggal >= hariIni);
}

export type SeriHarian = { tanggal: string; titik: TitikGrafikJam[] };

/** Data per jam dikelompokkan per tanggal, mulai hari ini (00:00–23:00; jam yang sudah lewat bertanda `lalu`). */
export function seriPerJamPerHari(raw: OpenMeteoResponse): SeriHarian[] {
  const hariIni = raw.current.time.slice(0, 10);
  const hasil: SeriHarian[] = [];
  for (const t of semuaTitik(raw)) {
    if (t.tanggal < hariIni) continue;
    const terakhir = hasil.at(-1);
    if (terakhir?.tanggal === t.tanggal) terakhir.titik.push(t);
    else hasil.push({ tanggal: t.tanggal, titik: [t] });
  }
  return hasil;
}
