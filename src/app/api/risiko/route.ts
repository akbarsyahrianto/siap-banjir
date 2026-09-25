import { NextResponse, type NextRequest } from "next/server";
import { parseQuery, tidakDitemukan } from "@/server/http";
import { lihatKondisiWilayah } from "@/server/services/pemantauan.service";
import { queryWilayahSchema } from "@/server/validators/risiko";

/** GET /api/risiko?wilayah={id}: level risiko terkini. */
export async function GET(req: NextRequest) {
  const q = parseQuery(req.nextUrl, queryWilayahSchema);
  if (!q.ok) return q.res;

  const kondisi = await lihatKondisiWilayah(q.data.wilayah);
  if (!kondisi) return tidakDitemukan("Wilayah tidak ditemukan");
  if (!kondisi.cuaca || !kondisi.risiko) {
    return NextResponse.json({ error: "Data cuaca belum tersedia" }, { status: 503 });
  }

  const { risiko, cuaca } = kondisi;
  return NextResponse.json({
    data: {
      idRisiko: risiko.idRisiko,
      idWilayah: risiko.idWilayah,
      level: risiko.level,
      skorRisiko: risiko.skorRisiko,
      deskripsi: risiko.deskripsi,
      parameter: risiko.hasilPerParameter,
      waktu: risiko.waktu,
      sumberData: cuaca.sumber,
      waktuAmbilData: cuaca.dataCuaca.waktuAmbil,
    },
  });
}
