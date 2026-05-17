# EduSync — College Management System

> Full-stack college management system built with **HTML/CSS/JS** (frontend), **Node.js + Express** (backend), **AWS RDS MySQL** (database), and **Jenkins CI/CD** (automated deployment to AWS EC2). No Docker. No Terraform.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | HTML5 · CSS3 · Vanilla JavaScript |
| Backend   | Node.js 20 · Express.js 4         |
| Database  | MySQL 8 on AWS RDS                |
| Auth      | JWT + bcrypt                      |
| CI/CD     | Jenkins (GitHub webhook)          |
| Hosting   | AWS EC2 (Ubuntu 22.04)            |
| Web server| Nginx (reverse proxy)             |
| Process   | PM2 (Node.js process manager)     |

---

## Project Structure

```
edusync-cms/
├── backend/
│   ├── app.js                  ← Express entry point
│   ├── package.json
│   ├── .env.example            ← Copy to .env and fill values
│   ├── .eslintrc.json
│   ├── db/
│   │   ├── pool.js             ← MySQL2 connection pool (AWS RDS)
│   │   └── schema.sql          ← Database schema + seed data
│   ├── middleware/
│   │   ├── auth.js             ← JWT authenticate + authorize
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js             ← POST /api/auth/login|register
│   │   ├── students.js         ← GET|POST /api/students
│   │   ├── attendance.js       ← GET|POST /api/attendance
│   │   ├── marks.js            ← GET|POST /api/marks
│   │   ├── fees.js             ← GET|PATCH|POST /api/fees
│   │   └── notifications.js    ← GET|PATCH|POST /api/notifications
│   └── tests/
│       ├── auth.test.js
│       ├── routes.test.js
│       └── middleware.test.js
├── frontend/
│   ├── login.html              ← Login + signup page
│   ├── dashboard.html          ← Main app shell
│   ├── style.css               ← Complete design system
│   └── app.js                  ← SPA logic (all pages)
├── Jenkinsfile                 ← CI/CD pipeline (SSH deploy)
├── nginx.conf                  ← Nginx reverse proxy config
├── package.json                ← Root scripts
└── .gitignore
```

---

## Local Development Setup

### Step 1 — Clone the repo
```bash
git clone https://github.com/YOUR_ORG/edusync-cms.git
cd edusync-cms
```

### Step 2 — Set up MySQL locally (or use RDS)
```bash
# Option A: local MySQL
mysql -u root -p < backend/db/schema.sql

# Option B: AWS RDS — connect and run schema
mysql -h your-rds-endpoint.rds.amazonaws.com -u admin -p edusync < backend/db/schema.sql
```

### Step 3 — Configure environment
```bash
cd backend
cp .env.example .env
nano .env   # fill in DB_HOST, DB_PASS, JWT_SECRET
```

### Step 4 — Install and run
```bash
npm ci
npm run dev     # nodemon — auto-restarts on file changes
```

### Step 5 — Open frontend
```bash
# Open frontend/login.html in browser using Live Server (VS Code extension)
# OR use Python's built-in server:
cd frontend
python3 -m http.server 5500
# → open http://localhost:5500/login.html
```

### Demo credentials (from seed data)
| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| Student | CS2101    | student123  |
| Student | EC2045    | student123  |

---

## API Reference

### Auth
```
POST  /api/auth/register   { username, password, role, name, department, year }
POST  /api/auth/login      { username, password }  → { token, role, username }
```

### Students  (requires Bearer token)
```
GET   /api/students                  → list all (admin/faculty)
GET   /api/students/:id              → single student
GET   /api/students/:id/attendance   → subject-wise attendance %
GET   /api/students/:id/marks        → marks by semester
POST  /api/students                  → enroll (admin only)
PATCH /api/students/:id/cgpa         → update CGPA (admin/faculty)
```

### Attendance
```
GET   /api/attendance?subject=X&date=Y   → class attendance (faculty)
POST  /api/attendance                    → mark single record
POST  /api/attendance/bulk               → mark entire class
```

### Marks
```
GET   /api/marks/:studentId          → get marks
POST  /api/marks                     → enter/update marks (faculty/admin)
```

### Fees
```
GET   /api/fees/:studentId           → fee breakdown
POST  /api/fees                      → add fee item (admin)
PATCH /api/fees/:id/pay              → record payment (admin)
```

### Notifications
```
GET   /api/notifications             → user's notifications
PATCH /api/notifications/:id/read    → mark one read
PATCH /api/notifications/read-all    → mark all read
POST  /api/notifications             → broadcast (admin/faculty)
```

---

## AWS RDS Setup

### Step 1 — Create RDS instance (Free Tier)
```
AWS Console → RDS → Create database
  Engine: MySQL 8.0
  Template: Free tier
  DB identifier: edusync-db
  Master username: admin
  Master password: (save this)
  Instance class: db.t3.micro
  Storage: 20 GB
  Public access: NO (access via EC2 only)
  VPC: same as your EC2
```

