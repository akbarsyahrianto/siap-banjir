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

> **Diganti D-033:** `idWilayah` kini kode Kemendagri bertitik (misal `33.74.02.1002`).

`Wilayah.idWilayah` adalah slug (misal `kota-semarang`), bukan cuid atau angka. ID jadi stabil antar-seed dan terbaca di URL `/risiko?wilayah=kota-semarang`. Entitas lain memakai `cuid()`.

## D-006 · Atribut tambahan di luar class diagram

> **Sebagian diganti D-034 & D-037:** kolom `Wilayah.kontakDarurat` dihapus (kontak dibuat dari hierarki wilayah), dan `DataCuaca` kini milik sel grid, bukan wilayah.

Ditambahkan seperlunya untuk memenuhi kebutuhan di prompt:

| Model | Atribut | Alasan |
|---|---|---|
| `Wilayah` | `kontakDarurat` (JSON `[{nama, telepon}]`) | Halaman `/risiko` wajib menampilkan kontak darurat "dari data seed"; class diagram tidak punya tempat untuk itu. |
| `DataCuaca` | `waktuAmbil` | Umur cache 30 menit dihitung dari waktu data diambil, bukan `waktuPengamatan` (waktu pengamatan Open-Meteo bisa lebih lama). |
| `LevelRisiko` | `parameterPemicu` (JSON) | Prompt meminta parameter pemicu disimpan untuk ditampilkan ("Risiko TINGGI karena curah hujan 24 jam 72 mm"). |

`AmbangRisiko.parameter` memakai enum `ParameterRisiko`. `nilaiMaksimum` boleh null, artinya tanpa batas atas (rentang "≥ 50").

## D-007 · Nomor BPBD tidak diisi

> **Diperbarui D-043:** nomor BPBD boleh diisi jika bersumber resmi terverifikasi.

Nomor telepon BPBD per daerah berbeda-beda dan sering berubah. Supaya tidak mengarang data, seed hanya mengisi **nama** BPBD dengan `telepon: null`, ditambah nomor darurat nasional (112, 117 BNPB, 119, 113). Jika telepon null, UI mengarahkan pengguna ke 112 atau situs resmi BPBD. Nomor BPBD bisa ditambahkan lewat seed setelah diverifikasi.

## D-008 · Riwayat kejadian di seed

> **Diperbarui D-039:** setiap riwayat kini punya tautan sumber yang sudah diperiksa, dan beberapa isi/tanggal dikoreksi agar sesuai sumbernya.

Riwayat kejadian (Informasi `RIWAYAT_KEJADIAN`) hanya memuat peristiwa banjir besar yang terdokumentasi luas. ~~Deskripsinya sengaja umum, tanpa angka korban atau kerugian. Satu-satunya angka adalah curah hujan 377 mm/hari di Halim Perdanakusuma (1 Januari 2020, data BMKG).~~ Sejak D-039, angka (termasuk korban) hanya dicantumkan jika disebut sumber resmi yang dirujuk. Angka 377 mm dihapus karena tidak ditemukan di halaman BMKG/BNPB yang bisa dibuka (hanya di berita yang mengutip BMKG).

## D-009 · Seed memakai service konten

Operasi class diagram `tambahWilayah()`, `ubahAmbang()`, `hapusRekomendasi()`, dan seterusnya ada di `src/server/services/content.service.ts`, divalidasi dengan Zod, dan hanya dipanggil oleh `prisma/seed.ts`. Seed bersifat idempoten: wilayah di-upsert, sedangkan tabel konten dikosongkan lalu diisi ulang.

Sejak D-033, `tambahWilayah()` menerima banyak wilayah sekaligus (upsert massal SQL per 1.000 baris), `hapusWilayah()` menandai `aktif = false` alih-alih menghapus, dan seed tidak menghapus riwayat otomatis (D-038).

## D-010 · Git dipasang via winget

Git belum terpasang saat Fase 1 dikerjakan. Git 2.55 dipasang dengan `winget install --id Git.Git -e`, lalu repo diinisialisasi dengan branch `main`. Identitas commit diatur di level repo (bukan global). `core.autocrlf=true` supaya file teks tetap LF di repo.

## D-011 · Wilayah terpilih: query `?wilayah=` → cookie → localStorage (Fase 2)

Prompt meminta preferensi wilayah disimpan di localStorage + server. Server component tidak bisa membaca localStorage, jadi preferensi juga ditulis ke cookie `siapbanjir_wilayah`. Urutan prioritas saat merender:

1. Query `?wilayah=` (deep link notifikasi `/risiko?wilayah={id}` dan URL yang bisa dibagikan).
2. Cookie.

`SinkronWilayah` menyalin localStorage ke cookie jika cookie hilang. Penyimpanan ke server (`Pengguna.wilayahPreferensi`) dibuat di Fase 3 bersama pendaftaran perangkat.

Sejak D-033, nilai yang diterima hanya kode Kemendagri yang formatnya valid. Halaman menampilkan cuaca/risiko hanya untuk kode desa/kelurahan aktif; kode tingkat lebih tinggi (misal dari tautan) hanya mengisi pemilih bertingkat. Cookie berisi slug lama dari sebelum D-033 diabaikan, sehingga pengguna diminta memilih ulang.

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

> **Diganti D-038:** satu entri per **kab/kota** per hari, berisi daftar desa/kelurahan.

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

## D-026 · Script simulasi risiko

> **Diganti D-041:** simulasi tidak lagi menurunkan ambang. Nilai hujan simulasi dinilai dengan ambang asli, dan hasilnya ditandai simulasi (tanpa riwayat, notifikasi berlabel [SIMULASI]).

`npm run simulasi -- aktifkan <wilayah> [TINGGI|SEDANG]` memasang `AmbangRisiko` khusus wilayah (`id = simulasi-<wilayah>`, `hujan_24jam ≥ 0 mm` → level pilihan) dan membuat cache cuaca wilayah itu kedaluwarsa. Karena ambang dibaca dari DB, tidak ada kode yang diubah atau diberi mode khusus.

