import { UMUR_SEGARKAN_MS } from "@/lib/constants";
import { formatJam, formatJamZona } from "@/lib/format";
import type { SumberData } from "@/lib/tipe-risiko";
import type { ZonaWaktu } from "@/lib/zona-waktu";

/** Hasil tombol Perbarui: kapan dicek dan data cuaca mana yang didapat (D-057). */
export type HasilCek = {
  dicek: Date;
  /** `waktuAmbilData` sebelum dan sesudah pengecekan (ISO). */
  waktuDataSebelum: string;
  waktuData: string;
  sumber: SumberData;
  /** Zona wilayah terpilih (D-060). */
  zona: ZonaWaktu;
};

/**
 * "Data diperbarui pukul 01:48 WIB." bila ada data baru; bila tidak,
 * "Sudah dicek 01:46 · data terbaru dari 01:33 WIB." beserta kapan data baru bisa diambil.
 * Data cadangan/hemat kuota dijelaskan terpisah oleh `StatusData`.
 */
export function teksHasilCek({ dicek, waktuDataSebelum, waktuData, sumber, zona }: HasilCek) {
  const data = new Date(waktuData);
  if (data.getTime() > new Date(waktuDataSebelum).getTime()) return `Data diperbarui pukul ${formatJamZona(data, zona)}.`;
  const dasar = `Sudah dicek ${formatJam(dicek, zona)} · data terbaru dari ${formatJamZona(data, zona)}.`;
  if (sumber !== "cache") return dasar;
  const berikutnya = new Date(data.getTime() + UMUR_SEGARKAN_MS);
  return `${dasar} Data cuaca diambil ulang paling cepat 15 menit sekali, berikutnya ${formatJamZona(berikutnya, zona)}.`;
}
