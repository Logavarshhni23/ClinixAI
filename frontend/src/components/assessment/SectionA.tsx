"use client";

import { useMemo } from "react";
import type { HealthFormData } from "@/types";
import {
  AGE_LABELS, EDUCATION_LABELS, INCOME_LABELS,
  calculateBMI, bmiCategory,
} from "@/lib/utils";

interface Props {
  form: HealthFormData;
  updateField: <K extends keyof HealthFormData>(k: K, v: HealthFormData[K]) => void;
}

function SliderField({
  label, value, min, max, onChange, formatLabel,
  hint,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
  formatLabel: (v: number) => string;
  hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 font-mono">
          {formatLabel(value)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-600 bg-slate-200 dark:bg-slate-600"
        style={{
          background: `linear-gradient(to right, #2563EB ${pct}%, #E2E8F0 ${pct}%)`,
        }}
        aria-label={label}
        aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
        aria-valuetext={formatLabel(value)}
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function NumberInput({
  label, value, min, max, step = 1, unit, onChange, hint,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  unit?: string; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}{unit && <span className="text-slate-400 font-normal"> ({unit})</span>}</label>
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-field font-mono"
        aria-label={label}
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function SectionA({ form, updateField }: Props) {
  const bmi = useMemo(
    () => calculateBMI(form.weightKg, form.heightCm),
    [form.weightKg, form.heightCm]
  );
  const bmiInfo = bmiCategory(bmi);

  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-0.5">
          Demographics & Biometrics
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Basic demographic and physical measurements
        </p>
      </div>

      {/* Age */}
      <SliderField
        label="Age Group"
        value={form.Age}
        min={1} max={13}
        onChange={(v) => updateField("Age", v)}
        formatLabel={(v) => AGE_LABELS[v] ?? String(v)}
        hint="Select the age bracket that applies to you"
      />

      {/* Sex */}
      <div className="space-y-2">
        <label className="label">Biological Sex</label>
        <div className="flex gap-3">
          {[{ v: 0, l: "Female" }, { v: 1, l: "Male" }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => updateField("Sex", v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                form.Sex === v
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-900/40 text-brand-600"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-brand-300"
              }`}
              aria-pressed={form.Sex === v}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Height & Weight with live BMI */}
      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Height" unit="cm" value={form.heightCm}
          min={100} max={250} step={1}
          onChange={(v) => updateField("heightCm", v)}
        />
        <NumberInput
          label="Weight" unit="kg" value={form.weightKg}
          min={20} max={300} step={0.5}
          onChange={(v) => updateField("weightKg", v)}
        />
      </div>

      {/* Live BMI preview */}
      <div className="bg-slate-50 dark:bg-brand-800/40 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">
            Calculated BMI
          </p>
          <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-100">
            {bmi > 0 ? bmi.toFixed(1) : "—"}
          </p>
        </div>
        {bmi > 0 && (
          <span className={`text-sm font-semibold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 ${bmiInfo.color}`}>
            {bmiInfo.label}
          </span>
        )}
      </div>

      {/* Education */}
      <SliderField
        label="Education Level"
        value={form.Education}
        min={1} max={6}
        onChange={(v) => updateField("Education", v)}
        formatLabel={(v) => EDUCATION_LABELS[v] ?? String(v)}
      />

      {/* Income */}
      <SliderField
        label="Household Income"
        value={form.Income}
        min={1} max={8}
        onChange={(v) => updateField("Income", v)}
        formatLabel={(v) => INCOME_LABELS[v] ?? String(v)}
      />
    </div>
  );
}
