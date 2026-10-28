"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";
import type { SHAPFeature } from "@/types";

interface Props {
  features: SHAPFeature[];
  topN?: number;
  height?: number;
}

interface TooltipPayload {
  value: number;
  payload: SHAPFeature & { absVal: number };
}

function CustomTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isRisk = d.shap_value > 0;

  return (
    <div className="bg-white dark:bg-brand-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-card-md p-3 max-w-[220px]">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
        {d.display_label}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        Feature value: <span className="font-mono font-semibold">{d.value}</span>
      </p>
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${isRisk ? "text-health-rose" : "text-health-emerald"}`}>
        <span>{isRisk ? "▲" : "▼"}</span>
        <span>
          {isRisk ? "Increases" : "Decreases"} risk by{" "}
          <span className="font-mono">{Math.abs(d.shap_value).toFixed(4)}</span>
        </span>
      </div>
    </div>
  );
}

export function SHAPChart({ features, topN = 12, height = 380 }: Props) {
  // Take top-N by absolute SHAP magnitude, already sorted by the API
  const data = features
    .slice(0, topN)
    .map((f) => ({ ...f, absVal: Math.abs(f.shap_value) }))
    .sort((a, b) => a.absVal - b.absVal); // ascending so top of chart = highest

  const maxAbs = Math.max(...data.map((d) => d.absVal), 0.001);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-health-rose inline-block" aria-hidden="true" />
          Increases risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-health-emerald inline-block" aria-hidden="true" />
          Decreases risk
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="rgba(100,116,139,0.15)"
          />
          <XAxis
            type="number"
            domain={[-maxAbs * 1.1, maxAbs * 1.1]}
            tickFormatter={(v) => v.toFixed(3)}
            tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="display_label"
            width={148}
            tick={{ fontSize: 11, fill: "#64748B", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />
          <ReferenceLine x={0} stroke="#CBD5E1" strokeWidth={1.5} />
          <Bar dataKey="shap_value" radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.direction === "risk" ? "#DC2626" : entry.direction === "protective" ? "#059669" : "#94A3B8"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
