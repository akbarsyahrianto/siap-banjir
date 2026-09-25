"use client";

import { useId, useState } from "react";
import { LoaderCircle, LocateFixed } from "lucide-react";
import { useNotifikasi } from "@/components/notifikasi/notifikasi-provider";
import { Button } from "@/components/ui/button";
import { useWilayah } from "@/hooks/useWilayah";
import { cariWilayahTerdekat } from "@/lib/geo";

export type OpsiWilayah = {
  idWilayah: string;
  namaWilayah: string;
  koordinatLatitude: number;
  koordinatLongitude: number;
};

type StatusGps = { tipe: "idle" } | { tipe: "mencari" } | { tipe: "info" | "galat"; pesan: string };

export function PilihWilayah({ daftar, terpilih }: { daftar: OpsiWilayah[]; terpilih: string | null }) {
  const { pilihWilayah: simpanPilihan } = useWilayah();
  const { setelahPilihWilayah } = useNotifikasi();
  const [gps, setGps] = useState<StatusGps>({ tipe: "idle" });
  const idSelect = useId();

  // aturLokasi(wilayah) → popup izin notifikasi / sinkron wilayah langganan.
  function pilihWilayah(idWilayah: string) {
    simpanPilihan(idWilayah);
    const wilayah = daftar.find((w) => w.idWilayah === idWilayah);
    if (wilayah) setelahPilihWilayah({ idWilayah, namaWilayah: wilayah.namaWilayah });
  }

  function pakaiLokasi() {
    if (!("geolocation" in navigator)) {
      setGps({ tipe: "galat", pesan: "Browser ini tidak mendukung lokasi GPS. Pilih wilayah dari daftar." });
      return;
    }
    setGps({ tipe: "mencari" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const hasil = cariWilayahTerdekat(coords.latitude, coords.longitude, daftar);
        if (!hasil) {
          setGps({ tipe: "galat", pesan: "Belum ada wilayah yang bisa dipilih." });
          return;
        }
        setGps({
          tipe: "info",
          pesan: `Wilayah terdekat: ${hasil.wilayah.namaWilayah} (±${Math.round(hasil.jarakKm)} km).`,
        });
        pilihWilayah(hasil.wilayah.idWilayah);
      },
      (err) => {
        setGps({
          tipe: "galat",
          pesan:
            err.code === err.PERMISSION_DENIED
              ? "Izin lokasi ditolak. Pilih wilayah dari daftar."
              : "Lokasi tidak dapat ditemukan. Pilih wilayah dari daftar.",
        });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={idSelect} className="block font-medium">
        Wilayah yang dipantau
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          id={idSelect}
          value={terpilih ?? ""}
          onChange={(e) => e.target.value && pilihWilayah(e.target.value)}
          className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-base shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <option value="" disabled>
            Pilih wilayah…
          </option>
          {daftar.map((w) => (
            <option key={w.idWilayah} value={w.idWilayah}>
              {w.namaWilayah}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" className="h-11" onClick={pakaiLokasi} disabled={gps.tipe === "mencari"}>
          {gps.tipe === "mencari" ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed aria-hidden="true" />
          )}
          Gunakan lokasi saya
        </Button>
      </div>
      <p aria-live="polite" className={gps.tipe === "galat" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
        {gps.tipe === "info" || gps.tipe === "galat" ? gps.pesan : null}
      </p>
    </div>
  );
}
