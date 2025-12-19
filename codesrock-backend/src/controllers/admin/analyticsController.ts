import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';

/**
 * @desc    Get admin dashboard overview
 * @route   GET /api/admin/analytics/overview
 * @access  Private/Admin
 */
export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get date for 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get yesterday for active today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      { count: totalTeachers },
      { count: activeToday },
      { count: totalCourses },
      { count: newUsersThisMonth },
      { count: totalActivities },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').gte('last_login', yesterday.toISOString()).eq('is_active', true),
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('activities').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    ]);

    // Calculate average completion rate
    const { data: allProgress } = await supabase.from('video_progress').select('watched_seconds, total_seconds');
    const avgCompletionRate = allProgress && allProgress.length > 0
      ? allProgress.reduce((sum, p) => sum + (p.total_seconds > 0 ? (p.watched_seconds / p.total_seconds) * 100 : 0), 0) / allProgress.length
      : 0;

    // Get engagement trend (last 7 days) - simplified
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentActivities } = await supabase
      .from('activities')
      .select('timestamp')
      .gte('timestamp', sevenDaysAgo.toISOString());

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTeachers: totalTeachers || 0,
          activeToday: activeToday || 0,
          totalCourses: totalCourses || 0,
          avgCompletionRate: Math.round(avgCompletionRate),
        },
        trends: {
          newUsersThisMonth: newUsersThisMonth || 0,
          totalActivities: totalActivities || 0,
          engagementCount: recentActivities?.length || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get individual teacher analytics
 * @route   GET /api/admin/analytics/teachers/:id
 * @access  Private/Admin
 */
export const getTeacherAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*, schools(name)')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const [
      { data: progress },
      { count: completedCourses },
      { count: totalActivities },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.from('user_progress').select('*').eq('user_id', userId).single(),
      supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
      supabase.from('activities').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          school: user.schools,
          lastLogin: user.last_login,
        },
        progress,
        stats: {
          completedCourses: completedCourses || 0,
          totalActivities: totalActivities || 0,
        },
        trends: {
          recentActivity: recentActivity || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get course completion analytics
 * @route   GET /api/admin/analytics/courses
 * @access  Private/Admin
 */
export const getCourseAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data: courses } = await supabase.from('courses').select('*').eq('is_published', true);

    const courseStats = await Promise.all(
      (courses || []).map(async (course) => {
        const [
          { count: totalViews },
          { count: completions },
        ] = await Promise.all([
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('completed', true),
        ]);

        return {
          courseId: course.id,
          title: course.title,
          category: course.category,
          totalViews: totalViews || 0,
          completions: completions || 0,
          completionRate: totalViews && totalViews > 0 ? ((completions || 0) / totalViews) * 100 : 0,
        };
      })
    );

    // Sort by completion rate
    courseStats.sort((a, b) => b.completionRate - a.completionRate);

    res.status(200).json({
      success: true,
      data: {
        courses: courseStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get engagement metrics
 * @route   GET /api/admin/analytics/engagement
 * @access  Private/Admin
 */
export const getEngagementMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    // Get activities for the period
    const { data: activities } = await supabase
      .from('activities')
      .select('user_id, type, timestamp')
      .gte('timestamp', daysAgo.toISOString());

    // Calculate unique users per day
    const dailyUsers = new Map<string, Set<string>>();
    const typeBreakdown = new Map<string, number>();

    (activities || []).forEach((activity) => {
      const date = activity.timestamp.split('T')[0];
      if (!dailyUsers.has(date)) {
        dailyUsers.set(date, new Set());
      }
      dailyUsers.get(date)!.add(activity.user_id);

      typeBreakdown.set(activity.type, (typeBreakdown.get(activity.type) || 0) + 1);
    });

    const dailyActiveUsers = Array.from(dailyUsers.entries()).map(([date, users]) => ({
      date,
      count: users.size,
    }));

    const activityBreakdown = Array.from(typeBreakdown.entries()).map(([type, count]) => ({
      _id: type,
      count,
    }));

    // Get top performers
    const { data: topPerformers } = await supabase
      .from('user_progress')
      .select('*, profiles(first_name, last_name, email)')
      .order('total_xp', { ascending: false })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        dailyActiveUsers,
        activityBreakdown,
        topPerformers: topPerformers || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
