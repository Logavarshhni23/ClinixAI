"""
ClinixAI — Pydantic v2 Request / Response Schemas
"""

from __future__ import annotations

from typing import Optional, List, Literal
from pydantic import BaseModel, Field


# ── Symptom Models ────────────────────────────────────────────────────────────

class SymptomItem(BaseModel):
    id: str = Field(..., description="Canonical snake_case symptom identifier", example="itching")
    label: str = Field(..., description="Human-readable symptom label", example="Itching")
    weight: int = Field(default=3, ge=1, le=7, description="Clinical severity weight (1 to 7)")
    group: str = Field(default="Other", description="Body-system group used by the UI")
    is_symptom: bool = Field(default=True, description="False for risk factors / history flags that are not symptoms")


# ── Prediction Request & Response ─────────────────────────────────────────────

class LifestyleInput(BaseModel):
    """Optional lifestyle & health profile. Every field is optional."""

    age: Optional[int] = Field(None, ge=1, le=120)
    sex: Optional[Literal["male", "female"]] = None
    height_cm: Optional[float] = Field(None, ge=50, le=250)
    weight_kg: Optional[float] = Field(None, ge=10, le=300)
    waist_cm: Optional[float] = Field(None, ge=40, le=200)
    activity: Optional[Literal["sedentary", "moderate", "active"]] = None
    smoking: Optional[Literal["never", "former", "current"]] = None
    alcohol: Optional[Literal["none", "occasional", "regular", "heavy"]] = None
    sleep_hours: Optional[float] = Field(None, ge=1, le=16)
    eats_fruit_veg_daily: Optional[bool] = None
    high_salt_diet: Optional[bool] = None
    sugary_food_daily: Optional[bool] = None
    family_diabetes: Optional[Literal["none", "one_parent", "both_parents"]] = None
    family_hypertension: Optional[bool] = None
    family_heart_disease: Optional[bool] = None
    known_high_bp: Optional[bool] = None
    known_high_sugar: Optional[bool] = None


class LifestyleFactor(BaseModel):
    label: str
    present: bool
    detail: Optional[str] = None


class LifestyleCondition(BaseModel):
    condition: str
    risk_level: Literal["Low", "Elevated", "High"]
    method: str
    score: Optional[int] = None
    max_score: Optional[int] = None
    summary: str
    factors: List[LifestyleFactor] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)


class LifestyleAssessment(BaseModel):
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
    conditions: List[LifestyleCondition] = Field(default_factory=list)
    advice: List[str] = Field(default_factory=list)


class PredictRequest(BaseModel):
    symptoms: List[str] = Field(
        default_factory=list,
        description="Symptom identifiers reported by the user (at least 3 real symptoms are needed for symptom matching)",
        example=["itching", "skin_rash", "nodal_skin_eruptions"],
    )
    lifestyle: Optional[LifestyleInput] = Field(
        None, description="Optional lifestyle & health profile for chronic-disease risk screening"
    )


class RedFlag(BaseModel):
    title: str
    message: str
    symptoms: List[str] = Field(default_factory=list, description="Labels of the symptoms that triggered the warning")


class DifferentialDiagnosis(BaseModel):
    disease: str = Field(..., description="Disease name")
    probability: float = Field(..., ge=0.0, le=1.0, description="Calibrated posterior probability")
    percentage: str = Field(..., description="Formatted percentage")
    description: str = Field(..., description="Clinical description of the condition")
    precautions: List[str] = Field(default_factory=list, description="Recommended precautions")
    condition_type: str = Field(default="", description="Chronic, Acute / Infectious, Emergency or Recurrent")
    matching_symptoms: List[str] = Field(default_factory=list, description="Selected symptoms that are typical of this condition")


class PredictResponse(BaseModel):
    symptom_analysis_performed: bool = Field(
        default=True, description="False when only a lifestyle screening was run (fewer than 3 symptoms)"
    )
    predicted_disease: str = Field(..., description="Top predicted disease (empty when no symptom analysis was done)")
    condition_type: str = Field(default="", description="Type of the top match")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Model probability for the top class")
    confidence_level: str = Field(..., description="High, Moderate, or Low confidence classification")
    is_conclusive: bool = Field(
        ..., description="False when the evidence is too weak to present any condition as a likely match"
    )
    status_message: str = Field(
        ..., description="Plain-language explanation of how much trust to place in this result"
    )
    severity_level: str = Field(..., description="Severity classification: Mild, Moderate, or High Alert / Urgent")
    severity_score: int = Field(..., description="Sum of clinical weights of all reported symptoms")
    description: str = Field(..., description="Detailed clinical summary")
    precautions: List[str] = Field(..., description="Immediate precautions and care guidance")
    differential_diagnoses: List[DifferentialDiagnosis] = Field(
        default_factory=list, description="Top 5 possible conditions with probabilities"
    )
    matched_symptoms: List[SymptomItem] = Field(
        default_factory=list, description="Recognised symptoms and their weights"
    )
    unexplained_symptoms: List[SymptomItem] = Field(
        default_factory=list, description="Selected symptoms that are NOT typical of the top match"
    )
    red_flags: List[RedFlag] = Field(default_factory=list, description="Urgent-care warnings")
    lifestyle: Optional[LifestyleAssessment] = Field(None, description="Lifestyle-based chronic disease screening")
    disclaimer: str = Field(
        default=(
            "ClinixAI is an educational screening tool built on a small synthetic dataset. "
            "It does NOT diagnose any disease. Always consult a licensed doctor, "
            "and seek emergency care for severe or sudden symptoms."
        )
    )


# ── Disease Information ───────────────────────────────────────────────────────

class DiseaseDetail(BaseModel):
    disease: str
    description: str
    precautions: List[str]
    common_symptoms: List[SymptomItem]


# ── Metrics Model ─────────────────────────────────────────────────────────────

class ModelMetrics(BaseModel):
    training_cohort_size: int
    num_diseases: int
    num_symptoms: int
    model_accuracy: float
    cv_accuracy: float
    f1_score: float
    model_type: str
    last_trained: str
