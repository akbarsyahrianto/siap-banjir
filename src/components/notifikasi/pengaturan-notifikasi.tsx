"use client";

import { useId, useState } from "react";
import { BellOff, BellRing, LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { LevelMinimum, StatusPush } from "@/hooks/usePushSubscription";
import { pesanGalat, useNotifikasi } from "./notifikasi-provider";

const KETERANGAN_STATUS: Record<StatusPush, string> = {
  memuat: "Memeriksa status notifikasi…",
  "tidak-didukung":
    "Browser ini tidak mendukung notifikasi push. Di iPhone/iPad, tambahkan Siap Banjir ke Layar Utama terlebih dahulu.",
  "belum-dikonfigurasi": "Notifikasi push belum dikonfigurasi di server.",
  ditolak:
    "Izin notifikasi ditolak. Buka pengaturan situs di browser (ikon gembok di bilah alamat), izinkan Notifikasi, lalu muat ulang halaman.",
  "belum-aktif": "Notifikasi belum aktif di perangkat ini.",
  aktif: "Notifikasi aktif. Anda akan menerima peringatan di perangkat ini.",
  nonaktif: "Notifikasi dinonaktifkan. Aktifkan lagi kapan saja.",
};

const OPSI_LEVEL: { nilai: LevelMinimum; label: string; keterangan: string }[] = [
  { nilai: "SEDANG", label: "Sedang dan Tinggi", keterangan: "Peringatan lebih awal (disarankan)" },
  { nilai: "TINGGI", label: "Hanya Tinggi", keterangan: "Hanya saat bahaya potensi banjir" },
];

export function PengaturanNotifikasi({ wilayah }: { wilayah: { idWilayah: string; namaWilayah: string } | null }) {
  const { status, langganan, aktifkan, nonaktifkan, perbarui, kirimUji, bukaDialogIzin } = useNotifikasi();
  const [sibuk, setSibuk] = useState<null | "sakelar" | "level" | "uji">(null);
  const idSakelar = useId();

  const aktif = status === "aktif";
  const bisaDiubah = status === "aktif" || status === "nonaktif" || status === "belum-aktif";
  const levelMinimum = langganan?.levelMinimum ?? "SEDANG";

  async function jalankan(jenis: NonNullable<typeof sibuk>, aksi: () => Promise<void>) {
    setSibuk(jenis);
    try {
      await aksi();
    } catch (err) {
      toast.error(pesanGalat(err));
    } finally {
      setSibuk(null);
    }
  }

  function ubahSakelar(nyala: boolean) {
    if (!wilayah) return;
    if (!nyala) {
      void jalankan("sakelar", async () => {
        await nonaktifkan();
        toast.info("Notifikasi dinonaktifkan.");
      });
      return;
    }
    // Izin browser belum pernah diminta → tampilkan dialog penjelasan dulu.
    if (Notification.permission === "default") {
      bukaDialogIzin(wilayah);
      return;
    }
    void jalankan("sakelar", async () => {
      if (await aktifkan(wilayah.idWilayah, levelMinimum)) toast.success(`Peringatan aktif untuk ${wilayah.namaWilayah}.`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {aktif ? (
            <BellRing className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <BellOff className="mt-0.5 size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <div>
            <label htmlFor={idSakelar} className="text-lg font-semibold">
              Peringatan banjir
            </label>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {KETERANGAN_STATUS[status]}
            </p>
            {!wilayah && bisaDiubah ? (
              <p className="mt-1 text-sm font-medium">Pilih wilayah terlebih dahulu.</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sibuk === "sakelar" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          <Switch
            id={idSakelar}
            checked={aktif}
            onCheckedChange={ubahSakelar}
            disabled={!bisaDiubah || !wilayah || sibuk !== null}
            className="scale-125"
          />
        </div>
      </div>

      <fieldset disabled={!aktif || sibuk !== null} className="space-y-3 disabled:opacity-60">
        <legend className="mb-2 font-semibold">Kirim peringatan untuk level</legend>
        <RadioGroup
          value={levelMinimum}
          onValueChange={(v) =>
            void jalankan("level", async () => {
              await perbarui({ levelMinimum: v === "TINGGI" ? "TINGGI" : "SEDANG" });
              toast.success("Level minimum disimpan.");
            })
          }
          className="gap-2"
        >
          {OPSI_LEVEL.map((o) => (
            <label
              key={o.nilai}
              htmlFor={`${idSakelar}-${o.nilai}`}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem id={`${idSakelar}-${o.nilai}`} value={o.nilai} className="size-5" />
              <span>
                <span className="block font-medium">{o.label}</span>
                <span className="block text-sm text-muted-foreground">{o.keterangan}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="lg"
          disabled={!aktif || sibuk !== null}
          onClick={() =>
            void jalankan("uji", async () => {
              await kirimUji();
              toast.success("Notifikasi uji dikirim. Periksa notifikasi perangkat Anda.");
            })
          }
        >
          {sibuk === "uji" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          Kirim notifikasi uji
        </Button>
        <p className="text-sm text-muted-foreground">
          Peringatan yang sama tidak dikirim ulang dalam 6 jam, kecuali level naik dari Sedang ke Tinggi.
        </p>
      </div>
    </div>
  );
}
