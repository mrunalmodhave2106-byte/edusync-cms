// =============================================
//  routes/attendance.js
// =============================================
const router = require('express').Router();
const pool   = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/attendance  — single record
router.post('/', authenticate, authorize('faculty','admin'), async (req, res, next) => {
  try {
    const { student_id, subject, date, status } = req.body;
    if (!student_id || !subject || !date || !status)
      return res.status(400).json({ error: 'All fields required' });

    await pool.execute(
      `INSERT INTO attendance (student_id, subject, date, status, marked_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [student_id, subject, date, status, req.user.id]
    );
    res.status(201).json({ message: 'Attendance recorded' });
  } catch (err) { next(err); }
});

// POST /api/attendance/bulk  — entire class at once
router.post('/bulk', authenticate, authorize('faculty','admin'), async (req, res, next) => {
  try {
    const { records, subject, date } = req.body;
    if (!records?.length || !subject || !date)
      return res.status(400).json({ error: 'records, subject, date required' });

    const values = records.map(r => [r.student_id, subject, date, r.status, req.user.id]);
    await pool.query(
      `INSERT INTO attendance (student_id, subject, date, status, marked_by) VALUES ?
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [values]
    );
    res.json({ message: `${records.length} records saved` });
  } catch (err) { next(err); }
});

// GET /api/attendance?subject=X&date=Y  — for faculty to view
router.get('/', authenticate, authorize('faculty','admin'), async (req, res, next) => {
  try {
    const { subject, date } = req.query;
    let query = `SELECT a.*, s.name, s.student_id
                 FROM attendance a JOIN students s ON s.id = a.student_id WHERE 1=1`;
    const params = [];
    if (subject) { query += ' AND a.subject = ?'; params.push(subject); }
    if (date)    { query += ' AND a.date = ?';    params.push(date); }
    query += ' ORDER BY s.name';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
