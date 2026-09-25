/**
 * Sequence diagram langkah 9: simpan kejadian risiko TINGGI sebagai riwayat
 * (Informasi kategori RIWAYAT_KEJADIAN). Maksimal satu entri per wilayah per hari (WIB).
 */
import type { LevelRisiko } from "@prisma/client";
import { db } from "@/server/db";
import { formatJam, formatTanggalPanjang } from "@/lib/format";
import { LABEL_LEVEL, PARAMETER_RISIKO, formatNilaiParameter } from "@/lib/risiko";
import { tambahInformasi } from "@/server/services/content.service";
import { daftarHasilParameterSchema } from "@/server/validators/risiko";

export const AWALAN_JUDUL_RIWAYAT = "Risiko banjir TINGGI terdeteksi di";

const WIB_MS = 7 * 60 * 60 * 1000;

/** Rentang [awal, akhir) satu hari kalender WIB yang memuat `waktu`. */
export function rentangHariWib(waktu: Date) {
  const awal = new Date(Math.floor((waktu.getTime() + WIB_MS) / 86_400_000) * 86_400_000 - WIB_MS);
  return { awal, akhir: new Date(awal.getTime() + 86_400_000) };
}

export function susunIsiRiwayat(risiko: Pick<LevelRisiko, "deskripsi" | "waktu" | "parameterPemicu">, namaWilayah: string) {
  const parsed = daftarHasilParameterSchema.safeParse(risiko.parameterPemicu);
  const parameter = parsed.success ? parsed.data : [];
  const daftar = parameter
    .map(
      (p) =>
        `- ${PARAMETER_RISIKO[p.parameter].label}: ${formatNilaiParameter(p.parameter, p.nilai)} (${LABEL_LEVEL[p.level]})`,
    )
    .join("\n");

  return [
    `Siap Banjir mendeteksi risiko banjir TINGGI di ${namaWilayah} pada ${formatTanggalPanjang(risiko.waktu)} pukul ${formatJam(risiko.waktu)} WIB.`,
    risiko.deskripsi,
    daftar ? `Parameter cuaca saat itu:\n${daftar}` : null,
    "Catatan: ini adalah deteksi otomatis berdasarkan data cuaca Open-Meteo dan ambang batas risiko, bukan laporan kejadian banjir yang terverifikasi. Informasi resmi: BMKG dan BPBD setempat.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Simpan riwayat jika level TINGGI dan belum ada riwayat otomatis untuk wilayah itu di hari yang sama. */
export async function simpanRiwayatRisikoTinggi(risiko: LevelRisiko) {
  if (risiko.level !== "TINGGI") return false;

  const wilayah = await db.wilayah.findUnique({
    where: { idWilayah: risiko.idWilayah },
    select: { namaWilayah: true },
  });
  if (!wilayah) return false;

  const { awal, akhir } = rentangHariWib(risiko.waktu);
  const sudahAda = await db.informasi.findFirst({
    where: {
      idWilayah: risiko.idWilayah,
      kategori: "RIWAYAT_KEJADIAN",
      judul: { startsWith: AWALAN_JUDUL_RIWAYAT },
      tanggal: { gte: awal, lt: akhir },
    },
    select: { idInformasi: true },
  });
  if (sudahAda) return false;

  await tambahInformasi({
    idWilayah: risiko.idWilayah,
    kategori: "RIWAYAT_KEJADIAN",
    judul: `${AWALAN_JUDUL_RIWAYAT} ${wilayah.namaWilayah}`,
    isi: susunIsiRiwayat(risiko, wilayah.namaWilayah),
    tanggal: risiko.waktu,
  });
  return true;
}
