import { Search, Bell, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

export function TopNavbar({ title }: { title: string }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/30 bg-background/80 px-6 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search anything..."
            className="h-9 w-64 rounded-lg border border-border/50 bg-muted/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* AI Chip */}
        <div className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 sm:flex">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium text-primary">AI Active</span>
        </div>

        {/* Notifications */}
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20 text-sm font-semibold text-secondary">
            AD
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Notification Panel */}
      {notifOpen && (
        <div className="absolute right-6 top-16 z-50 w-80 rounded-xl border border-border/30 bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Notifications</h3>
          {[
            { text: "AI flagged 3 at-risk students", time: "2m ago", type: "ai" },
            { text: "Exam schedule updated for CS301", time: "1h ago", type: "exam" },
            { text: "New event submission pending", time: "3h ago", type: "event" },
          ].map((n, i) => (
            <div key={i} className="mb-2 flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
              <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.type === "ai" ? "bg-primary" : n.type === "exam" ? "bg-secondary" : "bg-risk-low"}`} />
              <div>
                <p className="text-xs text-foreground">{n.text}</p>
                <p className="text-[10px] text-muted-foreground">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
