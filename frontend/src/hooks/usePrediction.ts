"use client";

import { useState, useCallback } from "react";
import type {
  PredictPayload,
  PredictionResponse,
  ExplainResponse,
  SimulationResult,
  SimulationDelta,
} from "@/types";
import { predictRisk, explainRisk, simulateRisk } from "@/lib/api";

interface PredictionState {
  prediction: PredictionResponse | null;
  explanation: ExplainResponse | null;
  simulation: SimulationResult | null;
  isLoadingPrediction: boolean;
  isLoadingExplanation: boolean;
  isLoadingSimulation: boolean;
  predictionError: string | null;
  explanationError: string | null;
  simulationError: string | null;
}

const INITIAL_STATE: PredictionState = {
  prediction: null,
  explanation: null,
  simulation: null,
  isLoadingPrediction: false,
  isLoadingExplanation: false,
  isLoadingSimulation: false,
  predictionError: null,
  explanationError: null,
  simulationError: null,
};

export function usePrediction() {
  const [state, setState] = useState<PredictionState>(INITIAL_STATE);

  const runPrediction = useCallback(async (payload: PredictPayload) => {
    setState((s) => ({
      ...s,
      isLoadingPrediction: true,
      predictionError: null,
    }));
    try {
      const result = await predictRisk(payload);
      setState((s) => ({
        ...s,
        prediction: result,
        isLoadingPrediction: false,
      }));
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Prediction failed.";
      setState((s) => ({
        ...s,
        isLoadingPrediction: false,
        predictionError: msg,
      }));
      return null;
    }
  }, []);

  const runExplanation = useCallback(async (payload: PredictPayload) => {
    setState((s) => ({
      ...s,
      isLoadingExplanation: true,
      explanationError: null,
    }));
    try {
      const result = await explainRisk(payload);
      setState((s) => ({
        ...s,
        explanation: result,
        isLoadingExplanation: false,
      }));
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Explanation failed.";
      setState((s) => ({
        ...s,
        isLoadingExplanation: false,
        explanationError: msg,
      }));
      return null;
    }
  }, []);

  const runSimulation = useCallback(
    async (baseline: PredictPayload, delta: SimulationDelta) => {
      setState((s) => ({
        ...s,
        isLoadingSimulation: true,
        simulationError: null,
        simulation: null,
      }));
      try {
        const result = await simulateRisk(baseline, delta);
        setState((s) => ({
          ...s,
          simulation: result,
          isLoadingSimulation: false,
        }));
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Simulation failed.";
        setState((s) => ({
          ...s,
          isLoadingSimulation: false,
          simulationError: msg,
        }));
        return null;
      }
    },
    []
  );

  const clearResults = useCallback(() => setState(INITIAL_STATE), []);

  return {
    ...state,
    runPrediction,
    runExplanation,
    runSimulation,
    clearResults,
  };
}
