"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 30 * 60 * 1000;

/** Render ulang halaman server tiap 30 menit (dan saat tab aktif lagi setelah lama ditinggal). */
export function AutoRefresh() {
  const router = useRouter();
  const terakhir = useRef(Date.now());

  useEffect(() => {
    const segarkan = () => {
      terakhir.current = Date.now();
      router.refresh();
    };
    const timer = window.setInterval(segarkan, INTERVAL_MS);
    const saatTerlihat = () => {
      if (document.visibilityState === "visible" && Date.now() - terakhir.current >= INTERVAL_MS) segarkan();
    };
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [router]);

  return null;
}
