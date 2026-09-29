import type { RisikoKlien } from "@/lib/tipe-risiko";
import type { TitikGrafikJam } from "@/server/services/seri-cuaca";

/** Bagian `terkini` dari GET /api/cuaca. */
export type CuacaTerkini = {
  suhu: number;
  kelembapan: number;
  curahHujan: number;
  kecepatanAngin: number;
  kondisiCuaca: number;
};

/** GET JSON `{ data }` dari API sendiri; galat membawa pesan `error` dari server. */
export async function ambilJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const pesan =
      json && typeof json === "object" && "error" in json && typeof json.error === "string"
        ? json.error
        : `HTTP ${res.status}`;
    throw new Error(pesan);
  }
  return (json as { data: T }).data;
}

/**
 * Ambil ulang risiko & cuaca satu wilayah dari API (server memastikan data Open-Meteo/cache segar).
 * Dipakai tombol "Perbarui" di Risiko (state machine) dan tombol jam pembaruan di Beranda (D-055).
 * Beranda tidak memakai `router.refresh()` untuk ini: di Next.js 15.5 refresh sering tidak di-commit (D-055).
 */
export async function ambilDataWilayah(idWilayah: string) {
  const q = encodeURIComponent(idWilayah);
  const [risiko, cuaca] = await Promise.all([
    ambilJson<RisikoKlien>(`/api/risiko?wilayah=${q}`),
    ambilJson<{ hujan48Jam: TitikGrafikJam[]; terkini: CuacaTerkini }>(`/api/cuaca?wilayah=${q}`),
  ]);
  return { risiko, hujan48Jam: cuaca.hujan48Jam, terkini: cuaca.terkini };
}
