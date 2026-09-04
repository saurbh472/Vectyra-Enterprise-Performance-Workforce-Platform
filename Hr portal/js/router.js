// ═══════════════════════════════════════════════
// ROUTER & NAVIGATION SYSTEM
// ═══════════════════════════════════════════════
function initTheme() {
  const savedTheme = localStorage.getItem('PC_THEME') || 'light';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  toast(`Switched to ${newTheme === 'light' ? 'Light ☀️' : 'Dark 🌙'} Theme`, 'info');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('PC_THEME', theme);
  const label = theme === 'light' ? '☀️ Light' : '🌙 Dark';
  const authBtn = document.getElementById('authThemeBtn');
  const topBtn  = document.getElementById('topbarThemeBtn');
  if (authBtn) authBtn.textContent = label;
  if (topBtn)  topBtn.textContent  = label;
}

function renderApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appShell').style.display   = 'block';
  document.getElementById('demoBanner').style.display = isDemo ? 'flex' : 'none';

  const r = currentProfile;
  document.getElementById('sbAvatar').textContent   = avatarInitials(r?.full_name || '?');
  document.getElementById('sbName').textContent     = r?.full_name || 'User';
  document.getElementById('sbRoleText').textContent = roleLabel(r?.role);
  document.getElementById('sbRoleBadge').textContent= roleLabel(r?.role);
  document.getElementById('sbRoleBadge').className  = `sb-role-badge role-${r?.role}`;

  document.getElementById('sbNav').innerHTML = buildNav();
  refreshNotifBell();
  navigate('dashboard');
  setTimeout(checkProfileCompletion, 300);
}

function checkProfileCompletion() {
  if (!currentProfile) return;
  if (!currentProfile.department || !currentProfile.team_id) {
    openCompleteProfileModal();
  }
}

function openCompleteProfileModal() {
  const depts = allDepartments.length ? allDepartments : MOCK_DEPARTMENTS;
  const teams = allTeams.length ? allTeams : MOCK_TEAMS;

  document.getElementById('modalTitle').textContent = '👋 Welcome! Complete Your Profile';
  document.getElementById('modalSub').textContent   = 'Please select your department and team to get started';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:rgba(79,70,229,.08);border:1px solid rgba(79,70,229,.2);border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--t2)">
      Setting your department and team ensures you receive the correct feedback requests and team reviews.
    </div>
    <div class="form-group mb16">
      <label class="form-label">Department *</label>
      <select class="form-input" id="completeDept" onchange="onCompleteDeptChange(this.value)">
        <option value="">— Select Department —</option>
        ${depts.map(d => `<option value="${d.name}" ${currentProfile.department===d.name?'selected':''}>${d.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group mb16">
      <label class="form-label">Assign Team *</label>
      <select class="form-input" id="completeTeam">
        <option value="">— Select Team —</option>
        ${teams.map(t => `<option value="${t.id}" ${currentProfile.team_id===t.id?'selected':''}>${t.name} (${t.department||'General'})</option>`).join('')}
      </select>
    </div>
    <div style="margin-top:20px">
      <button class="btn btn-primary" style="width:100%" onclick="saveCompletedProfile()">Save &amp; Continue →</button>
    </div>`;

  openModal();
}

function onCompleteDeptChange(dept) {
  const teamSel = document.getElementById('completeTeam');
  if (!teamSel) return;
  const teams = allTeams.length ? allTeams : MOCK_TEAMS;
  const filtered = dept ? teams.filter(t => t.department === dept) : teams;
  teamSel.innerHTML = '<option value="">— Select Team —</option>' +
    filtered.map(t => `<option value="${t.id}">${t.name}${!dept && t.department ? ' (' + t.department + ')' : ''}</option>`).join('');
}

async function saveCompletedProfile() {
  const dept = v('completeDept');
  const teamId = v('completeTeam');

  if (!dept) return toast('Please select your department', 'warn');

  currentProfile.department = dept;
  if (teamId) currentProfile.team_id = teamId;

  if (!isDemo) {
    try {
      await API.updateUser(currentProfile.id, { department: dept, team_id: teamId || null });
    } catch(e) {
      console.warn('Profile completion update notice:', e.message);
    }
  }

  closeModal();
  toast('Profile updated successfully!', 'success');
  if (currentPage === 'dashboard') pageDashboard();
}

function buildNav() {
  const role = currentProfile?.role;
  const sections = [];

  sections.push({ label:'Overview', items:[
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'analytics', icon:'📈', label:'Analytics', roles:['super_admin','admin'] },
  ]});
  sections.push({ label:'Planning & Execution', items:[
    { id:'roadmap', icon:'🗺️', label:'Team Roadmap' },
  ]});
  sections.push({ label:'Feedback', items:[
    { id:'quarterly',  icon:'🗓️', label:'Quarterly Review' },
    { id:'submit',     icon:'✏️', label:'Submit Feedback' },
    { id:'myFeedback', icon:'📋', label:'My Submissions' },
  ]});
  if (canSeeAll()) {
    sections.push({ label:'Executive Oversight', items:[
      { id:'allFeedback', icon:'🗂️', label: 'Company Feedback', badge:'feedbackBadge' },
    ]});
  }
  if (canSeeAll()) {
    sections.push({ label:'People', items:[
      { id:'users',       icon:'👥', label:'User Management' },
      { id:'teams',       icon:'🏷️', label:'Teams' },
      { id:'departments', icon:'🏢', label:'Departments' },
      { id:'orgChart',    icon:'🌐', label:'Org Chart' },
    ]});
    sections.push({ label:'Admin', items:[
      { id:'templates', icon:'📝', label:'Form Templates' },
      { id:'cycles',    icon:'🔁', label:'Review Cycles' },
    ]});
  }
  sections.push({ label:'Account', items:[
    { id:'profile', icon:'⚙️', label:'My Profile' },
  ]});

  return sections.map(sec => `
    <div class="sb-section">
      <div class="sb-section-label">${sec.label}</div>
      ${sec.items.filter(it => !it.roles || it.roles.includes(role)).map(it => `
        <div class="sb-item" id="nav-${it.id}" onclick="navigate('${it.id}')">
          <span class="sb-icon">${it.icon}</span> ${it.label}
          ${it.badge ? `<span class="sb-badge" id="${it.badge}" style="display:none">0</span>` : ''}
        </div>`).join('')}
    </div>`).join('');
}

let currentPage = 'dashboard';

function navigate(pageId) {
  currentPage = pageId;
  document.querySelectorAll('.sb-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + pageId);
  if (navEl) navEl.classList.add('active');
  document.getElementById('pageContent').innerHTML =
    `<div class="loading"><div class="spinner"></div> Loading…</div>`;
  document.getElementById('notifPanel')?.classList.remove('open');
  document.getElementById('searchResults')?.classList.remove('open');

  const pages = {
    dashboard: pageDashboard, analytics: pageAnalytics,
    roadmap: pageTeamRoadmap,
    quarterly: pageQuarterlyFeedback,
    submit: pageSubmit, myFeedback: pageMyFeedback,
    allFeedback: pageAllFeedback, users: pageUsers,
    teams: pageTeams, departments: pageDepartments, profile: pageProfile,
    cycles: pageCycles, orgChart: pageOrgChart,
    templates: pageQuestionTemplates,
  };
  setTimeout(() => {
    const fn = pages[pageId];
    if (fn) fn();
    else document.getElementById('pageContent').innerHTML = `<div class="loading">Page not found</div>`;
  }, 50);
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkStoredSession();
});
