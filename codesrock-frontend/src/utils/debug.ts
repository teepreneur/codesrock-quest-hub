/**
 * Debug utilities for authentication and API testing
 */

export const debugAuth = () => {
  console.log('=== AUTH DEBUG ===');
  const userStr = localStorage.getItem('user');
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  console.log('User (raw):', userStr);
  console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');
  console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');

  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
    console.log('User (parsed):', user);
    console.log('User ID:', user?.id || user?._id);
    console.log('User Email:', user?.email);
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  return { user, token: accessToken };
};

export const testDashboardAPI = async () => {
  const { user, token } = debugAuth();

  const userId = user?.id || user?._id;

  if (!userId || !token) {
    console.error('Missing user ID or token');
    console.log('User ID:', userId);
    console.log('Token exists:', !!token);
    return null;
  }

  console.log('\n=== TESTING DASHBOARD API ===');
  console.log('Calling:', `http://localhost:5001/api/dashboard/${userId}`);

  try {
    const response = await fetch(`http://localhost:5001/api/dashboard/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Dashboard API Response:', data);
    return data;
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return null;
  }
};

export const testGamificationAPI = async () => {
  const { token } = debugAuth();

  if (!token) {
    console.error('No token available');
    return null;
  }

  console.log('\n=== TESTING GAMIFICATION API ===');
  console.log('Calling:', 'http://localhost:5001/api/gamification/progress');

  try {
    const response = await fetch('http://localhost:5001/api/gamification/progress', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Gamification API Response:', data);
    return data;
  } catch (error) {
    console.error('Gamification API Error:', error);
    return null;
  }
};

export const clearAuthData = () => {
  console.log('Clearing all auth data...');
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  console.log('Auth data cleared');
};

// Make debug functions available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugAuth = debugAuth;
  (window as any).testDashboardAPI = testDashboardAPI;
  (window as any).testGamificationAPI = testGamificationAPI;
  (window as any).clearAuthData = clearAuthData;
  console.log('Debug functions available: debugAuth(), testDashboardAPI(), testGamificationAPI(), clearAuthData()');
}
