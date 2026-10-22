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
    onboardingStatus?: { phase: number; step: number; completed: boolean };
    levelDetails: {
      current: { level: number; name: string; minXP: number; icon: string };
      next: { level: number; name: string; minXP: number; icon: string } | null;
      progressToNextLevel: number;
    };
  };
  stats: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    notStartedCourses: number;
    evaluationsPassed: number;
  };
  recentActivities: Array<{
    type: string;
    description: string;
    xpEarned: number;
    timestamp: string;
  }>;
  courseProgress: Array<{
    course: { id: string; title: string };
    videosCompleted: number;
    videosTotal: number;
    progressPercentage: number;
    completed: boolean;
    lastWatchedAt: string;
    nextVideo: { id: string; title: string; topicTitle?: string } | null;
  }>;
  upcomingSessions: Array<{
    session: { id: string; title: string; start_time: string; end_time?: string; type?: string; meeting_link?: string; instructor?: string };
    isRegistered: boolean;
  }>;
  evaluations: Array<{
    id: string;
    evaluation_id: string;
    evaluation: any;
    passed: boolean;
    score?: number;
    completedAt?: string;
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
