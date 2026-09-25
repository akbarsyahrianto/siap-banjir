/**
 * Rule engine risiko banjir (inti sistem).
 * Ambang batas TIDAK di-hard-code; semuanya dibaca dari tabel AmbangRisiko.
 */
import type { AmbangRisiko, DataCuaca, ParameterRisiko, TingkatRisiko } from "@prisma/client";
import { db } from "@/server/db";
import type { OpenMeteoResponse } from "@/server/integrations/open-meteo";
import { hitungParameterCuaca, type NilaiParameter } from "@/server/services/parameter-cuaca";
import { LABEL_LEVEL, PARAMETER_RISIKO, URUTAN_LEVEL, formatNilaiParameter } from "@/lib/risiko";
import type { HasilParameter } from "@/server/validators/risiko";

export type AmbangAcuan = Pick<
  AmbangRisiko,
  "idWilayah" | "parameter" | "nilaiMinimum" | "nilaiMaksimum" | "levelRisiko"
>;

export type HasilRisiko = {
  level: TingkatRisiko;
  skorRisiko: number;
  /** Parameter yang levelnya sama dengan level akhir, skor tertinggi dulu. */
  parameterPemicu: HasilParameter[];
  /** Semua parameter yang punya nilai dan ambang. */
  hasilPerParameter: HasilParameter[];
  /** false jika tidak ada satu pun parameter yang bisa dievaluasi. */
  adaData: boolean;
};

// Skor 0–100 dibagi per level agar selalu konsisten dengan level:
// RENDAH 0–33, SEDANG 34–66, TINGGI 67–100.
const RENTANG_SKOR: Record<TingkatRisiko, { dasar: number; lebar: number }> = {
  RENDAH: { dasar: 0, lebar: 33 },
  SEDANG: { dasar: 34, lebar: 32 },
  TINGGI: { dasar: 67, lebar: 33 },
};

function cocok(nilai: number, ambang: AmbangAcuan) {
  return nilai >= ambang.nilaiMinimum && (ambang.nilaiMaksimum == null || nilai < ambang.nilaiMaksimum);
}

function hitungSkor(nilai: number, ambang: AmbangAcuan) {
  const { dasar, lebar } = RENTANG_SKOR[ambang.levelRisiko];
  // Rentang tanpa batas atas: skor penuh saat nilai = 2 × nilaiMinimum.
  const pembagi =
    ambang.nilaiMaksimum != null
      ? ambang.nilaiMaksimum - ambang.nilaiMinimum
      : Math.max(ambang.nilaiMinimum, 1);
  const posisi = Math.min(Math.max((nilai - ambang.nilaiMinimum) / pembagi, 0), 1);
  return Math.round(dasar + posisi * lebar);
}

/**
 * Pilih ambang yang berlaku per parameter: jika wilayah punya ambang khusus untuk
 * parameter itu, ambang global untuk parameter tersebut diabaikan.
 * `ambangList` berisi ambang global + ambang khusus SATU wilayah.
 */
export function pilihAmbangEfektif(ambangList: AmbangAcuan[]): Map<ParameterRisiko, AmbangAcuan[]> {
  const perParameter = new Map<ParameterRisiko, { khusus: AmbangAcuan[]; global: AmbangAcuan[] }>();
  for (const a of ambangList) {
    const grup = perParameter.get(a.parameter) ?? { khusus: [], global: [] };
    (a.idWilayah == null ? grup.global : grup.khusus).push(a);
    perParameter.set(a.parameter, grup);
  }
  return new Map([...perParameter].map(([p, { khusus, global }]) => [p, khusus.length ? khusus : global]));
}

/** cekAmbang(dataCuaca, ambangList): hasil perbandingan per parameter. */
export function cekAmbang(nilai: NilaiParameter, ambangList: AmbangAcuan[]): HasilParameter[] {
  const hasil: HasilParameter[] = [];
  for (const [parameter, daftar] of pilihAmbangEfektif(ambangList)) {
    const v = nilai[parameter];
    if (v === undefined || !Number.isFinite(v)) continue;
    // Jika rentang tumpang tindih (salah konfigurasi), ambil level tertinggi.
    const terpilih = daftar
      .filter((a) => cocok(v, a))
      .sort((x, y) => URUTAN_LEVEL[y.levelRisiko] - URUTAN_LEVEL[x.levelRisiko])[0];
    if (!terpilih) continue;
    hasil.push({
      parameter,
      nilai: v,
      level: terpilih.levelRisiko,
      skor: hitungSkor(v, terpilih),
      ambangKhusus: terpilih.idWilayah != null,
      pemicu: false,
    });
  }
  return hasil;
}

/** hitungLevelRisiko(dataCuaca): level akhir = level tertinggi dari semua parameter. */
export function hitungLevelRisiko(nilai: NilaiParameter, ambangList: AmbangAcuan[]): HasilRisiko {
  const hasil = cekAmbang(nilai, ambangList);
  if (hasil.length === 0) {
    return { level: "RENDAH", skorRisiko: 0, parameterPemicu: [], hasilPerParameter: [], adaData: false };
  }

  const level = hasil.reduce<TingkatRisiko>(
    (maks, h) => (URUTAN_LEVEL[h.level] > URUTAN_LEVEL[maks] ? h.level : maks),
    "RENDAH",
  );
  const hasilPerParameter = hasil
    .map((h) => ({ ...h, pemicu: h.level === level }))
    .sort((a, b) => b.skor - a.skor);

  return {
    level,
    skorRisiko: Math.max(...hasil.map((h) => h.skor)),
    parameterPemicu: hasilPerParameter.filter((h) => h.pemicu),
    hasilPerParameter,
    adaData: true,
  };
}

/** Kalimat ringkas, misalnya "Risiko TINGGI karena curah hujan 24 jam terakhir 72 mm." */
export function buatDeskripsiRisiko(hasil: HasilRisiko) {
  if (!hasil.adaData) return "Data cuaca belum cukup untuk menghitung risiko.";
  const utama = hasil.parameterPemicu[0];
  if (hasil.level === "RENDAH" || !utama) {
    return "Risiko RENDAH. Tidak ada parameter yang melewati ambang Sedang.";
  }
  const label = PARAMETER_RISIKO[utama.parameter].label.toLowerCase();
  return `Risiko ${LABEL_LEVEL[hasil.level].toUpperCase()} karena ${label} ${formatNilaiParameter(utama.parameter, utama.nilai)}.`;
}

// ---------- Operasi yang mengakses DB ----------

export async function ambilAmbangWilayah(idWilayah: string) {
  return db.ambangRisiko.findMany({ where: { OR: [{ idWilayah }, { idWilayah: null }] } });
}

/** Langkah 5 sequence diagram: hitung risiko dari DataCuaca lalu simpan LevelRisiko. */
export async function evaluasiDanSimpanRisiko(dataCuaca: DataCuaca, raw: OpenMeteoResponse) {
  const ambangList = await ambilAmbangWilayah(dataCuaca.idWilayah);
  const hasil = hitungLevelRisiko(hitungParameterCuaca(raw), ambangList);
  return db.levelRisiko.create({
    data: {
      idWilayah: dataCuaca.idWilayah,
      idCuaca: dataCuaca.idCuaca,
      level: hasil.level,
      skorRisiko: hasil.skorRisiko,
      deskripsi: buatDeskripsiRisiko(hasil),
      parameterPemicu: hasil.hasilPerParameter,
    },
  });
}
