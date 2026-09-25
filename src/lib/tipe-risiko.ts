/** Bentuk data risiko yang dikirim ke klien (JSON: tanggal sebagai string ISO). */
import type { TingkatRisiko } from "@prisma/client";
import type { HasilParameter } from "@/server/validators/risiko";

/**
 * api = baru diambil; cache = data DB < 30 menit;
 * cadangan = API gagal, memakai data terakhir yang tersimpan.
 */
export type SumberData = "api" | "cache" | "cadangan";

export type RisikoKlien = {
  idRisiko: string;
  idWilayah: string;
  namaWilayah: string;
  level: TingkatRisiko;
  skorRisiko: number;
  deskripsi: string;
  parameter: HasilParameter[];
  waktu: string;
  sumberData: SumberData;
  waktuAmbilData: string;
};

export type PenangananKlien = {
  level: TingkatRisiko;
  persiapan: { idPersiapan: string; isiPersiapan: string }[];
  rekomendasi: { idRekomendasi: string; isiRekomendasi: string }[];
};
