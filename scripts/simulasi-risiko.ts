/**
 * Simulasi risiko SEDANG/TINGGI untuk menguji alur Bahaya tanpa menunggu hujan lebat.
 *
 *   npm run simulasi -- aktifkan <idWilayah> [TINGGI|SEDANG]
 *   npm run simulasi -- status
 *   npm run simulasi -- pulihkan <idWilayah>|--semua
 *
 * Cara kerja: memasang AmbangRisiko khusus wilayah (id "simulasi-<wilayah>") untuk
 * hujan_24jam mulai 0 mm pada level yang dipilih, sehingga menimpa ambang global
 * (kode tidak diubah; ambang memang dibaca dari DB). Cache cuaca wilayah itu dibuat
 * kedaluwarsa agar kunjungan berikutnya / cron menghitung ulang risiko.
 *
 * PERHATIAN: pelanggan notifikasi aktif di wilayah itu akan menerima push sungguhan.
 * Hanya untuk database lokal/pengembangan.
 */
import type { TingkatRisiko } from "@prisma/client";
import { db } from "../src/server/db";
import { AWALAN_JUDUL_RIWAYAT } from "../src/server/services/riwayat.service";

const AWALAN_ID = "simulasi-";
const PENANDA = "SIMULASI sejak ";

function pastikanDatabaseLokal() {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // biarkan kosong → ditolak di bawah
  }
  if (!["localhost", "127.0.0.1", "::1"].includes(host) && !process.argv.includes("--izinkan-remote")) {
    console.error(`Menolak: DATABASE_URL mengarah ke "${host || "?"}", bukan database lokal.`);
    console.error("Tambahkan --izinkan-remote jika Anda benar-benar yakin (misal database staging).");
    process.exit(1);
  }
}

async function aktifkan(idWilayah: string, level: TingkatRisiko) {
  const wilayah = await db.wilayah.findUnique({ where: { idWilayah } });
  if (!wilayah) {
    console.error(`Wilayah "${idWilayah}" tidak ditemukan. Lihat daftar: npm run simulasi -- status`);
    process.exit(1);
  }
  const sekarang = new Date();
  const idAmbang = `${AWALAN_ID}${idWilayah}`;

  await db.$transaction([
    db.ambangRisiko.deleteMany({ where: { idAmbang } }),
    db.ambangRisiko.create({
      data: {
        idAmbang,
        idWilayah,
        parameter: "hujan_24jam",
        nilaiMinimum: 0,
        nilaiMaksimum: null,
        levelRisiko: level,
        keterangan: `${PENANDA}${sekarang.toISOString()}`,
      },
    }),
    // Cache kedaluwarsa → data cuaca & risiko dihitung ulang pada permintaan berikutnya.
    db.dataCuaca.updateMany({
      where: { idWilayah, waktuAmbil: { gt: new Date(sekarang.getTime() - 60 * 60 * 1000) } },
      data: { waktuAmbil: new Date(sekarang.getTime() - 60 * 60 * 1000) },
    }),
  ]);

  const pelanggan = await db.langgananNotifikasi.count({ where: { idWilayah, status: true } });
  console.log(`✔ Simulasi risiko ${level} aktif untuk ${wilayah.namaWilayah}.`);
  console.log(`  Buka: http://localhost:3000/risiko?wilayah=${idWilayah}`);
  console.log(`  Atau jalankan cron: npm run cron:lokal`);
  if (pelanggan > 0) {
    console.warn(`⚠ ${pelanggan} perangkat berlangganan wilayah ini dan akan menerima notifikasi push sungguhan.`);
  }
  console.log(`  Selesai menguji: npm run simulasi -- pulihkan ${idWilayah}`);
}

async function pulihkan(idWilayah: string | null) {
  const ambang = await db.ambangRisiko.findMany({
    where: { idAmbang: { startsWith: AWALAN_ID }, ...(idWilayah ? { idWilayah } : {}) },
  });
  if (ambang.length === 0) {
    console.log("Tidak ada simulasi aktif.");
    return;
  }

  for (const a of ambang) {
    if (!a.idWilayah) continue;
    const mulai = new Date(a.keterangan?.replace(PENANDA, "") ?? Date.now());
    const [riwayat, cuaca] = await db.$transaction([
      // Riwayat otomatis yang muncul selama simulasi.
      db.informasi.deleteMany({
        where: {
          idWilayah: a.idWilayah,
          judul: { startsWith: AWALAN_JUDUL_RIWAYAT },
          tanggal: { gte: mulai },
        },
      }),
      // Data cuaca sejak simulasi (beserta LevelRisiko & Notifikasi-nya, cascade),
      // agar risiko palsu tidak tampil lagi; kunjungan berikutnya mengambil data baru.
      db.dataCuaca.deleteMany({ where: { idWilayah: a.idWilayah, waktuAmbil: { gte: new Date(mulai.getTime() - 60 * 60 * 1000) } } }),
      db.ambangRisiko.delete({ where: { idAmbang: a.idAmbang } }),
    ]);
    console.log(
      `✔ ${a.idWilayah}: ambang simulasi dihapus, ${riwayat.count} riwayat otomatis & ${cuaca.count} data cuaca simulasi dibersihkan.`,
    );
  }
}

async function status() {
  const [ambang, wilayah] = await Promise.all([
    db.ambangRisiko.findMany({ where: { idAmbang: { startsWith: AWALAN_ID } } }),
    db.wilayah.findMany({ select: { idWilayah: true, namaWilayah: true }, orderBy: { idWilayah: "asc" } }),
  ]);
  console.log(ambang.length ? "Simulasi aktif:" : "Tidak ada simulasi aktif.");
  for (const a of ambang) console.log(`  - ${a.idWilayah}: ${a.levelRisiko} (${a.keterangan})`);
  console.log("\nWilayah tersedia:");
  for (const w of wilayah) console.log(`  ${w.idWilayah.padEnd(18)} ${w.namaWilayah}`);
}

async function main() {
  pastikanDatabaseLokal();
  const [perintah, arg1, arg2] = process.argv.slice(2).filter((a) => a !== "--izinkan-remote");

  switch (perintah) {
    case "aktifkan": {
      if (!arg1) throw new Error("Pakai: npm run simulasi -- aktifkan <idWilayah> [TINGGI|SEDANG]");
      const level = (arg2 ?? "TINGGI").toUpperCase();
      if (level !== "TINGGI" && level !== "SEDANG") throw new Error("Level harus TINGGI atau SEDANG");
      return aktifkan(arg1, level);
    }
    case "pulihkan":
      if (!arg1) throw new Error("Pakai: npm run simulasi -- pulihkan <idWilayah>|--semua");
      return pulihkan(arg1 === "--semua" ? null : arg1);
    case "status":
      return status();
    default:
      console.log(
        "Perintah:\n  aktifkan <idWilayah> [TINGGI|SEDANG]\n  status\n  pulihkan <idWilayah>|--semua",
      );
  }
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
