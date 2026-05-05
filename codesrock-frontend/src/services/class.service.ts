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

export interface StudentProgress {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  xp: number;
  level: number;
  completion_percentage: number;
  last_active?: string;
  current_module?: string;
}

export interface ClassAnalytics {
  class_id: string;
  average_completion: number;
  total_xp: number;
  active_students: number;
  student_progress: StudentProgress[];
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  student?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  progress?: {
    xp: number;
    level: number;
    completion_percentage: number;
    last_active: string;
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

  /**
   * Get students in a class with optional pagination
   */
  async getClassStudents(classId: string, params?: { page?: number; limit?: number }): Promise<ClassEnrollment[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return apiService.get<ClassEnrollment[]>(`/classes/${classId}/students?${queryParams.toString()}`);
  }

  /**
   * Batch enroll students into a class
   */
  async batchEnroll(classId: string, studentIds: string[]): Promise<any> {
    return apiService.post(`/classes/${classId}/batch-enroll`, { studentIds });
  }

  /**
   * Get analytics for a specific class
   */
  async getClassAnalytics(classId: string): Promise<ClassAnalytics> {
    return apiService.get<ClassAnalytics>(`/classes/${classId}/analytics`);
  }

  /**
   * Enroll a student by email
   */
  async enrollByEmail(classId: string, email: string): Promise<ClassEnrollment> {
    return apiService.post<ClassEnrollment>(`/classes/${classId}/enroll-email`, { email });
  }

  /**
   * Manually create and enroll a student
   */
  async enrollManually(classId: string, firstName: string, lastName: string): Promise<any> {
    return apiService.post(`/classes/${classId}/manual-enroll`, { firstName, lastName });
  }

  /**
   * Get topic progress for a class
   */
  async getProgress(classId: string): Promise<{
    students: { id: string, name: string }[],
    topics: { id: string, title: string, order_index: number }[],
    progress: { student_id: string, topic_id: string }[]
  }> {
    return apiService.get<any>(`/classes/${classId}/progress`);
  }

  /**
   * Update student topic mastery
   */
  async updateProgress(classId: string, data: { studentId: string, topicId: string, completed: boolean }): Promise<any> {
    return apiService.post(`/classes/${classId}/progress`, data);
  }

  /**
   * Get student achievement report
   */
  async getStudentReport(classId: string, studentId: string): Promise<any> {
    return apiService.get<any>(`/classes/${classId}/students/${studentId}/report`);
  }
}

export const classService = new ClassService();
