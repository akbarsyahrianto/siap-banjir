"use client";

import { useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { PilihWilayah, type CaraPilih } from "@/components/wilayah/pilih-wilayah";
import { PARAM_UBAH_WILAYAH } from "@/lib/constants";
import type { DataPemilih } from "@/server/services/wilayah.service";

/**
 * Wilayah yang sedang dipantau. "Ubah" membuka pemilih wilayah langsung di Beranda (D-063).
 * Pilihan lewat pencarian atau bertingkat menutup pemilih; hasil GPS membiarkannya terbuka
 * agar pesan "desa/kelurahan terdekat" tetap terbaca dan bisa dikoreksi dari daftar.
 */
export function WilayahDipantau({
  nama,
  pemilih,
  terbukaAwal = false,
}: {
  nama: string;
  pemilih: DataPemilih;
  terbukaAwal?: boolean;
}) {
  const id = useId();
  const [terbuka, setTerbuka] = useState(terbukaAwal);
  const tombol = useRef<HTMLButtonElement>(null);

  function tutup() {
    setTerbuka(false);
    tombol.current?.focus();
  }

  /** Ditutup pengguna tanpa memilih: hapus ?ubah=wilayah agar muat ulang tidak membuka pemilih lagi. */
  function tutupManual() {
    tutup();
    const url = new URL(window.location.href);
    if (url.searchParams.has(PARAM_UBAH_WILAYAH)) {
      url.searchParams.delete(PARAM_UBAH_WILAYAH);
      window.history.replaceState(window.history.state, "", url);
    }
  }

  // Memilih wilayah sudah mengganti URL ke ?wilayah=… (useWilayah), jadi URL tidak diubah di sini.
  function setelahPilih(cara: CaraPilih) {
    if (cara !== "gps") tutup();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        ref={tombol}
        type="button"
        aria-expanded={terbuka}
        aria-controls={terbuka ? `${id}-pemilih` : undefined}
        onClick={() => (terbuka ? tutupManual() : setTerbuka(true))}
        className="flex min-h-14 w-full items-center gap-2.5 rounded-2xl border bg-card px-3.5 py-2 text-left text-card-foreground"
      >
        <MapPin className="size-[22px] shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
        <span className="flex min-w-0 flex-col gap-px">
          <span className="text-[12px] font-semibold text-muted-foreground">Wilayah yang dipantau</span>
          <span className="text-[15px] font-bold">{nama}</span>
        </span>
        <span className="ml-auto shrink-0 pl-2 text-[14px] font-bold text-primary">
          {terbuka ? (
            <>
              Tutup<span className="sr-only"> pilihan wilayah</span>
            </>
          ) : (
            <>
              Ubah<span className="sr-only"> wilayah</span>
            </>
          )}
        </span>
      </button>

      {terbuka ? (
        <section
          id={`${id}-pemilih`}
          aria-label="Ubah wilayah"
          className="flex flex-col gap-3.5 rounded-[20px] border bg-card p-4"
        >
          <PilihWilayah data={pemilih} tungguKonten onTerpilih={setelahPilih} />
          <button
            type="button"
            onClick={tutupManual}
            className="min-h-12 rounded-xl border border-[#9aa6b8] bg-card text-[15px] font-bold text-[#2d3748] transition-colors hover:bg-[#f1f5fe]"
          >
            Selesai
          </button>
        </section>
      ) : null}
    </div>
  );
}
