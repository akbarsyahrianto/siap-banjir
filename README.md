# Siap Banjir

Aplikasi web untuk memantau risiko banjir dan memberi peringatan dini berdasarkan data cuaca [Open-Meteo](https://open-meteo.com/).

> Level risiko pada Siap Banjir adalah estimasi berdasarkan data cuaca Open-Meteo dan ambang batas risiko yang telah ditentukan. Informasi ini bukan peringatan resmi. Selalu ikuti arahan BMKG, BPBD, dan pemerintah setempat.

README lengkap (VAPID, cron, deploy) menyusul di Fase 5. Keputusan desain dicatat di [docs/DECISIONS.md](docs/DECISIONS.md).

## Setup lokal (Windows)

Prasyarat: Node.js 20+ dan PostgreSQL 17 (diinstal langsung, tanpa Docker; lihat D-001 di DECISIONS.md).

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
npm run db:seed      # isi wilayah, ambang risiko, informasi, persiapan, rekomendasi

# 3. Kunci Web Push (VAPID): salin publicKey & privateKey ke .env
npx web-push generate-vapid-keys --json

npm run dev          # http://localhost:3000
```

Notifikasi push hanya bekerja di `localhost` atau HTTPS. Buka **Pengaturan → Kirim notifikasi uji** untuk mengecek.

## Script

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit test (Vitest) |
| `npm run test:integration` | Integration test ke database `.env` (jangan ke produksi) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Isi ulang data seed (idempoten) |
| `npm run db:reset` | Hapus database, migrasi ulang, dan seed |
| `npm run db:studio` | Prisma Studio |

Data cuaca: Open-Meteo.com ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
