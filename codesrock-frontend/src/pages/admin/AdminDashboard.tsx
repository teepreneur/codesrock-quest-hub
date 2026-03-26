import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, TrendingUp, BookOpen, AlertCircle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { adminService, type AnalyticsOverview } from "@/services/admin.service";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const overview = await adminService.getAnalyticsOverview();
        setData(overview);
      } catch (err: any) {
        console.error('Admin dashboard error:', err);
        setError(err.message || 'Failed to load dashboard');
        toast.error('Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in p-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-destructive/20 bg-destructive/5 text-destructive backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Admin Portal Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 opacity-80">{error || 'Unable to load admin analytics. Please check your permissions.'}</p>
            <Button onClick={() => window.location.reload()} variant="destructive">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, trends } = data;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Admin Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <Badge className="bg-primary hover:bg-primary text-white border-none mb-4">
            Command Center
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Platform Overview 🛡️
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Monitor educational growth, manage content curriculum, and oversee teacher activities across the CodesRock network.
          </p>
        </div>
        
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-slate-500/20 rounded-full blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Teachers', value: stats.totalTeachers, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { label: 'Active Today', value: stats.activeToday, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
          { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { label: 'Avg. Completion', value: `${stats.avgCompletionRate}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        ].map((stat, i) => (
          <Card key={i} className={`bg-card/50 backdrop-blur-sm border ${stat.border} shadow-sm transition-all hover:shadow-md hover:-translate-y-1`}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Trend Insights */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-card/30 backdrop-blur-md overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Growth Metrics</CardTitle>
            <CardDescription>Activity overview for the current month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-2">
                <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">New Registrations</span>
                <span className="text-4xl font-black">{trends.newUsersThisMonth}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Growth upward this month
                </span>
              </div>
              <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex flex-col gap-2">
                <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Total Interactions</span>
                <span className="text-4xl font-black">{trends.totalActivities}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3 text-indigo-400" />
                  High engagement levels
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Management */}
        <Card className="border-none shadow-xl bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Manage Users', icon: Users, path: '/admin/users', variant: 'secondary' as const },
              { label: 'Update Content', icon: BookOpen, path: '/admin/content', variant: 'secondary' as const },
              { label: 'Platform Analytics', icon: Activity, path: '/admin/analytics', variant: 'secondary' as const },
              { label: 'Switch to Teacher', icon: Shield, path: '/dashboard', variant: 'ghost' as const },
            ].map((action, i) => (
              <Button
                key={i}
                className={`w-full justify-start rounded-xl font-semibold gap-3 h-12 ${action.variant === 'ghost' ? 'text-slate-400 hover:text-white' : ''}`}
                variant={action.variant}
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
