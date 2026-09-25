import type { Metadata } from "next";
import { FaseMendatang } from "@/components/layout/fase-mendatang";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Informasi" };

export default function InformasiPage() {
  return (
    <div>
      <PageHeader title="Informasi" description="Artikel seputar banjir dan riwayat kejadian banjir." />
      <FaseMendatang fase={2} fitur={["Daftar artikel umum", "Riwayat kejadian banjir per wilayah"]} />
    </div>
  );
}
