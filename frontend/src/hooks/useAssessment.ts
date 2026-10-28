"use client";

import { useState, useCallback } from "react";
import type { HealthFormData } from "@/types";
import { DEFAULT_FORM, calculateBMI } from "@/lib/utils";

export function useAssessment() {
  const [form, setForm] = useState<HealthFormData>(DEFAULT_FORM);
  const [currentStep, setCurrentStep] = useState(0);

  const updateField = useCallback(
    <K extends keyof HealthFormData>(field: K, value: HealthFormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        // Auto-recompute BMI when height or weight changes
        if (field === "heightCm" || field === "weightKg") {
          const h = field === "heightCm" ? (value as number) : prev.heightCm;
          const w = field === "weightKg" ? (value as number) : prev.weightKg;
          next.BMI = calculateBMI(w, h);
        }
        return next;
      });
    },
    []
  );

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM);
    setCurrentStep(0);
  }, []);

  const goNext = useCallback(() =>
    setCurrentStep((s) => Math.min(s + 1, 3)), []);

  const goPrev = useCallback(() =>
    setCurrentStep((s) => Math.max(s - 1, 0)), []);

  const goTo = useCallback((step: number) =>
    setCurrentStep(Math.max(0, Math.min(step, 3))), []);

  return {
    form,
    currentStep,
    updateField,
    resetForm,
    goNext,
    goPrev,
    goTo,
    totalSteps: 4,
  };
}
