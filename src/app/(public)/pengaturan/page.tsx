import type { Metadata } from "next";
import { FaseMendatang } from "@/components/layout/fase-mendatang";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Pengaturan" };

export default function PengaturanPage() {
  return (
    <div>
      <PageHeader title="Pengaturan" description="Atur wilayah pantauan dan notifikasi." />
      <FaseMendatang
        fase={3}
        fitur={[
          "Pilih wilayah (daftar atau lokasi GPS)",
          "Aktif/nonaktif notifikasi dan level minimum",
          "Kirim notifikasi uji",
        ]}
      />
    </div>
  );
}
