/**
 * Data seed Siap Banjir. Dipisah dari seed.ts agar bisa diuji (tests/unit/seed-data.test.ts).
 * Koordinat = titik pusat kota/kecamatan (WGS84).
 */
import type {
  AmbangRisikoInput,
  InformasiInput,
  PersiapanDiniInput,
  RekomendasiInput,
  WilayahInput,
} from "../src/server/validators/konten";

// Nomor darurat nasional, dipakai di semua wilayah.
const kontakNasional = [
  { nama: "Layanan Darurat", telepon: "112" },
  { nama: "Call Center BNPB", telepon: "117" },
  { nama: "Ambulans / Layanan Kesehatan", telepon: "119" },
  { nama: "Pemadam Kebakaran & Penyelamatan", telepon: "113" },
];

// Nomor BPBD daerah tidak diisi karena berbeda-beda dan sering berubah:
// telepon null → UI mengarahkan pengguna ke 112 / situs resmi BPBD.
const kontak = (namaBpbd: string) => [...kontakNasional, { nama: namaBpbd, telepon: null }];

export const wilayahSeed: WilayahInput[] = [
  {
    idWilayah: "jakarta-utara",
    namaWilayah: "Jakarta Utara",
    koordinatLatitude: -6.1214,
    koordinatLongitude: 106.8656,
    deskripsi: "Kawasan pesisir dataran rendah; rawan banjir kiriman, genangan hujan, dan banjir rob.",
    kontakDarurat: kontak("BPBD Provinsi DKI Jakarta"),
  },
  {
    idWilayah: "jakarta-timur",
    namaWilayah: "Jakarta Timur",
    koordinatLatitude: -6.225,
    koordinatLongitude: 106.9004,
    deskripsi: "Dilalui Sungai Ciliwung dan Kali Sunter; permukiman bantaran sungai rawan luapan.",
    kontakDarurat: kontak("BPBD Provinsi DKI Jakarta"),
  },
  {
    idWilayah: "jakarta-barat",
    namaWilayah: "Jakarta Barat",
    koordinatLatitude: -6.1674,
    koordinatLongitude: 106.7637,
    deskripsi: "Dilalui Kali Angke dan Kali Pesanggrahan; beberapa kawasan rawan genangan saat hujan lebat.",
    kontakDarurat: kontak("BPBD Provinsi DKI Jakarta"),
  },
  {
    idWilayah: "kota-bekasi",
    namaWilayah: "Kota Bekasi",
    koordinatLatitude: -6.2383,
    koordinatLongitude: 106.9756,
    deskripsi: "Dilalui Kali Bekasi; perumahan di sekitar pertemuan Kali Cikeas dan Cileungsi rawan banjir.",
    kontakDarurat: kontak("BPBD Kota Bekasi"),
  },
  {
    idWilayah: "kota-tangerang",
    namaWilayah: "Kota Tangerang",
    koordinatLatitude: -6.1783,
    koordinatLongitude: 106.6319,
    deskripsi: "Dilalui Sungai Cisadane; beberapa kecamatan rawan genangan saat hujan lebat.",
    kontakDarurat: kontak("BPBD Kota Tangerang"),
  },
  {
    idWilayah: "dayeuhkolot",
    namaWilayah: "Dayeuhkolot, Kabupaten Bandung",
    koordinatLatitude: -6.9867,
    koordinatLongitude: 107.6269,
    deskripsi: "Cekungan Bandung di tepi Sungai Citarum; langganan banjir luapan saat musim hujan.",
    kontakDarurat: kontak("BPBD Kabupaten Bandung"),
  },
  {
    idWilayah: "kota-semarang",
    namaWilayah: "Kota Semarang",
    koordinatLatitude: -6.9932,
    koordinatLongitude: 110.4203,
    deskripsi: "Kota pesisir dengan penurunan muka tanah; rawan banjir hujan dan banjir rob.",
    kontakDarurat: kontak("BPBD Kota Semarang"),
  },
  {
    idWilayah: "kota-pekalongan",
    namaWilayah: "Kota Pekalongan",
    koordinatLatitude: -6.8886,
    koordinatLongitude: 109.6753,
    deskripsi: "Pesisir utara Jawa Tengah; rawan banjir rob dan genangan akibat hujan lebat.",
    kontakDarurat: kontak("BPBD Kota Pekalongan"),
  },
  {
    idWilayah: "kota-medan",
    namaWilayah: "Kota Medan",
    koordinatLatitude: 3.5952,
    koordinatLongitude: 98.6722,
    deskripsi: "Dilalui Sungai Deli dan Sungai Babura; permukiman bantaran sungai rawan luapan.",
    kontakDarurat: kontak("BPBD Kota Medan"),
  },
  {
    idWilayah: "kota-samarinda",
    namaWilayah: "Kota Samarinda",
    koordinatLatitude: -0.5022,
    koordinatLongitude: 117.1536,
    deskripsi: "Dilalui Sungai Mahakam dan Sungai Karang Mumus; sering tergenang saat hujan deras.",
    kontakDarurat: kontak("BPBD Kota Samarinda"),
  },
  {
    idWilayah: "kota-banjarmasin",
    namaWilayah: "Kota Banjarmasin",
    koordinatLatitude: -3.3186,
    koordinatLongitude: 114.5944,
    deskripsi: "Kota sungai di dataran rendah muara Barito–Martapura; rawan banjir hujan dan pasang.",
    kontakDarurat: kontak("BPBD Kota Banjarmasin"),
  },
  {
    idWilayah: "kota-palembang",
    namaWilayah: "Kota Palembang",
    koordinatLatitude: -2.9761,
    koordinatLongitude: 104.7754,
    deskripsi: "Dilalui Sungai Musi; kawasan rawa dan dataran rendah rawan genangan.",
    kontakDarurat: kontak("BPBD Kota Palembang"),
  },
  {
    idWilayah: "kota-manado",
    namaWilayah: "Kota Manado",
    koordinatLatitude: 1.4748,
    koordinatLongitude: 124.8421,
    deskripsi: "Dilalui Sungai Tondano dan beberapa sungai kecil; pernah dilanda banjir bandang.",
    kontakDarurat: kontak("BPBD Kota Manado"),
  },
  {
    idWilayah: "kota-padang",
    namaWilayah: "Kota Padang",
    koordinatLatitude: -0.9471,
    koordinatLongitude: 100.4172,
    deskripsi: "Kota pesisir dengan curah hujan tinggi; beberapa kawasan rawan banjir dan genangan.",
    kontakDarurat: kontak("BPBD Kota Padang"),
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
  { idWilayah: "jakarta-utara", levelRisiko: "SEDANG", urutan: 0, isiPersiapan: "Perhatikan jadwal pasang air laut; hujan lebat saat pasang dapat memperparah genangan rob." },
  { idWilayah: "kota-semarang", levelRisiko: "SEDANG", urutan: 0, isiPersiapan: "Perhatikan jadwal pasang air laut; kawasan pesisir Semarang rawan rob bersamaan dengan hujan." },
  { idWilayah: "dayeuhkolot", levelRisiko: "SEDANG", urutan: 0, isiPersiapan: "Pantau tinggi muka air Sungai Citarum dan informasi dari aparat desa/kelurahan." },
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
    kategori: "UMUM",
    idWilayah: "dayeuhkolot",
    tanggal: "2026-01-10",
    judul: "Banjir Luapan Citarum di Cekungan Bandung",
    isi:
      "Dayeuhkolot dan sekitarnya berada di dataran rendah Cekungan Bandung yang dilalui Sungai Citarum. Saat hujan lebat berlangsung beberapa hari di wilayah hulu, luapan Citarum dapat menggenangi permukiman selama berhari-hari. Pantau curah hujan akumulasi 3 hari, bukan hanya hujan hari ini.",
  },
  // ----- RIWAYAT_KEJADIAN -----
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: "jakarta-timur",
    tanggal: "2020-01-01",
    judul: "Banjir Jabodetabek Awal Tahun 2020",
    isi:
      "Pada malam pergantian tahun 2019–2020 hujan ekstrem mengguyur Jabodetabek. BMKG mencatat curah hujan 377 mm/hari di Halim Perdanakusuma, Jakarta Timur, salah satu yang tertinggi dalam catatan pengamatan. Banyak permukiman di Jakarta Timur tergenang.",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: "kota-bekasi",
    tanggal: "2020-01-01",
    judul: "Banjir Kota Bekasi 1 Januari 2020",
    isi:
      "Hujan ekstrem pada malam pergantian tahun menyebabkan Kali Bekasi meluap. Banyak kompleks perumahan di Kota Bekasi terendam dan warga harus dievakuasi.",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: "jakarta-utara",
    tanggal: "2007-02-02",
    judul: "Banjir Besar Jakarta Februari 2007",
    isi:
      "Pada awal Februari 2007 hujan lebat berhari-hari di Jakarta dan wilayah hulu menyebabkan banjir besar yang merendam sebagian besar wilayah ibu kota, termasuk kawasan pesisir Jakarta Utara.",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: "kota-manado",
    tanggal: "2014-01-15",
    judul: "Banjir Bandang Manado Januari 2014",
    isi:
      "Pada 15 Januari 2014 hujan lebat memicu banjir bandang dan tanah longsor di Kota Manado. Sejumlah sungai meluap dan merendam banyak kelurahan.",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: "kota-banjarmasin",
    tanggal: "2021-01-15",
    judul: "Banjir Kalimantan Selatan Januari 2021",
    isi:
      "Pada pertengahan Januari 2021 hujan lebat berkepanjangan menyebabkan banjir besar di banyak kabupaten/kota di Kalimantan Selatan, termasuk sebagian wilayah Kota Banjarmasin.",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: "kota-semarang",
    tanggal: "2021-02-06",
    judul: "Banjir Semarang Februari 2021",
    isi:
      "Pada awal Februari 2021 hujan lebat menyebabkan banjir di banyak titik di Kota Semarang, termasuk kawasan sekitar Stasiun Tawang, sehingga perjalanan kereta api sempat terganggu.",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: "kota-medan",
    tanggal: "2020-12-04",
    judul: "Banjir Medan Desember 2020",
    isi:
      "Pada awal Desember 2020 hujan lebat menyebabkan Sungai Deli dan Sungai Babura meluap. Sejumlah kelurahan di Kota Medan terendam.",
  },
  {
    kategori: "RIWAYAT_KEJADIAN",
    idWilayah: "kota-samarinda",
    tanggal: "2019-06-09",
    judul: "Banjir Samarinda Juni 2019",
    isi:
      "Pada Juni 2019 hujan lebat berhari-hari menyebabkan banjir yang merendam banyak kawasan di Kota Samarinda, terutama di sekitar Sungai Karang Mumus.",
  },
];
