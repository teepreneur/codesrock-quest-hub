import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock, Star, Award } from "lucide-react";
import { toast } from "sonner";

import { gamificationService, type Badge as BadgeType, type UserBadge, type LeaderboardEntry } from "@/services/gamification.service";
import { authService } from "@/services/auth.service";

export default function Achievements() {
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const user = authService.getStoredUser();

      if (!user?.id) {
        toast.error('Please login to view achievements');
        return;
      }

      const [badges, earned, board] = await Promise.all([
        gamificationService.getAllBadges(),
        gamificationService.getUserBadges(user.id),
        gamificationService.getLeaderboard(10)
      ]);

      console.log('Badges loaded:', { badges, earned, board });
      setAllBadges(badges);
      setUserBadges(earned);
      setLeaderboard(board);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const isEarned = (badgeId: string) => {
    return userBadges.some(ub => {
      const badgeIdValue = typeof ub.badgeId === 'string' ? ub.badgeId : ub.badgeId?._id;
      return badgeIdValue === badgeId;
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'bg-gray-500';
      case 'Rare':
        return 'bg-blue-500';
      case 'Epic':
        return 'bg-purple-500';
      case 'Legendary':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const user = authService.getStoredUser();
  const currentUserRank = leaderboard.findIndex(entry => entry.userId._id === user?.id) + 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Achievements 🏆</h1>
          <p className="text-muted-foreground">
            Earn badges and climb the leaderboard
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Badges Earned</p>
          <p className="text-3xl font-bold text-primary">
            {userBadges.length}/{allBadges.length}
          </p>
        </div>
      </div>

      {/* Badge Progress */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Collection Progress</span>
            <span className="text-sm text-muted-foreground">
              {allBadges.length > 0 ? Math.round((userBadges.length / allBadges.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-primary rounded-full h-3 transition-all"
              style={{ width: `${allBadges.length > 0 ? (userBadges.length / allBadges.length) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Badge Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Badge Collection
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges.map(badge => {
            const earned = isEarned(badge._id);
            return (
              <Card
                key={badge._id}
                className={`${earned ? 'border-primary/40' : 'opacity-60'} hover:scale-105 transition-transform cursor-pointer`}
              >
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-5xl mb-2">
                    {earned ? badge.icon : '🔒'}
                  </div>
                  <h3 className="font-semibold text-sm">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground min-h-[40px]">
                    {badge.description}
                  </p>
                  <div className="flex flex-col gap-1 items-center">
                    <Badge
                      className={`${getRarityColor(badge.rarity)} text-white text-xs`}
                    >
                      {badge.rarity}
                    </Badge>
                    <Badge variant={earned ? "default" : "outline"} className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      {badge.xpReward} XP
                    </Badge>
                  </div>
                  {earned && (
                    <div className="pt-2">
                      <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                        <Trophy className="h-3 w-3" />
                        Earned!
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Global Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.userId._id === user?.id;

              return (
                <div
                  key={entry._id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    isCurrentUser
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-secondary/20 hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background font-bold text-lg">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </div>

                    {/* User Info */}
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {entry.userId.firstName} {entry.userId.lastName}
                        {isCurrentUser && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Level {entry.currentLevel} - {entry.levelName}
                      </p>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <Badge variant="secondary" className="text-base font-bold">
                      <Star className="h-4 w-4 mr-1" />
                      {entry.totalXP} XP
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {currentUserRank === 0 && (
            <div className="mt-4 p-4 bg-secondary/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                You're not on the leaderboard yet. Complete courses and earn XP to rank up!
              </p>
            </div>
          )}

          {currentUserRank > 10 && (
            <div className="mt-4 p-4 bg-secondary/20 rounded-lg text-center">
              <p className="text-sm">
                Your Rank: <span className="font-bold text-primary">#{currentUserRank}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Keep earning XP to climb the leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">{userBadges.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Badges Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-blue-500">
              {userBadges.filter(b => {
                const badge = allBadges.find(ab => ab._id === (typeof b.badgeId === 'string' ? b.badgeId : b.badgeId?._id));
                return badge?.rarity === 'Rare';
              }).length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Rare Badges</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-purple-500">
              {userBadges.filter(b => {
                const badge = allBadges.find(ab => ab._id === (typeof b.badgeId === 'string' ? b.badgeId : b.badgeId?._id));
                return badge?.rarity === 'Epic';
              }).length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Epic Badges</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-yellow-500">
              {userBadges.filter(b => {
                const badge = allBadges.find(ab => ab._id === (typeof b.badgeId === 'string' ? b.badgeId : b.badgeId?._id));
                return badge?.rarity === 'Legendary';
              }).length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Legendary Badges</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
