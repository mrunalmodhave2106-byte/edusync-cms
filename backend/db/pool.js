// db/pool.js — MySQL2 connection pool pointing to AWS RDS
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST,      // RDS endpoint
  port:               parseInt(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME || 'edusync',
  user:               process.env.DB_USER,
  password:           process.env.DB_PASS,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  timezone:           '+05:30',  // IST
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected to AWS RDS:', process.env.DB_HOST);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
  });

module.exports = pool;
