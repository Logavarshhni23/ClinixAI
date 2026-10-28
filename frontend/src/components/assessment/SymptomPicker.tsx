"use client";

import { useMemo, useState } from "react";
import { Search, X, Check, Info } from "lucide-react";
import type { SymptomItem } from "@/types";

const RISK_GROUP = "Risk factors & history"; // must match backend knowledge.RISK_GROUP
const COMMON_ID = "__common__";

/** Everyday symptoms shown first so people do not have to hunt through body systems. */
const COMMON_SYMPTOM_IDS = [
  "high_fever", "mild_fever", "chills", "headache", "cough", "fatigue", "nausea", "vomiting",
  "diarrhoea", "abdominal_pain", "chest_pain", "breathlessness", "joint_pain", "back_pain",
  "skin_rash", "itching", "dizziness", "loss_of_appetite", "weight_loss", "burning_micturition",
  "runny_nose", "throat_irritation", "acidity", "muscle_pain",
];

interface Props {
  symptoms: SymptomItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function SymptomPicker({ symptoms, selectedIds, onToggle }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>(COMMON_ID);

  const groups = useMemo(() => {
    const map = new Map<string, SymptomItem[]>();
    for (const s of symptoms) {
      const g = s.group ?? "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(s);
    }
    return Array.from(map, ([name, items]) => ({ name, items }));
  }, [symptoms]);

  const common = useMemo(
    () => COMMON_SYMPTOM_IDS.map((id) => symptoms.find((s) => s.id === id)).filter(Boolean) as SymptomItem[],
    [symptoms]
  );

  const selectedItems = useMemo(
    () => symptoms.filter((s) => selectedIds.includes(s.id)),
    [symptoms, selectedIds]
  );

  const searching = query.trim().length > 0;
  const q = query.trim().toLowerCase();

  const visible: SymptomItem[] = useMemo(() => {
    if (searching) {
      return symptoms.filter(
        (s) => s.label.toLowerCase().includes(q) || s.id.replace(/_/g, " ").toLowerCase().includes(q)
      );
    }
    if (active === COMMON_ID) return common;
    return groups.find((g) => g.name === active)?.items ?? [];
  }, [searching, q, symptoms, active, common, groups]);

  const countIn = (items: SymptomItem[]) => items.filter((s) => selectedIds.includes(s.id)).length;
  const activeIsRisk = !searching && active === RISK_GROUP;

  const chip = (s: SymptomItem) => {
    const on = selectedIds.includes(s.id);
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => onToggle(s.id)}
        aria-pressed={on}
        className={`text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between gap-2 ${
          on
            ? "bg-teal-50 dark:bg-teal-950 border-teal-500 text-teal-900 dark:text-teal-100 shadow-sm"
            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-300"
        }`}
      >
        <span className="leading-snug">
          {s.label}
          {searching && s.group && (
            <span className="block text-[10px] font-medium text-slate-400 mt-0.5">{s.group}</span>
          )}
        </span>
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
            on ? "bg-teal-600 text-white" : "border border-slate-300 dark:border-slate-600"
          }`}
        >
          {on && <Check className="w-3 h-3" />}
        </span>
      </button>
    );
  };

  const tabCls = (isActive: boolean) =>
    `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
      isActive
        ? "bg-teal-600 text-white"
        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
    }`;

  const badge = (n: number, isActive: boolean) =>
    n > 0 && (
      <span
        className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
          isActive ? "bg-white text-teal-700" : "bg-teal-600 text-white"
        }`}
      >
        {n}
      </span>
    );

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Search + selected chips */}
      <div className="p-4 sm:p-5 space-y-3 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all symptoms (e.g. chest pain, cough, shivering)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-900"
              >
                {item.label}
                <button type="button" onClick={() => onToggle(item.id)} className="hover:text-rose-600" aria-label={`Remove ${item.label}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body-system navigation + symptom chips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Group list */}
        <div className="lg:col-span-3 p-3 sm:p-4 lg:border-r border-b lg:border-b-0 border-slate-100 dark:border-slate-800">
          <p className="hidden lg:block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Browse by body area
          </p>
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar pb-1 lg:pb-0">
            <div className="flex-shrink-0 lg:flex-shrink">
              <button
                type="button"
                onClick={() => {
                  setActive(COMMON_ID);
                  setQuery("");
                }}
                className={tabCls(!searching && active === COMMON_ID)}
              >
                <span>Common symptoms</span>
                {badge(countIn(common), !searching && active === COMMON_ID)}
              </button>
            </div>
            {groups.map((g) => {
              const isActive = !searching && active === g.name;
              return (
                <div key={g.name} className="flex-shrink-0 lg:flex-shrink">
                  <button
                    type="button"
                    onClick={() => {
                      setActive(g.name);
                      setQuery("");
                    }}
                    className={tabCls(isActive)}
                  >
                    <span>{g.name}</span>
                    {badge(countIn(g.items), isActive)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chips */}
        <div className="lg:col-span-9 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {searching
                ? `Search results (${visible.length})`
                : active === COMMON_ID
                ? "Common symptoms"
                : active}
            </h3>
            {!searching && (
              <span className="text-[11px] text-slate-400">
                {countIn(visible)} of {visible.length} selected
              </span>
            )}
          </div>

          {activeIsRisk && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                These are risk factors and history, not symptoms. They help the match when they apply to you, but they
                do <strong>not</strong> count towards the 3 symptoms needed.
              </span>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {searching ? <>No symptoms match &quot;{query}&quot;.</> : "No symptoms in this group."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">{visible.map(chip)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
