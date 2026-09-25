/**
 * Simulasi risiko SEDANG/TINGGI untuk menguji alur Bahaya tanpa menunggu hujan lebat.
 *
 *   npm run simulasi -- aktifkan <kodeWilayah> [TINGGI|SEDANG]
 *   npm run simulasi -- cari <kata kunci>
 *   npm run simulasi -- status
 *   npm run simulasi -- pulihkan <kodeWilayah>|--semua
 *
 * Cara kerja: memasang AmbangRisiko khusus wilayah (id "simulasi-<kode>") untuk
 * hujan_24jam mulai 0 mm pada level yang dipilih. Kode boleh tingkat apa pun
 * (provinsi/kab/kota/kecamatan/desa); ambang diwariskan ke semua desa/kelurahan di bawahnya
 * dan menimpa ambang global (kode aplikasi tidak diubah; ambang memang dibaca dari DB).
 * Cache cuaca sel grid desa/kelurahan itu dibuat kedaluwarsa agar kunjungan berikutnya /
 * cron menghitung ulang risiko.
 *
 * PERHATIAN: pelanggan notifikasi aktif di wilayah itu akan menerima push sungguhan.
 * Hanya untuk database lokal/pengembangan.
 */
import type { Prisma, TingkatRisiko } from "@prisma/client";
import { kodeKabKota, kodeValid } from "../src/lib/kode-wilayah";
import { db } from "../src/server/db";
import { AWALAN_JUDUL_RIWAYAT } from "../src/server/services/riwayat.service";

const AWALAN_ID = "simulasi-";
const PENANDA = "SIMULASI sejak ";
const SEJAM = 60 * 60 * 1000;

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

/** Filter kode wilayah itu sendiri dan semua turunannya. */
function diBawah(kode: string): Prisma.StringFilter | string {
  return kode.split(".").length === 4 ? kode : { startsWith: `${kode}.` };
}

/** Sel grid semua desa/kelurahan aktif di bawah kode. */
async function selGrid(kode: string) {
  const desa = await db.wilayah.findMany({
    where: { level: "DESA", aktif: true, idWilayah: diBawah(kode), kunciGrid: { not: null } },
    select: { kunciGrid: true },
    distinct: ["kunciGrid"],
  });
  return desa.map((d) => d.kunciGrid).filter((k): k is string => k !== null);
}

/** Riwayat otomatis disimpan per kab/kota: kab/kota yang memuat kode, atau semua kab/kota di provinsi. */
function filterKabKota(kode: string): Prisma.StringNullableFilter | string {
  return kodeKabKota(kode) ?? { startsWith: `${kode}.` };
}

async function aktifkan(kode: string, level: TingkatRisiko) {
  const wilayah = kodeValid(kode) ? await db.wilayah.findUnique({ where: { idWilayah: kode } }) : null;
  if (!wilayah) {
    console.error(`Wilayah "${kode}" tidak ditemukan. Cari kodenya: npm run simulasi -- cari <nama>`);
    process.exit(1);
  }
  const sekarang = new Date();
  const idAmbang = `${AWALAN_ID}${kode}`;
  const sel = await selGrid(kode);

  await db.$transaction([
    db.ambangRisiko.deleteMany({ where: { idAmbang } }),
    db.ambangRisiko.create({
      data: {
        idAmbang,
        idWilayah: kode,
        parameter: "hujan_24jam",
        nilaiMinimum: 0,
        nilaiMaksimum: null,
        levelRisiko: level,
        keterangan: `${PENANDA}${sekarang.toISOString()}`,
      },
    }),
    // Cache kedaluwarsa → data cuaca & risiko dihitung ulang pada permintaan berikutnya.
    db.dataCuaca.updateMany({
      where: { kunciGrid: { in: sel }, waktuAmbil: { gt: new Date(sekarang.getTime() - SEJAM) } },
      data: { waktuAmbil: new Date(sekarang.getTime() - SEJAM) },
    }),
  ]);

  const pelanggan = await db.langgananNotifikasi.count({ where: { idWilayah: diBawah(kode), status: true } });
  console.log(`✔ Simulasi risiko ${level} aktif untuk ${wilayah.namaLengkap} (${sel.length} sel grid).`);
  if (wilayah.level === "DESA") console.log(`  Buka: http://localhost:3000/risiko?wilayah=${kode}`);
  else console.log(`  Buka salah satu desa/kelurahan di wilayah ini di http://localhost:3000/risiko`);
  console.log(`  Atau jalankan cron (hanya desa/kelurahan yang punya pelanggan): npm run cron:lokal`);
  if (pelanggan > 0) {
    console.warn(`⚠ ${pelanggan} perangkat berlangganan di wilayah ini dan akan menerima notifikasi push sungguhan.`);
  }
  console.log(`  Selesai menguji: npm run simulasi -- pulihkan ${kode}`);
}

