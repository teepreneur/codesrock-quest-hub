import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { supabase } from '../config/supabase';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role?: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

/**
 * Middleware to check if user has required role
 * @param roles - Array of allowed roles
 */
export const requireRole = (roles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Fetch user from Supabase to get current role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.userId)
        .single();

      if (error || !profile) {
        throw new AppError('User not found', 404);
      }

      // Check if user is active
      if (!profile.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Check if user has required role
      if (!roles.includes(profile.role)) {
        throw new AppError(
          'You do not have permission to access this resource',
          403
        );
      }

      // Update user in request with full profile data
      req.user = {
        ...req.user,
        role: profile.role,
        firstName: profile.first_name,
        lastName: profile.last_name,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = requireRole([
  'school_admin',
  'content_admin',
  'super_admin',
]);

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Middleware to check if user is content admin or super admin
 */
export const requireContentAdmin = requireRole(['content_admin', 'super_admin']);

/**
 * Middleware to check if user is school admin or super admin
 */
export const requireSchoolAdmin = requireRole(['school_admin', 'super_admin']);

/**
 * Middleware to check granular permissions
 * @param resource - Resource name (e.g., 'users', 'courses')
 * @param action - Action name (e.g., 'create', 'read', 'update', 'delete')
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.userId)
        .single();

      if (error || !profile) {
        throw new AppError('User not found', 404);
      }

      // Super admin has all permissions
      if (profile.role === 'super_admin') {
        return next();
      }

      // Role-based default permissions
      const defaultPermissions: Record<string, string[]> = {
        content_admin: [
          'courses:read',
          'courses:create',
          'courses:update',
          'courses:delete',
          'resources:read',
          'resources:create',
          'resources:update',
          'resources:delete',
          'sessions:read',
          'sessions:create',
          'sessions:update',
          'sessions:delete',
        ],
        school_admin: [
          'users:read',
          'users:create',
          'users:update',
          'analytics:read',
        ],
        teacher: [
          'courses:read',
          'resources:read',
          'sessions:read',
        ],
      };

      const permissionString = `${resource}:${action}`;
      const userDefaultPermissions = defaultPermissions[profile.role] || [];

      if (userDefaultPermissions.includes(permissionString)) {
        return next();
      }

      throw new AppError(
        `You do not have permission to ${action} ${resource}`,
        403
      );
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Audit logging middleware for admin actions
 */
export const auditLog = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Log admin actions to activities table
    if (req.user && req.user.role && ['super_admin', 'school_admin', 'content_admin'].includes(req.user.role)) {
      const logData = {
        user_id: req.user.userId,
        type: 'login' as const, // Using a valid activity type
        description: `Admin action: ${req.method} ${req.originalUrl}`,
        xp_earned: 0,
        metadata: {
          action: `${req.method} ${req.originalUrl}`,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      };

      // Log to Supabase activities table
      await supabase
        .from('activities')
        .insert(logData);
    }

    next();
  } catch (error) {
    // Don't block request if audit logging fails
    console.error('[AUDIT ERROR]', error);
    next();
  }
};
