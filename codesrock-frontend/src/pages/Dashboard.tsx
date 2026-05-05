import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, BookOpen, Clock, TrendingUp, Flame, Award, AlertCircle, Target, Star, LogIn, Sparkles, GraduationCap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "@/services/dashboard.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getStoredUser();

  // Use TanStack Query for high-performance data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      return dashboardService.getUserDashboard(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2
  });

  // Handle redirect if not logged in
  if (!user?.id && !isLoading) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
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
              {errorMsg || 'Unable to load dashboard data. Please try again.'}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="default">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user: dashboardUser, progress, stats, recentActivities, courseProgress, recommendedCourses } = data;

  // Memoize heavy calculations to prevent redundant processing on re-renders
  const { levelProgress, nextLevelXP, xpToNextLevel, completionPercentage } = useMemo(() => {
    const lp = progress.levelDetails?.progressToNextLevel || 0;
    const nXP = progress.levelDetails?.next?.minXP || 0;
    const xTN = nXP - progress.currentXP;
    const cp = stats.totalCourses > 0
      ? Math.round((stats.completedCourses / stats.totalCourses) * 100)
      : 0;

    return {
      levelProgress: lp,
      nextLevelXP: nXP,
      xpToNextLevel: xTN,
      completionPercentage: cp
    };
  }, [progress, stats]);

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      {/* Welcome Section with Rocky */}
      <section className="relative overflow-visible mt-10 mb-16">
        <div className="bg-gradient-to-br from-secondary via-secondary/90 to-primary/80 p-8 md:p-12 rounded-[2rem] text-primary-foreground shadow-2xl relative overflow-hidden group">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full -ml-20 -mb-20 blur-3xl" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Rocky 3D Image */}
            <div className="relative shrink-0 animate-float">
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl" />
              <img 
                src="/assets/rocky/idea-transparent.webp" 
                alt="Rocky the Logic Star" 
                className="w-48 h-48 md:w-56 md:h-56 object-contain relative z-10 drop-shadow-2xl"
              />
            </div>

            {/* Welcome Text & Speech Bubble */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="logic-spark-cloud inline-block max-w-lg mb-4 animate-scale-in">
                <p className="text-deep-purple font-heading text-lg font-semibold leading-relaxed">
                  "Logic sparks flying! ✨ Welcome back, Teacher {dashboardUser.firstName}! I'm so excited to continue our coding journey together. Ready to rock some code? 🤘"
                </p>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight">
                Your Teaching Dashboard
              </h1>
              <p className="text-primary-foreground/90 text-lg max-w-2xl font-medium">
                You've earned <span className="font-bold text-white underline decoration-primary decoration-2 underline-offset-4">{progress.totalXP} XP</span> so far. Keep up the amazing work empowering the next generation!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel border-primary/20 hover:scale-105 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Experience</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary mb-1">{progress.totalXP}</div>
            <p className="text-xs font-semibold text-muted-foreground/80">
              {xpToNextLevel > 0 ? `${xpToNextLevel} XP to level ${progress.currentLevel + 1}` : 'Max Level reached!'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-secondary/20 hover:scale-105 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Rank</CardTitle>
            <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
              <Award className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-secondary mb-1">LVL {progress.currentLevel}</div>
            <p className="text-xs font-bold text-deep-purple/70">{progress.levelName}</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-accent/20 hover:scale-105 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Learning Streak</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
              <Flame className="h-5 w-5 text-accent animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-accent mb-1">{progress.streak} Days</div>
            <p className="text-xs font-semibold text-muted-foreground/80">Don't break the chain! 🔥</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border hover:scale-105 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Progress</CardTitle>
            <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-muted transition-colors">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-deep-purple mb-1">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="h-2 bg-muted" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Level Progress */}
        <Card className="lg:col-span-2 glass-panel overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className="h-6 w-6 text-primary" />
              Path to Mastery
            </CardTitle>
            <CardDescription className="text-base font-medium">
              You're <span className="text-primary font-bold">{Math.round(levelProgress)}%</span> of the way to the next level!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-deep-purple">{progress.levelName}</span>
                <span className="text-muted-foreground font-bold">
                  {progress.currentXP} / {nextLevelXP || progress.currentXP} XP
                </span>
              </div>
              <div className="relative">
                <Progress value={levelProgress} className="h-4 rounded-full" />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-primary rounded-full shadow-lg flex items-center justify-center -ml-4 transition-all duration-500"
                  style={{ left: `${levelProgress}%` }}
                >
                  <Sparkles className="h-4 w-4 text-primary animate-spin-slow" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-4">
              <div className="text-center group">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-primary/20">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs font-bold text-muted-foreground">Level {progress.currentLevel}</p>
              </div>
              
              <div className="flex-1 h-px bg-gradient-to-r from-primary/20 via-primary/40 to-secondary/20 mx-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black text-primary/50 tracking-[0.2em] uppercase">Next Objective</div>
              </div>
              
              <div className="text-center group">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-secondary/20">
                  <Star className="h-8 w-8 text-secondary" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Level {progress.levelDetails?.next?.level || 'Max'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Badges with Mini Rocky */}
        <Card className="glass-panel flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Award className="h-6 w-6 text-accent" />
              Trophy Room
            </CardTitle>
            <CardDescription className="text-base font-medium">
              {progress.badgeCount} badge{progress.badgeCount !== 1 ? 's' : ''} earned
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {progress.recentBadges && progress.recentBadges.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {progress.recentBadges.slice(0, 4).map((badge: any) => (
                  <div
                    key={badge._id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/10 text-center hover:scale-105 hover:shadow-lg transition-all cursor-pointer group"
                    title={badge.badgeId?.description || 'Badge'}
                  >
                    <div className="text-4xl mb-2 group-hover:animate-bounce-subtle">{badge.badgeId?.icon || '🏆'}</div>
                    <p className="text-xs font-black uppercase tracking-tight text-deep-purple">{badge.badgeId?.name || 'Badge'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-4">
                 <div className="relative">
                    <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl animate-pulse" />
                    <img 
                      src="/assets/rocky/idea-transparent.webp" 
                      alt="Rocky" 
                      className="w-20 h-20 object-contain relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-500" 
                    />
                 </div>
                 <div className="space-y-1">
                   <p className="text-sm font-black text-deep-purple">No badges yet!</p>
                   <p className="text-xs font-bold text-muted-foreground">
                    "Every master was once a beginner.<br/>Start a module to earn your first!"
                   </p>
                 </div>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-auto font-bold border-accent/20 text-accent hover:bg-accent/10 hover:text-accent rounded-xl py-6"
              onClick={() => navigate("/achievements")}
            >
              All Achievements
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-deep-purple">
              <Clock className="h-6 w-6 text-primary" />
              Recent Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors shrink-0">
                      {activity.type === 'course_completed' ? <BookOpen className="h-6 w-6 text-primary" /> :
                        activity.type === 'badge_earned' ? <Award className="h-6 w-6 text-accent" /> :
                          activity.type === 'login' ? <LogIn className="h-6 w-6 text-muted-foreground" /> :
                            <Sparkles className="h-6 w-6 text-secondary" />}
                    </div>
                    <div className="flex-1 border-b border-muted pb-4 group-last:border-0 group-last:pb-0">
                      <p className="text-base font-bold text-deep-purple group-hover:text-primary transition-colors leading-tight mb-1">{activity.description}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-bold text-muted-foreground/70 uppercase">
                          {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                        {activity.xpEarned > 0 && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black px-2">
                            +{activity.xpEarned} XP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm font-medium text-muted-foreground text-center py-8">
                  Your journey starts here!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Class Quick Glance */}
        <Card className="glass-panel group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-deep-purple">
              <Users className="h-6 w-6 text-secondary" />
              Class Performance
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Monitor your students' aggregate growth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary/5 to-primary/5 border border-white/50 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-black text-deep-purple text-lg">Active Sections</h4>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global classroom health</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-secondary">84%</span>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg. Completion</p>
                </div>
              </div>
              <Progress value={84} className="h-3 bg-white/50" />
            </div>
            
            <Button 
              onClick={() => navigate('/classes')}
              variant="outline" 
              className="w-full font-bold border-secondary/20 text-secondary hover:bg-secondary/10 hover:text-secondary rounded-xl py-6"
            >
              View Detailed Roster
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-1">
        {/* Course Progress */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-deep-purple">
              <BookOpen className="h-6 w-6 text-accent" />
              Course Progress
            </CardTitle>
            <CardDescription className="font-bold text-accent uppercase tracking-wider text-xs">
              {stats.completedCourses} / {stats.totalCourses} Modules Completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              {courseProgress && courseProgress.length > 0 ? (
                courseProgress.slice(0, 3).map((cp, index) => (
                  <div key={index} className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-accent/20 hover:bg-white/50 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-deep-purple text-base truncate pr-4">
                        {cp.course?.title || 'Coding Foundations'}
                      </span>
                      <Badge className={cp.completed ? "bg-green-500 hover:bg-green-600" : "bg-accent hover:bg-accent/90"}>
                        {cp.completed ? 'Mastered' : `${cp.progressPercentage}%`}
                      </Badge>
                    </div>
                    <Progress value={cp.progressPercentage} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-sm font-medium text-muted-foreground text-center py-8">
                  Select a course to begin learning!
                </p>
              )}
              <Button
                variant="default"
                className="w-full font-black text-base py-7 rounded-2xl bg-deep-purple hover:bg-deep-purple/90 shadow-lg shadow-deep-purple/20"
                onClick={() => navigate("/videos")}
              >
                Continue Training
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Section - Premium Design */}
      {recommendedCourses && recommendedCourses.length > 0 && (
        <section className="animate-fade-in-up delay-300">
          <div className="bg-white/40 border border-white/60 backdrop-blur-xl p-1 rounded-[2.5rem] shadow-xl">
             <div className="bg-gradient-to-r from-deep-purple/5 to-secondary/5 rounded-[2.3rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center shrink-0 border border-muted group overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/5 group-hover:scale-110 transition-transform" />
                    <GraduationCap className="h-12 w-12 md:h-16 md:w-16 text-primary relative z-10" />
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-3">
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">Recommended for You</Badge>
                  <h3 className="text-2xl md:text-3xl font-black text-deep-purple leading-tight">
                    {recommendedCourses[0].title}
                  </h3>
                  <p className="text-muted-foreground text-lg font-medium">
                    This module will help you master the next set of coding concepts for your students.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-full border border-muted text-xs font-bold text-deep-purple">
                      <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                      {recommendedCourses[0].difficulty}
                    </div>
                    <div className="text-primary font-black text-sm">
                      Reward: +{recommendedCourses[0].xpReward} XP
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => navigate("/videos")}
                  className="bg-primary hover:bg-primary/90 text-white font-black text-lg px-8 py-8 rounded-3xl shadow-xl shadow-primary/20 shrink-0 group"
                >
                  Start Module
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
             </div>
          </div>
        </section>
      )}
    </div>
  );
}
