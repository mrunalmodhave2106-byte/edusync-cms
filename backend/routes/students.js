// =============================================
//  routes/students.js
// =============================================
const router = require('express').Router();
const pool   = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/students
router.get('/', authenticate, authorize('admin','faculty'), async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.id, s.student_id, s.name, s.department, s.year, s.cgpa,
             COALESCE((
               SELECT ROUND(SUM(status='present')/COUNT(*)*100,1)
               FROM attendance a WHERE a.student_id = s.id
             ), 0) AS attendance,
             COALESCE((
               SELECT status FROM fees f WHERE f.student_id = s.id
               ORDER BY FIELD(status,'overdue','pending','paid') LIMIT 1
             ), 'paid') AS fee_status
      FROM students s ORDER BY s.name
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/students/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/students/:id/attendance
router.get('/:id/attendance', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT subject,
             COUNT(*) AS total,
             SUM(status = 'present') AS present,
             ROUND(SUM(status='present') / COUNT(*) * 100, 1) AS percentage
      FROM attendance WHERE student_id = ?
      GROUP BY subject ORDER BY subject
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/students/:id/marks
router.get('/:id/marks', authenticate, async (req, res, next) => {
  try {
    const { semester } = req.query;
    let query = 'SELECT * FROM marks WHERE student_id = ?';
    const params = [req.params.id];
    if (semester) { query += ' AND semester = ?'; params.push(semester); }
    query += ' ORDER BY semester, subject';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/students
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { student_id, name, department, year, user_id } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO students (student_id, name, department, year, user_id) VALUES (?, ?, ?, ?, ?)',
      [student_id, name, department, year, user_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Student enrolled' });
  } catch (err) { next(err); }
});

// PATCH /api/students/:id/cgpa
router.patch('/:id/cgpa', authenticate, authorize('admin','faculty'), async (req, res, next) => {
  try {
    const { cgpa } = req.body;
    await pool.execute('UPDATE students SET cgpa = ? WHERE id = ?', [cgpa, req.params.id]);
    res.json({ message: 'CGPA updated' });
  } catch (err) { next(err); }
});

module.exports = router;
