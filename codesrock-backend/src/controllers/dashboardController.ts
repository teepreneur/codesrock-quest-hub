import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../utils/logger';
import { LEVELS, getLevelByXP } from './gamificationController';

/**
 * Get unified dashboard data for user
 * GET /api/dashboard/:userId
 */
export const getUserDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Security Check: IDOR Protection
    if (userId !== req.user?.userId && !['super_admin', 'school_admin', 'content_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to access dashboard of ${userId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const nowIso = new Date().toISOString();

    // Fetch all data in parallel
    const [
      { data: user },
      { data: progress },
      { data: userBadges },
      { data: recentActivities },
      { data: videoProgress },
      { data: activeVideos },
      { data: nextSessions },
      { data: registrations },
      { data: evaluations },
      { data: teacherClasses },
    ] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email, role').eq('id', userId).single(),

      // XP, level, streak
      supabase.from('user_progress').select('*').eq('user_id', userId).single(),

      supabase.from('user_badges').select('*, badges(name, description, icon, category)').eq('user_id', userId),

      // Recent activities (the column is created_at)
      supabase
        .from('activities')
        .select('type, description, xp_earned, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Every video the teacher has watched
      supabase
        .from('video_progress')
        .select('course_id, video_id, completed, last_watched_at')
        .eq('user_id', userId),

      // All active training videos, in learning-path order
      supabase
        .from('videos')
        .select('id, title, course_id, order_index, topics!inner(id, title, order_index, is_active), courses!inner(id, title, is_active)')
        .eq('is_active', true),

      // Next live training sessions (registered or not)
      supabase
        .from('training_sessions')
        .select('id, title, start_time, end_time, type, meeting_link, instructor')
        .eq('is_active', true)
        .gte('start_time', nowIso)
        .order('start_time', { ascending: true })
        .limit(3),

      supabase.from('session_registrations').select('session_id').eq('user_id', userId),

      // Evaluation results
      supabase
        .from('evaluation_progress')
        .select('id, evaluation_id, score, passed, completed_at, evaluations(id, title, description)')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false }),

      supabase.from('classes').select('id, name').eq('teacher_id', userId),
    ]);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!progress) {
      res.status(404).json({ success: false, message: 'User progress not found' });
      return;
    }

    // ---- Training progress per course: completed videos / active videos ----
    const completedVideoIds = new Set(
      (videoProgress || []).filter((v: any) => v.completed && v.video_id).map((v: any) => v.video_id)
    );
    const videos = (activeVideos || []).filter((v: any) => v.topics?.is_active !== false && v.courses?.is_active !== false);
    const lastWatched = new Map<string, string>();
    for (const v of videoProgress || []) {
      const prev = lastWatched.get(v.course_id);
      if (v.course_id && (!prev || v.last_watched_at > prev)) lastWatched.set(v.course_id, v.last_watched_at);
    }

    const byCourse = new Map<string, any[]>();
    for (const v of videos) {
      byCourse.set(v.course_id, [...(byCourse.get(v.course_id) || []), v]);
    }
    const ordered = (list: any[]) =>
      [...list].sort((a, b) =>
        (a.topics?.order_index ?? 0) - (b.topics?.order_index ?? 0) || (a.order_index ?? 0) - (b.order_index ?? 0)
      );

    const courseProgress = [...byCourse.entries()]
      .filter(([courseId]) => lastWatched.has(courseId))
      .map(([courseId, list]) => {
        const sorted = ordered(list);
        const done = sorted.filter((v) => completedVideoIds.has(v.id)).length;
        const next = sorted.find((v) => !completedVideoIds.has(v.id));
        return {
          course: { id: courseId, title: sorted[0]?.courses?.title },
          videosCompleted: done,
          videosTotal: sorted.length,
          progressPercentage: sorted.length ? Math.round((done / sorted.length) * 100) : 0,
          completed: sorted.length > 0 && done === sorted.length,
          lastWatchedAt: lastWatched.get(courseId),
          nextVideo: next ? { id: next.id, title: next.title, topicTitle: next.topics?.title } : null,
        };
      })
      .sort((a, b) => String(b.lastWatchedAt).localeCompare(String(a.lastWatchedAt)));

    const totalCourses = byCourse.size;
    const completedCourses = courseProgress.filter((c) => c.completed).length;
    const inProgressCourses = courseProgress.length - completedCourses;

    // ---- Recent activity: own milestones plus lessons logged ----
    const classIds = (teacherClasses || []).map((c: any) => c.id);
    const classNames = new Map((teacherClasses || []).map((c: any) => [c.id, c.name]));
    const { data: recentLessons } = classIds.length
      ? await supabase
          .from('lesson_sessions')
          .select('class_id, session_date, created_at')
          .in('class_id', classIds)
          .order('created_at', { ascending: false })
          .limit(5)
      : { data: [] as any[] };

    const activityFeed = [
      ...(recentActivities || [])
        // "Started a video" is noise next to real milestones
        .filter((a: any) => a.type !== 'video_started')
        .map((a: any) => ({ type: a.type, description: a.description, xpEarned: a.xp_earned || 0, timestamp: a.created_at })),
      ...(recentLessons || []).map((l: any) => ({
        type: 'lesson_logged',
        description: `Lesson logged for ${classNames.get(l.class_id) || 'a class'}`,
        xpEarned: 0,
        timestamp: l.created_at,
      })),
    ]
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 6);

    const registered = new Set((registrations || []).map((r: any) => r.session_id));
    const upcomingSessions = (nextSessions || []).map((s: any) => ({
      session: s,
      isRegistered: registered.has(s.id),
    }));

    const recentBadges = (userBadges || [])
      .sort((a: any, b: any) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
      .slice(0, 3);

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
        isActivated: progress.is_activated,
        onboardingStatus: progress.onboarding_status,
        badgeCount: userBadges?.length || 0,
        recentBadges,
        levelDetails: {
          current: getLevelByXP(progress.current_xp),
          next: LEVELS.find((l) => l.level === progress.current_level + 1) || null,
          progressToNextLevel: (() => {
            const currentLevelData = getLevelByXP(progress.current_xp);
            const nextLevel = LEVELS.find((l) => l.level === progress.current_level + 1);
            if (!nextLevel) return 0;
            const xpInCurrentLevel = progress.current_xp - currentLevelData.minXP;
            const xpNeededForNextLevel = nextLevel.minXP - currentLevelData.minXP;
            return Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
          })(),
        },
      },
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        notStartedCourses: totalCourses - completedCourses - inProgressCourses,
        evaluationsPassed: (evaluations || []).filter((e: any) => e.passed).length,
      },
      recentActivities: activityFeed,
      courseProgress,
      upcomingSessions,
      evaluations: (evaluations || []).map((e: any) => ({
        id: e.id,
        evaluation_id: e.evaluation_id,
        evaluation: e.evaluations,
        passed: e.passed,
        score: e.score,
        completedAt: e.completed_at,
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
