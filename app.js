/* ===================================================
   EduSync — Main Application JS
   Vanilla JS SPA — no framework needed
   =================================================== */

const API = 'http://localhost:4000/api';

// ── Auth guard ──────────────────────────────────────
const token    = localStorage.getItem('token');
const role     = localStorage.getItem('role');
const username = localStorage.getItem('username');
const userId   = localStorage.getItem('userId');

if (!token) { window.location.href = 'login.html'; }

// ── Navigation config ────────────────────────────────
const NAV = {
  student: [
    { id:'dashboard',     label:'Dashboard',     icon:'⊞' },
    { id:'attendance',    label:'Attendance',    icon:'✓' },
    { id:'marks',         label:'Marks & Results',icon:'◈'},
    { id:'fees',          label:'Fee Management',icon:'◉' },
    { id:'notifications', label:'Notifications', icon:'◬' },
  ],
  faculty: [
    { id:'dashboard',     label:'Dashboard',     icon:'⊞' },
    { id:'students',      label:'Students',      icon:'◎' },
    { id:'attendance',    label:'Attendance',    icon:'✓' },
    { id:'marks',         label:'Marks',         icon:'◈' },
    { id:'notifications', label:'Notifications', icon:'◬' },
    { id:'cicd',          label:'CI/CD Pipeline',icon:'⚙' },
  ],
  admin: [
    { id:'dashboard',     label:'Dashboard',     icon:'⊞' },
    { id:'students',      label:'Students',      icon:'◎' },
    { id:'attendance',    label:'Attendance',    icon:'✓' },
    { id:'marks',         label:'Marks',         icon:'◈' },
    { id:'faculty',       label:'Faculty',       icon:'⚇' },
    { id:'fees',          label:'Fee Management',icon:'◉' },
    { id:'notifications', label:'Notifications', icon:'◬' },
    { id:'cicd',          label:'CI/CD Pipeline',icon:'⚙' },
  ]
};

let currentPage = 'dashboard';
let notifUnread = 2;

// ── API helper ───────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (res.status === 401) { logout(); return null; }
  return res.json();
}

// ── Toast ────────────────────────────────────────────
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Init sidebar ─────────────────────────────────────
function initSidebar() {
  const nav   = document.getElementById('sidebarNav');
  const items = NAV[role] || NAV.student;
  nav.innerHTML = items.map(n => `
    <div class="nav-item ${n.id==='dashboard'?'active':''}" 
         id="nav-${n.id}" onclick="navigate('${n.id}')">
      <span class="nav-icon">${n.icon}</span>
      <span>${n.label}</span>
      ${n.id==='notifications'?`<span class="nav-badge" id="navNotifBadge">${notifUnread}</span>`:''}
    </div>
  `).join('');

  document.getElementById('sidebarUser').innerHTML = `
    <div class="user-info">
      <div class="user-avatar">${username.slice(0,2).toUpperCase()}</div>
      <div>
        <div class="user-name">${username}</div>
        <div class="user-role">${role}</div>
      </div>
    </div>
    <button class="logout-btn" onclick="logout()">⏏ Sign Out</button>
  `;
}

// ── Navigate ─────────────────────────────────────────
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${page}`);
  if (navEl) navEl.classList.add('active');

  const titles = {
    dashboard:'Dashboard', students:'Students', attendance:'Attendance',
    marks:'Marks & Results', faculty:'Faculty', fees:'Fee Management',
    notifications:'Notifications', cicd:'CI/CD Pipeline'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  document.getElementById('contentArea').innerHTML = '<div class="loading"><div class="spinner-sm"></div> Loading…</div>';

  const pages = {
    dashboard, students, attendance, marks,
    faculty, fees, notifications, cicd
  };
  if (pages[page]) pages[page]();
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// ═══════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════
async function dashboard() {
  const area = document.getElementById('contentArea');

  const metrics = {
    student: [
      { label:'Attendance', value:'87%',    icon:'📋', color:'var(--teal)' },
      { label:'CGPA',       value:'8.70',   icon:'🏆', color:'var(--purple)' },
      { label:'Pending Fees',value:'₹12,000',icon:'💳', color:'var(--coral)' },
      { label:'Notifications',value:'2 New', icon:'🔔', color:'var(--gold)' },
    ],
    faculty: [
      { label:'Total Students', value:'263', icon:'👨‍🎓', color:'var(--teal)' },
      { label:'Avg Attendance', value:'79%', icon:'📋', color:'var(--purple)' },
      { label:'Classes Today',  value:'3',   icon:'📚', color:'var(--blue)' },
      { label:'Pending Reviews',value:'14',  icon:'✏️',  color:'var(--coral)' },
    ],
    admin: [
      { label:'Total Students',  value:'1,847',  icon:'👨‍🎓', color:'var(--teal)' },
      { label:'Faculty Members', value:'87',     icon:'👨‍🏫', color:'var(--purple)' },
      { label:'Fees Collected',  value:'₹2.4Cr', icon:'💰', color:'var(--gold)' },
      { label:'Active Alerts',   value:'5',      icon:'⚠️',  color:'var(--coral)' },
    ]
  };

  const m = metrics[role] || metrics.student;

  area.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h2>${role==='student'?'My Dashboard':role==='faculty'?'Faculty Dashboard':'Admin Overview'}</h2>
          <p>${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </div>

      <div class="metrics-grid">
        ${m.map(x=>`
          <div class="metric-card">
            <div class="metric-icon">${x.icon}</div>
            <div class="metric-label">${x.label}</div>
            <div class="metric-value" style="color:${x.color}">${x.value}</div>
          </div>
        `).join('')}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">${role==='student'?'Subject Attendance':'Recent Activity'}</div>
          ${role==='student' ? subjectMiniChart() : recentActivity()}
        </div>
        <div class="card">
          <div class="card-title">CI/CD Pipeline Status</div>
          ${pipelineMini()}
        </div>
      </div>
    </div>
  `;
}

