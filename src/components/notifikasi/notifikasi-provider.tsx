"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { sudahDitanya, tandaiSudahDitanya } from "@/lib/push-client";
import { DialogIzinNotifikasi } from "./dialog-izin-notifikasi";

type WilayahDialog = { idWilayah: string; namaWilayah: string };

type NilaiKonteks = ReturnType<typeof usePushSubscription> & {
  /** Buka dialog izin kustom (sebelum izin browser). */
  bukaDialogIzin: (wilayah: WilayahDialog) => void;
  /** Dipanggil setelah aturLokasi(wilayah): tawarkan izin atau sinkronkan wilayah langganan. */
  setelahPilihWilayah: (wilayah: WilayahDialog) => void;
};

const Konteks = createContext<NilaiKonteks | null>(null);

export function useNotifikasi() {
  const nilai = useContext(Konteks);
  if (!nilai) throw new Error("useNotifikasi harus dipakai di dalam NotifikasiProvider");
  return nilai;
}

export function pesanGalat(err: unknown) {
  return err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
}

export function NotifikasiProvider({ children }: { children: React.ReactNode }) {
  const push = usePushSubscription();
  const [dialog, setDialog] = useState<WilayahDialog | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const { status, perbarui, aktifkan } = push;

  const bukaDialogIzin = useCallback((wilayah: WilayahDialog) => setDialog(wilayah), []);

  const setelahPilihWilayah = useCallback(
    (wilayah: WilayahDialog) => {
      if (status === "aktif") {
        perbarui({ idWilayah: wilayah.idWilayah })
          .then(() => toast.success(`Peringatan kini untuk ${wilayah.namaWilayah}.`))
          .catch((err: unknown) => toast.error(pesanGalat(err)));
      } else if (status === "belum-aktif" && !sudahDitanya()) {
        setDialog(wilayah);
      }
    },
    [status, perbarui],
  );

  // [izin notifikasi] → daftarkanPerangkat() → aktifkan(); [else] → lanjut tanpa notifikasi.
  const izinkan = useCallback(async () => {
    if (!dialog) return;
    setSibuk(true);
    tandaiSudahDitanya();
    try {
      const berhasil = await aktifkan(dialog.idWilayah);
      if (berhasil) toast.success(`Peringatan aktif untuk ${dialog.namaWilayah}.`);
      else toast.info("Izin notifikasi tidak diberikan. Anda tetap bisa memantau risiko di aplikasi.");
      setDialog(null);
    } catch (err) {
      toast.error(pesanGalat(err));
    } finally {
      setSibuk(false);
    }
  }, [aktifkan, dialog]);

  const nantiSaja = useCallback(() => {
    tandaiSudahDitanya();
    setDialog(null);
  }, []);

  return (
    <Konteks.Provider value={{ ...push, bukaDialogIzin, setelahPilihWilayah }}>
      {children}
      <DialogIzinNotifikasi
        terbuka={dialog !== null}
        namaWilayah={dialog?.namaWilayah ?? ""}
        ditolak={status === "ditolak"}
        tidakDidukung={status === "tidak-didukung" || status === "belum-dikonfigurasi"}
        sibuk={sibuk}
        onIzinkan={izinkan}
        onNanti={nantiSaja}
      />
    </Konteks.Provider>
  );
}
