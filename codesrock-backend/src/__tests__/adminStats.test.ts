/**
 * Admin statistics tests
 */

import {
  activationFunnel, followUps, rankSchools, summarizeCourses, summarizeSchools, summarizeTeachers, teacherStatus, weekStart, weeklyLessons, Platform,
} from '../services/adminStats';

const NOW = new Date('2026-10-22T12:00:00Z').getTime();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

// Fixture data only needs the fields the summaries read
const platform = (): Platform => ({
  schools: [
    { id: 'busy', name: 'Busy School', school_code: 'SCH-1', is_active: true },
    { id: 'quiet', name: 'Quiet School', school_code: 'SCH-2', is_active: true },
  ],
  teachers: [
    { id: 't1', first_name: 'Ama', last_name: 'A', email: 'a@x', school_id: 'busy', last_login: daysAgo(2), created_at: daysAgo(90) },
    { id: 't2', first_name: 'Kofi', last_name: 'K', email: 'k@x', school_id: 'busy', last_login: daysAgo(45), created_at: daysAgo(90) },
    { id: 't3', first_name: 'Esi', last_name: 'E', email: 'e@x', school_id: 'quiet', last_login: null, created_at: daysAgo(10) },
  ],
  activeVideos: [
    { id: 'v1', course_id: 'c1', courses: { title: 'Codesrock 1 ' } },
    { id: 'v2', course_id: 'c1', courses: { title: 'Codesrock 1 ' } },
  ],
  activeVideoIds: new Set(['v1', 'v2']),
  videoProgress: [
    { user_id: 't1', video_id: 'v1', course_id: 'c1', completed: true },
    { user_id: 't1', video_id: 'v2', course_id: 'c1', completed: true },
    { user_id: 't2', video_id: 'v1', course_id: 'c1', completed: false },
    // an inactive video is ignored
    { user_id: 't2', video_id: 'old', course_id: 'c1', completed: true },
  ],
  evalProgress: [
    { user_id: 't1', passed: true },
    { user_id: 't2', passed: false },
  ],
  classes: [{ id: 'k1', teacher_id: 't1', school_id: 'busy' }],
  classOverview: [
    {
      class_id: 'k1', school_id: 'busy', learner_count: 12, lesson_count: 4, last_lesson_date: '2026-10-20',
      activities_covered: 25, activities_total: 100, independent_rate: '0.700',
    },
  ],
  learners: Array.from({ length: 12 }, (_, i) => ({ id: `l${i}`, school_id: 'busy' })),
} as unknown as Platform);

describe('teacherStatus', () => {
  it('classifies logins against a 30-day window', () => {
    expect(teacherStatus(null, NOW)).toBe('never_logged_in');
    expect(teacherStatus(daysAgo(5), NOW)).toBe('active');
    expect(teacherStatus(daysAgo(31), NOW)).toBe('inactive');
  });
});

describe('summarizeTeachers', () => {
  it('counts only completed, active videos and passed quizzes', () => {
    const [ama, kofi, esi] = summarizeTeachers(platform(), NOW);
    expect(ama).toMatchObject({ status: 'active', videosCompleted: 2, quizzesPassed: 1, classCount: 1, learnerCount: 12, lessonCount: 4 });
    expect(kofi).toMatchObject({ status: 'inactive', videosCompleted: 0, quizzesPassed: 0, classCount: 0 });
    expect(esi.status).toBe('never_logged_in');
  });
});

describe('summarizeSchools', () => {
  it('rolls teachers and classes up per school, with null when nothing is measured', () => {
    const p = platform();
    const schools = summarizeSchools(p, summarizeTeachers(p, NOW));
    const busy = schools.find((s) => s.id === 'busy')!;
    const quiet = schools.find((s) => s.id === 'quiet')!;
    expect(busy).toMatchObject({ teacherCount: 2, activeTeachers: 1, classCount: 1, learnerCount: 12, lessonCount: 4, coveragePercent: 25, independentRate: 70 });
    expect(quiet).toMatchObject({ teacherCount: 1, neverLoggedIn: 1, classCount: 0, coveragePercent: null, independentRate: null });
  });

  it('ranks schools by lessons logged first', () => {
    const p = platform();
    const ranked = rankSchools(summarizeSchools(p, summarizeTeachers(p, NOW)));
    expect(ranked.map((s) => s.id)).toEqual(['busy', 'quiet']);
  });
});

