/**
 * Progress analytics tests
 */

import { computeClassProgress, computeLearnerProgress, ProgressInput, Result } from '../services/progressAnalytics';

const units: ProgressInput['units'] = [
  {
    id: 'u1', position: 1, title: 'Algorithm Song', unit_type: 'song', book_pages: '1-12', summary: null,
    activities: [
      { id: 'sing', unit_id: 'u1', position: 1, title: 'Sing', book_page: 1, skills: ['vocabulary'], modes: ['practical'] },
      { id: 'trace', unit_id: 'u1', position: 2, title: 'Word tracing', book_page: 4, skills: ['vocabulary'], modes: ['book'] },
    ],
  },
  {
    id: 'u9', position: 9, title: "Let's go code", unit_type: 'unplugged', book_pages: '79-100', summary: null,
    activities: [
      { id: 'mat1', unit_id: 'u9', position: 1, title: '2-mat mission 1', book_page: 84, skills: ['sequencing', 'collaboration'], modes: ['practical', 'book'] },
      { id: 'mat2', unit_id: 'u9', position: 2, title: '3-mat mission 1', book_page: 85, skills: ['sequencing', 'collaboration'], modes: ['practical', 'book'] },
      { id: 'mat3', unit_id: 'u9', position: 3, title: '3-mat mission 2', book_page: 85, skills: ['sequencing'], modes: ['practical', 'book'] },
    ],
  },
];

const learners = [
  { id: 'ama', first_name: 'Ama', last_name: 'Mensah' },
  { id: 'kojo', first_name: 'Kojo', last_name: 'Asante' },
];

const sessions = [
  { id: 's1', session_date: '2026-10-01', created_at: '2026-10-01T10:00:00Z' },
  { id: 's2', session_date: '2026-10-08', created_at: '2026-10-08T10:00:00Z' },
];

const r = (session_id: string, learner_id: string, activity_id: string, mode: 'practical' | 'book', level: 1 | 2 | 3): Result =>
  ({ session_id, learner_id, activity_id, mode, level });

const baseInput = (): ProgressInput => ({
  units,
  learners,
  sessions: sessions.map((s) => ({ ...s })),
  sessionActivities: [
    { session_id: 's1', activity_id: 'sing' },
    { session_id: 's1', activity_id: 'trace' },
    { session_id: 's2', activity_id: 'mat1' },
    { session_id: 's2', activity_id: 'mat2' },
  ],
  attendance: [
    { session_id: 's1', learner_id: 'ama', present: true },
    { session_id: 's1', learner_id: 'kojo', present: true },
    { session_id: 's2', learner_id: 'ama', present: true },
    { session_id: 's2', learner_id: 'kojo', present: true },
  ],
  results: [
    r('s1', 'ama', 'sing', 'practical', 3),
    r('s1', 'ama', 'trace', 'book', 2),
    r('s1', 'kojo', 'sing', 'practical', 1),
    r('s1', 'kojo', 'trace', 'book', 1),
    // Kojo can do the mats but struggles to write the code in the book
    r('s2', 'kojo', 'mat1', 'practical', 3),
    r('s2', 'kojo', 'mat1', 'book', 1),
    r('s2', 'kojo', 'mat2', 'practical', 3),
    r('s2', 'kojo', 'mat2', 'book', 1),
    r('s2', 'ama', 'mat1', 'practical', 3),
    r('s2', 'ama', 'mat1', 'book', 3),
  ],
});

