/**
 * Data seed Siap Banjir. Dipisah dari seed.ts agar bisa diuji (tests/unit/seed-data.test.ts).
 *
 * Wilayah (kode, nama, koordinat) diimpor dari prisma/data/wilayah.tsv.gz (Kemendagri 2025,
 * lihat scripts/impor-wilayah.ts). Di sini hanya profil tambahan dan konten.
 * Kode diambil dari data impor, bukan diketik dari ingatan; test memastikan kode & namanya cocok.
 */
import type {
  AmbangRisikoInput,
  InformasiInput,
  PersiapanDiniInput,
  RekomendasiInput,
} from "../src/server/validators/konten";

/** Kode Kemendagri wilayah yang dirujuk konten seed. */
export const KODE = {
  dkiJakarta: "31",
  kalimantanSelatan: "63",
  jakartaUtara: "31.72",
  jakartaBarat: "31.73",
  jakartaTimur: "31.75",
  kotaMedan: "12.71",
  kotaPadang: "13.71",
  kotaPalembang: "16.71",
  kabBandung: "32.04",
  dayeuhkolot: "32.04.12",
  kotaBekasi: "32.75",
  kotaSemarang: "33.74",
  kotaPekalongan: "33.75",
  kotaTangerang: "36.71",
  kotaBanjarmasin: "63.71",
  kotaSamarinda: "64.72",
  kotaManado: "71.71",
} as const;

export type ProfilWilayah = { idWilayah: string; namaWilayah: string; deskripsi: string };

/** Deskripsi wilayah rawan banjir. `namaWilayah` = nama resmi Kemendagri (diperiksa test). */
export const profilWilayahSeed: ProfilWilayah[] = [
  {
    idWilayah: KODE.jakartaUtara,
    namaWilayah: "Kota Administrasi Jakarta Utara",
    deskripsi: "Kawasan pesisir dataran rendah; rawan banjir kiriman, genangan hujan, dan banjir rob.",
  },
  {
    idWilayah: KODE.jakartaTimur,
    namaWilayah: "Kota Administrasi Jakarta Timur",
    deskripsi: "Dilalui Sungai Ciliwung dan Kali Sunter; permukiman bantaran sungai rawan luapan.",
  },
  {
    idWilayah: KODE.jakartaBarat,
    namaWilayah: "Kota Administrasi Jakarta Barat",
    deskripsi: "Dilalui Kali Angke dan Kali Pesanggrahan; beberapa kawasan rawan genangan saat hujan lebat.",
  },
  {
    idWilayah: KODE.kotaBekasi,
    namaWilayah: "Kota Bekasi",
    deskripsi: "Dilalui Kali Bekasi; perumahan di sekitar pertemuan Kali Cikeas dan Cileungsi rawan banjir.",
  },
  {
    idWilayah: KODE.kotaTangerang,
    namaWilayah: "Kota Tangerang",
    deskripsi: "Dilalui Sungai Cisadane; beberapa kecamatan rawan genangan saat hujan lebat.",
  },
  {
    idWilayah: KODE.dayeuhkolot,
    namaWilayah: "Dayeuhkolot",
    deskripsi: "Cekungan Bandung di tepi Sungai Citarum; langganan banjir luapan saat musim hujan.",
  },
  {
    idWilayah: KODE.kotaSemarang,
    namaWilayah: "Kota Semarang",
    deskripsi: "Kota pesisir dengan penurunan muka tanah; rawan banjir hujan dan banjir rob.",
  },
  {
    idWilayah: KODE.kotaPekalongan,
    namaWilayah: "Kota Pekalongan",
    deskripsi: "Pesisir utara Jawa Tengah; rawan banjir rob dan genangan akibat hujan lebat.",
  },
  {
    idWilayah: KODE.kotaMedan,
    namaWilayah: "Kota Medan",
    deskripsi: "Dilalui Sungai Deli dan Sungai Babura; permukiman bantaran sungai rawan luapan.",
  },
  {
    idWilayah: KODE.kotaSamarinda,
    namaWilayah: "Kota Samarinda",
    deskripsi: "Dilalui Sungai Mahakam dan Sungai Karang Mumus; sering tergenang saat hujan deras.",
  },
  {
    idWilayah: KODE.kotaBanjarmasin,
    namaWilayah: "Kota Banjarmasin",
    deskripsi: "Kota sungai di dataran rendah muara Barito–Martapura; rawan banjir hujan dan pasang.",
  },
  {
    idWilayah: KODE.kotaPalembang,
    namaWilayah: "Kota Palembang",
    deskripsi: "Dilalui Sungai Musi; kawasan rawa dan dataran rendah rawan genangan.",
  },
  {
    idWilayah: KODE.kotaManado,
    namaWilayah: "Kota Manado",
    deskripsi: "Dilalui Sungai Tondano dan beberapa sungai kecil; pernah dilanda banjir bandang.",
  },
  {
    idWilayah: KODE.kotaPadang,
    namaWilayah: "Kota Padang",
    deskripsi: "Kota pesisir dengan curah hujan tinggi; beberapa kawasan rawan banjir dan genangan.",
  },
];

