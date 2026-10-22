import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';
import {
  ACTIVE_WINDOW_DAYS,
  FUNNEL_STAGES,
  REGULAR_LOGGING_DAYS,
  activationFunnel,
  followUps,
  loadPlatform,
  weeklyLessons,
  rankSchools,
  summarizeCourses,
  summarizeSchools,
  summarizeTeachers,
} from '../../services/adminStats';
import { computeClassProgress } from '../../services/progressAnalytics';
import { ClassRow, loadProgressInput } from '../trackingController';

/*
 * Admin analytics. Figures come from recorded data only; anything not yet
 * measured is returned as null so the UI can say "No data yet".
 */

/** School admins only see their own school; other admins see everything. */
const scopeFor = async (req: Request): Promise<string | null> => {
  if (req.user?.role !== 'school_admin') return null;
  const { data } = await supabase.from('profiles').select('school_id').eq('id', req.user.userId).single();
  if (!data?.school_id) throw new AppError('Your account is not linked to a school', 403);
  return data.school_id;
};

const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * @desc    Admin overview (dashboard and analytics headline figures)
 * @route   GET /api/admin/analytics/overview
 */
export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [platform, activities30, recentActivities, lessons30, ratings, courses] = await Promise.all([
      loadPlatform(await scopeFor(req)),
      supabase.from('activities').select('id', { count: 'exact', head: true }).gte('created_at', daysAgoIso(30)),
      supabase.from('activities').select('id', { count: 'exact', head: true }).gte('created_at', daysAgoIso(7)),
      supabase.from('lesson_sessions').select('id', { count: 'exact', head: true }).gte('session_date', daysAgoIso(30).slice(0, 10)),
      supabase.from('learner_activity_results').select('level'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const teachers = summarizeTeachers(platform);
    const schools = summarizeSchools(platform, teachers);
    const courseStats = summarizeCourses(platform);
    const levels = (ratings.data || []).map((r: any) => r.level);
    const attempts = platform.evalProgress.length;
    const oneDayAgo = Date.now() - 86_400_000;
    const monthAgo = daysAgoIso(30);

    const startedPcts = courseStats.flatMap((c) => (c.avgCompletion === null ? [] : [c.avgCompletion]));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTeachers: teachers.length,
          activeTeachers: teachers.filter((t) => t.status === 'active').length,
          neverLoggedIn: teachers.filter((t) => t.status === 'never_logged_in').length,
          totalStudents: platform.learners.length,
          activeToday: teachers.filter((t) => t.lastLogin && new Date(t.lastLogin).getTime() >= oneDayAgo).length,
          totalCourses: courses.count || 0,
          avgTeacherCompletion: startedPcts.length ? Math.round(startedPcts.reduce((a, b) => a + b, 0) / startedPcts.length) : null,
          studentCompletionRate: levels.length ? Math.round((levels.filter((l: number) => l === 3).length / levels.length) * 100) : null,
          evaluationSuccessRate: attempts ? Math.round((platform.evalProgress.filter((e: any) => e.passed).length / attempts) * 100) : null,
          lessonsLast30Days: lessons30.count || 0,
          classCount: platform.classes.length,
        },
        trends: {
          newUsersThisMonth: platform.teachers.filter((t: any) => t.created_at >= monthAgo).length,
          totalActivities: activities30.count || 0,
          engagementCount: recentActivities.count || 0,
        },
        topSchools: rankSchools(schools).slice(0, 4),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Individual teacher analytics (summary)
 * @route   GET /api/admin/analytics/teachers/:id
 */
export const getTeacherAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const platform = await loadPlatform(await scopeFor(req));
    const teacher = summarizeTeachers(platform).find((t) => t.id === req.params.id);
    if (!teacher) throw new AppError('Teacher not found', 404);

    const { data: recentActivity } = await supabase
      .from('activities')
      .select('type, description, xp_earned, created_at')
      .eq('user_id', teacher.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.status(200).json({ success: true, data: { teacher, recentActivity: recentActivity || [] } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Teacher training progress per course
 * @route   GET /api/admin/analytics/courses
 */
export const getCourseAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const platform = await loadPlatform(await scopeFor(req));
    const courses = summarizeCourses(platform).sort((a, b) => b.teachersStarted - a.teachersStarted);
    const started = courses.filter((c) => c.avgCompletion !== null);

    res.status(200).json({
      success: true,
      data: {
        courses,
        // Videos teachers have started, across all courses
        totalViews: platform.videoProgress.filter((v: any) => platform.activeVideoIds.has(v.video_id)).length,
        avgProgress: started.length
          ? Math.round(started.reduce((a, c) => a + (c.avgCompletion || 0), 0) / started.length)
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Engagement over a period
 * @route   GET /api/admin/analytics/engagement?days=30
 */
export const getEngagementMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const since = daysAgoIso(days);

    const [activities, downloads, quizAttempts, quizzesPassed, certificates, badges, lessons, platform] = await Promise.all([
      supabase.from('activities').select('user_id, type, created_at').gte('created_at', since),
      supabase.from('resource_downloads').select('id', { count: 'exact', head: true }).gte('downloaded_at', since),
      supabase.from('evaluation_progress').select('id', { count: 'exact', head: true }).gte('completed_at', since),
      supabase.from('evaluation_progress').select('id', { count: 'exact', head: true }).eq('passed', true).gte('completed_at', since),
      supabase.from('certificates').select('id', { count: 'exact', head: true }).gte('date_earned', since),
      supabase.from('user_badges').select('id', { count: 'exact', head: true }).gte('earned_at', since),
      supabase.from('lesson_sessions').select('session_date').gte('session_date', since.slice(0, 10)),
      loadPlatform(await scopeFor(req)),
    ]);
    if (activities.error) throw activities.error;

    // Unique active users per day
    const dailyUsers = new Map<string, Set<string>>();
    const typeBreakdown = new Map<string, number>();
    for (const a of activities.data || []) {
      const date = a.created_at.slice(0, 10);
      if (!dailyUsers.has(date)) dailyUsers.set(date, new Set());
      dailyUsers.get(date)!.add(a.user_id);
      typeBreakdown.set(a.type, (typeBreakdown.get(a.type) || 0) + 1);
    }

    const lessonsByDate = new Map<string, number>();
    for (const l of lessons.data || []) lessonsByDate.set(l.session_date, (lessonsByDate.get(l.session_date) || 0) + 1);

    const teachers = summarizeTeachers(platform);
    const activeInPeriod = teachers.filter((t) => t.lastLogin && t.lastLogin >= since).length;

    res.status(200).json({
      success: true,
      data: {
        days,
        dailyActiveUsers: [...dailyUsers.entries()]
          .map(([date, users]) => ({ date, count: users.size }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        lessonsLogged: [...lessonsByDate.entries()]
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        activityBreakdown: [...typeBreakdown.entries()]
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        teacherCount: teachers.length,
        activeTeachers: activeInPeriod,
        activeTeacherRate: teachers.length ? Math.round((activeInPeriod / teachers.length) * 100) : null,
        neverLoggedIn: teachers.filter((t) => t.status === 'never_logged_in').length,
        totalDownloads: downloads.count || 0,
        quizAttempts: quizAttempts.count || 0,
        quizzesPassed: quizzesPassed.count || 0,
        certificatesIssued: certificates.count || 0,
        badgesEarned: badges.count || 0,
        lessonCount: (lessons.data || []).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    All schools, ranked by teaching activity
 * @route   GET /api/admin/analytics/schools
 */
export const getSchoolAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const platform = await loadPlatform(await scopeFor(req));
    const schools = rankSchools(summarizeSchools(platform, summarizeTeachers(platform)));
    res.status(200).json({ success: true, data: { schools } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    One school: summary and every teacher's activation and activity
 * @route   GET /api/admin/analytics/schools/:id/performance
 */
export const getSchoolPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [{ data: school }, platform] = await Promise.all([
      supabase.from('schools').select('*').eq('id', req.params.id).single(),
      loadPlatform(await scopeFor(req)),
    ]);
    if (!school) throw new AppError('School not found', 404);
    if (!platform.schools.some((s: any) => s.id === school.id)) {
      throw new AppError('You do not have access to this school', 403);
    }

    const teachers = summarizeTeachers(platform);
    const summary = summarizeSchools(platform, teachers).find((s) => s.id === school.id)!;
    const staff = teachers
      .filter((t) => t.schoolId === school.id)
      .sort((a, b) => b.lessonCount - a.lessonCount || (b.lastLogin || '').localeCompare(a.lastLogin || ''));

    res.status(200).json({ success: true, data: { school, summary, teachers: staff } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    One teacher: training, classes and every child they teach
 * @route   GET /api/admin/analytics/teachers/:id/performance
 */
export const getTeacherDetailedPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.params.id;
    const [{ data: profile }, platform, quizzes, certificates, classesRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email, last_login, schools(name)').eq('id', teacherId).single(),
      loadPlatform(await scopeFor(req)),
      supabase
        .from('evaluation_progress')
        .select('score, passed, completed_at, evaluations(title)')
        .eq('user_id', teacherId)
        .order('completed_at', { ascending: false }),
      supabase.from('certificates').select('title, date_earned').eq('user_id', teacherId).order('date_earned', { ascending: false }),
      supabase.from('classes').select('id, name, teacher_id, school_id, curriculum_id').eq('teacher_id', teacherId),
    ]);
    if (!profile) throw new AppError('Teacher not found', 404);

    const summary = summarizeTeachers(platform).find((t) => t.id === teacherId);
    if (!summary) throw new AppError('You do not have access to this teacher', 403);

    // Training: completed videos per course the teacher has started
    const byCourse = new Map<string, { title: string; total: number; done: number; started: boolean }>();
    for (const v of platform.activeVideos as any[]) {
      const entry = byCourse.get(v.course_id) || { title: (v.courses?.title || '').trim(), total: 0, done: 0, started: false };
      entry.total += 1;
      byCourse.set(v.course_id, entry);
    }
    for (const vp of platform.videoProgress as any[]) {
      if (vp.user_id !== teacherId || !platform.activeVideoIds.has(vp.video_id)) continue;
      const entry = byCourse.get(vp.course_id);
      if (!entry) continue;
      entry.started = true;
      if (vp.completed) entry.done += 1;
    }

    // Classes and children, from logged lessons
    const classes = await Promise.all(
      (classesRes.data || []).map(async (cls: ClassRow) => {
        const progress = computeClassProgress(await loadProgressInput(cls));
        return {
          classId: cls.id,
          name: cls.name,
          ...progress.summary,
          learners: progress.learners.map((l) => ({
            learnerId: l.learnerId,
            name: l.name,
            avgScore: l.avgScore,
            independentRate: l.independentRate,
            attendanceRate: l.attendanceRate,
            flags: l.flags,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          email: profile.email,
          school: (profile.schools as any)?.name || null,
          lastLogin: profile.last_login,
          status: summary?.status || 'never_logged_in',
        },
        training: {
          courses: [...byCourse.entries()]
            .filter(([, c]) => c.started)
            .map(([courseId, c]) => ({
              courseId,
              title: c.title,
              videosCompleted: c.done,
              videosTotal: c.total,
              completed: c.total > 0 && c.done === c.total,
            })),
          quizzes: (quizzes.data || []).map((q: any) => ({
            title: q.evaluations?.title || 'Quiz',
            score: q.score,
            passed: q.passed,
            completedAt: q.completed_at,
          })),
          certificates: (certificates.data || []).map((c: any) => ({ title: (c.title || '').trim(), dateEarned: c.date_earned })),
        },
        classes,
        activeWindowDays: ACTIVE_WINDOW_DAYS,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin Overview: activation funnel (overall and per school),
 *          follow-up list and lessons logged per week
 * @route   GET /api/admin/analytics/activation?schoolId=
 */
export const getActivationOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // School admins are always limited to their school; others may filter
    const scope = (await scopeFor(req)) || (typeof req.query.schoolId === 'string' && req.query.schoolId) || null;
    const platform = await loadPlatform(scope);
    const now = Date.now();
    const teachers = summarizeTeachers(platform, now);
    const schools = rankSchools(summarizeSchools(platform, teachers));

    const twelveWeeksAgo = new Date(now - 12 * 7 * 86_400_000).toISOString().slice(0, 10);
    const classIds = platform.classes.map((c: any) => c.id);
    const [{ data: lessons, error }, { data: ratings }] = await Promise.all([
      classIds.length
        ? supabase.from('lesson_sessions').select('class_id, session_date').in('class_id', classIds).gte('session_date', twelveWeeksAgo)
        : Promise.resolve({ data: [] as any[], error: null }),
      classIds.length
        ? supabase.from('learner_activity_results').select('level, lesson_sessions!inner(class_id)').in('lesson_sessions.class_id', classIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    if (error) throw error;

    const regularClasses = platform.classOverview.filter((c) => {
      if (!c.last_lesson_date) return false;
      return now - new Date(`${c.last_lesson_date}T00:00:00Z`).getTime() <= REGULAR_LOGGING_DAYS * 86_400_000;
    }).length;
    const levels = (ratings || []).map((r: any) => r.level);

    res.status(200).json({
      success: true,
      data: {
        scope: scope ? { schoolId: scope, schoolName: schools[0]?.name || null } : null,
        kpis: {
          activeSchools: schools.filter((s) => s.isActive && s.teacherCount > 0).length,
          totalTeachers: teachers.length,
          activeTeachers: teachers.filter((t) => t.status === 'active').length,
          classes: platform.classOverview.length,
          classesLoggingRegularly: regularClasses,
          children: platform.learners.length,
          independentRate: levels.length ? Math.round((levels.filter((l: number) => l === 3).length / levels.length) * 100) : null,
        },
        stages: FUNNEL_STAGES,
        funnel: activationFunnel(teachers, now),
        schools: schools.map((s) => ({
          id: s.id,
          name: s.name,
          isActive: s.isActive,
          teacherCount: s.teacherCount,
          funnel: activationFunnel(teachers.filter((t) => t.schoolId === s.id), now),
        })),
        followUps: followUps(platform, teachers, now),
        weekly: weeklyLessons(lessons || [], 12, now),
        regularLoggingDays: REGULAR_LOGGING_DAYS,
        activeWindowDays: ACTIVE_WINDOW_DAYS,
      },
    });
  } catch (error) {
    next(error);
  }
};

const STATUS_TEXT: Record<string, string> = {
  active: 'Active',
  inactive: 'Not active in 30 days',
  never_logged_in: 'Never logged in',
};

const FLAG_TEXT: Record<string, string> = {
  repeated_not_yet: 'Several "Not yet" in recent lessons',
  low_attendance: 'Missed many recent lessons',
  book_gap: 'Can do it hands-on, struggles in the book',
};

const dateOnly = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');
const pctCell = (v: number | null | undefined) => (v === null || v === undefined ? '' : v);

/**
 * @desc    Rows for a CSV export (built client-side)
 * @route   GET /api/admin/analytics/export?type=teachers|children|schools&schoolId=
 */
export const getExport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const type = String(req.query.type || '');
    if (!['teachers', 'children', 'schools'].includes(type)) throw new AppError('Unknown export type', 400);

    const scope = (await scopeFor(req)) || (typeof req.query.schoolId === 'string' && req.query.schoolId) || null;
    const platform = await loadPlatform(scope);
    const teachers = summarizeTeachers(platform);
    const schoolName = new Map(platform.schools.map((s: any) => [s.id, s.name]));
    const stamp = new Date().toISOString().slice(0, 10);

    if (type === 'schools') {
      const rows = rankSchools(summarizeSchools(platform, teachers)).map((s) => [
        s.name, s.schoolCode || '', s.isActive ? 'Active' : 'Inactive', s.teacherCount, s.activeTeachers, s.neverLoggedIn,
        s.classCount, s.learnerCount, s.lessonCount, dateOnly(s.lastLessonDate), pctCell(s.coveragePercent), pctCell(s.independentRate),
      ]);
      res.status(200).json({
        success: true,
        data: {
          filename: `codesrock-schools-${stamp}.csv`,
          columns: ['School', 'School ID', 'Status', 'Teachers', 'Active teachers', 'Never logged in', 'Classes', 'Children',
            'Lessons logged', 'Last lesson', 'Book covered %', 'On their own %'],
          rows,
        },
      });
      return;
    }

    if (type === 'teachers') {
      const rows = teachers
        .sort((a, b) => String(schoolName.get(a.schoolId) || '').localeCompare(String(schoolName.get(b.schoolId) || '')) || a.name.localeCompare(b.name))
        .map((t) => [
          schoolName.get(t.schoolId) || '', t.name, t.email, STATUS_TEXT[t.status], dateOnly(t.lastLogin), t.videosCompleted,
          t.quizzesPassed, t.classCount, t.learnerCount, t.lessonCount, dateOnly(t.lastLessonDate),
        ]);
      res.status(200).json({
        success: true,
        data: {
          filename: `codesrock-teachers-${stamp}.csv`,
          columns: ['School', 'Teacher', 'Email', 'Status', 'Last login', 'Training videos done', 'Quizzes passed',
            'Classes', 'Children', 'Lessons logged', 'Last lesson'],
          rows,
        },
      });
      return;
    }

    // children: one row per child, from each class's logged lessons
    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, name, teacher_id, school_id, curriculum_id')
      .in('id', platform.classes.map((c: any) => c.id).concat(['00000000-0000-0000-0000-000000000000']));
    if (error) throw error;
    const teacherName = new Map(teachers.map((t) => [t.id, t.name]));

    const perClass = await Promise.all(
      (classes || []).map(async (cls: ClassRow) => ({ cls, progress: computeClassProgress(await loadProgressInput(cls)) }))
    );
    const rows = perClass.flatMap(({ cls, progress }) =>
      progress.learners.map((l) => [
        schoolName.get(cls.school_id) || '', cls.name, teacherName.get(cls.teacher_id) || '', l.name, l.lessonsAttended,
        pctCell(l.attendanceRate), pctCell(l.avgScore), pctCell(l.independentRate), pctCell(l.practicalScore), pctCell(l.bookScore),
        l.flags.filter((f) => f !== 'not_yet_assessed').map((f) => FLAG_TEXT[f] || f).join('; '),
      ])
    );
    res.status(200).json({
      success: true,
      data: {
        filename: `codesrock-children-${stamp}.csv`,
        columns: ['School', 'Class', 'Teacher', 'Child', 'Lessons attended', 'Attendance %', 'Average %', 'On their own %',
          'Hands-on %', 'In the book %', 'Needs attention'],
        rows,
      },
    });
  } catch (error) {
    next(error);
  }
};
