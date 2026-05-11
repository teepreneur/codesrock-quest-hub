/**
 * Admin Service
 * Handles all admin-related API calls
 */

import { apiService } from './api.service';

// Types
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  teacherCount: number;
  adminCount: number;
  activeToday: number;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isOnline?: boolean;
  phoneNumber?: string;
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
  phoneNumber?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  schoolId?: string;
  phoneNumber?: string;
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
    engagementTrend: Array<{ id: string; count: number }>;
  };
  topSchools?: Array<{
    name: string;
    progress: number;
    active: number;
    trend: 'up' | 'down';
  }>;
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
  avgProgress?: number;
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
  // ==================== User Management ====================

  async getUserStats(): Promise<UserStats> {
    return apiService.get<UserStats>('/admin/users/stats');
  }

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

  async getUserById(userId: string): Promise<{ user: User; progress: any }> {
    return apiService.get<{ user: User; progress: any }>(`/admin/users/${userId}`);
  }

  async createUser(data: CreateUserData): Promise<{ user: User; credentials?: UserCredentials }> {
    return apiService.post<{ user: User; credentials?: UserCredentials }>('/admin/users', data);
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<{ user: User }> {
    return apiService.put<{ user: User }>(`/admin/users/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<void> {
    return apiService.delete(`/admin/users/${userId}`);
  }

  async resetUserPassword(userId: string): Promise<{ credentials: UserCredentials }> {
    return apiService.post<{ credentials: UserCredentials }>(`/admin/users/${userId}/reset-password`, {});
  }

  // ==================== Analytics ====================

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return apiService.get<AnalyticsOverview>('/admin/analytics/overview');
  }

  async getTeacherAnalytics(teacherId: string): Promise<any> {
    return apiService.get(`/admin/analytics/teachers/${teacherId}`);
  }

  async getCourseAnalytics(): Promise<any> {
    return apiService.get('/admin/analytics/courses');
  }

  async getEngagementMetrics(days = 30): Promise<any> {
    return apiService.get(`/admin/analytics/engagement?days=${days}`);
  }

  async getSchoolAnalytics(): Promise<any> {
    return apiService.get('/admin/analytics/schools');
  }

  async getSchoolPerformance(schoolId: string): Promise<any> {
    return apiService.get(`/admin/analytics/schools/${schoolId}/performance`);
  }

  async getTeacherDetailedPerformance(teacherId: string): Promise<any> {
    return apiService.get(`/admin/analytics/teachers/${teacherId}/performance`);
  }

  async searchUsersByContact(query: string): Promise<any> {
    return apiService.get(`/admin/users/search?query=${encodeURIComponent(query)}`);
  }

  async pairUserWithSchool(userId: string, schoolId: string): Promise<any> {
    return apiService.post(`/admin/users/${userId}/pair-school`, { schoolId });
  }

  // ==================== Course Management ====================

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

  async createCourse(data: any): Promise<any> {
    return apiService.post('/admin/content/courses', data);
  }

  async updateCourse(courseId: string, data: any): Promise<any> {
    return apiService.put(`/admin/content/courses/${courseId}`, data);
  }

  async deleteCourse(courseId: string): Promise<void> {
    return apiService.delete(`/admin/content/courses/${courseId}`);
  }

  // ==================== Topic Management ====================

  async getTopics(courseId: string): Promise<any> {
    return apiService.get(`/admin/content/courses/${courseId}/topics`);
  }

  async createTopic(courseId: string, data: any): Promise<any> {
    return apiService.post(`/admin/content/courses/${courseId}/topics`, data);
  }

  async updateTopic(topicId: string, data: any): Promise<any> {
    return apiService.put(`/admin/content/topics/${topicId}`, data);
  }

  async deleteTopic(topicId: string): Promise<void> {
    return apiService.delete(`/admin/content/topics/${topicId}`);
  }

  async getAllTopics(): Promise<any[]> {
    const response = await apiService.get<any>('/admin/content/topics');
    return response.topics || [];
  }

  // ==================== Video Management ====================

  async getVideos(topicId: string): Promise<any> {
    return apiService.get(`/admin/content/topics/${topicId}/videos`);
  }

  async createVideo(topicId: string, data: any): Promise<any> {
    return apiService.post(`/admin/content/topics/${topicId}/videos`, data);
  }

  async updateVideo(videoId: string, data: any): Promise<any> {
    return apiService.put(`/admin/content/videos/${videoId}`, data);
  }

  async deleteVideo(videoId: string): Promise<void> {
    return apiService.delete(`/admin/content/videos/${videoId}`);
  }

  // ==================== Resource Management ====================

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

  async createResource(data: any): Promise<any> {
    return apiService.post('/admin/content/resources', data);
  }

  async updateResource(resourceId: string, data: any): Promise<any> {
    return apiService.put(`/admin/content/resources/${resourceId}`, data);
  }

  async deleteResource(resourceId: string): Promise<void> {
    return apiService.delete(`/admin/content/resources/${resourceId}`);
  }

  async getContentStats(): Promise<any> {
    return apiService.get('/admin/content/stats');
  }

  // ==================== School Management ====================

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

  async getSchoolById(schoolId: string): Promise<{ school: School; teachers: any[] }> {
    return apiService.get<{ school: School; teachers: any[] }>(`/admin/schools/${schoolId}`);
  }

  async getSchoolByCode(code: string): Promise<{ school: { id: string; name: string; schoolCode: string } }> {
    return apiService.get<{ school: { id: string; name: string; schoolCode: string } }>(`/admin/schools/code/${code}`);
  }

  async createSchool(data: CreateSchoolData): Promise<{ school: School }> {
    return apiService.post<{ school: School }>('/admin/schools', data);
  }

  async updateSchool(schoolId: string, data: UpdateSchoolData): Promise<{ school: School }> {
    return apiService.put<{ school: School }>(`/admin/schools/${schoolId}`, data);
  }

  async deactivateSchool(schoolId: string): Promise<void> {
    return apiService.delete(`/admin/schools/${schoolId}`);
  }

  // ==================== Evaluation Management ====================

  async getEvaluation(topicId: string): Promise<any> {
    return apiService.get(`/evaluations/topic/${topicId}`);
  }

  async getAllEvaluations(): Promise<any> {
    return apiService.get('/evaluations');
  }

  async saveEvaluation(data: {
    topicId: string;
    title: string;
    description: string;
    xpReward: number;
    questions: any[];
  }): Promise<any> {
    return apiService.post('/admin/content/evaluations/save', data);
  }

  async submitEvaluation(data: { userId: string, evaluationId: string, score: number, passed: boolean }) {
    return apiService.post('/evaluations/submit-mastery', data);
  }

  async deleteEvaluation(evaluationId: string): Promise<void> {
    return apiService.delete(`/evaluations/${evaluationId}`);
  }
}

// Export singleton instance
export const adminService = new AdminService();
