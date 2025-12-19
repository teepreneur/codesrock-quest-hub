/**
 * Course Service
 * Handles all course-related API calls
 */

import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  xpReward: number;
  prerequisites: string[];
  order: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoProgress {
  _id: string;
  userId: string;
  courseId: string;
  watchedSeconds: number;
  totalSeconds: number;
  progressPercentage: number;
  completed: boolean;
  xpAwarded: boolean;
  xpReward?: number;
  notes?: string;
  bookmarks: Array<{
    time: number;
    note: string;
  }>;
  lastWatchedAt: string;
}

export interface CourseWithProgress extends Course {
  progress?: number;
  isCompleted?: boolean;
  isLocked?: boolean;
}

class CourseService {
  /**
   * Get all courses with user progress
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
   * Get course by ID
   */
  async getCourseById(id: string): Promise<Course> {
    return apiService.get<Course>(API_CONFIG.ENDPOINTS.COURSES.BY_ID(id));
  }

  /**
   * Update video progress (watchedSeconds / totalSeconds)
   */
  async updateVideoProgress(
    userId: string,
    courseId: string,
    watchedSeconds: number,
    totalSeconds: number,
    notes?: string
  ): Promise<VideoProgress> {
    return apiService.post<VideoProgress>('/courses/progress', {
      userId,
      courseId,
      watchedSeconds: Math.floor(watchedSeconds),
      totalSeconds: Math.floor(totalSeconds) || 1, // Ensure at least 1 to avoid validation error
      notes,
    });
  }

  /**
   * Get user's course progress for all courses
   */
  async getUserCourseProgress(userId: string): Promise<VideoProgress[]> {
    return apiService.get<VideoProgress[]>(`/courses/progress/${userId}`);
  }

  /**
   * Get recommended courses for user
   */
  async getRecommendedCourses(userId: string): Promise<Course[]> {
    return apiService.get<Course[]>(`/courses/recommended/${userId}`);
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
