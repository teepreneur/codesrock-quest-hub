import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebarV2";
import { AppHeader } from "./AppHeader";

// V2.0 Layout System - Live Update
export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-body selection:bg-primary/30 selection:text-primary-foreground">
        <AppSidebar />
        <div className="flex flex-col flex-1 relative overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10">
            <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
              <Outlet />
            </div>
          </main>
          
          {/* Subtle background glow */}
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
          <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        </div>
      </div>
    </SidebarProvider>
  );
}
