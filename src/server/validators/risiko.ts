import { z } from "zod";
import { kodeWilayahSchema, parameterRisikoSchema, tingkatRisikoSchema } from "@/server/validators/konten";

/** Isi kolom LevelRisiko.parameterPemicu (JSON). */
export const hasilParameterSchema = z.object({
  parameter: parameterRisikoSchema,
  nilai: z.number(),
  level: tingkatRisikoSchema,
  skor: z.number(),
  ambangKhusus: z.boolean(),
  /** true = parameter ini menentukan level akhir. */
  pemicu: z.boolean(),
});

export const daftarHasilParameterSchema = z.array(hasilParameterSchema);

export type HasilParameter = z.infer<typeof hasilParameterSchema>;

export const queryWilayahSchema = z.object({
  wilayah: kodeWilayahSchema,
});

export const queryPenangananSchema = z.object({
  level: tingkatRisikoSchema,
  wilayah: queryWilayahSchema.shape.wilayah.optional(),
});
