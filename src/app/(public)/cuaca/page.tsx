import { Suspense } from "react";
import type { Metadata } from "next";
import { Droplets, Thermometer, Umbrella } from "lucide-react";
import { GrafikPrakiraanJam } from "@/components/cuaca/grafik-prakiraan-jam";
import { KartuCuaca } from "@/components/cuaca/kartu-cuaca";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PilihWilayah } from "@/components/wilayah/pilih-wilayah";
import { SkeletonRingkasan } from "@/components/wilayah/skeleton";
import { BelumPilihWilayah, DataCuacaTidakTersedia } from "@/components/wilayah/status-kosong";
import { formatAngka, formatTanggalLokal } from "@/lib/format";
import { kategoriHujanHarian } from "@/lib/weather-code";
import { daftarWilayah } from "@/server/services/content.service";
import { lihatKondisiWilayah } from "@/server/services/pemantauan.service";
import { ringkasanHarian, seriPrakiraanPerJam } from "@/server/services/seri-cuaca";
import { idWilayahTerpilih } from "@/server/wilayah-terpilih";

export const metadata: Metadata = { title: "Prakiraan Cuaca" };

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

export default async function CuacaPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  const [daftar, idWilayah] = await Promise.all([daftarWilayah(), idWilayahTerpilih(wilayah)]);
  const terpilih = daftar.some((w) => w.idWilayah === idWilayah) ? idWilayah : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Prakiraan Cuaca" description="Prakiraan 3 hari per jam dan harian." />
      <Card>
        <CardContent>
          <PilihWilayah daftar={daftar} terpilih={terpilih} />
        </CardContent>
      </Card>
      {terpilih ? (
        <Suspense key={terpilih} fallback={<SkeletonRingkasan />}>
          <Prakiraan idWilayah={terpilih} />
        </Suspense>
      ) : (
        <BelumPilihWilayah />
      )}
    </div>
  );
}

async function Prakiraan({ idWilayah }: { idWilayah: string }) {
  const kondisi = await lihatKondisiWilayah(idWilayah);
  if (!kondisi) return <BelumPilihWilayah />;
  if (!kondisi.cuaca) return <DataCuacaTidakTersedia />;

  const { wilayah, cuaca } = kondisi;
  const harian = ringkasanHarian(cuaca.raw);

  return (
    <div className="space-y-6">
      <KartuCuaca dataCuaca={cuaca.dataCuaca} sumber={cuaca.sumber} namaWilayah={wilayah.namaWilayah} />

      <section aria-labelledby="judul-harian" className="space-y-3">
        <h2 id="judul-harian" className="text-xl font-bold">
          Prakiraan harian
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {harian.map((h, i) => (
            <li key={h.tanggal}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{i === 0 ? "Hari ini" : formatTanggalLokal(h.tanggal)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-lg font-semibold">{h.hujan != null ? kategoriHujanHarian(h.hujan) : "–"}</p>
                  <dl className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Umbrella className="size-4 text-primary" aria-hidden="true" />
                      <dt>Curah hujan:</dt>
                      <dd className="font-semibold">{h.hujan != null ? `${formatAngka(h.hujan)} mm` : "–"}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="size-4 text-primary" aria-hidden="true" />
                      <dt>Peluang hujan:</dt>
                      <dd className="font-semibold">{h.peluangMaks != null ? `${h.peluangMaks}%` : "–"}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="size-4 text-primary" aria-hidden="true" />
                      <dt>Suhu:</dt>
                      <dd className="font-semibold">
                        {h.suhuMin != null && h.suhuMaks != null
                          ? `${formatAngka(h.suhuMin)}–${formatAngka(h.suhuMaks)}°C`
                          : "–"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Prakiraan per jam</CardTitle>
        </CardHeader>
        <CardContent>
          <GrafikPrakiraanJam data={seriPrakiraanPerJam(cuaca.raw)} />
        </CardContent>
      </Card>
    </div>
  );
}
