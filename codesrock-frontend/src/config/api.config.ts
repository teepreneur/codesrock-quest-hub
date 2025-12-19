/**
 * API Configuration
 * Central configuration for all API endpoints
 */

export const API_CONFIG = {
  // Base URL for the backend API
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001',

  // API version
  API_VERSION: '/api',

  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,

  // Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/auth/login',
      LOGIN_SCHOOL: '/auth/login-school',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      ME: '/auth/me',
      UPDATE_PROFILE: '/auth/profile',
      CHANGE_PASSWORD: '/auth/change-password',
    },

    // User endpoints
    USERS: {
      BASE: '/users',
      BY_ID: (id: string) => `/users/${id}`,
    },

    // Gamification endpoints
    GAMIFICATION: {
      PROGRESS: '/gamification/progress',
      BADGES: '/gamification/badges',
      ACTIVITIES: '/gamification/activities',
      LEADERBOARD: '/gamification/leaderboard',
    },

    // Course endpoints
    COURSES: {
      BASE: '/courses',
      BY_ID: (id: string) => `/courses/${id}`,
      COMPLETE: (id: string) => `/courses/${id}/complete`,
      TRACK_PROGRESS: (id: string) => `/courses/${id}/progress`,
    },

    // Resource endpoints
    RESOURCES: {
      BASE: '/resources',
      BY_ID: (id: string) => `/resources/${id}`,
      DOWNLOAD: (id: string) => `/resources/${id}/download`,
      TRACK_INTERACTION: (id: string) => `/resources/${id}/interaction`,
    },

    // Evaluation endpoints
    EVALUATIONS: {
      BASE: '/evaluations',
      BY_ID: (id: string) => `/evaluations/${id}`,
      SUBMIT: (id: string) => `/evaluations/${id}/submit`,
      USER_EVALUATIONS: '/evaluations/user',
    },

    // Training session endpoints
    TRAINING: {
      BASE: '/training-sessions',
      BY_ID: (id: string) => `/training-sessions/${id}`,
      REGISTER: (id: string) => `/training-sessions/${id}/register`,
      UNREGISTER: (id: string) => `/training-sessions/${id}/unregister`,
      UPCOMING: '/training-sessions/upcoming',
    },

    // Dashboard endpoints
    DASHBOARD: {
      USER: (userId: string) => `/dashboard/${userId}`,
      ADMIN_STATS: '/dashboard/admin/stats',
    },
  },
} as const;

/**
 * Helper function to construct full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}${endpoint}`;
};

/**
 * Helper function to get auth header with token
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
