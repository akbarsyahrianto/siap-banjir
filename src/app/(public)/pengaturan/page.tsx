import type { Metadata } from "next";
import Link from "next/link";
import { Bell, MapPin, ShieldCheck } from "lucide-react";
import { KepalaHalaman } from "@/components/layout/kepala-halaman";
import { PengaturanNotifikasi } from "@/components/notifikasi/pengaturan-notifikasi";
import { URL_UBAH_WILAYAH } from "@/lib/constants";
import { muatWilayahTerpilih } from "@/server/wilayah-terpilih";

export const metadata: Metadata = { title: "Pengaturan" };

type Props = { searchParams: Promise<{ wilayah?: string | string[] }> };

const KARTU = "flex flex-col gap-3.5 rounded-[20px] border bg-card p-4 text-card-foreground";
const JUDUL_KARTU = "flex items-center gap-2 text-[18px] font-extrabold";

/**
 * Pengaturan (desain ulang, D-054): judul → kartu Notifikasi → catatan privasi.
 * Wilayah tidak diubah di sini; hanya ditampilkan, dengan tautan ke pemilih di Beranda (D-063).
 */
export default async function PengaturanPage({ searchParams }: Props) {
  const { wilayah } = await searchParams;
  const { desa, namaTerpilih } = await muatWilayahTerpilih(wilayah);
  const terpilih = desa && namaTerpilih ? { idWilayah: desa.wilayah.idWilayah, namaWilayah: namaTerpilih } : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <KepalaHalaman judul="Pengaturan" subjudul="Atur notifikasi peringatan banjir di perangkat ini." />

      <section aria-labelledby="judul-notif" className={KARTU}>
        <h2 id="judul-notif" className={JUDUL_KARTU}>
          <Bell className="size-[22px] text-primary" strokeWidth={2} aria-hidden="true" />
          Notifikasi
        </h2>
        {terpilih ? (
          <p className="flex items-center gap-2.5 rounded-[14px] bg-[#e8eefd] px-3.5 py-2">
            <MapPin className="size-5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
            <span className="flex min-w-0 flex-col gap-px">
              <span className="text-[12px] font-semibold text-[#3e4a5c]">Untuk wilayah</span>
              <span className="text-[15px] font-extrabold">{terpilih.namaWilayah}</span>
            </span>
            <Link
              href={URL_UBAH_WILAYAH}
              className="ml-auto inline-flex min-h-11 shrink-0 items-center pl-2 text-[14px] font-bold text-primary hover:text-primary-hover"
            >
              Ubah di Beranda<span className="sr-only">: wilayah</span>
            </Link>
          </p>
        ) : null}
        <PengaturanNotifikasi wilayah={terpilih} />
      </section>

      <p className="flex items-start gap-2.5 rounded-[14px] border bg-card px-3.5 py-3 text-[13px] leading-normal text-[#2d3748]">
        <ShieldCheck className="mt-px size-[18px] shrink-0 text-risk-rendah" strokeWidth={2.2} aria-hidden="true" />
        Siap Banjir tidak memakai akun dan tidak menyimpan nama atau nomor HP. Perangkat dikenali lewat token acak di
        browser ini dan langganan notifikasi push.
      </p>
    </div>
  );
}
