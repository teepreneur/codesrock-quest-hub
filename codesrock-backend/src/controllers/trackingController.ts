import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import {
  Activity,
  Attendance,
  Learner,
  Mode,
  ProgressInput,
  Result,
  Session,
  SessionActivity,
  Unit,
  computeClassProgress,
  computeLearnerProgress,
} from '../services/progressAnalytics';

/**
 * Activity-book progress tracking: class roster (learners), lesson logging
 * and progress dashboards.
 */

const DEFAULT_CURRICULUM_SLUG = 'codesrock-1-activity-book';

interface ClassRow {
  id: string;
  name: string;
  teacher_id: string;
  school_id: string | null;
  curriculum_id: string | null;
}

const getAdminSchoolId = async (userId: string): Promise<string | null> => {
  const { data } = await supabase.from('profiles').select('school_id').eq('id', userId).single();
  return data?.school_id || null;
};

/**
 * Load a class and check the user may see it (write = log lessons, manage
 * the roster). Teachers: their own classes. School admins: classes in their
 * school. Super admins: all. Content admins: read only.
 */
const getClassForUser = async (req: Request, classId: string, write = false): Promise<ClassRow> => {
  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, teacher_id, school_id, curriculum_id')
    .eq('id', classId)
    .single();

  if (!cls) throw new AppError('Class not found', 404);

  const role = req.user?.role;
  const userId = req.user!.userId;

  if (role === 'super_admin') return cls;
  if (cls.teacher_id === userId) return cls;
  if (role === 'school_admin' && cls.school_id && cls.school_id === (await getAdminSchoolId(userId))) return cls;
  if (role === 'content_admin' && !write) return cls;

  throw new AppError('You do not have access to this class', 403);
};

const curriculumCache = new Map<string, { at: number; units: Unit[] }>();
const CACHE_MS = 5 * 60 * 1000;

const resolveCurriculumId = async (cls: ClassRow): Promise<string> => {
  if (cls.curriculum_id) return cls.curriculum_id;
  const { data } = await supabase.from('curricula').select('id').eq('slug', DEFAULT_CURRICULUM_SLUG).single();
  if (!data) throw new AppError('No curriculum is set up yet', 500);
  return data.id;
};

export const loadCurriculum = async (curriculumId: string): Promise<Unit[]> => {
  const cached = curriculumCache.get(curriculumId);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.units;

  const { data, error } = await supabase
    .from('curriculum_units')
    .select('id, position, title, unit_type, book_pages, summary, curriculum_activities(id, unit_id, position, title, book_page, skills, modes)')
    .eq('curriculum_id', curriculumId)
    .order('position');

  if (error) throw error;

  const units: Unit[] = (data || []).map((u: any) => ({
    id: u.id,
    position: u.position,
    title: u.title,
    unit_type: u.unit_type,
    book_pages: u.book_pages,
    summary: u.summary,
    activities: [...(u.curriculum_activities || [])].sort((a: Activity, b: Activity) => a.position - b.position),
  }));

  curriculumCache.set(curriculumId, { at: Date.now(), units });
  return units;
};

const getClassLearners = async (classId: string): Promise<Learner[]> => {
  const { data, error } = await supabase
    .from('class_learners')
    .select('learner_id, learners!inner(id, first_name, last_name, is_active)')
    .eq('class_id', classId);
  if (error) throw error;
  return (data || [])
    .map((row: any) => row.learners)
    .filter((l: any) => l && l.is_active)
    .map((l: any) => ({ id: l.id, first_name: l.first_name, last_name: l.last_name }))
    .sort((a: Learner, b: Learner) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
};

const loadProgressInput = async (cls: ClassRow): Promise<ProgressInput> => {
  const [units, learners, sessionsRes] = await Promise.all([
    resolveCurriculumId(cls).then(loadCurriculum),
    getClassLearners(cls.id),
    supabase.from('lesson_sessions').select('id, session_date, created_at, notes').eq('class_id', cls.id),
  ]);
  if (sessionsRes.error) throw sessionsRes.error;
  const sessions = (sessionsRes.data || []) as Session[];
  const sessionIds = sessions.map((s) => s.id);

  if (sessionIds.length === 0) {
    return { units, learners, sessions, sessionActivities: [], attendance: [], results: [] };
  }

  const [sa, att, res] = await Promise.all([
    supabase.from('lesson_session_activities').select('session_id, activity_id').in('session_id', sessionIds),
    supabase.from('lesson_attendance').select('session_id, learner_id, present, note').in('session_id', sessionIds),
    supabase.from('learner_activity_results').select('session_id, learner_id, activity_id, mode, level').in('session_id', sessionIds),
  ]);
  for (const r of [sa, att, res]) if (r.error) throw r.error;

  return {
    units,
    learners,
    sessions,
    sessionActivities: (sa.data || []) as SessionActivity[],
    attendance: (att.data || []) as Attendance[],
    results: (res.data || []) as Result[],
  };
};

// ---------------------------------------------------------------------------
// Curriculum
// ---------------------------------------------------------------------------

/** GET /api/tracking/classes/:classId/curriculum */
export const getClassCurriculum = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId);
    const curriculumId = await resolveCurriculumId(cls);
    const [{ data: curriculum }, units] = await Promise.all([
      supabase.from('curricula').select('id, slug, title, description').eq('id', curriculumId).single(),
      loadCurriculum(curriculumId),
    ]);
    res.status(200).json({ success: true, data: { curriculum, units } });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

