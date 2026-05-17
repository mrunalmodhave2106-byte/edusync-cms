// =============================================
//  routes/auth.js
// =============================================
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');
const { body, validationResult } = require('express-validator');

// POST /api/auth/register
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'faculty', 'admin']),
  body('name').optional().isLength({ min: 2 }).trim(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const { username, password, role, name, department, year } = req.body;
    const hash = await bcrypt.hash(password, 12);

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?', [username]
    );
    if (existing.length)
      return res.status(400).json({ error: 'Username already exists' });

    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hash, role]
    );

    if (role === 'student' && name) {
      await pool.execute(
        'INSERT IGNORE INTO students (student_id, name, department, year, user_id) VALUES (?, ?, ?, ?, ?)',
        [username, name, department || null, year || null, result.insertId]
      );
    }

    res.status(201).json({ message: 'Account created', userId: result.insertId });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const [rows] = await pool.execute(
      'SELECT u.*, s.id as student_db_id FROM users u LEFT JOIN students s ON s.user_id = u.id WHERE u.username = ?',
      [username]
    );
    if (!rows.length)
      return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, studentDbId: user.student_db_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ token, role: user.role, username: user.username, userId: user.student_db_id || user.id });
  } catch (err) { next(err); }
});

module.exports = router;
