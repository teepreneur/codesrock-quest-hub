import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Award, Star } from "lucide-react";
import { currentTeacher, levelTitles, badges, leaderboard } from "@/lib/mockData";

export default function Achievements() {
  const levelTitle = levelTitles[currentTeacher.level - 1] || "Code Cadet";
  const nextLevelTitle = levelTitles[currentTeacher.level] || "CodesRock Champion";
  const levelProgress = (currentTeacher.xp / currentTeacher.xpToNextLevel) * 100;

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  const badgesByCategory = {
    all: badges,
    completion: badges.filter((b) => b.category === "completion"),
    engagement: badges.filter((b) => b.category === "engagement"),
    milestone: badges.filter((b) => b.category === "milestone"),
    special: badges.filter((b) => b.category === "special"),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Achievements 🏆</h1>
        <p className="text-muted-foreground">Track your progress and collect badges along the way</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Level Progress */}
        <Card className="md:col-span-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Your Level
            </CardTitle>
            <CardDescription>Keep earning XP to level up!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-primary mb-1">Level {currentTeacher.level}</div>
                <p className="text-lg font-medium text-muted-foreground">{levelTitle}</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <p className="text-2xl font-bold">{currentTeacher.xp}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextLevelTitle}</span>
                <span className="font-medium">
                  {currentTeacher.xp} / {currentTeacher.xpToNextLevel} XP
                </span>
              </div>
              <Progress value={levelProgress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {currentTeacher.xpToNextLevel - currentTeacher.xp} XP remaining
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-semibold mb-2">Level Milestones</h4>
              <div className="grid grid-cols-4 gap-2">
                {levelTitles.slice(0, 8).map((title, index) => (
                  <div
                    key={index}
                    className={`text-center p-2 rounded-lg ${
                      index < currentTeacher.level
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="text-xl mb-1">
                      {index < currentTeacher.level ? "✅" : "🔒"}
                    </div>
                    <p className="text-xs font-medium">{index + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak & Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-lg bg-accent/20 border border-accent/30">
              <div className="text-5xl mb-2">🔥</div>
              <div className="text-4xl font-bold text-accent mb-1">{currentTeacher.streak}</div>
              <p className="text-sm font-medium text-muted-foreground">Day Streak</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Badges Earned</span>
                <Badge variant="default">{earnedBadges.length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Total XP</span>
                <Badge variant="secondary">{currentTeacher.xp}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Leaderboard Rank</span>
                <Badge variant="outline">#{leaderboard.find(l => l.name === currentTeacher.name)?.rank || "N/A"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            Badge Collection
          </CardTitle>
          <CardDescription>
            {earnedBadges.length} of {badges.length} badges earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({badges.length})</TabsTrigger>
              <TabsTrigger value="completion">Completion ({badgesByCategory.completion.length})</TabsTrigger>
              <TabsTrigger value="engagement">Engagement ({badgesByCategory.engagement.length})</TabsTrigger>
              <TabsTrigger value="milestone">Milestone ({badgesByCategory.milestone.length})</TabsTrigger>
            </TabsList>

            {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryBadges.map((badge) => (
                    <Card
                      key={badge.id}
                      className={`overflow-hidden transition-all ${
                        badge.earned
                          ? "border-accent/30 hover:shadow-lg hover:-translate-y-1"
                          : "opacity-60"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="text-center space-y-3">
                          <div
                            className={`text-6xl mx-auto w-20 h-20 flex items-center justify-center rounded-full ${
                              badge.earned
                                ? "bg-accent/20 animate-pulse-glow"
                                : "bg-muted"
                            }`}
                          >
                            {badge.earned ? badge.icon : "🔒"}
                          </div>

                          <div>
                            <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                            <Badge
                              variant={badge.earned ? "default" : "secondary"}
                              className={badge.earned ? "bg-accent" : ""}
                            >
                              +{badge.xpReward} XP
                            </Badge>
                          </div>

                          {badge.earned ? (
                            <div className="text-xs text-muted-foreground">
                              Earned: {badge.earnedDate}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                              🔓 {badge.unlockRequirement}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            Leaderboard
          </CardTitle>
          <CardDescription>See how you rank among your peers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  entry.name === currentTeacher.name
                    ? "bg-primary/20 border-2 border-primary/30 shadow-lg"
                    : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                    entry.rank === 1
                      ? "bg-accent text-foreground"
                      : entry.rank === 2
                      ? "bg-secondary text-foreground"
                      : entry.rank === 3
                      ? "bg-primary text-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                </div>

                <div className="flex-1">
                  <p className="font-semibold">
                    {entry.name}
                    {entry.name === currentTeacher.name && (
                      <Badge variant="default" className="ml-2 bg-primary">
                        You
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Level {entry.level} • {levelTitles[entry.level - 1] || "Code Cadet"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{entry.xp}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
