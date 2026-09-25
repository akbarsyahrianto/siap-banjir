/**
 * Orkestrasi alur sequence diagram langkah 4–7:
 * koordinat wilayah → ambil/cache data cuaca → hitung level risiko → persiapan & rekomendasi.
 * Langkah 8 (notifikasi) dipicu saat LevelRisiko baru Sedang/Tinggi. Langkah 9 (riwayat) di Fase 4.
 */
import { after } from "next/server";
import { db } from "@/server/db";
import { prosesPeringatan } from "@/server/services/notification.service";
import { lihatPersiapan, lihatRekomendasi, lihatWilayah } from "@/server/services/content.service";
import { evaluasiDanSimpanRisiko } from "@/server/services/risk.service";
import { lihatDataCuaca } from "@/server/services/weather.service";
import { daftarHasilParameterSchema } from "@/server/validators/risiko";

/** Data cuaca + level risiko terkini untuk satu wilayah. null jika wilayah tidak ada. */
export async function lihatKondisiWilayah(idWilayah: string) {
  const wilayah = await lihatWilayah(idWilayah);
  if (!wilayah) return null;

  const cuaca = await lihatDataCuaca(wilayah);
  if (!cuaca) return { wilayah, cuaca: null, risiko: null };

  // Satu LevelRisiko per DataCuaca; hitung hanya jika belum ada.
  let risiko = await db.levelRisiko.findFirst({
    where: { idCuaca: cuaca.dataCuaca.idCuaca },
    orderBy: { waktu: "desc" },
  });
  if (!risiko) {
    const baru = await evaluasiDanSimpanRisiko(cuaca.dataCuaca, cuaca.raw);
    risiko = baru;
    // Langkah 8: alt [Sedang/Tinggi] → kirim notifikasi. Dijalankan setelah respons
    // terkirim agar halaman tidak menunggu push service.
    if (baru.level !== "RENDAH") {
      after(async () => {
        try {
          const hasil = await prosesPeringatan(baru);
          console.info(`[push] ${baru.idWilayah} ${baru.level}:`, hasil);
        } catch (err) {
          console.error(`[push] Gagal memproses peringatan ${baru.idWilayah}:`, err);
        }
      });
    }
  }

  const parsed = daftarHasilParameterSchema.safeParse(risiko.parameterPemicu);
  return {
    wilayah,
    cuaca,
    risiko: { ...risiko, hasilPerParameter: parsed.success ? parsed.data : [] },
  };
}

export type KondisiWilayah = NonNullable<Awaited<ReturnType<typeof lihatKondisiWilayah>>>;

/** Level → Persiapan Dini → Rekomendasi (alur bertingkat use case). */
export async function lihatPenanganan(idWilayah: string, level: Parameters<typeof lihatPersiapan>[0]) {
  const [persiapan, rekomendasi] = await Promise.all([
    lihatPersiapan(level, idWilayah),
    lihatRekomendasi(level, idWilayah),
  ]);
  return { persiapan, rekomendasi };
}
