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

## D-017 · Identitas perangkat & kapan data disimpan di server (Fase 3)

- `Perangkat.deviceToken` = UUID acak (`crypto.randomUUID()`) yang dibuat browser dan disimpan di localStorage. Tidak ada data pribadi.
- Tanpa login, perangkat tidak bisa dikaitkan satu sama lain. Jadi satu `Pengguna` dibuat per perangkat (relasi 1..* di UML tetap didukung schema).
- Sesuai sequence diagram, `daftarkanPerangkat()` hanya dipanggil pada cabang **[izin notifikasi]**. Pengguna yang menolak izin tidak punya data di server; preferensi wilayahnya hanya di localStorage + cookie. `Pengguna.wilayahPreferensi` diperbarui setiap perangkat mendaftar atau mengganti wilayah.
- Jika browser memberi endpoint yang sama ke perangkat baru (misal localStorage dihapus), langganan lama dengan endpoint itu dihapus agar `pushEndpoint` tetap unik.

## D-018 · Endpoint push dibatasi ke push service resmi (anti-SSRF)

Server mengirim POST ke `subscription.endpoint`. Tanpa pembatasan, siapa pun bisa mendaftarkan URL internal (misal `http://169.254.169.254/...`) dan menjadikan server alat SSRF. Endpoint wajib `https` tanpa port khusus, dengan host:
- `fcm.googleapis.com`: Chrome, Opera, Samsung Internet
- `updates.push.services.mozilla.com`: Firefox
- `web.push.apple.com`: Safari
- `*.notify.windows.com`: Edge desktop

Browser dengan push service lain perlu ditambahkan ke daftar di `src/server/validators/push.ts`.

## D-019 · Rate limit di memori proses

`/api/push/subscribe` dan `/unsubscribe` dibatasi 10 permintaan/menit per IP, `/api/push/test` 3/menit per IP. Implementasinya fixed window di memori (`src/lib/rate-limit.ts`), cukup untuk satu instance server. Di Vercel (banyak instance serverless), batas berlaku per instance. Jika perlu batas global, ganti dengan store bersama (misal Upstash Redis) di Fase 5.

IP dibaca dari `x-forwarded-for`, yang hanya bisa dipercaya di belakang proxy tepercaya (Vercel/Nginx).

## D-020 · Perilaku notifikasi

- **Aktif/nonaktif** di Pengaturan mengubah `LanggananNotifikasi.status`. Subscription browser tidak dihapus, sehingga menyalakan kembali tidak perlu izin ulang. `/api/push/subscribe` juga dipakai untuk memperbarui wilayah dan level minimum (upsert).
- **Level minimum** hanya `SEDANG` (Sedang + Tinggi) atau `TINGGI`. Risiko Rendah tidak pernah dikirim.
- **Pemicu (langkah 8):** setiap kali `LevelRisiko` baru bernilai Sedang/Tinggi, `prosesPeringatan()` dijalankan lewat `after()` dari Next.js. Pengiriman berlangsung setelah respons terkirim, sehingga halaman tidak menunggu push service. Fase 4 menambahkan cron agar ini berjalan tanpa ada yang membuka web.
- **Anti-spam:** notifikasi dilewati jika dalam 6 jam terakhir langganan itu sudah menerima (status PENDING/TERKIRIM) notifikasi untuk wilayah yang sama dengan level ≥ level sekarang. Notifikasi GAGAL tidak dihitung, jadi percobaan berikutnya tetap dikirim.
- **Push service 404/410:** langganan dihapus beserta riwayat notifikasinya (cascade).
- **Notifikasi uji** tidak dicatat di tabel `Notifikasi`, karena `idLevelRisiko` wajib diisi dan notifikasi uji tidak terkait level risiko.
- **Dialog izin kustom** muncul otomatis sekali setelah memilih wilayah (jika izin browser belum pernah diminta). Setelah itu pengguna bisa mengaktifkan dari tombol di Beranda atau Pengaturan.
- **Ikon notifikasi** sementara memakai `/icon.svg`. Ikon PNG dibuat di Fase 5 bersama manifest PWA.

## D-022 · Cron: satu endpoint, tiga cara memanggil (Fase 4)

`GET|POST /api/cron/update-weather` memproses semua wilayah (4 paralel). Untuk tiap wilayah: data cuaca → hitung risiko → jika risiko **baru** dan Sedang/Tinggi, kirim notifikasi + simpan riwayat.