describe('summarizeCourses', () => {
  it('reports how far teachers who started a course have got', () => {
    const [c1] = summarizeCourses(platform());
    // Ama 2/2 = 100%, Kofi 0/2 = 0% -> average 50
    expect(c1).toMatchObject({ title: 'Codesrock 1', videosTotal: 2, teachersStarted: 2, teachersCompleted: 1, avgCompletion: 50 });
  });
});

describe('activationFunnel', () => {
  it('only counts teachers who reached every earlier step', () => {
    const funnel = activationFunnel(summarizeTeachers(platform(), NOW), NOW);
    const counts = Object.fromEntries(funnel.map((f) => [f.key, f.count]));
    // Ama: logged in, training, quiz, class, lessons (last 2 days ago) -> all steps
    // Kofi: logged in, started training, no quiz; Esi: never logged in
    expect(counts).toEqual({
      invited: 3, loggedIn: 2, startedTraining: 2, passedQuiz: 1, createdClass: 1, loggedLesson: 1, loggingRegularly: 1,
    });
    expect(funnel[1].percent).toBe(67);
  });

  it('returns null percentages when there are no teachers', () => {
    expect(activationFunnel([], NOW)[0]).toMatchObject({ count: 0, percent: null });
  });
});

describe('followUps', () => {
  it('lists the things an admin should act on, most urgent first', () => {
    const p = platform();
    // Kofi's account is old enough to be flagged for having no class
    const items = followUps(p, summarizeTeachers(p, NOW), NOW);
    expect(items.map((i) => i.type)).toEqual(['school_no_classes', 'never_logged_in', 'no_class']);
    expect(items[0]).toMatchObject({ schoolId: 'quiet' });
    expect(items[1]).toMatchObject({ teacherId: 't3', days: 10 });
    expect(items[2]).toMatchObject({ teacherId: 't2' });
  });

  it('gives new teachers a few days before flagging them', () => {
    const p = platform();
    (p.teachers as any[])[2].created_at = daysAgo(1);
    const items = followUps(p, summarizeTeachers(p, NOW), NOW);
    expect(items.some((i) => i.type === 'never_logged_in')).toBe(false);
  });

  it('flags quiet classes and classes that never logged a lesson', () => {
    const p = platform();
    p.classOverview.push(
      { class_id: 'k2', class_name: 'KG2', school_id: 'busy', school_name: 'Busy School', learner_count: 8, last_lesson_date: null },
      { class_id: 'k3', class_name: 'KG3', school_id: 'busy', school_name: 'Busy School', learner_count: 8, last_lesson_date: daysAgo(20).slice(0, 10) },
      // empty classes are not flagged
      { class_id: 'k4', class_name: 'Empty', school_id: 'busy', school_name: 'Busy School', learner_count: 0, last_lesson_date: null }
    );
    const types = followUps(p, summarizeTeachers(p, NOW), NOW).map((i) => `${i.type}:${i.classId || ''}`);
    expect(types).toEqual(expect.arrayContaining(['class_never_logged:k2', 'class_quiet:k3']));
    expect(types.some((t) => t.endsWith(':k4'))).toBe(false);
  });
});

describe('weeklyLessons', () => {
  it('buckets lessons into Monday-start weeks, including empty weeks', () => {
    expect(weekStart('2026-10-22')).toBe('2026-10-19'); // Thursday -> Monday
    const weeks = weeklyLessons(
      [
        { class_id: 'a', session_date: '2026-10-20' },
        { class_id: 'b', session_date: '2026-10-21' },
        { class_id: 'a', session_date: '2026-10-13' },
      ],
      3,
      NOW
    );
    expect(weeks).toEqual([
      { weekStart: '2026-10-05', lessons: 0, classes: 0 },
      { weekStart: '2026-10-12', lessons: 1, classes: 1 },
      { weekStart: '2026-10-19', lessons: 2, classes: 2 },
    ]);
  });
});
