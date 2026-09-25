/**
 * Use case "Ambil Data Cuaca": ambil dari Open-Meteo atau cache DB yang masih segar.
 */
import type { DataCuaca, Wilayah } from "@prisma/client";
import type { SumberData } from "@/lib/tipe-risiko";
import { db } from "@/server/db";
import {
  ambilDataCuaca,
  openMeteoResponseSchema,
  parseWaktuLokal,
  type OpenMeteoResponse,
} from "@/server/integrations/open-meteo";

export const UMUR_CACHE_MS = 30 * 60 * 1000;

export type { SumberData };

export type HasilDataCuaca = {
  dataCuaca: DataCuaca;
  raw: OpenMeteoResponse;
  sumber: SumberData;
};

/** simpanData(): simpan respons Open-Meteo sebagai DataCuaca. */
export async function simpanData(idWilayah: string, raw: OpenMeteoResponse) {
  const { current } = raw;
  return db.dataCuaca.create({
    data: {
      idWilayah,
      curahHujan: current.precipitation,
      suhu: current.temperature_2m,
      kelembapan: current.relative_humidity_2m,
      kondisiCuaca: current.weather_code,
      kecepatanAngin: current.wind_speed_10m,
      waktuPengamatan: parseWaktuLokal(current.time, raw.utc_offset_seconds),
      rawJson: raw,
    },
  });
}

/** ambilDataDariAPI(wilayah): koordinat wilayah → Open-Meteo → simpanData(). */
export async function ambilDataDariAPI(wilayah: Pick<Wilayah, "idWilayah" | "koordinatLatitude" | "koordinatLongitude">) {
  const raw = await ambilDataCuaca(wilayah.koordinatLatitude, wilayah.koordinatLongitude);
  const dataCuaca = await simpanData(wilayah.idWilayah, raw);
  return { dataCuaca, raw };
}

export async function dataCuacaTerakhir(idWilayah: string) {
  return db.dataCuaca.findFirst({ where: { idWilayah }, orderBy: { waktuAmbil: "desc" } });
}

export function bacaRawJson(dataCuaca: DataCuaca): OpenMeteoResponse | null {
  const hasil = openMeteoResponseSchema.safeParse(dataCuaca.rawJson);
  return hasil.success ? hasil.data : null;
}

/**
 * Pastikan data cuaca tersedia untuk wilayah: pakai cache < 30 menit, jika tidak ambil dari API.
 * Jika API gagal, kembalikan data terakhir (sumber "cadangan"). null jika tidak ada data sama sekali.
 */
export async function lihatDataCuaca(
  wilayah: Pick<Wilayah, "idWilayah" | "koordinatLatitude" | "koordinatLongitude">,
  opsi: { paksa?: boolean } = {},
): Promise<HasilDataCuaca | null> {
  const terakhir = await dataCuacaTerakhir(wilayah.idWilayah);
  const rawTerakhir = terakhir ? bacaRawJson(terakhir) : null;

  if (terakhir && rawTerakhir && !opsi.paksa && Date.now() - terakhir.waktuAmbil.getTime() < UMUR_CACHE_MS) {
    return { dataCuaca: terakhir, raw: rawTerakhir, sumber: "cache" };
  }

  try {
    const baru = await ambilDataDariAPI(wilayah);
    return { ...baru, sumber: "api" };
  } catch (err) {
    console.error(`[cuaca] Gagal mengambil data Open-Meteo untuk ${wilayah.idWilayah}:`, err);
    if (terakhir && rawTerakhir) return { dataCuaca: terakhir, raw: rawTerakhir, sumber: "cadangan" };
    return null;
  }
}
