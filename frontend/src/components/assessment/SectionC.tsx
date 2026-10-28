"use client";

import type { HealthFormData } from "@/types";

interface Props {
  form: HealthFormData;
  updateField: <K extends keyof HealthFormData>(k: K, v: HealthFormData[K]) => void;
}

function ToggleField({
  label, description, value, onChange, id,
  positiveLabel = "Yes", negativeLabel = "No",
}: {
  label: string; description: string; value: number;
  onChange: (v: number) => void; id: string;
  positiveLabel?: string; negativeLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
          {label}
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {[
          { val: 1, label: positiveLabel },
          { val: 0, label: negativeLabel },
        ].map(({ val, label }) => (
          <button
            key={val}
            id={val === 1 ? id : undefined}
            onClick={() => onChange(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              value === val
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-brand-300"
            }`}
            aria-pressed={value === val}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SectionC({ form, updateField }: Props) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-0.5">
          Daily Habits & Activity
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your lifestyle patterns over the past 30 days
        </p>
      </div>

      <div className="card p-1">
        <ToggleField
          id="PhysActivity" label="Physical Activity"
          description="Did you participate in any physical activity or exercise during the past 30 days other than your regular job?"
          value={form.PhysActivity}
          onChange={(v) => updateField("PhysActivity", v)}
          positiveLabel="Active" negativeLabel="Inactive"
        />
        <ToggleField
          id="Fruits" label="Daily Fruit Consumption"
          description="Do you consume fruit one or more times per day?"
          value={form.Fruits}
          onChange={(v) => updateField("Fruits", v)}
        />
        <ToggleField
          id="Veggies" label="Daily Vegetable Consumption"
          description="Do you consume vegetables one or more times per day?"
          value={form.Veggies}
          onChange={(v) => updateField("Veggies", v)}
        />
        <ToggleField
          id="Smoker" label="Smoker"
          description="Have you smoked at least 100 cigarettes in your entire life? (approx. 5 packs)"
          value={form.Smoker}
          onChange={(v) => updateField("Smoker", v)}
        />
        <ToggleField
          id="HvyAlcoholConsump" label="Heavy Alcohol Consumption"
          description="Adult men with more than 14 drinks/week or adult women with more than 7 drinks/week."
          value={form.HvyAlcoholConsump}
          onChange={(v) => updateField("HvyAlcoholConsump", v)}
          positiveLabel="Heavy" negativeLabel="Not Heavy"
        />
      </div>
    </div>
  );
}
