import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, BookOpen, Clock, TrendingUp, Flame, Award, AlertCircle } from "lucide-react";
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

        console.log('Loading dashboard for user:', user.id);
        const dashboardData = await dashboardService.getUserDashboard(user.id);
        console.log('Dashboard data loaded:', dashboardData);

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
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
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
              {error || 'Unable to load dashboard data. Please try again.'}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="default">
                Retry
              </Button>
              <Button onClick={() => navigate('/test-dashboard')} variant="outline">
                View Debug Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, progress, stats, recentActivities, courseProgress, recommendedCourses } = data;

  // Calculate level progress
  const xpForNextLevel = 100 * Math.pow(1.5, progress.currentLevel);
  const levelProgress = (progress.currentXP / xpForNextLevel) * 100;
  const completionPercentage = stats.totalCourses > 0
    ? Math.round((stats.completedCourses / stats.totalCourses) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-primary p-8 rounded-2xl text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.firstName}! 👋
        </h1>
        <p className="text-primary-foreground/90">
          You're doing amazing! Keep up the great work on your coding journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{progress.totalXP}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(xpForNextLevel - progress.currentXP)} XP to next level
            </p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Award className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">Level {progress.currentLevel}</div>
            <p className="text-xs text-muted-foreground mt-1">{progress.levelName}</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{progress.streak} Days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Level Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Level Progress
            </CardTitle>
            <CardDescription>
              You're {Math.round(levelProgress)}% of the way to the next level!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progress.levelName}</span>
                <span className="text-muted-foreground">
                  {progress.currentXP} / {Math.round(xpForNextLevel)} XP
                </span>
              </div>
              <Progress value={levelProgress} className="h-3" />
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <p className="text-xs text-muted-foreground">Level {progress.currentLevel}</p>
                </div>
                <div className="flex-1 h-px bg-border mx-4" />
                <div className="text-center">
                  <div className="text-2xl mb-1">⭐</div>
                  <p className="text-xs text-muted-foreground">Level {progress.currentLevel + 1}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Recent Badges
            </CardTitle>
            <CardDescription>
              {progress.badgeCount} badge{progress.badgeCount !== 1 ? 's' : ''} earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {progress.recentBadges && progress.recentBadges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {progress.recentBadges.slice(0, 4).map((badge: any) => (
                  <div
                    key={badge._id}
                    className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-center hover:scale-105 transition-transform cursor-pointer"
                    title={badge.badgeId?.description || 'Badge'}
                  >
                    <div className="text-3xl mb-1">{badge.badgeId?.icon || '🏆'}</div>
                    <p className="text-xs font-medium">{badge.badgeId?.name || 'Badge'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No badges yet. Complete activities to earn badges!
              </p>
            )}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate("/achievements")}
            >
              View All Badges
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="text-2xl">
                      {activity.type === 'course_completed' ? '📚' :
                       activity.type === 'badge_earned' ? '🏆' :
                       activity.type === 'login' ? '👋' : '✨'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                        {activity.xpEarned > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{activity.xpEarned} XP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Course Progress
            </CardTitle>
            <CardDescription>
              {stats.completedCourses} of {stats.totalCourses} courses completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courseProgress && courseProgress.length > 0 ? (
                courseProgress.slice(0, 3).map((cp, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">
                        {cp.course?.title || 'Course'}
                      </span>
                      <Badge variant={cp.completed ? "default" : "secondary"}>
                        {cp.completed ? 'Completed' : `${cp.progressPercentage}%`}
                      </Badge>
                    </div>
                    <Progress value={cp.progressPercentage} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No courses started yet
                </p>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate("/videos")}
              >
                Browse Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Recommended Course */}
      {recommendedCourses && recommendedCourses.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Recommended Course
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="text-5xl">📚</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                {recommendedCourses[0].title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Continue your learning journey
              </p>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary">{recommendedCourses[0].difficulty}</Badge>
                <span className="text-primary font-medium">
                  +{recommendedCourses[0].xpReward} XP
                </span>
              </div>
            </div>
            <Button
              onClick={() => navigate("/videos")}
              className="bg-primary hover:bg-primary/90"
            >
              Start Learning
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
