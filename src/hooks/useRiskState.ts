"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { useNotifikasi } from "@/components/notifikasi/notifikasi-provider";
import { konteksAwal, transisi, type KanalPeringatan } from "@/lib/mesin-risiko";
import type { PenangananKlien, RisikoKlien } from "@/lib/tipe-risiko";
import type { TitikGrafikJam } from "@/server/services/seri-cuaca";

export const INTERVAL_REFRESH_MS = 30 * 60 * 1000;

async function ambilJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const pesan =
      json && typeof json === "object" && "error" in json && typeof json.error === "string"
        ? json.error
        : `HTTP ${res.status}`;
    throw new Error(pesan);
  }
  return (json as { data: T }).data;
}

/**
 * Menjalankan state machine risiko untuk satu wilayah beserta efek tiap state.
 * Data awal dirender server (SSR), lalu diperbarui berkala lewat API.
 */
export function useRiskState(awal: {
  idWilayah: string;
  risiko: RisikoKlien;
  grafik: TitikGrafikJam[];
  penanganan: PenangananKlien;
}) {
  const { idWilayah } = awal;
  const [ktx, kirim] = useReducer(transisi, awal.risiko, konteksAwal);
  const [grafik, setGrafik] = useState(awal.grafik);
  const [penanganan, setPenanganan] = useState(awal.penanganan);
  const terakhirDimuat = useRef(Date.now());
  const { status: statusPush, langganan } = useNotifikasi();

  // --- Pemantauan: entry ambil data (API memastikan data Open-Meteo/cache segar) ---
  const muatUlang = useCallback(async () => {
    kirim({ type: "MUAT" });
    try {
      const q = encodeURIComponent(idWilayah);
      const [risiko, cuaca] = await Promise.all([
        ambilJson<RisikoKlien>(`/api/risiko?wilayah=${q}`),
        ambilJson<{ hujan48Jam: TitikGrafikJam[] }>(`/api/cuaca?wilayah=${q}`),
      ]);
      terakhirDimuat.current = Date.now();
      setGrafik(cuaca.hujan48Jam);
      kirim({ type: "DATA_DITERIMA", data: risiko });
    } catch (err) {
      kirim({ type: "GAGAL_MUAT", pesan: err instanceof Error ? err.message : "Gagal memuat data" });
    }
  }, [idWilayah]);

  // Refresh berkala tiap 30 menit; juga saat tab kembali aktif setelah lama ditinggal.
  useEffect(() => {
    const timer = window.setInterval(() => void muatUlang(), INTERVAL_REFRESH_MS);
    const saatTerlihat = () => {
      if (document.visibilityState === "visible" && Date.now() - terakhirDimuat.current >= INTERVAL_REFRESH_MS) {
        void muatUlang();
      }
    };
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [muatUlang]);

  // Deep link dari notifikasi push: /risiko?wilayah={id}#penanganan → Detail Penanganan.
  useEffect(() => {
    if (window.location.hash === "#penanganan") kirim({ type: "BUKA_PENANGANAN" });
  }, []);

  // --- Bahaya, Jalur 1: TriggerPush → KirimNotifikasiPush → NotifikasiTerkirim ---
  const s = ktx.state;
  const jalurPush = s.nama === "bahaya" ? s.jalurPush : null;
  const levelBahaya = s.nama === "bahaya" ? s.data.level : null;
  const namaWilayah = s.data?.namaWilayah ?? "";

  useEffect(() => {
    if (jalurPush === "trigger-push") kirim({ type: "PUSH_DIPICU" });
  }, [jalurPush]);

  useEffect(() => {
    if (jalurPush !== "kirim-notifikasi" || statusPush === "memuat") return;
    // Push dikirim server (cron / saat risiko dihitung). Perangkat tanpa langganan untuk
    // wilayah ini mendapat peringatan di dalam aplikasi.
    const kanal: KanalPeringatan =
      statusPush === "aktif" && langganan?.idWilayah === idWilayah ? "push" : "dalam-aplikasi";
    if (kanal === "dalam-aplikasi") {
      toast.warning(`Risiko banjir ${levelBahaya === "TINGGI" ? "TINGGI" : "SEDANG"} di ${namaWilayah}`, {
        description: "Periksa persiapan dini dan rekomendasi di halaman ini.",
      });
    }
    kirim({ type: "PUSH_SELESAI", kanal });
  }, [jalurPush, statusPush, langganan, idWilayah, levelBahaya, namaWilayah]);

  // --- Bahaya, Jalur 2: PermintaanGrafik → MenyiapkanGrafik → SelesaiRender ---
  const jalurGrafik = s.nama === "bahaya" ? s.jalurGrafik : null;
  useEffect(() => {
    if (jalurGrafik === "permintaan-grafik") kirim({ type: "GRAFIK_DISIAPKAN" });
  }, [jalurGrafik]);
  const grafikSelesaiRender = useCallback(() => kirim({ type: "GRAFIK_SELESAI" }), []);

  // --- Detail Penanganan: entry Persiapan Dini & Lihat Panduan sesuai level terkini ---
  const levelData = s.data?.level ?? null;
  useEffect(() => {
    if (!levelData || levelData === penanganan.level) return;
    let batal = false;
    const q = `level=${levelData}&wilayah=${encodeURIComponent(idWilayah)}`;
    Promise.all([
      ambilJson<PenangananKlien["persiapan"]>(`/api/persiapan?${q}`),
      ambilJson<PenangananKlien["rekomendasi"]>(`/api/rekomendasi?${q}`),
    ])
      .then(([persiapan, rekomendasi]) => {
        if (!batal) setPenanganan({ level: levelData, persiapan, rekomendasi });
      })
      .catch(() => toast.error("Gagal memuat persiapan dan rekomendasi terbaru."));
    return () => {
      batal = true;
    };
  }, [levelData, penanganan.level, idWilayah]);

  return { ktx, kirim, grafik, penanganan, muatUlang, grafikSelesaiRender };
}