// Ambang default global, mengacu kategori intensitas hujan BMKG.
// Rentang: nilaiMinimum ≤ nilai < nilaiMaksimum; nilaiMaksimum null = tanpa batas atas.
export const ambangSeed: AmbangRisikoInput[] = [
  { parameter: "hujan_24jam", nilaiMinimum: 0, nilaiMaksimum: 20, levelRisiko: "RENDAH", keterangan: "Hujan ringan (< 20 mm/hari)" },
  { parameter: "hujan_24jam", nilaiMinimum: 20, nilaiMaksimum: 50, levelRisiko: "SEDANG", keterangan: "Hujan sedang (20–50 mm/hari)" },
  { parameter: "hujan_24jam", nilaiMinimum: 50, nilaiMaksimum: null, levelRisiko: "TINGGI", keterangan: "Hujan lebat atau lebih (≥ 50 mm/hari)" },

  { parameter: "hujan_1jam", nilaiMinimum: 0, nilaiMaksimum: 10, levelRisiko: "RENDAH", keterangan: "Intensitas < 10 mm/jam" },
  { parameter: "hujan_1jam", nilaiMinimum: 10, nilaiMaksimum: 20, levelRisiko: "SEDANG", keterangan: "Intensitas 10–20 mm/jam" },
  { parameter: "hujan_1jam", nilaiMinimum: 20, nilaiMaksimum: null, levelRisiko: "TINGGI", keterangan: "Intensitas ≥ 20 mm/jam" },

  { parameter: "hujan_3hari", nilaiMinimum: 0, nilaiMaksimum: 60, levelRisiko: "RENDAH", keterangan: "Akumulasi 3 hari < 60 mm" },
  { parameter: "hujan_3hari", nilaiMinimum: 60, nilaiMaksimum: 120, levelRisiko: "SEDANG", keterangan: "Akumulasi 3 hari 60–120 mm; tanah mulai jenuh" },
  { parameter: "hujan_3hari", nilaiMinimum: 120, nilaiMaksimum: null, levelRisiko: "TINGGI", keterangan: "Akumulasi 3 hari ≥ 120 mm; tanah jenuh" },

  { parameter: "prakiraan_hujan_24jam", nilaiMinimum: 0, nilaiMaksimum: 20, levelRisiko: "RENDAH", keterangan: "Prakiraan 24 jam < 20 mm" },
  { parameter: "prakiraan_hujan_24jam", nilaiMinimum: 20, nilaiMaksimum: 50, levelRisiko: "SEDANG", keterangan: "Prakiraan 24 jam 20–50 mm" },
  { parameter: "prakiraan_hujan_24jam", nilaiMinimum: 50, nilaiMaksimum: null, levelRisiko: "TINGGI", keterangan: "Prakiraan 24 jam ≥ 50 mm" },
];

