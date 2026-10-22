/**
 * Tracking API tests: access rules and lesson validation
 */

import request from 'supertest';

type Row = Record<string, any>;

const TEACHER = '11111111-1111-4111-8111-111111111111';
const OTHER_TEACHER = '22222222-2222-4222-8222-222222222222';
const SCHOOL_ADMIN = '33333333-3333-4333-8333-333333333333';
const OTHER_SCHOOL_ADMIN = '44444444-4444-4444-8444-444444444444';
const SCHOOL = '55555555-5555-4555-8555-555555555555';
const OTHER_SCHOOL = '66666666-6666-4666-8666-666666666666';
const CLASS = '77777777-7777-4777-8777-777777777777';
const CURRICULUM = '88888888-8888-4888-8888-888888888888';
const UNIT = '99999999-9999-4999-8999-999999999999';
const SONG = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MAT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const AMA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const KOJO = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const users: Record<string, Row> = {
  'teacher-token': { id: TEACHER, role: 'teacher', school_id: SCHOOL },
  'other-teacher-token': { id: OTHER_TEACHER, role: 'teacher', school_id: SCHOOL },
  'school-admin-token': { id: SCHOOL_ADMIN, role: 'school_admin', school_id: SCHOOL },
  'other-school-admin-token': { id: OTHER_SCHOOL_ADMIN, role: 'school_admin', school_id: OTHER_SCHOOL },
};

let db: Record<string, Row[]>;
let rpcCalls: { name: string; args: any }[];

const resetDb = () => {
  db = {
    profiles: Object.values(users).map((u) => ({ ...u, email: `${u.id}@x.org`, is_active: true, first_name: 'T', last_name: 'T' })),
    classes: [{ id: CLASS, name: 'KG1', teacher_id: TEACHER, school_id: SCHOOL, curriculum_id: CURRICULUM }],
    curricula: [{ id: CURRICULUM, slug: 'codesrock-1-activity-book', title: 'CodesRock 1' }],
    curriculum_units: [{
      id: UNIT, curriculum_id: CURRICULUM, position: 1, title: 'Unit', unit_type: 'song', book_pages: '1', summary: null,
      curriculum_activities: [
        { id: SONG, unit_id: UNIT, position: 1, title: 'Sing', book_page: 1, skills: ['vocabulary'], modes: ['practical'] },
        { id: MAT, unit_id: UNIT, position: 2, title: 'Mat 1', book_page: 2, skills: ['sequencing'], modes: ['practical', 'book'] },
      ],
    }],
    class_learners: [
      { id: 'cl1', class_id: CLASS, learner_id: AMA, learners: { id: AMA, first_name: 'Ama', last_name: 'M', is_active: true } },
      { id: 'cl2', class_id: CLASS, learner_id: KOJO, learners: { id: KOJO, first_name: 'Kojo', last_name: 'A', is_active: true } },
    ],
    lesson_sessions: [],
    lesson_session_activities: [],
    lesson_attendance: [],
    learner_activity_results: [],
  };
  rpcCalls = [];
};

const query = (table: string) => {
  const filters: [string, any][] = [];
  const result = (single: boolean) => {
    const rows = (db[table] || []).filter((r) => filters.every(([k, v]) => (Array.isArray(v) ? v.includes(r[k]) : r[k] === v)));
    if (single) return rows[0] ? { data: rows[0], error: null } : { data: null, error: { code: 'PGRST116' } };
    return { data: rows, error: null, count: rows.length };
  };
  const builder: any = {
    select: () => builder,
    eq: (k: string, v: any) => { filters.push([k, v]); return builder; },
    in: (k: string, v: any[]) => { filters.push([k, v]); return builder; },
    order: () => builder,
    single: () => Promise.resolve(result(true)),
    then: (res: any, rej: any) => Promise.resolve(result(false)).then(res, rej),
  };
  return builder;
};

const fakeClient = {
  from: query,
  rpc: (name: string, args: any) => {
    rpcCalls.push({ name, args });
    return Promise.resolve({ data: 'new-session-id', error: null });
  },
  auth: {
    getUser: (token: string) =>
      Promise.resolve(users[token] ? { data: { user: { id: users[token].id } }, error: null } : { data: { user: null }, error: {} }),
  },
};

