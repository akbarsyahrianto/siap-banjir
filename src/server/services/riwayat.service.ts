/**
 * Sequence diagram langkah 9: simpan kejadian risiko TINGGI sebagai riwayat
 * (Informasi kategori RIWAYAT_KEJADIAN).
 *
 * Satu entri per kab/kota per hari kalender WIB; desa/kelurahan yang terdeteksi TINGGI di
 * hari itu ditambahkan sebagai baris daftar (DECISIONS D-038). Penulisan diserialkan dengan
 * advisory lock PostgreSQL agar proses paralel (cron) tidak membuat entri ganda.
 */
import type { LevelRisiko } from "@prisma/client";
import { db } from "@/server/db";
import { formatJam, formatTanggalPanjang } from "@/lib/format";
import { jenisWilayah, kodeKabKota, leluhurKode } from "@/lib/kode-wilayah";
import { informasiInputSchema } from "@/server/validators/konten";

export const AWALAN_JUDUL_RIWAYAT = "Risiko banjir TINGGI terdeteksi di";
const JUDUL_DAFTAR = "Desa/kelurahan yang terdeteksi:";
const CATATAN =
  "Catatan: ini adalah deteksi otomatis berdasarkan data cuaca Open-Meteo dan ambang batas risiko, bukan laporan kejadian banjir yang terverifikasi. Informasi resmi: BMKG dan BPBD setempat.";

const WIB_MS = 7 * 60 * 60 * 1000;

/** Rentang [awal, akhir) satu hari kalender WIB yang memuat `waktu`. */
export function rentangHariWib(waktu: Date) {
  const awal = new Date(Math.floor((waktu.getTime() + WIB_MS) / 86_400_000) * 86_400_000 - WIB_MS);
  return { awal, akhir: new Date(awal.getTime() + 86_400_000) };
}

/** "- Kelurahan Sukarasa, Kec. Tangerang (13:05 WIB): Risiko TINGGI karena …" */
export function barisDesa(labelDesa: string, waktu: Date, deskripsi: string) {
  return `- ${labelDesa} (${formatJam(waktu)} WIB): ${deskripsi}`;
}

export function susunIsiRiwayat(namaKabKota: string, waktu: Date, baris: string[]) {
  return [
    `Siap Banjir mendeteksi risiko banjir TINGGI di ${namaKabKota} pada ${formatTanggalPanjang(waktu)}.`,
    `${JUDUL_DAFTAR}\n${baris.join("\n")}`,
    CATATAN,
  ].join("\n\n");
}

/** Tambahkan desa ke isi riwayat yang sudah ada; null jika desa itu sudah tercantum. */
export function tambahkanDesaKeIsi(isi: string, labelDesa: string, baris: string): string | null {
  if (isi.includes(`\n- ${labelDesa} (`)) return null;
  const bagian = isi.split("\n\n");
  const i = bagian.findIndex((b) => b.startsWith(JUDUL_DAFTAR));
  if (i < 0) return `${isi}\n\n${JUDUL_DAFTAR}\n${baris}`;
  bagian[i] = `${bagian[i]}\n${baris}`;
  return bagian.join("\n\n");
}

export type HasilRiwayat = "dibuat" | "diperbarui" | false;

/** Simpan/perbarui riwayat kab/kota jika level TINGGI. */
export async function simpanRiwayatRisikoTinggi(risiko: LevelRisiko): Promise<HasilRiwayat> {
  if (risiko.level !== "TINGGI") return false;
  const kodeKab = kodeKabKota(risiko.idWilayah);
  if (!kodeKab) return false;

  const leluhur = await db.wilayah.findMany({
    where: { idWilayah: { in: leluhurKode(risiko.idWilayah) } },
    select: { idWilayah: true, namaWilayah: true, level: true },
  });
  const nama = (level: string) => leluhur.find((w) => w.level === level)?.namaWilayah;
  const namaKab = nama("KABKOTA");
  if (!namaKab) return false;

  const desa = nama("DESA");
  const kec = nama("KECAMATAN");
  const labelDesa = desa
    ? `${jenisWilayah(risiko.idWilayah)} ${desa}${kec ? `, Kec. ${kec}` : ""}`
    : (kec ? `Kec. ${kec}` : namaKab);
  const baris = barisDesa(labelDesa, risiko.waktu, risiko.deskripsi);
  const { awal, akhir } = rentangHariWib(risiko.waktu);

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`riwayat:${kodeKab}:${awal.toISOString()}`}))`;

    const ada = await tx.informasi.findFirst({
      where: {
        idWilayah: kodeKab,
        kategori: "RIWAYAT_KEJADIAN",
        judul: { startsWith: AWALAN_JUDUL_RIWAYAT },
        tanggal: { gte: awal, lt: akhir },
      },
    });

    if (ada) {
      const isiBaru = tambahkanDesaKeIsi(ada.isi, labelDesa, baris);
      if (!isiBaru) return false;
      await tx.informasi.update({ where: { idInformasi: ada.idInformasi }, data: { isi: isiBaru } });
      return "diperbarui";
    }

    const data = informasiInputSchema.parse({
      idWilayah: kodeKab,
      kategori: "RIWAYAT_KEJADIAN",
      judul: `${AWALAN_JUDUL_RIWAYAT} ${namaKab}`,
      isi: susunIsiRiwayat(namaKab, risiko.waktu, [baris]),
      tanggal: risiko.waktu,
    });
    await tx.informasi.create({ data });
    return "dibuat";
  });
}
