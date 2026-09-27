/**
 * Nomor telepon BPBD yang sudah diverifikasi dari sumber resmi (DECISIONS D-007, D-043).
 *
 * Kunci: kode Kemendagri kab/kota ("36.71") atau provinsi ("31") pemilik BPBD.
 * Syarat setiap entri (diuji di tests/unit/kontak-darurat.test.ts):
 *   - `sumberUrl` halaman resmi pemerintah (domain *.go.id) yang memuat nomor tersebut;
 *   - `diperiksaPada` tanggal nomor dicocokkan dengan sumbernya (YYYY-MM-DD).
 * BPBD tanpa entri ditampilkan "Nomor belum tersedia". Jangan menambah nomor dari berita,
 * media sosial, atau direktori pihak ketiga.
 */
export type KontakBpbdTerverifikasi = {
  telepon: string;
  sumberNama: string;
  sumberUrl: string;
  diperiksaPada: string;
};

export const KONTAK_BPBD: Readonly<Record<string, KontakBpbdTerverifikasi>> = {};
