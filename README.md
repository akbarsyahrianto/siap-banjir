# Siap Banjir

Aplikasi web untuk memantau risiko banjir dan memberi peringatan dini berdasarkan data cuaca [Open-Meteo](https://open-meteo.com/). Pengguna memilih wilayah, melihat cuaca dan prakiraan, mengetahui **level risiko banjir (Rendah / Sedang / Tinggi)**, menerima **notifikasi push**, lalu mengikuti **persiapan dini** dan **rekomendasi tindakan** sesuai level. Tidak perlu login.

> Level risiko pada Siap Banjir adalah estimasi berdasarkan data cuaca Open-Meteo dan ambang batas risiko yang telah ditentukan. Informasi ini bukan peringatan resmi. Selalu ikuti arahan BMKG, BPBD, dan pemerintah setempat.

Keputusan desain dan penyimpangan dari rancangan dicatat di [docs/DECISIONS.md](docs/DECISIONS.md).

## Daftar isi

- [Fitur](#fitur)
- [Arsitektur](#arsitektur)
- [Setup lokal (Windows)](#setup-lokal-windows)
- [Variabel lingkungan](#variabel-lingkungan)
- [Cron: update cuaca otomatis](#cron-update-cuaca-otomatis)
- [Simulasi risiko tinggi](#simulasi-risiko-tinggi)
- [Testing](#testing)
- [Mengubah ambang & konten](#mengubah-ambang--konten)
- [Deploy ke Vercel + Neon / Supabase](#deploy-ke-vercel--neon--supabase)
- [Keamanan](#keamanan)
- [Script npm](#script-npm)

## Fitur

| Halaman | Isi |
|---|---|
| `/` Beranda | Pilih wilayah (daftar atau GPS), kartu cuaca terkini, badge level risiko, grafik curah hujan 48 jam, tombol "Aktifkan Peringatan" |
| `/risiko` | Gauge skor, parameter pemicu, Detail Penanganan (Checklist Siaga + Detail Mitigasi), kontak darurat. Dikendalikan state machine; refresh tiap 30 menit |
| `/cuaca` | Prakiraan 3 hari per jam dan harian |
| `/informasi` | Artikel umum banjir & riwayat kejadian banjir per wilayah |
| `/pengaturan` | Wilayah, aktif/nonaktif notifikasi, level minimum, kirim notifikasi uji |
| `/offline` | Halaman cadangan PWA saat tidak ada koneksi |

- **Rule engine risiko:** ambang batas dibaca dari tabel `AmbangRisiko` (tidak di-hard-code), ambang khusus wilayah menimpa global, level akhir = level tertinggi dari semua parameter.
- **Notifikasi push** (Web Push + VAPID): anti-spam 6 jam (kecuali level naik), subscription 404/410 dihapus otomatis. Klik notifikasi membuka `/risiko?wilayah={id}#penanganan`.
- **PWA:** bisa di-install di HP, halaman yang pernah dibuka tetap tampil saat offline.
- **Cron:** update cuaca semua wilayah → hitung risiko → kirim notifikasi → simpan riwayat risiko tinggi.

## Arsitektur

```
src/
  app/(public)/          halaman (Beranda, risiko, cuaca, informasi, pengaturan, offline)
  app/api/               wilayah, cuaca, risiko, informasi, persiapan, rekomendasi (GET)
                         push/subscribe, push/unsubscribe, push/test, push/langganan
                         cron/update-weather
  components/            ui/ (shadcn), cuaca/, risiko/, notifikasi/, wilayah/, layout/
  server/
    integrations/        open-meteo.ts (ambilDataCuaca), web-push.ts
    services/            weather, risk, notification, subscription, content,
                         pemantauan (orkestrasi sequence diagram), riwayat
    validators/          skema Zod
  lib/                   mesin-risiko.ts (state machine), weather-code, format, geo, ...
  hooks/                 useWilayah, usePushSubscription, useRiskState
public/                  sw.js, manifest.json, icons/
prisma/                  schema.prisma, migrations/, seed.ts, seed-data.ts
tests/                   unit/, integration/, e2e/
scripts/                 cron-lokal.ts, simulasi-risiko.ts, buat-ikon.mjs
```

Pemetaan UML: operasi class diagram (`hitungLevelRisiko()`, `cekAmbang()`, `ambilDataCuaca()`, `cariLanggananAktif()`, `kirimNotifikasi()`, …) adalah fungsi service di `src/server/services/`. Operasi tambah/ubah/hapus konten tidak diekspos sebagai halaman/API, hanya dipakai `prisma/seed.ts`. Aktor hanya **Pengguna** dan **Open-Meteo**; tidak ada admin atau login.

## Setup lokal (Windows)

Prasyarat: Node.js 20+ dan PostgreSQL 17. PostgreSQL diinstal langsung, tanpa Docker (DECISIONS D-001).

```powershell
# 1. PostgreSQL (sekali saja)
winget install --id PostgreSQL.PostgreSQL.17 -e --override "--mode unattended --unattendedmodeui none --superpassword postgres --serverport 5432 --disable-components stackbuilder,pgAdmin"
$env:PGPASSWORD = 'postgres'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE ROLE siapbanjir WITH LOGIN PASSWORD 'siapbanjir' CREATEDB;"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE siapbanjir OWNER siapbanjir ENCODING 'UTF8';"

# 2. Aplikasi
Copy-Item .env.example .env
npm install
npm run db:migrate   # terapkan migrasi
npm run db:seed      # 14 wilayah, ambang risiko, informasi, persiapan, rekomendasi

# 3. Kunci Web Push (VAPID): salin publicKey → NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey → VAPID_PRIVATE_KEY
npx web-push generate-vapid-keys --json

# 4. CRON_SECRET acak
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run dev          # http://localhost:3000
```

> PowerShell 5.1: `Set-Content -Encoding utf8` menambahkan BOM yang merusak baris pertama `.env`. Edit `.env` dengan editor teks biasa.

Notifikasi push dan PWA hanya bekerja di `localhost` atau HTTPS. Di iPhone/iPad, notifikasi push hanya tersedia setelah Siap Banjir ditambahkan ke Layar Utama (Safari → Bagikan → Tambah ke Layar Utama). Cek dengan **Pengaturan → Kirim notifikasi uji**.

## Variabel lingkungan

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ya | Koneksi runtime PostgreSQL. Di Neon/Supabase: URL **pooled** + `pgbouncer=true` |
| `DIRECT_URL` | ya | Koneksi langsung untuk migrasi. Lokal: sama dengan `DATABASE_URL` |
| `OPEN_METEO_BASE_URL` | tidak | Default `https://api.open-meteo.com/v1/forecast` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | untuk push | Kunci publik VAPID (boleh terlihat browser) |
| `VAPID_PRIVATE_KEY` | untuk push | Kunci privat VAPID. **Hanya di server**, jangan diberi awalan `NEXT_PUBLIC_` |
| `VAPID_SUBJECT` | untuk push | `mailto:` alamat pengelola yang asli (Apple bisa menolak alamat contoh) |
| `CRON_SECRET` | untuk cron | Minimal 16 karakter acak; tanpa ini endpoint cron selalu menolak |
| `NEXT_PUBLIC_APP_URL` | tidak | URL aplikasi, dipakai `npm run cron:lokal` |

`NEXT_PUBLIC_*` ditanam saat build; ubah nilainya → build ulang.

## Cron: update cuaca otomatis

`GET|POST /api/cron/update-weather` wajib header `Authorization: Bearer <CRON_SECRET>`. Untuk setiap wilayah (4 paralel): ambil data cuaca (memakai cache < 30 menit) → hitung risiko → jika risiko baru Sedang/Tinggi, kirim notifikasi dan simpan riwayat. Tambahkan `?paksa=1` untuk mengabaikan cache. Respons berisi ringkasan per wilayah.

| Cara | Konfigurasi |
|---|---|
| **Lokal** | `npm run cron:lokal` di terminal kedua (memanggil sekarang lalu tiap 30 menit) |
| **Vercel Cron** | `vercel.json` sudah berisi jadwal `*/30 * * * *`. Vercel otomatis mengirim `Authorization: Bearer $CRON_SECRET` jika env `CRON_SECRET` diatur. **Paket Hobby hanya mengizinkan cron harian**; untuk 30 menit perlu Pro atau GitHub Actions |
| **GitHub Actions** | `.github/workflows/update-weather.yml`. Atur secret repo `APP_URL` (misal `https://siap-banjir.vercel.app`) dan `CRON_SECRET`. Jadwal GitHub bisa terlambat beberapa menit |

Panggil manual:

```powershell
$s = (Select-String -Path .env -Pattern '^CRON_SECRET="(.*)"').Matches.Groups[1].Value
Invoke-RestMethod "http://localhost:3000/api/cron/update-weather?paksa=1" -Headers @{ Authorization = "Bearer $s" }
```

## Simulasi risiko tinggi

Untuk melihat alur Bahaya → Detail Penanganan tanpa menunggu hujan lebat. Simulasi memasang ambang khusus sementara di database (kode tidak diubah) dan membuat cache cuaca wilayah itu kedaluwarsa.

```powershell
npm run simulasi -- status                           # daftar wilayah & simulasi aktif
npm run simulasi -- aktifkan kota-medan TINGGI       # atau SEDANG
# buka http://localhost:3000/risiko?wilayah=kota-medan, atau jalankan cron
npm run simulasi -- pulihkan kota-medan              # hapus ambang, riwayat & data simulasi
```

> Perangkat yang berlangganan notifikasi untuk wilayah itu akan menerima **push sungguhan**. Script menolak berjalan jika `DATABASE_URL` bukan database lokal (kecuali `--izinkan-remote`).

## Testing

| Perintah | Isi | Kebutuhan |
|---|---|---|
| `npm test` | Unit test (Vitest): rule engine risiko, turunan parameter Open-Meteo, state machine, anti-spam, validasi endpoint push, cron, data seed | — |
| `npm run test:integration` | `prosesPeringatan()` & riwayat terhadap database asli (push di-mock) | PostgreSQL dari `.env`. **Jangan ke database produksi** |
| `npm run test:e2e` | Playwright (Pixel 7 + Desktop Chrome): pilih wilayah → lihat risiko → aktifkan notifikasi → atur notifikasi; GPS; state machine (wilayah disimulasikan TINGGI); deep link; PWA offline; security headers | `npm run build` lebih dulu, database ter-seed, internet (Open-Meteo) |

Pertama kali: `npx playwright install chromium`. E2E menjalankan server produksi di port 3100 dan mensimulasikan risiko TINGGI di `kota-pekalongan` selama test (dipulihkan otomatis). Chromium headless tidak bisa berlangganan push sungguhan, jadi `PushManager`/`Notification` di-stub; request ke server tetap asli.

## Mengubah ambang & konten

Tidak ada halaman admin (sesuai rancangan). Ambang risiko, wilayah, informasi, persiapan dini, dan rekomendasi diatur di `prisma/seed-data.ts`, lalu:

```powershell
npm run db:seed   # idempoten: wilayah di-upsert, tabel konten diisi ulang
```

Ambang khusus wilayah: tambahkan entri `ambangSeed` dengan `idWilayah`. Untuk parameter itu, ambang global tidak dipakai di wilayah tersebut. Ikon PWA dibuat dari logo dengan `node scripts/buat-ikon.mjs`.

## Deploy ke Vercel + Neon / Supabase

1. **Database**
   - **Neon:** buat project, lalu ambil dua connection string:
     - `DATABASE_URL` = URL *pooled* (host berakhiran `-pooler`), tambahkan `?sslmode=require&pgbouncer=true`
     - `DIRECT_URL` = URL langsung (tanpa `-pooler`), `?sslmode=require`
   - **Supabase:** Project Settings → Database:
     - `DATABASE_URL` = *Transaction pooler* (port 6543) + `?pgbouncer=true&connection_limit=1`
     - `DIRECT_URL` = *Session pooler* / direct (port 5432)
2. **Vercel:** import repo, framework Next.js.
   - **Build Command:** `npm run vercel-build` (generate Prisma Client, `prisma migrate deploy`, lalu `next build`).
   - **Environment Variables:** semua variabel di atas. `NEXT_PUBLIC_APP_URL` = domain produksi.
3. **Seed sekali** dari komputer lokal, menunjuk ke database produksi:
   ```powershell
   $env:DATABASE_URL = "<DIRECT_URL produksi>"; $env:DIRECT_URL = $env:DATABASE_URL
   npm run db:seed
   $env:DATABASE_URL = $null; $env:DIRECT_URL = $null
   ```
4. **Cron:** Vercel Cron (Pro) atau GitHub Actions (lihat [Cron](#cron-update-cuaca-otomatis)).
5. **Cek:** buka situs → pilih wilayah → aktifkan notifikasi → Pengaturan → Kirim notifikasi uji.

Catatan: rate limit memakai memori proses, sehingga di Vercel batasnya berlaku per instance (DECISIONS D-019).

## Keamanan

- Semua input API divalidasi Zod. API publik hanya GET, kecuali `push/subscribe`, `push/unsubscribe`, `push/test` (wajib `Content-Type: application/json`).
- Rate limit per IP: subscribe/unsubscribe 10/menit, notifikasi uji 3/menit, API cuaca/risiko 60/menit.
- Endpoint push dibatasi ke push service resmi browser (mencegah SSRF).
- Endpoint cron: `Authorization: Bearer CRON_SECRET`, perbandingan constant-time.
- VAPID private key hanya di env server.
- Tidak ada data pribadi: perangkat dikenali lewat token acak + push subscription.
- Security headers: CSP dasar, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. Header `X-Powered-By` dimatikan. HSTS diatur oleh hosting (Vercel).

## Script npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run vercel-build` | Build untuk Vercel (termasuk `prisma migrate deploy`) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit test |
| `npm run test:integration` | Integration test ke database `.env` (jangan ke produksi) |
| `npm run test:e2e` | E2E Playwright (butuh build) |
| `npm run cron:lokal` | Panggil endpoint cron sekarang & tiap 30 menit |
| `npm run simulasi -- <perintah>` | Simulasi risiko (lihat di atas) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Isi ulang data seed (idempoten) |
| `npm run db:reset` | Hapus database, migrasi ulang, dan seed |
| `npm run db:studio` | Prisma Studio |

Data cuaca: [Open-Meteo.com](https://open-meteo.com/) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
