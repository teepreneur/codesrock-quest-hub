import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, BookOpen, Clock, TrendingUp, Flame, Award } from "lucide-react";
import { currentTeacher, levelTitles, recentActivity, leaderboard, badges } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const levelTitle = levelTitles[currentTeacher.level - 1] || "Code Cadet";
  const nextLevelTitle = levelTitles[currentTeacher.level] || "CodesRock Champion";
  const levelProgress = (currentTeacher.xp / currentTeacher.xpToNextLevel) * 100;

  const earnedBadges = badges.filter(b => b.earned).slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-primary p-8 rounded-2xl text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {currentTeacher.name.split(" ")[0]}! 👋
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
            <div className="text-3xl font-bold text-primary">{currentTeacher.xp}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentTeacher.xpToNextLevel - currentTeacher.xp} XP to next level
            </p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Award className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">Level {currentTeacher.level}</div>
            <p className="text-xs text-muted-foreground mt-1">{levelTitle}</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{currentTeacher.streak} Days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentTeacher.completionPercentage}%</div>
            <Progress value={currentTeacher.completionPercentage} className="mt-2" />
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
              You're {Math.round(levelProgress)}% of the way to {nextLevelTitle}!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{levelTitle}</span>
                <span className="text-muted-foreground">
                  {currentTeacher.xp} / {currentTeacher.xpToNextLevel} XP
                </span>
              </div>
              <Progress value={levelProgress} className="h-3" />
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <p className="text-xs text-muted-foreground">Level {currentTeacher.level}</p>
                </div>
                <div className="flex-1 h-px bg-border mx-4" />
                <div className="text-center">
                  <div className="text-2xl mb-1">⭐</div>
                  <p className="text-xs text-muted-foreground">Level {currentTeacher.level + 1}</p>
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
            <CardDescription>Your latest achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-center hover:scale-105 transition-transform cursor-pointer"
                  title={badge.description}
                >
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <p className="text-xs font-medium">{badge.name}</p>
                </div>
              ))}
            </div>
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
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top teachers this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    entry.name === currentTeacher.name
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                    {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                  </div>
                  <Badge variant="secondary">{entry.xp} XP</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Recommended Course */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Next Recommended Course
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="text-5xl">🔁</div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Loops and Iteration Basics</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Continue your learning journey with this intermediate course on loops.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">Intermediate</Badge>
              <span className="text-muted-foreground">40 minutes</span>
              <span className="text-primary font-medium">+100 XP</span>
            </div>
          </div>
          <Button
            onClick={() => navigate("/videos")}
            className="bg-primary hover:bg-primary/90"
          >
            Continue Learning
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
