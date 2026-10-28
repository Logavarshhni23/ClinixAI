"""
ClinixAI — Inference Service
============================
Loads the trained Random Forest and turns raw symptom + lifestyle input into a
safe, explainable result.

Why this is more than ``model.predict``:

1. The Random Forest must always pick one of 41 diseases (there is no "healthy /
   minor" class).  A few basic symptoms therefore produce a random-looking disease.
   Every prediction is cross-checked against the disease's own symptom profile
   (built from the dataset) and only shown as a likely match if the symptoms
   genuinely fit it.  Otherwise the result is "no clear match".
2. Risk-factor flags that the dataset mixed in with symptoms (family history,
   alcohol history ...) do not count towards the 3-symptom minimum.
3. Urgency comes from red-flag rules, not from adding up symptom weights
   (many mild symptoms must not look like an emergency, and one dangerous
   symptom must not be hidden).
4. Optional lifestyle data produces a separate chronic-disease risk screening
   (Indian Diabetes Risk Score + risk-factor counts).
"""

from __future__ import annotations

import collections
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

import joblib
import numpy as np

from app.core.config import settings
from app.models.schemas import (
    DifferentialDiagnosis,
    DiseaseDetail,
    ModelMetrics,
    PredictRequest,
    PredictResponse,
    RedFlag,
    SymptomItem,
)
from app.services import knowledge as kb
from app.services.lifestyle import assess_lifestyle, has_enough_data

log = logging.getLogger(__name__)

# Time-critical conditions: if one of these is a *conclusive* match, treat as urgent
URGENT_CONDITION_TYPES = {kb.EMERGENCY}

GENERIC_PRECAUTIONS = [
    "Add any other symptoms you have and check again.",
    "Rest, drink enough water, and watch how the symptoms change.",
    "See a doctor if symptoms last more than a few days or get worse.",
    "Get emergency help right away for chest pain, trouble breathing, "
    "sudden weakness, confusion or severe pain.",
]


def normalize_symptom(sym: str) -> str:
    """Standardise a symptom string and fold duplicate spellings together."""
    if not isinstance(sym, str):
        return ""
    sym = sym.strip().lower().replace(" ", "_")
    while "__" in sym:
        sym = sym.replace("__", "_")
    sym = sym.strip("_")
    return kb.SYMPTOM_ALIASES.get(sym, sym)


def format_symptom_label(sym: str) -> str:
    if sym in kb.LABEL_OVERRIDES:
        return kb.LABEL_OVERRIDES[sym]
    words = sym.split("_")
    return " ".join([words[0].capitalize()] + [w.lower() for w in words[1:]])


