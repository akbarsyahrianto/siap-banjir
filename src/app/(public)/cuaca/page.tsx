import type { Metadata } from "next";
import { FaseMendatang } from "@/components/layout/fase-mendatang";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Prakiraan Cuaca" };

export default function CuacaPage() {
  return (
    <div>
      <PageHeader title="Prakiraan Cuaca" description="Prakiraan 3 hari per jam dan harian." />
      <FaseMendatang fase={2} fitur={["Grafik prakiraan per jam", "Ringkasan prakiraan harian 3 hari"]} />
    </div>
  );
}
