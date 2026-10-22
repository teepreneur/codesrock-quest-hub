import { supabase } from '../config/supabase';

/**
 * Admin statistics built from a handful of bulk queries, so admin pages do
 * not run one set of queries per school, teacher or course.
 *
 * Every figure here comes from recorded data. When something has not been
 * measured yet the value is null, never a placeholder.
 */

const DAY = 86_400_000;
export const ACTIVE_WINDOW_DAYS = 30;

export type TeacherStatus = 'never_logged_in' | 'inactive' | 'active';

export interface TeacherSummary {
  id: string;
  name: string;
  email: string;
  schoolId: string | null;
  lastLogin: string | null;
  status: TeacherStatus;
  videosCompleted: number;
  quizzesPassed: number;
  classCount: number;
  learnerCount: number;
  lessonCount: number;
  lastLessonDate: string | null;
}

export interface SchoolSummary {
  id: string;
  name: string;
  schoolCode: string | null;
  isActive: boolean;
  teacherCount: number;
  activeTeachers: number;
  neverLoggedIn: number;
  classCount: number;
  learnerCount: number;
  lessonCount: number;
  lastLessonDate: string | null;
  coveragePercent: number | null;
  independentRate: number | null;
}

const avg = (values: (number | null | undefined)[]) => {
  const v = values.filter((x): x is number => typeof x === 'number');
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};

const latest = (dates: (string | null | undefined)[]) =>
  dates.filter((d): d is string => !!d).sort().pop() || null;

export const teacherStatus = (lastLogin: string | null, now = Date.now()): TeacherStatus => {
  if (!lastLogin) return 'never_logged_in';
  return now - new Date(lastLogin).getTime() <= ACTIVE_WINDOW_DAYS * DAY ? 'active' : 'inactive';
};

/**
 * Load everything the admin summaries need in one round of queries.
 * With a schoolId (school admins), only that school's data is kept.
 */
export const loadPlatform = async (schoolId: string | null = null) => {
  const [schools, teachers, videos, videoProgress, evalProgress, classes, overview, learners] = await Promise.all([
    supabase.from('schools').select('id, name, school_code, is_active'),
    supabase
      .from('profiles')
      .select('id, first_name, last_name, email, school_id, last_login, created_at, is_active')
      .eq('role', 'teacher'),
    supabase.from('videos').select('id, course_id, topics!inner(is_active), courses!inner(id, title, is_active)').eq('is_active', true),
    supabase.from('video_progress').select('user_id, video_id, course_id, completed'),
    supabase.from('evaluation_progress').select('user_id, passed'),
    supabase.from('classes').select('id, teacher_id, school_id'),
    supabase.rpc('class_progress_overview', { p_school_id: null }),
    supabase.from('learners').select('id, school_id').eq('is_active', true),
  ]);

  for (const r of [schools, teachers, videos, videoProgress, evalProgress, classes, overview, learners]) {
    if (r.error) throw r.error;
  }

  const activeVideos = (videos.data || []).filter((v: any) => v.topics?.is_active !== false && v.courses?.is_active !== false);
  const inScope = (row: any) => !schoolId || row.school_id === schoolId;
  const scopedTeachers = (teachers.data || []).filter((t: any) => t.is_active !== false && inScope(t));
  const teacherIds = new Set(scopedTeachers.map((t: any) => t.id));

  return {
    schools: (schools.data || []).filter((s: any) => !schoolId || s.id === schoolId),
    teachers: scopedTeachers,
    activeVideos,
    activeVideoIds: new Set(activeVideos.map((v: any) => v.id)),
    videoProgress: (videoProgress.data || []).filter((v: any) => teacherIds.has(v.user_id)),
    evalProgress: (evalProgress.data || []).filter((e: any) => teacherIds.has(e.user_id)),
    classes: (classes.data || []).filter(inScope),
    classOverview: ((overview.data || []) as any[]).filter(inScope),
    learners: (learners.data || []).filter(inScope),
  };
};

export type Platform = Awaited<ReturnType<typeof loadPlatform>>;

