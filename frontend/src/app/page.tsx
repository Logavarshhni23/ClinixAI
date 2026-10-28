"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Search,
  Brain,
  Pill,
  HeartPulse,
} from "lucide-react";
import { getModelMetrics } from "@/lib/api";
import type { HealthMetrics } from "@/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    model_accuracy: 1.0,
    num_diseases: 41,
    num_symptoms: 131,
    training_cohort_size: 4920,
    model_type: "Random Forest Ensemble (120 Estimators)",
    last_trained: "2026-10-19",
  });

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await getModelMetrics();
        if (data) {
          setMetrics(data);
        }
      } catch {
        // Fall back gracefully to defaults
      }
    }
    loadMetrics();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#FAFBFB] dark:bg-[#090D16] py-8 sm:py-12 px-4 sm:px-8 lg:px-12 space-y-16">
      {/* ── 100% Full-Width Hero Section ─────────────────────────────────── */}
      <section className="w-full grid lg:grid-cols-12 gap-8 items-center pt-4">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>AI Diagnostic &amp; Prescription Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Symptom Checker &amp;{" "}
            <span className="text-teal-600">Prescription Triage</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Select at least 3 symptoms to see possible conditions and care tips across 41 conditions.
            This is an estimate to guide you, not a medical diagnosis.
          </p>

          {/* Quick Search & Launch Bar */}
          <div className="w-full max-w-2xl p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-100 dark:shadow-none flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-3 px-3 py-1 flex-1 w-full">
              <Search className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search symptoms (e.g. chest pain, fever, cough, rash)..."
                readOnly
                className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none cursor-pointer"
              />
            </div>
            <Link
              href="/assess"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-teal-600/20"
            >
              <span>Analyze Symptoms</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Quick Indicator Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Select:</span>
            {["High Fever", "Chest Pain", "Breathlessness", "Skin Rash", "Joint Pain", "Acidity"].map(
              (item) => (
                <Link
                  key={item}
                  href="/assess"
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  {item}
                </Link>
              )
            )}
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {(metrics.model_accuracy * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 font-medium">Accuracy (on training dataset)</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics.num_diseases || 41}
              </p>
              <p className="text-xs text-slate-500 font-medium">Conditions</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics.num_symptoms || 131}
              </p>
              <p className="text-xs text-slate-500 font-medium">Symptoms</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics.training_cohort_size.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-medium">Patient Cohorts</p>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900">
            <Image
              src="/images/hero-capsule.jpg"
              alt="AI Prescription 3D Medicine"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── 100% Full-Width Feature Cards ────────────────────────────────── */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <Image
              src="/images/rx-dispenser.jpg"
              alt="Smart Prescription Guidance"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              Verified Care Protocols
            </h3>
            <p className="text-xs text-slate-500">
              Immediate precautions, safety actions, and care steps tailored for each condition.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <Image
              src="/images/clinical-brain.jpg"
              alt="Differential Diagnosis Matrix"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-600" />
              Differential Diagnosis
            </h3>
            <p className="text-xs text-slate-500">
              Top 5 probabilistic disease matches with calibrated percentage rankings.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Symptom Severity Triage
            </h3>
            <p className="text-xs text-slate-500">
              131 symptoms weighted on a 1–7 scale to distinguish mild symptoms from urgent alerts.
            </p>
          </div>

          <Link
            href="/assess"
            className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:bg-slate-800"
          >
            Check Symptoms
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
