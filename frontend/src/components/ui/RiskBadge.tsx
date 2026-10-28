import { cn } from "@/lib/utils";
import type { RiskCategory } from "@/types";

interface RiskBadgeProps {
  category: RiskCategory;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

const CONFIG: Record<RiskCategory, { dot: string; pill: string; label: string }> = {
  "Low Risk":      { dot: "bg-health-emerald", pill: "badge-low",      label: "Low Risk" },
  "Elevated Risk": { dot: "bg-health-amber",   pill: "badge-elevated", label: "Elevated Risk" },
  "High Risk":     { dot: "bg-health-rose",    pill: "badge-high",     label: "High Risk" },
};

export function RiskBadge({ category, size = "md", showDot = true }: RiskBadgeProps) {
  const cfg = CONFIG[category];
  return (
    <span
      className={cn(cfg.pill, {
        "text-[11px] px-2 py-0.5": size === "sm",
        "text-xs px-2.5 py-1":     size === "md",
        "text-sm px-3.5 py-1.5":   size === "lg",
      })}
      role="status"
      aria-label={`Risk level: ${cfg.label}`}
    >
      {showDot && (
        <span
          className={cn("inline-block w-1.5 h-1.5 rounded-full animate-pulse-slow", cfg.dot)}
          aria-hidden="true"
        />
      )}
      {cfg.label}
    </span>
  );
}
