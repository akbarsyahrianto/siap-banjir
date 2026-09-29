import { grafikHujanPerJam, type TitikHujan } from "@/lib/grafik-hujan";

/**
 * Curah hujan per jam dari jam sekarang sampai akhir prakiraan (board Cuaca). Batang CSS murni,
 * tanpa JavaScript di browser; pembaca layar mendapat ringkasan rentang dan puncak hujan.
 */
export function GrafikHujanPerJam({ titik }: { titik: TitikHujan[] }) {
  const g = grafikHujanPerJam(titik);
  if (!g) return null;

  return (
    <section aria-labelledby="judul-jam" className="flex flex-col gap-3 rounded-[20px] border bg-card p-4 text-card-foreground">
      <h2 id="judul-jam" className="text-[18px] font-extrabold">
        Curah hujan per jam
      </h2>
      <div role="img" aria-label={g.ringkasan} className="flex gap-1.5">
        <div className="flex h-[120px] w-[34px] shrink-0 flex-col justify-between text-right text-[11px] font-semibold text-[#3e4a5c] tabular-nums">
          {g.sumbuY.map((l) => (
            <span key={l} className="leading-none">
              {l}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex h-[120px] items-end gap-px border-b-2 border-foreground bg-[repeating-linear-gradient(to_top,var(--card)_0px,var(--card)_39px,#e4e9f0_39px,#e4e9f0_40px)]">
            {g.batang.map((b) => (
              <div
                key={b.waktu}
                className="min-w-0 flex-1 rounded-t-[2px] bg-primary"
                style={{ height: `${b.persen}%` }}
              />
            ))}
          </div>
          <div className="flex text-[11px] font-bold whitespace-nowrap text-[#1f2937]">
            {g.hari.map((h, i) => (
              <span
                key={h.tanggal}
                className={i > 0 ? "min-w-0 overflow-hidden border-l border-[#9aa6b8] pl-1" : "min-w-0 overflow-hidden"}
                style={{ flex: `${h.jam} 1 0` }}
              >
                {/* Tanggal dengan sedikit jam (mis. pukul 22.00) terlalu sempit untuk labelnya. */}
                {h.jam >= 5 ? h.label : null}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[13px] leading-normal text-[#3e4a5c]">Mulai pukul {g.jamMulai} hari ini. Satu batang = satu jam.</p>
    </section>
  );
}
