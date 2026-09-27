import Link from "next/link";
import { CircleCheck, ExternalLink, Waves } from "lucide-react";
import type { RekomendasiKlien } from "@/lib/tipe-risiko";

/** "BNPB, Buku Saku ..., hal. 36" → { dokumen: "BNPB, Buku Saku ...", halaman: "hal. 36" }. */
function pisahSumber(nama: string) {
  const i = nama.lastIndexOf(", hal. ");
  return i < 0 ? { dokumen: nama, halaman: null } : { dokumen: nama.slice(0, i), halaman: nama.slice(i + 2) };
}

function Daftar({ items }: { items: RekomendasiKlien[] }) {
  return (
    <ol className="space-y-3">
      {items.map((r) => {
        const sumber = r.sumberNama ? pisahSumber(r.sumberNama) : null;
        return (
          <li key={r.idRekomendasi} className="flex gap-3">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              {r.isiRekomendasi}
              {r.sumberUrl && sumber && (
                <a
                  href={r.sumberUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 inline-flex items-center gap-0.5 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  {sumber.halaman ?? "sumber"}
                  <ExternalLink className="size-3" aria-hidden="true" />
                  <span className="sr-only">
                    ({sumber.dokumen}, membuka tab baru)
                  </span>
                </a>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Detail Mitigasi: langkah siaga, lalu (level TINGGI) "Jika banjir terjadi", dengan halaman sumbernya. */
export function DaftarRekomendasi({ items }: { items: RekomendasiKlien[] }) {
  if (items.length === 0) return <p className="text-muted-foreground">Belum ada rekomendasi.</p>;
  const siaga = items.filter((r) => r.bagian !== "JIKA_BANJIR");
  const jikaBanjir = items.filter((r) => r.bagian === "JIKA_BANJIR");
  const dokumen = [...new Set(items.flatMap((r) => (r.sumberNama ? [pisahSumber(r.sumberNama).dokumen] : [])))];

  return (
    <div className="space-y-5">
      {siaga.length > 0 && <Daftar items={siaga} />}
      {jikaBanjir.length > 0 && (
        <section aria-labelledby="judul-jika-banjir" className="space-y-3 rounded-lg border p-4">
          <h3 id="judul-jika-banjir" className="flex items-center gap-2 font-semibold">
            <Waves className="size-5 text-primary" aria-hidden="true" />
            Jika banjir terjadi
          </h3>
          <Daftar items={jikaBanjir} />
          <p className="text-sm">
            Langkah setelah banjir surut ada di{" "}
            <Link href="/informasi" className="font-medium text-primary underline underline-offset-2 hover:no-underline">
              halaman Informasi
            </Link>
            .
          </p>
        </section>
      )}
      {dokumen.length > 0 && <p className="text-sm text-muted-foreground">Sumber: {dokumen.join("; ")}.</p>}
    </div>
  );
}
