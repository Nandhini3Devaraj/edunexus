import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="ml-16 flex flex-1 flex-col transition-all duration-300 md:ml-60">
        <TopNavbar title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
