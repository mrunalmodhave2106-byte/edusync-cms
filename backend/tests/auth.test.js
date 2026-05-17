// tests/auth.test.js
const request = require('supertest');
const app     = require('../app');

// ── Health check ────────────────────────────────────
describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('EduSync API');
  });
});

// ── Register ────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects password shorter than 6 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: '123', role: 'student' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'pass123', role: 'superadmin' });
    expect(res.status).toBe(400);
  });

  it('rejects username shorter than 3 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', password: 'pass123', role: 'student' });
    expect(res.status).toBe(400);
  });
});

// ── Login ───────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('rejects missing username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'CS2101' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 for correct username wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'CS2101', password: 'definitely_wrong' });
    expect(res.status).toBe(401);
  });
});
