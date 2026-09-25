/**
 * Seed Siap Banjir. Idempoten: Wilayah di-upsert, konten (ambang, informasi,
 * persiapan, rekomendasi) dikosongkan lalu diisi ulang.
 * Jalankan: npm run db:seed
 */
import { db } from "../src/server/db";
import {
  tambahAmbang,
  tambahInformasi,
  tambahPersiapan,
  tambahRekomendasi,
  tambahWilayah,
  ubahWilayah,
} from "../src/server/services/content.service";
import { ambangSeed, informasiSeed, persiapanSeed, rekomendasiSeed, wilayahSeed } from "./seed-data";

async function main() {
  for (const { idWilayah, ...data } of wilayahSeed) {
    const ada = await db.wilayah.findUnique({ where: { idWilayah } });
    if (ada) await ubahWilayah(idWilayah, data);
    else await tambahWilayah({ idWilayah, ...data });
  }

  await db.$transaction([
    db.ambangRisiko.deleteMany(),
    db.informasi.deleteMany(),
    db.persiapanDini.deleteMany(),
    db.rekomendasi.deleteMany(),
  ]);

  for (const a of ambangSeed) await tambahAmbang(a);
  for (const i of informasiSeed) await tambahInformasi(i);
  for (const p of persiapanSeed) await tambahPersiapan(p);
  for (const r of rekomendasiSeed) await tambahRekomendasi(r);

  console.log(
    `Seed selesai: ${wilayahSeed.length} wilayah, ${ambangSeed.length} ambang, ` +
      `${informasiSeed.length} informasi, ${persiapanSeed.length} persiapan, ${rekomendasiSeed.length} rekomendasi.`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
