// routes/fees.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/:studentId', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM fees WHERE student_id = ? ORDER BY status, due_date',
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.patch('/:id/pay', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Valid amount required' });
    await pool.execute(
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

router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { student_id, item, amount, due_date } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO fees (student_id, item, amount, due_date) VALUES (?, ?, ?, ?)',
      [student_id, item, amount, due_date]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

module.exports = router;
