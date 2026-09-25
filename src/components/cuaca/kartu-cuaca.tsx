import type { DataCuaca } from "@prisma/client";
import { Droplets, Thermometer, Umbrella, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAngka } from "@/lib/format";
import { infoKondisiCuaca } from "@/lib/weather-code";
import type { SumberData } from "@/server/services/weather.service";
import { AtribusiOpenMeteo } from "./atribusi-open-meteo";
import { StatusData } from "./status-data";

export function KartuCuaca({
  dataCuaca,
  sumber,
  namaWilayah,
}: {
  dataCuaca: DataCuaca;
  sumber: SumberData;
  namaWilayah: string;
}) {
  const kondisi = infoKondisiCuaca(dataCuaca.kondisiCuaca);
  const Ikon = kondisi.ikon;
  const detail = [
    { ikon: Droplets, label: "Kelembapan", nilai: `${formatAngka(dataCuaca.kelembapan, 0)}%` },
    { ikon: Wind, label: "Angin", nilai: `${formatAngka(dataCuaca.kecepatanAngin)} km/jam` },
    { ikon: Umbrella, label: "Hujan (15 menit)", nilai: `${formatAngka(dataCuaca.curahHujan)} mm` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground">Cuaca terkini · {namaWilayah}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Ikon className="size-16 text-primary" aria-hidden="true" />
          <div>
            <p className="flex items-center gap-1 text-4xl font-bold tabular-nums">
              <Thermometer className="size-6 text-muted-foreground" aria-hidden="true" />
              {formatAngka(dataCuaca.suhu)}°C
            </p>
            <p className="text-lg font-medium">{kondisi.label}</p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2">
          {detail.map(({ ikon: IkonDetail, label, nilai }) => (
            <div key={label} className="rounded-lg bg-muted p-2 text-center">
              <dt className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <IkonDetail className="size-3.5" aria-hidden="true" />
                {label}
              </dt>
              <dd className="font-semibold tabular-nums">{nilai}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-1">
          <StatusData sumber={sumber} waktuAmbil={dataCuaca.waktuAmbil} />
          <AtribusiOpenMeteo />
        </div>
      </CardContent>
    </Card>
  );
}
