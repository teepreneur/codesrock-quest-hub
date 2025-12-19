/**
 * Resource Service
 * Handles all resource-related API calls
 */

import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface Resource {
  _id: string;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  gradeLevel: string;
  subject: string;
  tags: string[];
  xpReward: number;
  downloadCount: number;
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceInteraction {
  _id: string;
  userId: string;
  resourceId: string;
  type: 'download';
  xpAwarded: boolean;
  timestamp: string;
}

export interface DownloadResponse {
  success: boolean;
  data: {
    resource: Resource;
    interaction: ResourceInteraction;
    xpAwarded: boolean;
    xpReward?: number;
  };
}

class ResourceService {
  /**
   * Get all resources with optional filters
   */
  async getResources(filters?: {
    category?: string;
    gradeLevel?: string;
    fileType?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<Resource[]> {
    let endpoint = API_CONFIG.ENDPOINTS.RESOURCES.BASE;

    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
    if (filters?.fileType) params.append('fileType', filters.fileType);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    return apiService.get<Resource[]>(endpoint);
  }

  /**
   * Get popular resources
   */
  async getPopularResources(): Promise<Resource[]> {
    return apiService.get<Resource[]>('/resources/popular');
  }

  /**
   * Get resource by ID
   */
  async getResourceById(id: string): Promise<Resource> {
    return apiService.get<Resource>(`/resources/${id}`);
  }

  /**
   * Download resource and earn XP
   */
  async downloadResource(userId: string, resourceId: string): Promise<DownloadResponse> {
    return apiService.post<DownloadResponse>('/resources/download', {
      userId,
      resourceId,
    });
  }

  /**
   * Rate a resource
   */
  async rateResource(
    userId: string,
    resourceId: string,
    rating: number,
    review?: string
  ): Promise<void> {
    return apiService.post('/resources/rate', {
      userId,
      resourceId,
      rating,
      review,
    });
  }

  /**
   * Get user's download history
   */
  async getUserDownloads(userId: string): Promise<ResourceInteraction[]> {
    return apiService.get<ResourceInteraction[]>(`/resources/downloads/${userId}`);
  }
}

// Export singleton instance
export const resourceService = new ResourceService();
