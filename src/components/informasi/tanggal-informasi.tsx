import type { KategoriInformasi } from "@prisma/client";
import { formatTanggal, formatTanggalPanjang } from "@/lib/format";
import { zonaWilayah } from "@/lib/zona-waktu";

/**
 * Tanggal artikel umum = tanggal terbit; tanggal riwayat = tanggal kejadian, atau tanggal data
 * bila sumber resmi tidak menyebut tanggal kejadian (`dataPer`, D-059).
 * Label "Terbit"/"Data per" mencegah tanggal itu terbaca sebagai tanggal kejadian.
 */
export function TanggalInformasi({
  kategori,
  tanggal,
  idWilayah,
  dataPer = false,
  panjang = false,
}: {
  kategori: KategoriInformasi;
  tanggal: Date;
  /** Tanggal dibaca di zona wilayah entri (riwayat otomatis per hari lokal, D-060). */
  idWilayah: string | null;
  dataPer?: boolean;
  panjang?: boolean;
}) {
  const zona = zonaWilayah(idWilayah);
  const teks = panjang ? formatTanggalPanjang(tanggal, zona) : formatTanggal(tanggal, zona);
  return (
    <span>
      {kategori === "UMUM" ? "Terbit " : dataPer ? "Data per " : null}
      <time dateTime={tanggal.toISOString()}>{teks}</time>
    </span>
  );
}
