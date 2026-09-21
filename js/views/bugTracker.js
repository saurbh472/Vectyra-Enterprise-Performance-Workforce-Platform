// ═══════════════════════════════════════════════════════════════════════
// ENTERPRISE BUG TRACKER VIEW MODULE
// Planning & Execution — Team & Employee Defect Management
// ═══════════════════════════════════════════════════════════════════════

let bugFilterTeamId = 'ALL';
let bugFilterAssigneeId = 'ALL';
let bugFilterSeverity = 'ALL';
let bugFilterPriority = 'ALL';
let bugFilterStatus = 'ALL';
let bugSearchQuery = '';

let enabledBugTeamIds = [];


async function pageBugTracker() {
  const container = document.getElementById('pageContent');
  if (!container) return;

  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading Enterprise Bug Tracker…</div>`;

  // Fetch profiles, teams, enabled bug teams, and bugs
  let bugs = [];
  let teams = allTeams.length ? allTeams : MOCK_TEAMS;
  let users = (allUsers && allUsers.length) ? allUsers : MOCK_PROFILES;

  try {
    const settings = await API.getEnabledBugTeams();
    if (settings && Array.isArray(settings.enabled_team_ids)) {
      enabledBugTeamIds = settings.enabled_team_ids;
    }
  } catch(e) {}

  try {
    bugs = await API.getBugs({
      team_id: bugFilterTeamId,
      assigned_to: bugFilterAssigneeId,
      severity: bugFilterSeverity,
      priority: bugFilterPriority,
      status: bugFilterStatus,
      search: bugSearchQuery
    });
  } catch (err) {
    console.warn('Error fetching bugs:', err);
    bugs = [];
  }

  // Calculate metrics
  const totalBugs = bugs.length;
  const openBugs = bugs.filter(b => b.status === 'open').length;
  const inProgressBugs = bugs.filter(b => ['in_progress', 'under_review'].includes(b.status)).length;
  const resolvedBugs = bugs.filter(b => ['resolved', 'closed'].includes(b.status)).length;
  const criticalBugs = bugs.filter(b => ['blocker', 'critical'].includes(b.severity)).length;

  const isSuperOrAdmin = canSeeAll();
  const userTeamId = currentProfile?.team_id;
  const canUserReport = isSuperOrAdmin || (userTeamId && enabledBugTeamIds.includes(userTeamId));

  container.innerHTML = `
    <!-- HEADER HERO & STATS SECTION -->
    <div style="background:linear-gradient(135deg,rgba(239,68,68,0.06),rgba(79,70,229,0.05));border:1px solid var(--border);border-radius:18px;padding:24px 28px;margin-bottom:24px;box-shadow:var(--card-shadow);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px">
      <div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
          <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#ef4444,#dc2626);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;box-shadow:0 4px 14px rgba(239,68,68,0.35)">🐛</div>
          <div>
            <h1 class="page-title" style="font-size:24px;margin:0">Planning &amp; Execution — Bug Tracker</h1>
            <p class="page-sub" style="margin:2px 0 0 0">Team-wise &amp; Employee Defect Definitions, Priority Tracking &amp; Resolution Management</p>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        ${isSuperOrAdmin ? `
          <button class="btn btn-ghost btn-sm" onclick="openBugTeamControlModal()" style="border:1px solid var(--border);font-weight:700">
            ⚙️ Team Reporting Settings
          </button>
        ` : ''}

        ${canUserReport ? `
          <button class="btn btn-primary" onclick="openReportBugModal()" style="background:linear-gradient(135deg,#ef4444,#dc2626);border:none;box-shadow:0 4px 14px rgba(239,68,68,0.3)">
            ➕ Report New Bug
          </button>
        ` : `
          <span style="font-size:11px;color:var(--t3);background:var(--s2);padding:6px 12px;border-radius:8px;border:1px solid var(--border)">
            🔒 Reporting Access: Disabled by HR/Admin
          </span>
        `}
      </div>
    </div>


    <!-- METRICS SUMMARY CARDS -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px">
      <div style="background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:var(--card-shadow)">
        <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px">Total Tracked Bugs</div>
        <div style="font-size:26px;font-weight:800;color:var(--text);margin-top:4px">${totalBugs}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Active defect backlog</div>
      </div>

      <div style="background:var(--s1);border:1.5px solid rgba(239,68,68,0.3);border-radius:14px;padding:16px;box-shadow:var(--card-shadow)">
        <div style="font-size:11px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:0.5px">Open Defects</div>
        <div style="font-size:26px;font-weight:800;color:#ef4444;margin-top:4px">${openBugs}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Awaiting triage &amp; assignment</div>
      </div>

      <div style="background:var(--s1);border:1.5px solid rgba(245,158,11,0.3);border-radius:14px;padding:16px;box-shadow:var(--card-shadow)">
        <div style="font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:0.5px">In Progress / Review</div>
        <div style="font-size:26px;font-weight:800;color:#d97706;margin-top:4px">${inProgressBugs}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Active developer fixes</div>
      </div>

      <div style="background:var(--s1);border:1.5px solid rgba(16,185,129,0.3);border-radius:14px;padding:16px;box-shadow:var(--card-shadow)">
        <div style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.5px">Resolved &amp; Closed</div>
        <div style="font-size:26px;font-weight:800;color:#10b981;margin-top:4px">${resolvedBugs}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Verified bug resolutions</div>
      </div>

      <div style="background:var(--s1);border:1.5px solid rgba(220,38,38,0.4);border-radius:14px;padding:16px;box-shadow:var(--card-shadow)">
        <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px">🔥 Blocker &amp; Critical</div>
        <div style="font-size:26px;font-weight:800;color:#dc2626;margin-top:4px">${criticalBugs}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">High impact security &amp; system issues</div>
      </div>
    </div>

    <!-- FILTER & SEARCH BAR TOOLBAR -->
    <div style="background:var(--s1);border:1px solid var(--border);border-radius:16px;padding:16px 20px;margin-bottom:24px;box-shadow:var(--card-shadow)">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <!-- Search Input -->
        <div style="flex:1;min-width:220px">
          <input type="text" id="bugSearchInput" class="form-input" placeholder="🔍 Search bug title, ID, module or description…"
            value="${escapeHtml(bugSearchQuery)}" oninput="onBugSearchInput(this.value)">
        </div>

        <!-- Team Filter -->
        <div style="min-width:160px">
          <select id="bugTeamSel" class="form-input" onchange="onBugFilterChange('team', this.value)">
            <option value="ALL" ${bugFilterTeamId==='ALL'?'selected':''}>🏷️ All Teams</option>
            ${teams.map(t => `<option value="${t.id}" ${bugFilterTeamId===t.id?'selected':''}>🏷️ ${escapeHtml(t.name)}</option>`).join('')}
          </select>
        </div>

        <!-- Assignee Filter -->
        <div style="min-width:160px">
          <select id="bugAssigneeSel" class="form-input" onchange="onBugFilterChange('assignee', this.value)">
            <option value="ALL" ${bugFilterAssigneeId==='ALL'?'selected':''}>👤 All Assigned Employees</option>
            ${users.map(u => `<option value="${u.id}" ${bugFilterAssigneeId===u.id?'selected':''}>👤 ${escapeHtml(u.full_name)}</option>`).join('')}
          </select>
        </div>

        <!-- Severity Filter -->
        <div style="min-width:140px">
          <select id="bugSeveritySel" class="form-input" onchange="onBugFilterChange('severity', this.value)">
            <option value="ALL" ${bugFilterSeverity==='ALL'?'selected':''}>⚡ All Severities</option>
            <option value="blocker" ${bugFilterSeverity==='blocker'?'selected':''}>🔥 Blocker</option>
            <option value="critical" ${bugFilterSeverity==='critical'?'selected':''}>⚠️ Critical</option>
            <option value="major" ${bugFilterSeverity==='major'?'selected':''}>🔶 Major</option>
            <option value="minor" ${bugFilterSeverity==='minor'?'selected':''}>🔹 Minor</option>
            <option value="low" ${bugFilterSeverity==='low'?'selected':''}>🟢 Low</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div style="min-width:140px">
          <select id="bugStatusSel" class="form-input" onchange="onBugFilterChange('status', this.value)">
            <option value="ALL" ${bugFilterStatus==='ALL'?'selected':''}>📌 All Statuses</option>
            <option value="open" ${bugFilterStatus==='open'?'selected':''}>🔴 Open</option>
            <option value="in_progress" ${bugFilterStatus==='in_progress'?'selected':''}>🟡 In Progress</option>
            <option value="under_review" ${bugFilterStatus==='under_review'?'selected':''}>🟣 Under Review</option>
            <option value="resolved" ${bugFilterStatus==='resolved'?'selected':''}>🟢 Resolved</option>
            <option value="closed" ${bugFilterStatus==='closed'?'selected':''}>⚪ Closed</option>
          </select>
        </div>
      </div>
    </div>

    <!-- BUGS LIST TABLE / CARDS CONTAINER -->
    ${bugs.length === 0 ? `
      <div style="background:var(--s1);border:1px dashed var(--border);border-radius:16px;padding:48px 20px;text-align:center">
        <div style="font-size:42px;margin-bottom:12px">🎉</div>
        <div style="font-weight:800;font-size:16px;color:var(--text)">No Bugs Found</div>
        <div style="font-size:13px;color:var(--t3);margin-top:4px;max-width:440px;margin-left:auto;margin-right:auto">
          ${canUserReport ? 'No active defects match your current search and filter selection.' : 'Defect reporting is currently disabled for your team by HR / Super Admin. Contact HR or Super Admin to request bug raising permissions for your team.'}
        </div>
        ${canUserReport ? `
          <button class="btn btn-primary" style="margin-top:16px;background:linear-gradient(135deg,#ef4444,#dc2626);border:none" onclick="openReportBugModal()">
            + Report New Bug
          </button>
        ` : ''}
      </div>
    ` : `
      <div style="background:var(--s1);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--card-shadow)">
        <table class="table" style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:var(--s2);border-bottom:1px solid var(--border);text-align:left">
              <th style="padding:14px 16px;font-weight:700;width:90px">ID</th>
              <th style="padding:14px 16px;font-weight:700">Bug Title &amp; Definition</th>
              <th style="padding:14px 16px;font-weight:700">Target Team &amp; Module</th>
              <th style="padding:14px 16px;font-weight:700">Assigned Employee</th>
              <th style="padding:14px 16px;font-weight:700">Severity / Priority</th>
              <th style="padding:14px 16px;font-weight:700">Status</th>
              <th style="padding:14px 16px;font-weight:700;text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bugs.map(b => renderBugTableRow(b)).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function renderBugTableRow(b) {
  const severityBadges = {
    blocker: `<span style="background:#dc2626;color:#fff;font-weight:800;padding:3px 8px;border-radius:8px;font-size:10px">🔥 Blocker</span>`,
    critical: `<span style="background:#ea580c;color:#fff;font-weight:800;padding:3px 8px;border-radius:8px;font-size:10px">⚠️ Critical</span>`,
    major: `<span style="background:rgba(245,158,11,0.15);color:#b45309;font-weight:700;padding:3px 8px;border-radius:8px;font-size:10px">🔶 Major</span>`,
    minor: `<span style="background:rgba(59,130,246,0.15);color:#1d4ed8;font-weight:700;padding:3px 8px;border-radius:8px;font-size:10px">🔹 Minor</span>`,
    low: `<span style="background:var(--s2);color:var(--t3);font-weight:700;padding:3px 8px;border-radius:8px;font-size:10px">🟢 Low</span>`
  };

  const priorityBadges = {
    P0: `<span style="background:rgba(220,38,38,0.15);color:#dc2626;font-weight:800;padding:2px 6px;border-radius:6px;font-size:10px">P0</span>`,
    P1: `<span style="background:rgba(234,88,12,0.15);color:#ea580c;font-weight:800;padding:2px 6px;border-radius:6px;font-size:10px">P1</span>`,
    P2: `<span style="background:rgba(79,70,229,0.12);color:#4f46e5;font-weight:800;padding:2px 6px;border-radius:6px;font-size:10px">P2</span>`,
    P3: `<span style="background:var(--s2);color:var(--t3);font-weight:700;padding:2px 6px;border-radius:6px;font-size:10px">P3</span>`
  };

  const statusBadges = {
    open: `<span class="badge" style="background:rgba(239,68,68,0.12);color:#dc2626;font-size:11px">🔴 Open</span>`,
    in_progress: `<span class="badge" style="background:rgba(245,158,11,0.15);color:#d97706;font-size:11px">🟡 In Progress</span>`,
    under_review: `<span class="badge" style="background:rgba(139,92,246,0.15);color:#7c3aed;font-size:11px">🟣 Under Review</span>`,
    resolved: `<span class="badge" style="background:rgba(16,185,129,0.15);color:#059669;font-size:11px">🟢 Resolved</span>`,
    closed: `<span class="badge" style="background:var(--s2);color:var(--t3);font-size:11px">⚪ Closed</span>`
  };

  const isOwnerOrAdmin = canSeeAll() || b.assigned_to === currentProfile?.id || b.reporter_id === currentProfile?.id;

  return `
    <tr style="border-bottom:1px solid var(--border);transition:background 0.15s" onmouseover="this.style.background='var(--s2)'" onmouseout="this.style.background=''">
      <td style="padding:14px 16px;font-weight:800;color:var(--a1);font-family:monospace">
        ${escapeHtml(b.bug_number || 'BUG')}
      </td>
      <td style="padding:14px 16px">
        <div style="font-weight:700;color:var(--text);font-size:14px">${escapeHtml(b.title)}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:3px;max-width:380px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${escapeHtml(b.description || 'No description provided.')}
        </div>
        ${b.resolution_notes ? `
          <div style="margin-top:6px;font-size:11px;color:#059669;background:rgba(16,185,129,0.08);padding:4px 8px;border-radius:6px;display:inline-block">
            💡 <strong>Resolution:</strong> ${escapeHtml(b.resolution_notes)}
          </div>
        ` : ''}
      </td>
      <td style="padding:14px 16px">
        <div style="font-weight:700;color:var(--text);font-size:12px">🏷️ ${escapeHtml(b.team_name || 'General')}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">🧩 ${escapeHtml(b.module_name || 'Component')}</div>
      </td>
      <td style="padding:14px 16px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--a1),var(--a5));color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">
            ${escapeHtml(b.assigned_to_avatar || 'UN')}
          </div>
          <div>
            <div style="font-weight:700;font-size:12px;color:var(--text)">${escapeHtml(b.assigned_to_name || 'Unassigned')}</div>
            <div style="font-size:10px;color:var(--t3)">Reported by ${escapeHtml(b.reporter_name || 'System')}</div>
          </div>
        </div>
      </td>
      <td style="padding:14px 16px">
        <div style="display:flex;gap:6px;align-items:center">
          ${severityBadges[b.severity] || b.severity}
          ${priorityBadges[b.priority] || b.priority}
        </div>
      </td>
      <td style="padding:14px 16px">
        <select class="form-input" style="padding:5px 10px;font-size:11px;font-weight:700;width:auto;height:auto;border-radius:8px;background:var(--s2);cursor:pointer;border:1px solid var(--border)"
          onchange="quickUpdateBugStatus('${b.id}', this.value)">
          <option value="open" ${b.status==='open'?'selected':''}>🔴 Open</option>
          <option value="in_progress" ${b.status==='in_progress'?'selected':''}>🟡 In Progress</option>
          <option value="under_review" ${b.status==='under_review'?'selected':''}>🟣 Under Review</option>
          <option value="resolved" ${b.status==='resolved'?'selected':''}>🟢 Resolved</option>
          <option value="closed" ${b.status==='closed'?'selected':''}>⚪ Closed</option>
        </select>
      </td>

      <td style="padding:14px 16px;text-align:right">
        <div style="display:flex;gap:6px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" onclick="openEditBugModal('${b.id}')" title="Edit Bug Details">
            ✏️ Edit
          </button>
          ${canDeleteBug(b) ? `
            <button class="btn btn-ghost btn-sm" onclick="deleteBugConfirm('${b.id}')" style="color:#ef4444" title="Delete Bug (Manager / HR Only)">
              🗑️
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `;
}

function canDeleteBug(b) {
  if (currentProfile?.role === 'super_admin' || currentProfile?.role === 'admin') return true;
  if (currentProfile?.role === 'manager') {
    const teamsList = allTeams.length ? allTeams : MOCK_TEAMS;
    const managedTeamIds = teamsList.filter(t => t.manager_id === currentProfile.id).map(t => t.id);
    if (currentProfile.team_id && !managedTeamIds.includes(currentProfile.team_id)) {
      managedTeamIds.push(currentProfile.team_id);
    }
    return managedTeamIds.includes(b.team_id);
  }
  // Employees cannot delete bugs
  return false;
}

async function quickUpdateBugStatus(bugId, newStatus) {
  try {
    await API.updateBug(bugId, { status: newStatus });
    toast(`✅ Status updated to ${newStatus.replace('_', ' ').toUpperCase()}!`, 'success');
    pageBugTracker();
  } catch(err) {
    toast(`Failed to update status: ${err.message}`, 'err');
  }
}



// ═══════════════════════════════════════════════════════════════════════
// SEARCH & FILTER HANDLERS
// ═══════════════════════════════════════════════════════════════════════
let bugSearchTimeout = null;
function onBugSearchInput(val) {
  bugSearchQuery = val;
  clearTimeout(bugSearchTimeout);
  bugSearchTimeout = setTimeout(() => {
    pageBugTracker();
  }, 300);
}

function onBugFilterChange(type, val) {
  if (type === 'team') bugFilterTeamId = val;
  if (type === 'assignee') bugFilterAssigneeId = val;
  if (type === 'severity') bugFilterSeverity = val;
  if (type === 'priority') bugFilterPriority = val;
  if (type === 'status') bugFilterStatus = val;
  pageBugTracker();
}

// ═══════════════════════════════════════════════════════════════════════
// REPORT NEW BUG MODAL
// ═══════════════════════════════════════════════════════════════════════
function openReportBugModal() {
  const isSuperOrAdmin = canSeeAll();
  const userTeamId = currentProfile?.team_id;
  const canUserReport = isSuperOrAdmin || (userTeamId && enabledBugTeamIds.includes(userTeamId));

  if (!canUserReport) {
    return toast('Access Denied: Bug reporting is disabled for your team by HR / Super Admin.', 'err');
  }

  const teams = allTeams.length ? allTeams : MOCK_TEAMS;

  const users = (allUsers && allUsers.length) ? allUsers : MOCK_PROFILES;
  const defaultTeam = currentProfile?.team_id || (teams[0]?.id || 't2');

  document.getElementById('modalTitle').textContent = '🐛 Report New Bug / Defect';
  document.getElementById('modalSub').textContent = 'Define defect title, target team, module, severity, and steps to reproduce';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Bug Title *</label>
      <input type="text" id="bugNewTitle" class="form-input" placeholder="e.g. Memory Leak in TimescaleDB Query Handler">
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb16">
      <div>
        <label class="form-label">Target Team *</label>
        <select id="bugNewTeam" class="form-input">
          ${teams.map(t => `<option value="${t.id}" ${defaultTeam===t.id?'selected':''}>🏷️ ${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>

      <div>
        <label class="form-label">Assigned Employee *</label>
        <select id="bugNewAssignee" class="form-input">
          ${users.map(u => `<option value="${u.id}" ${currentProfile?.id===u.id?'selected':''}>👤 ${escapeHtml(u.full_name)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px" class="mb16">
      <div>
        <label class="form-label">Component / Module</label>
        <input type="text" id="bugNewModule" class="form-input" placeholder="e.g. Auth System, API Gateway">
      </div>

      <div>
        <label class="form-label">Severity Level</label>
        <select id="bugNewSeverity" class="form-input">
          <option value="blocker">🔥 Blocker</option>
          <option value="critical">⚠️ Critical</option>
          <option value="major" selected>🔶 Major</option>
          <option value="minor">🔹 Minor</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>

      <div>
        <label class="form-label">Priority</label>
        <select id="bugNewPriority" class="form-input">
          <option value="P0">P0 (Immediate)</option>
          <option value="P1" selected>P1 (High)</option>
          <option value="P2">P2 (Normal)</option>
          <option value="P3">P3 (Low)</option>
        </select>
      </div>
    </div>

    <div class="form-group mb16">
      <label class="form-label">Bug Description</label>
      <textarea id="bugNewDesc" class="form-input" rows="3" placeholder="Provide background context on the expected vs actual system behavior..."></textarea>
    </div>

    <div class="form-group mb16">
      <label class="form-label">Steps to Reproduce</label>
      <textarea id="bugNewSteps" class="form-input" rows="3" placeholder="1. Open page...\n2. Click button...\n3. Error trace observed..."></textarea>
    </div>

    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitNewBug()" style="background:linear-gradient(135deg,#ef4444,#dc2626);border:none">
        🐛 Save &amp; Log Bug
      </button>
    </div>
  `;

  openModal();
}

async function submitNewBug() {
  const title = v('bugNewTitle');
  const team_id = v('bugNewTeam');
  const assigned_to = v('bugNewAssignee');
  const module_name = v('bugNewModule');
  const severity = v('bugNewSeverity');
  const priority = v('bugNewPriority');
  const description = v('bugNewDesc');
  const steps_to_reproduce = v('bugNewSteps');

  if (!title) return toast('Please enter a bug title.', 'warn');
  if (!team_id) return toast('Please select a target team.', 'warn');

  try {
    await API.createBug({
      title,
      team_id,
      assigned_to,
      module_name,
      severity,
      priority,
      description,
      steps_to_reproduce
    });
    toast('✅ New bug reported and logged successfully!', 'success');
    closeModal();
    pageBugTracker();
  } catch(err) {
    toast(`Failed to report bug: ${err.message}`, 'err');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EDIT & RESOLVE BUG MODAL
// ═══════════════════════════════════════════════════════════════════════
async function openEditBugModal(bugId) {
  const teams = allTeams.length ? allTeams : MOCK_TEAMS;
  const users = (allUsers && allUsers.length) ? allUsers : MOCK_PROFILES;

  let bug = null;
  try {
    const list = await API.getBugs({});
    bug = list.find(b => b.id === bugId);
  } catch(e) {}

  if (!bug) return toast('Bug details not found.', 'err');

  document.getElementById('modalTitle').textContent = `✏️ Edit Bug [${bug.bug_number || 'BUG'}]`;
  document.getElementById('modalSub').textContent = 'Update defect status, assignee, priority, and resolution findings';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Bug Title *</label>
      <input type="text" id="bugEditTitle" class="form-input" value="${escapeHtml(bug.title)}">
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb16">
      <div>
        <label class="form-label">Status *</label>
        <select id="bugEditStatus" class="form-input" style="font-weight:700">
          <option value="open" ${bug.status==='open'?'selected':''}>🔴 Open</option>
          <option value="in_progress" ${bug.status==='in_progress'?'selected':''}>🟡 In Progress</option>
          <option value="under_review" ${bug.status==='under_review'?'selected':''}>🟣 Under Review</option>
          <option value="resolved" ${bug.status==='resolved'?'selected':''}>🟢 Resolved</option>
          <option value="closed" ${bug.status==='closed'?'selected':''}>⚪ Closed</option>
        </select>
      </div>

      <div>
        <label class="form-label">Assigned Employee *</label>
        <select id="bugEditAssignee" class="form-input">
          ${users.map(u => `<option value="${u.id}" ${bug.assigned_to===u.id?'selected':''}>👤 ${escapeHtml(u.full_name)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px" class="mb16">
      <div>
        <label class="form-label">Component / Module</label>
        <input type="text" id="bugEditModule" class="form-input" value="${escapeHtml(bug.module_name || '')}">
      </div>

      <div>
        <label class="form-label">Severity Level</label>
        <select id="bugEditSeverity" class="form-input">
          <option value="blocker" ${bug.severity==='blocker'?'selected':''}>🔥 Blocker</option>
          <option value="critical" ${bug.severity==='critical'?'selected':''}>⚠️ Critical</option>
          <option value="major" ${bug.severity==='major'?'selected':''}>🔶 Major</option>
          <option value="minor" ${bug.severity==='minor'?'selected':''}>🔹 Minor</option>
          <option value="low" ${bug.severity==='low'?'selected':''}>🟢 Low</option>
        </select>
      </div>

      <div>
        <label class="form-label">Priority</label>
        <select id="bugEditPriority" class="form-input">
          <option value="P0" ${bug.priority==='P0'?'selected':''}>P0 (Immediate)</option>
          <option value="P1" ${bug.priority==='P1'?'selected':''}>P1 (High)</option>
          <option value="P2" ${bug.priority==='P2'?'selected':''}>P2 (Normal)</option>
          <option value="P3" ${bug.priority==='P3'?'selected':''}>P3 (Low)</option>
        </select>
      </div>
    </div>

    <div class="form-group mb16">
      <label class="form-label">Bug Description</label>
      <textarea id="bugEditDesc" class="form-input" rows="3">${escapeHtml(bug.description || '')}</textarea>
    </div>

    <div class="form-group mb16">
      <label class="form-label">Steps to Reproduce</label>
      <textarea id="bugEditSteps" class="form-input" rows="3">${escapeHtml(bug.steps_to_reproduce || '')}</textarea>
    </div>

    <div class="form-group mb16">
      <label class="form-label" style="color:#059669;font-weight:700">💡 Resolution Notes &amp; Fix Summary</label>
      <textarea id="bugEditResolution" class="form-input" rows="2" placeholder="Detail root cause and code fixes implemented...">${escapeHtml(bug.resolution_notes || '')}</textarea>
    </div>

    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitEditBug('${bug.id}')">
        💾 Save Changes
      </button>
    </div>
  `;

  openModal();
}

async function submitEditBug(bugId) {
  const title = v('bugEditTitle');
  const status = v('bugEditStatus');
  const assigned_to = v('bugEditAssignee');
  const module_name = v('bugEditModule');
  const severity = v('bugEditSeverity');
  const priority = v('bugEditPriority');
  const description = v('bugEditDesc');
  const steps_to_reproduce = v('bugEditSteps');
  const resolution_notes = v('bugEditResolution');

  if (!title) return toast('Please enter a bug title.', 'warn');

  try {
    await API.updateBug(bugId, {
      title,
      status,
      assigned_to,
      module_name,
      severity,
      priority,
      description,
      steps_to_reproduce,
      resolution_notes
    });
    toast('✅ Bug updated successfully!', 'success');
    closeModal();
    pageBugTracker();
  } catch(err) {
    toast(`Failed to update bug: ${err.message}`, 'err');
  }
}

async function deleteBugConfirm(bugId) {
  if (!confirm('Are you sure you want to delete this bug definition?')) return;
  try {
    await API.deleteBug(bugId);
    toast('Bug record deleted.', 'info');
    pageBugTracker();
  } catch(err) {
    toast(`Failed to delete bug: ${err.message}`, 'err');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HR & SUPER ADMIN TEAM REPORTING PERMISSIONS CONTROL MODAL
// ═══════════════════════════════════════════════════════════════════════
async function openBugTeamControlModal() {
  if (!canSeeAll()) {
    return toast('Access Denied: Only HR and Super Admin can configure team bug reporting permissions.', 'err');
  }

  const teams = allTeams.length ? allTeams : MOCK_TEAMS;

  try {
    const settings = await API.getEnabledBugTeams();
    if (settings && Array.isArray(settings.enabled_team_ids)) {
      enabledBugTeamIds = settings.enabled_team_ids;
    }
  } catch(e) {}

  document.getElementById('modalTitle').textContent = '⚙️ Team Bug Reporting Permissions (HR & Admin)';
  document.getElementById('modalSub').textContent = 'Select which specific teams are permitted to report and add bug definitions in the platform';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--t2)">
      💡 Employees belonging to unchecked/disabled teams will not be able to report new defects. Super Admin &amp; HR can always report bugs for any team.
    </div>

    <div style="display:flex;flex-direction:column;gap:10px;max-height:360px;overflow-y:auto;padding-right:4px">
      ${teams.map(t => {
        const isChecked = enabledBugTeamIds.includes(t.id);
        return `
          <label style="display:flex;align-items:center;justify-content:space-between;background:var(--s1);border:1.5px solid ${isChecked ? 'rgba(79,70,229,0.3)' : 'var(--border)'};border-radius:12px;padding:12px 16px;cursor:pointer;transition:all 0.15s">
            <div style="display:flex;align-items:center;gap:10px">
              <input type="checkbox" class="bug-team-chk" value="${t.id}" ${isChecked ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--a1)">
              <div>
                <div style="font-weight:700;font-size:13px;color:var(--text)">🏷️ ${escapeHtml(t.name)}</div>
                <div style="font-size:11px;color:var(--t3)">Department: ${escapeHtml(t.department || 'Engineering')}</div>
              </div>
            </div>
            <span class="badge ${isChecked ? 'badge-admin' : 'badge-neutral'}" style="font-size:10px">
              ${isChecked ? '✅ Reporting Enabled' : '🔒 Reporting Disabled'}
            </span>
          </label>
        `;
      }).join('')}
    </div>

    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBugTeamPermissions()">
        💾 Save Permissions
      </button>
    </div>
  `;

  openModal();
}

async function saveBugTeamPermissions() {
  const checkboxes = document.querySelectorAll('.bug-team-chk');
  const selectedTeamIds = [];
  checkboxes.forEach(chk => {
    if (chk.checked) selectedTeamIds.push(chk.value);
  });

  try {
    await API.updateEnabledBugTeams(selectedTeamIds);
    enabledBugTeamIds = selectedTeamIds;
    toast('✅ Team bug reporting permissions updated successfully!', 'success');
    closeModal();
    pageBugTracker();
  } catch(err) {
    toast(`Failed to update permissions: ${err.message}`, 'err');
  }
}

