import { Navigate } from 'react-router-dom';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  // Get user from localStorage
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    // Check if user has admin role
    const adminRoles = ['admin', 'school_admin', 'content_admin', 'super_admin'];
    const isAdmin = user && user.role && adminRoles.includes(user.role);

    if (!isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return <Navigate to="/login" replace />;
  }
}