class MLService:
    """Loaded once via lifespan startup; routes use the module-level ``ml_service``."""

    def __init__(self) -> None:
        self._model: Any = None
        self._symptoms_list: List[str] = []
        self._symptoms_metadata: List[Dict[str, Any]] = []
        self._label_encoder: Any = None
        self._disease_info: Dict[str, Any] = {}
        self._symptom_severities: Dict[str, int] = {}
        self._metrics: Dict[str, Any] = {}
        self._symptom_to_idx: Dict[str, int] = {}
        self._classes: List[str] = []
        # disease (clean raw name) -> {symptom: share of that disease's records containing it}
        self._profiles: Dict[str, Dict[str, float]] = {}
        # symptom -> number of diseases it occurs in
        self._symptom_disease_count: Dict[str, int] = {}
        self._ready: bool = False

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def load(self) -> None:
        required = [
            settings.MODEL_PATH, settings.SYMPTOMS_LIST_PATH, settings.SYMPTOMS_METADATA_PATH,
            settings.LABEL_ENCODER_PATH, settings.DISEASE_INFO_PATH,
            settings.SYMPTOM_SEVERITIES_PATH, settings.MODEL_METRICS_PATH,
        ]
        for path in required:
            if not Path(path).exists():
                log.error("Required artefact not found: %s", path)
                raise FileNotFoundError(f"Model artefact missing: {path}")

        log.info("Loading model artefacts ...")
        self._model = joblib.load(settings.MODEL_PATH)
        self._symptoms_list = joblib.load(settings.SYMPTOMS_LIST_PATH)
        self._symptoms_metadata = joblib.load(settings.SYMPTOMS_METADATA_PATH)
        self._label_encoder = joblib.load(settings.LABEL_ENCODER_PATH)
        self._disease_info = joblib.load(settings.DISEASE_INFO_PATH)
        self._symptom_severities = joblib.load(settings.SYMPTOM_SEVERITIES_PATH)
        self._metrics = joblib.load(settings.MODEL_METRICS_PATH)

        self._symptom_to_idx = {s: i for i, s in enumerate(self._symptoms_list)}
        self._classes = [str(c) for c in self._label_encoder.classes_]
        self._build_profiles()
        self._ready = True
        log.info("Model ready: %d diseases, %d symptoms, %d disease profiles",
                 len(self._classes), len(self._symptoms_list), len(self._profiles))

    def _build_profiles(self) -> None:
        """Learn which symptoms really belong to which disease from the dataset CSV."""
        import pandas as pd  # local import: only needed at startup

        path = Path(settings.DATASET_PATH)
        if not path.exists():
            raise FileNotFoundError(
                f"Dataset not found at {path}. It is needed to cross-check predictions "
                "against each disease's symptom profile."
            )
        df = pd.read_csv(path)
        cols = [c for c in df.columns if c.startswith("Symptom")]
        counts: Dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
        totals: collections.Counter = collections.Counter()
        fix = {"dimorphic hemmorhoids(piles)": "Dimorphic hemorrhoids(piles)"}
        for _, row in df.iterrows():
            d = kb.clean_name(row["Disease"])
            d = fix.get(d.lower(), d)
            syms = {normalize_symptom(str(row[c])) for c in cols if str(row[c]).strip().lower() != "nan"}
            syms.discard("")
            totals[d] += 1
            for s in syms:
                counts[d][s] += 1
        self._profiles = {d: {s: c / totals[d] for s, c in cnt.items()} for d, cnt in counts.items()}
        occurrence: Dict[str, Set[str]] = collections.defaultdict(set)
        for d, prof in self._profiles.items():
            for s in prof:
                occurrence[s].add(d)
        self._symptom_disease_count = {s: len(v) for s, v in occurrence.items()}

    @property
    def is_ready(self) -> bool:
        return self._ready

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _item(self, sym: str) -> SymptomItem:
        return SymptomItem(
            id=sym,
            label=format_symptom_label(sym),
            weight=self._symptom_severities.get(sym, 3),
            group=kb.SYMPTOM_GROUP.get(sym, "Other"),
            is_symptom=kb.is_real_symptom(sym),
        )

    def _profile(self, disease_raw: str) -> Dict[str, float]:
        return self._profiles.get(kb.clean_name(disease_raw), {})

    def _info(self, disease_raw: str) -> Dict[str, Any]:
        return self._disease_info.get(disease_raw, {})

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict(self, req: PredictRequest) -> PredictResponse:
        if not self._ready:
            raise RuntimeError("ML service is not initialised. Call load() first.")

        # 1. Clean the input -------------------------------------------------
        normalized = [normalize_symptom(s) for s in req.symptoms if s]
        recognized = list(dict.fromkeys(s for s in normalized if s in self._symptom_to_idx
                                        and s not in kb.HIDDEN_SYMPTOMS))
        if req.symptoms and not recognized:
            raise ValueError("None of the provided symptoms could be recognized. "
                             "Please choose symptoms from the available list.")

        real_symptoms = [s for s in recognized if kb.is_real_symptom(s)]
        lifestyle_ok = has_enough_data(req.lifestyle)
        enough_symptoms = len(real_symptoms) >= settings.MIN_SYMPTOMS

        if not enough_symptoms and not lifestyle_ok:
            raise ValueError(
                f"Please select at least {settings.MIN_SYMPTOMS} symptoms "
                f"(you selected {len(real_symptoms)}), or fill in your lifestyle profile "
                "(age, sex, height and weight) for a lifestyle screening. "
                "Risk factors such as family history do not count as symptoms."
            )

        lifestyle = assess_lifestyle(req.lifestyle) if lifestyle_ok else None
        red_flags = [RedFlag(title=f["title"], message=f["message"],
                             symptoms=[format_symptom_label(s) for s in f["symptoms"]])
                     for f in kb.evaluate_red_flags(set(recognized))]

        # 2. Lifestyle-only result ------------------------------------------
        if not enough_symptoms:
            return self._lifestyle_only_response(recognized, real_symptoms, lifestyle, red_flags)

        # 3. Model probabilities --------------------------------------------
        vector = np.zeros(len(self._symptoms_list), dtype=np.int32)
        for sym in recognized:
            vector[self._symptom_to_idx[sym]] = 1
        probabilities = self._model.predict_proba([vector])[0]
        top_idx = int(np.argmax(probabilities))
        top_raw = self._classes[top_idx]
        top_name = kb.display_name(top_raw)
        confidence = float(probabilities[top_idx])

        # 4. Evidence check against the disease's own symptom profile --------
        top_profile = self._profile(top_raw)
        matched = [s for s in recognized if top_profile.get(s, 0) > 0]
        distinctive = [s for s in matched
                       if self._symptom_disease_count.get(s, 99) <= settings.DISTINCTIVE_MAX]
        coverage = len(matched) / len(recognized)
        evidence_ok = (
            len(matched) >= settings.MIN_MATCHED_SYMPTOMS
            and len(distinctive) >= 1
            and coverage >= settings.MIN_COVERAGE
        )
        is_conclusive = confidence >= settings.CONFIDENCE_THRESHOLD and evidence_ok

        if is_conclusive and confidence >= 0.70:
            confidence_level = "High"
        elif confidence >= 0.40:
            confidence_level = "Moderate"
        else:
            confidence_level = "Low"
        if not is_conclusive and confidence_level == "High":
            confidence_level = "Moderate"

        unexplained = [self._item(s) for s in recognized if s not in matched] if is_conclusive else []

        # 5. Severity / urgency ---------------------------------------------
        total_weight = sum(self._symptom_severities.get(s, 3) for s in real_symptoms)
        top_type = kb.condition_type(top_raw)
        if red_flags or (is_conclusive and top_type in URGENT_CONDITION_TYPES):
            severity_level = "High Alert / Urgent"
        elif total_weight >= 15 or any(self._symptom_severities.get(s, 3) >= 6 for s in real_symptoms):
            severity_level = "Moderate"
        else:
            severity_level = "Mild"

        # 6. Differentials ---------------------------------------------------
        differentials: List[DifferentialDiagnosis] = []
        for idx in np.argsort(probabilities)[::-1][:5]:
            raw = self._classes[int(idx)]
            prob = float(probabilities[idx])
            info = self._info(raw)
            prof = self._profile(raw)
            differentials.append(DifferentialDiagnosis(
                disease=kb.display_name(raw),
                probability=prob,
                percentage=f"{prob * 100:.1f}%",
                description=info.get("description", f"Clinical information for {kb.display_name(raw)}."),
                precautions=info.get("precautions", ["Consult a physician."]),
                condition_type=kb.condition_type(raw),
                matching_symptoms=[format_symptom_label(s) for s in recognized if prof.get(s, 0) > 0],
            ))

        # 7. Wording ---------------------------------------------------------
        if is_conclusive:
            info = self._info(top_raw)
            description = info.get("description", f"Clinical summary for {top_name}.")
            precautions = list(info.get("precautions", [
                "Consult a licensed physician for professional medical evaluation.",
                "Avoid unprescribed medications.",
                "Maintain adequate hydration and rest.",
            ]))
            status_message = (
                f"The selected symptoms match {top_name} most closely "
                f"({len(matched)} of your {len(recognized)} selected items are typical of it). "
                "This is an estimate, not a diagnosis. Please confirm with a doctor."
            )
            if unexplained:
                status_message += (" Some selected symptoms are not typical of this condition, "
                                   "so other causes should also be considered.")
            if top_type == kb.CHRONIC and lifestyle:
                related = self._related_lifestyle_risk(top_raw, lifestyle)
                if related:
                    status_message += f" Your lifestyle profile also shows {related}"
        else:
            description = (
                "The selected symptoms do not clearly point to one condition. "
                "Many conditions share these symptoms, and most causes of such "
                "symptoms are minor and short-lived."
            )
            precautions = list(GENERIC_PRECAUTIONS)
            if not evidence_ok and confidence >= settings.CONFIDENCE_THRESHOLD:
                reason = ("the symptoms are too general, or do not fit together, to point to one condition")
            else:
                reason = f"the best statistical match is only {confidence * 100:.0f}%"
            status_message = (
                f"No clear match: {reason}. The conditions below are possibilities, not a diagnosis."
            )
            if red_flags:
                status_message = (
                    "These symptoms cannot be matched to one condition, but this combination "
                    "needs urgent medical attention (see the warning above). "
                    "The conditions below are possibilities, not a diagnosis."
                )

        if red_flags:
            precautions = ["Seek urgent medical care now: see the warning above."] + precautions

        return PredictResponse(
            symptom_analysis_performed=True,
            predicted_disease=top_name,
            condition_type=top_type,
            confidence_score=confidence,
            confidence_level=confidence_level,
            is_conclusive=is_conclusive,
            status_message=status_message,
            severity_level=severity_level,
            severity_score=total_weight,
            description=description,
            precautions=precautions,
            differential_diagnoses=differentials,
            matched_symptoms=[self._item(s) for s in recognized],
            unexplained_symptoms=unexplained,
            red_flags=red_flags,
            lifestyle=lifestyle,
        )

    # ── Lifestyle-only branch ─────────────────────────────────────────────────

    def _lifestyle_only_response(self, recognized, real_symptoms, lifestyle, red_flags) -> PredictResponse:
        n = len(real_symptoms)
        note = ("No symptom matching was done because fewer than "
                f"{settings.MIN_SYMPTOMS} symptoms were selected." if n else
                "No symptoms were selected, so this is a lifestyle risk screening only.")
        high = [c.condition for c in lifestyle.conditions if c.risk_level == "High"] if lifestyle else []
        elevated = [c.condition for c in lifestyle.conditions if c.risk_level == "Elevated"] if lifestyle else []
        if high:
            headline = "Higher risk found for: " + ", ".join(high) + "."
        elif elevated:
            headline = "Moderate risk found for: " + ", ".join(elevated) + "."
        else:
            headline = "Your lifestyle answers show a low risk for the conditions checked."
        total_weight = sum(self._symptom_severities.get(s, 3) for s in real_symptoms)
        return PredictResponse(
            symptom_analysis_performed=False,
            predicted_disease="",
            condition_type="",
            confidence_score=0.0,
            confidence_level="Low",
            is_conclusive=False,
            status_message=f"{headline} {note}",
            severity_level="High Alert / Urgent" if red_flags else "Mild",
            severity_score=total_weight,
            description=("A lifestyle screening estimates your risk of common chronic diseases from your habits, "
                         "body measurements and family history. It does not detect disease."),
            precautions=(["Seek urgent medical care now: see the warning above."] if red_flags else [])
            + (lifestyle.advice if lifestyle else []),
            differential_diagnoses=[],
            matched_symptoms=[self._item(s) for s in recognized],
            unexplained_symptoms=[],
            red_flags=red_flags,
            lifestyle=lifestyle,
        )

    @staticmethod
    def _related_lifestyle_risk(top_raw: str, lifestyle) -> str:
        mapping = {"Diabetes": "Type 2 Diabetes", "Hypertension": "Hypertension", "Heart attack": "Heart disease"}
        target = mapping.get(kb.clean_name(top_raw))
        if not target:
            return ""
        for c in lifestyle.conditions:
            if c.condition == target and c.risk_level in ("Elevated", "High"):
                return f"{c.risk_level.lower()} risk for {target}, which fits this result."
        return ""

    # ── Getters ───────────────────────────────────────────────────────────────

    def get_symptoms(self) -> List[SymptomItem]:
        """All selectable symptoms (artefact columns such as 'prognosis' are hidden)."""
        items = [self._item(i["id"]) for i in self._symptoms_metadata
                 if i["id"] not in kb.HIDDEN_SYMPTOMS]
        order = {g: n for n, g in enumerate(kb.GROUP_ORDER)}
        items.sort(key=lambda s: (order.get(s.group, 99), s.label))
        return items

    def get_diseases(self) -> List[DiseaseDetail]:
        details = []
        for d_name, info in self._disease_info.items():
            syms = [SymptomItem(id=s["id"], label=format_symptom_label(s["id"]), weight=s["weight"],
                                group=kb.SYMPTOM_GROUP.get(s["id"], "Other"),
                                is_symptom=kb.is_real_symptom(s["id"]))
                    for s in info.get("common_symptoms", [])]
            details.append(DiseaseDetail(disease=kb.display_name(d_name), description=info.get("description", ""),
                                         precautions=info.get("precautions", []), common_symptoms=syms))
        return details

    def get_metrics(self) -> ModelMetrics:
        m = dict(self._metrics)
        # the stored count includes artefact columns; report the selectable symptoms
        m["num_symptoms"] = len(self.get_symptoms())
        return ModelMetrics(**m)


ml_service = MLService()
