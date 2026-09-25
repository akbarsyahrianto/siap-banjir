import Link from "next/link";
import { BellRing, MapPin } from "lucide-react";
import { FaseMendatang } from "@/components/layout/fase-mendatang";
import { Button } from "@/components/ui/button";
import { APP_TAGLINE } from "@/lib/constants";

export default function BerandaPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-primary px-6 py-8 text-primary-foreground">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Siap Banjir</h1>
        <p className="mt-2 max-w-prose text-lg opacity-90">{APP_TAGLINE}.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link href="/pengaturan">
              <MapPin aria-hidden="true" />
              Pilih Wilayah
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <Link href="/pengaturan">
              <BellRing aria-hidden="true" />
              Aktifkan Peringatan
            </Link>
          </Button>
        </div>
      </section>

      <FaseMendatang
        fase={2}
        fitur={[
          "Pilihan wilayah dan kartu cuaca terkini",
          "Badge level risiko (Rendah / Sedang / Tinggi)",
          "Grafik curah hujan 48 jam",
        ]}
      />
    </div>
  );
}