- **Cache tetap dihormati.** Jika pengguna membuka web 10 menit sebelumnya, cron memakai data itu dan tidak menindaklanjuti ulang, karena tindak lanjut sudah dijalankan saat risiko pertama dihitung. `?paksa=1` memaksa ambil ulang dari Open-Meteo.
- **Otorisasi:** `Authorization: Bearer ${CRON_SECRET}`, dibandingkan constant-time (hash SHA-256). Secret kosong atau kurang dari 16 karakter selalu ditolak.
- **Cara memanggil:**
  - `vercel.json`: Vercel Cron setiap 30 menit. Paket Hobby Vercel hanya mengizinkan cron harian; untuk 30 menit perlu Pro atau GitHub Actions.
  - `.github/workflows/update-weather.yml`: GitHub Actions, dengan secret `APP_URL` & `CRON_SECRET`.
  - `npm run cron:lokal`: penjadwal lokal memakai `setInterval`, tanpa dependensi `node-cron` karena kebutuhannya hanya satu interval tetap.
- **Race condition diterima:** jika cron dan kunjungan halaman bersamaan menemukan cache kedaluwarsa, bisa tercipta dua `DataCuaca`. Anti-spam menghitung notifikasi PENDING sehingga duplikat notifikasi sangat kecil kemungkinannya.

## D-023 · Riwayat otomatis risiko tinggi (langkah 9)

Setiap `LevelRisiko` baru bernilai TINGGI disimpan sebagai `Informasi` kategori `RIWAYAT_KEJADIAN`, **maksimal satu per wilayah per hari kalender WIB**. Deteksi berikutnya di hari yang sama tidak menambah entri. Entri otomatis dikenali dari awalan judul "Risiko banjir TINGGI terdeteksi di …", jadi schema tidak perlu diubah. Isinya menyebut parameter pemicu dan menegaskan bahwa ini **deteksi otomatis, bukan laporan kejadian banjir terverifikasi**, supaya tidak tercampur dengan riwayat kejadian nyata dari seed.

## D-024 · State machine sebagai reducer (tanpa XState)

State machine UI ada di `src/lib/mesin-risiko.ts` sebagai reducer murni. Unit test mencakup semua transisi, termasuk join jalur paralel. Efeknya dijalankan hook `useRiskState`. Pemetaan ke UML:

| UML | Implementasi |
|---|---|
| Idle / Pemantauan Lokasi | `pemantauan`; entry ambil data (SSR awal, lalu `/api/risiko` + `/api/cuaca`); refresh tiap 30 menit dan saat tab aktif lagi setelah ≥ 30 menit |
| EvaluasiRisiko | *Choice state* di reducer (`evaluasiRisiko`), diputuskan saat data diterima |
| Bahaya, jalur 1 (TriggerPush → KirimNotifikasiPush → NotifikasiTerkirim) | Push dikirim **server** (cron / saat risiko dihitung) karena API publik tidak boleh punya endpoint tulis tambahan. Di klien, jalur ini menentukan kanal: `push` jika perangkat berlangganan untuk wilayah ini, selain itu `dalam-aplikasi` (toast + banner + tombol aktifkan notifikasi) |
| Bahaya, jalur 2 (PermintaanGrafik → MenyiapkanGrafik → SelesaiRender) | Grafik curah hujan 48 jam memanggil `onSelesaiRender` setelah tergambar di layar |
| Join → Detail Penanganan | Otomatis setelah kedua jalur selesai, lalu halaman bergulir ke bagian Penanganan |
| Checklist Siaga / Detail Mitigasi | Tab di Detail Penanganan; checklist tersimpan di localStorage (D-016) |
| Final | `selesai` dengan alasan `normal` (refresh menemukan risiko < ambang) atau `ditutup` (pengguna menutup). "Tutup website" = komponen unmount |

Perilaku tambahan:
- Peringatan yang **ditutup** tidak muncul lagi untuk level yang sama, tetapi muncul lagi jika level naik.
- Level naik Sedang → Tinggi saat masih bahaya memulai episode Bahaya baru.
- Setelah Final, refresh berikutnya memulai siklus pemantauan baru.
- Ambang bahaya di klien = Sedang, sama dengan level yang memicu notifikasi.

## D-025 · Deep link notifikasi memakai fragmen `#penanganan`

URL notifikasi: `/risiko?wilayah={id}#penanganan`. Path dan query tetap persis seperti di prompt; fragmen dibaca di browser dan memicu event `BUKA_PENANGANAN`, sehingga state machine langsung masuk Detail Penanganan (jalur 1 dianggap selesai karena notifikasi sudah diterima). Jika saat dibuka risiko sudah di bawah ambang, halaman tetap di Pemantauan.

Beranda dan `/cuaca` juga diperbarui otomatis tiap 30 menit (`router.refresh()`).

## D-021 · Integration test memakai database pengembangan

`npm run test:integration` menjalankan `prosesPeringatan()` terhadap PostgreSQL dari `.env`, dengan push service di-mock. Test membuat datanya sendiri di wilayah `kota-pekalongan` dan menghapusnya lagi. Namun test juga **menonaktifkan langganan lain di wilayah itu**, jadi jangan dijalankan terhadap database produksi.
