/**
 * Security regression tests
 * Run the real Express app against an in-memory fake of the Supabase client.
 */

import request from 'supertest';

type Row = Record<string, any>;

const db: Record<string, Row[]> = {};
const users: Record<string, { id: string }> = {};
const calls = { getUser: 0, rpc: [] as string[] };

const TEACHER = '11111111-1111-4111-8111-111111111111';
const CONTENT_ADMIN = '22222222-2222-4222-8222-222222222222';
const SCHOOL_ADMIN = '33333333-3333-4333-8333-333333333333';
const OTHER_USER = '44444444-4444-4444-8444-444444444444';
const SCHOOL = '55555555-5555-4555-8555-555555555555';
const EVALUATION = '66666666-6666-4666-8666-666666666666';
const TOPIC = '77777777-7777-4777-8777-777777777777';

const resetDb = () => {
  Object.assign(db, {
    profiles: [
      { id: TEACHER, email: 't@x.org', role: 'teacher', is_active: true, school_id: SCHOOL, first_name: 'T', last_name: 'T' },
      { id: CONTENT_ADMIN, email: 'c@x.org', role: 'content_admin', is_active: true, school_id: null, first_name: 'C', last_name: 'C' },
      { id: SCHOOL_ADMIN, email: 's@x.org', role: 'school_admin', is_active: true, school_id: SCHOOL, first_name: 'S', last_name: 'S' },
      { id: OTHER_USER, email: 'o@x.org', role: 'teacher', is_active: true, school_id: SCHOOL, first_name: 'O', last_name: 'O' },
    ],
    schools: [{ id: SCHOOL, name: 'School', is_active: false }],
    evaluations: [{
      id: EVALUATION, topic_id: TOPIC, title: 'Module 1', xp_reward: 500,
      evaluation_questions: [
        { id: 'q1', question_text: 'A?', options: ['a', 'b'], correct_answer: 'a' },
        { id: 'q2', question_text: 'B?', options: ['c', 'd'], correct_answer: 'd' },
      ],
    }],
    evaluation_progress: [],
    activities: [],
  });
  Object.assign(users, {
    'teacher-token': { id: TEACHER },
    'content-token': { id: CONTENT_ADMIN },
    'school-admin-token': { id: SCHOOL_ADMIN },
  });
  calls.getUser = 0;
  calls.rpc = [];
};

/** Minimal chainable stand-in for the supabase-js query builder. */
const query = (table: string) => {
  const filters: [string, any][] = [];
  let op: 'select' | 'write' = 'select';
  let payload: Row | null = null;

  const rows = () => (db[table] || []).filter((r) => filters.every(([k, v]) => r[k] === v));
  const result = (single: boolean) => {
    if (op === 'write') {
      if (payload) (db[table] ||= []).push({ id: `row-${Date.now()}`, ...payload });
      const written = payload ? [{ id: 'row', ...payload }] : [];
      return { data: single ? written[0] : written, error: null };
    }
    const found = rows();
    if (single) {
      return found[0]
        ? { data: JSON.parse(JSON.stringify(found[0])), error: null }
        : { data: null, error: { code: 'PGRST116', message: 'not found' } };
    }
    return { data: found, error: null, count: found.length };
  };

  const builder: any = {
    select: () => builder,
    eq: (k: string, v: any) => { filters.push([k, v]); return builder; },
    in: () => builder,
    or: () => builder,
    order: () => builder,
    range: () => builder,
    limit: () => builder,
    insert: (p: Row) => { op = 'write'; payload = p; return builder; },
    upsert: (p: Row) => { op = 'write'; payload = p; return builder; },
    update: () => { op = 'write'; return builder; },
    delete: () => { op = 'write'; return builder; },
    single: () => Promise.resolve(result(true)),
    maybeSingle: () => Promise.resolve(result(true)),
    then: (resolve: any, reject: any) => Promise.resolve(result(false)).then(resolve, reject),
  };
  return builder;
};

const fakeClient = {
  from: query,
  rpc: (name: string) => { calls.rpc.push(name); return Promise.resolve({ data: { success: true }, error: null }); },
  auth: {
    getUser: (token: string) => {
      calls.getUser++;
      const user = users[token];
      return Promise.resolve(user ? { data: { user }, error: null } : { data: { user: null }, error: { message: 'bad' } });
    },
    admin: { signOut: () => Promise.resolve({ error: null }) },
  },
};

