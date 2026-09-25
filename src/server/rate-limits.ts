import { buatRateLimiter } from "@/lib/rate-limit";

// Satu instance per proses, dipakai bersama oleh route handler push.
export const limitLangganan = buatRateLimiter({ maks: 10, jendelaMs: 60_000 });
export const limitNotifikasiUji = buatRateLimiter({ maks: 3, jendelaMs: 60_000 });
