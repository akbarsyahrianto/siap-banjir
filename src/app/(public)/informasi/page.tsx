import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, History, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTanggal } from "@/lib/format";
import { lihatInformasi } from "@/server/services/content.service";
import { idWilayahTerpilih } from "@/server/wilayah-terpilih";

export const metadata: Metadata = { title: "Informasi" };

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

type ItemInformasi = Awaited<ReturnType<typeof lihatInformasi>>[number];

function DaftarInformasi({ items, kosong }: { items: ItemInformasi[]; kosong: string }) {
  if (items.length === 0) return <p className="text-muted-foreground">{kosong}</p>;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((i) => (
        <li key={i.idInformasi}>
          <Link href={`/informasi/${i.idInformasi}`} className="block h-full rounded-xl focus-visible:outline-2">
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle className="text-lg leading-snug">{i.judul}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{formatTanggal(i.tanggal)}</span>
                  {i.wilayah ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {i.wilayah.namaWilayah}
                    </span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-muted-foreground">{i.isi}</p>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function InformasiPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  const idWilayah = (await idWilayahTerpilih(wilayah)) ?? undefined;
  const [umum, riwayat] = await Promise.all([
    lihatInformasi({ kategori: "UMUM", idWilayah }),
    lihatInformasi({ kategori: "RIWAYAT_KEJADIAN", idWilayah }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Informasi" description="Artikel seputar banjir dan riwayat kejadian banjir." />

      <section aria-labelledby="judul-umum" className="space-y-3">
        <h2 id="judul-umum" className="flex items-center gap-2 text-xl font-bold">
          <BookOpen className="size-5 text-primary" aria-hidden="true" />
          Informasi umum
        </h2>
        <DaftarInformasi items={umum} kosong="Belum ada artikel." />
      </section>

      <section aria-labelledby="judul-riwayat" className="space-y-3">
        <h2 id="judul-riwayat" className="flex items-center gap-2 text-xl font-bold">
          <History className="size-5 text-primary" aria-hidden="true" />
          Riwayat kejadian banjir
        </h2>
        <DaftarInformasi items={riwayat} kosong="Belum ada riwayat kejadian." />
      </section>
    </div>
  );
}
