"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Assessment progress" className="w-full">
      {/* Desktop: horizontal stepper */}
      <ol className="hidden sm:flex items-center w-full" role="list">
        {steps.map((step, idx) => {
          const isDone    = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isLast    = idx === steps.length - 1;

          return (
            <li key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              <button
                onClick={() => onStepClick?.(idx)}
                disabled={!isDone && !isCurrent}
                className={cn(
                  "flex flex-col items-center gap-1.5 group",
                  (isDone || isCurrent) ? "cursor-pointer" : "cursor-default"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.title}${isDone ? " (completed)" : isCurrent ? " (current)" : ""}`}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                    isDone    && "bg-brand-600 text-white shadow-sm",
                    isCurrent && "bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900/50 shadow-sm",
                    !isDone && !isCurrent && "bg-slate-100 dark:bg-slate-700 text-slate-400"
                  )}
                >
                  {isDone ? <Check size={16} strokeWidth={2.5} /> : idx + 1}
                </div>
                {/* Label */}
                <div className="text-center">
                  <p className={cn(
                    "text-xs font-semibold leading-tight",
                    isCurrent ? "text-brand-600 dark:text-brand-400" :
                    isDone    ? "text-slate-700 dark:text-slate-300" :
                                "text-slate-400"
                  )}>
                    {step.title}
                  </p>
                </div>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-3 mt-[-18px] rounded-full transition-colors duration-300"
                  style={{
                    background: isDone
                      ? "#2563EB"
                      : "rgb(226 232 240)",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact progress bar */}
      <div className="sm:hidden flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span className="text-brand-600 font-semibold">{steps[currentStep]?.title}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          />
        </div>
      </div>
    </nav>
  );
}
