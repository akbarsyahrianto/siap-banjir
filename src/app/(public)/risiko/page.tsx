import { Suspense } from "react";
import type { Metadata } from "next";
import { ClipboardCheck, ListChecks, Phone, Activity } from "lucide-react";
import { StatusData } from "@/components/cuaca/status-data";
import { AtribusiOpenMeteo } from "@/components/cuaca/atribusi-open-meteo";
import { PageHeader } from "@/components/layout/page-header";
import { BadgeRisiko } from "@/components/risiko/badge-risiko";
import { ChecklistPersiapan } from "@/components/risiko/checklist-persiapan";
import { DaftarParameter } from "@/components/risiko/daftar-parameter";
import { DaftarRekomendasi } from "@/components/risiko/daftar-rekomendasi";
import { Disclaimer } from "@/components/risiko/disclaimer";
import { GaugeRisiko } from "@/components/risiko/gauge-risiko";
import { GAYA_LEVEL } from "@/components/risiko/gaya-level";
import { KontakDarurat } from "@/components/risiko/kontak-darurat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PilihWilayah } from "@/components/wilayah/pilih-wilayah";
import { SkeletonRingkasan } from "@/components/wilayah/skeleton";
import { BelumPilihWilayah, DataCuacaTidakTersedia } from "@/components/wilayah/status-kosong";
import { LABEL_LEVEL } from "@/lib/risiko";
import { cn } from "@/lib/utils";
import { bacaKontakDarurat, daftarWilayah } from "@/server/services/content.service";
import { lihatKondisiWilayah, lihatPenanganan } from "@/server/services/pemantauan.service";
import { idWilayahTerpilih } from "@/server/wilayah-terpilih";

export const metadata: Metadata = { title: "Detail Risiko" };

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

export default async function RisikoPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  const [daftar, idWilayah] = await Promise.all([daftarWilayah(), idWilayahTerpilih(wilayah)]);
  const terpilih = daftar.some((w) => w.idWilayah === idWilayah) ? idWilayah : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Detail Risiko Banjir" description="Level risiko, persiapan dini, dan rekomendasi tindakan." />
      <Disclaimer />
      <Card>
        <CardContent>
          <PilihWilayah daftar={daftar} terpilih={terpilih} />
        </CardContent>
      </Card>
      {terpilih ? (
        <Suspense key={terpilih} fallback={<SkeletonRingkasan />}>
          <DetailRisiko idWilayah={terpilih} />
        </Suspense>
      ) : (
        <BelumPilihWilayah />
      )}
    </div>
  );
}

function Bagian({
  id,
  judul,
  ikon: Ikon,
  children,
}: {
  id: string;
  judul: string;
  ikon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Ikon className="size-5 text-primary" aria-hidden="true" />
          {judul}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

async function DetailRisiko({ idWilayah }: { idWilayah: string }) {
  const kondisi = await lihatKondisiWilayah(idWilayah);
  if (!kondisi) return <BelumPilihWilayah />;
  if (!kondisi.cuaca || !kondisi.risiko) return <DataCuacaTidakTersedia />;

  const { wilayah, cuaca, risiko } = kondisi;
  // Level Risiko → Lihat Persiapan Dini → Lihat Rekomendasi.
  const { persiapan, rekomendasi } = await lihatPenanganan(wilayah.idWilayah, risiko.level);
  const gaya = GAYA_LEVEL[risiko.level];

  return (
    <div className="space-y-6">
      <Card className={cn("border-2", gaya.lembut)}>
        <CardContent className="grid items-center gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-muted-foreground">{wilayah.namaWilayah}</p>
            <BadgeRisiko level={risiko.level} />
            <p className="text-lg font-semibold">{risiko.deskripsi}</p>
            <p>{gaya.pesan}</p>
            <StatusData sumber={cuaca.sumber} waktuAmbil={cuaca.dataCuaca.waktuAmbil} />
          </div>
          <GaugeRisiko skor={risiko.skorRisiko} level={risiko.level} />
        </CardContent>
      </Card>

      <Bagian id="parameter" judul="Parameter pemicu" ikon={Activity}>
        <DaftarParameter hasil={risiko.hasilPerParameter} />
        <div className="mt-3">
          <AtribusiOpenMeteo />
        </div>
      </Bagian>

      <Bagian id="persiapan" judul={`Persiapan dini (risiko ${LABEL_LEVEL[risiko.level].toLowerCase()})`} ikon={ListChecks}>
        <ChecklistPersiapan
          kunci={`${wilayah.idWilayah}:${risiko.level}`}
          items={persiapan.map(({ idPersiapan, isiPersiapan }) => ({ idPersiapan, isiPersiapan }))}
        />
      </Bagian>

      <Bagian id="rekomendasi" judul="Rekomendasi tindakan" ikon={ClipboardCheck}>
        <DaftarRekomendasi items={rekomendasi} />
      </Bagian>

      <Bagian id="kontak" judul="Kontak darurat" ikon={Phone}>
        <KontakDarurat kontak={bacaKontakDarurat(wilayah.kontakDarurat)} />
      </Bagian>
    </div>
  );
}
