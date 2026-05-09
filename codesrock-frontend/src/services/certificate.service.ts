import { apiService } from './api.service';

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  type: 'course' | 'level' | 'program';
  certificateId: string;
  dateEarned: string;
  courses?: {
    title: string;
    thumbnail: string;
    category: string;
  };
}

class CertificateService {
  /**
   * Get all certificates for a user
   */
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return apiService.get<Certificate[]>(`/certificates/${userId}`);
  }

  /**
   * Get certificate details by ID
   */
  async getCertificateById(id: string): Promise<Certificate> {
    return apiService.get<Certificate>(`/certificates/detail/${id}`);
  }
}

export const certificateService = new CertificateService();
