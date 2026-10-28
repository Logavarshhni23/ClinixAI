import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskCategory, HealthFormData, PredictPayload } from "@/types";

// ── Tailwind class merge helper ───────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── BMI calculator ────────────────────────────────────────────────────────────
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// ── BMI classification ────────────────────────────────────────────────────────
export function bmiCategory(bmi: number): {
  label: string;
  color: string;
} {
  if (bmi < 18.5) return { label: "Underweight", color: "text-brand-500" };
  if (bmi < 25)   return { label: "Normal",      color: "text-health-emerald" };
  if (bmi < 30)   return { label: "Overweight",  color: "text-health-amber" };
  return              { label: "Obese",       color: "text-health-rose" };
}

// ── Risk colour tokens ────────────────────────────────────────────────────────
export function riskColor(category: RiskCategory): {
  bg: string;
  text: string;
  border: string;
  hex: string;
} {
  switch (category) {
    case "Low Risk":
      return {
        bg: "bg-health-emerald-light",
        text: "text-health-emerald",
        border: "border-health-emerald",
        hex: "#059669",
      };
    case "Elevated Risk":
      return {
        bg: "bg-health-amber-light",
        text: "text-health-amber",
        border: "border-health-amber",
        hex: "#D97706",
      };
    case "High Risk":
      return {
        bg: "bg-health-rose-light",
        text: "text-health-rose",
        border: "border-health-rose",
        hex: "#DC2626",
      };
  }
}

// ── Risk score → gauge degrees (0–180 arc) ────────────────────────────────────
export function riskScoreToAngle(score: number): number {
  return Math.round(score * 180);
}

// ── Age category label ────────────────────────────────────────────────────────
export const AGE_LABELS: Record<number, string> = {
  1:  "18–24",
  2:  "25–29",
  3:  "30–34",
  4:  "35–39",
  5:  "40–44",
  6:  "45–49",
  7:  "50–54",
  8:  "55–59",
  9:  "60–64",
  10: "65–69",
  11: "70–74",
  12: "75–79",
  13: "80+",
};

// ── Education label ───────────────────────────────────────────────────────────
export const EDUCATION_LABELS: Record<number, string> = {
  1: "Never attended school",
  2: "Elementary",
  3: "Some high school",
  4: "High school graduate",
  5: "Some college",
  6: "College graduate",
};

// ── Income label ──────────────────────────────────────────────────────────────
export const INCOME_LABELS: Record<number, string> = {
  1: "< $10,000",
  2: "$10,000 – $15,000",
  3: "$15,000 – $20,000",
  4: "$20,000 – $25,000",
  5: "$25,000 – $35,000",
  6: "$35,000 – $50,000",
  7: "$50,000 – $75,000",
  8: "> $75,000",
};

// ── General health label ──────────────────────────────────────────────────────
export const GEN_HEALTH_LABELS: Record<number, string> = {
  1: "Excellent",
  2: "Very Good",
  3: "Good",
  4: "Fair",
  5: "Poor",
};

// ── Strip UI-only fields to build API payload ────────────────────────────────
export function formToPayload(form: HealthFormData): PredictPayload {
  const { heightCm: _h, weightKg: _w, ...rest } = form;
  void _h; void _w;
  return rest;
}

// ── Format probability as percentage string ───────────────────────────────────
export function pct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

// ── Default form values ───────────────────────────────────────────────────────
export const DEFAULT_FORM: HealthFormData = {
  Age: 7,
  Sex: 0,
  heightCm: 165,
  weightKg: 70,
  BMI: 25.7,
  Education: 4,
  Income: 5,
  HighBP: 0,
  HighChol: 0,
  CholCheck: 1,
  Stroke: 0,
  HeartDiseaseorAttack: 0,
  PhysActivity: 1,
  Fruits: 1,
  Veggies: 1,
  HvyAlcoholConsump: 0,
  Smoker: 0,
  GenHlth: 2,
  MentHlth: 0,
  PhysHlth: 0,
  DiffWalk: 0,
  AnyHealthcare: 1,
  NoDocbcCost: 0,
};
