"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Activity,
  HeartPulse,
  Download,
  RotateCcw,
  ListOrdered,
  Printer,
  Sparkles,
  Siren,
  Leaf,
  AlertCircle,
} from "lucide-react";
import type { PredictionResponse, LifestyleRiskLevel } from "@/types";

const RISK_STYLES: Record<LifestyleRiskLevel, { badge: string; bar: string; card: string }> = {
  Low: {
    badge: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
    card: "border-slate-200 dark:border-slate-800",
  },
  Elevated: {
    badge: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
    card: "border-amber-200 dark:border-amber-900",
  },
  High: {
    badge: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
    bar: "bg-rose-500",
    card: "border-rose-200 dark:border-rose-900",
  },
};

const TYPE_STYLES: Record<string, string> = {
  Chronic: "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300",
  "Acute / Infectious": "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
  Emergency: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
  "Recurrent / Episodic": "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
};

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("clinix_prediction_result") || sessionStorage.getItem("endocare_prediction_result");
    if (!raw) {
      router.push("/assess");
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      router.push("/assess");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="w-full min-h-screen bg-[#FAFBFB] dark:bg-[#090D16] flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const handleExportText = () => {
    const performed = result.symptom_analysis_performed;
    const lines: string[] = [];
    lines.push("CLINIXAI — HEALTH SCREENING REPORT");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");
    if (result.red_flags?.length) {
      lines.push("URGENT WARNINGS:");
      result.red_flags.forEach((f) => lines.push(`- ${f.title}: ${f.message}`));
      lines.push("");
    }
    if (performed) {
      lines.push(result.is_conclusive ? "MOST LIKELY MATCH (NOT A DIAGNOSIS):" : "RESULT: NO CLEAR MATCH");
      lines.push(
        result.is_conclusive
          ? `${result.predicted_disease} [${result.condition_type}] (${(result.confidence_score * 100).toFixed(1)}% match, ${result.severity_level})`
          : result.status_message
      );
      lines.push("");
      lines.push("CLINICAL SUMMARY:");
      lines.push(result.description);
      lines.push("");
      lines.push("RECOMMENDED PRECAUTIONS:");
      result.precautions.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
      lines.push("");
      lines.push("POSSIBLE CONDITIONS (RANKED BY MATCH):");
      result.differential_diagnoses.forEach((d) => lines.push(`- ${d.disease}: ${d.percentage}`));
      lines.push("");
      lines.push("SYMPTOMS ENTERED:");
      result.matched_symptoms.forEach((s) => lines.push(`- ${s.label}`));
      lines.push("");
    } else {
      lines.push("LIFESTYLE SCREENING ONLY");
      lines.push(result.status_message);
      lines.push("");
    }
    if (result.lifestyle) {
      lines.push("LIFESTYLE RISK SCREENING:");
      if (result.lifestyle.bmi) lines.push(`BMI: ${result.lifestyle.bmi} (${result.lifestyle.bmi_category})`);
      result.lifestyle.conditions.forEach((c) => {
        lines.push(`- ${c.condition}: ${c.risk_level} risk (${c.method}) - ${c.summary}`);
        c.notes.forEach((n) => lines.push(`    Note: ${n}`));
      });
      lines.push("");
      if (result.lifestyle.advice.length) {
        lines.push("LIFESTYLE ADVICE:");
        result.lifestyle.advice.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
        lines.push("");
      }
    }
    lines.push("DISCLAIMER:");
    lines.push(result.disclaimer);

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const tag = performed && result.is_conclusive ? result.predicted_disease : performed ? "NoClearMatch" : "Lifestyle";
    link.download = `ClinixAI_${tag.replace(/[^a-zA-Z0-9]/g, "_")}_Report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Only colour the banner red when the match itself is trustworthy
  const performed = result.symptom_analysis_performed;
  const hasRedFlags = (result.red_flags?.length ?? 0) > 0;
  const isUrgent = hasRedFlags || (result.is_conclusive && result.severity_level.includes("High"));

  return (
    <div className="w-full min-h-screen bg-[#FAFBFB] dark:bg-[#090D16] py-8 px-4 sm:px-8 lg:px-12 space-y-8">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/assess"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Symptoms
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={handleExportText}
            className="px-4 py-1.5 rounded-xl border border-teal-200 bg-teal-50 dark:bg-teal-950 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download Report
          </button>
          <Link
            href="/assess"
            className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Assessment
          </Link>
        </div>
      </div>

      {/* ── Urgent red-flag warnings ─────────────────────────────────────── */}
      {hasRedFlags && (
        <div className="w-full rounded-2xl p-5 border-2 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <Siren className="w-5 h-5" />
            <h2 className="text-base font-extrabold">Seek urgent medical care</h2>
          </div>
          {result.red_flags.map((f) => (
            <div key={f.title} className="text-sm text-rose-900 dark:text-rose-100">
              <p className="font-bold">{f.title}</p>
              <p>{f.message}</p>
              {f.symptoms.length > 0 && (
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                  Because you selected: {f.symptoms.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Primary Result Banner (100% Width) ───────────────────────────── */}
      <div
        className={`w-full rounded-2xl p-6 sm:p-8 border shadow-sm ${
          isUrgent
            ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
            : "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900"
        }`}
      >
        {performed && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  isUrgent
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                    : "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200"
                }`}
              >
                {result.severity_level}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Model match: {(result.confidence_score * 100).toFixed(1)}% ({result.confidence_level})
              </span>
              {result.is_conclusive && result.condition_type && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    TYPE_STYLES[result.condition_type] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {result.condition_type}
                </span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Severity Score: {result.severity_score}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs uppercase font-extrabold text-teal-600 tracking-wider">
            {!performed
              ? "Lifestyle Risk Screening"
              : result.is_conclusive
              ? "Most Likely Match (not a diagnosis)"
              : "Result"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            {!performed
              ? "Chronic disease risk"
              : result.is_conclusive
              ? result.predicted_disease
              : "No clear match"}
          </h1>
          <p
            className={`text-sm font-semibold ${
              !performed || result.is_conclusive
                ? "text-slate-700 dark:text-slate-200"
                : "text-amber-700 dark:text-amber-300"
            }`}
          >
            {result.status_message}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-4xl">
            {result.description}
          </p>
        </div>

        {performed && result.is_conclusive && (result.unexplained_symptoms?.length ?? 0) > 0 && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Not typical of {result.predicted_disease}:</strong>{" "}
              {result.unexplained_symptoms.map((s) => s.label).join(", ")}. These may point to another cause.
            </span>
          </div>
        )}
      </div>

      {/* ── Precautions & Differential Diagnosis (100% Width 2-Col Grid) ── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Precautions (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {performed ? "Recommended Precautions" : "Recommended Lifestyle Changes"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {result.precautions.map((prec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {i + 1}
                </span>
                <span>{prec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Differential Rankings (5 cols) */}
        {performed && (
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {result.is_conclusive ? "Top 5 Possible Conditions" : "Possible Conditions (not a diagnosis)"}
            </h2>
          </div>

          <div className="space-y-3 pt-1">
            {result.differential_diagnoses.map((item, idx) => {
              const pct = item.probability * 100;
              return (
                <div key={item.disease} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {idx + 1}. {item.disease}
                    </span>
                    <span className="font-mono text-slate-500">{item.percentage}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                    {item.condition_type && (
                      <span className={`px-1.5 py-0.5 rounded font-bold ${TYPE_STYLES[item.condition_type] ?? "bg-slate-100 text-slate-600"}`}>
                        {item.condition_type}
                      </span>
                    )}
                    <span>
                      {(item.matching_symptoms?.length ?? 0) > 0
                        ? `Fits: ${item.matching_symptoms!.join(", ")}`
                        : "None of your symptoms are typical of this"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0
                          ? "bg-teal-600"
                          : idx === 1
                          ? "bg-cyan-600"
                          : "bg-slate-400 dark:bg-slate-600"
                      }`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>

      {/* ── Lifestyle screening ───────────────────────────────────────────── */}
      {result.lifestyle && (
        <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Lifestyle Risk Screening
              </h2>
            </div>
            {result.lifestyle.bmi && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                BMI {result.lifestyle.bmi} · {result.lifestyle.bmi_category}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            A screening of your risk from habits, body measurements and family history. It does not mean you have
            the disease.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.lifestyle.conditions.map((c) => {
              const st = RISK_STYLES[c.risk_level];
              const pct = c.score != null && c.max_score ? Math.min(100, (c.score / c.max_score) * 100) : null;
              return (
                <div key={c.condition} className={`p-4 rounded-xl border ${st.card} bg-slate-50/50 dark:bg-slate-800/30 space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.condition}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${st.badge}`}>
                      {c.risk_level} risk
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300">{c.summary}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{c.method}</p>
                  <ul className="space-y-1">
                    {c.factors.map((f) => (
                      <li key={f.label} className="flex items-start gap-2 text-xs">
                        <span
                          className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            f.present ? st.bar : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                        <span className={f.present ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-400"}>
                          {f.label}
                          {f.detail ? ` — ${f.detail}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {c.notes.map((n) => (
                    <p key={n} className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                      {n}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>

          {performed && result.lifestyle.advice.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Lifestyle advice</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.lifestyle.advice.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">{i + 1}</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <div className="w-full p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
        {result.disclaimer}
      </div>

      {/* ── Evaluated Symptoms Tray (100% Width) ─────────────────────────── */}
      {result.matched_symptoms.length > 0 && (
      <div className="w-full bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Evaluated Items ({result.matched_symptoms.length})
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {result.matched_symptoms.map((sym) => (
            <span
              key={sym.id}
              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5"
            >
              <span>{sym.label}</span>
              <span className="text-[10px] font-mono opacity-60">w:{sym.weight}</span>
            </span>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
