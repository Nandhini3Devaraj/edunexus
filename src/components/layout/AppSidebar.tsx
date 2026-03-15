import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  ClipboardList,
  PartyPopper,
  Brain,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { id: "admin", label: "Admin", icon: LayoutDashboard, path: "/admin" },
  { id: "student", label: "Student", icon: GraduationCap, path: "/student" },
  { id: "staff", label: "Staff", icon: Users, path: "/staff" },
  { id: "club", label: "Club Coordinator", icon: PartyPopper, path: "/club" },
  { id: "exam", label: "Exam Coordinator", icon: ClipboardList, path: "/exam" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-border/30 bg-sidebar backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border/30 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-foreground">EDUNEXUS</h1>
            <p className="text-[10px] text-muted-foreground">AI Campus Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <p className={cn("mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", collapsed && "text-center")}>
          {collapsed ? "•" : "Dashboards"}
        </p>
        {roles.map((role) => {
          const isActive = location.pathname.startsWith(role.path);
          return (
            <button
              key={role.id}
              onClick={() => navigate(role.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary neon-border"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <role.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{role.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* AI Badge */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">AI Powered</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Smart insights enabled</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center border-t border-border/30 text-muted-foreground transition-colors hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
