"""
EndoCare AI — Multi-Disease Diagnosis Training Pipeline
======================================================
Trains an ensemble Random Forest model on the 41-Disease Symptom dataset,
evaluates cross-validation performance, normalizes symptoms and precautions,
and persists all artefacts for the inference engine.

Usage:
    cd backend
    python train.py
"""

from __future__ import annotations

import sys
import logging
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, f1_score

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
BASE_DIR = BACKEND_DIR.parent
DATASET_DIR = BASE_DIR / "dataset"
MODELS_DIR = BACKEND_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def normalize_symptom(sym: str) -> str:
    """Standardize symptom string by trimming, lowercasing, and fixing dataset typos."""
    if not isinstance(sym, str):
        return ""
    sym = sym.strip().lower()
    if sym in ("nan", "none", ""):
        return ""
    sym = sym.replace(" ", "_")
    while "__" in sym:
        sym = sym.replace("__", "_")
    
    # Specific known fixes in Kaggle symptom datasets
    typo_map = {
        "dischromic__patches": "dischromic_patches",
        "dischromic_patches": "dischromic_patches",
        "spotting__urination": "spotting_urination",
        "spotting_urination": "spotting_urination",
        "foul_smell_of_urine": "foul_smell_of_urine",
    }
    return typo_map.get(sym, sym).strip("_")


def normalize_disease(dis: str) -> str:
    """Standardize disease name and handle known typo discrepancies."""
    if not isinstance(dis, str):
        return ""
    dis = dis.strip()
    if dis.lower() == "dimorphic hemmorhoids(piles)":
        return "Dimorphic hemorrhoids(piles)"
    return dis


def format_symptom_label(sym: str) -> str:
    """Convert snake_case symptom id into a clean clinical label."""
    return " ".join(word.capitalize() for word in sym.split("_"))


