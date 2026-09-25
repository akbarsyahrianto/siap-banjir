import { NextResponse } from "next/server";
import type { z } from "zod";

/** Validasi query string dengan Zod; kembalikan data atau respons 400. */
export function parseQuery<S extends z.ZodType>(
  url: URL,
  schema: S,
): { ok: true; data: z.infer<S> } | { ok: false; res: NextResponse } {
  const hasil = schema.safeParse(Object.fromEntries(url.searchParams));
  if (hasil.success) return { ok: true, data: hasil.data };
  return {
    ok: false,
    res: NextResponse.json(
      { error: "Parameter tidak valid", detail: hasil.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      { status: 400 },
    ),
  };
}

export const tidakDitemukan = (pesan = "Tidak ditemukan") => NextResponse.json({ error: pesan }, { status: 404 });
