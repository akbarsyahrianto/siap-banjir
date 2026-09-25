import { Phone } from "lucide-react";

type Kontak = { nama: string; telepon: string | null };

export function KontakDarurat({ kontak }: { kontak: Kontak[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {kontak.map((k) =>
        k.telepon ? (
          <li key={k.nama}>
            <a
              href={`tel:${k.telepon}`}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent"
            >
              <span className="font-medium">{k.nama}</span>
              <span className="flex items-center gap-1.5 text-lg font-bold text-primary">
                <Phone className="size-4" aria-hidden="true" />
                {k.telepon}
              </span>
            </a>
          </li>
        ) : (
          <li key={k.nama} className="rounded-lg border p-3">
            <p className="font-medium">{k.nama}</p>
            <p className="text-sm text-muted-foreground">
              Nomor belum tersedia di aplikasi. Hubungi 112 atau cek situs resmi pemerintah daerah.
            </p>
          </li>
        ),
      )}
    </ul>
  );
}
