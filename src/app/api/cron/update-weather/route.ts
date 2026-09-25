/**
 * Cron: perbarui cuaca semua wilayah → hitung risiko → kirim notifikasi → simpan riwayat.
 * Dilindungi header `Authorization: Bearer ${CRON_SECRET}`.
 * Dipanggil oleh Vercel Cron (GET), GitHub Actions, atau `npm run cron:lokal`.
 */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { otorisasiCron, petakanTerbatas } from "@/server/cron";
import { pantauWilayah, tindakLanjutRisiko, type HasilTindakLanjut } from "@/server/services/pemantauan.service";

export const dynamic = "force-dynamic";
// 14+ wilayah × (Open-Meteo + push); paralel 4.
export const maxDuration = 60;

const PARALEL = 4;

type HasilWilayah = {
  idWilayah: string;
  sumber: "api" | "cache" | "cadangan" | null;
  level: "RENDAH" | "SEDANG" | "TINGGI" | null;
  risikoBaru: boolean;
  tindakLanjut: HasilTindakLanjut | null;
  galat?: string;
};

async function jalankan(req: Request) {
  if (!otorisasiCron(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const mulai = Date.now();
  const paksa = new URL(req.url).searchParams.get("paksa") === "1";
  const daftar = await db.wilayah.findMany({
    select: { idWilayah: true, namaWilayah: true, koordinatLatitude: true, koordinatLongitude: true },
    orderBy: { idWilayah: "asc" },
  });

  const hasil = await petakanTerbatas(daftar, PARALEL, async (wilayah): Promise<HasilWilayah> => {
    try {
      const { cuaca, risiko, risikoBaru } = await pantauWilayah(wilayah, { paksa });
      // Tindak lanjut hanya untuk risiko yang baru dihitung; data dari cache sudah
      // ditindaklanjuti saat pertama kali dihitung.
      const tindakLanjut = risikoBaru && risikoBaru.level !== "RENDAH" ? await tindakLanjutRisiko(risikoBaru) : null;
      return {
        idWilayah: wilayah.idWilayah,
        sumber: cuaca?.sumber ?? null,
        level: risiko?.level ?? null,
        risikoBaru: Boolean(risikoBaru),
        tindakLanjut,
      };
    } catch (err) {
      console.error(`[cron] ${wilayah.idWilayah} gagal:`, err);
      return {
        idWilayah: wilayah.idWilayah,
        sumber: null,
        level: null,
        risikoBaru: false,
        tindakLanjut: null,
        galat: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const ringkasan = {
    wilayah: hasil.length,
    diperbarui: hasil.filter((h) => h.sumber === "api").length,
    gagal: hasil.filter((h) => h.galat || h.sumber === "cadangan" || h.sumber === null).length,
    notifikasiTerkirim: hasil.reduce((n, h) => n + (h.tindakLanjut?.notifikasi.terkirim ?? 0), 0),
    riwayatDisimpan: hasil.filter((h) => h.tindakLanjut?.riwayatDisimpan).length,
    durasiMs: Date.now() - mulai,
  };
  console.info("[cron] update-weather:", ringkasan);

  return NextResponse.json({ ringkasan, hasil });
}

// Vercel Cron memanggil dengan GET; POST disediakan untuk pemanggil lain.
export const GET = jalankan;
export const POST = jalankan;
