import Link from "next/link";
import { CloudOff, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Wilayah belum dipilih. Di Beranda pemilih wilayah tampil di bawahnya; di halaman lain
 * (`keBeranda`) ada tombol ke Beranda, satu-satunya tempat memilih wilayah (D-063).
 */
export function BelumPilihWilayah({ keBeranda = false }: { keBeranda?: boolean }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <MapPin className="size-10 text-primary" aria-hidden="true" />
        <p className="text-lg font-semibold">Pilih wilayah terlebih dulu</p>
        <p className="max-w-sm text-muted-foreground">
          {keBeranda
            ? "Pilih desa/kelurahan Anda di Beranda untuk melihat cuaca dan level risiko banjir."
            : "Cari atau pilih desa/kelurahan Anda, atau gunakan lokasi Anda, untuk melihat cuaca dan level risiko banjir."}
        </p>
        {keBeranda ? (
          <Link
            href="/"
            className="mt-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-[15px] font-bold text-primary-foreground no-underline hover:bg-primary-hover"
          >
            Pilih wilayah di Beranda
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DataCuacaTidakTersedia() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <CloudOff className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-lg font-semibold">Data cuaca belum tersedia</p>
        <p className="max-w-sm text-muted-foreground">
          Open-Meteo sedang tidak dapat dihubungi dan belum ada data tersimpan untuk wilayah ini. Coba muat ulang
          beberapa saat lagi.
        </p>
      </CardContent>
    </Card>
  );
}