`pulihkan` menghapus ambang simulasi, riwayat otomatis sejak simulasi dimulai (waktu mulai disimpan di `keterangan`), dan data cuaca sejak itu (cascade ke `LevelRisiko` & `Notifikasi`). Pengaman:
- menolak `DATABASE_URL` non-lokal kecuali `--izinkan-remote`;
- memperingatkan jumlah pelanggan aktif, karena mereka menerima push sungguhan.

Script ini juga dipakai global setup/teardown e2e.

Sejak D-033/D-034: kode boleh tingkat apa pun (ambang diwariskan ke desa di bawahnya, D-037); yang dibuat kedaluwarsa/dihapus adalah data cuaca **sel grid** desa-desa itu, dan riwayat yang dibersihkan adalah riwayat kab/kota terkait. Perintah `cari <kata kunci>` menggantikan daftar semua wilayah di `status`. Keterbatasan: baris desa simulasi yang ditambahkan ke riwayat kab/kota yang **sudah ada sebelum simulasi** tidak ikut terhapus.

## D-027 · PWA (Fase 5)

- **Manifest:** `public/manifest.json` (sesuai struktur folder di prompt), `display: standalone`.
- **Ikon:** 192/512 (`any`), maskable 512 (logo di zona aman 60%), apple-touch-icon 180, badge monokrom 72 untuk notifikasi Android. Ikon dibuat dari logo SVG dengan `scripts/buat-ikon.mjs` memakai `sharp` bawaan Next.js; PNG hasilnya ikut di-commit.
- **Service worker** (`public/sw.js`):
  - Precache `/offline`, manifest, ikon, dan semua aset `/_next/static` yang dirujuk HTML `/offline`, supaya halaman offline bisa hydrate tanpa jaringan.
  - Navigasi: *network-first*; salinan terakhir 30 halaman disimpan dan dipakai saat offline, selain itu tampil `/offline`.
  - `/_next/static` & `/icons`: *cache-first* (nama file berhash).
  - API tidak di-cache SW, karena data risiko harus segar. Halaman yang tampil saat offline tetap menampilkan label waktu pembaruan terakhir.
  - Aset yang dimuat sebelum SW aktif (kunjungan pertama) dikirim halaman ke SW lewat `postMessage` untuk di-cache.
  - Mode dev (`sw.js?dev=1`) tidak memakai cache agar hot reload tidak terganggu.
- **Registrasi:** SW didaftarkan di semua halaman (`DaftarServiceWorker`), tidak hanya saat push aktif, agar PWA tetap bisa di-install dan dipakai offline di browser yang tidak mendukung push.
- **Tanpa tombol "Pasang aplikasi" kustom:** browser menampilkan prompt install bawaannya sendiri.

## D-028 · CSP dasar dengan `'unsafe-inline'` untuk script

Prompt meminta "CSP dasar". CSP berbasis nonce di Next.js mengharuskan semua halaman dirender dinamis dengan middleware, dan tidak cocok dengan halaman `/offline` yang disajikan dari cache SW (nonce lama tidak lagi valid). Jadi dipakai:

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self';
manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

`'unsafe-eval'` dan `ws:` hanya di mode dev. Risiko XSS tetap rendah karena React meng-escape semua output, tidak ada `dangerouslySetInnerHTML`, dan tidak ada skrip pihak ketiga (font di-host sendiri oleh `next/font`).

Header lain: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (geolokasi hanya `self`), `COOP: same-origin`, `X-Powered-By` dimatikan. HSTS diserahkan ke hosting (Vercel mengaktifkannya untuk domain HTTPS).

## D-029 · E2E Playwright & bug yang ditemukannya

- Dua project: Pixel 7 (mobile-first) dan Desktop Chrome. `workers: 1` karena berbagi satu server, satu database, dan rate limit per IP.
- **Stub di browser:** Chromium headless tidak bisa berlangganan ke push service dan selalu melaporkan `Notification.permission = "denied"`. Karena itu `Notification.permission`/`requestPermission` dan `PushManager.subscribe/getSubscription` di-stub dengan subscription sintetis. Semua request ke server (subscribe, pengaturan, DB) tetap asli.
- Alur Bahaya diuji dengan simulasi (D-026) pada `kota-pekalongan` di global setup; teardown memulihkan simulasi dan menghapus perangkat uji.
- `reducedMotion: "reduce"`: aplikasi menghormati `prefers-reduced-motion` (tanpa smooth scroll).
- **Bug nyata yang ditemukan dan diperbaiki:**
  1. **Dialog izin tidak pernah muncul** jika wilayah dipilih sebelum status push selesai dimuat. Sekarang permintaan ditunda sampai status siap.
  2. **Halaman offline crash:** chunk `app/(public)/offline/page-*.js` tidak ter-precache karena regex SW berhenti di tanda kurung route group.
  3. **Overflow horizontal di mobile:** tombol "Aktifkan notifikasi push untuk wilayah ini" (`whitespace-nowrap`) mendorong tombol ✕ keluar banner. Ada test baru yang memeriksa tidak ada scroll horizontal di halaman utama.
  4. **Tertutup header saat digulir:** elemen yang digulir otomatis bisa tertutup header sticky/bottom nav. Diperbaiki dengan `scroll-padding` global.

## D-030 · Deploy: `directUrl` & `vercel-build`

- Schema Prisma memakai `directUrl = env("DIRECT_URL")`. Neon/Supabase melayani runtime lewat pooler (PgBouncer, butuh `pgbouncer=true`), sedangkan migrasi butuh koneksi langsung. Lokal: kedua URL sama.
- `npm run vercel-build` = `prisma generate && prisma migrate deploy && next build`. Atur sebagai Build Command di Vercel. Seed produksi dijalankan manual sekali (README).

## D-031 · Rate limit API baca cuaca/risiko

`/api/cuaca` dan `/api/risiko` bisa memicu request ke Open-Meteo saat cache kedaluwarsa, jadi dibatasi 60 permintaan/menit per IP (mekanisme sama dengan D-019). API baca lain hanya membaca DB dan tidak dibatasi.