### Step 2 — Security group rule
```
RDS security group → Inbound rules → Add:
  Type: MySQL/Aurora
  Port: 3306
  Source: EC2 security group ID (not 0.0.0.0/0)
```

### Step 3 — Run schema from EC2
```bash
# SSH into your EC2 first, then:
mysql -h edusync-db.xxxxxxx.ap-south-1.rds.amazonaws.com \
      -u admin -p edusync < /home/ubuntu/edusync/backend/db/schema.sql
```

---

## AWS EC2 Setup

### Step 1 — Launch EC2 (Ubuntu 22.04, t2.micro)
```
Security group inbound rules:
  SSH  : port 22   (your IP only)
  HTTP : port 80   (0.0.0.0/0)
  Custom: port 4000 (your IP only, for testing)
```

### Step 2 — Install software on EC2
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Install PM2 globally
sudo npm install -g pm2

# Clone the repo
cd /home/ubuntu
git clone https://github.com/YOUR_ORG/edusync-cms.git edusync
cd edusync/backend
npm ci --omit=dev

# Create .env on the server (never from git)
nano .env    # paste your values

# Start the API
pm2 start app.js --name edusync-api
pm2 startup   # copy-paste the command it gives you
pm2 save
```

### Step 3 — Configure Nginx
```bash
sudo cp /home/ubuntu/edusync/nginx.conf /etc/nginx/sites-available/edusync
sudo ln -s /etc/nginx/sites-available/edusync /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # remove default site

# Copy frontend files
sudo mkdir -p /var/www/html/edusync
sudo cp /home/ubuntu/edusync/frontend/* /var/www/html/edusync/

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### Step 4 — Test
```bash
# API health
curl http://localhost:4000/health

# Frontend (from your laptop)
open http://YOUR_EC2_PUBLIC_IP
```

---

## Jenkins CI/CD Setup

### Step 1 — Install Jenkins on a separate EC2 or same EC2
```bash
sudo apt update
sudo apt install -y openjdk-17-jdk

curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key \
  | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian binary/ \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update && sudo apt install -y jenkins
sudo systemctl enable --now jenkins
```

### Step 2 — Jenkins plugins to install
```
Manage Jenkins → Plugins → Install:
  ✅ Pipeline
  ✅ Git
  ✅ GitHub Integration
  ✅ NodeJS
  ✅ SSH Agent
  ✅ Slack Notification
  ✅ JUnit
  ✅ HTML Publisher
  ✅ Credentials Binding
```

### Step 3 — Jenkins credentials to add
```
Manage Jenkins → Credentials → Global → Add:

1. ID: aws-ec2-ssh-key
   Type: SSH Username with private key
   Username: ubuntu
   Private key: paste your EC2 .pem file contents

2. ID: ec2-host
   Type: Secret text
   Value: YOUR_EC2_PUBLIC_IP

3. ID: slack-webhook   (optional)
   Type: Secret text
   Value: your Slack webhook URL
```

### Step 4 — Configure NodeJS tool
```
Manage Jenkins → Tools → NodeJS → Add:
  Name: NodeJS-20
  Version: NodeJS 20.x
  ✅ Install automatically
```

### Step 5 — Create Pipeline job
```
New Item → Pipeline → OK
  Definition: Pipeline script from SCM
  SCM: Git
  Repository URL: https://github.com/YOUR_ORG/edusync-cms
  Branch: */main
  Script Path: Jenkinsfile
  Build Triggers: ✅ GitHub hook trigger for GITScm polling
```

### Step 6 — GitHub webhook
```
GitHub repo → Settings → Webhooks → Add webhook:
  Payload URL: http://YOUR_JENKINS_IP:8080/github-webhook/
  Content type: application/json
  Events: ✅ Pushes
```

---

## Running Tests Locally

```bash
cd backend
npm test                  # run all tests with coverage
npm run test:ci           # CI mode (generates junit.xml)
npm run lint              # check code style
```

---

## Deployment Flow (what Jenkins does automatically)

```
GitHub push
    ↓
Jenkins webhook triggered
    ↓
1. Checkout code from GitHub
    ↓
2. npm ci (install dependencies)
    ↓
3. ESLint (code quality check)
    ↓
4. Jest tests (68 tests + coverage report)
    ↓
5. SSH into EC2 → git pull → npm ci → pm2 restart
    ↓
6. scp frontend files → Nginx reload
    ↓
7. curl /health → confirm API is live
    ↓
Slack notification (✅ success or ❌ failure)
```

---

## Rating Breakdown

| Criteria              | Score |
|-----------------------|-------|
| Tech stack            | 9/10  |
| CI/CD pipeline        | 8.5/10|
| Real-world relevance  | 8/10  |
| AWS integration       | 7.5/10|
| Code quality & tests  | 7/10  |
| Security (JWT, rate limiting) | 7/10 |
| **Overall**           | **7.8/10** |

---

## License

MIT — free to use for academic and internship projects.
