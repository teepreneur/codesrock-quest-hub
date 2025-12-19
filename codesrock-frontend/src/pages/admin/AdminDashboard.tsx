import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, TrendingUp, BookOpen, AlertCircle, Activity } from "lucide-react";
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
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || 'Unable to load admin dashboard. Please try again.'}
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, content, and view analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/users')} variant="default">
            Manage Users
          </Button>
          <Button onClick={() => navigate('/admin/content')} variant="outline">
            Manage Content
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Teachers */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered teachers
            </p>
          </CardContent>
        </Card>

        {/* Active Today */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Teachers active today
            </p>
          </CardContent>
        </Card>

        {/* Total Courses */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Published courses
            </p>
          </CardContent>
        </Card>

        {/* Avg Completion */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.avgCompletionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Course completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Trends</CardTitle>
            <CardDescription>Activity overview for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">New Users</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
              <div className="text-2xl font-bold text-primary">{trends.newUsersThisMonth}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Total Activities</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
              <div className="text-2xl font-bold text-cyan-500">{trends.totalActivities}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/admin/content')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Content
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/admin/analytics')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              <Activity className="mr-2 h-4 w-4" />
              Switch to Teacher View
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
