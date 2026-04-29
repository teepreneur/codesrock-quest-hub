/**
 * Course Service
 * Handles all course-related API calls for the teacher portal
 */

import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface CourseWithProgress {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  xpReward: number;
  prerequisites: string[];
  order: number;
  tags: string[];
  isActive: boolean;
  topicCount: number;
  videoCount: number;
  userProgress: {
    completedVideos: number;
    totalVideos: number;
    progressPercentage: number;
    isCompleted: boolean;
  } | null;
  // Legacy compat
  progress?: number;
  isCompleted?: boolean;
  isLocked?: boolean;
}

export interface TopicWithVideos {
  id: string;
  course_id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  order_index: number;
  is_active: boolean;
  videoCount: number;
  videos: VideoItem[];
}

export interface VideoItem {
  id: string;
  topic_id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string | null;
  thumbnail: string | null;
  duration: number;
  xp_reward: number;
  order_index: number;
  is_active: boolean;
  view_count: number;
  completion_count: number;
  userProgress: {
    completed: boolean;
    watchPercentage: number;
    lastWatchedAt: string;
  } | null;
}

export interface CourseDetail {
  course: CourseWithProgress & {
    topics: TopicWithVideos[];
  };
  courseProgress: {
    completedVideos: number;
    totalVideos: number;
    progressPercentage: number;
    isCompleted: boolean;
  } | null;
}

export interface VideoProgressResult {
  progress: {
    completed: boolean;
    progressPercentage: number;
    xpAwarded: boolean;
  };
  justCompleted: boolean;
}

class CourseService {
  /**
   * Get all courses with topic/video counts and user progress
   */
  async getCourses(filters?: {
    category?: string;
    difficulty?: string;
    userId?: string;
  }): Promise<CourseWithProgress[]> {
    let endpoint = API_CONFIG.ENDPOINTS.COURSES.BASE;

    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.userId) params.append('userId', filters.userId);

    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    return apiService.get<CourseWithProgress[]>(endpoint);
  }

  /**
   * Get course by ID with full hierarchy (topics → videos) and user progress
   */
  async getCourseById(id: string, userId?: string): Promise<CourseDetail> {
    let endpoint = API_CONFIG.ENDPOINTS.COURSES.BY_ID(id);
    if (userId) {
      endpoint += `?userId=${userId}`;
    }
    return apiService.get<CourseDetail>(endpoint);
  }

  /**
   * Update video progress (watchedSeconds / totalSeconds)
   */
  async updateVideoProgress(
    userId: string,
    videoId: string,
    courseId: string,
    watchedSeconds: number,
    totalSeconds: number,
  ): Promise<VideoProgressResult> {
    return apiService.post<VideoProgressResult>('/courses/progress', {
      userId,
      videoId,
      courseId,
      watchedSeconds: Math.floor(watchedSeconds),
      totalSeconds: Math.floor(totalSeconds) || 1,
    });
  }

  /**
   * Get user's course progress for all courses
   */
  async getUserCourseProgress(userId: string): Promise<any> {
    return apiService.get(`/courses/progress/${userId}`);
  }

  /**
   * Get recommended courses for user
   */
  async getRecommendedCourses(userId: string): Promise<CourseWithProgress[]> {
    return apiService.get<CourseWithProgress[]>(`/courses/recommended/${userId}`);
  }

  /**
   * Bookmark a moment in a video
   */
  async bookmarkMoment(
    userId: string,
    courseId: string,
    time: number,
    note: string
  ): Promise<void> {
    return apiService.post('/courses/bookmark', {
      userId,
      courseId,
      time,
      note,
    });
  }
}

// Export singleton instance
export const courseService = new CourseService();
