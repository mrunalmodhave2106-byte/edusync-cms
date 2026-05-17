-- =============================================
--  EduSync — MySQL Schema for AWS RDS
--  Run once to set up the database
-- =============================================

CREATE DATABASE IF NOT EXISTS edusync;
USE edusync;

-- ── Users (login accounts) ────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('student','faculty','admin') NOT NULL DEFAULT 'student',
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_username (username),
  INDEX idx_role (role)
);

-- ── Students ──────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  VARCHAR(20)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  department  VARCHAR(50),
  year        TINYINT UNSIGNED,
  cgpa        DECIMAL(3,2) DEFAULT 0.00,
  user_id     INT,
  created_at  DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_dept (department)
);

-- ── Faculty ───────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id  VARCHAR(20)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  department  VARCHAR(50),
  subjects    TEXT,
  experience  VARCHAR(20),
  rating      DECIMAL(2,1) DEFAULT 4.0,
  user_id     INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── Attendance ────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject    VARCHAR(100) NOT NULL,
  date       DATE NOT NULL,
  status     ENUM('present','absent','leave') NOT NULL DEFAULT 'absent',
  marked_by  INT,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_att (student_id, subject, date),
  INDEX idx_student (student_id),
  INDEX idx_date (date)
);

-- ── Marks ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS marks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject    VARCHAR(100) NOT NULL,
  internal   TINYINT UNSIGNED DEFAULT 0,
  mid_sem    TINYINT UNSIGNED DEFAULT 0,
  end_sem    TINYINT UNSIGNED DEFAULT 0,
  semester   TINYINT UNSIGNED NOT NULL,
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_marks (student_id, subject, semester),
  INDEX idx_student (student_id)
);

-- ── Fees ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS fees (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  item       VARCHAR(100) NOT NULL,
  amount     DECIMAL(10,2) NOT NULL,
  paid       DECIMAL(10,2) DEFAULT 0.00,
  due_date   DATE,
  status     ENUM('paid','pending','overdue') DEFAULT 'pending',
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_status (status)
);

-- ── Notifications ─────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT,
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  type       ENUM('info','alert','success') DEFAULT 'info',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read)
);

-- ── Audit logs ────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT,
  action     VARCHAR(100),
  details    JSON,
  ip         VARCHAR(45),
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_user (user_id),
  INDEX idx_action (action)
);

-- =============================================
--  Seed demo data
-- =============================================

-- Admin user (password: admin123)
INSERT IGNORE INTO users (username, password, role) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9pGQ5MzFmXXhq6LxZFa', 'admin');

-- Demo faculty user (password: faculty123)
INSERT IGNORE INTO users (username, password, role) VALUES
('faculty01', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9pGQ5MzFmXXhq6LxZFa', 'faculty');

-- Demo student users (password: student123)
INSERT IGNORE INTO users (username, password, role) VALUES
('CS2101', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9pGQ5MzFmXXhq6LxZFa', 'student'),
('EC2045', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9pGQ5MzFmXXhq6LxZFa', 'student'),
('ME1903', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9pGQ5MzFmXXhq6LxZFa', 'student');

-- Students
INSERT IGNORE INTO students (student_id, name, department, year, cgpa, user_id) VALUES
('CS2101', 'Arjun Sharma',  'Computer Science', 3, 8.70, (SELECT id FROM users WHERE username='CS2101')),
('EC2045', 'Priya Patel',   'Electronics',      2, 9.10, (SELECT id FROM users WHERE username='EC2045')),
('ME1903', 'Rohan Mehta',   'Mechanical',       4, 7.40, (SELECT id FROM users WHERE username='ME1903'));

-- Attendance for CS2101
INSERT IGNORE INTO attendance (student_id, subject, date, status) VALUES
((SELECT id FROM students WHERE student_id='CS2101'), 'Data Structures', '2024-11-01', 'present'),
((SELECT id FROM students WHERE student_id='CS2101'), 'Data Structures', '2024-11-04', 'present'),
((SELECT id FROM students WHERE student_id='CS2101'), 'Data Structures', '2024-11-06', 'absent'),
((SELECT id FROM students WHERE student_id='CS2101'), 'DBMS',            '2024-11-01', 'present'),
((SELECT id FROM students WHERE student_id='CS2101'), 'DBMS',            '2024-11-04', 'present');

-- Marks for CS2101
INSERT IGNORE INTO marks (student_id, subject, internal, mid_sem, end_sem, semester) VALUES
((SELECT id FROM students WHERE student_id='CS2101'), 'Data Structures',     28, 42, 71, 5),
((SELECT id FROM students WHERE student_id='CS2101'), 'Operating Systems',   25, 38, 65, 5),
((SELECT id FROM students WHERE student_id='CS2101'), 'DBMS',                29, 45, 78, 5),
((SELECT id FROM students WHERE student_id='CS2101'), 'Computer Networks',   27, 40, 69, 5),
((SELECT id FROM students WHERE student_id='CS2101'), 'Software Engineering',26, 43, 74, 5);

-- Fees for CS2101
INSERT IGNORE INTO fees (student_id, item, amount, paid, due_date, status) VALUES
((SELECT id FROM students WHERE student_id='CS2101'), 'Tuition Fee',  85000, 85000, '2024-07-15', 'paid'),
((SELECT id FROM students WHERE student_id='CS2101'), 'Hostel Fee',   45000, 45000, '2024-07-15', 'paid'),
((SELECT id FROM students WHERE student_id='CS2101'), 'Lab Fee',       8500,     0, '2024-11-30', 'pending'),
((SELECT id FROM students WHERE student_id='CS2101'), 'Library Fee',   2000,  2000, '2024-07-15', 'paid'),
((SELECT id FROM students WHERE student_id='CS2101'), 'Exam Fee',      3500,     0, '2024-12-10', 'pending');

-- Notifications
INSERT IGNORE INTO notifications (user_id, title, body, type, is_read) VALUES
((SELECT id FROM users WHERE username='CS2101'), 'Exam Schedule Released',
 'End semester examinations begin Dec 18. Check hall ticket.', 'alert', FALSE),
((SELECT id FROM users WHERE username='CS2101'), 'Fee Reminder',
 'Lab fee of ₹8,500 due by Nov 30, 2024.', 'info', FALSE),
((SELECT id FROM users WHERE username='CS2101'), 'Attendance Approved',
 'Medical leave for Oct 14–16 approved. Attendance updated.', 'success', TRUE);