export const summarizeTeachers = (p: Platform, now = Date.now()): TeacherSummary[] => {
  const overviewByClass = new Map(p.classOverview.map((c) => [c.class_id, c]));

  return p.teachers.map((t: any) => {
    const completed = new Set(
      p.videoProgress
        .filter((v: any) => v.user_id === t.id && v.completed && p.activeVideoIds.has(v.video_id))
        .map((v: any) => v.video_id)
    );
    const myClasses = p.classes.filter((c: any) => c.teacher_id === t.id).map((c: any) => overviewByClass.get(c.id)).filter(Boolean);

    return {
      id: t.id,
      name: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
      email: t.email,
      schoolId: t.school_id,
      lastLogin: t.last_login,
      status: teacherStatus(t.last_login, now),
      videosCompleted: completed.size,
      quizzesPassed: p.evalProgress.filter((e: any) => e.user_id === t.id && e.passed).length,
      classCount: myClasses.length,
      learnerCount: myClasses.reduce((a: number, c: any) => a + Number(c.learner_count), 0),
      lessonCount: myClasses.reduce((a: number, c: any) => a + Number(c.lesson_count), 0),
      lastLessonDate: latest(myClasses.map((c: any) => c.last_lesson_date)),
    };
  });
};

export const summarizeSchools = (p: Platform, teachers: TeacherSummary[]): SchoolSummary[] =>
  p.schools.map((s: any) => {
    const staff = teachers.filter((t) => t.schoolId === s.id);
    const classes = p.classOverview.filter((c) => c.school_id === s.id);
    const total = (c: any) => Number(c.activities_total) || 0;
    return {
      id: s.id,
      name: s.name,
      schoolCode: s.school_code,
      isActive: s.is_active !== false,
      teacherCount: staff.length,
      activeTeachers: staff.filter((t) => t.status === 'active').length,
      neverLoggedIn: staff.filter((t) => t.status === 'never_logged_in').length,
      classCount: classes.length,
      learnerCount: p.learners.filter((l: any) => l.school_id === s.id).length,
      lessonCount: classes.reduce((a, c) => a + Number(c.lesson_count), 0),
      lastLessonDate: latest(classes.map((c) => c.last_lesson_date)),
      coveragePercent: avg(classes.map((c) => (total(c) ? Math.round((Number(c.activities_covered) / total(c)) * 100) : null))),
      independentRate: avg(classes.map((c) => (c.independent_rate === null ? null : Math.round(Number(c.independent_rate) * 100)))),
    };
  });

/** Schools ranked by real teaching activity: lessons logged, then children, then active teachers. */
export const rankSchools = (schools: SchoolSummary[]) =>
  [...schools].sort(
    (a, b) =>
      Number(b.isActive) - Number(a.isActive) ||
      b.lessonCount - a.lessonCount ||
      b.learnerCount - a.learnerCount ||
      b.activeTeachers - a.activeTeachers ||
      a.name.localeCompare(b.name)
  );

/** Per-course training figures for teachers. */
export const summarizeCourses = (p: Platform) => {
  const byCourse = new Map<string, { title: string; videoIds: Set<string> }>();
  for (const v of p.activeVideos as any[]) {
    const entry = byCourse.get(v.course_id) || { title: v.courses?.title || 'Untitled', videoIds: new Set<string>() };
    entry.videoIds.add(v.id);
    byCourse.set(v.course_id, entry);
  }
  const teacherIds = new Set(p.teachers.map((t: any) => t.id));

  return [...byCourse.entries()].map(([courseId, { title, videoIds }]) => {
    const rows = p.videoProgress.filter((v: any) => teacherIds.has(v.user_id) && videoIds.has(v.video_id));
    const perTeacher = new Map<string, Set<string>>();
    for (const r of rows) {
      const set = perTeacher.get(r.user_id) || new Set<string>();
      if (r.completed) set.add(r.video_id);
      perTeacher.set(r.user_id, set);
    }
    const completionPcts = [...perTeacher.values()].map((s) => (s.size / videoIds.size) * 100);
    return {
      courseId,
      title: title.trim(),
      videosTotal: videoIds.size,
      teachersStarted: perTeacher.size,
      teachersCompleted: [...perTeacher.values()].filter((s) => s.size === videoIds.size).length,
      videoCompletions: rows.filter((r: any) => r.completed).length,
      avgCompletion: avg(completionPcts),
    };
  });
};
