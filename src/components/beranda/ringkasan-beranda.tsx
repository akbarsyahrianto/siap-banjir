"use client";

import { useState } from "react";
import { StatusData } from "@/components/cuaca/status-data";
import { ambilDataWilayah, type CuacaTerkini } from "@/lib/ambil-data-wilayah";
import { formatJam } from "@/lib/format";
import { formatNilaiParameter } from "@/lib/risiko";
import type { RisikoKlien } from "@/lib/tipe-risiko";
import { KartuCuacaRingkas, TautanKontakDarurat } from "./kartu-ringkas";
import { KartuPeringatanDini } from "./kartu-peringatan-dini";
import { PanelLevel } from "./panel-level";
import { TombolPerbaruiData, type HasilPerbarui } from "./tombol-perbarui-data";

/**
 * Isi Beranda untuk wilayah terpilih. Data awal dirender server; tombol jam pembaruan mengambil ulang
 * lewat `ambilDataWilayah` (sama dengan tombol Perbarui di Risiko) dan menerapkannya ke state ini (D-055).
 */
export function RingkasanBeranda({
  awal,
  namaWilayah,
}: {
  awal: { risiko: RisikoKlien; terkini: Pick<CuacaTerkini, "suhu" | "kondisiCuaca"> };
  namaWilayah: string;
}) {
  const [data, setData] = useState(awal);
  const [memuat, setMemuat] = useState(false);
  const [hasil, setHasil] = useState<HasilPerbarui>(null);
  const { risiko, terkini } = data;
  const idWilayah = risiko.idWilayah;

  async function perbarui() {
    setMemuat(true);
    setHasil(null);
    try {
      const baru = await ambilDataWilayah(idWilayah);
      setData({ risiko: baru.risiko, terkini: baru.terkini });
      setHasil({ status: "selesai" });
    } catch (err) {
      setHasil({ status: "galat", pesan: err instanceof Error ? err.message : "Gagal memuat data" });
    } finally {
      setMemuat(false);
    }
  }

  const waktuData = new Date(risiko.waktuAmbilData);
  const hujan24 = risiko.parameter.find((p) => p.parameter === "hujan_24jam");
  const dataLama = risiko.sumberData === "cadangan" || risiko.sumberData === "hemat-kuota";

  return (
    <>
      <PanelLevel
        level={risiko.level}
        deskripsi={risiko.deskripsi}
        simulasi={risiko.simulasi}
        idWilayah={idWilayah}
        tombolPerbarui={
          <TombolPerbaruiData jam={formatJam(waktuData)} memuat={memuat} hasil={hasil} onPerbarui={() => void perbarui()} />
        }
      />
      {dataLama && <StatusData sumber={risiko.sumberData} waktuAmbil={waktuData} />}
      <div className="grid grid-cols-2 gap-3">
        <KartuCuacaRingkas
          suhu={terkini.suhu}
          kodeCuaca={terkini.kondisiCuaca}
          hujan24Jam={hujan24 ? { teks: formatNilaiParameter("hujan_24jam", hujan24.nilai), level: hujan24.level } : null}
        />
        <KartuPeringatanDini wilayah={{ idWilayah, namaWilayah }} />
      </div>
      <TautanKontakDarurat href={`/kontak?wilayah=${idWilayah}`} tinggi={risiko.level === "TINGGI"} />
    </>
  );
}
