import { NextResponse, type NextRequest } from "next/server";
import { parseQuery } from "@/server/http";
import { lihatPersiapan } from "@/server/services/content.service";
import { queryPenangananSchema } from "@/server/validators/risiko";

/** GET /api/persiapan?level=RENDAH|SEDANG|TINGGI&wilayah={id}: lihatPersiapan(level, wilayah). */
export async function GET(req: NextRequest) {
  const q = parseQuery(req.nextUrl, queryPenangananSchema);
  if (!q.ok) return q.res;
  return NextResponse.json({ data: await lihatPersiapan(q.data.level, q.data.wilayah) });
}
