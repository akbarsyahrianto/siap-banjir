import { Suspense } from "react";
import { GrafikHujan48Jam } from "@/components/cuaca/grafik-hujan-48jam";
import { KartuCuaca } from "@/components/cuaca/kartu-cuaca";
import { TombolAktifkanPeringatan } from "@/components/notifikasi/tombol-aktifkan-peringatan";
import { KartuRingkasanRisiko } from "@/components/risiko/kartu-ringkasan-risiko";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PilihWilayah } from "@/components/wilayah/pilih-wilayah";
import { BelumPilihWilayah, DataCuacaTidakTersedia } from "@/components/wilayah/status-kosong";
import { AutoRefresh } from "@/components/wilayah/auto-refresh";
import { SkeletonRingkasan } from "@/components/wilayah/skeleton";
import { APP_TAGLINE } from "@/lib/constants";
import { lihatKondisiWilayah } from "@/server/services/pemantauan.service";
import { seriHujan48Jam } from "@/server/services/seri-cuaca";
import { namaTampilan } from "@/server/services/wilayah.service";
import { muatPemilih } from "@/server/wilayah-terpilih";

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

export default async function BerandaPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  // lihatInformasi(wilayah): pemilih wilayah + info cuaca awal (langkah 1 sequence diagram).
  const { pemilih, desa, namaTerpilih } = await muatPemilih(wilayah);
  const terpilih = desa?.wilayah.idWilayah ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-primary px-5 py-6 text-primary-foreground">
        <h1 className="text-3xl font-bold tracking-tight">Siap Banjir</h1>
        <p className="mt-1 text-lg opacity-90">{APP_TAGLINE}.</p>
      </section>

      <Card>
        <CardContent>
          <PilihWilayah data={pemilih} namaTerpilih={namaTerpilih} />
        </CardContent>
      </Card>

      {terpilih ? (
        <Suspense key={terpilih} fallback={<SkeletonRingkasan />}>
          <RingkasanWilayah idWilayah={terpilih} />
          <AutoRefresh />
        </Suspense>
      ) : (
        <BelumPilihWilayah />
      )}

      <Card>
        <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold">Dapatkan peringatan dini</p>
            <p className="text-muted-foreground">Terima notifikasi saat risiko banjir Sedang atau Tinggi.</p>
          </div>
          <TombolAktifkanPeringatan wilayah={terpilih && namaTerpilih ? { idWilayah: terpilih, namaWilayah: namaTerpilih } : null} />
        </CardContent>
      </Card>
    </div>
  );
}

async function RingkasanWilayah({ idWilayah }: { idWilayah: string }) {
  const kondisi = await lihatKondisiWilayah(idWilayah);
  if (!kondisi) return <BelumPilihWilayah />;
  if (!kondisi.cuaca || !kondisi.risiko) return <DataCuacaTidakTersedia />;

  const { wilayah, leluhur, cuaca, risiko } = kondisi;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <KartuRingkasanRisiko risiko={risiko} idWilayah={wilayah.idWilayah} />
        <KartuCuaca
          dataCuaca={cuaca.dataCuaca}
          sumber={cuaca.sumber}
          namaWilayah={namaTampilan(leluhur)}
          koordinatPerkiraan={wilayah.koordinatPerkiraan}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Curah hujan 48 jam</CardTitle>
        </CardHeader>
        <CardContent>
          <GrafikHujan48Jam data={seriHujan48Jam(cuaca.raw)} />
        </CardContent>
      </Card>
    </div>
  );
}
