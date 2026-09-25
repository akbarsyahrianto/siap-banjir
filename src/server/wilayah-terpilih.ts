import { cookies } from "next/headers";
import { KUNCI_WILAYAH } from "@/lib/wilayah-preferensi";
import { queryWilayahSchema } from "@/server/validators/risiko";

/**
 * Tentukan wilayah yang ditampilkan: query ?wilayah= (deep link notifikasi) lebih dulu,
 * lalu cookie preferensi perangkat. Hanya mengembalikan id yang formatnya valid.
 */
export async function idWilayahTerpilih(query: string | string[] | undefined): Promise<string | null> {
  const kandidat = [typeof query === "string" ? query : undefined, (await cookies()).get(KUNCI_WILAYAH)?.value];
  for (const k of kandidat) {
    const hasil = queryWilayahSchema.safeParse({ wilayah: k });
    if (hasil.success) return hasil.data.wilayah;
  }
  return null;
}
