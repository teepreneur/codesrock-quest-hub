/**
 * Gamification Service
 * Handles all gamification-related API calls
 */

import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: {
    type: string;
    value: number;
  };
  xpReward: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  _id: string;
  badgeId: Badge | string;
  earnedAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  currentXP: number;
  totalXP: number;
  currentLevel: number;
  levelName: string;
  streak: number;
  lastActivityDate: string;
  badges: UserBadge[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  userId: string;
  type: string;
  description: string;
  xpEarned: number;
  metadata?: any;
  timestamp: string;
}

export interface LeaderboardEntry {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  totalXP: number;
  currentLevel: number;
  levelName: string;
}

export interface Level {
  level: number;
  name: string;
  xpRequired: number;
  xpRange: {
    min: number;
    max: number;
  };
}

interface ProgressApiResponse {
  progress: {
    id: string;
    user_id: string;
    current_xp: number;
    total_xp: number;
    current_level: number;
    level_name: string;
    streak: number;
    last_activity_date: string;
    badges: any[];
    created_at: string;
    updated_at: string;
  };
  levelDetails: {
    current: { level: number; name: string; minXP: number; icon: string };
    next: { level: number; name: string; minXP: number; icon: string } | null;
    progressToNextLevel: number;
  };
}

class GamificationService {
  /**
   * Get user progress by user ID
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    const response = await apiService.get<ProgressApiResponse>(`/progress/${userId}`);
    const progress = response.progress;

    if (!progress) {
      throw new Error('User progress not found');
    }

    // Transform snake_case to camelCase
    return {
      id: progress.id,
      userId: progress.user_id,
      currentXP: progress.current_xp,
      totalXP: progress.total_xp,
      currentLevel: progress.current_level,
      levelName: progress.level_name || response.levelDetails?.current?.name || 'Code Cadet',
      streak: progress.streak,
      lastActivityDate: progress.last_activity_date,
      badges: progress.badges || [],
      createdAt: progress.created_at,
      updatedAt: progress.updated_at,
    };
  }

  /**
   * Add XP to user
   */
  async addXP(
    userId: string,
    amount: number,
    description: string,
    metadata?: any
  ): Promise<UserProgress> {
    return apiService.post<UserProgress>('/progress/xp', {
      userId,
      amount,
      description,
      metadata,
    });
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: string): Promise<UserProgress> {
    return apiService.post<UserProgress>('/progress/streak', { userId });
  }

  /**
   * Get all badges
   */
  async getAllBadges(): Promise<Badge[]> {
    return apiService.get<Badge[]>('/badges');
  }

  /**
   * Get badges earned by user
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return apiService.get<UserBadge[]>(`/badges/user/${userId}`);
  }

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badgeId: string): Promise<void> {
    return apiService.post('/badges/award', { userId, badgeId });
  }

  /**
   * Get user activity feed
   */
  async getActivityFeed(
    userId: string,
    options?: { limit?: number; page?: number }
  ): Promise<Activity[]> {
    let endpoint = `/activities/${userId}`;

    if (options) {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.page) params.append('page', options.page.toString());

      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    return apiService.get<Activity[]>(endpoint);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
    let endpoint = '/leaderboard';

    if (limit) {
      endpoint += `?limit=${limit}`;
    }

    return apiService.get<LeaderboardEntry[]>(endpoint);
  }

  /**
   * Get all levels
   */
  async getAllLevels(): Promise<Level[]> {
    return apiService.get<Level[]>('/levels');
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
