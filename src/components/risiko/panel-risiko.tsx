"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, CloudRain, LoaderCircle, Phone, RefreshCw, ShieldAlert } from "lucide-react";
import { AtribusiOpenMeteo } from "@/components/cuaca/atribusi-open-meteo";
import { GrafikHujan48Jam } from "@/components/cuaca/grafik-hujan-48jam";
import { StatusData } from "@/components/cuaca/status-data";
import { useNotifikasi } from "@/components/notifikasi/notifikasi-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRiskState } from "@/hooks/useRiskState";
import { LABEL_STATE, type TabPenanganan } from "@/lib/mesin-risiko";
import { LABEL_LEVEL } from "@/lib/risiko";
import type { PenangananKlien, RisikoKlien } from "@/lib/tipe-risiko";
import { cn } from "@/lib/utils";
import type { TitikGrafikJam } from "@/server/services/seri-cuaca";
import { BadgeRisiko } from "./badge-risiko";
import { BannerStatus } from "./banner-status";
import { DaftarParameter } from "./daftar-parameter";
import { GaugeRisiko } from "./gauge-risiko";
import { GAYA_LEVEL } from "./gaya-level";
import { KontakDarurat } from "./kontak-darurat";
import { PenangananTabs } from "./penanganan-tabs";

function Bagian({
  judul,
  ikon: Ikon,
  children,
  className,
}: {
  judul: string;
  ikon: typeof Activity;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
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

export function PanelRisiko({
  risiko,
  grafik: grafikAwal,
  penanganan: penangananAwal,
  kontak,
}: {
  risiko: RisikoKlien;
  grafik: TitikGrafikJam[];
  penanganan: PenangananKlien;
  kontak: { nama: string; telepon: string | null }[];
}) {
  const { ktx, kirim, grafik, penanganan, muatUlang, grafikSelesaiRender } = useRiskState({
    idWilayah: risiko.idWilayah,
    risiko,
    grafik: grafikAwal,
    penanganan: penangananAwal,
  });
  const { bukaDialogIzin } = useNotifikasi();
  const [tabLokal, setTabLokal] = useState<TabPenanganan>("checklist");
  const refPenanganan = useRef<HTMLHeadingElement>(null);

  const s = ktx.state;
  const data = s.data ?? risiko;
  const gaya = GAYA_LEVEL[data.level];
  const diPenanganan = s.nama === "penanganan";

  // Entry Detail Penanganan: arahkan pengguna ke checklist.
  useEffect(() => {
    if (!diPenanganan) return;
    refPenanganan.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    refPenanganan.current?.focus({ preventScroll: true });
  }, [diPenanganan]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Status pemantauan:</span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium">{LABEL_STATE[s.nama]}</span>
        </p>
        <Button variant="ghost" size="sm" onClick={() => void muatUlang()} disabled={ktx.memuat}>
          {ktx.memuat ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
          Perbarui
        </Button>
      </div>
      {ktx.galat ? (
        <p role="status" className="text-sm text-destructive">
          Gagal memperbarui: {ktx.galat}. Menampilkan data terakhir.
        </p>
      ) : null}

      <BannerStatus
        state={s}
        onTutup={() => kirim({ type: "TUTUP" })}
        onLanjutPantau={() => kirim({ type: "LANJUT_PANTAU" })}
        onAktifkanNotifikasi={() => bukaDialogIzin({ idWilayah: data.idWilayah, namaWilayah: data.namaWilayah })}
      />

      <Card className={cn("border-2", gaya.lembut)}>
        <CardContent className="grid items-center gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-muted-foreground">{data.namaWilayah}</p>
            <BadgeRisiko level={data.level} />
            <p className="text-lg font-semibold">{data.deskripsi}</p>
            <p>{gaya.pesan}</p>
            <StatusData sumber={data.sumberData} waktuAmbil={new Date(data.waktuAmbilData)} />
          </div>
          <GaugeRisiko skor={data.skorRisiko} level={data.level} />
        </CardContent>
      </Card>

      <Bagian judul="Curah hujan 48 jam" ikon={CloudRain}>
        <GrafikHujan48Jam
          data={grafik}
          onSelesaiRender={s.nama === "bahaya" && s.jalurGrafik === "menyiapkan-grafik" ? grafikSelesaiRender : undefined}
        />
        <div className="mt-3">
          <AtribusiOpenMeteo />
        </div>
      </Bagian>

      <Bagian judul="Parameter pemicu" ikon={Activity}>
        <DaftarParameter hasil={data.parameter} />
      </Bagian>

      <section
        id="penanganan"
        aria-labelledby="judul-penanganan"
        className={cn("scroll-mt-20 rounded-xl", diPenanganan && "ring-2 ring-primary ring-offset-4 ring-offset-background")}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <h2
                id="judul-penanganan"
                ref={refPenanganan}
                tabIndex={-1}
                className="flex items-center gap-2 text-xl outline-none"
              >
                <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
                Penanganan (risiko {LABEL_LEVEL[penanganan.level].toLowerCase()})
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PenangananTabs
              idWilayah={data.idWilayah}
              penanganan={penanganan}
              tab={diPenanganan ? s.tab : tabLokal}
              onPilihTab={(tab) => (diPenanganan ? kirim({ type: "PILIH_TAB", tab }) : setTabLokal(tab))}
            />
          </CardContent>
        </Card>
      </section>

      <Bagian judul="Kontak darurat" ikon={Phone}>
        <KontakDarurat kontak={kontak} />
      </Bagian>
    </div>
  );
}
