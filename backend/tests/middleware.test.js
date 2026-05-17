// tests/middleware.test.js
const { authenticate, authorize } = require('../middleware/auth');
const { errorHandler }            = require('../middleware/errorHandler');

// ── Mock express req/res/next ────────────────────────
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// ── authenticate ────────────────────────────────────
describe('authenticate middleware', () => {
  it('returns 401 when no Authorization header', () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req  = { headers: { authorization: 'Basic abc123' } };
    const res  = mockRes();
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for invalid JWT', () => {
    const req  = { headers: { authorization: 'Bearer invalid.token.here' } };
    const res  = mockRes();
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ── authorize ───────────────────────────────────────
describe('authorize middleware', () => {
  it('calls next() when role matches', () => {
    const req  = { user: { role: 'admin' } };
    const res  = mockRes();
    const next = jest.fn();
    authorize('admin', 'faculty')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when role does not match', () => {
    const req  = { user: { role: 'student' } };
    const res  = mockRes();
    const next = jest.fn();
    authorize('admin', 'faculty')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── errorHandler ────────────────────────────────────
describe('errorHandler middleware', () => {
  it('returns 500 for generic errors', () => {
    const err  = new Error('Something broke');
    const req  = { method: 'GET', path: '/test' };
    const res  = mockRes();
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('returns custom status code from err.status', () => {
    const err  = new Error('Not found'); err.status = 404;
    const req  = { method: 'GET', path: '/test' };
    const res  = mockRes();
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });
});
