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
}

class ClassService {
  /**
   * Get all classes for a teacher
   */
  async getTeacherClasses(teacherId: string): Promise<Class[]> {
    return apiService.get<Class[]>(`/classes?teacherId=${teacherId}`);
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
   * Get students in a class
   */
  async getClassStudents(classId: string): Promise<ClassEnrollment[]> {
    return apiService.get<ClassEnrollment[]>(`/classes/${classId}/students`);
  }

  /**
   * Batch enroll students into a class
   */
  async batchEnroll(classId: string, studentIds: string[]): Promise<any> {
    return apiService.post(`/classes/${classId}/batch-enroll`, { studentIds });
  }

  /**
   * Enroll a student by email
   */
  async enrollByEmail(classId: string, email: string): Promise<ClassEnrollment> {
    return apiService.post<ClassEnrollment>(`/classes/${classId}/enroll-email`, { email });
  }
}

export const classService = new ClassService();
