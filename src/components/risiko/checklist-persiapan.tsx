"use client";

import { useEffect, useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

type Item = { idPersiapan: string; isiPersiapan: string };

/** Checklist persiapan dini; progres disimpan di localStorage per wilayah + level. */
export function ChecklistPersiapan({ items, kunci }: { items: Item[]; kunci: string }) {
  const kunciStorage = `siapbanjir_checklist:${kunci}`;
  const [dicentang, setDicentang] = useState<Set<string>>(new Set());
  const idDasar = useId();

  useEffect(() => {
    try {
      const tersimpan: unknown = JSON.parse(window.localStorage.getItem(kunciStorage) ?? "[]");
      if (Array.isArray(tersimpan)) {
        setDicentang(new Set(tersimpan.filter((v): v is string => typeof v === "string")));
      }
    } catch {
      // localStorage tidak tersedia atau isinya rusak: mulai dari kosong.
    }
  }, [kunciStorage]);

  function ubah(id: string, centang: boolean) {
    setDicentang((lama) => {
      const baru = new Set(lama);
      if (centang) baru.add(id);
      else baru.delete(id);
      try {
        window.localStorage.setItem(kunciStorage, JSON.stringify([...baru]));
      } catch {
        // abaikan; progres hanya tidak tersimpan
      }
      return baru;
    });
  }

  if (items.length === 0) return <p className="text-muted-foreground">Belum ada daftar persiapan.</p>;

  const selesai = items.filter((i) => dicentang.has(i.idPersiapan)).length;

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex justify-between text-sm font-medium">
          <span>Progres persiapan</span>
          <span>
            {selesai}/{items.length}
          </span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={selesai}
          aria-label="Progres persiapan"
        >
          <div className="h-full bg-primary transition-all" style={{ width: `${(selesai / items.length) * 100}%` }} />
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const id = `${idDasar}-${item.idPersiapan}`;
          const centang = dicentang.has(item.idPersiapan);
          return (
            <li key={item.idPersiapan}>
              <label
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent/50"
              >
                <Checkbox
                  id={id}
                  checked={centang}
                  onCheckedChange={(v) => ubah(item.idPersiapan, v === true)}
                  className="mt-0.5 size-5"
                />
                <span className={centang ? "text-muted-foreground line-through" : undefined}>{item.isiPersiapan}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
