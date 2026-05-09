import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock, Star, Award, Medal } from "lucide-react";
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
      // Handle Supabase structure: ub.badge_id
      const bId = (ub as any).badge_id || (ub as any).badgeId;
      const bIdValue = typeof bId === 'string' ? bId : bId?.id;
      return bIdValue === badgeId;
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
  // Update rank lookup to use 'id' or 'user.id'
  const currentUserRank = leaderboard.findIndex(entry => {
    const entryId = (entry.userId as any)?.id || (entry.userId as any)?._id || entry.userId;
    return entryId === user?.id;
  }) + 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Achievements</h1>
          </div>
          <p className="text-muted-foreground">
            Earn badges and climb the leaderboard
          </p>
        </div>
        <div className="text-right flex items-center gap-6">
          <div className="animate-bounce-subtle hidden md:block">
            <img src="/assets/rocky/celebration-transparent.webp" alt="Rocky Celebration" className="w-20 h-20 object-contain drop-shadow-xl" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Badges Earned</p>
            <p className="text-4xl font-black text-primary">
              {userBadges.length}<span className="text-lg text-muted-foreground">/{allBadges.length}</span>
            </p>
          </div>
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
            const bId = badge.id || (badge as any)._id;
            const earned = isEarned(bId);
            return (
              <Card
                key={bId}
                className={`${earned ? 'border-primary/40' : 'opacity-60'} hover:scale-105 transition-transform cursor-pointer`}
              >
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-5xl mb-2 flex justify-center h-[48px] items-center">
                    {earned ? badge.icon : <Lock className="h-10 w-10 text-muted-foreground/50" />}
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
                      {(badge as any).xp_reward || badge.xpReward} XP
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
              const entryUserId = (entry.userId as any)?.id || (entry.userId as any)?._id || entry.userId;
              const isCurrentUser = entryUserId === user?.id;

              return (
                <div
                  key={entry.id || (entry as any)._id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${isCurrentUser
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-secondary/20 hover:bg-secondary/30'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background font-bold text-lg">
                      {rank === 1 ? <Medal className="h-6 w-6 text-yellow-500" /> :
                        rank === 2 ? <Medal className="h-6 w-6 text-gray-400" /> :
                          rank === 3 ? <Medal className="h-6 w-6 text-amber-700" /> :
                            rank}
                    </div>

                    {/* User Info */}
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {entry.userId?.firstName || 'Anonymous'} {entry.userId?.lastName || 'User'}
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

          {(currentUserRank === 0 || leaderboard.length === 0) && (
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
              {userBadges.filter(ub => {
                const bId = (ub as any).badge_id || (ub as any).badgeId;
                const bIdValue = typeof bId === 'string' ? bId : bId?.id;
                const badge = allBadges.find(ab => (ab.id || (ab as any)._id) === bIdValue);
                return badge?.rarity === 'Rare';
              }).length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Rare Badges</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-purple-500">
              {userBadges.filter(ub => {
                const bId = (ub as any).badge_id || (ub as any).badgeId;
                const bIdValue = typeof bId === 'string' ? bId : bId?.id;
                const badge = allBadges.find(ab => (ab.id || (ab as any)._id) === bIdValue);
                return badge?.rarity === 'Epic';
              }).length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Epic Badges</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-yellow-500">
              {userBadges.filter(ub => {
                const bId = (ub as any).badge_id || (ub as any).badgeId;
                const bIdValue = typeof bId === 'string' ? bId : bId?.id;
                const badge = allBadges.find(ab => (ab.id || (ab as any)._id) === bIdValue);
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
