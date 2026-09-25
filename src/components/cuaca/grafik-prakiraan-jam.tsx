"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TitikGrafikJam } from "@/server/services/seri-cuaca";

const formatSumbuX = (waktu: string) =>
  waktu.endsWith("T00:00") ? `${waktu.slice(8, 10)}/${waktu.slice(5, 7)}` : waktu.slice(11, 16);

/** Prakiraan per jam: batang = curah hujan (mm), garis = suhu (°C) dan peluang hujan (%). */
export function GrafikPrakiraanJam({ data }: { data: TitikGrafikJam[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="waktu" tickFormatter={formatSumbuX} interval={5} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="mm" tick={{ fontSize: 12 }} unit=" mm" width={60} allowDecimals={false} />
          <YAxis yAxisId="kanan" orientation="right" tick={{ fontSize: 12 }} width={40} domain={[0, 100]} />
          <Tooltip
            labelFormatter={(w) => `${String(w).slice(8, 10)}/${String(w).slice(5, 7)} ${String(w).slice(11, 16)} WIB`}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar yAxisId="mm" dataKey="hujan" name="Hujan (mm)" fill="var(--primary)" radius={[3, 3, 0, 0]} />
          <Line
            yAxisId="kanan"
            dataKey="peluang"
            name="Peluang hujan (%)"
            stroke="var(--chart-2, #64748b)"
            strokeDasharray="5 3"
            dot={false}
            strokeWidth={2}
          />
          <Line yAxisId="kanan" dataKey="suhu" name="Suhu (°C)" stroke="var(--risk-tinggi)" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
