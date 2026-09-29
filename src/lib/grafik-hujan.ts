/**
 * Data grafik batang "Curah hujan per jam" di halaman Cuaca (D-052). Fungsi murni.
 * Waktu Open-Meteo sudah lokal ("2026-09-26T14:00"), jadi tanggal diformat dengan zona UTC.
 */
import { formatAngka } from "@/lib/format";

export type TitikHujan = { waktu: string; hujan: number | null };

export type GrafikHujanPerJam = {
  /** Tinggi batang dalam persen dari tinggi grafik. */
  batang: { waktu: string; hujan: number; persen: number }[];
  /** Label sumbu Y dari atas ke bawah, mis. ["1,5", "1,0", "0,5", "0 mm"]. */
  sumbuY: string[];
  /** Pembagian sumbu X per tanggal; `jam` = jumlah batang pada tanggal itu. */
  hari: { tanggal: string; label: string; jam: number }[];
  /** Ringkasan untuk pembaca layar (grafik ber-role img). */
  ringkasan: string;
  /** "14.00" — jam batang pertama. */
  jamMulai: string;
};

/** Jumlah selang di sumbu Y (garis bantu tiap sepertiga tinggi, seperti board). */
const SELANG = 3;
const LANGKAH = [0.5, 1, 2, 5, 10, 20, 50, 100];

function langkahSkala(maks: number) {
  return LANGKAH.find((l) => l * SELANG >= maks) ?? Math.ceil(maks / SELANG / 50) * 50;
}

function tanggalUtc(tanggal: string) {
  const [y, m, d] = tanggal.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
}

const format = (tanggal: string, opsi: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", ...opsi }).format(tanggalUtc(tanggal));

/** "Sab 26" */
const labelHari = (tanggal: string) => `${format(tanggal, { weekday: "short" })} ${Number(tanggal.slice(8, 10))}`;
/** "Sabtu 26" */
const hariPanjang = (tanggal: string) => `${format(tanggal, { weekday: "long" })} ${Number(tanggal.slice(8, 10))}`;
const bulan = (tanggal: string) => format(tanggal, { month: "long" });
const jamTitik = (waktu: string) => waktu.slice(11, 16).replace(":", ".");

export function grafikHujanPerJam(titik: TitikHujan[]): GrafikHujanPerJam | null {
  const awal = titik[0];
  const akhir = titik.at(-1);
  if (!awal || !akhir) return null;

  const nilai = titik.map((t) => Math.max(t.hujan ?? 0, 0));
  const maks = Math.max(...nilai);
  const langkah = langkahSkala(maks);
  const skala = langkah * SELANG;
  const digit = langkah < 1 ? 1 : 0;

  const hari: GrafikHujanPerJam["hari"] = [];
  for (const t of titik) {
    const tanggal = t.waktu.slice(0, 10);
    const terakhir = hari.at(-1);
    if (terakhir?.tanggal === tanggal) terakhir.jam++;
    else hari.push({ tanggal, label: labelHari(tanggal), jam: 1 });
  }

  const tA = awal.waktu.slice(0, 10);
  const tZ = akhir.waktu.slice(0, 10);
  const rentang =
    tA === tZ
      ? `${hariPanjang(tA)} ${bulan(tA)}`
      : `${hariPanjang(tA)}${bulan(tA) === bulan(tZ) ? "" : ` ${bulan(tA)}`} hingga ${hariPanjang(tZ)} ${bulan(tZ)}`;
  const iMaks = nilai.indexOf(maks);
  const puncak = titik[iMaks];
  const ringkasan =
    `Grafik curah hujan per jam, ${rentang}. ` +
    (maks > 0 && puncak
      ? `Tertinggi ${formatAngka(maks)} mm pada ${format(puncak.waktu.slice(0, 10), { weekday: "long" })} pukul ${jamTitik(puncak.waktu)}.`
      : "Tidak ada hujan yang diprakirakan.");

  return {
    batang: titik.map((t, i) => ({ waktu: t.waktu, hujan: nilai[i] ?? 0, persen: ((nilai[i] ?? 0) / skala) * 100 })),
    sumbuY: Array.from({ length: SELANG + 1 }, (_, i) => {
      const v = (SELANG - i) * langkah;
      return v === 0 ? "0 mm" : v.toLocaleString("id-ID", { minimumFractionDigits: digit, maximumFractionDigits: digit });
    }),
    hari,
    ringkasan,
    jamMulai: jamTitik(awal.waktu),
  };
}
