import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { FaseMendatang } from "@/components/layout/fase-mendatang";
import { PageHeader } from "@/components/layout/page-header";
import { DISCLAIMER } from "@/lib/constants";

export const metadata: Metadata = { title: "Detail Risiko" };

export default function RisikoPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Detail Risiko Banjir" description="Level risiko, persiapan dini, dan rekomendasi tindakan." />

      <div role="note" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>{DISCLAIMER}</p>
      </div>

      <FaseMendatang
        fase={2}
        fitur={[
          "Gauge skor risiko dan parameter pemicu",
          "Checklist persiapan dini",
          "Rekomendasi tindakan",
          "Kontak darurat (112, BPBD setempat)",
        ]}
      />
    </div>
  );
}
