/**
 * Admin Service
 * Handles all admin-related API calls
 */

import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

// Types
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  teacherCount: number;
  adminCount: number;
  activeToday: number;
}

export interface User {
  _id: string;
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isOnline?: boolean;
  schoolId?: string;
  schoolName?: string;
  schoolCode?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  role?: string;
  schoolId: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  schoolId?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
  };
}

export interface AnalyticsOverview {
  stats: {
    totalTeachers: number;
    activeToday: number;
    totalCourses: number;
    avgCompletionRate: number;
  };
  trends: {
    newUsersThisMonth: number;
    totalActivities: number;
    engagementTrend: Array<{ _id: string; count: number }>;
  };
}

// School types
export interface School {
  id: string;
  name: string;
  schoolCode: string;
  address?: string;
  region?: string;
  district?: string;
  contactEmail?: string;
  teacherCount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchoolData {
  name: string;
  address?: string;
  region?: string;
  district?: string;
  contactEmail?: string;
}

export interface UpdateSchoolData {
  name?: string;
  address?: string;
  region?: string;
  district?: string;
  contactEmail?: string;
  isActive?: boolean;
}

export interface PaginatedSchools {
  schools: School[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserCredentials {
  schoolCode: string;
  schoolName: string;
  username: string;
  password: string;
}

class AdminService {
  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    return apiService.get<UserStats>('/admin/users/stats');
  }

  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    schoolId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedUsers> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.schoolId) queryParams.append('schoolId', params.schoolId);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiService.get<PaginatedUsers>(`/admin/users?${queryParams.toString()}`);
  }

  /**
   * Alias for getAllUsers (for compatibility)
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    schoolId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedUsers> {
    return this.getAllUsers(params);
  }

  /**
   * Get single user by ID
   */
  async getUserById(userId: string): Promise<{ user: User; progress: any }> {
    return apiService.get<{ user: User; progress: any }>(`/admin/users/${userId}`);
  }

  /**
   * Create new user with auto-generated credentials
   */
  async createUser(data: CreateUserData): Promise<{ user: User; credentials?: UserCredentials }> {
    return apiService.post<{ user: User; credentials?: UserCredentials }>('/admin/users', data);
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<{ user: User }> {
    return apiService.put<{ user: User }>(`/admin/users/${userId}`, data);
  }

  /**
   * Delete/deactivate user
   */
  async deleteUser(userId: string): Promise<void> {
    return apiService.delete(`/admin/users/${userId}`);
  }

  /**
   * Reset user password (generates new secure password)
   */
  async resetUserPassword(userId: string): Promise<{ credentials: UserCredentials }> {
    return apiService.post<{ credentials: UserCredentials }>(`/admin/users/${userId}/reset-password`, {});
  }

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return apiService.get<AnalyticsOverview>('/admin/analytics/overview');
  }

  /**
   * Get teacher analytics
   */
  async getTeacherAnalytics(teacherId: string): Promise<any> {
    return apiService.get(`/admin/analytics/teachers/${teacherId}`);
  }

  /**
   * Get course analytics
   */
  async getCourseAnalytics(): Promise<any> {
    return apiService.get('/admin/analytics/courses');
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(days = 30): Promise<any> {
    return apiService.get(`/admin/analytics/engagement?days=${days}`);
  }

  /**
   * Get all courses (content management)
   */
  async getAllCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    return apiService.get(`/admin/content/courses?${queryParams.toString()}`);
  }

  /**
   * Create course
   */
  async createCourse(data: any): Promise<any> {
    return apiService.post('/admin/content/courses', data);
  }

  /**
   * Update course
   */
  async updateCourse(courseId: string, data: any): Promise<any> {
    return apiService.put(`/admin/content/courses/${courseId}`, data);
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string): Promise<void> {
    return apiService.delete(`/admin/content/courses/${courseId}`);
  }

  /**
   * Get all resources
   */
  async getAllResources(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);

    return apiService.get(`/admin/content/resources?${queryParams.toString()}`);
  }

  /**
   * Create resource
   */
  async createResource(data: any): Promise<any> {
    return apiService.post('/admin/content/resources', data);
  }

  /**
   * Update resource
   */
  async updateResource(resourceId: string, data: any): Promise<any> {
    return apiService.put(`/admin/content/resources/${resourceId}`, data);
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string): Promise<void> {
    return apiService.delete(`/admin/content/resources/${resourceId}`);
  }

  /**
   * Get content statistics
   */
  async getContentStats(): Promise<any> {
    return apiService.get('/admin/content/stats');
  }

  // ==================== School Management ====================

  /**
   * Get all schools with pagination and filters
   */
  async getSchools(params?: {
    page?: number;
    limit?: number;
    search?: string;
    region?: string;
    district?: string;
    isActive?: boolean;
  }): Promise<PaginatedSchools> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.district) queryParams.append('district', params.district);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    return apiService.get<PaginatedSchools>(`/admin/schools?${queryParams.toString()}`);
  }

  /**
   * Get single school by ID
   */
  async getSchoolById(schoolId: string): Promise<{ school: School; teachers: any[] }> {
    return apiService.get<{ school: School; teachers: any[] }>(`/admin/schools/${schoolId}`);
  }

  /**
   * Get school by code (for validation)
   */
  async getSchoolByCode(code: string): Promise<{ school: { id: string; name: string; schoolCode: string } }> {
    return apiService.get<{ school: { id: string; name: string; schoolCode: string } }>(`/admin/schools/code/${code}`);
  }

  /**
   * Create new school
   */
  async createSchool(data: CreateSchoolData): Promise<{ school: School }> {
    return apiService.post<{ school: School }>('/admin/schools', data);
  }

  /**
   * Update school
   */
  async updateSchool(schoolId: string, data: UpdateSchoolData): Promise<{ school: School }> {
    return apiService.put<{ school: School }>(`/admin/schools/${schoolId}`, data);
  }

  /**
   * Deactivate school
   */
  async deactivateSchool(schoolId: string): Promise<void> {
    return apiService.delete(`/admin/schools/${schoolId}`);
  }
}

// Export singleton instance
export const adminService = new AdminService();