/** GET /api/tracking/classes/:classId/learners */
export const listLearners = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId);
    res.status(200).json({ success: true, data: await getClassLearners(cls.id) });
  } catch (error) {
    next(error);
  }
};

/** POST /api/tracking/classes/:classId/learners  { firstName, lastName } */
export const addLearner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId, true);
    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();

    const { data: learner, error } = await supabase
      .from('learners')
      .insert({ first_name: firstName, last_name: lastName, school_id: cls.school_id, created_by: req.user!.userId })
      .select('id, first_name, last_name')
      .single();
    if (error) throw error;

    const { error: enrollError } = await supabase.from('class_learners').insert({ class_id: cls.id, learner_id: learner.id });
    if (enrollError) throw enrollError;

    res.status(201).json({ success: true, data: learner });
  } catch (error) {
    next(error);
  }
};

const assertLearnerInClass = async (classId: string, learnerId: string) => {
  const { data } = await supabase
    .from('class_learners')
    .select('id')
    .eq('class_id', classId)
    .eq('learner_id', learnerId)
    .single();
  if (!data) throw new AppError('Child not found in this class', 404);
};

/** PATCH /api/tracking/classes/:classId/learners/:learnerId  { firstName, lastName } */
export const updateLearner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId, true);
    await assertLearnerInClass(cls.id, req.params.learnerId);

    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (req.body.firstName !== undefined) update.first_name = String(req.body.firstName).trim();
    if (req.body.lastName !== undefined) update.last_name = String(req.body.lastName).trim();

    const { data, error } = await supabase
      .from('learners')
      .update(update)
      .eq('id', req.params.learnerId)
      .select('id, first_name, last_name')
      .single();
    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tracking/classes/:classId/learners/:learnerId
 * Removes the child from the class. Their past results are kept.
 */
export const removeLearner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId, true);
    await assertLearnerInClass(cls.id, req.params.learnerId);

    const { error } = await supabase
      .from('class_learners')
      .delete()
      .eq('class_id', cls.id)
      .eq('learner_id', req.params.learnerId);
    if (error) throw error;

    const { count } = await supabase
      .from('class_learners')
      .select('id', { count: 'exact', head: true })
      .eq('learner_id', req.params.learnerId);
    if (!count) {
      await supabase.from('learners').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', req.params.learnerId);
    }

    res.status(200).json({ success: true, message: 'Child removed from class' });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

/** GET /api/tracking/classes/:classId/sessions */
export const listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId);
    const input = await loadProgressInput(cls);
    const sessions = [...input.sessions]
      .sort((a, b) => (b.session_date + b.created_at).localeCompare(a.session_date + a.created_at))
      .map((s) => {
        const att = input.attendance.filter((a) => a.session_id === s.id);
        return {
          id: s.id,
          date: s.session_date,
          notes: s.notes || null,
          activityCount: input.sessionActivities.filter((sa) => sa.session_id === s.id).length,
          presentCount: att.filter((a) => a.present).length,
          learnerCount: att.length,
        };
      });
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

/** GET /api/tracking/classes/:classId/sessions/:sessionId */
export const getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId);
    const { data: session } = await supabase
      .from('lesson_sessions')
      .select('id, session_date, notes, created_at')
      .eq('id', req.params.sessionId)
      .eq('class_id', cls.id)
      .single();
    if (!session) throw new AppError('Lesson not found', 404);

    const [sa, att, results] = await Promise.all([
      supabase.from('lesson_session_activities').select('activity_id').eq('session_id', session.id),
      supabase.from('lesson_attendance').select('learner_id, present, note').eq('session_id', session.id),
      supabase.from('learner_activity_results').select('learner_id, activity_id, mode, level').eq('session_id', session.id),
    ]);

    res.status(200).json({
      success: true,
      data: {
        id: session.id,
        date: session.session_date,
        notes: session.notes,
        activityIds: (sa.data || []).map((r) => r.activity_id),
        attendance: (att.data || []).map((a) => ({ learnerId: a.learner_id, present: a.present, note: a.note })),
        results: (results.data || []).map((r) => ({ learnerId: r.learner_id, activityId: r.activity_id, mode: r.mode, level: r.level })),
      },
    });
  } catch (error) {
    next(error);
  }
};

