const request = require('supertest');
const app = require('../app');

describe('GET /api/students', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });
});
