/**
 * Admin class management: create, edit and delete a school's classes
 */

import request from 'supertest';

type Row = Record<string, any>;

const SUPER = '10000000-0000-4000-8000-000000000001';
const SCHOOL_ADMIN = '10000000-0000-4000-8000-000000000002';
const OTHER_SCHOOL_ADMIN = '10000000-0000-4000-8000-000000000003';
const TEACHER = '10000000-0000-4000-8000-000000000004';
const OTHER_TEACHER = '10000000-0000-4000-8000-000000000005';
const OUTSIDE_TEACHER = '10000000-0000-4000-8000-000000000006';
const CONTENT_ADMIN = '10000000-0000-4000-8000-000000000007';
const SCHOOL = '20000000-0000-4000-8000-000000000001';
const OTHER_SCHOOL = '20000000-0000-4000-8000-000000000002';
const CLASS = '30000000-0000-4000-8000-000000000001';
const DUPLICATE = '30000000-0000-4000-8000-000000000002';
const AMA = '40000000-0000-4000-8000-000000000001';
const KOJO = '40000000-0000-4000-8000-000000000002';

const users: Record<string, Row> = {
  'super-token': { id: SUPER, role: 'super_admin', school_id: null },
  'school-admin-token': { id: SCHOOL_ADMIN, role: 'school_admin', school_id: SCHOOL },
  'other-school-admin-token': { id: OTHER_SCHOOL_ADMIN, role: 'school_admin', school_id: OTHER_SCHOOL },
  'content-admin-token': { id: CONTENT_ADMIN, role: 'content_admin', school_id: null },
  'teacher-token': { id: TEACHER, role: 'teacher', school_id: SCHOOL },
  'other-teacher-token': { id: OTHER_TEACHER, role: 'teacher', school_id: SCHOOL },
  'outside-teacher-token': { id: OUTSIDE_TEACHER, role: 'teacher', school_id: OTHER_SCHOOL },
};

let db: Record<string, Row[]>;
let nextId = 0;

const resetDb = () => {
  db = {
    profiles: Object.values(users).map((u) => ({ ...u, email: `${u.id}@x.org`, is_active: true, first_name: 'T', last_name: 'T' })),
    curricula: [{ id: 'book', slug: 'codesrock-1-activity-book' }],
    classes: [
      { id: CLASS, name: 'Inquiry studio', teacher_id: TEACHER, school_id: SCHOOL },
      { id: DUPLICATE, name: 'INQUIRY STUDIO', teacher_id: OTHER_TEACHER, school_id: SCHOOL },
    ],
    class_learners: [
      { id: 'cl1', class_id: CLASS, learner_id: AMA },
      { id: 'cl2', class_id: DUPLICATE, learner_id: AMA },
      { id: 'cl3', class_id: DUPLICATE, learner_id: KOJO },
    ],
    learners: [
      { id: AMA, school_id: SCHOOL, is_active: true },
      { id: KOJO, school_id: SCHOOL, is_active: true },
    ],
    lesson_sessions: [{ id: 'ls1', class_id: DUPLICATE }],
    activities: [],
  };
};

// In-memory stand-in for the Supabase query builder, including writes
const query = (table: string) => {
  const filters: [string, any][] = [];
  let op: { kind: 'select' | 'insert' | 'update' | 'delete'; payload?: any } = { kind: 'select' };
  const matches = (r: Row) => filters.every(([k, v]) => (Array.isArray(v) ? v.includes(r[k]) : r[k] === v));
  const run = () => {
    const rows = db[table] || (db[table] = []);
    if (op.kind === 'insert') {
      const added = [].concat(op.payload).map((r: Row) => ({ id: `new-${++nextId}`, created_at: new Date().toISOString(), ...r }));
      rows.push(...added);
      return added;
    }
    const hit = rows.filter(matches);
    if (op.kind === 'update') hit.forEach((r) => Object.assign(r, op.payload));
    if (op.kind === 'delete') {
      db[table] = rows.filter((r) => !matches(r));
      // classes cascade to their roster links and lessons
      if (table === 'classes') {
        const ids = hit.map((r) => r.id);
        db.class_learners = db.class_learners.filter((r) => !ids.includes(r.class_id));
        db.lesson_sessions = db.lesson_sessions.filter((r) => !ids.includes(r.class_id));
      }
    }
    return hit;
  };
  const builder: any = {
    select: () => builder,
    insert: (payload: any) => { op = { kind: 'insert', payload }; return builder; },
    update: (payload: any) => { op = { kind: 'update', payload }; return builder; },
    delete: () => { op = { kind: 'delete' }; return builder; },
    eq: (k: string, v: any) => { filters.push([k, v]); return builder; },
    in: (k: string, v: any[]) => { filters.push([k, v]); return builder; },
    order: () => builder,
    single: () => {
      const rows = run();
      return Promise.resolve(rows[0] ? { data: rows[0], error: null } : { data: null, error: { code: 'PGRST116' } });
    },
    then: (res: any, rej: any) => Promise.resolve({ data: run(), error: null }).then(res, rej),
  };
  return builder;
};