function subjectMiniChart() {
  const subjects = [
    { name:'Data Structures', pct:87 },
    { name:'Operating Systems', pct:83 },
    { name:'DBMS', pct:95 },
    { name:'Computer Networks', pct:82 },
    { name:'Software Engineering', pct:87 },
  ];
  return subjects.map(s => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
        <span style="font-size:13px;font-weight:500">${s.name}</span>
        <span style="font-size:13px;font-weight:700;color:${s.pct>=75?'var(--teal)':'var(--coral)'}">
          ${s.pct}%
        </span>
      </div>
      <div class="progress-wrap">
        <div class="progress-fill ${s.pct>=75?'progress-green':'progress-red'}" style="width:${s.pct}%"></div>
      </div>
    </div>
  `).join('');
}

function recentActivity() {
  const acts = [
    'Student registration: Pooja Verma (CS2412)',
    'Fee payment received: ₹45,000 (ME1903)',
    'Attendance updated: OS Lab (Nov 22)',
    'Result published: Mid-sem DSA',
    'Jenkins Build #247 triggered'
  ];
  return acts.map((a,i) => `
    <div style="font-size:13px;padding:9px 0;border-bottom:${i<4?'1px solid var(--border)':'none'};color:var(--text2)">
      <span style="color:var(--teal);margin-right:8px">●</span>${a}
    </div>
  `).join('');
}

function pipelineMini() {
  const steps = [
    { name:'Code Push',      status:'done' },
    { name:'Build (npm)',    status:'done' },
    { name:'Unit Tests',     status:'done' },
    { name:'Code Analysis',  status:'done' },
    { name:'Deploy to AWS',  status:'running' },
    { name:'Health Check',   status:'pending' },
  ];
  return `
    <div style="padding:10px 12px;background:#FFF8EC;border-radius:8px;border:1px solid rgba(201,168,76,0.3);margin-bottom:14px;display:flex;align-items:center;gap:10px;">
      <span style="font-size:16px">🔨</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--navy)">Build #247 — Running</div>
        <div style="font-size:12px;color:var(--muted)">Deploy to AWS step • 2m 14s</div>
      </div>
      <span class="badge badge-amber">Active</span>
    </div>
    ${steps.map(s=>`
      <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:14px;width:20px;text-align:center;color:${s.status==='done'?'var(--teal)':s.status==='running'?'var(--gold)':'var(--muted)'}">
          ${s.status==='done'?'✓':s.status==='running'?'⟳':'○'}
        </span>
        <span style="font-size:13px;flex:1">${s.name}</span>
        <span style="font-size:11px;font-weight:600;color:${s.status==='done'?'var(--teal)':s.status==='running'?'var(--gold)':'var(--muted)'}">
          ${s.status==='done'?'Done':s.status==='running'?'Running…':'Queued'}
        </span>
      </div>
    `).join('')}
  `;
}

// ═══════════════════════════════════════════════════
//  STUDENTS
// ═══════════════════════════════════════════════════
async function students() {
  const area = document.getElementById('contentArea');

  // Try live API, fall back to sample data
  let data = [];
  try {
    const res = await api('GET', '/students');
    if (res && Array.isArray(res)) data = res;
  } catch(e) {}

  if (!data.length) {
    data = [
      { student_id:'CS2101', name:'Arjun Sharma',  department:'Computer Science', year:3, cgpa:8.7, fee_status:'paid',    attendance:87 },
      { student_id:'EC2045', name:'Priya Patel',   department:'Electronics',      year:2, cgpa:9.1, fee_status:'paid',    attendance:92 },
      { student_id:'ME1903', name:'Rohan Mehta',   department:'Mechanical',       year:4, cgpa:7.4, fee_status:'pending', attendance:74 },
      { student_id:'CS2298', name:'Anjali Singh',  department:'Computer Science', year:2, cgpa:9.4, fee_status:'paid',    attendance:95 },
      { student_id:'CE1801', name:'Vikram Nair',   department:'Civil',            year:4, cgpa:6.9, fee_status:'overdue', attendance:61 },
      { student_id:'CS2356', name:'Sneha Iyer',    department:'Computer Science', year:3, cgpa:8.2, fee_status:'paid',    attendance:81 },
    ];
  }

  area.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div><h2>Student Management</h2><p>${data.length} students enrolled</p></div>
        ${role==='admin'?`<button class="btn btn-primary" onclick="showAddStudent()">+ Enroll Student</button>`:''}
      </div>
      <div class="card">
        <div class="search-bar">
          <input type="text" id="studentSearch" placeholder="Search by name or ID…" oninput="filterStudents()">
          <select id="deptFilter" onchange="filterStudents()">
            <option value="">All Departments</option>
            <option>Computer Science</option>
            <option>Electronics</option>
            <option>Mechanical</option>
            <option>Civil</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student ID</th><th>Name</th><th>Department</th>
              <th>Year</th><th>CGPA</th><th>Attendance</th><th>Fee</th>
            </tr>
          </thead>
          <tbody id="studentTable">
            ${renderStudentRows(data)}
          </tbody>
        </table>
        <p style="font-size:12px;color:var(--muted);margin-top:12px" id="studentCount">
          Showing ${data.length} students
        </p>
      </div>
    </div>
  `;
  window._studentData = data;
}

