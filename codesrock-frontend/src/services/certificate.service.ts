import { apiService } from './api.service';

export interface CertificateBadge {
  name: string;
  description: string;
  icon?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  type: 'course' | 'level' | 'program';
  certificateId: string;
  dateEarned: string;
  schoolName?: string;
  citation?: string;
  questsExplored?: string[];
  badges?: CertificateBadge[];
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

  /**
   * Download certificate PDF directly from backend API
   */
  async downloadBackendPDF(certificateId: string): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/certificates/${certificateId}/pdf`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download backend PDF');
    }

    return response.blob();
  }
}

export const certificateService = new CertificateService();

