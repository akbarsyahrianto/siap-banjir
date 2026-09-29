import type { KategoriInformasi } from "@prisma/client";
import { formatTanggal, formatTanggalPanjang } from "@/lib/format";

/**
 * Tanggal artikel umum = tanggal terbit; tanggal riwayat = tanggal kejadian, atau tanggal data
 * bila sumber resmi tidak menyebut tanggal kejadian (`dataPer`, D-059).
 * Label "Terbit"/"Data per" mencegah tanggal itu terbaca sebagai tanggal kejadian.
 */
export function TanggalInformasi({
  kategori,
  tanggal,
  dataPer = false,
  panjang = false,
}: {
  kategori: KategoriInformasi;
  tanggal: Date;
  dataPer?: boolean;
  panjang?: boolean;
}) {
  const teks = panjang ? formatTanggalPanjang(tanggal) : formatTanggal(tanggal);
  return (
    <span>
      {kategori === "UMUM" ? "Terbit " : dataPer ? "Data per " : null}
      <time dateTime={tanggal.toISOString()}>{teks}</time>
    </span>
  );
}
