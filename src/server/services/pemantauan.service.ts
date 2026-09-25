/**
 * Orkestrasi alur sequence diagram:
 *  4. koordinat wilayah → ambil/cache data cuaca (Open-Meteo) → simpanData()
 *  5. hitungLevelRisiko() → cekAmbang()
 *  6. lihatPersiapan() & lihatRekomendasi()
 *  8. alt [Sedang/Tinggi] → buatNotifikasi() → cariLanggananAktif() → kirimNotifikasi()
 *  9. simpan kejadian risiko tinggi sebagai riwayat
 * Dipakai halaman/API (lihatKondisiWilayah) dan cron (pantauWilayah + tindakLanjutRisiko).
 */
import type { LevelRisiko, TingkatRisiko, Wilayah } from "@prisma/client";
import { after } from "next/server";
import type { PenangananKlien, RisikoKlien } from "@/lib/tipe-risiko";
import { db } from "@/server/db";
import { lihatPersiapan, lihatRekomendasi, lihatWilayah } from "@/server/services/content.service";
import { prosesPeringatan, type RingkasanPeringatan } from "@/server/services/notification.service";
import { evaluasiDanSimpanRisiko } from "@/server/services/risk.service";
import { simpanRiwayatRisikoTinggi } from "@/server/services/riwayat.service";
import { lihatDataCuaca } from "@/server/services/weather.service";
import { daftarHasilParameterSchema } from "@/server/validators/risiko";

type WilayahPantau = Pick<Wilayah, "idWilayah" | "namaWilayah" | "koordinatLatitude" | "koordinatLongitude">;

/**
 * Langkah 4–5 untuk satu wilayah. `risikoBaru` terisi jika LevelRisiko baru saja dihitung
 * (data cuaca baru), sehingga tindak lanjut (notifikasi & riwayat) hanya sekali per data.
 */
export async function pantauWilayah(wilayah: WilayahPantau, opsi: { paksa?: boolean } = {}) {
  const cuaca = await lihatDataCuaca(wilayah, opsi);
  if (!cuaca) return { cuaca: null, risiko: null, risikoBaru: null };

  // Satu LevelRisiko per DataCuaca; hitung hanya jika belum ada.
  const ada = await db.levelRisiko.findFirst({
    where: { idCuaca: cuaca.dataCuaca.idCuaca },
    orderBy: { waktu: "desc" },
  });
  const risikoBaru = ada ? null : await evaluasiDanSimpanRisiko(cuaca.dataCuaca, cuaca.raw);
  const risiko = ada ?? risikoBaru;
  if (!risiko) return { cuaca, risiko: null, risikoBaru: null };

  const parsed = daftarHasilParameterSchema.safeParse(risiko.parameterPemicu);
  return {
    cuaca,
    risiko: { ...risiko, hasilPerParameter: parsed.success ? parsed.data : [] },
    risikoBaru,
  };
}

export type HasilTindakLanjut = { notifikasi: RingkasanPeringatan; riwayatDisimpan: boolean };

/** Langkah 8–9: kirim peringatan (Sedang/Tinggi) dan simpan riwayat (Tinggi). */
export async function tindakLanjutRisiko(risiko: LevelRisiko): Promise<HasilTindakLanjut> {
  const [notifikasi, riwayatDisimpan] = await Promise.all([
    prosesPeringatan(risiko),
    simpanRiwayatRisikoTinggi(risiko),
  ]);
  return { notifikasi, riwayatDisimpan };
}

/** Data cuaca + level risiko terkini untuk satu wilayah. null jika wilayah tidak ada. */
export async function lihatKondisiWilayah(idWilayah: string) {
  const wilayah = await lihatWilayah(idWilayah);
  if (!wilayah) return null;

  const { cuaca, risiko, risikoBaru } = await pantauWilayah(wilayah);

  // Tindak lanjut dijalankan setelah respons terkirim agar halaman tidak menunggu push service.
  if (risikoBaru && risikoBaru.level !== "RENDAH") {
    after(async () => {
      try {
        const hasil = await tindakLanjutRisiko(risikoBaru);
        console.info(`[pemantauan] ${risikoBaru.idWilayah} ${risikoBaru.level}:`, hasil);
      } catch (err) {
        console.error(`[pemantauan] Tindak lanjut gagal untuk ${risikoBaru.idWilayah}:`, err);
      }
    });
  }

  return { wilayah, cuaca, risiko };
}

export type KondisiWilayah = NonNullable<Awaited<ReturnType<typeof lihatKondisiWilayah>>>;

/** Bentuk JSON risiko untuk klien (API & state machine). */
export function keRisikoKlien(kondisi: KondisiWilayah): RisikoKlien | null {
  const { wilayah, cuaca, risiko } = kondisi;
  if (!cuaca || !risiko) return null;
  return {
    idRisiko: risiko.idRisiko,
    idWilayah: wilayah.idWilayah,
    namaWilayah: wilayah.namaWilayah,
    level: risiko.level,
    skorRisiko: risiko.skorRisiko,
    deskripsi: risiko.deskripsi,
    parameter: risiko.hasilPerParameter,
    waktu: risiko.waktu.toISOString(),
    sumberData: cuaca.sumber,
    waktuAmbilData: cuaca.dataCuaca.waktuAmbil.toISOString(),
  };
}

/** Level → Persiapan Dini → Rekomendasi (alur bertingkat use case). */
export async function lihatPenanganan(idWilayah: string, level: TingkatRisiko): Promise<PenangananKlien> {
  const [persiapan, rekomendasi] = await Promise.all([
    lihatPersiapan(level, idWilayah),
    lihatRekomendasi(level, idWilayah),
  ]);
  return {
    level,
    persiapan: persiapan.map(({ idPersiapan, isiPersiapan }) => ({ idPersiapan, isiPersiapan })),
    rekomendasi: rekomendasi.map(({ idRekomendasi, isiRekomendasi }) => ({ idRekomendasi, isiRekomendasi })),
  };
}
