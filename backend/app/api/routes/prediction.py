"""
ClinixAI — Multi-Disease Prediction & Symptom Routes
======================================================
GET  /api/v1/symptoms  — list all 133 standardized symptoms with weights
GET  /api/v1/diseases  — list all 41 diseases with clinical details
POST /api/v1/predict   — multi-disease differential diagnosis prediction
GET  /api/v1/metrics   — model accuracy, F1, and dataset metrics
GET  /api/v1/health    — health check
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import (
    PredictRequest,
    PredictResponse,
    SymptomItem,
    DiseaseDetail,
    ModelMetrics,
)
from app.services.ml_service import ml_service

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Diagnosis & Symptoms"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _service_guard() -> None:
    if not ml_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model is not loaded. Run `python train.py` in backend/ first.",
        )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/symptoms",
    response_model=List[SymptomItem],
    summary="List all diagnostic symptoms",
    description="Returns the complete list of 133 clinical symptoms with severity weights.",
)
async def list_symptoms() -> List[SymptomItem]:
    _service_guard()
    return ml_service.get_symptoms()


@router.get(
    "/diseases",
    response_model=List[DiseaseDetail],
    summary="List all recognized diseases",
    description="Returns all 41 chronic and acute disease profiles with clinical descriptions.",
)
async def list_diseases() -> List[DiseaseDetail]:
    _service_guard()
    return ml_service.get_diseases()


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Predict disease from symptoms",
    description=(
        "Analyzes reported patient symptoms using ensemble Random Forest classification, "
        "returning the primary predicted disease, confidence level, severity score, "
        "top 5 differential diagnoses with probabilities, and tailored medical precautions."
    ),
)
async def predict(request: PredictRequest) -> PredictResponse:
    _service_guard()
    try:
        return ml_service.predict(request)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        log.exception("Prediction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(exc)}",
        ) from exc


@router.get(
    "/metrics",
    response_model=ModelMetrics,
    summary="Model performance metrics",
    description="Returns model accuracy, cross-validation score, F1 score, and cohort size.",
)
async def get_metrics() -> ModelMetrics:
    _service_guard()
    try:
        return ml_service.get_metrics()
    except Exception as exc:
        log.exception("Metrics retrieval failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not retrieve metrics: {str(exc)}",
        ) from exc


@router.get(
    "/health",
    summary="Service health check",
    tags=["System"],
)
async def health_check() -> dict:
    return {
        "status": "ok" if ml_service.is_ready else "degraded",
        "model_loaded": ml_service.is_ready,
    }
