import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebarV2";
import { AppHeader } from "./AppHeader";
import { TeacherTour } from "./TeacherTour";
import { TeacherCelebrationModal } from "./TeacherCelebrationModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onboardingService, OnboardingStatus, authService, dashboardService } from '@/services';

// V2.0 Layout System - Live Update
export function AppLayout() {
  const user = authService.getStoredUser();
  const queryClient = useQueryClient();

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => dashboardService.getUserDashboard(user!.id),
    enabled: !!user?.id && user.role === 'teacher',
  });

  const onboardingStatus = dashboardData?.progress?.onboardingStatus || { phase: 1, step: 0, completed: false };

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
          
          {/* Onboarding System */}
          {user?.role === 'teacher' && (
            <>
              <TeacherTour 
                status={onboardingStatus} 
                onStatusUpdate={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })} 
              />
              <TeacherCelebrationModal 
                isOpen={onboardingStatus.phase === 2 && onboardingStatus.step === 0 && !onboardingStatus.completed}
                onClose={() => {}}
                onProceed={async () => {
                  await onboardingService.updateStatus({ phase: 2, step: 1, completed: false });
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                }}
              />
            </>
          )}

          {/* Subtle background glow */}
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
          <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        </div>
      </div>
    </SidebarProvider>
  );
}
