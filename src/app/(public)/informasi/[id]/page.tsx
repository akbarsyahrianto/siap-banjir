import type { Metadata } from "next";
import { FaseMendatang } from "@/components/layout/fase-mendatang";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Detail Informasi" };

export default async function InformasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return (
    <div>
      <PageHeader title="Detail Informasi" />
      <FaseMendatang fase={2} fitur={["Isi artikel atau riwayat kejadian"]} />
    </div>
  );
}
