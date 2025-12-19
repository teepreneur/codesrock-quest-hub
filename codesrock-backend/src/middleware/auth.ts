import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from './errorHandler';

// Extend Express Request type to include user
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
 * Protect routes - Verify Supabase authentication
 */
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      throw new AppError('Not authorized to access this route', 401);
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Not authorized to access this route', 401);
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new AppError('User profile not found', 404);
    }

    // Check if user is active
    if (!profile.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: profile.email,
      role: profile.role,
      firstName: profile.first_name,
      lastName: profile.last_name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Not authorized to access this route', 401);
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to access this resource',
        403
      );
    }

    next();
  };
};
