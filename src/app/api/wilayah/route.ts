import { NextResponse } from "next/server";
import { daftarWilayah } from "@/server/services/content.service";

// Selalu baca dari DB; jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ data: await daftarWilayah() });
}