jest.mock('../config/supabase', () => ({
  supabase: fakeClient,
  createAuthClient: () => fakeClient,
}));

// Imported after the mock is registered
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../app').default;

const as = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeEach(resetDb);

describe('Registration', () => {
  it('rejects self-registration with an admin role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'evil@x.org', password: 'ValidPass123', firstName: 'Ev', lastName: 'Il', role: 'super_admin',
    });
    expect(res.status).toBe(422);
  });
});

describe('Authentication middleware', () => {
  it('verifies the token only once per request', async () => {
    await request(app).get('/api/admin/schools').set(as('content-token'));
    expect(calls.getUser).toBe(1);
  });
});

describe('Schools', () => {
  it('blocks teachers from creating schools', async () => {
    const res = await request(app).post('/api/admin/schools').set(as('teacher-token')).send({ name: 'New School' });
    expect(res.status).toBe(403);
  });

  it('blocks non-super-admins from permanently deleting schools', async () => {
    for (const token of ['teacher-token', 'school-admin-token', 'content-token']) {
      const res = await request(app).delete(`/api/admin/schools/${SCHOOL}/permanent`).set(as(token));
      expect(res.status).toBe(403);
    }
  });
});

describe('Evaluations', () => {
  it('hides correct answers from teachers', async () => {
    const res = await request(app).get(`/api/evaluations/topic/${TOPIC}`).set(as('teacher-token'));
    expect(res.status).toBe(200);
    for (const q of res.body.data.evaluation_questions) {
      expect(q).not.toHaveProperty('correct_answer');
    }
  });

  it('still shows correct answers to content admins', async () => {
    const res = await request(app).get(`/api/evaluations/topic/${TOPIC}`).set(as('content-token'));
    expect(res.body.data.evaluation_questions[0].correct_answer).toBe('a');
  });

  it('blocks teachers from deleting evaluations', async () => {
    const res = await request(app).delete(`/api/evaluations/${EVALUATION}`).set(as('teacher-token'));
    expect(res.status).toBe(403);
  });

  it('grades on the server and ignores a client-claimed score', async () => {
    const res = await request(app).post('/api/evaluations/submit-mastery').set(as('teacher-token')).send({
      evaluationId: EVALUATION, answers: { q1: 'b', q2: 'c' }, score: 100, passed: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ passed: false, score: 0 });
    expect(calls.rpc).not.toContain('award_xp');
  });

  it('passes and awards XP when the answers are correct', async () => {
    const res = await request(app).post('/api/evaluations/submit-mastery').set(as('teacher-token')).send({
      evaluationId: EVALUATION, answers: { q1: 'a', q2: 'd' },
    });
    expect(res.body.data).toMatchObject({ passed: true, score: 100 });
    expect(calls.rpc).toContain('award_xp');
  });

  it('records the attempt for the logged-in user, not a userId in the body', async () => {
    await request(app).post('/api/evaluations/submit-mastery').set(as('teacher-token')).send({
      evaluationId: EVALUATION, answers: { q1: 'a', q2: 'd' }, userId: OTHER_USER,
    });
    expect(db.evaluation_progress.every((r) => r.user_id === TEACHER)).toBe(true);
  });
});

describe('Gamification', () => {
  it('blocks teachers from awarding themselves XP', async () => {
    const res = await request(app).post('/api/progress/xp').set(as('teacher-token')).send({
      userId: TEACHER, amount: 100000, description: 'free xp',
    });
    expect(res.status).toBe(403);
  });
});

describe('User management', () => {
  it('blocks school admins from granting admin roles', async () => {
    const res = await request(app).put(`/api/admin/users/${OTHER_USER}`).set(as('school-admin-token')).send({ role: 'super_admin' });
    expect(res.status).toBe(403);
  });

  it('blocks content admins from editing users', async () => {
    const res = await request(app).put(`/api/admin/users/${OTHER_USER}`).set(as('content-token')).send({ firstName: 'X' });
    expect(res.status).toBe(403);
  });
});
