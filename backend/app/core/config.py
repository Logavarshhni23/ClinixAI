"""
ClinixAI - Core Application Configuration
Centralised settings loaded from environment variables with sensible defaults.
"""

from pathlib import Path
from pydantic_settings import BaseSettings

# Resolve the root paths once at import time
BASE_DIR = Path(__file__).resolve().parents[3]          # project root
BACKEND_DIR = Path(__file__).resolve().parents[2]       # backend/
MODELS_DIR = BACKEND_DIR / "models"
DATASET_DIR = BASE_DIR / "dataset"


class Settings(BaseSettings):
    # ── Application identity ──────────────────────────────────────────────────
    APP_NAME: str = "ClinixAI"
    APP_VERSION: str = "2.0.0"
    APP_DESCRIPTION: str = (
        "Chronic Disease Differential Prediction Platform — "
        "multi-disease diagnosis and symptom risk estimation across 41 conditions."
    )

    # ── Server ────────────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ── Prediction safety rules ───────────────────────────────────────────────
    # The training data only contains records with 3-17 symptoms, so the model
    # has never seen 1-2 symptoms and guesses wildly on them.
    MIN_SYMPTOMS: int = 3
    # Below this top-class probability the result is shown as "inconclusive"
    # instead of a diagnosis (at >= 0.50 the model is ~92% right on 3 symptoms).
    CONFIDENCE_THRESHOLD: float = 0.50
    # A match is only presented as "likely" when the symptoms really fit that
    # disease (checked against the disease's own symptom profile in the dataset):
    #   - at least MIN_MATCHED_SYMPTOMS selected symptoms occur in that disease,
    #   - at least one of them is "distinctive" (occurs in <= DISTINCTIVE_MAX diseases),
    #   - at least MIN_COVERAGE of the selected symptoms are explained by it.
    # Generic symptoms (fatigue, headache, vomiting, fever ...) appear in 10+ diseases,
    # so a set made only of them can never produce a confident disease label.
    MIN_MATCHED_SYMPTOMS: int = 2
    DISTINCTIVE_MAX: int = 4
    MIN_COVERAGE: float = 0.6

    # ── Model artefacts ───────────────────────────────────────────────────────
    MODEL_PATH: Path = MODELS_DIR / "disease_model.joblib"
    SYMPTOMS_LIST_PATH: Path = MODELS_DIR / "symptoms_list.joblib"
    SYMPTOMS_METADATA_PATH: Path = MODELS_DIR / "symptoms_metadata.joblib"
    LABEL_ENCODER_PATH: Path = MODELS_DIR / "label_encoder.joblib"
    DISEASE_INFO_PATH: Path = MODELS_DIR / "disease_info.joblib"
    SYMPTOM_SEVERITIES_PATH: Path = MODELS_DIR / "symptom_severities.joblib"
    MODEL_METRICS_PATH: Path = MODELS_DIR / "model_metrics.joblib"

    # Legacy compatibility paths (if ever referenced)
    DIABETES_MODEL_PATH: Path = MODELS_DIR / "diabetes_model.joblib"
    SCALER_PATH: Path = MODELS_DIR / "scaler.joblib"
    FEATURE_NAMES_PATH: Path = MODELS_DIR / "feature_names.joblib"

    # ── Dataset paths ─────────────────────────────────────────────────────────
    DATASET_PATH: Path = DATASET_DIR / "dataset.csv"
    SYMPTOM_SEVERITY_PATH: Path = DATASET_DIR / "Symptom-severity.csv"
    SYMPTOM_DESC_PATH: Path = DATASET_DIR / "symptom_Description.csv"
    SYMPTOM_PRECAUTION_PATH: Path = DATASET_DIR / "symptom_precaution.csv"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Singleton instance consumed throughout the app
settings = Settings()
