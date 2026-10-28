"use client";

import { useMemo } from "react";
import type { RiskCategory } from "@/types";

interface Props {
  score: number;          // 0–1
  category: RiskCategory;
  size?: number;          // SVG canvas size in px
  animated?: boolean;
}

const CATEGORY_CONFIG: Record<RiskCategory, { color: string; trackColor: string; label: string }> = {
  "Low Risk":      { color: "#059669", trackColor: "#D1FAE5", label: "Low Risk"      },
  "Elevated Risk": { color: "#D97706", trackColor: "#FEF3C7", label: "Elevated Risk" },
  "High Risk":     { color: "#DC2626", trackColor: "#FEE2E2", label: "High Risk"     },
};

export function RiskDial({ score, category, size = 240, animated = true }: Props) {
  const cfg = CATEGORY_CONFIG[category];

  // SVG arc math — 180° semicircle gauge
  const cx = size / 2;
  const cy = size * 0.62;          // push centre lower so arc sits nicely
  const r = size * 0.40;
  const strokeW = size * 0.065;
  const innerR = r - strokeW / 2;

  // Polar → cartesian
  function polarToCartesian(angle: number) {
    const rad = (angle - 180) * (Math.PI / 180);
    return {
      x: cx + innerR * Math.cos(rad),
      y: cy + innerR * Math.sin(rad),
    };
  }

  // Arc path (0 = left, 180 = right)
  function arcPath(startAngle: number, endAngle: number) {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${innerR} ${innerR} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  const needleAngle = score * 180;   // 0° = leftmost, 180° = rightmost
  const filledDeg = score * 180;

  // Zone ticks (25%, 55% thresholds)
  const zones = useMemo(() => [
    { pct: 0.25, label: "25%" },
    { pct: 0.55, label: "55%" },
  ], []);

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Risk gauge: ${(score * 100).toFixed(1)}% — ${category}`}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} aria-hidden="true">
        {/* Track */}
        <path
          d={arcPath(0, 180)}
          fill="none"
          stroke={cfg.trackColor}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Zone markers */}
        {zones.map(({ pct, label }) => {
          const angle = pct * 180;
          const outer = polarToCartesian(angle);
          const outerFar = {
            x: cx + (innerR + strokeW) * Math.cos((angle - 180) * Math.PI / 180),
            y: cy + (innerR + strokeW) * Math.sin((angle - 180) * Math.PI / 180),
          };
          return (
            <g key={pct}>
              <line
                x1={outer.x} y1={outer.y}
                x2={outerFar.x} y2={outerFar.y}
                stroke="#94A3B8" strokeWidth={1.5}
              />
              <text
                x={outerFar.x}
                y={outerFar.y - 4}
                textAnchor="middle"
                fontSize={size * 0.048}
                fill="#94A3B8"
                fontFamily="JetBrains Mono, monospace"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Filled arc */}
        {filledDeg > 1 && (
          <path
            d={arcPath(0, Math.min(filledDeg, 179.9))}
            fill="none"
            stroke={cfg.color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            className={animated ? "transition-all duration-700 ease-out" : ""}
          />
        )}

        {/* Needle */}
        {(() => {
          const needleRad = (needleAngle - 180) * (Math.PI / 180);
          const needleLen = innerR * 0.78;
          const nx = cx + needleLen * Math.cos(needleRad);
          const ny = cy + needleLen * Math.sin(needleRad);
          return (
            <>
              <line
                x1={cx} y1={cy}
                x2={nx} y2={ny}
                stroke={cfg.color}
                strokeWidth={strokeW * 0.35}
                strokeLinecap="round"
              />
              <circle cx={cx} cy={cy} r={strokeW * 0.45} fill={cfg.color} />
              <circle cx={cx} cy={cy} r={strokeW * 0.22} fill="white" />
            </>
          );
        })()}

        {/* Score text */}
        <text
          x={cx} y={cy - innerR * 0.20}
          textAnchor="middle"
          fontSize={size * 0.115}
          fontWeight="700"
          fill={cfg.color}
          fontFamily="JetBrains Mono, monospace"
        >
          {(score * 100).toFixed(1)}%
        </text>
        <text
          x={cx} y={cy + size * 0.05}
          textAnchor="middle"
          fontSize={size * 0.052}
          fill="#64748B"
          fontFamily="Inter, sans-serif"
        >
          Risk Score
        </text>

        {/* Zone labels */}
        <text x={r * 0.18} y={cy + size * 0.08} textAnchor="middle" fontSize={size * 0.042} fill="#059669" fontFamily="Inter">Low</text>
        <text x={cx}        y={cy + size * 0.08} textAnchor="middle" fontSize={size * 0.042} fill="#D97706" fontFamily="Inter">Elevated</text>
        <text x={size - r * 0.18} y={cy + size * 0.08} textAnchor="middle" fontSize={size * 0.042} fill="#DC2626" fontFamily="Inter">High</text>
      </svg>

      {/* Category badge */}
      <div
        className="mt-2 px-4 py-1.5 rounded-full text-sm font-bold"
        style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
      >
        {cfg.label}
      </div>
    </div>
  );
}
