import type { Metadata } from "next";
import { Bell, MapPin, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PengaturanNotifikasi } from "@/components/notifikasi/pengaturan-notifikasi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PilihWilayah } from "@/components/wilayah/pilih-wilayah";
import { daftarWilayah } from "@/server/services/content.service";
import { idWilayahTerpilih } from "@/server/wilayah-terpilih";

export const metadata: Metadata = { title: "Pengaturan" };

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

export default async function PengaturanPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  const [daftar, idWilayah] = await Promise.all([daftarWilayah(), idWilayahTerpilih(wilayah)]);
  const terpilih = daftar.find((w) => w.idWilayah === idWilayah) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Atur wilayah pantauan dan notifikasi di perangkat ini." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="size-5 text-primary" aria-hidden="true" />
            Wilayah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PilihWilayah daftar={daftar} terpilih={terpilih?.idWilayah ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bell className="size-5 text-primary" aria-hidden="true" />
            Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PengaturanNotifikasi
            wilayah={terpilih ? { idWilayah: terpilih.idWilayah, namaWilayah: terpilih.namaWilayah } : null}
          />
        </CardContent>
      </Card>

      <p className="flex gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Siap Banjir tidak memakai akun dan tidak menyimpan nama atau nomor HP. Perangkat dikenali lewat token acak di
        browser ini dan langganan notifikasi push.
      </p>
    </div>
  );
}
