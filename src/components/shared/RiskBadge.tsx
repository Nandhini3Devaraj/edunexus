import { cn } from "@/lib/utils";

type RiskLevel = "safe" | "low" | "medium" | "high";

const config: Record<RiskLevel, { label: string; classes: string }> = {
  safe: { label: "Safe", classes: "bg-risk-safe/10 text-risk-safe border-risk-safe/20" },
  low: { label: "Low Risk", classes: "bg-risk-low/10 text-risk-low border-risk-low/20" },
  medium: { label: "Medium Risk", classes: "bg-risk-medium/10 text-risk-medium border-risk-medium/20" },
  high: { label: "High Risk", classes: "bg-risk-high/10 text-risk-high border-risk-high/20" },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const c = config[level];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", c.classes)}>
      {c.label}
    </span>
  );
}
