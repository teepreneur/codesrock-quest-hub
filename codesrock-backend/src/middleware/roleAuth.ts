import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { supabase } from '../config/supabase';
import { getClientIp } from './rateLimit';
import '../types/express';

/**
 * Middleware to check if user has required role.
 * IMPORTANT: This must run AFTER the `protect` middleware, which attaches
 * req.user with role data from the profiles table. This avoids a redundant
 * database query.
 * @param roles - Array of allowed roles
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Role is already populated by the `protect` middleware
      if (!req.user.role || !roles.includes(req.user.role)) {
        throw new AppError(
          'You do not have permission to access this resource',
          403
        );
      }

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

const ADMIN_ROLES = ['school_admin', 'content_admin', 'super_admin'];

/**
 * Guards user-management actions on /api/admin/users.
 * - super_admin: unrestricted
 * - school_admin: only teachers/students in their own school, and may only
 *   assign the teacher or student role or their own school
 * - anyone else (e.g. content_admin): read-only, so writes are rejected
 * IMPORTANT: must run AFTER `protect`.
 */
export const guardUserManagement = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = req.user?.role;

    if (role === 'super_admin') {
      return next();
    }

    if (role !== 'school_admin') {
      throw new AppError('You do not have permission to manage users', 403);
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', req.user!.userId)
      .single();

    const adminSchoolId = adminProfile?.school_id;
    if (!adminSchoolId) {
      throw new AppError('Your account is not linked to a school', 403);
    }

    const requestedRole = req.body?.role;
    if (requestedRole && !['teacher', 'student'].includes(requestedRole)) {
      throw new AppError('Only a super admin can assign admin roles', 403);
    }

    const requestedSchoolId = req.body?.schoolId;
    if (requestedSchoolId && requestedSchoolId !== adminSchoolId) {
      throw new AppError('You can only manage users in your own school', 403);
    }

    const targetUserId = req.params.id;
    if (targetUserId) {
      const { data: target } = await supabase
        .from('profiles')
        .select('school_id, role')
        .eq('id', targetUserId)
        .single();

      if (!target) {
        throw new AppError('User not found', 404);
      }

      if (target.school_id !== adminSchoolId || ADMIN_ROLES.includes(target.role)) {
        throw new AppError('You can only manage teachers and students in your own school', 403);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check granular permissions.
 * IMPORTANT: This must run AFTER the `protect` middleware, which attaches
 * req.user with role data from the profiles table.
 * @param resource - Resource name (e.g., 'users', 'courses')
 * @param action - Action name (e.g., 'create', 'read', 'update', 'delete')
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const userRole = req.user.role;

      // Super admin has all permissions
      if (userRole === 'super_admin') {
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
      const userDefaultPermissions = defaultPermissions[userRole || ''] || [];

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
          ip: getClientIp(req),
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
