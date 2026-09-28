import { Phone } from "lucide-react";
import { TautanSumber } from "@/components/informasi/tautan-sumber";
import type { KontakDarurat as Kontak } from "@/lib/kontak-darurat";

export function KontakDarurat({ kontak }: { kontak: Kontak[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {kontak.map((k) => (
        <li key={k.nama}>
          {k.telepon ? (
            <a
              href={`tel:${k.telepon.replace(/[^\d+]/g, "")}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-card-foreground hover:bg-[#f7f9fc]"
            >
              <span className="text-[15px] font-bold">{k.nama}</span>
              <span className="flex items-center gap-1.5 text-[18px] font-extrabold text-darurat tabular-nums">
                <Phone className="size-4" strokeWidth={2.2} aria-hidden="true" />
                {k.telepon}
              </span>
            </a>
          ) : (
            <div className="flex min-h-14 flex-col justify-center rounded-xl border px-3.5 py-2.5">
              <p className="text-[15px] font-bold">{k.nama}</p>
              <p className="text-[13px] text-muted-foreground">Nomor belum tersedia.</p>
            </div>
          )}
          {k.keterangan && <p className="mt-1.5 px-1 text-[14px] leading-normal">{k.keterangan}</p>}
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