const fakeClient = {
  from: query,
  rpc: () => Promise.resolve({ data: [], error: null }),
  auth: {
    getUser: (token: string) =>
      Promise.resolve(users[token] ? { data: { user: { id: users[token].id } }, error: null } : { data: { user: null }, error: {} }),
  },
};

jest.mock('../config/supabase', () => ({ supabase: fakeClient, createAuthClient: () => fakeClient }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../app').default;

const as = (token: string) => ({ Authorization: `Bearer ${token}` });
const classUrl = (school: string, cls?: string) => `/api/admin/schools/${school}/classes${cls ? `/${cls}` : ''}`;

beforeEach(resetDb);

describe('Deleting a class', () => {
  it('lets a super admin delete a wrongly created class with its lessons', async () => {
    const res = await request(app).delete(classUrl(SCHOOL, DUPLICATE)).set(as('super-token'));
    expect(res.status).toBe(200);
    expect(db.classes.map((c) => c.id)).toEqual([CLASS]);
    expect(db.lesson_sessions).toEqual([]);
    expect(db.class_learners.map((r) => r.class_id)).toEqual([CLASS]);
  });

  it('keeps children who are still in another class, and marks the rest inactive', async () => {
    const res = await request(app).delete(classUrl(SCHOOL, DUPLICATE)).set(as('super-token'));
    expect(res.body.data.deactivatedChildren).toBe(1);
    expect(db.learners.find((l) => l.id === AMA)!.is_active).toBe(true);
    expect(db.learners.find((l) => l.id === KOJO)!.is_active).toBe(false);
  });

  it('lets a school admin delete classes in their own school only', async () => {
    expect((await request(app).delete(classUrl(SCHOOL, DUPLICATE)).set(as('other-school-admin-token'))).status).toBe(403);
    expect((await request(app).delete(classUrl(SCHOOL, DUPLICATE)).set(as('school-admin-token'))).status).toBe(200);
  });

  it('does not let teachers or content admins delete classes', async () => {
    expect((await request(app).delete(classUrl(SCHOOL, CLASS)).set(as('teacher-token'))).status).toBe(403);
    expect((await request(app).delete(classUrl(SCHOOL, CLASS)).set(as('content-admin-token'))).status).toBe(403);
    expect(db.classes).toHaveLength(2);
  });

  it('refuses a class that belongs to another school', async () => {
    const res = await request(app).delete(classUrl(OTHER_SCHOOL, CLASS)).set(as('super-token'));
    expect(res.status).toBe(404);
    expect(db.classes).toHaveLength(2);
  });
});

describe('Creating and editing a class', () => {
  it('creates a class for a teacher at the school', async () => {
    const res = await request(app).post(classUrl(SCHOOL)).set(as('super-token')).send({ name: ' KG 2 ', teacherId: OTHER_TEACHER });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'KG 2', teacher_id: OTHER_TEACHER, school_id: SCHOOL, curriculum_id: 'book' });
  });

  it('refuses a teacher from another school', async () => {
    const res = await request(app).post(classUrl(SCHOOL)).set(as('super-token')).send({ name: 'KG 2', teacherId: OUTSIDE_TEACHER });
    expect(res.status).toBe(400);
  });

  it('requires a name', async () => {
    const res = await request(app).post(classUrl(SCHOOL)).set(as('super-token')).send({ name: '  ', teacherId: TEACHER });
    expect(res.status).toBe(422);
    expect(db.classes).toHaveLength(2);
  });

  it('renames a class and hands it to another teacher', async () => {
    const res = await request(app)
      .patch(classUrl(SCHOOL, CLASS))
      .set(as('school-admin-token'))
      .send({ name: 'Inquiry Studio', teacherId: OTHER_TEACHER });
    expect(res.status).toBe(200);
    expect(db.classes.find((c) => c.id === CLASS)).toMatchObject({ name: 'Inquiry Studio', teacher_id: OTHER_TEACHER });
  });
});
