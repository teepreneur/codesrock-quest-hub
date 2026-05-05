import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, TrendingUp, BookOpen, AlertCircle, Activity, ArrowRight, Settings, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Use TanStack Query for high-performance analytics
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminService.getAnalyticsOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    retry: 3
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load dashboard";
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-destructive glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {errorMsg || 'Unable to load admin dashboard. Please try again.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="default">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, trends } = data;

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      {/* Admin Header with Rocky System Guide */}
      <section className="relative overflow-visible mt-10 mb-12">
        <div className="bg-gradient-to-br from-deep-purple via-deep-purple/90 to-primary/80 p-8 md:p-12 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full -ml-20 -mb-20 blur-3xl" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Rocky 3D Image - Professional Poses */}
            <div className="relative shrink-0 animate-float">
              <div className="absolute -inset-4 bg-white/10 rounded-full blur-2xl" />
              <img 
                src="/assets/rocky/idea-transparent.webp" 
                alt="Rocky System Guide" 
                className="w-40 h-40 md:w-48 md:h-48 object-contain relative z-10 drop-shadow-2xl brightness-110"
              />
            </div>

            {/* Welcome Text & System Status */}
            <div className="flex-1 space-y-4 text-center md:text-left">
               <div className="glass-panel bg-white/10 border-white/20 rounded-2xl p-4 inline-block mb-2 backdrop-blur-xl animate-scale-in">
                  <p className="text-white font-bold text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-secondary animate-pulse" />
                    SYSTEM STATUS: ALL SYSTEMS NOMINAL 🤘
                  </p>
               </div>
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight">
                Admin Control Center
              </h1>
              <p className="text-white/80 text-lg max-w-2xl font-medium">
                Monitoring activity across <span className="text-secondary font-bold">{stats.totalTeachers} teachers</span> and <span className="text-secondary font-bold">{stats.totalCourses} modules</span>.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 shrink-0">
               <Button onClick={() => navigate('/admin/users')} className="bg-secondary hover:bg-secondary/90 text-white font-black rounded-xl px-6 py-6 shadow-lg shadow-secondary/20 group">
                  <Users className="mr-2 h-5 w-5" />
                  Manage Users
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
               </Button>
               <Button onClick={() => navigate('/admin/content')} className="bg-white/10 hover:bg-white/20 text-white border-white/20 border font-bold rounded-xl px-6 py-6 backdrop-blur-md">
                  <PlusCircle className="mr-2 h-5 w-5 text-primary" />
                  New Content
               </Button>
            </div>
          </div>
        </div>
      </section>

      </div>
      
      {/* School Progress Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-deep-purple flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            School Success Metrics
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/schools')} className="rounded-xl font-bold">
            View All Schools
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Lincoln Elementary", progress: 78, active: 124, trend: "up" },
            { name: "Westside Academy", progress: 62, active: 89, trend: "up" },
            { name: "East Village Tech", progress: 45, active: 210, trend: "down" }
          ].map((school, i) => (
            <Card 
              key={i} 
              className="glass-panel overflow-hidden group hover:border-primary/40 transition-all cursor-pointer active:scale-95"
              onClick={() => navigate('/admin/schools')}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-deep-purple">{school.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{school.active} Students Active</p>
                  </div>
                  <Badge className={school.trend === 'up' ? 'bg-green-500' : 'bg-orange-500'}>
                    {school.trend === 'up' ? '↑ Increasing' : '↓ Static'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Curriculum Completion</span>
                    <span className="text-primary">{school.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000" 
                      style={{ width: `${school.progress}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Analytics & Actions */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="glass-panel overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-deep-purple">
              <TrendingUp className="h-6 w-6 text-secondary" />
              Platform Trends
            </CardTitle>
            <CardDescription className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Activity overview for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl border border-primary/10 hover:border-primary/30 transition-all duration-300 group">
              <div>
                <p className="font-black text-deep-purple text-lg">New Teachers</p>
                <p className="text-sm font-bold text-muted-foreground/70 uppercase">Joined this month</p>
              </div>
              <div className="text-4xl font-black text-primary group-hover:scale-110 transition-transform">+{trends.newUsersThisMonth}</div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-3xl border border-secondary/10 hover:border-secondary/30 transition-all duration-300 group">
              <div>
                <p className="font-black text-deep-purple text-lg">Total Interactions</p>
                <p className="text-sm font-bold text-muted-foreground/70 uppercase">Learning activities logged</p>
              </div>
              <div className="text-4xl font-black text-secondary group-hover:scale-110 transition-transform">{trends.totalActivities.toLocaleString()}</div>
            </div>
            
            <Button variant="ghost" className="w-full text-secondary font-black hover:bg-secondary/5 py-6 rounded-2xl">
               View Full Analytics Report
               <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-deep-purple">
              <Settings className="h-6 w-6 text-primary" />
              Operational Hub
            </CardTitle>
            <CardDescription className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Direct access to administrative tools</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              className="w-full justify-between h-16 px-6 rounded-2xl bg-white hover:bg-muted/30 border-muted text-deep-purple font-black shadow-sm group"
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span>Teacher Directory</span>
              </div>
              <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </Button>
            
            <Button
              className="w-full justify-between h-16 px-6 rounded-2xl bg-white hover:bg-muted/30 border-muted text-deep-purple font-black shadow-sm group"
              variant="outline"
              onClick={() => navigate('/admin/content')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <span>Content Library</span>
              </div>
              <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </Button>
            
            <Button
              className="w-full justify-between h-16 px-6 rounded-2xl bg-white hover:bg-muted/30 border-muted text-deep-purple font-black shadow-sm group"
              variant="outline"
              onClick={() => navigate('/admin/schools')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5 text-secondary" />
                </div>
                <span>School Partners</span>
              </div>
              <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </Button>

            <div className="pt-4 mt-4 border-t border-muted/50">
               <Button
                  className="w-full h-14 rounded-2xl bg-deep-purple hover:bg-deep-purple/90 text-white font-black shadow-lg shadow-deep-purple/20"
                  onClick={() => navigate('/dashboard')}
                >
                  <Activity className="mr-2 h-5 w-5 text-secondary" />
                  Experience Teacher View
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
