import { Phone } from "lucide-react";
import { TautanSumber } from "@/components/informasi/tautan-sumber";
import type { KontakDarurat as Kontak } from "@/lib/kontak-darurat";

export function KontakDarurat({ kontak }: { kontak: Kontak[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {kontak.map((k) => (
        <li key={k.nama} className={k.keterangan ? "sm:col-span-2" : undefined}>
          {k.telepon ? (
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
          ) : (
            <div className="rounded-lg border p-3">
              <p className="font-medium">{k.nama}</p>
              <p className="text-sm text-muted-foreground">Nomor belum tersedia.</p>
            </div>
          )}
          {k.keterangan && <p className="mt-1.5 px-1 text-sm">{k.keterangan}</p>}
          {k.sumber && (
            <TautanSumber
              nama={`${k.sumber.nama}, ${k.sumber.keterangan}`}
              url={k.sumber.url}
              className="mt-0.5 px-1"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