export const persiapanSeed: PersiapanDiniInput[] = [
  // RENDAH
  { levelRisiko: "RENDAH", urutan: 1, isiPersiapan: "Bersihkan selokan dan saluran air di sekitar rumah dari sampah." },
  { levelRisiko: "RENDAH", urutan: 2, isiPersiapan: "Simpan dokumen penting (KTP, KK, ijazah, sertifikat) dalam map atau plastik kedap air." },
  { levelRisiko: "RENDAH", urutan: 3, isiPersiapan: "Catat nomor darurat 112 dan kontak BPBD setempat di ponsel." },
  { levelRisiko: "RENDAH", urutan: 4, isiPersiapan: "Kenali jalur evakuasi dan titik kumpul terdekat dari rumah." },
  // SEDANG
  { levelRisiko: "SEDANG", urutan: 1, isiPersiapan: "Siapkan tas siaga: dokumen, obat-obatan, senter, pakaian ganti, makanan dan air minum untuk 3 hari." },
  { levelRisiko: "SEDANG", urutan: 2, isiPersiapan: "Isi penuh daya ponsel dan power bank." },
  { levelRisiko: "SEDANG", urutan: 3, isiPersiapan: "Pindahkan barang berharga dan peralatan elektronik ke tempat yang lebih tinggi." },
  { levelRisiko: "SEDANG", urutan: 4, isiPersiapan: "Pantau informasi dari BMKG dan BPBD serta kondisi sungai di dekat rumah." },
  { levelRisiko: "SEDANG", urutan: 5, isiPersiapan: "Sepakati titik kumpul dan cara berkomunikasi dengan anggota keluarga." },
  // TINGGI
  { levelRisiko: "TINGGI", urutan: 1, isiPersiapan: "Letakkan tas siaga di dekat pintu keluar agar mudah dibawa." },
  { levelRisiko: "TINGGI", urutan: 2, isiPersiapan: "Dahulukan lansia, anak-anak, ibu hamil, dan penyandang disabilitas untuk bersiap mengungsi." },
  { levelRisiko: "TINGGI", urutan: 3, isiPersiapan: "Pindahkan kendaraan ke tempat yang lebih tinggi." },
  { levelRisiko: "TINGGI", urutan: 4, isiPersiapan: "Siap mematikan listrik dan gas dari sumber utama jika air mulai masuk rumah." },
  { levelRisiko: "TINGGI", urutan: 5, isiPersiapan: "Berkoordinasi dengan RT/RW dan ikuti arahan petugas." },
  // Contoh konten khusus wilayah (ditampilkan lebih dulu dari konten global).
  { idWilayah: KODE.jakartaUtara, levelRisiko: "SEDANG", urutan: 0, isiPersiapan: "Perhatikan jadwal pasang air laut; hujan lebat saat pasang dapat memperparah genangan rob." },
  { idWilayah: KODE.kotaSemarang, levelRisiko: "SEDANG", urutan: 0, isiPersiapan: "Perhatikan jadwal pasang air laut; kawasan pesisir Semarang rawan rob bersamaan dengan hujan." },
  { idWilayah: KODE.dayeuhkolot, levelRisiko: "SEDANG", urutan: 0, isiPersiapan: "Pantau tinggi muka air Sungai Citarum dan informasi dari aparat desa/kelurahan." },
];

export const rekomendasiSeed: RekomendasiInput[] = [
  // RENDAH
  { levelRisiko: "RENDAH", urutan: 1, isiRekomendasi: "Beraktivitas seperti biasa sambil tetap memantau perkembangan cuaca." },
  { levelRisiko: "RENDAH", urutan: 2, isiRekomendasi: "Jangan membuang sampah ke sungai atau saluran air." },
  // SEDANG
  { levelRisiko: "SEDANG", urutan: 1, isiRekomendasi: "Hindari bantaran sungai, jalan underpass, dan kawasan yang biasa tergenang." },
  { levelRisiko: "SEDANG", urutan: 2, isiRekomendasi: "Tunda perjalanan yang tidak mendesak saat hujan lebat." },
  { levelRisiko: "SEDANG", urutan: 3, isiRekomendasi: "Ikuti pembaruan peringatan dini dari BMKG dan BPBD setempat." },
  // TINGGI
  { levelRisiko: "TINGGI", urutan: 1, isiRekomendasi: "Segera mengungsi ke tempat yang lebih tinggi bila diminta petugas atau air terus naik." },
  { levelRisiko: "TINGGI", urutan: 2, isiRekomendasi: "Jangan berjalan atau berkendara menembus arus banjir; arus setinggi lutut dapat menghanyutkan orang." },
  { levelRisiko: "TINGGI", urutan: 3, isiRekomendasi: "Jauhi tiang dan kabel listrik yang terendam air." },
  { levelRisiko: "TINGGI", urutan: 4, isiRekomendasi: "Hubungi 112 jika membutuhkan pertolongan darurat." },
];

