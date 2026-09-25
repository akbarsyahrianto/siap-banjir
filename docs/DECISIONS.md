# Catatan Keputusan Desain — Siap Banjir

Keputusan yang menyimpang dari prompt atau mengisi bagian yang ambigu di rancangan.
Format: konteks → keputusan → alasan / konsekuensi.

---

## D-001 · PostgreSQL diinstal langsung di Windows, bukan Docker Compose (Fase 1)

**Konteks.** Prompt meminta Docker Compose untuk PostgreSQL, tetapi Docker tidak terpasang di mesin pengembangan.

**Keputusan.** PostgreSQL 17 dipasang langsung di Windows lewat winget:

```powershell
winget install --id PostgreSQL.PostgreSQL.17 -e --override "--mode unattended --unattendedmodeui none --superpassword postgres --serverport 5432 --disable-components stackbuilder,pgAdmin"
```

Berjalan sebagai Windows service `postgresql-x64-17` di `localhost:5432`. Role dan database aplikasi:

```powershell
$env:PGPASSWORD = 'postgres'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE ROLE siapbanjir WITH LOGIN PASSWORD 'siapbanjir' CREATEDB;"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE siapbanjir OWNER siapbanjir ENCODING 'UTF8';"
```

**Alasan / konsekuensi.**
- Tidak ada `docker-compose.yml` di repo. `DATABASE_URL` di `.env.example` menunjuk ke instalasi lokal.
- Role `siapbanjir` diberi `CREATEDB` karena `prisma migrate dev` perlu membuat shadow database.
- Password `postgres` / `siapbanjir` hanya untuk pengembangan lokal. Service hanya menerima koneksi dari localhost (bawaan `pg_hba.conf` installer EDB).
- Jika nanti Docker tersedia, cukup tambah `docker-compose.yml` dengan kredensial yang sama. Kode aplikasi tidak perlu diubah.

## D-002 · Prisma 6, bukan versi terbaru

Tag `latest` di npm menunjuk ke rilis kandidat Prisma 8 dan Prisma 7 mengubah cara konfigurasi (driver adapter, `prisma.config.ts`). Dipakai **Prisma 6.19** (stabil, `prisma-client-js`, `url = env("DATABASE_URL")`) supaya setup tetap sederhana.

## D-003 · Nama enum level risiko = `TingkatRisiko`

Prompt meminta enum Prisma untuk `LevelRisiko`, tetapi `LevelRisiko` juga nama entitas (model) di class diagram, dan Prisma tidak mengizinkan nama yang sama. Enum dinamai `TingkatRisiko` (RENDAH/SEDANG/TINGGI). Model `LevelRisiko` tetap sesuai UML.

## D-004 · Kolom `pushEndpoint` terpisah untuk keunikan endpoint

Constraint unik tidak bisa dipasang pada properti di dalam kolom JSON lewat Prisma. `LanggananNotifikasi` menyimpan `pushSubscription` (JSON utuh sesuai UML) **dan** salinan `pushEndpoint` (`String @unique`).

## D-005 · `idWilayah` berupa slug

`Wilayah.idWilayah` adalah slug (misal `kota-semarang`), bukan cuid atau angka. ID jadi stabil antar-seed dan terbaca di URL `/risiko?wilayah=kota-semarang`. Entitas lain memakai `cuid()`.

## D-006 · Atribut tambahan di luar class diagram

Ditambahkan seperlunya untuk memenuhi kebutuhan di prompt:

| Model | Atribut | Alasan |
|---|---|---|
| `Wilayah` | `kontakDarurat` (JSON `[{nama, telepon}]`) | Halaman `/risiko` wajib menampilkan kontak darurat "dari data seed"; class diagram tidak punya tempat untuk itu. |
| `DataCuaca` | `waktuAmbil` | Umur cache 30 menit dihitung dari waktu data diambil, bukan `waktuPengamatan` (waktu pengamatan Open-Meteo bisa lebih lama). |
| `LevelRisiko` | `parameterPemicu` (JSON) | Prompt meminta parameter pemicu disimpan untuk ditampilkan ("Risiko TINGGI karena curah hujan 24 jam 72 mm"). |

`AmbangRisiko.parameter` memakai enum `ParameterRisiko`. `nilaiMaksimum` boleh null, artinya tanpa batas atas (rentang "≥ 50").

## D-007 · Nomor BPBD tidak diisi

Nomor telepon BPBD per daerah berbeda-beda dan sering berubah. Supaya tidak mengarang data, seed hanya mengisi **nama** BPBD dengan `telepon: null`, ditambah nomor darurat nasional (112, 117 BNPB, 119, 113). Jika telepon null, UI mengarahkan pengguna ke 112 atau situs resmi BPBD. Nomor BPBD bisa ditambahkan lewat seed setelah diverifikasi.

## D-008 · Riwayat kejadian di seed