jest.mock('../config/supabase', () => ({ supabase: fakeClient, createAuthClient: () => fakeClient }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../app').default;

const as = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeEach(resetDb);

describe('Class access', () => {
  it('lets the class teacher see progress', async () => {
    const res = await request(app).get(`/api/tracking/classes/${CLASS}/progress`).set(as('teacher-token'));
    expect(res.status).toBe(200);
    expect(res.body.data.summary.learnerCount).toBe(2);
  });

  it('blocks another teacher', async () => {
    const res = await request(app).get(`/api/tracking/classes/${CLASS}/progress`).set(as('other-teacher-token'));
    expect(res.status).toBe(403);
  });

  it('lets the school admin of the same school see the class, not others', async () => {
    expect((await request(app).get(`/api/tracking/classes/${CLASS}/progress`).set(as('school-admin-token'))).status).toBe(200);
    expect((await request(app).get(`/api/tracking/classes/${CLASS}/progress`).set(as('other-school-admin-token'))).status).toBe(403);
  });

  it('keeps the admin overview to admins', async () => {
    expect((await request(app).get('/api/tracking/overview').set(as('teacher-token'))).status).toBe(403);
  });

  it('scopes the overview to the school admin\'s own school', async () => {
    await request(app).get(`/api/tracking/overview?schoolId=${OTHER_SCHOOL}`).set(as('school-admin-token'));
    expect(rpcCalls[0]).toEqual({ name: 'class_progress_overview', args: { p_school_id: SCHOOL } });
  });
});

describe('Logging a lesson', () => {
  const lesson = (overrides: Row = {}) => ({
    date: '2026-10-20',
    activityIds: [SONG, MAT],
    attendance: [
      { learnerId: AMA, present: true },
      { learnerId: KOJO, present: false },
    ],
    results: [
      { learnerId: AMA, activityId: SONG, mode: 'practical', level: 3 },
      { learnerId: AMA, activityId: MAT, mode: 'practical', level: 3 },
      { learnerId: AMA, activityId: MAT, mode: 'book', level: 2 },
      { learnerId: KOJO, activityId: SONG, mode: 'practical', level: 1 },
    ],
    ...overrides,
  });

  it('saves the lesson for the logged-in teacher and skips absent children', async () => {
    const res = await request(app).post(`/api/tracking/classes/${CLASS}/sessions`).set(as('teacher-token')).send(lesson());
    expect(res.status).toBe(201);
    const payload = rpcCalls[0].args.payload;
    expect(payload.teacher_id).toBe(TEACHER);
    expect(payload.results).toHaveLength(3);
    expect(payload.results.some((r: Row) => r.learner_id === KOJO)).toBe(false);
  });

  it('rejects a book rating for a practical-only activity', async () => {
    const res = await request(app).post(`/api/tracking/classes/${CLASS}/sessions`).set(as('teacher-token')).send(
      lesson({ results: [{ learnerId: AMA, activityId: SONG, mode: 'book', level: 3 }] })
    );
    expect(res.status).toBe(400);
    expect(rpcCalls).toHaveLength(0);
  });

  it('rejects children who are not in the class', async () => {
    const res = await request(app).post(`/api/tracking/classes/${CLASS}/sessions`).set(as('teacher-token')).send(
      lesson({ attendance: [{ learnerId: OTHER_TEACHER, present: true }] })
    );
    expect(res.status).toBe(400);
  });

  it('rejects ratings outside 1-3', async () => {
    const res = await request(app).post(`/api/tracking/classes/${CLASS}/sessions`).set(as('teacher-token')).send(
      lesson({ results: [{ learnerId: AMA, activityId: SONG, mode: 'practical', level: 5 }] })
    );
    expect(res.status).toBe(422);
  });

  it('blocks another teacher from logging lessons for this class', async () => {
    const res = await request(app).post(`/api/tracking/classes/${CLASS}/sessions`).set(as('other-teacher-token')).send(lesson());
    expect(res.status).toBe(403);
  });
});