## D-032 · Temuan `npm audit` yang tidak diperbaiki

`npm audit --omit=dev` (per 25 September 2026) melaporkan:

| Paket | Tingkat | Jalur | Penilaian |
|---|---|---|---|
| `postcss` (di dalam `next`) | high | Build-time: memproses CSS milik proyek | Input bukan dari pengguna, tidak bisa dieksploitasi saat runtime. Perbaikan butuh **Next 16**, sedangkan prompt meminta Next 15 |
| `deepmerge-ts` via `@prisma/config` / `prisma` | high | CLI Prisma (penggabungan konfigurasi) | Tidak di jalur request. "Perbaikan" npm justru downgrade ke Prisma 6.12 |

Keduanya dipantau; perbarui saat Next 15.x / Prisma 6.x merilis patch, atau saat proyek pindah ke Next 16.

## D-021 · Integration test memakai database pengembangan

`npm run test:integration` menjalankan `prosesPeringatan()` terhadap PostgreSQL dari `.env`, dengan push service di-mock. Test membuat datanya sendiri di wilayah `kota-pekalongan` dan menghapusnya lagi. Namun test juga **menonaktifkan langganan lain di wilayah itu**, jadi jangan dijalankan terhadap database produksi.

Sejak D-033: wilayah uji adalah desa/kelurahan asli (Kelurahan Bandengan `33.75.03.1009` untuk notifikasi; Kelurahan Belakang Pondok & Parak Gadang Timur di Kota Padang untuk riwayat per kab/kota). `DataCuaca` uji memakai sel grid `0.0,0.0` (laut, tanpa desa) agar tidak tercampur cache nyata. Ditambah test pencarian desa, desa terdekat, dan pemilih bertingkat terhadap data Kemendagri di database.

---

## D-033 · Cakupan seluruh Indonesia: data wilayah Kemendagri

**Konteks.** Cakupan diperluas dari 14 wilayah pilihan ke seluruh Indonesia: Provinsi → Kab/Kota → Kecamatan → Desa/Kelurahan, dengan kotak pencarian dan "Gunakan lokasi saya" ke desa/kelurahan terdekat.

