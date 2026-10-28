// ── Multi-Disease Symptom Intelligence Types ─────────────────────────────────

export interface SymptomItem {
  id: string;
  label: string;
  weight: number;
  /** Body-system group, provided by the backend */
  group?: string;
  /** false for risk factors / history flags (family history, alcohol history ...) */
  is_symptom?: boolean;
}

// ── Lifestyle profile (optional input) & screening result ────────────────────

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "moderate" | "active";
export type SmokingStatus = "never" | "former" | "current";
export type AlcoholUse = "none" | "occasional" | "regular" | "heavy";
export type FamilyDiabetes = "none" | "one_parent" | "both_parents";

export interface LifestyleProfile {
  age?: number;
  sex?: Sex;
  height_cm?: number;
  weight_kg?: number;
  waist_cm?: number;
  activity?: ActivityLevel;
  smoking?: SmokingStatus;
  alcohol?: AlcoholUse;
  sleep_hours?: number;
  eats_fruit_veg_daily?: boolean;
  high_salt_diet?: boolean;
  sugary_food_daily?: boolean;
  family_diabetes?: FamilyDiabetes;
  family_hypertension?: boolean;
  family_heart_disease?: boolean;
  known_high_bp?: boolean;
  known_high_sugar?: boolean;
}

export type LifestyleRiskLevel = "Low" | "Elevated" | "High";

export interface LifestyleFactor {
  label: string;
  present: boolean;
  detail?: string | null;
}

export interface LifestyleCondition {
  condition: string;
  risk_level: LifestyleRiskLevel;
  method: string;
  score?: number | null;
  max_score?: number | null;
  summary: string;
  factors: LifestyleFactor[];
  notes: string[];
}

export interface LifestyleAssessment {
  bmi?: number | null;
  bmi_category?: string | null;
  conditions: LifestyleCondition[];
  advice: string[];
}

export interface RedFlag {
  title: string;
  message: string;
  symptoms: string[];
}

export interface DifferentialDiagnosis {
  disease: string;
  probability: number;
  percentage: string;
  description: string;
  precautions: string[];
  condition_type?: string;
  matching_symptoms?: string[];
}

export interface PredictionResponse {
  /** false when only the lifestyle screening was run (fewer than 3 symptoms) */
  symptom_analysis_performed: boolean;
  condition_type?: string;
  predicted_disease: string;
  confidence_score: number;
  confidence_level: "High" | "Moderate" | "Low";
  is_conclusive: boolean;
  status_message: string;
  severity_level: "High Alert / Urgent" | "Moderate" | "Mild";
  severity_score: number;
  description: string;
  precautions: string[];
  differential_diagnoses: DifferentialDiagnosis[];
  matched_symptoms: SymptomItem[];
  unexplained_symptoms: SymptomItem[];
  red_flags: RedFlag[];
  lifestyle?: LifestyleAssessment | null;
  disclaimer: string;
}

export interface DiseaseDetail {
  disease: string;
  description: string;
  precautions: string[];
  common_symptoms: SymptomItem[];
}

export interface HealthMetrics {
  training_cohort_size: number;
  num_diseases?: number;
  num_symptoms?: number;
  model_accuracy: number;
  cv_accuracy?: number;
  f1_score?: number;
  roc_auc_score?: number;
  sensitivity?: number;
  specificity?: number;
  model_type: string;
  last_trained: string;
}

// ── Legacy Assessment & Simulation Types (Maintained for Component Compatibility) ──

export interface HealthFormData {
  Age: number;
  Sex: number;
  heightCm: number;
  weightKg: number;
  BMI: number;
  Education: number;
  Income: number;
  HighBP: number;
  HighChol: number;
  CholCheck: number;
  Stroke: number;
  HeartDiseaseorAttack: number;
  PhysActivity: number;
  Fruits: number;
  Veggies: number;
  HvyAlcoholConsump: number;
  Smoker: number;
  GenHlth: number;
  MentHlth: number;
  PhysHlth: number;
  DiffWalk: number;
  AnyHealthcare: number;
  NoDocbcCost: number;
}

export type PredictPayload = Omit<HealthFormData, "heightCm" | "weightKg">;

export type RiskCategory = "Low Risk" | "Elevated Risk" | "High Risk";
export type RiskLabel = "No Diabetes" | "Prediabetes" | "Diabetes";
export type Confidence = "High" | "Moderate" | "Low";
export type SHAPDirection = "risk" | "protective" | "neutral";

export interface RiskProbabilities {
  no_diabetes: number;
  prediabetes: number;
  diabetes: number;
}

export interface SHAPFeature {
  feature: string;
  value: number;
  shap_value: number;
  direction: SHAPDirection;
  display_label: string;
}

export interface ExplainResponse {
  shap_values: SHAPFeature[];
  base_value: number;
  prediction_probability: number;
  top_risk_drivers: SHAPFeature[];
  top_protective_factors: SHAPFeature[];
}

export interface SimulationResult {
  baseline_risk_score: number;
  projected_risk_score: number;
  risk_delta: number;
  risk_delta_percent: number;
  baseline_category: RiskCategory;
  projected_category: RiskCategory;
  changed_features: Record<
    string,
    { from: number; to: number; delta: number; impact: string }
  >;
  summary: string;
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export type SimulationDelta = Partial<Record<keyof PredictPayload, number>>;