async function pulihkan(kode: string | null) {
  const ambang = await db.ambangRisiko.findMany({
    where: { idAmbang: { startsWith: AWALAN_ID }, ...(kode ? { idWilayah: kode } : {}) },
  });
  if (ambang.length === 0) {
    console.log("Tidak ada simulasi aktif.");
    return;
  }

  for (const a of ambang) {
    if (!a.idWilayah) continue;
    const mulai = new Date(a.keterangan?.replace(PENANDA, "") ?? Date.now());
    const sel = await selGrid(a.idWilayah);
    const [riwayat, cuaca] = await db.$transaction([
      // Riwayat otomatis kab/kota yang dibuat selama simulasi. Baris desa yang ditambahkan ke
      // riwayat yang sudah ada sebelum simulasi tidak dapat dipisahkan dan tetap tersimpan.
      db.informasi.deleteMany({
        where: {
          idWilayah: filterKabKota(a.idWilayah),
          judul: { startsWith: AWALAN_JUDUL_RIWAYAT },
          tanggal: { gte: mulai },
        },
      }),
      // Data cuaca sel grid sejak simulasi (beserta LevelRisiko & Notifikasi-nya, cascade),
      // agar risiko palsu tidak tampil lagi; kunjungan berikutnya mengambil data baru.
      db.dataCuaca.deleteMany({ where: { kunciGrid: { in: sel }, waktuAmbil: { gte: new Date(mulai.getTime() - SEJAM) } } }),
      db.ambangRisiko.delete({ where: { idAmbang: a.idAmbang } }),
    ]);
    console.log(
      `✔ ${a.idWilayah}: ambang simulasi dihapus, ${riwayat.count} riwayat otomatis & ${cuaca.count} data cuaca simulasi dibersihkan.`,
    );
  }
}

async function cari(kataKunci: string) {
  const token = kataKunci.split(/\s+/).filter((t) => t.length >= 2);
  if (token.length === 0) throw new Error("Pakai: npm run simulasi -- cari <kata kunci>");
  const hasil = await db.wilayah.findMany({
    where: { aktif: true, AND: token.map((t) => ({ namaLengkap: { contains: t, mode: "insensitive" as const } })) },
    select: { idWilayah: true, namaLengkap: true },
    orderBy: { idWilayah: "asc" },
    take: 30,
  });
  if (hasil.length === 0) console.log("Tidak ditemukan.");
  for (const w of hasil) console.log(`  ${w.idWilayah.padEnd(14)} ${w.namaLengkap}`);
}

async function status() {
  const ambang = await db.ambangRisiko.findMany({ where: { idAmbang: { startsWith: AWALAN_ID } } });
  console.log(ambang.length ? "Simulasi aktif:" : "Tidak ada simulasi aktif.");
  for (const a of ambang) console.log(`  - ${a.idWilayah}: ${a.levelRisiko} (${a.keterangan})`);
}

async function main() {
  pastikanDatabaseLokal();
  const [perintah, ...arg] = process.argv.slice(2).filter((a) => a !== "--izinkan-remote");
  const [arg1, arg2] = arg;

  switch (perintah) {
    case "aktifkan": {
      if (!arg1) throw new Error("Pakai: npm run simulasi -- aktifkan <kodeWilayah> [TINGGI|SEDANG]");
      const level = (arg2 ?? "TINGGI").toUpperCase();
      if (level !== "TINGGI" && level !== "SEDANG") throw new Error("Level harus TINGGI atau SEDANG");
      return aktifkan(arg1, level);
    }
    case "pulihkan":
      if (!arg1) throw new Error("Pakai: npm run simulasi -- pulihkan <kodeWilayah>|--semua");
      return pulihkan(arg1 === "--semua" ? null : arg1);
    case "cari":
      return cari(arg.join(" "));
    case "status":
      return status();
    default:
      console.log(
        "Perintah:\n  aktifkan <kodeWilayah> [TINGGI|SEDANG]\n  cari <kata kunci>\n  status\n  pulihkan <kodeWilayah>|--semua",
      );
  }
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
