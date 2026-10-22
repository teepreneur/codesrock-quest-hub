/**
 * Admin statistics tests
 */

import { rankSchools, summarizeCourses, summarizeSchools, summarizeTeachers, teacherStatus, Platform } from '../services/adminStats';

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
