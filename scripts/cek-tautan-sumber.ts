/**
 * Periksa bahwa semua tautan sumber informasi (seed + riwayat otomatis) bisa dibuka.
 *
 *   npm run cek:sumber
 *
 * Memakai user agent browser (sebagian situs pemerintah menolak klien non-browser) dan
 * mencoba ulang sekali untuk gangguan jaringan sesaat. Keluar dengan kode 1 jika ada yang gagal.
 * Tidak menyentuh database.
 */
import { informasiSeed } from "../prisma/seed-data";
import { SUMBER_DETEKSI } from "../src/lib/sumber-informasi";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0";
const BATAS_WAKTU_MS = 30_000;

async function cek(url: string): Promise<{ ok: boolean; keterangan: string }> {
  let keterangan = "";
  for (let percobaan = 1; percobaan <= 2; percobaan++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
        redirect: "follow",
        signal: AbortSignal.timeout(BATAS_WAKTU_MS),
      });
      await res.body?.cancel();
      if (res.ok) return { ok: true, keterangan: `${res.status}` };
      keterangan = `HTTP ${res.status}`;
    } catch (err) {
      keterangan = err instanceof Error ? err.message : String(err);
    }
  }
  return { ok: false, keterangan };
}

async function main() {
  const daftar = [
    ...informasiSeed.filter((i) => i.sumberUrl).map((i) => ({ judul: i.judul, url: i.sumberUrl as string })),
    { judul: "Riwayat otomatis", url: SUMBER_DETEKSI.url },
  ];
  const hasil = await Promise.all(daftar.map(async (d) => ({ ...d, ...(await cek(d.url)) })));
  for (const h of hasil) console.log(`${h.ok ? "✔" : "✘"} ${h.keterangan.padEnd(8)} ${h.judul}\n    ${h.url}`);
  const gagal = hasil.filter((h) => !h.ok).length;
  console.log(gagal ? `\n${gagal} tautan gagal dibuka.` : `\nSemua ${hasil.length} tautan bisa dibuka.`);
  if (gagal) process.exitCode = 1;
}

void main();
