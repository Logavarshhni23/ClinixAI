"use client";

import type { HealthFormData } from "@/types";

interface Props {
  form: HealthFormData;
  updateField: <K extends keyof HealthFormData>(k: K, v: HealthFormData[K]) => void;
}

function ToggleField({
  label, description, value, onChange, id,
}: {
  label: string; description: string; value: number;
  onChange: (v: number) => void; id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
          {label}
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={value === 1}
        onClick={() => onChange(value === 1 ? 0 : 1)}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
          value === 1
            ? "bg-brand-600"
            : "bg-slate-200 dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            value === 1 ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
        <span className="sr-only">{value === 1 ? "Yes" : "No"}</span>
      </button>
    </div>
  );
}

export function SectionB({ form, updateField }: Props) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-0.5">
          Clinical Baseline
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Diagnosed conditions and clinical history — answer based on healthcare provider information
        </p>
      </div>

      <div className="card p-1">
        <ToggleField
          id="HighBP" label="High Blood Pressure"
          description="Have you ever been told by a doctor, nurse, or health professional that you have high blood pressure?"
          value={form.HighBP}
          onChange={(v) => updateField("HighBP", v)}
        />
        <ToggleField
          id="HighChol" label="High Cholesterol"
          description="Have you ever been told by a health professional that your blood cholesterol is high?"
          value={form.HighChol}
          onChange={(v) => updateField("HighChol", v)}
        />
        <ToggleField
          id="CholCheck" label="Cholesterol Check (last 5 years)"
          description="Have you had your cholesterol checked in the last 5 years?"
          value={form.CholCheck}
          onChange={(v) => updateField("CholCheck", v)}
        />
        <ToggleField
          id="Stroke" label="History of Stroke"
          description="Have you ever been told you had a stroke?"
          value={form.Stroke}
          onChange={(v) => updateField("Stroke", v)}
        />
        <ToggleField
          id="HeartDiseaseorAttack" label="Heart Disease or Heart Attack"
          description="Have you ever been told you had coronary heart disease (CHD) or a myocardial infarction (MI)?"
          value={form.HeartDiseaseorAttack}
          onChange={(v) => updateField("HeartDiseaseorAttack", v)}
        />
        <ToggleField
          id="AnyHealthcare" label="Healthcare Coverage"
          description="Do you have any kind of health care coverage, including health insurance, prepaid plans such as HMOs, or government plans?"
          value={form.AnyHealthcare}
          onChange={(v) => updateField("AnyHealthcare", v)}
        />
        <ToggleField
          id="NoDocbcCost" label="Skipped Doctor Due to Cost"
          description="Was there a time in the past 12 months when you needed to see a doctor but could not because of cost?"
          value={form.NoDocbcCost}
          onChange={(v) => updateField("NoDocbcCost", v)}
        />
      </div>
    </div>
  );
}
