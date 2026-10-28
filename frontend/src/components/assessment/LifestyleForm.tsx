"use client";

import { ChevronDown, Leaf, CheckCircle2 } from "lucide-react";
import type { LifestyleProfile } from "@/types";

/** Ranges must match LifestyleInput in backend/app/models/schemas.py */
export const LIFESTYLE_RANGES = {
  age: [1, 120],
  height_cm: [50, 250],
  weight_kg: [10, 300],
  waist_cm: [40, 200],
  sleep_hours: [1, 16],
} as const;

export function isLifestyleReady(p: LifestyleProfile): boolean {
  return Boolean(p.age && p.sex && p.height_cm && p.weight_kg);
}

export function hasAnyLifestyleInput(p: LifestyleProfile): boolean {
  return Object.values(p).some((v) => v !== undefined && v !== null);
}

/** Returns an error message for the first out-of-range numeric value, else null. */
export function validateLifestyle(p: LifestyleProfile): string | null {
  const labels: Record<keyof typeof LIFESTYLE_RANGES, string> = {
    age: "Age",
    height_cm: "Height",
    weight_kg: "Weight",
    waist_cm: "Waist",
    sleep_hours: "Sleep hours",
  };
  for (const key of Object.keys(LIFESTYLE_RANGES) as (keyof typeof LIFESTYLE_RANGES)[]) {
    const v = p[key];
    if (v === undefined) continue;
    const [min, max] = LIFESTYLE_RANGES[key];
    if (!Number.isFinite(v) || v < min || v > max) {
      return `${labels[key]} must be between ${min} and ${max}.`;
    }
  }
  return null;
}

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{children}</label>;
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  required,
}: {
  label: string;
  value?: number;
  onChange: (v?: number) => void;
  min: number;
  max: number;
  step?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const invalid = value !== undefined && (value < min || value > max);
  return (
    <div>
      <Label>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </Label>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className={`${inputCls} ${invalid ? "border-rose-400 focus:ring-rose-400" : ""}`}
      />
      {invalid && (
        <p className="text-[10px] text-rose-500 mt-1">
          Enter a value between {min} and {max}.
        </p>
      )}
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value?: T;
  onChange: (v?: T) => void;
  options: { value: T; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </Label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : (e.target.value as T))}
        className={inputCls}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange: (v?: boolean) => void;
}) {
  const btn = (active: boolean) =>
    `flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
      active
        ? "bg-teal-600 text-white"
        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
    }`;
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-1.5">
        <button type="button" className={btn(value === true)} onClick={() => onChange(value === true ? undefined : true)}>
          Yes
        </button>
        <button type="button" className={btn(value === false)} onClick={() => onChange(value === false ? undefined : false)}>
          No
        </button>
      </div>
    </div>
  );
}

export function LifestyleForm({
  value,
  onChange,
  open,
  onToggle,
}: {
  value: LifestyleProfile;
  onChange: (next: LifestyleProfile) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const set = <K extends keyof LifestyleProfile>(key: K, v: LifestyleProfile[K] | undefined) =>
    onChange({ ...value, [key]: v });

  const ready = isLifestyleReady(value);
  const bmi =
    value.height_cm && value.weight_kg
      ? Math.round((value.weight_kg / Math.pow(value.height_cm / 100, 2)) * 10) / 10
      : null;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Lifestyle &amp; Health Profile{" "}
              <span className="text-xs font-semibold text-slate-400">(optional)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Screens your risk of diabetes, high blood pressure, heart disease and obesity from your habits.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ready && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-[11px] text-slate-500">
            Fields marked <span className="text-rose-500 font-bold">*</span> are needed for a lifestyle screening.
            Everything else makes the result more accurate. Your answers are only used for this assessment.
          </p>

          {/* Body measurements */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-600 mb-2">Body measurements</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <NumberField label="Age (years)" required value={value.age} onChange={(v) => set("age", v)} min={1} max={120} placeholder="e.g. 35" />
              <SelectField
                label="Sex"
                required
                value={value.sex}
                onChange={(v) => set("sex", v)}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />
              <NumberField label="Height (cm)" required value={value.height_cm} onChange={(v) => set("height_cm", v)} min={50} max={250} placeholder="e.g. 168" />
              <NumberField label="Weight (kg)" required value={value.weight_kg} onChange={(v) => set("weight_kg", v)} min={10} max={300} step={0.1} placeholder="e.g. 70" />
              <NumberField label="Waist (cm)" value={value.waist_cm} onChange={(v) => set("waist_cm", v)} min={40} max={200} step={0.5} placeholder="at navel level" />
            </div>
            {bmi !== null && (
              <p className="text-xs text-slate-500 mt-2">
                BMI: <span className="font-bold text-slate-900 dark:text-white">{bmi}</span>
              </p>
            )}
          </div>

          {/* Habits */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-600 mb-2">Daily habits</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SelectField
                label="Physical activity"
                value={value.activity}
                onChange={(v) => set("activity", v)}
                options={[
                  { value: "sedentary", label: "No exercise, desk / sitting work" },
                  { value: "moderate", label: "Regular exercise OR active work" },
                  { value: "active", label: "Regular exercise AND active work" },
                ]}
              />
              <SelectField
                label="Smoking / tobacco"
                value={value.smoking}
                onChange={(v) => set("smoking", v)}
                options={[
                  { value: "never", label: "Never" },
                  { value: "former", label: "Former" },
                  { value: "current", label: "Current" },
                ]}
              />
              <SelectField
                label="Alcohol"
                value={value.alcohol}
                onChange={(v) => set("alcohol", v)}
                options={[
                  { value: "none", label: "None" },
                  { value: "occasional", label: "Occasional" },
                  { value: "regular", label: "Regular" },
                  { value: "heavy", label: "Heavy" },
                ]}
              />
              <NumberField label="Sleep (hours / night)" value={value.sleep_hours} onChange={(v) => set("sleep_hours", v)} min={1} max={16} step={0.5} placeholder="e.g. 7" />
              <YesNo label="Fruits & vegetables daily" value={value.eats_fruit_veg_daily} onChange={(v) => set("eats_fruit_veg_daily", v)} />
              <YesNo label="High-salt food often" value={value.high_salt_diet} onChange={(v) => set("high_salt_diet", v)} />
              <YesNo label="Sugary food / drinks daily" value={value.sugary_food_daily} onChange={(v) => set("sugary_food_daily", v)} />
            </div>
          </div>

          {/* Family & known history */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-600 mb-2">Family &amp; health history</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <SelectField
                label="Parents with diabetes"
                value={value.family_diabetes}
                onChange={(v) => set("family_diabetes", v)}
                options={[
                  { value: "none", label: "Neither parent" },
                  { value: "one_parent", label: "One parent" },
                  { value: "both_parents", label: "Both parents" },
                ]}
              />
              <YesNo label="Family: high blood pressure" value={value.family_hypertension} onChange={(v) => set("family_hypertension", v)} />
              <YesNo label="Family: heart disease" value={value.family_heart_disease} onChange={(v) => set("family_heart_disease", v)} />
              <YesNo label="Told you have high BP" value={value.known_high_bp} onChange={(v) => set("known_high_bp", v)} />
              <YesNo label="Told you have high sugar" value={value.known_high_sugar} onChange={(v) => set("known_high_sugar", v)} />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onChange({})}
              className="text-rose-500 hover:text-rose-600 text-xs font-semibold"
            >
              Clear profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
