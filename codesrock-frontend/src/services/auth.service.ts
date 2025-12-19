/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'admin' | 'student' | 'school_admin' | 'content_admin' | 'super_admin';
  schoolId?: string;
  schoolCode?: string;
  schoolName?: string;
  isActive: boolean;
  isOnline?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SchoolLoginCredentials {
  schoolCode: string;
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'teacher' | 'admin' | 'student' | 'school_admin' | 'content_admin' | 'super_admin';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  /**
   * Login user with email
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    // Store tokens and user data
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    console.log('Login successful - stored user:', response.user);

    return response;
  }

  /**
   * Login user with school credentials (School ID + Username + Password)
   */
  async loginWithSchool(credentials: SchoolLoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN_SCHOOL,
      credentials,
      { requiresAuth: false }
    );

    // Store tokens and user data
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Also store school info
    if (response.user.schoolCode) {
      localStorage.setItem('schoolCode', response.user.schoolCode);
    }

    console.log('School login successful - stored user:', response.user);

    return response;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      data,
      { requiresAuth: false }
    );

    // Store tokens and user data
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      await apiService.post(
        API_CONFIG.ENDPOINTS.AUTH.LOGOUT,
        { refreshToken },
        { requiresAuth: false }
      );
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<{ user: User }> {
    return apiService.get<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.ME);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<{ user: User }> {
    return apiService.put<{ user: User }>(
      API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE,
      data
    );
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    return apiService.put(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Get stored user token
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get stored user data from localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing stored user:', e);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