def train() -> None:
    log.info("=" * 60)
    log.info("Starting Multi-Disease Symptom Intelligence Training Pipeline")
    log.info("=" * 60)

    # 1. Load Symptom Severities
    sev_path = DATASET_DIR / "Symptom-severity.csv"
    if not sev_path.exists():
        raise FileNotFoundError(f"Missing severity file: {sev_path}")
    sev_df = pd.read_csv(sev_path)
    symptom_severities: dict[str, int] = {}
    for _, row in sev_df.iterrows():
        s = normalize_symptom(str(row["Symptom"]))
        if s:
            symptom_severities[s] = int(row["weight"])
    log.info("Loaded %d symptom severity entries", len(symptom_severities))

    # 2. Load Disease Descriptions
    desc_path = DATASET_DIR / "symptom_Description.csv"
    if not desc_path.exists():
        raise FileNotFoundError(f"Missing description file: {desc_path}")
    desc_df = pd.read_csv(desc_path)
    disease_descriptions: dict[str, str] = {}
    for _, row in desc_df.iterrows():
        d = normalize_disease(str(row["Disease"]))
        if d:
            disease_descriptions[d] = str(row["Description"]).strip()
    log.info("Loaded %d disease clinical descriptions", len(disease_descriptions))

    # 3. Load Disease Precautions
    prec_path = DATASET_DIR / "symptom_precaution.csv"
    if not prec_path.exists():
        raise FileNotFoundError(f"Missing precaution file: {prec_path}")
    prec_df = pd.read_csv(prec_path)
    disease_precautions: dict[str, list[str]] = {}
    for _, row in prec_df.iterrows():
        d = normalize_disease(str(row["Disease"]))
        precs = []
        for col in ["Precaution_1", "Precaution_2", "Precaution_3", "Precaution_4"]:
            if col in row and pd.notna(row[col]) and str(row[col]).strip():
                precs.append(str(row[col]).strip().capitalize())
        if d:
            disease_precautions[d] = precs
    log.info("Loaded %d disease precaution guides", len(disease_precautions))

    # 4. Load Main Dataset
    data_path = DATASET_DIR / "dataset.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Missing dataset file: {data_path}")
    df = pd.read_csv(data_path)
    log.info("Loaded dataset with shape %s", df.shape)

    df["Disease"] = df["Disease"].apply(normalize_disease)
    symptom_cols = [c for c in df.columns if c.startswith("Symptom")]
    for c in symptom_cols:
        df[c] = df[c].apply(normalize_symptom)

    # Collect all unique symptoms
    unique_symptoms: set[str] = set()
    for c in symptom_cols:
        unique_symptoms.update(df[c][df[c] != ""].unique())
    unique_symptoms.update(symptom_severities.keys())
    symptoms_list_ordered = sorted(list(unique_symptoms))
    log.info("Identified %d unique standardized symptoms", len(symptoms_list_ordered))

    # Default severity weight for any unlisted symptom
    for s in symptoms_list_ordered:
        if s not in symptom_severities:
            symptom_severities[s] = 3

    # Build binary feature matrix X
    symptom_to_idx = {s: i for i, s in enumerate(symptoms_list_ordered)}
    n_samples = len(df)
    n_features = len(symptoms_list_ordered)

    X = np.zeros((n_samples, n_features), dtype=np.int32)
    for row_idx, (_, row) in enumerate(df.iterrows()):
        for c in symptom_cols:
            sym = row[c]
            if sym and sym in symptom_to_idx:
                X[row_idx, symptom_to_idx[sym]] = 1

    # Encode Disease targets
    le = LabelEncoder()
    y = le.fit_transform(df["Disease"])
    num_classes = len(le.classes_)
    log.info("Encoded %d distinct disease classes", num_classes)

    # Precalculate disease knowledge dictionary
    disease_info = {}
    for disease_name in le.classes_:
        disease_samples_mask = (df["Disease"] == disease_name)
        disease_X = X[disease_samples_mask]
        symptom_freqs = disease_X.sum(axis=0)
        top_indices = np.argsort(symptom_freqs)[::-1]
        common_syms = [
            {
                "id": symptoms_list_ordered[idx],
                "label": format_symptom_label(symptoms_list_ordered[idx]),
                "weight": symptom_severities.get(symptoms_list_ordered[idx], 3),
            }
            for idx in top_indices
            if symptom_freqs[idx] > 0
        ]
        disease_info[disease_name] = {
            "disease": disease_name,
            "description": disease_descriptions.get(
                disease_name,
                f"Clinical description for {disease_name}."
            ),
            "precautions": disease_precautions.get(
                disease_name,
                ["Consult a certified physician for specialized medical advice.", "Maintain rest and hydration."]
            ),
            "common_symptoms": common_syms[:8],
        }

    # Evaluate Model: Train / Test Split
    log.info("Evaluating model performance on 80/20 train-test split ...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    eval_clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=1)
    eval_clf.fit(X_train, y_train)

    y_pred = eval_clf.predict(X_test)
    test_acc = float(accuracy_score(y_test, y_pred))
    test_f1 = float(f1_score(y_test, y_pred, average="weighted"))

    # 5-Fold Stratified Cross Validation
    log.info("Running 5-fold stratified cross-validation ...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(eval_clf, X, y, cv=cv, scoring="accuracy", n_jobs=1)
    mean_cv_acc = float(np.mean(cv_scores))

    log.info("Test Accuracy  : %.4f (%.2f%%)", test_acc, test_acc * 100)
    log.info("Weighted F1    : %.4f", test_f1)
    log.info("5-Fold CV Acc  : %.4f (± %.4f)", mean_cv_acc, float(np.std(cv_scores)))

    # Train Final Production Model on 100% of data
    log.info("Training final production ensemble model on full dataset (%d records) ...", n_samples)
    final_model = RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=1)
    final_model.fit(X, y)

    # Symptom metadata list for API and Frontend
    symptom_objects = [
        {
            "id": s,
            "label": format_symptom_label(s),
            "weight": symptom_severities.get(s, 3),
        }
        for s in symptoms_list_ordered
    ]

    metrics = {
        "training_cohort_size": int(n_samples),
        "num_diseases": int(num_classes),
        "num_symptoms": int(n_features),
        "model_accuracy": float(test_acc),
        "cv_accuracy": float(mean_cv_acc),
        "f1_score": float(test_f1),
        "model_type": "Random Forest Ensemble (120 Estimators)",
        "last_trained": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    # Persist Artefacts
    log.info("Persisting artefacts to %s ...", MODELS_DIR)
    joblib.dump(final_model, MODELS_DIR / "disease_model.joblib")
    joblib.dump(symptoms_list_ordered, MODELS_DIR / "symptoms_list.joblib")
    joblib.dump(symptom_objects, MODELS_DIR / "symptoms_metadata.joblib")
    joblib.dump(le, MODELS_DIR / "label_encoder.joblib")
    joblib.dump(disease_info, MODELS_DIR / "disease_info.joblib")
    joblib.dump(symptom_severities, MODELS_DIR / "symptom_severities.joblib")
    joblib.dump(metrics, MODELS_DIR / "model_metrics.joblib")

    log.info("=" * 60)
    log.info("✓ Training Pipeline Finished Successfully!")
    log.info("  Diseases Covered : %d", num_classes)
    log.info("  Symptoms Tracked : %d", n_features)
    log.info("  Accuracy Score   : %.2f%%", test_acc * 100)
    log.info("=" * 60)


if __name__ == "__main__":
    train()
