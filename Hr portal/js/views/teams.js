// ═══════════════════════════════════════════════
// VIEW: TEAMS MANAGEMENT (SUPER ADMIN & ADMIN)
// ═══════════════════════════════════════════════
async function pageTeams() {
  if (!canSeeAll()) return accessDenied();
  await loadMeta();
  document.getElementById('pageContent').innerHTML = `<div class="page-header">
    <div><div class="page-title">Teams Management</div><div class="page-sub">Departmental structures &amp; manager assignments</div></div>
    <div class="header-right"><button class="btn btn-primary btn-sm" onclick="openCreateTeam()">+ New Team</button></div>
  </div><div class="content fade-up">
    <div class="g3">
      ${allTeams.map(t => {
        const members = allUsers.filter(u=>u.team_id===t.id);
        return `<div class="card">
          <div class="card-header">
            <div><div class="card-title">${escapeHtml(t.name)}</div><div class="card-sub">${escapeHtml(t.department||'General')}</div></div>
            <button class="btn btn-danger btn-sm" onclick="deleteTeam('${t.id}','${escapeHtml(t.name)}')">✕</button>
          </div>
          <div class="card-body">
            <div style="font-size:11px;color:var(--t3);margin-bottom:6px;font-weight:700">Team Manager</div>
            <select class="form-input" style="padding:4px 8px;font-size:12px;margin-bottom:14px" onchange="updateTeamManager('${t.id}',this.value)">
              <option value="">— Unassigned —</option>
              ${allUsers.filter(u=>isManagerRole(u.role)).map(m=>`<option value="${m.id}" ${t.manager_id===m.id?'selected':''}>${escapeHtml(m.full_name)} (${roleLabel(m.role)})</option>`).join('')}
            </select>
            <div style="font-size:11px;color:var(--t3);margin-bottom:8px;font-weight:700">Members (${members.length})</div>
            ${members.slice(0,5).map(m=>`<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px">
              <div class="avatar" style="width:24px;height:24px;font-size:9px">${avatarInitials(m.full_name)}</div>
              <span style="font-size:12px;color:var(--t2);font-weight:500">${escapeHtml(m.full_name)}</span>
            </div>`).join('')}
            ${members.length>5?`<div style="font-size:11px;color:var(--t3)">+${members.length-5} more</div>`:''}
            ${!members.length?'<div style="font-size:12px;color:var(--t3)">No members yet</div>':''}
          </div>
        </div>`;}).join('')}
      ${!allTeams.length?`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🏷️</div><div class="empty-title">No teams created yet</div><div class="empty-sub">Click "+ New Team" above to create your first team</div></div>`:''}
    </div>
  </div>`;
}

function openCreateTeam() {
  document.getElementById('modalTitle').textContent = 'Create New Team';
  document.getElementById('modalSub').textContent   = 'Set up a team and assign a manager';
  const managers = allUsers.filter(u=>['manager','admin','super_admin'].includes(u.role));
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16"><label class="form-label">Team Name *</label><input class="form-input" id="nt_name" placeholder="e.g. Frontend Engineering"></div>
    <div class="form-group mb16"><label class="form-label">Department</label><input class="form-input" id="nt_dept" placeholder="Engineering, Marketing…"></div>
    <div class="form-group mb16"><label class="form-label">Assigned Manager</label>
      <select class="form-input" id="nt_mgr">
        <option value="">— Select manager —</option>
        ${managers.map(m=>`<option value="${m.id}">${escapeHtml(m.full_name)} (${roleLabel(m.role)})</option>`).join('')}
      </select>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createTeam()">Create Team</button>
    </div>`;
  openModal();
}

async function createTeam() {
  const name = v('nt_name');
  const dept = v('nt_dept');
  const mgr  = document.getElementById('nt_mgr')?.value;
  if (!name) return toast('Team name is required', 'warn');

  if (isDemo) {
    const newT = { id: 't-' + Date.now(), name, department: dept || 'General', manager_id: mgr || null };
    MOCK_TEAMS.push(newT);
    allTeams = [...MOCK_TEAMS];
  } else {
    try {
      await API.createTeam({ name, department: dept || null, manager_id: mgr || null });
    } catch (err) {
      return toast('Error: ' + err.message, 'err');
    }
  }
  toast('✅ Team created!', 'success');
  closeModal();
  await loadMeta();
  pageTeams();
}

async function deleteTeam(id, name) {
  if (!confirm(`Delete team "${name}"?`)) return;
  if (isDemo) {
    const idx = MOCK_TEAMS.findIndex(t => t.id === id);
    if (idx !== -1) MOCK_TEAMS.splice(idx, 1);
    allTeams = [...MOCK_TEAMS];
  }
  toast('Team deleted', 'info');
  await loadMeta();
  pageTeams();
}

async function updateTeamManager(teamId, managerId) {
  if (isDemo) {
    const team = MOCK_TEAMS.find(t => t.id === teamId);
    if (team) team.manager_id = managerId || null;
    allTeams = [...MOCK_TEAMS];
  }
  toast('Team manager updated!', 'success');
  await loadMeta();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
