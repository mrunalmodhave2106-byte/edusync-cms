// =============================================
//  routes/marks.js
// =============================================
const router = require('express').Router();
const pool   = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/marks
router.post('/', authenticate, authorize('faculty','admin'), async (req, res, next) => {
  try {
    const { student_id, subject, internal, mid_sem, end_sem, semester } = req.body;
    if (!student_id || !subject || semester === undefined)
      return res.status(400).json({ error: 'student_id, subject, semester required' });
    if (internal > 30 || mid_sem > 50 || end_sem > 100)
      return res.status(400).json({ error: 'Marks exceed maximum (30/50/100)' });

    await pool.execute(
      `INSERT INTO marks (student_id, subject, internal, mid_sem, end_sem, semester)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE internal=VALUES(internal), mid_sem=VALUES(mid_sem), end_sem=VALUES(end_sem)`,
      [student_id, subject, internal||0, mid_sem||0, end_sem||0, semester]
    );
    res.status(201).json({ message: 'Marks saved' });
  } catch (err) { next(err); }
});

// GET /api/marks/:studentId
router.get('/:studentId', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM marks WHERE student_id = ? ORDER BY semester, subject',
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;


// =============================================
//  routes/fees.js
// =============================================
const feesRouter = require('express').Router();
const feesPool   = require('../db/pool');
const { authenticate: feesAuth, authorize: feesAuthorize } = require('../middleware/auth');

// GET /api/fees/:studentId
feesRouter.get('/:studentId', feesAuth, async (req, res, next) => {
  try {
    const [rows] = await feesPool.execute(
      'SELECT * FROM fees WHERE student_id = ? ORDER BY status, due_date',
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/fees/:id/pay
feesRouter.patch('/:id/pay', feesAuth, feesAuthorize('admin'), async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Valid amount required' });

    await feesPool.execute(
      `UPDATE fees
       SET paid = LEAST(paid + ?, amount),
           status = IF(paid + ? >= amount, 'paid', status),
           updated_at = NOW()
       WHERE id = ?`,
      [amount, amount, req.params.id]
    );
    res.json({ message: 'Payment recorded' });
  } catch (err) { next(err); }
});

// POST /api/fees  — add fee (admin)
feesRouter.post('/', feesAuth, feesAuthorize('admin'), async (req, res, next) => {
  try {
    const { student_id, item, amount, due_date } = req.body;
    const [result] = await feesPool.execute(
      'INSERT INTO fees (student_id, item, amount, due_date) VALUES (?, ?, ?, ?)',
      [student_id, item, amount, due_date]
    );
    res.status(201).json({ id: result.insertId, message: 'Fee added' });
  } catch (err) { next(err); }
});

module.exports = feesRouter;
