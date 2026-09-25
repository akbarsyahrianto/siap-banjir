const RADIUS_BUMI_KM = 6371;

const rad = (derajat: number) => (derajat * Math.PI) / 180;

/** Jarak dua titik (km), rumus haversine. */
export function jarakKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIUS_BUMI_KM * Math.asin(Math.sqrt(a));
}

type TitikWilayah = { idWilayah: string; koordinatLatitude: number; koordinatLongitude: number };

/** Wilayah terdekat dari posisi GPS pengguna, beserta jaraknya. */
export function cariWilayahTerdekat<T extends TitikWilayah>(lat: number, lon: number, daftar: T[]) {
  let terdekat: { wilayah: T; jarakKm: number } | null = null;
  for (const w of daftar) {
    const jarak = jarakKm(lat, lon, w.koordinatLatitude, w.koordinatLongitude);
    if (!terdekat || jarak < terdekat.jarakKm) terdekat = { wilayah: w, jarakKm: jarak };
  }
  return terdekat;
}
