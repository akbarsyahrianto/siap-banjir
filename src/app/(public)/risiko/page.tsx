import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Disclaimer } from "@/components/risiko/disclaimer";
import { PanelRisiko } from "@/components/risiko/panel-risiko";
import { Card, CardContent } from "@/components/ui/card";
import { PilihWilayah } from "@/components/wilayah/pilih-wilayah";
import { SkeletonRingkasan } from "@/components/wilayah/skeleton";
import { BelumPilihWilayah, DataCuacaTidakTersedia } from "@/components/wilayah/status-kosong";
import { keRisikoKlien, lihatKondisiWilayah, lihatPenanganan } from "@/server/services/pemantauan.service";
import { seriHujan48Jam } from "@/server/services/seri-cuaca";
import { kontakDaruratWilayah } from "@/server/services/wilayah.service";
import { muatPemilih } from "@/server/wilayah-terpilih";

export const metadata: Metadata = { title: "Detail Risiko" };

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

export default async function RisikoPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  const { pemilih, desa, namaTerpilih } = await muatPemilih(wilayah);
  const terpilih = desa?.wilayah.idWilayah ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Detail Risiko Banjir" description="Level risiko, persiapan dini, dan rekomendasi tindakan." />
      <Disclaimer />
      <Card>
        <CardContent>
          <PilihWilayah data={pemilih} namaTerpilih={namaTerpilih} />
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

/** Data awal dirender server; state machine di PanelRisiko mengambil alih di browser. */
async function DetailRisiko({ idWilayah }: { idWilayah: string }) {
  const kondisi = await lihatKondisiWilayah(idWilayah);
  if (!kondisi) return <BelumPilihWilayah />;
  const risiko = keRisikoKlien(kondisi);
  if (!risiko || !kondisi.cuaca) return <DataCuacaTidakTersedia />;

  // Level Risiko → Lihat Persiapan Dini → Lihat Rekomendasi (konten diwariskan dari leluhur).
  const penanganan = await lihatPenanganan(idWilayah, risiko.level);

  return (
    <PanelRisiko
      key={idWilayah}
      risiko={risiko}
      grafik={seriHujan48Jam(kondisi.cuaca.raw)}
      penanganan={penanganan}
      kontak={kontakDaruratWilayah(kondisi.leluhur)}
    />
  );
}
