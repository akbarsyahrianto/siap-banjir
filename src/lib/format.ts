const ZONA = "Asia/Jakarta";

function bagian(date: Date, opsi: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, ...opsi }).formatToParts(date);
  return (tipe: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === tipe)?.value ?? "";
}

/** "13:05" (WIB). */
export function formatJam(date: Date) {
  const ambil = bagian(date, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${ambil("hour")}:${ambil("minute")}`;
}

/** "Kamis, 25 September 2026" (WIB). */
export function formatTanggalPanjang(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** "25 Sep 2026". */
export function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, day: "numeric", month: "short", year: "numeric" }).format(
    date,
  );
}

/** Tanggal lokal "2026-09-25" dari Open-Meteo → "Kam, 25 Sep". */
export function formatTanggalLokal(tanggal: string) {
  const [y, m, d] = tanggal.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
  return new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(
    date,
  );
}

export function formatAngka(n: number, digit = 1) {
  return n.toLocaleString("id-ID", { maximumFractionDigits: digit });
}
