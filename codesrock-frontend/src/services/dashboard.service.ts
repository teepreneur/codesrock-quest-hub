/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */

import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface DashboardData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    fullName: string;
  };
  progress: {
    currentXP: number;
    totalXP: number;
    currentLevel: number;
    levelName: string;
    streak: number;
    lastActivityDate: string;
    badgeCount: number;
    recentBadges: any[];
  };
  stats: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    notStartedCourses: number;
    leaderboardPosition: number;
  };
  recentActivities: Array<{
    type: string;
    description: string;
    xpEarned: number;
    timestamp: string;
  }>;
  courseProgress: Array<{
    course: any;
    progressPercentage: number;
    completed: boolean;
    lastWatchedAt: string;
  }>;
  upcomingSessions: Array<{
    session: any;
    registeredAt: string;
  }>;
  recommendedCourses: any[];
  evaluations: Array<{
    id: string;
    evaluation: any;
    status: string;
    score?: number;
    percentage?: number;
    submittedAt?: string;
  }>;
}

export interface AdminStats {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalResources: number;
    totalSessions: number;
    totalActivities: number;
    activeUsers: number;
    completedCourses: number;
    upcomingSessions: number;
  };
  topUsers: any[];
  popularCourses: any[];
}

class DashboardService {
  /**
   * Get user dashboard data
   */
  async getUserDashboard(userId: string): Promise<DashboardData> {
    console.log('Fetching dashboard for user:', userId);

    const response = await apiService.get<DashboardData>(
      API_CONFIG.ENDPOINTS.DASHBOARD.USER(userId)
    );

    console.log('Dashboard data received:', response);
    return response;
  }

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    return apiService.get<AdminStats>(API_CONFIG.ENDPOINTS.DASHBOARD.ADMIN_STATS);
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
