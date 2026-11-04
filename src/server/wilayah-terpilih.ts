import { cookies } from "next/headers";
import { KUNCI_WILAYAH } from "@/lib/wilayah-preferensi";
import { dataPemilih, lihatDesa, namaTampilan } from "@/server/services/wilayah.service";
import { queryWilayahSchema } from "@/server/validators/risiko";

/**
 * Tentukan wilayah yang ditampilkan: query ?wilayah= (deep link notifikasi) lebih dulu,
 * lalu cookie preferensi perangkat. Hanya mengembalikan kode yang formatnya valid.
 */
export async function idWilayahTerpilih(query: string | string[] | undefined): Promise<string | null> {
  const kandidat = [typeof query === "string" ? query : undefined, (await cookies()).get(KUNCI_WILAYAH)?.value];
  for (const k of kandidat) {
    const hasil = queryWilayahSchema.safeParse({ wilayah: k });
    if (hasil.success) return hasil.data.wilayah;
  }
  return null;
}

/**
 * Wilayah terpilih untuk halaman tanpa pemilih wilayah (Risiko, Cuaca, Pengaturan; D-063).
 * `desa` terisi hanya jika kode terpilih adalah desa/kelurahan aktif.
 */
export async function muatWilayahTerpilih(query: string | string[] | undefined) {
  const id = await idWilayahTerpilih(query);
  const desa = id ? await lihatDesa(id) : null;
  return { id, desa, namaTerpilih: desa ? namaTampilan(desa.leluhur) : null };
}

/**
 * Data untuk Beranda, satu-satunya halaman dengan pemilih wilayah (D-063). `desa` terisi hanya jika
 * kode terpilih adalah desa/kelurahan aktif; kode tingkat lebih tinggi (mis. dari tautan) hanya mengisi pemilih.
 */
export async function muatPemilih(query: string | string[] | undefined) {
  const { id, desa, namaTerpilih } = await muatWilayahTerpilih(query);
  const pemilih = await dataPemilih(desa ? desa.wilayah.idWilayah : id);
  return { pemilih, desa, namaTerpilih };
}
