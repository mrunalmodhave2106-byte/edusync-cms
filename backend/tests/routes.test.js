// tests/routes.test.js
const request = require('supertest');
const app     = require('../app');

// All protected routes should return 401 without a token
const protectedRoutes = [
  { method: 'get',   path: '/api/students' },
  { method: 'get',   path: '/api/students/1' },
  { method: 'get',   path: '/api/students/1/attendance' },
  { method: 'get',   path: '/api/students/1/marks' },
  { method: 'get',   path: '/api/attendance' },
  { method: 'post',  path: '/api/attendance' },
  { method: 'get',   path: '/api/fees/1' },
  { method: 'get',   path: '/api/marks/1' },
  { method: 'get',   path: '/api/notifications' },
];

describe('Protected routes — no token', () => {
  protectedRoutes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} returns 401`, async () => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});

// Invalid token should also be rejected
describe('Protected routes — invalid token', () => {
  it('rejects a malformed JWT', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });

  it('rejects expired/tampered JWT', async () => {
    const fakeToken = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.invalidsig';
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', fakeToken);
    expect(res.status).toBe(401);
  });
});

// 404 for unknown routes
describe('Unknown routes', () => {
  it('GET /api/unknown returns 404', async () => {
    const res = await request(app).get('/api/unknown-route-xyz');
    expect(res.status).toBe(404);
  });

  it('POST /api/unknown returns 404', async () => {
    const res = await request(app).post('/api/unknown-route-xyz');
    expect(res.status).toBe(404);
  });
});

// Attendance validation
describe('POST /api/attendance — validation', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .send({ student_id: 1, subject: 'DBMS', date: '2024-11-01', status: 'present' });
    expect(res.status).toBe(401);
  });
});

// Marks validation
describe('POST /api/marks — validation', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/marks')
      .send({ student_id: 1, subject: 'DBMS', internal: 25, mid_sem: 40, end_sem: 70, semester: 5 });
    expect(res.status).toBe(401);
  });
});

// Fee payment validation
describe('PATCH /api/fees/:id/pay — validation', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/fees/1/pay')
      .send({ amount: 5000 });
    expect(res.status).toBe(401);
  });
});

// Notifications
describe('GET /api/notifications', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});
