import type { KategoriInformasi } from "@prisma/client";
import { formatTanggal, formatTanggalPanjang } from "@/lib/format";

/**
 * Tanggal artikel umum = tanggal terbit; tanggal riwayat = tanggal kejadian.
 * Label "Terbit" mencegah artikel umum terbaca sebagai laporan kejadian di tanggal itu.
 */
export function TanggalInformasi({
  kategori,
  tanggal,
  panjang = false,
}: {
  kategori: KategoriInformasi;
  tanggal: Date;
  panjang?: boolean;
}) {
  const teks = panjang ? formatTanggalPanjang(tanggal) : formatTanggal(tanggal);
  return (
    <span>
      {kategori === "UMUM" ? "Terbit " : null}
      <time dateTime={tanggal.toISOString()}>{teks}</time>
    </span>
  );
}
