import type { SumberData } from "@/lib/layanan-112";

/** Satu baris kontak darurat. telepon null = nomor belum tersedia dari sumber resmi. */
export type KontakDarurat = {
  /** "112" | "117" | "119" | "113" | "bpbd-kabkota" | "bpbd-provinsi" */
  id: string;
  nama: string;
  deskripsi: string;
  telepon: string | null;
  keterangan?: string;
  sumber?: SumberData;
};

/** Catatan saat layanan 112 kab/kota belum diluncurkan (D-042): tidak mengklaim 112 pasti tidak bisa dipakai. */
export type Catatan112 = { judul: string; isi: string };

export type NomorDarurat = {
  /** Nomor yang ditonjolkan (kartu merah besar). */
  utama: KontakDarurat;
  lainnya: KontakDarurat[];
  catatan112: Catatan112 | null;
};

/** "(0274) 555585" → "tel:0274555585". */
export const hrefTelepon = (telepon: string) => `tel:${telepon.replace(/[^\d+]/g, "")}`;

/**
 * Urutan halaman Nomor Darurat (D-050):
 * - 112 sudah diluncurkan di kab/kota (atau wilayah belum dipilih) → 112 utama, lalu BPBD, 117, 119, 113.
 * - 112 belum diluncurkan → BPBD pertama yang nomornya terverifikasi jadi utama (kab/kota, lalu provinsi);
 *   jika tidak ada, 112 tetap utama. 112 selalu tetap ada di daftar sebagai nomor nasional.
 */
export function susunNomorDarurat(
  kontak: KontakDarurat[],
  layanan112: { tersedia: boolean; namaKabKota: string } | null,
): NomorDarurat {
  const k112 = kontak.find((k) => k.id === "112");
  if (!k112) throw new Error("Kontak 112 wajib ada");
  const bpbd = kontak.filter((k) => k.id.startsWith("bpbd-"));
  const nasionalLain = kontak.filter((k) => k.id !== "112" && !k.id.startsWith("bpbd-"));

  if (!layanan112 || layanan112.tersedia) {
    return { utama: k112, lainnya: [...bpbd, ...nasionalLain], catatan112: null };
  }

  // Keterangan status 112 dipindah ke catatan di atas, agar tidak ditulis dua kali.
  const catatan112 = {
    judul: `Layanan 112 ${layanan112.namaKabKota} belum tercatat diluncurkan.`,
    isi: k112.keterangan ?? "Jika 112 tidak tersambung, hubungi nomor darurat lain di bawah.",
  };
  const k112TanpaKeterangan: KontakDarurat = { ...k112, keterangan: undefined };
  const bpbdUtama = bpbd.find((k) => k.telepon !== null);
  if (!bpbdUtama) {
    return { utama: k112TanpaKeterangan, lainnya: [...bpbd, ...nasionalLain], catatan112 };
  }
  return {
    utama: bpbdUtama,
    lainnya: [k112TanpaKeterangan, ...bpbd.filter((k) => k !== bpbdUtama), ...nasionalLain],
    catatan112,
  };
}
