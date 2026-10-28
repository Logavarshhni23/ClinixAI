"""
ClinixAI — FastAPI Application Entry-Point
=============================================
Wires together lifespan startup (model loading), CORS, routers,
and global exception handlers into a single ASGI application.
"""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes.prediction import router as prediction_router
from app.services.ml_service import ml_service

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:  # noqa: ARG001
    """Load ML artefacts once before the server starts accepting requests."""
    log.info("═" * 55)
    log.info("  %s  v%s — starting up", settings.APP_NAME, settings.APP_VERSION)
    log.info("═" * 55)
    try:
        ml_service.load()
        log.info("[OK] ML service ready")
    except FileNotFoundError as exc:
        log.error("[FAIL] %s", exc)
        log.error("  Please run `python train.py` in the backend/ directory first.")
        # Allow server to start in degraded mode — health endpoint will report
    yield
    log.info("ClinixAI shutting down ...")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handlers ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred.",
            "path": str(request.url),
        },
    )


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(prediction_router)


# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/", tags=["System"], summary="API root")
async def root() -> dict:
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
        "disclaimer": (
            "ClinixAI is an educational symptom-matching and lifestyle risk-screening tool. "
            "It is NOT a substitute for clinical diagnosis."
        ),
    }
