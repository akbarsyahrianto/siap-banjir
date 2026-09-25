/**
 * Orkestrasi alur sequence diagram langkah 4–7:
 * koordinat wilayah → ambil/cache data cuaca → hitung level risiko → persiapan & rekomendasi.
 * (Langkah 8–9, notifikasi & riwayat, ditambahkan di Fase 3–4.)
 */
import { db } from "@/server/db";
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
  const risiko =
    (await db.levelRisiko.findFirst({
      where: { idCuaca: cuaca.dataCuaca.idCuaca },
      orderBy: { waktu: "desc" },
    })) ?? (await evaluasiDanSimpanRisiko(cuaca.dataCuaca, cuaca.raw));

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
