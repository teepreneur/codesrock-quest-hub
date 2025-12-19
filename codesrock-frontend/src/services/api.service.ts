/**
 * Base API Service
 * Handles all HTTP requests with automatic token management and error handling
 */

import { API_CONFIG, getApiUrl, getAuthHeader } from '../config/api.config';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base API client with automatic token refresh
 */
class ApiService {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  /**
   * Subscribe to token refresh
   */
  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers when token is refreshed
   */
  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Refresh access token
   */
  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new ApiError('No refresh token available', 401);
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new ApiError('Failed to refresh token', 401);
    }

    const data = await response.json();
    const newAccessToken = data.data.accessToken;

    localStorage.setItem('accessToken', newAccessToken);
    return newAccessToken;
  }

  /**
   * Make HTTP request with automatic error handling and token refresh
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const url = getApiUrl(endpoint);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add auth header if required
    if (requiresAuth) {
      const authHeader = getAuthHeader();
      Object.assign(headers, authHeader);
    }

    try {
      let response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle 401 - try to refresh token
      if (response.status === 401 && requiresAuth) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.isRefreshing = false;
            this.onTokenRefreshed(newToken);

            // Retry original request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, {
              ...fetchOptions,
              headers,
            });
          } catch (refreshError) {
            this.isRefreshing = false;
            throw refreshError;
          }
        } else {
          // Wait for token refresh to complete
          const newToken = await new Promise<string>((resolve) => {
            this.subscribeTokenRefresh(resolve);
          });

          // Retry with new token
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...fetchOptions,
            headers,
          });
        }
      }

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'Request failed',
          response.status,
          data
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
