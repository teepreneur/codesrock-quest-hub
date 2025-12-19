import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Get unified dashboard data for user
 * GET /api/dashboard/:userId
 */
export const getUserDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Fetch all data in parallel
    const [
      { data: user },
      { data: progress },
      { data: userBadges },
      { data: recentActivities },
      { data: courseProgress },
      { data: upcomingSessions },
      { data: evaluations },
    ] = await Promise.all([
      // User info
      supabase.from('profiles').select('id, first_name, last_name, email, role').eq('id', userId).single(),

      // User progress (XP, level, streak)
      supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single(),

      // User badges (separate query)
      supabase
        .from('user_badges')
        .select('*, badges(name, description, icon, category)')
        .eq('user_id', userId),

      // Recent activities (last 10)
      supabase
        .from('activities')
        .select('type, description, xp_earned, metadata, timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10),

      // Course progress summary
      supabase
        .from('video_progress')
        .select('*, courses(title, thumbnail, category)')
        .eq('user_id', userId)
        .order('last_watched_at', { ascending: false })
        .limit(5),

      // Upcoming training sessions
      supabase
        .from('session_registrations')
        .select('*, training_sessions(*)')
        .eq('user_id', userId)
        .eq('attended', false)
        .gte('training_sessions.start_time', new Date().toISOString())
        .limit(5),

      // Evaluation status
      supabase
        .from('user_evaluations')
        .select('*, evaluations(title, description)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(3),
    ]);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!progress) {
      res.status(404).json({ success: false, message: 'User progress not found' });
      return;
    }

    // Calculate course statistics
    const [
      { count: totalCourses },
      { count: completedCourses },
      { count: inProgressCourses },
    ] = await Promise.all([
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
      supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', false).gt('watched_seconds', 0),
    ]);

    // Get leaderboard position
    const { data: leaderboardData } = await supabase.rpc('get_leaderboard', { p_limit: 100 });
    const leaderboardPosition = (leaderboardData?.findIndex((entry: any) => entry.user_id === userId) || -1) + 1;

    // Get recommended courses based on completed categories
    const { data: completedProgress } = await supabase
      .from('video_progress')
      .select('courses(category)')
      .eq('user_id', userId)
      .eq('completed', true);

    const categories = [...new Set(completedProgress?.map((p: any) => p.courses?.category).filter(Boolean))] as string[];

    const { data: recommendedCourses } = await supabase
      .from('courses')
      .select('title, thumbnail, category, difficulty, xp_reward')
      .eq('is_active', true)
      .in('category', categories.length > 0 ? categories : ['HTML/CSS', 'JavaScript'])
      .order('average_rating', { ascending: false })
      .order('completion_count', { ascending: false })
      .limit(3);

    // Filter upcoming sessions (remove null sessions)
    const validUpcomingSessions = (upcomingSessions || [])
      .filter((reg: any) => reg.training_sessions)
      .map((reg: any) => ({
        session: reg.training_sessions,
        registeredAt: reg.registered_at,
      }));

    // Extract recent badges
    const recentBadges = (userBadges || [])
      .sort((a: any, b: any) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
      .slice(0, 3);

    // Construct dashboard response
    const dashboard = {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        fullName: `${user.first_name} ${user.last_name}`,
      },
      progress: {
        currentXP: progress.current_xp,
        totalXP: progress.total_xp,
        currentLevel: progress.current_level,
        levelName: progress.level_name,
        streak: progress.streak,
        lastActivityDate: progress.last_activity_date,
        badgeCount: userBadges?.length || 0,
        recentBadges,
      },
      stats: {
        totalCourses: totalCourses || 0,
        completedCourses: completedCourses || 0,
        inProgressCourses: inProgressCourses || 0,
        notStartedCourses: (totalCourses || 0) - (completedCourses || 0) - (inProgressCourses || 0),
        leaderboardPosition: leaderboardPosition > 0 ? leaderboardPosition : null,
      },
      recentActivities: (recentActivities || []).map((activity: any) => ({
        type: activity.type,
        description: activity.description,
        xpEarned: activity.xp_earned,
        timestamp: activity.timestamp,
      })),
      courseProgress: (courseProgress || []).map((cp: any) => ({
        course: cp.courses,
        progressPercentage:
          cp.total_seconds > 0 ? Math.round((cp.watched_seconds / cp.total_seconds) * 100) : 0,
        completed: cp.completed,
        lastWatchedAt: cp.last_watched_at,
      })),
      upcomingSessions: validUpcomingSessions,
      recommendedCourses: recommendedCourses || [],
      evaluations: (evaluations || []).map((userEval: any) => ({
        id: userEval.id,
        evaluation: userEval.evaluations,
        status: userEval.status,
        score: userEval.score,
        percentage: userEval.percentage,
        submittedAt: userEval.submitted_at,
      })),
    };

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get platform statistics (admin)
 * GET /api/dashboard/admin/stats
 */
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get date for active users check
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      { count: totalUsers },
      { count: totalCourses },
      { count: totalResources },
      { count: totalSessions },
      { count: totalActivities },
      { count: activeUsers },
      { count: completedCourses },
      { count: upcomingSessions },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('training_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('activities').select('*', { count: 'exact', head: true }),
      supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity_date', sevenDaysAgo.toISOString()),
      supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('completed', true),
      supabase
        .from('training_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', new Date().toISOString())
        .eq('status', 'scheduled'),
    ]);

    // Get top users by XP
    const { data: leaderboard } = await supabase.rpc('get_leaderboard', { p_limit: 5 });

    const topUsers = (leaderboard || []).map((entry: any) => ({
      user: {
        id: entry.user_id,
        firstName: entry.first_name,
        lastName: entry.last_name,
        email: entry.email,
      },
      totalXP: entry.total_xp,
      currentLevel: entry.current_level,
      levelName: entry.level_name,
    }));

    // Get popular courses
    const { data: popularCourses } = await supabase
      .from('courses')
      .select('title, category, completion_count, view_count')
      .eq('is_active', true)
      .order('completion_count', { ascending: false })
      .order('view_count', { ascending: false })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers || 0,
          totalCourses: totalCourses || 0,
          totalResources: totalResources || 0,
          totalSessions: totalSessions || 0,
          totalActivities: totalActivities || 0,
          activeUsers: activeUsers || 0,
          completedCourses: completedCourses || 0,
          upcomingSessions: upcomingSessions || 0,
        },
        topUsers,
        popularCourses: popularCourses || [],
      },
    });
  } catch (error: any) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
