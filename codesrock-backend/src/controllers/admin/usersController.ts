import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';
import crypto from 'crypto';

/**
 * Generate a secure random password
 */
const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%&*';

  // Ensure at least one of each required character type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters from all sets
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * @desc    Get all users with pagination and filters
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      schoolId,
      isActive,
      search,
    } = req.query;

    let query = supabase.from('profiles').select('*, schools(name, school_code)', { count: 'exact' });

    // For school_admin, only show users from their school
    if (req.user?.role === 'school_admin') {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', req.user.userId)
        .single();

      if (adminProfile?.school_id) {
        query = query.eq('school_id', adminProfile.school_id);
      }
    }

    // Apply filters
    if (role) query = query.eq('role', role);
    if (schoolId) query = query.eq('school_id', schoolId);
    if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},username.ilike.${searchTerm}`);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + Number(limit) - 1);

    if (error) {
      throw error;
    }

    // Format users with proper field names
    const formattedUsers = (users || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      schoolId: user.school_id,
      schoolName: user.schools?.name || null,
      schoolCode: user.schools?.school_code || null,
      isActive: user.is_active,
      isOnline: user.is_online,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil((count || 0) / Number(limit)),
          totalUsers: count || 0,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user details
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*, schools(name, address, region, district)')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get user progress data
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    res.status(200).json({
      success: true,
      data: {
        user,
        progress,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new user with auto-generated credentials
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, role, schoolId } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      res.status(400).json({ success: false, message: 'First name and last name are required' });
      return;
    }

    if (!schoolId) {
      res.status(400).json({ success: false, message: 'School ID is required' });
      return;
    }

    // Get school info for the school code
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_code, name')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      res.status(404).json({ success: false, message: 'School not found' });
      return;
    }

    // Generate username using the database function
    const { data: generatedUsername, error: usernameError } = await supabase.rpc('generate_username', {
      p_first_name: firstName,
      p_last_name: lastName,
      p_school_id: schoolId,
    });

    if (usernameError) {
      console.error('Username generation error:', usernameError);
      res.status(500).json({ success: false, message: 'Failed to generate username' });
      return;
    }

    const username = generatedUsername;

    // Generate secure password
    const generatedPassword = generateSecurePassword(12);

    // Generate internal email (used for Supabase auth)
    const internalEmail = `${username}@${school.school_code.toLowerCase()}.codesrock.local`;

    // Create auth user using Supabase Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: internalEmail,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role || 'teacher',
        username: username,
        school_id: schoolId,
      },
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      res.status(500).json({ success: false, message: 'Failed to create user account' });
      return;
    }

    // The database trigger (handle_new_user) automatically creates a profile and user_progress
    // when an auth user is created. We need to UPDATE the profile with additional fields.
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update the profile created by the trigger with additional fields
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        email: internalEmail,
        username: username,
        first_name: firstName,
        last_name: lastName,
        role: role || 'teacher',
        school_id: schoolId,
        is_active: true,
        is_online: false,
      })
      .eq('id', authUser.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Try to clean up auth user if profile update fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      res.status(500).json({ success: false, message: 'Failed to update user profile' });
      return;
    }

    // Update user progress with proper initial values (trigger creates with defaults)
    await supabase.from('user_progress')
      .update({
        current_xp: 0,
        total_xp: 0,
        current_level: 1,
        level_name: 'Beginner',
        streak: 0,
      })
      .eq('user_id', authUser.user.id);

    // Update school teacher count
    const { data: currentSchool } = await supabase
      .from('schools')
      .select('teacher_count')
      .eq('id', schoolId)
      .single();

    if (currentSchool) {
      await supabase
        .from('schools')
        .update({ teacher_count: (currentSchool.teacher_count || 0) + 1 })
        .eq('id', schoolId);
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          username: profile.username,
          role: profile.role,
          schoolId: profile.school_id,
          isActive: profile.is_active,
          createdAt: profile.created_at,
        },
        credentials: {
          schoolCode: school.school_code,
          schoolName: school.name,
          username: username,
          password: generatedPassword,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, role, schoolId, isActive, permissions } = req.body;

    const updateData: any = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (role) updateData.role = role;
    if (schoolId !== undefined) updateData.school_id = schoolId || null;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (permissions) updateData.permissions = permissions;

    const { data: user, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Deactivate user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Soft delete - just deactivate
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset user password (generates new secure password)
 * @route   POST /api/admin/users/:id/reset-password
 * @access  Private/Admin
 */
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user info with school
    const { data: user } = await supabase
      .from('profiles')
      .select('*, schools(school_code, name)')
      .eq('id', req.params.id)
      .single();

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Generate new secure password
    const newPassword = generateSecurePassword(12);

    // Use Supabase Admin API to update user password
    const { error } = await supabase.auth.admin.updateUserById(
      req.params.id,
      { password: newPassword }
    );

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        credentials: {
          schoolCode: user.schools?.school_code || null,
          schoolName: user.schools?.name || null,
          username: user.username,
          password: newPassword,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/admin/users/stats
 * @access  Private/Admin
 */
export const getUserStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: teacherCount },
      { count: adminCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin', 'school_admin', 'content_admin', 'super_admin']),
    ]);

    // Get active today (last login in last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { count: activeToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', yesterday.toISOString())
      .eq('is_active', true);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        teacherCount: teacherCount || 0,
        adminCount: adminCount || 0,
        activeToday: activeToday || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