**Keputusan.**
- **Kode & nama:** [cahyadsn/wilayah](https://github.com/cahyadsn/wilayah) (`db/wilayah.sql`, Kepmendagri No. 300.2.2-2430/2025), commit dipin `55a496d`. `idWilayah` = kode bertitik (`36.71.01.1001`); tingkat ditentukan dari jumlah segmen. Kolom baru: `level` (enum `TingkatWilayah`), `idInduk` (relasi ke diri sendiri), `namaLengkap` (desa, kecamatan, kab/kota, provinsi; untuk pencarian), `koordinatPerkiraan`, `kunciGrid`, `aktif`.
- **Koordinat:** centroid poligon dari [cahyadsn/wilayah_boundaries](https://github.com/cahyadsn/wilayah_boundaries), commit dipin `3c5a796`. Hanya centroid yang disimpan. Poligon sumber sudah disederhanakan, jadi centroid adalah perkiraan titik tengah wilayah.
- **Pencocokan kode ↔ nama saat impor** (`scripts/impor-wilayah.ts`, `scripts/lib/cocok-nama.ts`): nama dinormalisasi (huruf kecil, singkatan Kab./Kec./Kel./Ds., tanda baca), lalu dikelompokkan `sama` / `ejaan` / `berbeda`. `ejaan` mencakup beda spasi, ejaan lama (oe→u, dj→j, tj→c, ch→kh), atau kemiripan Levenshtein ≥ 0,8. Koordinat dipakai hanya jika `sama`/`ejaan` dan berada di kotak batas Indonesia. Nama **selalu** dari Kemendagri.
- **Data yang hilang:** desa/kelurahan tanpa data batas memakai centroid kecamatannya, `koordinatPerkiraan = true`, dan UI menampilkan catatan. Pencarian GPS mengutamakan desa dengan koordinat asli.
- **"Jauh dari induk" hanya dilaporkan.** Impor pertama menandai wilayah yang centroidnya > 80 km (desa) / > 250 km (kecamatan) dari induknya. Setelah diperiksa manual, semua kasus sah secara geografis: pulau terpencil (misal Kec. Liukang Tangaya & Liukang Tupabbiring di Kab. Pangkajene dan Kepulauan, Kec. Tambelan di Kab. Bintan, Pekajang di Kab. Lingga, Mapia di Kab. Supiori, pulau-pulau Babar & Masela di Kab. Maluku Barat Daya) atau kecamatan yang sangat luas (Kab. Kapuas Hulu, Kab. Kapuas). Karena itu koordinatnya tetap dipakai dan hanya dicantumkan di laporan.
- **Hasil disimpan di repo:** `prisma/data/wilayah.tsv.gz` (±1,3 MB) + `laporan-impor-wilayah.md` + `sumber-wilayah.json`. Seed dan deploy tidak butuh internet atau GitHub. Lisensi MIT kedua sumber disalin di `prisma/data/LISENSI-DATA-WILAYAH.md` dan README.
- **Pencarian:** `ILIKE` per kata terhadap `namaLengkap`, dibantu index GIN trigram (`pg_trgm`, tersedia di PostgreSQL lokal, Neon, dan Supabase). Minimal 3 huruf, rate limit sama dengan D-031.
- **Wilayah yang hilang dari data baru** ditandai `aktif = false` (tidak dihapus) agar langganan dan riwayat lama tetap utuh.

**Hasil impor (25 September 2026).** 38 provinsi, 514 kab/kota, 7.285 kecamatan, 83.762 desa/kelurahan. Tidak ada kode tambahan/ganda, **0 nama berbeda**, 19 beda ejaan (3 kecamatan, 16 desa; nama Kemendagri yang dipakai), 359 desa/kelurahan memakai koordinat kecamatan, dan 25 wilayah jauh dari induk (sah, lihat di atas).

**Konsekuensi.** Migrasi `20260925152150_wilayah_nasional` **mengosongkan** tabel `wilayah` dan `data_cuaca`. Karena cascade, semua langganan, level risiko, notifikasi, dan konten per wilayah lama ikut terhapus; konten dibuat ulang oleh seed dengan kode baru. Pengguna yang sudah berlangganan harus memilih desa/kelurahan dan mengaktifkan notifikasi lagi.

## D-034 · `DataCuaca` per sel grid 0,1° (menyimpang dari UML)

**Konteks.** Di class diagram, `DataCuaca` milik `Wilayah`. Dengan 83.762 desa/kelurahan, satu request per desa tidak mungkin dalam kuota gratis Open-Meteo (D-035).

**Keputusan.** `DataCuaca` tidak lagi berelasi ke `Wilayah`. Kolom `idWilayah` diganti `kunciGrid` (misal `-6.2,106.6`), `gridLatitude`, dan `gridLongitude`. Koordinat desa dibulatkan ke 0,1° (±11 km), dan semua desa di satu sel berbagi satu request dan satu cache 30 menit. Relasi ke wilayah dijaga lewat `LevelRisiko`: satu `LevelRisiko` per (desa, `DataCuaca`), karena ambang tiap desa bisa berbeda (D-037).

**Alasan.** Resolusi model Open-Meteo untuk Indonesia 9–25 km, jadi dua desa dalam satu sel 11 km hampir selalu mendapat nilai yang sama. Sel 0,1° menghemat request tanpa kehilangan detail. Seluruh desa/kelurahan terbagi ke ±13.000 sel. UI menjelaskan bahwa data cuaca berlaku untuk area ±11 km.

## D-035 · Anggaran kuota Open-Meteo

**Konteks.** Open-Meteo gratis: 10.000 call/hari (non-komersial). Satu request Siap Banjir (≤ 10 variabel, satu lokasi) = 1 call.

**Keputusan** (`src/server/services/kuota.service.ts`):
- Pemakaian = jumlah `DataCuaca` dengan `waktuAmbil` 24 jam terakhir (setiap request sukses = satu baris), tanpa tabel penghitung tambahan.
- Kunjungan halaman boleh meminta data baru sampai pemakaian 9.000. Di atas itu, halaman memakai data tersimpan terakhir dengan label "Batas harian permintaan data cuaca hampir tercapai" (`sumber = "hemat-kuota"`).
- Cron hanya memproses sel yang berisi desa dengan langganan aktif, maksimal 125 sel per putaran (±6.000/hari pada jadwal 30 menit), data tertua lebih dulu. Cron boleh memakai kuota sampai 9.800 karena notifikasi lebih penting daripada kunjungan.
- `DataCuaca` lebih tua dari 3 hari dihapus di akhir tiap putaran cron (cascade ke `LevelRisiko` & `Notifikasi`; anti-spam hanya melihat 6 jam terakhir).

**Konsekuensi.** Jika pelanggan tersebar di lebih dari 125 sel dengan cache kedaluwarsa, sebagian sel diperbarui di putaran berikutnya (paling lambat ±1 jam untuk ≤ 250 sel). Hitungan tidak memasukkan request yang gagal; selisih kecil ini tertutup oleh margin 200 call.

## D-036 · Variabel `rain` dihapus dari request Open-Meteo

`current.rain` tidak dipakai perhitungan mana pun (curah hujan memakai `precipitation`). Menghapusnya membuat request tetap ≤ 10 variabel, sehingga dihitung 1,0 call, bukan 1,1.

## D-037 · Pewarisan ambang & konten bertingkat, kontak darurat otomatis

**Konteks.** Prompt: wilayah tanpa ambang khusus memakai ambang global. Dengan hierarki 4 tingkat, ambang khusus sebaiknya bisa dipasang di kab/kota atau provinsi tanpa mengisi puluhan ribu desa.

**Keputusan.**
- **Ambang:** untuk setiap parameter, dipakai ambang dari tingkat **paling spesifik** yang punya ambang untuk parameter itu: desa > kecamatan > kab/kota > provinsi > global (`pilihAmbangEfektif`). Ambang antartingkat tidak dicampur. Parameter tanpa ambang khusus di tingkat mana pun memakai ambang global.
- **Persiapan dini, rekomendasi, informasi:** konten milik wilayah itu dan semua leluhurnya ditampilkan, yang paling spesifik lebih dulu, ditambah konten global.
- **Kontak darurat:** kolom `Wilayah.kontakDarurat` dihapus. Kontak dibuat dari hierarki: nomor nasional (112, 117, 119, 113) + "BPBD {kab/kota}" tanpa nomor (D-007). Kota/kabupaten administrasi DKI Jakarta tidak punya BPBD sendiri, jadi dipakai "BPBD Provinsi Daerah Khusus Ibukota Jakarta".
- **Unit pemantauan = desa/kelurahan.** Cuaca, risiko, langganan, dan notifikasi selalu per desa/kelurahan. Tingkat di atasnya hanya untuk navigasi, pewarisan, dan riwayat.
- Deskripsi wilayah dari seed lama dipindah ke kode Kemendagri yang sesuai (`profilWilayahSeed`); test memastikan nama profil sama persis dengan nama Kemendagri.

## D-038 · Riwayat risiko tinggi per kab/kota per hari

**Konteks.** D-023 menyimpan satu riwayat per wilayah per hari. Dengan unit desa, hujan lebat di satu kota bisa menghasilkan puluhan entri sehari.

**Keputusan.** Satu entri `RIWAYAT_KEJADIAN` per **kab/kota** per hari kalender WIB (`idWilayah` = kode kab/kota), berjudul "Risiko banjir TINGGI terdeteksi di {kab/kota}". Isinya daftar desa/kelurahan yang terdeteksi hari itu beserta jam dan penyebabnya. Desa yang sudah tercantum tidak ditambahkan lagi. Penulisan diserialkan dengan `pg_advisory_xact_lock(hashtext('riwayat:{kab}:{hari}'))` di dalam transaksi, sehingga cron paralel dan kunjungan halaman tidak membuat entri ganda (diuji di integration test). `npm run db:seed` tidak menghapus riwayat otomatis.

## D-039 · Sumber untuk setiap riwayat kejadian (menyimpang dari UML)

**Konteks.** Riwayat kejadian banjir di halaman Informasi harus bisa dirujuk. Class diagram `Informasi` tidak punya atribut sumber.

**Keputusan.**
- `Informasi` mendapat dua kolom nullable, `sumberNama` dan `sumberUrl` (migrasi `20260925160000_sumber_informasi`). Validator hanya menerima URL `https`. Tautan dibuka di tab baru dengan `rel="noopener noreferrer"`.
- Di kartu daftar, judul menjadi tautan ke detail (area klik meluas ke seluruh kartu) dan sumber menjadi tautan terpisah di atasnya, karena tautan bersarang tidak valid di HTML.
- **Sumber resmi diutamakan.** Semua riwayat seed kini merujuk situs pemerintah (diuji: host `*.go.id`): tujuh ke rilis BNPB, dan Banjir Jakarta 2007 ke arsip Dinas Perpustakaan dan Kearsipan Provinsi DKI Jakarta (kejadian ini sebelum BNPB berdiri pada 2008; artikel sejarah BNPB tentang 2007 berstatus 404). Teks dan tanggal disesuaikan dengan isi halaman resmi: Kalsel dimulai 12 Januari 2021, Jakarta 1 Februari 2007, Samarinda per laporan BNPB 12 Juni 2019 (penyebab: luapan Sungai Bengkuring), Semarang tanpa klaim Stasiun Tawang (tidak disebut BNPB), dan Jabodetabek 2020 dipindah ke Provinsi DKI Jakarta tanpa angka 377 mm (lihat D-008). Tidak ada halaman BMKG yang memuat data kejadian ini dalam bentuk teks.
- **Tautan harus bisa dibuka.** `npm run cek:sumber` membuka setiap tautan sumber (user agent browser, coba ulang sekali) dan gagal jika ada yang tidak terbuka; per 25 September 2026 kesembilan tautan (8 riwayat + Open-Meteo) berstatus 200. Tidak dijalankan di `npm test` karena butuh internet. Catatan: domain `bnpb.go.id` tanpa `www` menolak sebagian klien (403), jadi dipakai `www.bnpb.go.id`.
- **Setiap riwayat seed wajib punya sumber** (diuji). Setiap URL dibuka dan isinya dicocokkan pada 25 September 2026. Teks riwayat hanya memuat hal yang disebut sumbernya. Koreksi versi pertama (sebelum diganti sumber resmi):
  - Banjir Samarinda Juni 2019: frasa "terutama di sekitar Sungai Karang Mumus" dihapus karena tidak ada sumber terverifikasi yang menyebutnya; diganti kawasan yang disebut sumber (Sempaja Timur, Gunung Lingai).
  - Banjir Medan: tanggal 4 → 3 Desember 2020 (puncak banjir menurut data BNPB); Sungai Denai dan empat kecamatan terdampak ditambahkan sesuai sumber.
  - Banjir Jakarta 2007 dipindah dari Jakarta Utara ke Provinsi DKI Jakarta, dan Banjir Kalsel 2021 dari Kota Banjarmasin ke Provinsi Kalimantan Selatan, karena sumbernya menggambarkan kejadian tingkat provinsi. Lewat pewarisan (D-037) riwayat ini tampil untuk semua desa/kelurahan di provinsi itu.
- **Riwayat otomatis** (D-038) diberi sumber "Deteksi otomatis Siap Banjir, data cuaca Open-Meteo" → `https://open-meteo.com/`. Entri lama diisi saat `npm run db:seed`.
- **Artikel umum bukan kejadian.** "Banjir Luapan Citarum di Cekungan Bandung" (kategori UMUM, 10 Jan 2026) bukan laporan kejadian: tanggalnya hanya urutan tanggal terbit seed, dan isinya penjelasan risiko umum. Judulnya diganti menjadi "Mengenal Risiko Banjir Luapan Citarum di Cekungan Bandung", ditambah kalimat bahwa artikel ini bukan laporan kejadian pada tanggal tertentu. Semua artikel umum kini menampilkan label "Terbit" di depan tanggal.

## D-040 · `NEXT_DIST_DIR` untuk build/e2e saat `next dev` berjalan

`next build` menulis ke `.next`, yang juga dipakai `next dev`, sehingga build saat server pengembangan berjalan bisa merusaknya. `next.config.ts` kini membaca `distDir` dari `NEXT_DIST_DIR` (default `.next`). Contoh: `$env:NEXT_DIST_DIR = ".next-e2e"; npm run build; npm run test:e2e`. Path `.next-e2e/types` sudah ada di `tsconfig.json`, sehingga Next.js tidak menulis ulang file itu. Folder `.next-*` diabaikan git dan ESLint.

Catatan Windows: `prisma generate` gagal dengan `EPERM` saat `next dev` memegang file engine. File client (JS & tipe) tetap diperbarui; engine yang lama tetap valid selama versi Prisma sama. `next dev` memuat client baru setelah worker-nya dimulai ulang (misalnya setelah `next.config.ts` berubah, atau server di-restart).

Catatan migrasi: `prisma migrate dev` memberi timestamp UTC, sedangkan dua migrasi sebelumnya bernama dengan jam lebih akhir. Folder migrasi baru diganti nama (`…160000_…`, `…170000_…`) sebelum diterapkan agar urutan leksikalnya benar.

## D-041 · Simulasi memakai nilai hujan, bukan menurunkan ambang (menyimpang dari UML)

**Konteks.** Simulasi D-026 memasang ambang `hujan_24jam ≥ 0 mm → TINGGI`. Akibatnya notifikasi berbunyi "Risiko TINGGI karena curah hujan 24 jam terakhir 0,5 mm", tidak berlabel simulasi, dan menulis riwayat Kabupaten Sleman seolah kejadian nyata.

**Keputusan.**
- **Ambang tidak diubah.** Tabel alat uji `SimulasiCuaca` (`idWilayah`, `hujan24Jam`, `levelTujuan`, `mulai`; di luar class diagram) menyimpan nilai hujan 24 jam simulasi untuk suatu kode wilayah dan semua desa di bawahnya (yang paling spesifik menang). Saat risiko desa dihitung, `hujan_24jam` = maks(asli, simulasi) dan `hujan_3hari` minimal sama. Parameter lain tetap data asli, dan level ditentukan oleh ambang asli.
- **Nilai default benar-benar melewati ambang:** TINGGI = batas bawah TINGGI yang berlaku + 10 mm (60 mm untuk ambang global ≥ 50 mm); SEDANG = tengah rentang SEDANG. `--hujan-24jam <mm>` bisa dipakai, tetapi script menolak nilai yang tidak menghasilkan level tujuan.
- **`LevelRisiko.simulasi`** (kolom tambahan) menandai hasilnya:
  - deskripsi diawali `[SIMULASI]`, sehingga halaman dan API ikut berlabel;
  - judul notifikasi push diawali `[SIMULASI]`, isinya "Ini simulasi uji, bukan kondisi cuaca sebenarnya.", dan tag-nya `simulasi-risiko-{kode}` agar tidak menggantikan peringatan asli di perangkat;
  - toast dalam aplikasi juga berlabel;
  - **tidak pernah ditulis ke riwayat** (`simpanRiwayatRisikoTinggi` langsung keluar);
  - anti-spam 6 jam menghitung notifikasi simulasi dan asli **terpisah**, sehingga simulasi tidak menahan peringatan asli.
- **Tanpa kuota tambahan.** `risikoDesa` menghitung ulang risiko dari `DataCuaca` yang sama jika status simulasi berbeda dari risiko terakhir. Cache tidak perlu dibuat kedaluwarsa, dan tidak ada request Open-Meteo tambahan.
- **`pulihkan`** menghapus baris `SimulasiCuaca` dan `LevelRisiko` simulasi (beserta catatan notifikasinya). Riwayat dan data cuaca asli tidak disentuh, dan kunjungan berikutnya memakai lagi risiko asli.

**Pembersihan.** Simulasi Sariharjo (`34.04.12.2001`) cara lama dipulihkan: ambang `simulasi-34.04.12.2001`, riwayat "Risiko banjir TINGGI terdeteksi di Kabupaten Sleman" (satu-satunya riwayat otomatis di database), dan dua data cuaca sel `-7.7,110.4` sejak simulasi dihapus.

**Diuji:** unit (`terapkanSimulasi`, judul/isi/tag notifikasi) dan integrasi (simulasi tingkat kecamatan diwariskan ke desa, ambang tidak berubah, push berlabel, riwayat tidak bertambah, pulihkan kembali ke risiko asli, anti-spam terpisah).

## D-042 · Status layanan 112 per kab/kota dari Portal 112 Komdigi

**Konteks.** Kontak darurat selalu menampilkan 112, padahal layanan 112 diselenggarakan per kab/kota dan belum semua daerah memilikinya.

**Keputusan.**
- **Sumber:** peta "Penyelenggaraan Layanan Panggilan Darurat 112" di [layanan112.komdigi.go.id](https://layanan112.komdigi.go.id/). `npm run data:112` (`scripts/impor-layanan-112.ts`) membaca `/get/list_server` (kode kab/kota di peta) dan `/get/detail_server/{kode}` (status, tanggal). Portal menolak klien non-browser (HTTP 403), jadi skrip membuka portal lewat Chromium Playwright dan mengirim permintaan satu per satu dengan jeda 300 ms. Hasilnya di-commit ke `src/data/layanan-112.json` (termasuk `diambilPada`), dengan laporan di `prisma/data/laporan-impor-layanan-112.md`.
- **Arti status.** Portal tidak memberi label di data. Label diambil dari legenda peta (Sudah Launching, Uji Coba, Verifikasi, Dalam Pengajuan, Belum Permohonan). Status 1 = "Sudah Launching" dipastikan dari kode JS portal (`if(value.status == '1')` → "Sudah Launching {tgl_launching}"). Status 3–5 cocok dengan `/get/detail_status_launching/{id}`. Status 2 disebut "Buka Akses" oleh endpoint itu, dan mengikuti legenda dipakai label "Uji Coba". **Hanya status 1 yang dianggap sudah punya layanan 112.**
- **Tanggal:** tanggal launching hanya disimpan untuk status 1. Arti kolom tanggal untuk status lain tidak dijelaskan portal. Portal tidak mencantumkan "data per", jadi yang ditampilkan adalah tanggal pengambilan data.
- **Pencocokan kode.** Kode portal (`3209`) diubah ke format Kemendagri (`32.09`), lalu namanya dicocokkan (tanpa kata "Administrasi" yang dipakai Kemendagri untuk DKI Jakarta). 11 nama hanya beda ejaan. Kabupaten Toba Samosir berganti nama menjadi Toba (daftar `GANTI_NAMA` di skrip). Kabupaten Raja Ampat (`9205` di portal) kini `96.03` setelah pemekaran Papua Barat Daya, dan dipakai karena satu-satunya kab/kota bernama sama. Per 27 September 2026: 240 kab/kota di peta, semuanya cocok; 145 Sudah Launching, 64 Uji Coba, 9 Verifikasi, 21 Dalam Pengajuan.
- **Tidak disimpan:** nama/kontak PIC, nomor permohonan, dan data lain di detail portal. Yang disimpan hanya kode, nama di portal, status, dan tanggal launching.
- **Tampilan.** Nomor 112 tetap tampil sebagai nomor nasional, dengan keterangan untuk kab/kota wilayah terpilih: "sudah diluncurkan sejak {tanggal}", "masih berstatus {status}", atau "belum tercatat memiliki layanan 112". Dua keterangan terakhir ditambah "Jika tidak tersambung, hubungi nomor darurat lain di bawah". Aplikasi tidak mengklaim 112 pasti tidak bisa dipakai di daerah itu. Sumber dan tanggal pengambilan ditampilkan sebagai tautan.

**Diuji:** semua kode di data ada di daftar kab/kota Kemendagri, tidak ganda, tanggal launching wajib untuk status 1 dan kosong untuk status lain, serta ketiga variasi keterangan.

## D-043 · Nomor BPBD hanya dari sumber resmi terverifikasi

**Konteks.** D-007 tidak mengisi nomor BPBD. Kebutuhan baru: nomor boleh diisi, tetapi hanya jika ada sumber resmi.

**Keputusan.** `src/data/kontak-bpbd.ts` (`KONTAK_BPBD`, kunci = kode kab/kota atau provinsi pemilik BPBD) menyimpan `telepon`, `sumberNama`, `sumberUrl`, dan `diperiksaPada`. Tes mewajibkan URL `https` dengan domain `*.go.id` dan tanggal pemeriksaan. Nomor yang ada ditampilkan bersama tautan sumber dan tanggal pemeriksaannya. Selain itu ditampilkan "Nomor belum tersedia". **Buku Saku bukan sumber nomor.** Tabel "BPBD Provinsi Se-Indonesia" di Buku Saku BNPB (hal. 83–91) berasal dari 2019–2020. Nomor darurat yang salah berbahaya, jadi tabel itu hanya dipakai sebagai petunjuk. Nomor ditampilkan hanya jika cocok dengan situs resmi BPBD yang **masih aktif**, dan sumber serta tanggal pemeriksaannya dicatat.

- **Kontak ditampilkan dua tingkat:** BPBD kab/kota lalu BPBD provinsi (DKI Jakarta hanya provinsi). Masing-masing berisi nomor jika terverifikasi, selain itu "Nomor belum tersedia".
- **DIY (diperiksa 27 September 2026).** Petunjuk dari buku (hal. 85): 0274-555584 / 0274-555585 / 0274-555326. Di [bpbd.jogjaprov.go.id](https://bpbd.jogjaprov.go.id/beranda), footer "Pusdalops BPBD DIY" memuat *Phone (0274) 555585* dan *whatsapp (0274) 555584*, dan tombol "Lapor via WA" mengarah ke `62274555584`. Situs dianggap aktif karena berita terbarunya bertanggal 24 September 2026. Yang dipakai: **(0274) 555585**, dengan keterangan WhatsApp (0274) 555584. 0274-555326 dari buku kini tercatat sebagai nomor fax, dan nomor kantor di situs, (0274) 555836, berbeda dari buku. Keduanya tidak dipakai.
- **Provinsi lain dan semua BPBD kab/kota** tetap "Nomor belum tersedia" sampai dicocokkan dengan cara yang sama.
- `npm run cek:sumber` membuka halaman sumber setiap nomor BPBD dan **gagal jika nomornya tidak lagi tercantum** di halaman itu (spasi disamakan dulu). Dengan begitu, nomor yang berubah di situs resmi akan ketahuan.

## D-044 · Detail Mitigasi dari Buku Saku BNPB, dengan halaman sumber (menyimpang dari UML)

**Konteks.** Isi Detail Mitigasi (rekomendasi) sebelumnya ditulis sendiri tanpa sumber. Isinya harus berasal dari panduan resmi BNPB dan mencantumkan halaman sumbernya.

**Sumber yang diperiksa.**
- *Pengenalan Karakteristik Bencana dan Upaya Mitigasinya di Indonesia* (BAKORNAS PB, edisi II 2007, `bnpb.go.id/.../pubs/470.pdf`) **tidak dipakai**. Bab banjirnya (hal. 17–25) berisi mitigasi kelembagaan (POKJA, SATLAK, tanggul, pengerukan), bukan langkah untuk warga. Bagian yang menyangkut warga hanya "Peranserta Masyarakat" (hal. 24–25), dan lembaga yang disebut sudah tidak ada sejak BNPB berdiri pada 2008.
- **Dipakai:** *Buku Saku Tanggap Tangkas Tangguh Menghadapi Bencana* (BNPB, ISBN 978-602-5693-05-2), [PDF di www.bnpb.go.id](https://www.bnpb.go.id/storage/app/media/Buku%20BNPB/Buku%20Saku%20Bencana%20BNPB.pdf). Bab Banjir dibagi Prabencana (hal. 33–35), Saat Bencana (hal. 36–37), dan Pascabencana (hal. 38–39). Catatan edisi: halaman impresum mencantumkan cetakan keempat Maret 2019, tetapi isinya menyebut peristiwa Juli 2020 (Satgas COVID-19), jadi file ini revisi yang lebih baru tanpa impresum yang diperbarui. Edisi 2012 (`pubs/478.pdf`) tidak dipakai karena lebih lama.

**Keputusan.**
- `Rekomendasi` mendapat kolom `bagian` (`SIAGA` | `JIKA_BANJIR`, default `SIAGA`), `sumberNama`, dan `sumberUrl` (migrasi `20260927120000_sumber_rekomendasi`). Validator hanya menerima URL `https` dan menolak `JIKA_BANJIR` di luar level TINGGI.
- **Level risiko adalah potensi banjir, bukan banjir yang sedang terjadi.** Pemetaan: RENDAH → kesiapsiagaan prabencana (hal. 33–35); SEDANG → persiapan evakuasi prabencana dan memantau informasi (hal. 33–34, 36); TINGGI → siaga evakuasi (hal. 36–37), ditambah bagian terpisah **"Jika banjir terjadi"** dari panduan saat bencana (hal. 36–37).
- **Pascabencana** (hal. 38–39) menjadi artikel Informasi UMUM "Setelah Banjir Surut: Langkah Aman Menurut BNPB", sehingga selalu bisa dibuka tanpa bergantung level. Bagian "Jika banjir terjadi" menautkan ke halaman Informasi.
- Setiap butir adalah parafrase dekat dari buku dan tidak menambah hal yang tidak disebut buku. `sumberNama` diakhiri halaman cetak ("…, hal. 36"). `sumberUrl` memakai `#page=` ke halaman PDF, yaitu halaman cetak + 2 (diuji). UI menampilkan tautan halaman per butir dan nama dokumen sekali di bawah daftar.
- Rekomendasi lama tanpa sumber dihapus, termasuk "Hubungi 112 …": kontak darurat sudah punya bagian sendiri (D-042).
- Artikel "Nomor Darurat yang Perlu Disimpan" ditambah keterangan bahwa 112 diselenggarakan per kab/kota dan statusnya tampil di Kontak darurat.
- `npm run cek:sumber` ikut memeriksa dokumen sumber rekomendasi (sekali per dokumen).

## D-045 · Plus Jakarta Sans lewat `next/font`, variabel di `<html>`

Font teks diganti dari Geist ke **Plus Jakarta Sans** (`next/font/google`, font variabel 200–800, `display: swap`, di-host sendiri saat build). Geist Mono tetap dipakai untuk `--font-mono`.

**Bug lama yang ikut diperbaiki:** kelas variabel `next/font` sebelumnya dipasang di `<body>`, padahal Tailwind menerapkan `font-family: var(--font-sans)` di `<html>`. Di `<html>` variabelnya tidak terdefinisi, sehingga seluruh aplikasi selama ini tampil dengan font sistem, dan Geist tidak pernah terpakai. Kelas variabel kini dipasang di `<html>`. Sudah diperiksa di browser: `font-family` di `<html>` = `"Plus Jakarta Sans", "Plus Jakarta Sans Fallback"`, dan fontnya berstatus `loaded`.

## D-046 · Desain ulang: Beranda dan shell aplikasi

**Sumber desain.** Kanvas "Siap Banjir — Desain Ulang" (artefak Design di aplikasi Claude). Beranda punya tiga board (Risiko Rendah/Sedang/Tinggi), yang ternyata satu komponen dengan parameter `level`. Desain dibaca dari berkas board-nya, dan kanvas tidak diubah.

**Keputusan.**
- **Token warna mengikuti kanvas** (`globals.css`, mode terang): latar `#F3F5F9`, teks `#0E1726`, biru utama `#1742C9`, garis `#D5DCE6`, merah darurat `#B4141C`. Tiap level punya warna solid, tint, garis, dan teks: Rendah `#0A6B31`, Sedang `#F5C400` dengan teks `#1B1600`, Tinggi `#B4141C`. Blok `.dark` tidak diubah karena tidak ada kode yang mengaktifkannya.
- **Shell global** (dipakai semua halaman): logo perisai dengan tetes air, tombol **Darurat** merah di header, bottom nav dengan penanda pil untuk menu aktif, dan footer berisi disclaimer + atribusi Open-Meteo. Baris "Darurat? Hubungi 112" dihapus dari footer karena digantikan tombol Darurat.
- **Beranda:** wilayah dipantau (→ Pengaturan), kartu level (badge + jam data, ilustrasi air 3D, skala tiga level, deskripsi, ajakan ke halaman Risiko), kartu Cuaca terkini (→ Cuaca) dan Peringatan dini (→ Pengaturan), serta kartu Kontak darurat yang merah penuh saat level Tinggi.
  - **Judul kartu level memakai `deskripsi` asli dari mesin risiko** (mis. "Risiko TINGGI karena curah hujan 24 jam terakhir 60 mm."), bukan teks contoh di kanvas. Kalimat tindakan dan teks tombol per level mengikuti kanvas (`GAYA_LEVEL.ringkasan` / `ajakan`). `pesan` yang dipakai halaman Risiko belum diubah.
  - "Hujan 24 jam" = nilai parameter `hujan_24jam` dari perhitungan risiko, diwarnai sesuai level parameter itu. Ikon cuaca mengikuti kode cuaca asli.
  - Risiko hasil simulasi (D-041) diberi kotak "SIMULASI: level ini hasil uji coba…" di kartu level.
  - Data cadangan/hemat kuota tetap diberi peringatan (`StatusData`) di bawah kartu level.
  - Kartu Peringatan dini menampilkan status perangkat (Aktif + levelnya, Belum aktif, Nonaktif, Izin ditolak, Tidak tersedia). Kalau statusnya "Belum aktif", kartu langsung membuka dialog izin.
  - **Tanpa wilayah terpilih** (tidak ada di kanvas): Beranda menampilkan pemilih wilayah seperti sebelumnya, supaya pengguna baru tidak perlu pindah ke Pengaturan dulu.
  - Grafik 48 jam, kartu cuaca lengkap, dan tombol peringatan lama dihapus dari Beranda, sesuai kanvas. Grafik ada di halaman Cuaca. `KartuRingkasanRisiko` dan `TombolAktifkanPeringatan` dihapus karena tidak dipakai lagi.
- **Ilustrasi air** di-port langsung dari kanvas (CSS 3D transform, tanpa library): tinggi air 4/10/20 px dan 0/14/26 tetes hujan untuk Rendah/Sedang/Tinggi. Diberi keterangan "Ilustrasi level risiko, bukan ketinggian air sebenarnya". Semua animasi dimatikan saat `prefers-reduced-motion`.
- **Aksesibilitas:** `h1` tersembunyi "Siap Banjir: Beranda", skala level berupa `<ol>` dengan `aria-current="step"` dan teks "Saat ini" (tidak hanya warna), ilustrasi diberi `role="img"` + label, dan fokus keyboard ditandai outline biru 3 px.
- **Sementara:** tombol Darurat dan kartu Kontak darurat mengarah ke `/risiko#kontak-darurat`. Keduanya akan diarahkan ke halaman Kontak ketika board "Nomor Darurat" diimplementasikan.

**Diuji:** e2e alur utama disesuaikan (wilayah dipantau → Pengaturan, ilustrasi, skala, hujan 24 jam, kontak). Ada tes baru untuk Beranda risiko tinggi (badge, label simulasi, ajakan penyelamatan, kartu kontak merah → bagian kontak). Assertion dibatasi ke `#konten` karena selama streaming isi Suspense sempat ada di template tersembunyi di akhir `<body>`.
