/**
 * Integration test langkah 9 (riwayat risiko tinggi) terhadap database asli.
 * Jalankan: npm run test:integration
 */
import type { TingkatRisiko } from "@prisma/client";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/integrations/web-push", () => ({
  kirimPush: async () => ({ ok: true }),
  pushTersedia: () => true,
}));
// tindakLanjutRisiko diimpor dari modul yang juga memakai after(); tidak dipanggil di sini.
vi.mock("next/server", () => ({ after: () => undefined }));

const { db } = await import("@/server/db");
const { tindakLanjutRisiko } = await import("@/server/services/pemantauan.service");
const { AWALAN_JUDUL_RIWAYAT } = await import("@/server/services/riwayat.service");

const WILAYAH = "kota-padang";
const cuacaDibuat: string[] = [];
const waktuUji = new Date("2020-02-02T05:00:00Z"); // tanggal lampau agar tidak bentrok dengan data nyata

async function buatRisiko(level: TingkatRisiko, waktu = waktuUji) {
  const cuaca = await db.dataCuaca.create({
    data: {
      idWilayah: WILAYAH,
      curahHujan: 0,
      suhu: 27,
      kelembapan: 90,
      kondisiCuaca: 65,
      kecepatanAngin: 8,
      waktuPengamatan: waktu,
      waktuAmbil: waktu,
      rawJson: { uji: true },
    },
  });
  cuacaDibuat.push(cuaca.idCuaca);
  return db.levelRisiko.create({
    data: {
      idWilayah: WILAYAH,
      idCuaca: cuaca.idCuaca,
      level,
      skorRisiko: 85,
      deskripsi: `Risiko ${level} karena curah hujan 24 jam terakhir 80 mm.`,
      parameterPemicu: [{ parameter: "hujan_24jam", nilai: 80, level, skor: 85, ambangKhusus: false, pemicu: true }],
      waktu,
    },
  });
}

const riwayatUji = () =>
  db.informasi.findMany({
    where: {
      idWilayah: WILAYAH,
      judul: { startsWith: AWALAN_JUDUL_RIWAYAT },
      tanggal: { gte: new Date("2020-02-01T00:00:00Z"), lt: new Date("2020-02-05T00:00:00Z") },
    },
  });

afterAll(async () => {
  await db.informasi.deleteMany({ where: { idInformasi: { in: (await riwayatUji()).map((i) => i.idInformasi) } } });
  await db.dataCuaca.deleteMany({ where: { idCuaca: { in: cuacaDibuat } } });
  await db.$disconnect();
});

describe("tindakLanjutRisiko: simpan riwayat risiko tinggi", () => {
  it("SEDANG tidak disimpan sebagai riwayat", async () => {
    expect((await tindakLanjutRisiko(await buatRisiko("SEDANG"))).riwayatDisimpan).toBe(false);
    expect(await riwayatUji()).toHaveLength(0);
  });

  it("TINGGI disimpan sekali per wilayah per hari (WIB)", async () => {
    expect((await tindakLanjutRisiko(await buatRisiko("TINGGI"))).riwayatDisimpan).toBe(true);
    // Deteksi kedua di hari yang sama tidak menambah riwayat.
    const kedua = await buatRisiko("TINGGI", new Date("2020-02-02T10:00:00Z"));
    expect((await tindakLanjutRisiko(kedua)).riwayatDisimpan).toBe(false);
    // Hari berikutnya (WIB) → riwayat baru.
    const besok = await buatRisiko("TINGGI", new Date("2020-02-02T18:00:00Z")); // 3 Feb 01:00 WIB
    expect((await tindakLanjutRisiko(besok)).riwayatDisimpan).toBe(true);

    const daftar = await riwayatUji();
    expect(daftar).toHaveLength(2);
    expect(daftar[0]).toMatchObject({ kategori: "RIWAYAT_KEJADIAN", idWilayah: WILAYAH });
    expect(daftar[0]?.isi).toContain("bukan laporan kejadian banjir yang terverifikasi");
  });
});