interface LessonBody {
  date: string;
  notes?: string;
  activityIds: string[];
  attendance: { learnerId: string; present: boolean; note?: string }[];
  results: { learnerId: string; activityId: string; mode: Mode; level: number }[];
}

/** Check a lesson against the class roster and curriculum before saving. */
const validateLesson = async (cls: ClassRow, body: LessonBody) => {
  const units = await loadCurriculum(await resolveCurriculumId(cls));
  const activities = new Map(units.flatMap((u) => u.activities).map((a) => [a.id, a]));
  const learnerIds = new Set((await getClassLearners(cls.id)).map((l) => l.id));

  const activityIds = [...new Set(body.activityIds)];
  if (activityIds.length === 0) throw new AppError('Choose at least one activity for this lesson', 400);
  for (const id of activityIds) {
    if (!activities.has(id)) throw new AppError('One of the activities is not in this class\'s book', 400);
  }
  const covered = new Set(activityIds);

  const attendance = new Map<string, { present: boolean; note?: string }>();
  for (const a of body.attendance || []) {
    if (!learnerIds.has(a.learnerId)) throw new AppError('One of the children is not in this class', 400);
    attendance.set(a.learnerId, { present: a.present !== false, note: a.note?.slice(0, 500) });
  }

  const results = new Map<string, LessonBody['results'][number]>();
  for (const r of body.results || []) {
    if (!learnerIds.has(r.learnerId)) throw new AppError('One of the children is not in this class', 400);
    if (!covered.has(r.activityId)) throw new AppError('A rating was given for an activity not covered in this lesson', 400);
    if (!activities.get(r.activityId)!.modes.includes(r.mode)) throw new AppError('A rating was given for the wrong activity type', 400);
    if (![1, 2, 3].includes(Number(r.level))) throw new AppError('Ratings must be Not yet, With help or On their own', 400);
    // Absent children are not rated
    if (attendance.get(r.learnerId)?.present === false) continue;
    results.set(`${r.learnerId}|${r.activityId}|${r.mode}`, { ...r, level: Number(r.level) });
  }

  return {
    activity_ids: activityIds,
    attendance: [...attendance.entries()].map(([learner_id, a]) => ({ learner_id, present: a.present, note: a.note || null })),
    results: [...results.values()].map((r) => ({ learner_id: r.learnerId, activity_id: r.activityId, mode: r.mode, level: r.level })),
  };
};

const saveLesson = async (req: Request, res: Response, next: NextFunction, sessionId?: string) => {
  try {
    const cls = await getClassForUser(req, req.params.classId, true);
    const body = req.body as LessonBody;
    const payload = await validateLesson(cls, body);

    const { data, error } = await supabase.rpc('save_lesson_session', {
      payload: {
        session_id: sessionId || null,
        class_id: cls.id,
        teacher_id: req.user!.userId,
        session_date: body.date,
        notes: body.notes?.slice(0, 2000) || null,
        ...payload,
      },
    });
    if (error) {
      if (error.message?.includes('Lesson not found')) throw new AppError('Lesson not found', 404);
      throw error;
    }

    res.status(sessionId ? 200 : 201).json({ success: true, data: { id: data } });
  } catch (error) {
    next(error);
  }
};

/** POST /api/tracking/classes/:classId/sessions */
export const createSession = (req: Request, res: Response, next: NextFunction) => saveLesson(req, res, next);

/** PUT /api/tracking/classes/:classId/sessions/:sessionId */
export const updateSession = (req: Request, res: Response, next: NextFunction) =>
  saveLesson(req, res, next, req.params.sessionId);

/** DELETE /api/tracking/classes/:classId/sessions/:sessionId */
export const deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId, true);
    const { data, error } = await supabase
      .from('lesson_sessions')
      .delete()
      .eq('id', req.params.sessionId)
      .eq('class_id', cls.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) throw new AppError('Lesson not found', 404);
    res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------

/** GET /api/tracking/classes/:classId/progress */
export const getClassProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId);
    const progress = computeClassProgress(await loadProgressInput(cls));
    res.status(200).json({ success: true, data: { class: { id: cls.id, name: cls.name }, ...progress } });
  } catch (error) {
    next(error);
  }
};

/** GET /api/tracking/classes/:classId/learners/:learnerId/progress */
export const getLearnerProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cls = await getClassForUser(req, req.params.classId);
    await assertLearnerInClass(cls.id, req.params.learnerId);
    const input = await loadProgressInput(cls);
    if (!input.learners.some((l) => l.id === req.params.learnerId)) {
      throw new AppError('Child not found in this class', 404);
    }
    const progress = computeLearnerProgress(input, req.params.learnerId);
    res.status(200).json({ success: true, data: { class: { id: cls.id, name: cls.name }, ...progress } });
  } catch (error) {
    next(error);
  }
};

