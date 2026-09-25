"use client";

import Link from "next/link";
import { BellRing, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifikasi } from "./notifikasi-provider";

export function TombolAktifkanPeringatan({ wilayah }: { wilayah: { idWilayah: string; namaWilayah: string } | null }) {
  const { status, bukaDialogIzin } = useNotifikasi();

  if (status === "aktif") {
    return (
      <Button asChild size="lg" variant="outline">
        <Link href="/pengaturan">
          <CircleCheck className="text-risk-rendah" aria-hidden="true" />
          Peringatan aktif · Atur
        </Link>
      </Button>
    );
  }

  // Belum pilih wilayah, notifikasi dinonaktifkan, atau izin ditolak → atur di halaman Pengaturan.
  if (!wilayah || status === "nonaktif" || status === "ditolak") {
    return (
      <Button asChild size="lg">
        <Link href="/pengaturan">
          <BellRing aria-hidden="true" />
          Aktifkan Peringatan
        </Link>
      </Button>
    );
  }

  return (
    <Button size="lg" onClick={() => bukaDialogIzin(wilayah)} disabled={status === "memuat"}>
      <BellRing aria-hidden="true" />
      Aktifkan Peringatan
    </Button>
  );
}
