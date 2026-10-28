"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Activity, ArrowRight, Info } from "lucide-react";
import { getSymptoms, predictDisease } from "@/lib/api";
import type { SymptomItem, LifestyleProfile } from "@/types";
import { SymptomPicker } from "@/components/assessment/SymptomPicker";
import {
  LifestyleForm,
  isLifestyleReady,
  hasAnyLifestyleInput,
  validateLifestyle,
} from "@/components/assessment/LifestyleForm";

const MIN_SYMPTOMS = 3; // must match MIN_SYMPTOMS in backend/app/core/config.py
const LIFESTYLE_KEY = "clinix_lifestyle_profile";

export default function AssessPage() {
  const router = useRouter();
  const [allSymptoms, setAllSymptoms] = useState<SymptomItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<LifestyleProfile>({});
  const [lifestyleOpen, setLifestyleOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSymptomList() {
      try {
        const data = await getSymptoms();
        setAllSymptoms(data);
      } catch (err) {
        setErrorMessage("Backend is not running. Please start FastAPI on port 8000.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSymptomList();
  }, []);

  // Restore / persist the lifestyle profile for this browser session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LIFESTYLE_KEY);
      if (raw) setLifestyle(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(LIFESTYLE_KEY, JSON.stringify(lifestyle));
    } catch {
      /* storage unavailable */
    }
  }, [lifestyle]);

  const selectedItems = useMemo(
    () => allSymptoms.filter((s) => selectedIds.includes(s.id)),
    [allSymptoms, selectedIds]
  );

  // Risk factors / history flags are not symptoms and do not count towards the minimum
  const realSymptomCount = useMemo(
    () => selectedItems.filter((s) => s.is_symptom !== false).length,
    [selectedItems]
  );

  const totalSeverity = useMemo(
    () => selectedItems.filter((s) => s.is_symptom !== false).reduce((acc, curr) => acc + curr.weight, 0),
    [selectedItems]
  );

  const lifestyleReady = isLifestyleReady(lifestyle);
  const symptomsReady = realSymptomCount >= MIN_SYMPTOMS;
  const canSubmit = symptomsReady || lifestyleReady;

  const toggleSymptom = (id: string) => {
    setErrorMessage(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearAll = () => {
    setSelectedIds([]);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMessage(
        `Select at least ${MIN_SYMPTOMS} symptoms (you selected ${realSymptomCount}), or fill in age, sex, height and weight in the lifestyle profile.`
      );
      return;
    }
    const lifestyleError = hasAnyLifestyleInput(lifestyle) ? validateLifestyle(lifestyle) : null;
    if (lifestyleError) {
      setErrorMessage(lifestyleError);
      setLifestyleOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await predictDisease(
        selectedIds,
        lifestyleReady ? lifestyle : undefined
      );
      sessionStorage.setItem("clinix_prediction_result", JSON.stringify(result));
      sessionStorage.setItem("endocare_prediction_result", JSON.stringify(result));
      router.push("/results");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Inference error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const ctaLabel = symptomsReady ? "Check Possible Conditions" : "Run Lifestyle Screening";
  const lifestyleHint =
    hasAnyLifestyleInput(lifestyle) && !lifestyleReady
      ? "Add age, sex, height and weight in the lifestyle profile to include a lifestyle screening in your result."
      : null;

  return (
    <div className="w-full min-h-screen bg-[#FAFBFB] dark:bg-[#090D16] py-8 px-4 sm:px-8 lg:px-12 space-y-6">
      {/* ── 100% Width Top Bar ────────────────────────────────────────── */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Health Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Select at least {MIN_SYMPTOMS} symptoms to see possible conditions, and/or add your lifestyle profile to
            screen for chronic disease risk.
          </p>
        </div>

        {/* Selected Counter & Direct Run CTA */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {realSymptomCount} Symptom{realSymptomCount === 1 ? "" : "s"}
                {realSymptomCount < MIN_SYMPTOMS && ` (need ${MIN_SYMPTOMS - realSymptomCount} more)`}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono font-bold">
                Severity: {totalSeverity}
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-rose-500 hover:text-rose-600 text-xs font-semibold ml-1"
              >
                Clear
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              !canSubmit || isSubmitting
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                {ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Lifestyle & health profile (optional) ─────────────────────── */}
      <LifestyleForm
        value={lifestyle}
        onChange={(next) => {
          setErrorMessage(null);
          setLifestyle(next);
        }}
        open={lifestyleOpen}
        onToggle={() => setLifestyleOpen((o) => !o)}
      />
      {lifestyleHint && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{lifestyleHint}</span>
        </div>
      )}

      {/* ── Symptom selection ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="w-full bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <Activity className="w-6 h-6 animate-spin text-teal-600" />
          <span>Loading symptoms...</span>
        </div>
      ) : (
        <SymptomPicker symptoms={allSymptoms} selectedIds={selectedIds} onToggle={toggleSymptom} />
      )}
    </div>
  );
}
