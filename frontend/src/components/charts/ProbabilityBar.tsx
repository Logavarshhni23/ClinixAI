"use client";

import type { RiskProbabilities } from "@/types";
import { pct } from "@/lib/utils";

interface Props {
  probabilities: RiskProbabilities;
  animated?: boolean;
}

const SEGMENTS = [
  { key: "no_diabetes" as const,  label: "No Diabetes",  color: "#059669", bg: "#D1FAE5", text: "text-health-emerald" },
  { key: "prediabetes"  as const,  label: "Prediabetes",   color: "#D97706", bg: "#FEF3C7", text: "text-health-amber"   },
  { key: "diabetes"     as const,  label: "Diabetes",      color: "#DC2626", bg: "#FEE2E2", text: "text-health-rose"    },
] as const;

export function ProbabilityBar({ probabilities, animated = true }: Props) {
  return (
    <div className="space-y-3" role="list" aria-label="Risk probability breakdown">
      {/* Stacked bar */}
      <div
        className="w-full h-5 rounded-full overflow-hidden flex"
        role="img"
        aria-label={`Probabilities: No Diabetes ${pct(probabilities.no_diabetes)}, Prediabetes ${pct(probabilities.prediabetes)}, Diabetes ${pct(probabilities.diabetes)}`}
      >
        {SEGMENTS.map(({ key, color }) => (
          <div
            key={key}
            className={animated ? "transition-all duration-700 ease-out" : ""}
            style={{
              width: `${probabilities[key] * 100}%`,
              backgroundColor: color,
              minWidth: probabilities[key] > 0.01 ? "4px" : "0",
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Legend rows */}
      {SEGMENTS.map(({ key, label, color, bg, text }) => (
        <div
          key={key}
          className="flex items-center justify-between"
          role="listitem"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Mini bar */}
            <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className={animated ? "transition-all duration-700 ease-out" : ""}
                style={{
                  width: `${probabilities[key] * 100}%`,
                  backgroundColor: color,
                  height: "100%",
                  borderRadius: "9999px",
                }}
                aria-hidden="true"
              />
            </div>
            {/* Percentage pill */}
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${text}`}
              style={{ backgroundColor: bg }}
            >
              {pct(probabilities[key])}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
