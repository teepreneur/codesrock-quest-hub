import { apiService } from './api.service';

export interface Class {
  id: string;
  name: string;
  teacher_id: string;
  course_id?: string;
  school_id?: string;
  created_at: string;
  updated_at: string;
  studentCount: number;
  courses?: {
    title: string;
    thumbnail?: string;
  };
  schools?: {
    name: string;
  };
}

class ClassService {
  /**
   * Get all classes for a teacher with optional pagination
   */
  async getTeacherClasses(teacherId: string, params?: { page?: number; limit?: number }): Promise<Class[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return apiService.get<Class[]>(`/classes?teacherId=${teacherId}&${queryParams.toString()}`);
  }

  /**
   * Create a new class
   */
  async createClass(data: {
    name: string;
    teacherId: string;
    courseId?: string;
    schoolId?: string;
  }): Promise<Class> {
    return apiService.post<Class>('/classes', data);
  }
}

export const classService = new ClassService();
