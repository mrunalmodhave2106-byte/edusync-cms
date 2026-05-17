// routes/notifications.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/notifications  — for logged-in user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM notifications
       WHERE user_id = ? OR user_id IS NULL
       ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) { next(err); }
});

// POST /api/notifications  — admin broadcasts
router.post('/', authenticate, authorize('admin','faculty'), async (req, res, next) => {
  try {
    const { title, body, type, user_id } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)',
      [user_id || null, title, body, type || 'info']
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

module.exports = router;