interface OverviewRow {
  classId: string;
  className: string;
  schoolId: string | null;
  schoolName: string | null;
  teacherId: string;
  teacherName: string | null;
  learnerCount: number;
  lessonCount: number;
  lastLessonDate: string | null;
  activitiesCovered: number;
  activitiesTotal: number;
  coveragePercent: number | null;
  avgScore: number | null;
  independentRate: number | null;
  practicalScore: number | null;
  bookScore: number | null;
  attendanceRate: number | null;
}

/**
 * GET /api/tracking/overview?schoolId=
 * One row per class across schools (school admins: their school only),
 * plus a roll-up per school.
 */
export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let schoolId = (req.query.schoolId as string) || null;
    if (req.user?.role === 'school_admin') {
      schoolId = await getAdminSchoolId(req.user.userId);
      if (!schoolId) throw new AppError('Your account is not linked to a school', 403);
    }

    const { data: classes, error } = await supabase.rpc('class_progress_overview', { p_school_id: schoolId });
    if (error) throw error;

    const rows: OverviewRow[] = (classes || []).map((c: any) => ({
      classId: c.class_id,
      className: c.class_name,
      schoolId: c.school_id,
      schoolName: c.school_name,
      teacherId: c.teacher_id,
      teacherName: c.teacher_name,
      learnerCount: Number(c.learner_count),
      lessonCount: Number(c.lesson_count),
      lastLessonDate: c.last_lesson_date,
      activitiesCovered: Number(c.activities_covered),
      activitiesTotal: Number(c.activities_total),
      coveragePercent: c.activities_total ? Math.round((Number(c.activities_covered) / Number(c.activities_total)) * 100) : null,
      avgScore: c.avg_level === null ? null : Math.round(((Number(c.avg_level) - 1) / 2) * 100),
      independentRate: c.independent_rate === null ? null : Math.round(Number(c.independent_rate) * 100),
      practicalScore: c.practical_avg === null ? null : Math.round(((Number(c.practical_avg) - 1) / 2) * 100),
      bookScore: c.book_avg === null ? null : Math.round(((Number(c.book_avg) - 1) / 2) * 100),
      attendanceRate: c.attendance_rate === null ? null : Math.round(Number(c.attendance_rate) * 100),
    }));

    const avgOf = (vals: (number | null)[]) => {
      const v = vals.filter((x): x is number => x !== null);
      return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
    };

    const bySchool = new Map<string, OverviewRow[]>();
    for (const r of rows) {
      const key = r.schoolId || 'none';
      bySchool.set(key, [...(bySchool.get(key) || []), r]);
    }
    const schools = [...bySchool.entries()].map(([id, cs]) => ({
      schoolId: id === 'none' ? null : id,
      schoolName: cs[0].schoolName || 'No school',
      classCount: cs.length,
      learnerCount: cs.reduce((a, c) => a + c.learnerCount, 0),
      lessonCount: cs.reduce((a, c) => a + c.lessonCount, 0),
      lastLessonDate: cs.map((c) => c.lastLessonDate).filter(Boolean).sort().pop() || null,
      coveragePercent: avgOf(cs.map((c) => c.coveragePercent)),
      avgScore: avgOf(cs.map((c) => c.avgScore)),
      independentRate: avgOf(cs.map((c) => c.independentRate)),
      practicalScore: avgOf(cs.map((c) => c.practicalScore)),
      bookScore: avgOf(cs.map((c) => c.bookScore)),
      attendanceRate: avgOf(cs.map((c) => c.attendanceRate)),
    }));

    res.status(200).json({ success: true, data: { schools, classes: rows } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tracking/my-classes
 * Every class the signed-in teacher teaches, with headline progress, a
 * lesson-by-lesson trend and the children who need attention.
 */
export const getMyClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, name, teacher_id, school_id, curriculum_id')
      .eq('teacher_id', req.user!.userId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const summaries = await Promise.all(
      (classes || []).map(async (cls: ClassRow) => {
        const progress = computeClassProgress(await loadProgressInput(cls));
        return {
          classId: cls.id,
          name: cls.name,
          ...progress.summary,
          trend: progress.trend.map((t) => ({ date: t.date, independentRate: t.independentRate })),
          needsAttention: progress.needsAttention.map((l) => ({ learnerId: l.learnerId, name: l.name, flags: l.flags })),
        };
      })
    );

    const needsAttention = summaries
      .flatMap((c) => c.needsAttention.map((l) => ({ ...l, classId: c.classId, className: c.name })))
      .sort((a, b) => b.flags.length - a.flags.length)
      .slice(0, 5);

    res.status(200).json({ success: true, data: { classes: summaries, needsAttention } });
  } catch (error) {
    next(error);
  }
};
