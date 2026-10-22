import { Request, Response, NextFunction } from 'express';
import { supabase, createAuthClient } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // `role` is deliberately ignored: public sign-up always creates a teacher.
    // Admin and student accounts are created through the admin portal.
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Please provide all required fields', 400);
    }

    // Create auth user with Supabase
    const { data: authData, error: authError } = await createAuthClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (authError) {
      throw new AppError(authError.message, 400);
    }

    if (!authData.user) {
      throw new AppError('Failed to create user', 500);
    }

    // Get the created profile (created by the handle_new_user trigger)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to confirm your account.',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
          role: profile?.role || 'teacher',
          isActive: profile?.is_active,
        },
        session: authData.session,
        accessToken: authData.session?.access_token,
        refreshToken: authData.session?.refresh_token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Authenticate with Supabase
    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!data.user || !data.session) {
      throw new AppError('Authentication failed', 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new AppError('User profile not found', 404);
    }

    // Check if user is active
    if (!profile.is_active) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // Update last login
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    // Update streak
    const { data: streakData } = await supabase.rpc('update_streak', {
      p_user_id: data.user.id
    });

    // Get user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          isActive: profile.is_active,
          lastLogin: profile.last_login,
          progress: progress,
          streak: streakData?.streak,
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login with school code, username, and password
 * @route   POST /api/auth/login-school
 * @access  Public
 */
export const loginWithSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { schoolCode, username, password } = req.body;

    if (!schoolCode || !username || !password) {
      throw new AppError('School ID, username, and password are required', 400);
    }

    // Find school by school_code
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name, school_code, is_active')
      .eq('school_code', schoolCode.toUpperCase())
      .single();

    if (schoolError || !school) {
      throw new AppError('Invalid School ID. Please verify the school code provided by your administrator.', 401);
    }

    if (!school.is_active) {
      throw new AppError('This school account is currently inactive. Please contact support.', 403);
    }

    // Find profile by username and school_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('school_id', school.id)
      .single();

    if (profileError || !profile) {
      throw new AppError('Username not found under this School ID. Please check your username.', 401);
    }

    // Check if user is active
    if (!profile.is_active) {
      throw new AppError('Your account has been deactivated. Please contact your school administrator.', 403);
    }

    // Authenticate with Supabase using the profile's email
    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error) {
      throw new AppError('Incorrect password. Please check your password and try again.', 401);
    }

    if (!data.user || !data.session) {
      throw new AppError('Authentication failed. Please try again.', 401);
    }

    // Update last_login and is_online
    await supabase
      .from('profiles')
      .update({
        last_login: new Date().toISOString(),
        is_online: true
      })
      .eq('id', profile.id);

    // Update streak
    const { data: streakData } = await supabase.rpc('update_streak', {
      p_user_id: profile.id
    });

    // Get user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          schoolId: profile.school_id,
          schoolCode: school.school_code,
          schoolName: school.name,
          isActive: profile.is_active,
          isOnline: true,
          lastLogin: new Date().toISOString(),
          progress: progress,
          streak: streakData?.streak,
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Refresh session with Supabase
    const { data, error } = await createAuthClient().auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      throw new AppError('Invalid refresh token', 401);
    }

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // This route is public so an expired token can still log out; identify
    // the user from the bearer token when one is provided.
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        await supabase
          .from('profiles')
          .update({ is_online: false })
          .eq('id', user.id);

        // Revoke this session's refresh token
        await supabase.auth.admin.signOut(token);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not found', 401);
    }

    // Get full profile with progress
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_progress (*)
      `)
      .eq('id', req.user.userId)
      .single();

    if (profileError || !profile) {
      throw new AppError('User not found', 404);
    }

    // Get user badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          isActive: profile.is_active,
          lastLogin: profile.last_login,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          progress: profile.user_progress?.[0] || null,
          badges: badges || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not found', 401);
    }

    const { firstName, lastName } = req.body;

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
      })
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update profile', 500);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          isActive: profile.is_active,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not found', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400);
    }

    // Verify the current password on a throwaway client
    const { error: verifyError } = await createAuthClient().auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update the password of the authenticated user only
    const { error } = await supabase.auth.admin.updateUserById(req.user.userId, {
      password: newPassword,
    });

    if (error) {
      throw new AppError(error.message, 400);
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
