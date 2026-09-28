import { Suspense } from "react";
import { KartuPeringatanDini } from "@/components/beranda/kartu-peringatan-dini";
import { KartuCuacaRingkas, TautanKontakDarurat, WilayahDipantau } from "@/components/beranda/kartu-ringkas";
import { PanelLevel } from "@/components/beranda/panel-level";
import { StatusData } from "@/components/cuaca/status-data";
import { PilihWilayah } from "@/components/wilayah/pilih-wilayah";
import { AutoRefresh } from "@/components/wilayah/auto-refresh";
import { SkeletonRingkasan } from "@/components/wilayah/skeleton";
import { TandaKontenWilayah } from "@/components/wilayah/tanda-konten-wilayah";
import { BelumPilihWilayah, DataCuacaTidakTersedia } from "@/components/wilayah/status-kosong";
import { APP_NAME } from "@/lib/constants";
import { formatNilaiParameter } from "@/lib/risiko";
import { lihatKondisiWilayah } from "@/server/services/pemantauan.service";
import { muatPemilih } from "@/server/wilayah-terpilih";

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

/**
 * Beranda (desain ulang, D-046): wilayah dipantau → level risiko dengan ilustrasi air →
 * cuaca & peringatan dini → kontak darurat. Tanpa wilayah: pemilih wilayah langsung di sini.
 */
export default async function BerandaPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  // lihatInformasi(wilayah): pemilih wilayah + info cuaca awal (langkah 1 sequence diagram).
  const { pemilih, desa, namaTerpilih } = await muatPemilih(wilayah);
  const terpilih = desa?.wilayah.idWilayah ?? null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="sr-only">{APP_NAME}: Beranda</h1>

      {terpilih && namaTerpilih ? (
        <>
          <WilayahDipantau nama={namaTerpilih} />
          <Suspense key={terpilih} fallback={<SkeletonRingkasan />}>
            <RingkasanWilayah idWilayah={terpilih} namaWilayah={namaTerpilih} />
            <AutoRefresh />
            <TandaKontenWilayah idWilayah={terpilih} />
          </Suspense>
        </>
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

async function RingkasanWilayah({ idWilayah, namaWilayah }: { idWilayah: string; namaWilayah: string }) {
  const kondisi = await lihatKondisiWilayah(idWilayah);
  if (!kondisi) return <BelumPilihWilayah />;
  if (!kondisi.cuaca || !kondisi.risiko) return <DataCuacaTidakTersedia />;

  const { cuaca, risiko } = kondisi;
  const hujan24 = risiko.hasilPerParameter.find((p) => p.parameter === "hujan_24jam");
  const dataLama = cuaca.sumber === "cadangan" || cuaca.sumber === "hemat-kuota";

  return (
    <>
      <PanelLevel
        level={risiko.level}
        deskripsi={risiko.deskripsi}
        simulasi={risiko.simulasi}
        waktuData={cuaca.dataCuaca.waktuAmbil}
        idWilayah={idWilayah}
      />
      {dataLama && <StatusData sumber={cuaca.sumber} waktuAmbil={cuaca.dataCuaca.waktuAmbil} />}
      <div className="grid grid-cols-2 gap-3">
        <KartuCuacaRingkas
          suhu={cuaca.dataCuaca.suhu}
          kodeCuaca={cuaca.dataCuaca.kondisiCuaca}
          hujan24Jam={hujan24 ? { teks: formatNilaiParameter("hujan_24jam", hujan24.nilai), level: hujan24.level } : null}
        />
        <KartuPeringatanDini wilayah={{ idWilayah, namaWilayah }} />
      </div>
      <TautanKontakDarurat href={`/kontak?wilayah=${idWilayah}`} tinggi={risiko.level === "TINGGI"} />
    </>
  );
}
