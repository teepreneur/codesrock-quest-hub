/**
 * Rate limiting and error sanitizing tests
 */

import request from 'supertest';

const TEACHER = '11111111-1111-4111-8111-111111111111';

const failingQuery = () => {
  throw new Error('relation "internal_secret_table" does not exist');
};

const fakeClient = {
  from: (table: string) => {
    if (table === 'profiles') {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        single: () => Promise.resolve({
          data: { id: TEACHER, email: 't@x.org', role: 'teacher', is_active: true, first_name: 'T', last_name: 'T' },
          error: null,
        }),
      };
      return builder;
    }
    return failingQuery();
  },
  rpc: () => Promise.resolve({ data: null, error: null }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: TEACHER } }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } }),
  },
};

jest.mock('../config/supabase', () => ({
  supabase: fakeClient,
  createAuthClient: () => fakeClient,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../app').default;

const login = (email: string, ip = '203.0.113.10') =>
  request(app)
    .post('/api/auth/login')
    .set('CF-Connecting-IP', ip)
    .send({ email, password: 'wrong-password' });

describe('Login rate limiting', () => {
  it('locks one account after 10 failed attempts', async () => {
    for (let i = 0; i < 10; i++) {
      expect((await login('locked@school.org')).status).toBe(401);
    }
    expect((await login('locked@school.org')).status).toBe(429);
  });

  it('does not lock other teachers on the same school network', async () => {
    for (let i = 0; i < 11; i++) await login('noisy@school.org', '203.0.113.20');
    expect((await login('colleague@school.org', '203.0.113.20')).status).toBe(401);
  });

  it('counts the real visitor IP, not the proxy address', async () => {
    for (let i = 0; i < 11; i++) await login('roaming@school.org', '198.51.100.1');
    expect((await login('roaming@school.org', '198.51.100.2')).status).toBe(401);
  });
});

describe('Error sanitizing', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('hides internal error details in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/api/evaluations/topic/abc').set('Authorization', 'Bearer t');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('internal_secret_table');
    expect(res.body).toEqual({ success: false, message: expect.any(String) });
  });

  it('keeps details outside production for debugging', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/api/evaluations/topic/abc').set('Authorization', 'Bearer t');
    expect(JSON.stringify(res.body)).toContain('internal_secret_table');
  });
});
