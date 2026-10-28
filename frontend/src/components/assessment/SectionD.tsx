"use client";

import type { HealthFormData } from "@/types";
import { GEN_HEALTH_LABELS } from "@/lib/utils";

interface Props {
  form: HealthFormData;
  updateField: <K extends keyof HealthFormData>(k: K, v: HealthFormData[K]) => void;
}

const GEN_HEALTH_COLORS: Record<number, string> = {
  1: "border-health-emerald bg-health-emerald-light text-health-emerald",
  2: "border-green-400 bg-green-50 text-green-700",
  3: "border-brand-500 bg-brand-50 text-brand-600",
  4: "border-health-amber bg-health-amber-light text-health-amber",
  5: "border-health-rose bg-health-rose-light text-health-rose",
};

function DaySlider({
  id, label, description, value, onChange,
}: {
  id: string; label: string; description: string;
  value: number; onChange: (v: number) => void;
}) {
  const pct = (value / 30) * 100;
  const color =
    value === 0 ? "#059669" :
    value <= 7  ? "#D97706" :
                  "#DC2626";
  return (
    <div className="space-y-2 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label}
        </label>
        <span
          className="font-mono text-base font-bold tabular-nums"
          style={{ color }}
        >
          {value} {value === 1 ? "day" : "days"}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      <input
        id={id}
        type="range" min={0} max={30} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${pct}%, #E2E8F0 ${pct}%)`,
        }}
        aria-label={label}
        aria-valuemin={0} aria-valuemax={30} aria-valuenow={value}
        aria-valuetext={`${value} days`}
      />
    </div>
  );
}

export function SectionD({ form, updateField }: Props) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-0.5">
          Self-Reported Wellness
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your subjective health ratings over the past 30 days
        </p>
      </div>

      {/* General health rating */}
      <div className="space-y-3">
        <label className="label">General Health (self-rated)</label>
        <div className="grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as const).map((v) => (
            <button
              key={v}
              onClick={() => updateField("GenHlth", v)}
              className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                form.GenHlth === v
                  ? GEN_HEALTH_COLORS[v]
                  : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300"
              }`}
              aria-pressed={form.GenHlth === v}
            >
              {GEN_HEALTH_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Day sliders */}
      <div className="card p-1">
        <DaySlider
          id="MentHlth"
          label="Poor Mental Health Days"
          description="For how many days during the past 30 days was your mental health not good? (0–30)"
          value={form.MentHlth}
          onChange={(v) => updateField("MentHlth", v)}
        />
        <DaySlider
          id="PhysHlth"
          label="Poor Physical Health Days"
          description="For how many days during the past 30 days was your physical health not good due to illness or injury? (0–30)"
          value={form.PhysHlth}
          onChange={(v) => updateField("PhysHlth", v)}
        />
      </div>

      {/* Difficulty walking */}
      <div className="space-y-2">
        <label className="label">Difficulty Walking or Climbing Stairs</label>
        <div className="flex gap-3">
          {[
            { v: 0, l: "No difficulty", desc: "Manage stairs and walking without significant problems" },
            { v: 1, l: "Serious difficulty", desc: "Serious difficulty walking or climbing stairs" },
          ].map(({ v, l, desc }) => (
            <button
              key={v}
              onClick={() => updateField("DiffWalk", v)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm border-2 transition-all text-left ${
                form.DiffWalk === v
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-900/40"
                  : "border-slate-200 dark:border-slate-600 hover:border-brand-300"
              }`}
              aria-pressed={form.DiffWalk === v}
            >
              <span className={`font-semibold block mb-0.5 ${
                form.DiffWalk === v ? "text-brand-600" : "text-slate-700 dark:text-slate-300"
              }`}>
                {l}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
