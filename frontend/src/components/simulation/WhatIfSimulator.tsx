"use client";

import { useState, useCallback, useEffect } from "react";
import { Zap, TrendingDown, TrendingUp, RotateCcw, Loader2 } from "lucide-react";
import type { PredictPayload, SimulationResult, SimulationDelta } from "@/types";
import { simulateRisk } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SimSlider {
  key: keyof PredictPayload;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  description: string;
}

const SLIDERS: SimSlider[] = [
  {
    key: "BMI",
    label: "BMI Change",
    min: -15, max: 15, step: 0.5, unit: " units",
    description: "Adjust body mass index from baseline",
  },
  {
    key: "PhysActivity",
    label: "Physical Activity",
    min: 0, max: 1, step: 1,
    description: "Toggle regular physical activity",
  },
  {
    key: "Fruits",
    label: "Daily Fruit Intake",
    min: 0, max: 1, step: 1,
    description: "Toggle daily fruit consumption",
  },
  {
    key: "Veggies",
    label: "Daily Vegetable Intake",
    min: 0, max: 1, step: 1,
    description: "Toggle daily vegetable consumption",
  },
  {
    key: "Smoker",
    label: "Smoking Status",
    min: 0, max: 1, step: 1,
    description: "Toggle smoking history",
  },
  {
    key: "HvyAlcoholConsump",
    label: "Heavy Alcohol Consumption",
    min: 0, max: 1, step: 1,
    description: "Toggle heavy alcohol use",
  },
  {
    key: "GenHlth",
    label: "General Health",
    min: -2, max: 2, step: 1, unit: " levels",
    description: "Shift general health rating (negative = improvement)",
  },
  {
    key: "MentHlth",
    label: "Poor Mental Health Days",
    min: -15, max: 15, step: 1, unit: " days",
    description: "Change in mental health days per month",
  },
];

interface Props {
  baseline: PredictPayload;
  baselineScore: number;
}

export function WhatIfSimulator({ baseline, baselineScore }: Props) {
  const [deltas, setDeltas] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced simulation trigger
  useEffect(() => {
    const hasDelta = Object.values(deltas).some((v) => v !== 0);
    if (!hasDelta) {
      setResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filteredDelta: SimulationDelta = {};
        Object.entries(deltas).forEach(([k, v]) => {
          if (v !== 0) {
            (filteredDelta as Record<string, number>)[k] = v;
          }
        });
        const res = await simulateRisk(baseline, filteredDelta);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Simulation failed.");
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [deltas, baseline]);

  const updateDelta = useCallback((key: string, value: number) => {
    setDeltas((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = useCallback(() => {
    setDeltas({});
    setResult(null);
  }, []);

  const projectedScore = result?.projected_risk_score ?? baselineScore;
  const deltaAbs = result?.risk_delta ?? 0;
  const deltaPct = result?.risk_delta_percent ?? 0;
  const isImproving = deltaAbs < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Zap size={16} className="text-brand-600" />
            What-If Lifestyle Simulator
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Adjust lifestyle factors below — risk recalibrates in real time
          </p>
        </div>
        {Object.values(deltas).some((v) => v !== 0) && (
          <button onClick={resetAll} className="btn-ghost text-xs gap-1.5">
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Live result panel */}
      {(result || isLoading) && (
        <div className={cn(
          "rounded-2xl p-4 border-2 transition-all",
          isLoading
            ? "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-brand-800/30"
            : isImproving
              ? "border-health-emerald/40 bg-health-emerald-light"
              : "border-health-rose/40 bg-health-rose-light",
        )}>
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Recalculating risk…
            </div>
          ) : result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isImproving
                  ? <TrendingDown size={16} className="text-health-emerald" />
                  : <TrendingUp size={16} className="text-health-rose" />}
                <span className={cn(
                  "text-sm font-bold",
                  isImproving ? "text-health-emerald" : "text-health-rose"
                )}>
                  {isImproving ? "Risk Reduces" : "Risk Increases"} by{" "}
                  {Math.abs(deltaPct).toFixed(1)}%
                </span>
              </div>

              {/* Score comparison */}
              <div className="flex items-center gap-3 text-sm">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Baseline</p>
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {(baselineScore * 100).toFixed(1)}%
                  </p>
                </div>
                <div className={cn(
                  "text-lg font-bold",
                  isImproving ? "text-health-emerald" : "text-health-rose"
                )}>
                  {isImproving ? "→" : "→"}
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Projected</p>
                  <p className={cn(
                    "font-mono font-bold",
                    isImproving ? "text-health-emerald" : "text-health-rose"
                  )}>
                    {(projectedScore * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-lg",
                    isImproving
                      ? "bg-health-emerald/20 text-health-emerald"
                      : "bg-health-rose/20 text-health-rose"
                  )}>
                    {result.projected_category}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                {result.summary}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-health-rose bg-health-rose-light rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Sliders */}
      <div className="space-y-5">
        {SLIDERS.map((slider) => {
          const currentDelta = deltas[slider.key] ?? 0;
          const baseVal = baseline[slider.key] as number;
          const projectedVal = baseVal + currentDelta;
          const pct = slider.max !== slider.min
            ? ((currentDelta - slider.min) / (slider.max - slider.min)) * 100
            : 50;
          const isBinary = slider.max === 1 && slider.min === 0;

          return (
            <div key={slider.key} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {slider.label}
                  </p>
                  <p className="text-xs text-slate-400">{slider.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {isBinary ? (
                    <button
                      onClick={() => updateDelta(slider.key, currentDelta === 0 ? 1 : 0)}
                      className={cn(
                        "text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-all",
                        projectedVal >= 1
                          ? "border-brand-600 bg-brand-50 dark:bg-brand-900/40 text-brand-600"
                          : "border-slate-200 dark:border-slate-600 text-slate-500 hover:border-brand-300"
                      )}
                    >
                      {projectedVal >= 1 ? "Yes" : "No"}
                    </button>
                  ) : (
                    <span className={cn(
                      "font-mono text-sm font-bold tabular-nums",
                      currentDelta < 0 ? "text-health-emerald" :
                      currentDelta > 0 ? "text-health-rose" :
                      "text-slate-400"
                    )}>
                      {currentDelta > 0 ? "+" : ""}{currentDelta}{slider.unit ?? ""}
                    </span>
                  )}
                </div>
              </div>

              {!isBinary && (
                <input
                  type="range"
                  min={slider.min} max={slider.max} step={slider.step}
                  value={currentDelta}
                  onChange={(e) => updateDelta(slider.key, Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #E2E8F0 ${pct}%, #E2E8F0 ${pct}%)`,
                    accentColor: currentDelta < 0 ? "#059669" : currentDelta > 0 ? "#DC2626" : "#2563EB",
                  }}
                  aria-label={`${slider.label} delta`}
                  aria-valuemin={slider.min} aria-valuemax={slider.max} aria-valuenow={currentDelta}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
