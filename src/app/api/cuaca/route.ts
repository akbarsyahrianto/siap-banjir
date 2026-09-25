import { NextResponse, type NextRequest } from "next/server";
import { parseQuery, tidakDitemukan } from "@/server/http";
import { lihatKondisiWilayah } from "@/server/services/pemantauan.service";
import { ringkasanHarian, seriPrakiraanPerJam } from "@/server/services/seri-cuaca";
import { queryWilayahSchema } from "@/server/validators/risiko";

/** GET /api/cuaca?wilayah={id}: cuaca terkini + prakiraan (Lihat Data Cuaca «include» Ambil Data Cuaca). */
export async function GET(req: NextRequest) {
  const q = parseQuery(req.nextUrl, queryWilayahSchema);
  if (!q.ok) return q.res;

  const kondisi = await lihatKondisiWilayah(q.data.wilayah);
  if (!kondisi) return tidakDitemukan("Wilayah tidak ditemukan");
  if (!kondisi.cuaca) {
    return NextResponse.json({ error: "Data cuaca belum tersedia" }, { status: 503 });
  }

  const { dataCuaca, raw, sumber } = kondisi.cuaca;
  return NextResponse.json({
    data: {
      idWilayah: kondisi.wilayah.idWilayah,
      sumber,
      waktuAmbil: dataCuaca.waktuAmbil,
      waktuPengamatan: dataCuaca.waktuPengamatan,
      terkini: {
        suhu: dataCuaca.suhu,
        kelembapan: dataCuaca.kelembapan,
        curahHujan: dataCuaca.curahHujan,
        kecepatanAngin: dataCuaca.kecepatanAngin,
        kondisiCuaca: dataCuaca.kondisiCuaca,
      },
      perJam: seriPrakiraanPerJam(raw),
      harian: ringkasanHarian(raw),
      atribusi: "Data cuaca: Open-Meteo.com (CC BY 4.0)",
    },
  });
}
