import { Brain, Sparkles, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";

const insights = [
  {
    type: "warning",
    title: "3 Students At Risk",
    desc: "ML model detected declining performance patterns in CS department.",
    icon: AlertTriangle,
    color: "text-risk-medium",
    bg: "bg-risk-medium/10",
  },
  {
    type: "trend",
    title: "Exam Performance Improving",
    desc: "Overall pass rate up 4.2% compared to last semester.",
    icon: TrendingUp,
    color: "text-risk-safe",
    bg: "bg-risk-safe/10",
  },
  {
    type: "ai",
    title: "Smart Scheduling Suggestion",
    desc: "AI recommends moving CS301 exam to avoid conflict with lab sessions.",
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export function AIInsightPanel() {
  return (
    <div className="glass-card-hover animate-slide-up p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
          <p className="text-[10px] text-muted-foreground">Powered by EDUNEXUS AI</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border/20 p-3 transition-all hover:border-primary/20 hover:bg-muted/30"
          >
            <div className={`mt-0.5 rounded-md p-1.5 ${insight.bg}`}>
              <insight.icon className={`h-3.5 w-3.5 ${insight.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">{insight.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{insight.desc}</p>
            </div>
            <ChevronRight className="mt-1 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