function renderStudentRows(data) {
  const feeClass = { paid:'badge-green', pending:'badge-amber', overdue:'badge-red' };
  return data.map(s => `
    <tr>
      <td><code style="font-size:13px;color:var(--blue)">${s.student_id}</code></td>
      <td><strong>${s.name}</strong></td>
      <td style="color:var(--muted)">${s.department}</td>
      <td>Year ${s.year}</td>
      <td><strong style="color:${s.cgpa>=9?'var(--teal)':s.cgpa>=7.5?'var(--blue)':'var(--muted)'}">${s.cgpa}</strong></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="progress-wrap" style="width:52px">
            <div class="progress-fill ${s.attendance>=75?'progress-green':'progress-red'}" style="width:${s.attendance}%"></div>
          </div>
          <span style="font-size:13px;font-weight:600;color:${s.attendance>=75?'var(--teal)':'var(--coral)'}">${s.attendance}%</span>
        </div>
      </td>
      <td><span class="badge ${feeClass[s.fee_status]||'badge-blue'}">${s.fee_status||'paid'}</span></td>
    </tr>
  `).join('');
}

function filterStudents() {
  const q    = document.getElementById('studentSearch').value.toLowerCase();
  const dept = document.getElementById('deptFilter').value.toLowerCase();
  const filtered = window._studentData.filter(s =>
    (s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q)) &&
    (!dept || s.department.toLowerCase().includes(dept))
  );
  document.getElementById('studentTable').innerHTML = renderStudentRows(filtered);
  document.getElementById('studentCount').textContent = `Showing ${filtered.length} students`;
}

