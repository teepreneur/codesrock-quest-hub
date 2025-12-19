import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';

/**
 * @desc    Get all courses with stats
 * @route   GET /api/admin/content/courses
 * @access  Private/ContentAdmin
 */
export const getAllCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, category, search, showInactive } = req.query;

    let query = supabase.from('courses').select('*', { count: 'exact' });

    // Only show active courses by default (deleted courses have is_active: false)
    if (showInactive !== 'true') {
      query = query.eq('is_active', true);
    }

    if (category) query = query.eq('category', category);
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const { data: courses, error, count } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + Number(limit) - 1);

    if (error) {
      throw error;
    }

    // Get completion stats for each course
    const coursesWithStats = await Promise.all(
      (courses || []).map(async (course) => {
        const [
          { count: totalViews },
          { count: completions },
        ] = await Promise.all([
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('completed', true),
        ]);

        return {
          ...course,
          stats: {
            totalViews: totalViews || 0,
            completions: completions || 0,
            completionRate: totalViews && totalViews > 0 ? ((completions || 0) / totalViews) * 100 : 0,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        courses: coursesWithStats,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil((count || 0) / Number(limit)),
          totalCourses: count || 0,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new course
 * @route   POST /api/admin/content/courses
 * @access  Private/ContentAdmin
 */
export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      videoUrl,
      thumbnail,
      duration,
      difficulty,
      xpReward,
    } = req.body;

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        category,
        video_url: videoUrl,
        thumbnail: thumbnail || 'https://via.placeholder.com/400x225?text=Course+Thumbnail',
        duration: duration || 0,
        difficulty: difficulty || 'Beginner',
        xp_reward: xpReward || 100,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/admin/content/courses/:id
 * @access  Private/ContentAdmin
 */
export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      videoUrl,
      thumbnail,
      duration,
      difficulty,
      xpReward,
      isActive,
    } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (videoUrl) updateData.video_url = videoUrl;
    if (thumbnail) updateData.thumbnail = thumbnail;
    if (duration !== undefined) updateData.duration = duration;
    if (difficulty) updateData.difficulty = difficulty;
    if (xpReward !== undefined) updateData.xp_reward = xpReward;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/admin/content/courses/:id
 * @access  Private/ContentAdmin
 */
export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resources
 * @route   GET /api/admin/content/resources
 * @access  Private/ContentAdmin
 */
export const getAllResources = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, fileType, search } = req.query;

    let query = supabase.from('resources').select('*', { count: 'exact' });

    if (fileType) query = query.eq('file_type', fileType);
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const { data: resources, error, count } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + Number(limit) - 1);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        resources: resources || [],
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil((count || 0) / Number(limit)),
          totalResources: count || 0,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new resource
 * @route   POST /api/admin/content/resources
 * @access  Private/ContentAdmin
 */
export const createResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      fileType,
      fileUrl,
      category,
      gradeLevel,
      subject,
    } = req.body;

    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        title,
        description,
        file_type: fileType || 'PDF',
        file_url: fileUrl,
        category,
        grade_level: gradeLevel || 'All',
        subject: subject || 'General',
        file_size: 0,
        xp_reward: 10,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update resource
 * @route   PUT /api/admin/content/resources/:id
 * @access  Private/ContentAdmin
 */
export const updateResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      fileType,
      fileUrl,
      category,
      gradeLevel,
      subject,
    } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (fileType) updateData.file_type = fileType;
    if (fileUrl) updateData.file_url = fileUrl;
    if (category) updateData.category = category;
    if (gradeLevel) updateData.grade_level = gradeLevel;
    if (subject) updateData.subject = subject;

    const { data: resource, error } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete resource
 * @route   DELETE /api/admin/content/resources/:id
 * @access  Private/ContentAdmin
 */
export const deleteResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('resources')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get content statistics
 * @route   GET /api/admin/content/stats
 * @access  Private/ContentAdmin
 */
export const getContentStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      { count: totalCourses },
      { count: totalResources },
      { count: activeCourses },
      { count: totalViews },
    ] = await Promise.all([
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('resources').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('video_progress').select('*', { count: 'exact', head: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses: totalCourses || 0,
        totalResources: totalResources || 0,
        activeCourses: activeCourses || 0,
        totalViews: totalViews || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
