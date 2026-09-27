import type { SumberData } from "@/lib/layanan-112";

/** Satu baris kontak darurat. telepon null = nomor belum tersedia dari sumber resmi. */
export type KontakDarurat = {
  nama: string;
  telepon: string | null;
  keterangan?: string;
  sumber?: SumberData;
};
