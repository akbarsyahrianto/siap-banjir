import Link from "next/link";
import type { LevelRisiko } from "@prisma/client";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BadgeRisiko } from "./badge-risiko";
import { GAYA_LEVEL } from "./gaya-level";

export function KartuRingkasanRisiko({ risiko, idWilayah }: { risiko: LevelRisiko; idWilayah: string }) {
  const gaya = GAYA_LEVEL[risiko.level];
  return (
    <Card className={cn("border-2", gaya.lembut)}>
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground">Level risiko banjir</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BadgeRisiko level={risiko.level} />
        <p className="text-lg font-semibold">{risiko.deskripsi}</p>
        {risiko.level === "RENDAH" ? (
          <p className="flex items-start gap-2 text-muted-foreground">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            Informasi normal: {gaya.pesan}
          </p>
        ) : (
          <p className="font-medium">{gaya.pesan}</p>
        )}
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/risiko?wilayah=${idWilayah}`}>
            Lihat persiapan & rekomendasi
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