Riwayat kejadian (Informasi `RIWAYAT_KEJADIAN`) hanya memuat peristiwa banjir besar yang terdokumentasi luas. Deskripsinya sengaja umum, tanpa angka korban atau kerugian. Satu-satunya angka adalah curah hujan 377 mm/hari di Halim Perdanakusuma (1 Januari 2020, data BMKG).

## D-009 · Seed memakai service konten

Operasi class diagram `tambahWilayah()`, `ubahAmbang()`, `hapusRekomendasi()`, dan seterusnya ada di `src/server/services/content.service.ts`, divalidasi dengan Zod, dan hanya dipanggil oleh `prisma/seed.ts`. Seed bersifat idempoten: wilayah di-upsert, sedangkan tabel konten dikosongkan lalu diisi ulang.

## D-010 · Git dipasang via winget

Git belum terpasang saat Fase 1 dikerjakan. Git 2.55 dipasang dengan `winget install --id Git.Git -e`, lalu repo diinisialisasi dengan branch `main`. Identitas commit diatur di level repo (bukan global). `core.autocrlf=true` supaya file teks tetap LF di repo.

## D-011 · Wilayah terpilih: query `?wilayah=` → cookie → localStorage (Fase 2)

Prompt meminta preferensi wilayah disimpan di localStorage + server. Server component tidak bisa membaca localStorage, jadi preferensi juga ditulis ke cookie `siapbanjir_wilayah`. Urutan prioritas saat merender:

1. Query `?wilayah=` (deep link notifikasi `/risiko?wilayah={id}` dan URL yang bisa dibagikan).
2. Cookie.

`SinkronWilayah` menyalin localStorage ke cookie jika cookie hilang. Penyimpanan ke server (`Pengguna.wilayahPreferensi`) dibuat di Fase 3 bersama pendaftaran perangkat.

## D-012 · `hujan_1jam` = maks(current.precipitation, hourly jam terakhir)

Prompt mendefinisikan `hujan_1jam` sebagai "current precipitation". Respons Open-Meteo menunjukkan `current.interval = 900`, artinya `current.precipitation` hanya jumlah **15 menit** terakhir. Supaya tetap bermakna "1 jam", dipakai nilai terbesar dari `current.precipitation` dan nilai hourly pada jam penuh terakhir (nilai hourly jam T = hujan selama T-1 s.d. T).

Jendela parameter lain dihitung dari jam penuh saat ini:
- `hujan_24jam`: 24 nilai hourly sampai jam sekarang.
- `prakiraan_hujan_24jam`: 24 nilai hourly setelahnya.
- `hujan_3hari`: `daily.precipitation_sum` 2 hari lalu + hari ini. Nilai hari ini mencakup prakiraan sisa hari, sesuai definisi prompt.
- `peluang_hujan_max`: maksimum `precipitation_probability` hourly 24 jam ke depan.

Parameter tanpa data (semua null) dihilangkan, bukan dianggap 0.

## D-013 · Skor risiko 0–100 per pita level

Supaya gauge selalu konsisten dengan level, skor dipetakan per pita: RENDAH 0–33, SEDANG 34–66, TINGGI 67–100. Di dalam pita, skor naik linear sesuai posisi nilai di rentang ambangnya. Untuk rentang tanpa batas atas, skor penuh tercapai saat nilai = 2 × nilaiMinimum. Skor akhir = skor tertinggi dari semua parameter.

`peluang_hujan_max` tidak punya ambang di seed, jadi tidak memengaruhi level (hanya ditampilkan). Menambah ambangnya cukup lewat seed, tanpa mengubah kode.

## D-014 · `parameterPemicu` menyimpan semua parameter

Kolom `LevelRisiko.parameterPemicu` menyimpan hasil **semua** parameter (`nilai`, `level`, `skor`, `ambangKhusus`) dengan flag `pemicu: true` untuk parameter yang menentukan level akhir. Dengan begitu halaman `/risiko` bisa menampilkan semua nilai sesuai ambang yang berlaku saat risiko dihitung, tanpa menghitung ulang.

## D-015 · `pemantauan.service.ts` sebagai orkestrator

Selain lima service di prompt (weather, risk, notification, subscription, content), ada `pemantauan.service.ts` yang merangkai langkah 4–7 sequence diagram: data cuaca (cache/API) → `evaluasiDanSimpanRisiko` → persiapan & rekomendasi. Satu `LevelRisiko` dibuat per `DataCuaca`, sehingga data dari cache tidak menambah baris risiko baru. Fungsi murni (turunan parameter, `cekAmbang`, `hitungLevelRisiko`, penyusun data grafik) dipisah dari fungsi yang mengakses DB agar bisa di-unit-test.

## D-016 · Checklist persiapan sudah interaktif di Fase 2

Checklist persiapan dini di `/risiko` sudah bisa dicentang dan progresnya disimpan di localStorage (per wilayah + level). Hal ini bagian dari "Checklist Siaga" di state machine Fase 4, tetapi komponennya sederhana dan dibutuhkan halaman `/risiko` sekarang. Fase 4 tinggal menyambungkannya ke state machine.
