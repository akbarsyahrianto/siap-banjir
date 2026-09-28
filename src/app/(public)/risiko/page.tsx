import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Disclaimer } from "@/components/risiko/disclaimer";
import { PanelRisiko } from "@/components/risiko/panel-risiko";
import { PilihWilayah } from "@/components/wilayah/pilih-wilayah";
import { SkeletonRingkasan } from "@/components/wilayah/skeleton";
import { BelumPilihWilayah, DataCuacaTidakTersedia } from "@/components/wilayah/status-kosong";
import { keRisikoKlien, lihatKondisiWilayah, lihatPenanganan } from "@/server/services/pemantauan.service";
import { seriHujan48Jam } from "@/server/services/seri-cuaca";
import { kontakDaruratWilayah } from "@/server/services/wilayah.service";
import { muatPemilih } from "@/server/wilayah-terpilih";

export const metadata: Metadata = { title: "Risiko Banjir" };

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

/**
 * Risiko (desain ulang, D-047): judul + wilayah → disclaimer → status pemantauan → kartu level →
 * arti level → parameter → (grafik saat Bahaya) → penanganan → kontak. Tanpa wilayah: pemilih wilayah.
 */
export default async function RisikoPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  const { pemilih, desa, namaTerpilih } = await muatPemilih(wilayah);
  const terpilih = desa?.wilayah.idWilayah ?? null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <header className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em]">Risiko Banjir</h1>
          <p className="text-[15px] leading-[1.45] text-[#3e4a5c]">Level risiko, persiapan dini, dan rekomendasi tindakan.</p>
        </div>
        {terpilih && namaTerpilih ? (
          <p className="flex items-center gap-2.5">
            <MapPin className="size-5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
            <span className="text-[15px] font-bold">{namaTerpilih}</span>
            <Link
              href="/pengaturan"
              className="ml-auto inline-flex min-h-11 shrink-0 items-center text-[14px] font-bold text-primary hover:text-primary-hover"
            >
              Ubah<span className="sr-only"> wilayah</span>
            </Link>
          </p>
        ) : null}
      </header>
      <Disclaimer />
      {terpilih ? (
        <Suspense key={terpilih} fallback={<SkeletonRingkasan />}>
          <DetailRisiko idWilayah={terpilih} />
        </Suspense>
      ) : (
        <>
          <BelumPilihWilayah />
          <section aria-label="Pilih wilayah" className="rounded-[20px] border bg-card p-4">
            <PilihWilayah data={pemilih} namaTerpilih={namaTerpilih} />
          </section>
        </>
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
