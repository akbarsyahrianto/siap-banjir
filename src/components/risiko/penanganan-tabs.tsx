"use client";

import { ClipboardCheck, ListChecks } from "lucide-react";
import type { TabPenanganan } from "@/lib/mesin-risiko";
import type { PenangananKlien } from "@/lib/tipe-risiko";
import { cn } from "@/lib/utils";
import { ChecklistPersiapan } from "./checklist-persiapan";
import { DaftarRekomendasi } from "./daftar-rekomendasi";

const TAB: { id: TabPenanganan; label: string; ikon: typeof ListChecks }[] = [
  { id: "checklist", label: "Checklist Siaga", ikon: ListChecks },
  { id: "mitigasi", label: "Detail Mitigasi", ikon: ClipboardCheck },
];

/** Sub-state Detail Penanganan: Checklist Siaga (persiapan dini) | Detail Mitigasi (rekomendasi). */
export function PenangananTabs({
  idWilayah,
  penanganan,
  tab,
  onPilihTab,
}: {
  idWilayah: string;
  penanganan: PenangananKlien;
  tab: TabPenanganan;
  onPilihTab: (tab: TabPenanganan) => void;
}) {
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Detail penanganan" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {TAB.map(({ id, label, ikon: Ikon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => onPilihTab(id)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-md px-3 font-medium transition-colors",
              tab === id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Ikon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === "checklist" ? (
        <div role="tabpanel" id="panel-checklist" aria-labelledby="tab-checklist">
          <ChecklistPersiapan kunci={`${idWilayah}:${penanganan.level}`} items={penanganan.persiapan} />
        </div>
      ) : (
        <div role="tabpanel" id="panel-mitigasi" aria-labelledby="tab-mitigasi">
          <DaftarRekomendasi items={penanganan.rekomendasi} />
        </div>
      )}
    </div>
  );
}
