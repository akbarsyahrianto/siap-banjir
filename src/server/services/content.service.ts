/**
 * Konten: Wilayah, AmbangRisiko, Informasi, PersiapanDini, Rekomendasi.
 *
 * Fungsi baca (lihat*) dipakai halaman & API publik (GET).
 * Operasi tambah/ubah/hapus dari class diagram TIDAK diekspos sebagai halaman atau
 * API publik; hanya dipakai oleh prisma/seed.ts.
 */
import type { KategoriInformasi, TingkatRisiko } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db";
import {
  kontakDaruratSchema,
  ambangRisikoBaseSchema,
  ambangRisikoInputSchema,
  informasiInputSchema,
  persiapanDiniInputSchema,
  rekomendasiInputSchema,
  wilayahInputSchema,
  type AmbangRisikoInput,
  type InformasiInput,
  type PersiapanDiniInput,
  type RekomendasiInput,
  type WilayahInput,
} from "@/server/validators/konten";

// ---------- Baca ----------

// Konten khusus wilayah ditampilkan lebih dulu, lalu konten global (idWilayah null).
const khususDulu = { idWilayah: { sort: "asc", nulls: "last" } } as const;

export async function daftarWilayah() {
  return db.wilayah.findMany({
    orderBy: { namaWilayah: "asc" },
    select: { idWilayah: true, namaWilayah: true, koordinatLatitude: true, koordinatLongitude: true },
  });
}

export async function lihatWilayah(idWilayah: string) {
  return db.wilayah.findUnique({ where: { idWilayah } });
}

export function bacaKontakDarurat(json: unknown) {
  const hasil = z.array(kontakDaruratSchema).safeParse(json);
  return hasil.success ? hasil.data : [];
}

export async function lihatPersiapan(levelRisiko: TingkatRisiko, idWilayah?: string) {
  return db.persiapanDini.findMany({
    where: { levelRisiko, OR: [{ idWilayah: null }, ...(idWilayah ? [{ idWilayah }] : [])] },
    orderBy: [khususDulu, { urutan: "asc" }],
  });
}

export async function lihatRekomendasi(levelRisiko: TingkatRisiko, idWilayah?: string) {
  return db.rekomendasi.findMany({
    where: { levelRisiko, OR: [{ idWilayah: null }, ...(idWilayah ? [{ idWilayah }] : [])] },
    orderBy: [khususDulu, { urutan: "asc" }],
  });
}

/**
 * lihatInformasi(wilayah): artikel umum (global + khusus wilayah) atau riwayat kejadian.
 * Riwayat kejadian ditampilkan untuk semua wilayah; wilayah terpilih lebih dulu.
 */
export async function lihatInformasi(opsi: { kategori?: KategoriInformasi; idWilayah?: string } = {}) {
  const daftar = await db.informasi.findMany({
    where: opsi.kategori ? { kategori: opsi.kategori } : undefined,
    orderBy: { tanggal: "desc" },
    include: { wilayah: { select: { idWilayah: true, namaWilayah: true } } },
  });
  if (!opsi.idWilayah) return daftar;
  const milikWilayah = (i: (typeof daftar)[number]) => (i.idWilayah === opsi.idWilayah ? 0 : 1);
  return [...daftar].sort((a, b) => milikWilayah(a) - milikWilayah(b));
}

export async function lihatDetailInformasi(idInformasi: string) {
  return db.informasi.findUnique({
    where: { idInformasi },
    include: { wilayah: { select: { idWilayah: true, namaWilayah: true } } },
  });
}

// ---------- Wilayah ----------

export async function tambahWilayah(input: WilayahInput) {
  const data = wilayahInputSchema.parse(input);
  return db.wilayah.create({ data });
}

export async function ubahWilayah(idWilayah: string, input: Partial<Omit<WilayahInput, "idWilayah">>) {
  const data = wilayahInputSchema.omit({ idWilayah: true }).partial().parse(input);
  return db.wilayah.update({ where: { idWilayah }, data });
}

export async function hapusWilayah(idWilayah: string) {
  return db.wilayah.delete({ where: { idWilayah } });
}

// ---------- AmbangRisiko ----------

export async function tambahAmbang(input: AmbangRisikoInput) {
  const data = ambangRisikoInputSchema.parse(input);
  return db.ambangRisiko.create({ data });
}

export async function ubahAmbang(idAmbang: string, input: Partial<AmbangRisikoInput>) {
  const lama = await db.ambangRisiko.findUniqueOrThrow({ where: { idAmbang } });
  const perubahan = ambangRisikoBaseSchema.partial().parse(input);
  // Validasi ulang gabungan data lama + baru agar rentang tetap konsisten.
  const data = ambangRisikoInputSchema.parse({ ...lama, ...perubahan });
  return db.ambangRisiko.update({ where: { idAmbang }, data });
}

export async function hapusAmbang(idAmbang: string) {
  return db.ambangRisiko.delete({ where: { idAmbang } });
}

// ---------- Informasi ----------

export async function tambahInformasi(input: InformasiInput) {
  const data = informasiInputSchema.parse(input);
  return db.informasi.create({ data });
}

export async function ubahInformasi(idInformasi: string, input: Partial<InformasiInput>) {
  const data = informasiInputSchema.partial().parse(input);
  return db.informasi.update({ where: { idInformasi }, data });
}

export async function hapusInformasi(idInformasi: string) {
  return db.informasi.delete({ where: { idInformasi } });
}

// ---------- PersiapanDini ----------

export async function tambahPersiapan(input: PersiapanDiniInput) {
  const data = persiapanDiniInputSchema.parse(input);
  return db.persiapanDini.create({ data });
}

export async function ubahPersiapan(idPersiapan: string, input: Partial<PersiapanDiniInput>) {
  const data = persiapanDiniInputSchema.partial().parse(input);
  return db.persiapanDini.update({ where: { idPersiapan }, data });
}

export async function hapusPersiapan(idPersiapan: string) {
  return db.persiapanDini.delete({ where: { idPersiapan } });
}

// ---------- Rekomendasi ----------

export async function tambahRekomendasi(input: RekomendasiInput) {
  const data = rekomendasiInputSchema.parse(input);
  return db.rekomendasi.create({ data });
}

export async function ubahRekomendasi(idRekomendasi: string, input: Partial<RekomendasiInput>) {
  const data = rekomendasiInputSchema.partial().parse(input);
  return db.rekomendasi.update({ where: { idRekomendasi }, data });
}

export async function hapusRekomendasi(idRekomendasi: string) {
  return db.rekomendasi.delete({ where: { idRekomendasi } });
}
