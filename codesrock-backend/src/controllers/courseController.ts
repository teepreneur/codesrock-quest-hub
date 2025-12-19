import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Get all courses with user progress
 * GET /api/courses
 */
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, difficulty, userId } = req.query;

    // Build query
    let query = supabase
      .from('courses')
      .select('*')
      .eq('is_active', true);

    if (category) query = query.eq('category', category);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data: courses, error } = await query.order('category').order('order_index');

    if (error) {
      console.error('Error getting courses:', error);
      res.status(500).json({ success: false, message: 'Failed to get courses', error: error.message });
      return;
    }

    // If userId provided, get user's progress for these courses
    let coursesWithProgress: any = courses;
    if (userId && courses) {
      const courseIds = courses.map((c) => c.id);
      const { data: progressRecords } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId as string)
        .in('course_id', courseIds);

      const progressMap = new Map(
        progressRecords?.map((p) => [p.course_id, p]) || []
      );

      coursesWithProgress = courses.map((course) => {
        const progress = progressMap.get(course.id);
        return {
          ...course,
          userProgress: progress
            ? {
                completed: progress.completed,
                progressPercentage: progress.watch_percentage || 0,
              }
            : null,
        };
      });
    }

    res.status(200).json({
      success: true,
      count: coursesWithProgress?.length || 0,
      data: coursesWithProgress || [],
    });
  } catch (error: any) {
    console.error('Error getting courses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get course by ID with prerequisite check
 * GET /api/courses/:courseId
 */
export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { userId } = req.query;

    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error || !course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Check prerequisites if userId provided
    let prerequisitesMet = true;
    let missingPrerequisites: any[] = [];

    if (userId && course.prerequisites && course.prerequisites.length > 0) {
      const { data: completedCourses } = await supabase
        .from('video_progress')
        .select('course_id')
        .eq('user_id', userId as string)
        .in('course_id', course.prerequisites)
        .eq('completed', true);

      const completedIds = new Set(completedCourses?.map((c) => c.course_id) || []);

      // Get prerequisite course details
      const { data: prereqCourses } = await supabase
        .from('courses')
        .select('id, title, thumbnail')
        .in('id', course.prerequisites);

      missingPrerequisites = (prereqCourses || []).filter(
        (prereq) => !completedIds.has(prereq.id)
      );

      prerequisitesMet = missingPrerequisites.length === 0;
    }

    // Get user progress if userId provided
    let userProgress = null;
    if (userId) {
      const { data: progress } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId as string)
        .eq('course_id', courseId)
        .single();

      if (progress) {
        userProgress = {
          completed: progress.completed,
          progressPercentage: progress.watch_percentage || 0,
          lastWatchedAt: progress.last_watched_at,
        };
      }
    }

    // Increment view count
    await supabase
      .from('courses')
      .update({ view_count: (course.view_count || 0) + 1 })
      .eq('id', courseId);

    res.status(200).json({
      success: true,
      data: {
        course,
        userProgress,
        prerequisitesMet,
        missingPrerequisites,
      },
    });
  } catch (error: any) {
    console.error('Error getting course:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get courses by category
 * GET /api/courses/category/:category
 */
export const getCoursesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { userId } = req.query;

    const validCategories = ['HTML/CSS', 'JavaScript', 'Computer Science', 'Coding'];
    if (!validCategories.includes(category)) {
      res.status(400).json({ success: false, message: 'Invalid category' });
      return;
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error getting courses by category:', error);
      res.status(500).json({ success: false, message: 'Failed to get courses', error: error.message });
      return;
    }

    // Get user progress if userId provided
    let coursesWithProgress: any = courses;
    if (userId && courses) {
      const courseIds = courses.map((c) => c.id);
      const { data: progressRecords } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId as string)
        .in('course_id', courseIds);

      const progressMap = new Map(
        progressRecords?.map((p) => [p.course_id, p]) || []
      );

      coursesWithProgress = courses.map((course) => {
        const progress = progressMap.get(course.id);
        return {
          ...course,
          userProgress: progress
            ? {
                completed: progress.completed,
                progressPercentage: progress.watch_percentage || 0,
              }
            : null,
        };
      });
    }

    res.status(200).json({
      success: true,
      category,
      count: coursesWithProgress?.length || 0,
      data: coursesWithProgress || [],
    });
  } catch (error: any) {
    console.error('Error getting courses by category:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update video progress (awards XP at 80% completion)
 * POST /api/courses/progress
 */
export const updateVideoProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, courseId, watchedSeconds, totalSeconds } = req.body;

    // Validation
    if (!userId || !courseId || watchedSeconds === undefined || !totalSeconds) {
      res.status(400).json({
        success: false,
        message: 'User ID, course ID, watched seconds, and total seconds are required',
      });
      return;
    }

    // Calculate progress percentage
    const progressPercentage = totalSeconds > 0 ? Math.round((watchedSeconds / totalSeconds) * 100) : 0;

    // Find or create video progress
    const { data: existingProgress } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    let progress = existingProgress;

    if (!progress) {
      // Create new progress record
      const { data: newProgress, error: createError } = await supabase
        .from('video_progress')
        .insert({
          user_id: userId,
          course_id: courseId,
          watch_percentage: progressPercentage,
          completed: false,
          xp_awarded: false,
          last_watched_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating video progress:', createError);
        res.status(500).json({ success: false, message: 'Failed to create progress' });
        return;
      }

      progress = newProgress;

      // Create activity for starting course
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

      if (course) {
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'course_started',
          description: `Started watching: ${course.title}`,
          xp_earned: 0,
          metadata: { courseId, courseTitle: course.title },
        });
      }
    }

    // Update progress
    const wasCompleted = progress.completed;
    const isNowCompleted = !wasCompleted && progressPercentage >= 80;

    const updateData: any = {
      watch_percentage: progressPercentage,
      last_watched_at: new Date().toISOString(),
    };

    if (isNowCompleted) {
      updateData.completed = true;
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedProgress, error: updateError } = await supabase
      .from('video_progress')
      .update(updateData)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating progress:', updateError);
      res.status(500).json({ success: false, message: 'Failed to update progress' });
      return;
    }

    progress = updatedProgress;

    // Award XP if just completed and not already awarded
    if (isNowCompleted && !progress.xp_awarded) {
      const { data: course } = await supabase
        .from('courses')
        .select('title, xp_reward')
        .eq('id', courseId)
        .single();

      if (course) {
        // Use the complete_course function
        const { error: completeError } = await supabase.rpc('complete_course', {
          p_user_id: userId,
          p_course_id: courseId,
        });

        if (!completeError) {
          // Mark XP as awarded
          await supabase
            .from('video_progress')
            .update({ xp_awarded: true })
            .eq('user_id', userId)
            .eq('course_id', courseId);

          // Increment course completion count
          await supabase.rpc('increment', {
            table_name: 'courses',
            column_name: 'completion_count',
            row_id: courseId,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: isNowCompleted
        ? 'Course completed! XP awarded.'
        : 'Progress updated successfully',
      data: {
        progress: {
          completed: progress.completed,
          progressPercentage: progress.watch_percentage,
          xpAwarded: progress.xp_awarded,
        },
        justCompleted: isNowCompleted,
      },
    });
  } catch (error: any) {
    console.error('Error updating video progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get recommended courses based on user history
 * GET /api/courses/recommended/:userId
 */
export const getRecommendedCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get user's completed courses
    const { data: completedProgress } = await supabase
      .from('video_progress')
      .select('course_id, courses(category)')
      .eq('user_id', userId)
      .eq('completed', true);

    // Extract categories from completed courses
    const categories = completedProgress
      ? [...new Set(completedProgress.map((p: any) => p.courses?.category).filter(Boolean))]
      : ['HTML/CSS', 'JavaScript'];

    const completedIds = completedProgress?.map((p: any) => p.course_id) || [];

    // Get in-progress course IDs
    const { data: inProgressRecords } = await supabase
      .from('video_progress')
      .select('course_id')
      .eq('user_id', userId)
      .eq('completed', false);

    const inProgressIds = inProgressRecords?.map((r) => r.course_id) || [];

    // Find recommended courses
    let query = supabase
      .from('courses')
      .select('id, title, thumbnail, category, difficulty, xp_reward')
      .eq('is_active', true)
      .in('category', categories.length > 0 ? categories : ['HTML/CSS', 'JavaScript'])
      .order('average_rating', { ascending: false })
      .order('completion_count', { ascending: false })
      .limit(limit * 2); // Get more to filter out completed/in-progress

    const { data: allRecommendations } = await query;

    // Filter out completed and in-progress courses
    const recommendations = (allRecommendations || [])
      .filter((c) => !completedIds.includes(c.id) && !inProgressIds.includes(c.id))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error getting recommended courses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add bookmark to video
 * POST /api/courses/bookmark
 */
export const bookmarkMoment = async (_req: Request, res: Response): Promise<void> => {
  // Bookmark feature is not currently supported by the database schema
  res.status(501).json({
    success: false,
    message: 'Bookmark feature is not currently available',
  });
};

/**
 * Get user's course progress summary
 * GET /api/courses/progress/:userId
 */
export const getUserCourseProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const [
      { count: inProgress },
      { count: completed },
      { count: total },
    ] = await Promise.all([
      supabase
        .from('video_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', false)
        .gt('watch_percentage', 0),
      supabase
        .from('video_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true),
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ]);

    // Get recent progress
    const { data: recentProgress } = await supabase
      .from('video_progress')
      .select('*, courses(title, thumbnail, category, difficulty)')
      .eq('user_id', userId)
      .order('last_watched_at', { ascending: false })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCourses: total || 0,
          inProgress: inProgress || 0,
          completed: completed || 0,
          notStarted: (total || 0) - (inProgress || 0) - (completed || 0),
        },
        recentProgress,
      },
    });
  } catch (error: any) {
    console.error('Error getting user course progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
