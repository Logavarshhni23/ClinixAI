/**
 * ClinixAI — Multi-Disease API Client
 * Requests are proxied via Next.js rewrites to http://localhost:8000
 */

import type {
  SymptomItem,
  DiseaseDetail,
  PredictionResponse,
  HealthMetrics,
  LifestyleProfile,
} from "@/types";

const BASE = "/api/v1";

// ── Generic fetch wrapper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = await res.json();
      const d = body?.detail;
      if (typeof d === "string") detail = d;
      else if (Array.isArray(d) && d.length > 0) {
        detail = d.map((e: { loc?: unknown[]; msg?: string }) => `${(e.loc ?? []).slice(1).join(".")}: ${e.msg}`).join("; ");
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export async function getSymptoms(): Promise<SymptomItem[]> {
  return apiFetch<SymptomItem[]>("/symptoms");
}

export async function getDiseases(): Promise<DiseaseDetail[]> {
  return apiFetch<DiseaseDetail[]>("/diseases");
}

export async function predictDisease(
  symptoms: string[],
  lifestyle?: LifestyleProfile
): Promise<PredictionResponse> {
  return apiFetch<PredictionResponse>("/predict", {
    method: "POST",
    body: JSON.stringify({ symptoms, lifestyle: lifestyle ?? null }),
  });
}

export async function getModelMetrics(): Promise<HealthMetrics> {
  return apiFetch<HealthMetrics>("/metrics");
}

export async function healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
  return apiFetch("/health");
}

// ── Legacy Compatibility Functions ───────────────────────────────────────────

import type { PredictPayload, ExplainResponse, SimulationDelta, SimulationResult } from "@/types";

export async function predictRisk(payload: PredictPayload): Promise<any> {
  return apiFetch("/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function explainRisk(payload: PredictPayload): Promise<any> {
  return apiFetch("/explain", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function simulateRisk(
  baseline: PredictPayload,
  delta: SimulationDelta
): Promise<any> {
  return apiFetch("/simulate", {
    method: "POST",
    body: JSON.stringify({ baseline, delta }),
  });
}