export const informasiSeed: InformasiInput[] = [
  // ----- UMUM -----
  {
    kategori: "UMUM",
    tanggal: "2026-01-05",
    judul: "Mengenal Banjir dan Penyebabnya",
    isi:
      "Banjir terjadi ketika air meluap dan menggenangi daratan yang biasanya kering. Penyebab umumnya adalah hujan lebat dalam waktu lama, luapan sungai, saluran air yang tersumbat, air laut pasang (rob), serta berkurangnya daerah resapan air.\n\nBanjir dapat datang perlahan (genangan) maupun tiba-tiba (banjir bandang). Karena itu penting untuk memantau curah hujan, bukan hanya di wilayah sendiri tetapi juga di daerah hulu sungai.",
  },
  {
    kategori: "UMUM",
    tanggal: "2026-01-06",
    judul: "Kategori Intensitas Hujan Menurut BMKG",
    isi:
      "BMKG mengelompokkan curah hujan harian sebagai berikut:\n- Hujan ringan: 0,5–20 mm/hari\n- Hujan sedang: 20–50 mm/hari\n- Hujan lebat: 50–100 mm/hari\n- Hujan sangat lebat: 100–150 mm/hari\n- Hujan ekstrem: lebih dari 150 mm/hari\n\nSiap Banjir memakai kategori ini sebagai dasar ambang batas level risiko Rendah, Sedang, dan Tinggi.",
  },
  {
    kategori: "UMUM",
    tanggal: "2026-01-07",
    judul: "Isi Tas Siaga Bencana",
    isi:
      "Tas siaga bencana sebaiknya disiapkan sebelum musim hujan. Isinya antara lain: salinan dokumen penting dalam plastik kedap air, obat-obatan pribadi, senter dan baterai cadangan, power bank, pakaian ganti, makanan tahan lama dan air minum untuk 3 hari, uang tunai secukupnya, peluit, serta masker.\n\nLetakkan tas di tempat yang mudah dijangkau dan beri tahu seluruh anggota keluarga.",
  },
  {
    kategori: "UMUM",
    tanggal: "2026-01-08",
    judul: "Nomor Darurat yang Perlu Disimpan",
    isi:
      "Simpan nomor berikut di ponsel Anda:\n- 112: Layanan darurat terpadu\n- 117: Call Center BNPB\n- 119: Layanan kesehatan / ambulans\n- 113: Pemadam kebakaran dan penyelamatan\n\nCari juga nomor BPBD kabupaten/kota Anda melalui situs resmi pemerintah daerah.",
  },
  {
    kategori: "UMUM",
    tanggal: "2026-01-09",
    judul: "Tentang Level Risiko di Siap Banjir",
    isi:
      "Level risiko pada Siap Banjir adalah estimasi berdasarkan data cuaca Open-Meteo dan ambang batas risiko yang telah ditentukan. Informasi ini bukan peringatan resmi. Selalu ikuti arahan BMKG, BPBD, dan pemerintah setempat.",
  },
  {
    // Artikel pengenalan risiko, bukan laporan kejadian: tanggal = tanggal terbit.
    kategori: "UMUM",
    idWilayah: KODE.dayeuhkolot,
    tanggal: "2026-01-10",
    judul: "Mengenal Risiko Banjir Luapan Citarum di Cekungan Bandung",
    isi:
      "Dayeuhkolot dan sekitarnya berada di dataran rendah Cekungan Bandung yang dilalui Sungai Citarum. Saat hujan lebat berlangsung beberapa hari di wilayah hulu, luapan Citarum dapat menggenangi permukiman selama berhari-hari. Pantau curah hujan akumulasi 3 hari, bukan hanya hujan hari ini.\n\nArtikel ini menjelaskan risiko secara umum, bukan laporan kejadian banjir pada tanggal tertentu. Kejadian banjir yang terdokumentasi ada di bagian Riwayat kejadian banjir.",
  },
  // ----- RIWAYAT_KEJADIAN -----
  // Setiap entri wajib punya sumber yang bisa dibuka (diperiksa 25 September 2026) dan isinya
  // hanya memuat hal yang disebut sumber tersebut (DECISIONS D-039).
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: KODE.jakartaTimur,
    tanggal: "2020-01-01",
    judul: "Banjir Jabodetabek Awal Tahun 2020",
    isi:
      "Pada malam pergantian tahun 2019–2020 hujan ekstrem mengguyur Jabodetabek dan menyebabkan banjir di banyak wilayah. BMKG mencatat curah hujan tertinggi 377 mm/hari di Bandara Halim Perdanakusuma, Jakarta Timur, dan menyebutnya yang paling ekstrem sepanjang sejarah pengukuran.",
    sumberNama: "Kompas.com, 3 Januari 2020",
    sumberUrl:
      "https://nasional.kompas.com/read/2020/01/03/10141971/bmkg-sebut-curah-hujan-di-jakarta-awal-2020-paling-ekstrem-dalam-sejarah",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: KODE.kotaBekasi,
    tanggal: "2020-01-01",
    judul: "Banjir Kota Bekasi 1 Januari 2020",
    isi:
      "Hujan lebat sejak sore hari terakhir 2019 membuat Kali Bekasi meluap. Pada 1 Januari 2020 banyak kawasan dan perumahan di Kota Bekasi terendam, dan warga meminta bantuan evakuasi dari BPBD.",
    sumberNama: "ANTARA, 1 Januari 2020",
    sumberUrl: "https://www.antaranews.com/berita/1230684/kota-bekasi-dikepung-banjir-pada-awal-2020",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: KODE.dkiJakarta,
    tanggal: "2007-02-02",
    judul: "Banjir Besar Jakarta Februari 2007",
    isi:
      "Hujan deras yang terus-menerus di Jakarta dan daerah aliran Sungai Ciliwung sejak akhir Januari 2007 memuncak pada awal Februari 2007 dan menyebabkan banjir besar yang merendam sebagian besar wilayah ibu kota.",
    sumberNama: "detikNews, 2 Januari 2020",
    sumberUrl: "https://news.detik.com/berita/d-4844138/memori-banjir-bandang-2007-yang-bikin-aktivitas-jakarta-ambyar",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: KODE.kotaManado,
    tanggal: "2014-01-15",
    judul: "Banjir Bandang Manado Januari 2014",
    isi:
      "Pada 15 Januari 2014 hujan deras terus-menerus di Kota Manado dan sekitarnya membuat DAS Sawangan dan DAS Tondano tidak mampu menampung debit air, sehingga meluap dan menyebabkan banjir serta tanah longsor.",
    sumberNama: "BNPB, 16 Januari 2014",
    sumberUrl: "https://www.bnpb.go.id/berita/update-banjir-manado-5-tewas",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: KODE.kalimantanSelatan,
    tanggal: "2021-01-15",
    judul: "Banjir Kalimantan Selatan Januari 2021",
    isi:
      "Cuaca ekstrem berupa hujan lebat pada 12–15 Januari 2021 menyebabkan banjir besar di banyak kabupaten/kota di Kalimantan Selatan, termasuk Kota Banjarmasin. Lebih dari 10.000 rumah terendam.",
    sumberNama: "Kompas.com, 18 Januari 2021",
    sumberUrl:
      "https://www.kompas.com/sains/read/2021/01/18/120500823/bmkg--banjir-kalimantan-selatan-akibat-cuaca-ekstrem-dipicu-dinamika?page=all",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: KODE.kotaSemarang,
    tanggal: "2021-02-06",
    judul: "Banjir Semarang Februari 2021",
    isi:
      "Curah hujan tinggi sejak Jumat malam, 5 Februari 2021, menyebabkan banjir di Kota Semarang. Stasiun Semarang Tawang terendam hingga 70 cm di hall stasiun, sehingga sejumlah perjalanan kereta api terganggu.",
    sumberNama: "Kompas.com, 6 Februari 2021",
    sumberUrl:
      "https://www.kompas.com/tren/read/2021/02/06/135452165/stasiun-semarang-tawang-terendam-banjir-7-perjalanan-kereta-ini-terganggu?page=all",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: KODE.kotaMedan,
    tanggal: "2020-12-03",
    judul: "Banjir Medan Desember 2020",
    isi:
      "Hujan berintensitas tinggi membuat Sungai Deli, Sungai Babura, dan Sungai Denai meluap. Banjir mencapai puncaknya pada 3 Desember 2020 dan merendam empat kecamatan di Kota Medan: Medan Johor, Medan Maimun, Medan Sunggal, dan Medan Tuntungan.",
    sumberNama: "Liputan6.com (data BNPB), 5 Desember 2020",
    sumberUrl: "https://www.liputan6.com/regional/read/4426111/bnpb-banjir-kota-medan-berangsur-surut",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: KODE.kotaSamarinda,
    tanggal: "2019-06-09",
    judul: "Banjir Samarinda Juni 2019",
    isi:
      "Hujan lebat sejak Sabtu malam, 8 Juni 2019, hingga Minggu, 9 Juni 2019, membuat banyak kawasan permukiman di Kota Samarinda terendam, antara lain di Sempaja Timur dan Gunung Lingai, karena air belum dapat mengalir dengan baik ke saluran pembuangan.",
    sumberNama: "VIVA, 9 Juni 2019",
    sumberUrl: "https://www.viva.co.id/berita/nasional/1155549-kota-samarinda-banjir-ribuan-jiwa-terdampak",
  },
];
