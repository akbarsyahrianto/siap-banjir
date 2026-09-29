import { Suspense } from "react";
import type { Metadata } from "next";
import { GrafikHujanPerJam } from "@/components/cuaca/grafik-hujan-per-jam";
import { KartuCuaca } from "@/components/cuaca/kartu-cuaca";
import { PrakiraanHarian } from "@/components/cuaca/prakiraan-harian";
import { StatusData } from "@/components/cuaca/status-data";
import { KepalaHalaman } from "@/components/layout/kepala-halaman";
import { PilihWilayah } from "@/components/wilayah/pilih-wilayah";
import { AutoRefresh } from "@/components/wilayah/auto-refresh";
import { SkeletonRingkasan } from "@/components/wilayah/skeleton";
import { TandaKontenWilayah } from "@/components/wilayah/tanda-konten-wilayah";
import { BelumPilihWilayah, DataCuacaTidakTersedia } from "@/components/wilayah/status-kosong";
import { lihatKondisiWilayah } from "@/server/services/pemantauan.service";
import { ringkasanHarian, seriPrakiraanPerJam } from "@/server/services/seri-cuaca";
import { muatPemilih } from "@/server/wilayah-terpilih";

export const metadata: Metadata = { title: "Prakiraan Cuaca" };

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

/**
 * Cuaca (desain ulang, D-052): judul + wilayah → cuaca terkini → prakiraan harian → curah hujan per jam.
 * Tanpa wilayah: pemilih wilayah.
 */
export default async function CuacaPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  const { pemilih, desa, namaTerpilih } = await muatPemilih(wilayah);
  const terpilih = desa?.wilayah.idWilayah ?? null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <KepalaHalaman
        judul="Prakiraan Cuaca"
        subjudul="Prakiraan 3 hari, harian dan per jam."
        namaWilayah={terpilih ? namaTerpilih : null}
      />
      {terpilih ? (
        <Suspense key={terpilih} fallback={<SkeletonRingkasan />}>
          <Prakiraan idWilayah={terpilih} />
          <AutoRefresh />
          <TandaKontenWilayah idWilayah={terpilih} />
        </Suspense>
      ) : (
        <>
          <BelumPilihWilayah />
          <section aria-label="Pilih wilayah" className="rounded-[20px] border bg-card p-4">
            <PilihWilayah data={pemilih} namaTerpilih={namaTerpilih} tungguKonten />
          </section>
        </>
      )}
    </div>
  );
}

async function Prakiraan({ idWilayah }: { idWilayah: string }) {
  const kondisi = await lihatKondisiWilayah(idWilayah);
  if (!kondisi) return <BelumPilihWilayah />;
  if (!kondisi.cuaca) return <DataCuacaTidakTersedia />;

  const { wilayah, cuaca } = kondisi;
  const dataLama = cuaca.sumber === "cadangan" || cuaca.sumber === "hemat-kuota";

  return (
    <>
      <KartuCuaca dataCuaca={cuaca.dataCuaca} koordinatPerkiraan={wilayah.koordinatPerkiraan} />
      {dataLama && <StatusData sumber={cuaca.sumber} waktuAmbil={cuaca.dataCuaca.waktuAmbil} />}
      <PrakiraanHarian harian={ringkasanHarian(cuaca.raw)} />
      <GrafikHujanPerJam titik={seriPrakiraanPerJam(cuaca.raw)} />
    </>
  );
}