describe('computeClassProgress', () => {
  it('reports coverage of the book', () => {
    const p = computeClassProgress(baseInput());
    expect(p.summary).toMatchObject({ activitiesCovered: 4, activitiesTotal: 5, coveragePercent: 80, lessonCount: 2 });
    expect(p.units.find((u) => u.unitId === 'u9')).toMatchObject({ activitiesCovered: 2, activitiesTotal: 3 });
  });

  it('suggests the next activities not yet covered, in book order', () => {
    expect(computeClassProgress(baseInput()).nextActivityIds).toEqual(['mat3']);
  });

  it('uses the most recent rating when an activity is rated again', () => {
    const input = baseInput();
    input.sessions.push({ id: 's3', session_date: '2026-10-15', created_at: '2026-10-15T10:00:00Z' });
    input.results.push(r('s3', 'kojo', 'trace', 'book', 3));
    const kojo = computeLearnerProgress(input, 'kojo');
    const u1 = kojo.units.find((u) => u.unitId === 'u1')!;
    // sing = Not yet (0), trace now On their own (100) -> 50
    expect(u1.avgScore).toBe(50);
  });

  it('measures the practical-to-book gap', () => {
    const p = computeClassProgress(baseInput());
    const kojo = p.learners.find((l) => l.learnerId === 'kojo')!;
    expect(kojo).toMatchObject({ practicalScore: 100, bookScore: 0, modeGap: 100 });
    expect(p.modeGap.pairedCount).toBe(3);
  });

  it('flags children who need attention', () => {
    const p = computeClassProgress(baseInput());
    const kojo = p.learners.find((l) => l.learnerId === 'kojo')!;
    const ama = p.learners.find((l) => l.learnerId === 'ama')!;
    expect(kojo.flags).toEqual(expect.arrayContaining(['repeated_not_yet', 'book_gap']));
    expect(ama.flags).toEqual([]);
    expect(p.needsAttention.map((l) => l.learnerId)).toEqual(['kojo']);
  });

  it('flags low attendance over recent lessons', () => {
    const input = baseInput();
    for (let i = 3; i <= 5; i++) {
      input.sessions.push({ id: `s${i}`, session_date: `2026-10-${10 + i}`, created_at: `2026-10-${10 + i}T10:00:00Z` });
      input.attendance.push({ session_id: `s${i}`, learner_id: 'ama', present: false });
    }
    const ama = computeClassProgress(input).learners.find((l) => l.learnerId === 'ama')!;
    expect(ama.flags).toContain('low_attendance');
  });

  it('gives skill scores from tagged activities', () => {
    const p = computeClassProgress(baseInput());
    const collaboration = p.skills.find((s) => s.skill === 'collaboration')!;
    // mat ratings: kojo P3 B1, mat2 P3 B1, ama P3 B3 -> 4x100, 2x0 = 66.7
    expect(collaboration.avgScore).toBe(67);
    expect(p.skills.find((s) => s.skill === 'debugging')!.avgScore).toBeNull();
  });

  it('builds a lesson-by-lesson trend', () => {
    const p = computeClassProgress(baseInput());
    expect(p.trend.map((t) => t.date)).toEqual(['2026-10-01', '2026-10-08']);
    expect(p.trend[0]).toMatchObject({ attendanceRate: 100, independentRate: 25 });
  });

  it('leaves children who were removed from the class out of class figures', () => {
    const input = baseInput();
    input.learners = input.learners.filter((l) => l.id !== 'kojo');
    const p = computeClassProgress(input);
    // Ama only: sing 3, trace 2, mat1 P3 B3 -> 3 of 4 on their own
    expect(p.summary.independentRate).toBe(75);
    expect(p.summary.attendanceRate).toBe(100);
  });

  it('handles a class with no lessons yet', () => {
    const p = computeClassProgress({ ...baseInput(), sessions: [], sessionActivities: [], attendance: [], results: [] });
    expect(p.summary).toMatchObject({ lessonCount: 0, activitiesCovered: 0, avgScore: null, lastLessonDate: null });
    expect(p.needsAttention).toEqual([]);
    expect(p.nextActivityIds).toEqual(['sing', 'trace', 'mat1', 'mat2', 'mat3']);
  });
});

describe('computeLearnerProgress', () => {
  it('lists activities where the child did better with the tools than in the book', () => {
    const kojo = computeLearnerProgress(baseInput(), 'kojo');
    expect(kojo.transferGaps.map((g) => g.activityId).sort()).toEqual(['mat1', 'mat2']);
    expect(kojo.timeline).toHaveLength(2);
    expect(kojo.timeline[1].results).toHaveLength(4);
  });
});