function showAddStudent() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="addStudentModal" onclick="closeModal(event,'addStudentModal')">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-title">Enroll New Student</div>
        <div class="form-row">
          <div class="form-group">
            <label class="field-label">Full Name</label>
            <input type="text" class="field" id="m_name" placeholder="Full name">
          </div>
          <div class="form-group">
            <label class="field-label">Student ID</label>
            <input type="text" class="field" id="m_id" placeholder="e.g. CS2101">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="field-label">Department</label>
            <select class="field" id="m_dept">
              <option>Computer Science</option>
              <option>Electronics</option>
              <option>Mechanical</option>
              <option>Civil</option>
            </select>
          </div>
          <div class="form-group">
            <label class="field-label">Year</label>
            <select class="field" id="m_year">
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="field-label">Password</label>
          <input type="password" class="field" id="m_pass" placeholder="Min 6 characters">
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal(null,'addStudentModal')">Cancel</button>
          <button class="btn btn-primary" onclick="submitAddStudent()">Enroll Student</button>
        </div>
      </div>
    </div>
  `);
}

async function submitAddStudent() {
  const name = document.getElementById('m_name').value.trim();
  const id   = document.getElementById('m_id').value.trim();
  const dept = document.getElementById('m_dept').value;
  const year = document.getElementById('m_year').value;
  const pass = document.getElementById('m_pass').value;
  if (!name||!id||!pass) { showToast('Fill all fields','error'); return; }

  try {
    await api('POST','/auth/register',{username:id,password:pass,role:'student',name,department:dept,year:parseInt(year)});
    closeModal(null,'addStudentModal');
    showToast('Student enrolled successfully!');
    students();
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

function closeModal(e, id) {
  if (!e || e.target.classList.contains('modal-overlay')) {
    const m = document.getElementById(id);
    if (m) m.remove();
  }
}

// ═══════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════
async function attendance() {
  const area = document.getElementById('contentArea');

  let data = [];
  try {
    const sid = userId || 1;
    const res = await api('GET', `/students/${sid}/attendance`);
    if (res && Array.isArray(res)) data = res;
  } catch(e) {}

  if (!data.length) {
    data = [
      { subject:'Data Structures',     total:45, present:39, faculty:'Dr. Krishnan',  percentage:86.7 },
      { subject:'Operating Systems',   total:42, present:35, faculty:'Prof. Desai',   percentage:83.3 },
      { subject:'DBMS',                total:40, present:38, faculty:'Dr. Rao',       percentage:95.0 },
      { subject:'Computer Networks',   total:44, present:36, faculty:'Prof. Mishra',  percentage:81.8 },
      { subject:'Software Engineering',total:38, present:33, faculty:'Dr. Ghosh',     percentage:86.8 },
    ];
  }

  const overall = Math.round(data.reduce((a,s)=>a+(parseFloat(s.percentage)||0),0)/data.length);

  area.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div><h2>Attendance Management</h2><p>Academic Year 2024–25 · Semester 5</p></div>
        ${role!=='student'?`<button class="btn btn-primary" onclick="showMarkAttendance()">Mark Attendance</button>`:''}
      </div>

      <div class="grid-3" style="margin-bottom:24px">
        <div class="metric-card" style="border-left:4px solid var(--teal)">
          <div class="metric-label">Overall Attendance</div>
          <div class="metric-value" style="color:var(--teal)">${overall}%</div>
          <div class="metric-sub">Min required: 75%</div>
        </div>
        <div class="metric-card" style="border-left:4px solid var(--gold)">
          <div class="metric-label">Classes Attended</div>
          <div class="metric-value" style="color:var(--gold)">${data.reduce((a,s)=>a+s.present,0)} / ${data.reduce((a,s)=>a+s.total,0)}</div>
          <div class="metric-sub">Across all subjects</div>
        </div>
        <div class="metric-card" style="border-left:4px solid var(--coral)">
          <div class="metric-label">Shortage Alert</div>
          <div class="metric-value" style="color:var(--coral)">${data.filter(s=>parseFloat(s.percentage)<75).length} Subject${data.filter(s=>parseFloat(s.percentage)<75).length!==1?'s':''}</div>
          <div class="metric-sub">Below 75% threshold</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Subject-wise Attendance</div>
        ${data.map(s => {
          const pct = parseFloat(s.percentage) || Math.round((s.present/s.total)*100);
          const needed = pct<75 ? Math.ceil((0.75*s.total - s.present)/0.25) : 0;
          return `
            <div class="attendance-item">
              <div class="att-header">
                <div>
                  <div class="att-subject">${s.subject}</div>
                  ${s.faculty?`<div class="att-faculty">Faculty: ${s.faculty}</div>`:''}
                </div>
                <div>
                  <div class="att-pct" style="color:${pct>=75?'var(--teal)':'var(--coral)'}">${pct}%</div>
                  <div class="att-count">${s.present}/${s.total} classes</div>
                </div>
              </div>
              <div class="progress-wrap">
                <div class="progress-fill ${pct>=75?'progress-green':'progress-red'}" style="width:${pct}%"></div>
              </div>
              ${needed>0?`<p style="font-size:12px;color:var(--coral);margin-top:7px;font-weight:500">⚠ Attend ${needed} more classes to reach 75%</p>`:''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function showMarkAttendance() {
  document.body.insertAdjacentHTML('beforeend',`
    <div class="modal-overlay open" id="markAttModal" onclick="closeModal(event,'markAttModal')">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-title">Mark Attendance</div>
        <div class="form-group">
          <label class="field-label">Subject</label>
          <select class="field" id="att_subject">
            <option>Data Structures</option>
            <option>Operating Systems</option>
            <option>DBMS</option>
            <option>Computer Networks</option>
            <option>Software Engineering</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Date</label>
          <input type="date" class="field" id="att_date" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div class="form-group">
          <label class="field-label">Student ID</label>
          <input type="text" class="field" id="att_sid" placeholder="e.g. CS2101">
        </div>
        <div class="form-group">
          <label class="field-label">Status</label>
          <select class="field" id="att_status">
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal(null,'markAttModal')">Cancel</button>
          <button class="btn btn-primary" onclick="submitAttendance()">Save</button>
        </div>
      </div>
    </div>
  `);
}

async function submitAttendance() {
  const subject    = document.getElementById('att_subject').value;
  const date       = document.getElementById('att_date').value;
  const student_id = document.getElementById('att_sid').value.trim();
  const status     = document.getElementById('att_status').value;
  if (!student_id) { showToast('Enter student ID','error'); return; }
  try {
    await api('POST','/attendance',{student_id,subject,date,status});
    closeModal(null,'markAttModal');
    showToast('Attendance recorded!');
  } catch(e) { showToast('Error saving attendance','error'); }
}

// ═══════════════════════════════════════════════════
//  MARKS
// ═══════════════════════════════════════════════════
async function marks() {
  const area = document.getElementById('contentArea');

  let data = [];
  try {
    const res = await api('GET',`/students/${userId||1}/marks`);
    if (res && Array.isArray(res)) data = res;
  } catch(e) {}

  if (!data.length) {
    data = [
      { subject:'Data Structures',     internal:28, mid_sem:42, end_sem:71, semester:5 },
      { subject:'Operating Systems',   internal:25, mid_sem:38, end_sem:65, semester:5 },
      { subject:'DBMS',                internal:29, mid_sem:45, end_sem:78, semester:5 },
      { subject:'Computer Networks',   internal:27, mid_sem:40, end_sem:69, semester:5 },
      { subject:'Software Engineering',internal:26, mid_sem:43, end_sem:74, semester:5 },
    ];
  }

  function getGrade(total) {
    const p = total/180;
    if(p>=0.9) return {g:'O',  gp:10, c:'var(--teal)'};
    if(p>=0.8) return {g:'A+', gp:9,  c:'var(--teal)'};
    if(p>=0.7) return {g:'A',  gp:8,  c:'var(--blue)'};
    if(p>=0.6) return {g:'B+', gp:7,  c:'var(--blue)'};
    if(p>=0.5) return {g:'B',  gp:6,  c:'var(--muted)'};
    return      {g:'F',  gp:0,  c:'var(--coral)'};
  }

  const cgpa = (data.reduce((a,m)=>a+getGrade(m.internal+m.mid_sem+m.end_sem).gp,0)/data.length).toFixed(2);

  area.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div><h2>Marks & Results</h2><p>Semester 5 · B.Tech · 2024–25</p></div>
        ${role!=='student'?`<button class="btn btn-primary" onclick="showAddMarks()">+ Enter Marks</button>`:''}
      </div>

      <div class="card">
        <div class="marks-summary">
          <div class="marks-stat">
            <div class="val" style="color:var(--purple)">${cgpa}</div>
            <div class="lbl">CGPA</div>
          </div>
          <div style="width:1px;background:var(--border)"></div>
          <div class="marks-stat">
            <div class="val" style="color:var(--teal)">${data.length * 4}</div>
            <div class="lbl">Credits</div>
          </div>
          <div style="width:1px;background:var(--border)"></div>
          <div class="marks-stat">
            <div class="val" style="color:var(--blue)">${data.filter(m=>m.internal+m.mid_sem+m.end_sem>=90).length}</div>
            <div class="lbl">O Grades</div>
          </div>
          <div style="width:1px;background:var(--border)"></div>
          <div class="marks-stat">
            <div class="val" style="color:var(--gold)">${data.reduce((a,m)=>a+m.internal+m.mid_sem+m.end_sem,0)}</div>
            <div class="lbl">Total Marks</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Internal <span style="font-weight:400">/30</span></th>
              <th>Mid-Sem <span style="font-weight:400">/50</span></th>
              <th>End-Sem <span style="font-weight:400">/100</span></th>
              <th>Total <span style="font-weight:400">/180</span></th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(m => {
              const total = m.internal + m.mid_sem + m.end_sem;
              const {g, gp, c} = getGrade(total);
              return `
                <tr>
                  <td><strong>${m.subject}</strong></td>
                  <td>${m.internal}<span style="color:var(--muted);font-size:12px">/30</span></td>
                  <td>${m.mid_sem}<span style="color:var(--muted);font-size:12px">/50</span></td>
                  <td>${m.end_sem}<span style="color:var(--muted);font-size:12px">/100</span></td>
                  <td><strong>${total}</strong><span style="color:var(--muted);font-size:12px">/180</span></td>
                  <td>
                    <span style="font-weight:700;color:${c};font-size:15px">${g}</span>
                    <span style="color:var(--muted);font-size:12px;margin-left:4px">(${gp}.0)</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function showAddMarks() {
  document.body.insertAdjacentHTML('beforeend',`
    <div class="modal-overlay open" id="marksModal" onclick="closeModal(event,'marksModal')">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-title">Enter Marks</div>
        <div class="form-row">
          <div class="form-group">
            <label class="field-label">Student ID</label>
            <input type="text" class="field" id="mk_sid" placeholder="e.g. CS2101">
          </div>
          <div class="form-group">
            <label class="field-label">Subject</label>
            <select class="field" id="mk_sub">
              <option>Data Structures</option>
              <option>Operating Systems</option>
              <option>DBMS</option>
              <option>Computer Networks</option>
              <option>Software Engineering</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="field-label">Internal /30</label>
            <input type="number" class="field" id="mk_int" min="0" max="30">
          </div>
          <div class="form-group">
            <label class="field-label">Mid-Sem /50</label>
            <input type="number" class="field" id="mk_mid" min="0" max="50">
          </div>
        </div>
        <div class="form-group">
          <label class="field-label">End-Sem /100</label>
          <input type="number" class="field" id="mk_end" min="0" max="100">
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal(null,'marksModal')">Cancel</button>
          <button class="btn btn-primary" onclick="submitMarks()">Save Marks</button>
        </div>
      </div>
    </div>
  `);
}

async function submitMarks() {
  const sid      = document.getElementById('mk_sid').value.trim();
  const subject  = document.getElementById('mk_sub').value;
  const internal = parseInt(document.getElementById('mk_int').value);
  const mid_sem  = parseInt(document.getElementById('mk_mid').value);
  const end_sem  = parseInt(document.getElementById('mk_end').value);
  if (!sid) { showToast('Enter student ID','error'); return; }
  try {
    await api('POST','/marks',{student_id:sid, subject, internal, mid_sem, end_sem, semester:5});
    closeModal(null,'marksModal');
    showToast('Marks saved!');
  } catch(e) { showToast('Error saving marks','error'); }
}

// ═══════════════════════════════════════════════════
//  FACULTY
// ═══════════════════════════════════════════════════
async function faculty() {
  const area = document.getElementById('contentArea');
  const data = [
    { name:'Dr. Krishnan', dept:'CS', subjects:['Data Structures','Algorithms'],   students:62, rating:4.7, exp:'12 yrs' },
    { name:'Prof. Desai',  dept:'CS', subjects:['Operating Systems'],              students:45, rating:4.3, exp:'8 yrs'  },
    { name:'Dr. Rao',      dept:'CS', subjects:['DBMS','Big Data Analytics'],      students:58, rating:4.8, exp:'15 yrs' },
    { name:'Prof. Mishra', dept:'CS', subjects:['Computer Networks'],              students:51, rating:4.1, exp:'6 yrs'  },
    { name:'Dr. Ghosh',    dept:'CS', subjects:['Software Engineering'],           students:47, rating:4.5, exp:'10 yrs' },
    { name:'Prof. Nair',   dept:'CS', subjects:['Machine Learning','Python'],      students:55, rating:4.6, exp:'9 yrs'  },
  ];
  area.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div><h2>Faculty Directory</h2><p>${data.length} faculty members</p></div>
        ${role==='admin'?`<button class="btn btn-primary" onclick="showToast('Feature coming soon')">+ Add Faculty</button>`:''}
      </div>
      <div class="faculty-grid">
        ${data.map(f => `
          <div class="faculty-card">
            <div class="faculty-avatar">${f.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
            <div class="faculty-name">${f.name}</div>
            <div class="faculty-dept">Dept. of ${f.dept} · ${f.exp}</div>
            <div class="faculty-subjects">
              ${f.subjects.map(s=>`<span class="subject-tag">${s}</span>`).join('')}
            </div>
            <div class="faculty-stats">
              <div class="faculty-stat"><strong>${f.students}</strong> students</div>
              <div class="faculty-stat" style="margin-left:auto">★ <strong>${f.rating}</strong></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════
//  FEES
// ═══════════════════════════════════════════════════
async function fees() {
  const area = document.getElementById('contentArea');

  let data = [];
  try {
    const res = await api('GET',`/fees/${userId||1}`);
    if (res && Array.isArray(res)) data = res;
  } catch(e) {}

  if (!data.length) {
    data = [
      { id:1, item:'Tuition Fee',  amount:85000, paid:85000, due_date:'2024-07-15', status:'paid'    },
      { id:2, item:'Hostel Fee',   amount:45000, paid:45000, due_date:'2024-07-15', status:'paid'    },
      { id:3, item:'Lab Fee',      amount:8500,  paid:0,     due_date:'2024-11-30', status:'pending' },
      { id:4, item:'Library Fee',  amount:2000,  paid:2000,  due_date:'2024-07-15', status:'paid'    },
      { id:5, item:'Exam Fee',     amount:3500,  paid:0,     due_date:'2024-12-10', status:'pending' },
    ];
  }

  const totalPaid    = data.reduce((a,f)=>a+parseFloat(f.paid),0);
  const totalPending = data.reduce((a,f)=>a+(parseFloat(f.amount)-parseFloat(f.paid)),0);
  const totalAmount  = data.reduce((a,f)=>a+parseFloat(f.amount),0);

  area.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div><h2>Fee Management</h2><p>Academic Year 2024–25</p></div>
      </div>

      <div class="fee-summary">
        <div class="metric-card" style="border-left:4px solid var(--teal)">
          <div class="metric-label">Total Paid</div>
          <div class="metric-value" style="color:var(--teal)">₹${totalPaid.toLocaleString('en-IN')}</div>
        </div>
        <div class="metric-card" style="border-left:4px solid var(--coral)">
          <div class="metric-label">Pending Amount</div>
          <div class="metric-value" style="color:var(--coral)">₹${totalPending.toLocaleString('en-IN')}</div>
        </div>
        <div class="metric-card" style="border-left:4px solid var(--gold)">
          <div class="metric-label">Total Fees</div>
          <div class="metric-value" style="color:var(--gold)">₹${totalAmount.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr><th>Fee Component</th><th>Amount</th><th>Paid</th><th>Due Date</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${data.map(f => `
              <tr>
                <td><strong>${f.item}</strong></td>
                <td>₹${parseFloat(f.amount).toLocaleString('en-IN')}</td>
                <td>₹${parseFloat(f.paid).toLocaleString('en-IN')}</td>
                <td>${f.due_date}</td>
                <td>
                  <span class="badge ${f.status==='paid'?'badge-green':f.status==='overdue'?'badge-red':'badge-amber'}">
                    ${f.status==='paid'?'✓ Paid':f.status==='overdue'?'Overdue':'Pending'}
                  </span>
                </td>
                <td>
                  ${f.status!=='paid'
                    ?`<button class="btn btn-primary btn-sm" onclick="payFee(${f.id},${f.amount})">Pay Now</button>`
                    :`<span style="color:var(--muted);font-size:13px">—</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function payFee(feeId, amount) {
  if (!confirm(`Pay ₹${amount.toLocaleString('en-IN')}?`)) return;
  try {
    await api('PATCH',`/fees/${feeId}/pay`,{amount});
    showToast('Payment recorded successfully!');
    fees();
  } catch(e) { showToast('Payment recorded (demo mode)'); fees(); }
}

// ═══════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════
let notifData = [
  { id:1, type:'alert',   title:'Exam Schedule Released',   body:'End semester examinations begin Dec 18. Check hall ticket and exam center.',       time:'2h ago',  is_read:false },
  { id:2, type:'info',    title:'Fee Reminder',             body:'Lab fee of ₹8,500 due by Nov 30, 2024. Pay via student portal before deadline.',   time:'1d ago',  is_read:false },
  { id:3, type:'success', title:'Attendance Approved',      body:'Medical leave for Oct 14–16 approved by HOD. Attendance has been updated.',        time:'2d ago',  is_read:true  },
  { id:4, type:'info',    title:'Guest Lecture: AI',        body:'Dr. Anand Krishnamurthy, IIT Bombay — AI in Healthcare. Dec 5, 2pm, Seminar Hall.', time:'3d ago', is_read:true  },
  { id:5, type:'alert',   title:'Assignment Deadline',      body:'Software Engineering Assignment 3 due Nov 28, 11:59 PM. Submit on portal.',        time:'4d ago',  is_read:true  },
];

async function notifications() {
  const area = document.getElementById('contentArea');

  try {
    const res = await api('GET','/notifications');
    if (res && Array.isArray(res) && res.length) notifData = res;
  } catch(e) {}

  renderNotifications(area);
}

function renderNotifications(area) {
  const unread  = notifData.filter(n=>!n.is_read).length;
  const iconMap = { alert:'⚠️', info:'ℹ️', success:'✅' };

  area.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h2>Notifications <span style="font-size:14px;background:var(--coral);color:#fff;border-radius:12px;padding:2px 8px;margin-left:8px;vertical-align:middle">${unread}</span></h2>
        </div>
        <button class="btn btn-outline" onclick="markAllRead()">Mark all read</button>
      </div>
      ${notifData.map(n => `
        <div class="notif-item ${n.is_read?'':'unread'}" onclick="markRead(${n.id})" id="notif-${n.id}">
          <div class="notif-icon">${iconMap[n.type]||'📌'}</div>
          <div style="flex:1">
            <div class="notif-title">${n.title}</div>
            <div class="notif-body">${n.body}</div>
            <div class="notif-time">${n.time||n.created_at||''}</div>
          </div>
          ${!n.is_read?`<div class="notif-dot"></div>`:''}
        </div>
      `).join('')}
    </div>
  `;

  // Update sidebar badge
  notifUnread = unread;
  const badge = document.getElementById('navNotifBadge');
  if (badge) { badge.textContent = unread; badge.style.display = unread?'':'none'; }
  const topBadge = document.getElementById('notifCount');
  if (topBadge) { topBadge.textContent = unread; topBadge.style.display = unread?'flex':'none'; }
}

function markRead(id) {
  notifData = notifData.map(n => n.id===id?{...n,is_read:true}:n);
  renderNotifications(document.getElementById('contentArea'));
}

function markAllRead() {
  notifData = notifData.map(n=>({...n,is_read:true}));
  renderNotifications(document.getElementById('contentArea'));
}

// ═══════════════════════════════════════════════════
//  CI/CD PIPELINE
// ═══════════════════════════════════════════════════
function cicd() {
  const area = document.getElementById('contentArea');
  const steps = [
    { n:'Code Push',         d:'Developer pushes to GitHub feature branch',    s:'done',    t:'0:12' },
    { n:'Install Deps',      d:'npm ci — installs all dependencies cleanly',   s:'done',    t:'0:48' },
    { n:'Unit Tests',        d:'Jest runs 68 tests with coverage report',      s:'done',    t:'1:23' },
    { n:'Lint Check',        d:'ESLint validates code style & quality',        s:'done',    t:'0:18' },
    { n:'Deploy to AWS EC2', d:'SSH into EC2, pull latest, pm2 restart',       s:'running', t:'—'    },
    { n:'Health Check',      d:'curl /health endpoint — confirms app is live', s:'pending', t:'—'    },
  ];

  const builds = [
    { num:247, branch:'feature/fee-module',      status:'running', time:'2m 14s', who:'Arjun S.'  },
    { num:246, branch:'main',                    status:'success', time:'4m 32s', who:'Priya P.'  },
    { num:245, branch:'fix/attendance-bug',      status:'success', time:'3m 58s', who:'Rohan M.'  },
    { num:244, branch:'feature/notifications',   status:'failed',  time:'1m 12s', who:'Anjali S.' },
    { num:243, branch:'main',                    status:'success', time:'5m 01s', who:'Vikram N.' },
  ];

  const jenkinsCode = `pipeline {
  <span class="kw">agent</span> any

  <span class="kw">environment</span> {
    AWS_HOST    = <span class="str">'ec2-xx-xx-xx.ap-south-1.compute.amazonaws.com'</span>
    AWS_USER    = <span class="str">'ubuntu'</span>
    APP_DIR     = <span class="str">'/home/ubuntu/edusync'</span>
    PM2_APP     = <span class="str">'edusync-api'</span>
    NODE_ENV    = <span class="str">'production'</span>
  }

  <span class="kw">tools</span> { nodejs <span class="str">'NodeJS-20'</span> }

  <span class="kw">stages</span> {

    <span class="kw">stage</span>(<span class="str">'Checkout'</span>) {
      <span class="kw">steps</span> {
        checkout scm
        sh <span class="str">'node --version && npm --version'</span>
      }
    }

    <span class="kw">stage</span>(<span class="str">'Install Dependencies'</span>) {
      <span class="kw">steps</span> {
        dir(<span class="str">'backend'</span>) { sh <span class="str">'npm ci'</span> }
        dir(<span class="str">'frontend'</span>) { sh <span class="str">'npm ci'</span> }
      }
    }

    <span class="kw">stage</span>(<span class="str">'Run Tests'</span>) {
      <span class="kw">steps</span> {
        dir(<span class="str">'backend'</span>) {
          sh <span class="str">'npm test -- --coverage --ci'</span>
        }
      }
      <span class="kw">post</span> {
        always {
          junit <span class="str">'backend/coverage/junit.xml'</span>
        }
      }
    }

    <span class="kw">stage</span>(<span class="str">'Lint'</span>) {
      <span class="kw">steps</span> {
        dir(<span class="str">'backend'</span>) { sh <span class="str">'npm run lint'</span> }
      }
    }

    <span class="kw">stage</span>(<span class="str">'Deploy to AWS EC2'</span>) {
      <span class="kw">steps</span> {
        sshagent([<span class="str">'aws-ec2-key'</span>]) {
          sh <span class="str">"""
            ssh -o StrictHostKeyChecking=no \\
              \${AWS_USER}@\${AWS_HOST} '
                cd \${APP_DIR} &&
                git pull origin main &&
                npm ci --prefix backend &&
                cp frontend/build/* /var/www/html/ &&
                pm2 restart \${PM2_APP} &&
                echo "✅ Deployed!"
              '
          """</span>
        }
      }
    }

    <span class="kw">stage</span>(<span class="str">'Health Check'</span>) {
      <span class="kw">steps</span> {
        sh <span class="str">'sleep 10 && curl -f http://\${AWS_HOST}:4000/health'</span>
      }
    }
  }

  <span class="kw">post</span> {
    success {
      slackSend color: <span class="str">'#1A8A72'</span>,
        message: <span class="str">"✅ EduSync #\${env.BUILD_NUMBER} deployed!"</span>
    }
    failure {
      slackSend color: <span class="str">'#C94C4C'</span>,
        message: <span class="str">"❌ Build #\${env.BUILD_NUMBER} FAILED"</span>
    }
    always { cleanWs() }
  }
}`;

  area.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div><h2>Jenkins CI/CD Pipeline</h2><p>Auto build, test & deploy to AWS EC2 on every GitHub push</p></div>
      </div>

      <div class="grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">Pipeline Stages — Build #247</div>
          ${steps.map((s,i) => `
            <div class="pipeline-step ${s.s==='running'?'active':''}">
              <div class="step-dot step-${s.s}">
                ${s.s==='done'?'✓':s.s==='running'?'⟳':i+1}
              </div>
              <div style="flex:1">
                <div class="step-name">${s.n}</div>
                <div class="step-desc">${s.d}</div>
              </div>
              <div class="step-status" style="color:${s.s==='done'?'var(--teal)':s.s==='running'?'var(--gold)':'var(--muted)'}">
                ${s.s==='done'?s.t:s.s==='running'?'Running…':'Queued'}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card">
          <div class="card-title">Recent Build History</div>
          ${builds.map(b => `
            <div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border)">
              <span style="font-weight:700;color:var(--muted);font-size:13px;min-width:36px">#${b.num}</span>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:500;font-family:monospace">${b.branch}</div>
                <div style="font-size:11px;color:var(--muted)">${b.who} · ${b.time}</div>
              </div>
              <span class="badge ${b.status==='success'?'badge-green':b.status==='running'?'badge-amber':'badge-red'}">
                ${b.status==='success'?'✓ Passed':b.status==='running'?'⟳ Running':'✗ Failed'}
              </span>
            </div>
          `).join('')}
          <div style="padding:11px 0">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-weight:700;color:var(--muted);font-size:13px;min-width:36px">#243</span>
              <div style="flex:1"><div style="font-size:13px;font-weight:500;font-family:monospace">main</div>
              <div style="font-size:11px;color:var(--muted)">Vikram N. · 5m 01s</div></div>
              <span class="badge badge-green">✓ Passed</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div class="card-title" style="margin-bottom:0">Jenkinsfile</div>
          <span class="badge badge-blue">No Docker · No Terraform · Plain SSH Deploy</span>
        </div>
        <div class="code-block">${jenkinsCode}</div>
      </div>
    </div>
  `;
}

// ── Boot ─────────────────────────────────────────────
initSidebar();
navigate('dashboard');
