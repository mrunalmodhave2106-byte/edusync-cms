// ===================================================
//  EduSync Backend — Node.js + Express + MySQL (RDS)
//  No Docker, No Terraform, No Spring Boot
// ===================================================

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const authRoutes         = require('./routes/auth');
const studentRoutes      = require('./routes/students');
const attendanceRoutes   = require('./routes/attendance');
const marksRoutes        = require('./routes/marks');
const feesRoutes         = require('./routes/fees');
const notificationRoutes = require('./routes/notifications');
const { errorHandler }   = require('./middleware/errorHandler');

const app = express();

// ── Security ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// ── Rate limiting ─────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,
  message: { error: 'Too many requests, slow down.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ── Middleware ────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check (used by Jenkins) ───────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'EduSync API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ── Routes ────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/marks',         marksRoutes);
app.use('/api/fees',          feesRoutes);
app.use('/api/notifications', notificationRoutes);

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Error handler ─────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║      EduSync API — Running             ║
║      Port : ${PORT}                       ║
║      Env  : ${(process.env.NODE_ENV||'development').padEnd(25)}║
╚════════════════════════════════════════╝`);
  });
}

module.exports = app; // for Jest
