import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';

/**
 * @desc    Create a new school with auto-generated school code
 * @route   POST /api/admin/schools
 * @access  Private (super_admin only)
 */
export const createSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, address, region, district, contactEmail } = req.body;

    if (!name) {
      throw new AppError('School name is required', 400);
    }

    // Generate unique school code using database function
    const { data: schoolCodeResult } = await supabase.rpc('generate_school_code');
    const schoolCode = schoolCodeResult;

    // Create school
    const { data: school, error } = await supabase
      .from('schools')
      .insert({
        name,
        school_code: schoolCode,
        address: address || null,
        region: region || null,
        district: district || null,
        contact_email: contactEmail || null,
        teacher_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('School creation error:', error);
      throw new AppError('Failed to create school', 500);
    }

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: {
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.school_code,
          address: school.address,
          region: school.region,
          district: school.district,
          contactEmail: school.contact_email,
          teacherCount: school.teacher_count,
          isActive: school.is_active,
          createdAt: school.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all schools with pagination and filters
 * @route   GET /api/admin/schools
 * @access  Private (admin roles)
 */
export const getAllSchools = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      region,
      district,
      isActive,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('schools')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,school_code.ilike.%${search}%`);
    }

    if (region) {
      query = query.eq('region', region);
    }

    if (district) {
      query = query.eq('district', district);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    // For school_admin, only return their school
    if (req.user?.role === 'school_admin') {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', req.user.userId)
        .single();

      if (adminProfile?.school_id) {
        query = query.eq('id', adminProfile.school_id);
      }
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: schools, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch schools', 500);
    }

    res.status(200).json({
      success: true,
      data: {
        schools: (schools || []).map((school) => ({
          id: school.id,
          name: school.name,
          schoolCode: school.school_code,
          address: school.address,
          region: school.region,
          district: school.district,
          contactEmail: school.contact_email,
          teacherCount: school.teacher_count,
          isActive: school.is_active,
          createdAt: school.created_at,
          updatedAt: school.updated_at,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          pages: Math.ceil((count || 0) / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get school by ID
 * @route   GET /api/admin/schools/:id
 * @access  Private (admin roles)
 */
export const getSchoolById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !school) {
      throw new AppError('School not found', 404);
    }

    // Get teacher count for this school
    const { count: teacherCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', id)
      .eq('role', 'teacher');

    // Get teachers list
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, username, is_active, is_online, last_login, created_at')
      .eq('school_id', id)
      .in('role', ['teacher', 'school_admin'])
      .order('created_at', { ascending: false });

    res.status(200).json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.school_code,
          address: school.address,
          region: school.region,
          district: school.district,
          contactEmail: school.contact_email,
          teacherCount: teacherCount || 0,
          isActive: school.is_active,
          createdAt: school.created_at,
          updatedAt: school.updated_at,
        },
        teachers: (teachers || []).map((t) => ({
          id: t.id,
          firstName: t.first_name,
          lastName: t.last_name,
          email: t.email,
          username: t.username,
          isActive: t.is_active,
          isOnline: t.is_online,
          lastLogin: t.last_login,
          createdAt: t.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update school
 * @route   PUT /api/admin/schools/:id
 * @access  Private (super_admin only)
 */
export const updateSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, address, region, district, contactEmail, isActive } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (region !== undefined) updateData.region = region;
    if (district !== undefined) updateData.district = district;
    if (contactEmail !== undefined) updateData.contact_email = contactEmail;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: school, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !school) {
      throw new AppError('Failed to update school', 500);
    }

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: {
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.school_code,
          address: school.address,
          region: school.region,
          district: school.district,
          contactEmail: school.contact_email,
          teacherCount: school.teacher_count,
          isActive: school.is_active,
          createdAt: school.created_at,
          updatedAt: school.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate school (soft delete)
 * @route   DELETE /api/admin/schools/:id
 * @access  Private (super_admin only)
 */
export const deactivateSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Deactivate school
    const { error } = await supabase
      .from('schools')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to deactivate school', 500);
    }

    // Optionally deactivate all users in this school
    await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('school_id', id);

    res.status(200).json({
      success: true,
      message: 'School deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get school by school code (for login lookup)
 * @route   GET /api/admin/schools/code/:code
 * @access  Public (for login validation)
 */
export const getSchoolByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;

    const { data: school, error } = await supabase
      .from('schools')
      .select('id, name, school_code, is_active')
      .eq('school_code', code.toUpperCase())
      .single();

    if (error || !school) {
      throw new AppError('School not found', 404);
    }

    if (!school.is_active) {
      throw new AppError('School is inactive', 403);
    }

    res.status(200).json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.school_code,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
