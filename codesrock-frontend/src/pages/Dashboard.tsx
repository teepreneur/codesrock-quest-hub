import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, BookOpen, Clock, TrendingUp, Flame, Award, AlertCircle, Target, Star, LogIn, Sparkles, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dashboardService, type DashboardData } from "@/services/dashboard.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = authService.getStoredUser();

        if (!user?.id) {
          console.error('No user ID found in localStorage');
          toast.error('Please login again');
          navigate('/login');
          return;
        }

        const dashboardData = await dashboardService.getUserDashboard(user.id);
        setData(dashboardData);
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in p-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-3xl" />
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
              Connection Issue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 opacity-80">{error || 'Unable to load your dashboard. Please check your connection.'}</p>
            <Button onClick={() => window.location.reload()} variant="destructive">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, progress, stats, recentActivities, courseProgress, recommendedCourses } = data;
  const xpForNextLevel = 100 * Math.pow(1.5, progress.currentLevel);
  const levelProgress = (progress.currentXP / xpForNextLevel) * 100;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 p-8 text-primary-foreground shadow-2xl shadow-primary/20">
        <div className="relative z-10">
          <Badge className="bg-white/20 text-white border-none mb-4 backdrop-blur-md">
            {progress.levelName} • Level {progress.currentLevel}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Welcome back, {user.firstName}! 🚀
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl">
            You're on a roll! You've earned <span className="text-white font-bold">{progress.totalXP} XP</span> and kept a <span className="text-white font-bold">{progress.streak} day streak</span>. What will you master today?
          </p>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total XP', value: progress.totalXP, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
          { label: 'Current Level', value: `Lv. ${progress.currentLevel}`, icon: Award, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Daily Streak', value: `${progress.streak} Days`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'Completed', value: stats.completedCourses, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        ].map((stat, i) => (
          <Card key={i} className={`border ${stat.border} shadow-sm transition-all hover:shadow-md hover:-translate-y-1`}>
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
        {/* Level Path */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-end">
              <div>
                <CardTitle className="text-2xl font-bold">Your Progress Path</CardTitle>
                <CardDescription>Only {Math.round(xpForNextLevel - progress.currentXP)} XP to reach Level {progress.currentLevel + 1}</CardDescription>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-primary">{Math.round(levelProgress)}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="relative">
              <Progress value={levelProgress} className="h-4 rounded-full bg-primary/10" />
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-8 h-8 bg-primary rounded-full border-4 border-background flex items-center justify-center -translate-x-2 shadow-lg">
                <Star className="h-3 w-3 text-white fill-white" />
              </div>
            </div>
            
            <div className="flex justify-between items-center px-2">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-bold">
                  {progress.currentLevel}
                </div>
                <span className="text-xs font-medium text-muted-foreground">Current</span>
              </div>
              
              <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-border mx-4 border-dashed" />
              
              <div className="flex flex-col items-center gap-2 opacity-50">
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground font-bold border-2 border-dashed">
                  {progress.currentLevel + 1}
                </div>
                <span className="text-xs font-medium text-muted-foreground">Next Goal</span>
              </div>
            </div>

            {/* Recommended Action */}
            {recommendedCourses && recommendedCourses.length > 0 && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">📚</div>
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Next Step</p>
                    <p className="font-semibold">{recommendedCourses[0].title}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate("/videos")} className="rounded-xl">Resume</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Badges</CardTitle>
          </CardHeader>
          <CardContent>
            {progress.recentBadges && progress.recentBadges.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {progress.recentBadges.slice(0, 4).map((badge: any) => (
                  <div
                    key={badge._id}
                    className="group p-4 rounded-2xl bg-accent/5 border border-accent/10 text-center hover:bg-accent/10 transition-all cursor-pointer"
                  >
                    <div className="text-4xl mb-2 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 drop-shadow-md">
                      {badge.badgeId?.icon || '🏆'}
                    </div>
                    <p className="text-xs font-bold truncate">{badge.badgeId?.name || 'Badge'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-muted/30 rounded-2xl border border-dashed">
                < Award className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No badges yet</p>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full mt-6 text-primary hover:bg-primary/5 rounded-xl font-bold"
              onClick={() => navigate("/achievements")}
            >
              View All Achievements
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Activity & Learning */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Learning Activity */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center shadow-sm">
                    {activity.type === 'course_completed' ? <BookOpen className="h-5 w-5 text-primary" /> :
                      activity.type === 'badge_earned' ? <Award className="h-5 w-5 text-accent" /> :
                        activity.type === 'login' ? <LogIn className="h-5 w-5 text-muted-foreground" /> :
                          <Sparkles className="h-5 w-5 text-secondary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString()}</p>
                  </div>
                  {activity.xpEarned > 0 && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none font-bold">
                      +{activity.xpEarned} XP
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Current Courses */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>In Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-6">
            {courseProgress && courseProgress.length > 0 ? (
              courseProgress.slice(0, 3).map((cp: any, index: number) => (
                <div key={index} className="group cursor-pointer" onClick={() => navigate('/videos')}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-bold group-hover:text-primary transition-colors">
                      {cp.course?.title || 'Course'}
                    </span>
                    <span className="text-xs font-black text-primary/60">{cp.progressPercentage}%</span>
                  </div>
                  <Progress value={cp.progressPercentage} className="h-2 rounded-full" />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't started any courses yet.</p>
                <Button variant="outline" onClick={() => navigate("/videos")} className="rounded-xl">Start Your Quest</Button>
              </div>
            )}
            <Button variant="ghost" className="w-full text-primary font-bold" onClick={() => navigate("/videos")}>
              Go to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
