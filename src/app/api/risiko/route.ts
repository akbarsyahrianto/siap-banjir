import { NextResponse, type NextRequest } from "next/server";
import { cekRateLimit, parseQuery, tidakDitemukan } from "@/server/http";
import { limitBacaCuaca } from "@/server/rate-limits";
import { keRisikoKlien, lihatKondisiWilayah } from "@/server/services/pemantauan.service";
import { queryWilayahSchema } from "@/server/validators/risiko";

/** GET /api/risiko?wilayah={id}: level risiko terkini (dipakai refresh berkala state machine). */
export async function GET(req: NextRequest) {
  const dibatasi = cekRateLimit(req, limitBacaCuaca);
  if (dibatasi) return dibatasi;
  const q = parseQuery(req.nextUrl, queryWilayahSchema);
  if (!q.ok) return q.res;

  const kondisi = await lihatKondisiWilayah(q.data.wilayah);
  if (!kondisi) return tidakDitemukan("Wilayah tidak ditemukan");

  const data = keRisikoKlien(kondisi);
  if (!data) return NextResponse.json({ error: "Data cuaca belum tersedia" }, { status: 503 });
  return NextResponse.json({ data });
}
