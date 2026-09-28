import { Grid3x3 } from "lucide-react";

/** Kalimat transparansi lokasi; dipakai juga di kartu level halaman Risiko. */
export function teksCatatanLokasi(koordinatPerkiraan: boolean) {
  return (
    "Data cuaca berlaku untuk area ±11 km di sekitar wilayah ini." +
    (koordinatPerkiraan ? " Titik pusat desa/kelurahan ini belum tersedia, jadi dipakai titik pusat kecamatannya." : "")
  );
}

/** Transparansi: cuaca berlaku untuk sel grid ±11 km; koordinat desa bisa perkiraan. */
export function CatatanLokasi({ koordinatPerkiraan }: { koordinatPerkiraan: boolean }) {
  return (
    <p className="flex gap-1.5 text-xs text-muted-foreground">
      <Grid3x3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{teksCatatanLokasi(koordinatPerkiraan)}</span>
    </p>
  );
}
