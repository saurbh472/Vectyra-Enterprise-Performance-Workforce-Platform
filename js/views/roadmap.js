// ═══════════════════════════════════════════════════════════════════════
// VIEW: TEAM ROADMAP & TASK EXECUTION PLANNER
// ═══════════════════════════════════════════════════════════════════════

let currentRoadmapFilter = {
  teamId: 'all',
  quarter: 'all',
  status: 'all',
  search: ''
};

let cachedRoadmaps = [];

function formatRoadmapsWithTasks(list, tasks) {
  if (!Array.isArray(list)) list = [];
  if (!Array.isArray(tasks)) tasks = [];

  const usersList = (allUsers && allUsers.length) ? allUsers : MOCK_PROFILES;

  return list.map(rm => {
    const rmTasks = (rm.tasks && Array.isArray(rm.tasks)) ? rm.tasks : tasks.filter(t => t.roadmap_id === rm.id).map(t => {
      const p1 = usersList.find(p => p.id === t.assigned_to);
      const p2 = usersList.find(p => p.id === t.assigned_by);
      return {
        ...t,
        assigned_to_name: p1 ? p1.full_name : 'Team Member',
        assigned_to_email: p1 ? p1.email : '',
        assigned_to_avatar: p1 ? p1.avatar_initials : 'TM',
        assigned_by_name: p2 ? p2.full_name : 'Manager'
      };
    });
    const completed = rmTasks.filter(t => t.status === 'done').length;
    return {
      ...rm,
      tasks: rmTasks,
      task_count: rmTasks.length,
      completed_task_count: completed,
      calculated_progress: rmTasks.length ? Math.round((completed / rmTasks.length) * 100) : 0
    };
  });
}

async function fetchRoadmapsData() {
  if (isDemo) {
    let list = [...MOCK_ROADMAPS];
    let tasks = [...MOCK_ROADMAP_TASKS];

    // Filter by role permissions in demo mode
    if (isSuper() || isAdmin()) {
      // Super Admin & HR see all
    } else if (isManager()) {
      const myTeamId = currentProfile?.team_id;
      list = list.filter(r => r.team_id === myTeamId || r.created_by === currentProfile?.id);
    } else {
      // Employee
      const myTeamId = currentProfile?.team_id;
      list = list.filter(r => r.team_id === myTeamId);
    }

    cachedRoadmaps = formatRoadmapsWithTasks(list, tasks);
    return cachedRoadmaps;
  }

  try {
    const list = await API.getRoadmaps();
    if (Array.isArray(list)) {
      cachedRoadmaps = formatRoadmapsWithTasks(list, []);
    } else {
      cachedRoadmaps = formatRoadmapsWithTasks(MOCK_ROADMAPS, MOCK_ROADMAP_TASKS);
    }
    return cachedRoadmaps;
  } catch (err) {
    console.warn('API notice fetching roadmaps, using formatted data fallback:', err.message);
    cachedRoadmaps = formatRoadmapsWithTasks(MOCK_ROADMAPS, MOCK_ROADMAP_TASKS);
    return cachedRoadmaps;
  }
}

async function pageTeamRoadmap() {
  const main = document.getElementById('pageContent');
  main.innerHTML = `<div class="loading"><div class="spinner"></div> Loading Team Roadmaps &amp; Assigned Tasks…</div>`;
  await loadMeta();

  const roadmaps = await fetchRoadmapsData();
  const canModify = isSuper() || isManager();
  const isHrReadOnly = isAdmin();

  // Determine user's default team
  const userTeam = allTeams.find(t => t.id === currentProfile?.team_id);
  const eligibleTeams = (isSuper() || isAdmin()) ? allTeams : (userTeam ? [userTeam] : allTeams);

  // Subtitle based on role
  let roleNotice = '';
  if (isSuper()) {
    roleNotice = '👑 <strong>Super Admin Control:</strong> Full authority to view, create, edit, assign, and delete roadmaps and tasks across all company teams.';
  } else if (isHrReadOnly) {
    roleNotice = '🏛️ <strong>HR Read-Only Oversight:</strong> You have company-wide access to view all team roadmaps, tasks, assignees, and deadlines. Modifications are restricted to Managers & Super Admin.';
  } else if (isManager()) {
    roleNotice = `🏆 <strong>Manager Dashboard:</strong> Plan strategic deliverables for your team and assign specific tasks to team members.`;
  } else {
    roleNotice = `👤 <strong>Team Execution Plan:</strong> Track your team's quarterly milestones and deliverables assigned to you.`;
  }

  main.innerHTML = `
  <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div>
      <div class="page-title">🗺️ Team Roadmap &amp; Execution Tasks</div>
      <div class="page-sub">${roleNotice}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      ${canModify ? `
        <button class="btn btn-primary" onclick="openCreateRoadmapModal()">+ Create Team Roadmap</button>
      ` : (isHrReadOnly ? `
        <span class="badge" style="background:rgba(217,119,6,0.15);color:var(--a2);font-weight:700;padding:6px 12px">🔒 HR Read-Only Mode</span>
      ` : '')}
    </div>
  </div>

  <div class="content fade-up">
    <!-- FILTER CONTROLS -->
    <div class="card mb20" style="padding:14px;background:var(--s1)">
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
        <!-- Team Selector (for Super Admin & HR) -->
        ${(isSuper() || isAdmin()) ? `
          <div style="min-width:200px">
            <select class="form-input" id="roadmapTeamFilter" onchange="updateRoadmapFilter('teamId', this.value)" style="font-size:13px">
              <option value="all">🏢 All Teams &amp; Departments</option>
              ${allTeams.map(t => `<option value="${t.id}" ${currentRoadmapFilter.teamId===t.id?'selected':''}>${escapeHtml(t.name)} (${t.department||'General'})</option>`).join('')}
            </select>
          </div>
        ` : ''}

        <div style="width:150px">
          <select class="form-input" id="roadmapQuarterFilter" onchange="updateRoadmapFilter('quarter', this.value)" style="font-size:13px">
            <option value="all">All Quarters</option>
            <option value="Q3 2026" ${currentRoadmapFilter.quarter==='Q3 2026'?'selected':''}>Q3 2026</option>
            <option value="Q4 2026" ${currentRoadmapFilter.quarter==='Q4 2026'?'selected':''}>Q4 2026</option>
            <option value="Q1 2027" ${currentRoadmapFilter.quarter==='Q1 2027'?'selected':''}>Q1 2027</option>
          </select>
        </div>

        <div style="width:150px">
          <select class="form-input" id="roadmapStatusFilter" onchange="updateRoadmapFilter('status', this.value)" style="font-size:13px">
            <option value="all">All Statuses</option>
            <option value="in_progress" ${currentRoadmapFilter.status==='in_progress'?'selected':''}>⚡ In Progress</option>
            <option value="completed" ${currentRoadmapFilter.status==='completed'?'selected':''}>✅ Completed</option>
            <option value="planned" ${currentRoadmapFilter.status==='planned'?'selected':''}>🗓️ Planned</option>
            <option value="delayed" ${currentRoadmapFilter.status==='delayed'?'selected':''}>⚠️ Delayed</option>
          </select>
        </div>

        <div style="flex:1;min-width:200px">
          <input class="form-input" id="roadmapSearchInput" placeholder="🔍 Search roadmaps, deliverables, or assignees…" value="${escapeHtml(currentRoadmapFilter.search)}" oninput="updateRoadmapFilter('search', this.value)" style="font-size:13px">
        </div>

        ${(currentRoadmapFilter.teamId !== 'all' || currentRoadmapFilter.quarter !== 'all' || currentRoadmapFilter.status !== 'all' || currentRoadmapFilter.search) ? `
          <button class="btn btn-ghost btn-sm" onclick="resetRoadmapFilters()">Reset</button>
        ` : ''}
      </div>
    </div>

    <!-- ROADMAPS & TASKS LIST CONTAINER -->
    <div id="roadmapCardsContainer">
      ${renderRoadmapCards(roadmaps)}
    </div>
  </div>`;
}

function updateRoadmapFilter(key, val) {
  currentRoadmapFilter[key] = val;
  const container = document.getElementById('roadmapCardsContainer');
  if (container) {
    container.innerHTML = renderRoadmapCards(cachedRoadmaps);
  }
}

function resetRoadmapFilters() {
  currentRoadmapFilter = { teamId: 'all', quarter: 'all', status: 'all', search: '' };
  pageTeamRoadmap();
}

function renderRoadmapCards(roadmaps) {
  let list = Array.isArray(roadmaps) ? roadmaps : (Array.isArray(cachedRoadmaps) ? cachedRoadmaps : []);
  let filtered = [...list];

  if (currentRoadmapFilter.teamId !== 'all') {
    filtered = filtered.filter(r => r.team_id === currentRoadmapFilter.teamId);
  }
  if (currentRoadmapFilter.quarter !== 'all') {
    filtered = filtered.filter(r => r.quarter === currentRoadmapFilter.quarter);
  }
  if (currentRoadmapFilter.status !== 'all') {
    filtered = filtered.filter(r => r.status === currentRoadmapFilter.status);
  }
  if (currentRoadmapFilter.search) {
    const q = currentRoadmapFilter.search.toLowerCase();
    filtered = filtered.filter(r => {
      const matchTitle = (r.title || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchTasks = (r.tasks || []).some(t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.assigned_to_name || '').toLowerCase().includes(q)
      );
      return matchTitle || matchDesc || matchTasks;
    });
  }

  if (!filtered.length) {
    return `
      <div class="card" style="text-align:center;padding:50px 20px">
        <div style="font-size:48px;margin-bottom:12px">🗺️</div>
        <h3>No Team Roadmaps Found</h3>
        <p style="color:var(--t3);font-size:13px;margin-top:6px">No roadmaps match the selected filters or team assignment.</p>
        ${(isSuper() || isManager()) ? `
          <button class="btn btn-primary" style="margin-top:16px" onclick="openCreateRoadmapModal()">+ Create New Roadmap</button>
        ` : ''}
      </div>`;
  }

  return filtered.map(rm => {
    const teamObj = allTeams.find(t => t.id === rm.team_id) || { name: 'General Team', department: 'Organisation' };
    const creator = allUsers.find(u => u.id === rm.created_by) || { full_name: 'Team Leader' };
    const canModify = isSuper() || isManager();
    const isHr = isAdmin();

    const statusBadgeMap = {
      planned: '<span class="badge badge-peer">🗓️ Planned</span>',
      in_progress: '<span class="badge badge-manager">⚡ In Progress</span>',
      completed: '<span class="badge badge-hr">✅ Completed</span>',
      delayed: '<span class="badge badge-self">⚠️ Delayed</span>'
    };

    const statusBadge = statusBadgeMap[rm.status] || '<span class="badge badge-peer">Active</span>';
    const progress = rm.calculated_progress !== undefined ? rm.calculated_progress : 0;
    const tasks = rm.tasks || [];

    return `
    <div class="card mb24" style="border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm)">
      <!-- ROADMAP HEADER -->
      <div style="background:linear-gradient(135deg,rgba(79,70,229,0.06),rgba(147,51,234,0.03));padding:20px 24px;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(99,102,241,0.15);color:var(--a1)">
                🏷️ ${escapeHtml(teamObj.name)} &bull; ${escapeHtml(teamObj.department || 'General')}
              </span>
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:var(--s2);color:var(--t2);border:1px solid var(--border)">
                🗓️ ${escapeHtml(rm.quarter || 'Q3 2026')}
              </span>
              ${statusBadge}
            </div>
            <h3 style="font-size:18px;font-weight:800;color:var(--text);margin:0 0 6px 0">${escapeHtml(rm.title)}</h3>
            <div style="font-size:13px;color:var(--t2);max-width:800px;line-height:1.5">${escapeHtml(rm.description || 'No strategic description provided.')}</div>
          </div>

          <!-- ACTION BUTTONS -->
          <div style="display:flex;gap:8px;align-items:center">
            ${canModify ? `
              <button class="btn btn-primary btn-sm" onclick="openCreateTaskModal('${rm.id}')">+ Add Task</button>
              <button class="btn btn-ghost btn-sm" onclick="openEditRoadmapModal('${rm.id}')">✏️ Edit</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--err)" onclick="deleteRoadmapRecord('${rm.id}')">🗑️</button>
            ` : (isHr ? `
              <span style="font-size:11px;font-weight:700;color:var(--a2);padding:4px 10px;background:rgba(217,119,6,0.1);border-radius:8px">🔒 HR Read-Only</span>
            ` : '')}
          </div>
        </div>

        <!-- ROADMAP PROGRESS BAR & METRICS -->
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(0,0,0,0.06)">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--t2);margin-bottom:6px">
            <div>
              <strong>${rm.completed_task_count || 0}</strong> of <strong>${tasks.length}</strong> tasks completed
              ${rm.target_date ? ` &bull; Target: <strong>${fmtDate(rm.target_date)}</strong>` : ''}
              &bull; Created by: <strong>${escapeHtml(creator.full_name)}</strong>
            </div>
            <div style="font-weight:800;color:var(--a1)">${progress}% Complete</div>
          </div>
          <div style="height:8px;background:var(--border);border-radius:6px;overflow:hidden">
            <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--a1),var(--a3));border-radius:6px;transition:width .4s ease"></div>
          </div>
        </div>
      </div>

      <!-- TASKS BREAKDOWN TABLE / LIST -->
      <div style="padding:16px 20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:13px;font-weight:700;color:var(--text);letter-spacing:.02em">
            📋 Assigned Tasks &amp; Deliverables (${tasks.length})
          </div>
        </div>

        ${tasks.length ? `
          <div class="table-wrap">
            <table style="font-size:13px">
              <thead>
                <tr>
                  <th style="width:30%">Task &amp; Deliverable</th>
                  <th>Assigned To</th>
                  <th>Assigned By &amp; When</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tasks.map(t => {
                  const isAssignedToMe = currentProfile?.id === t.assigned_to;
                  const priorityColors = {
                    urgent: '#e11d48',
                    high: '#d97706',
                    medium: '#4f46e5',
                    low: '#6b7280'
                  };
                  const statusColors = {
                    todo: 'var(--t3)',
                    in_progress: 'var(--a1)',
                    in_review: 'var(--a2)',
                    done: 'var(--a3)'
                  };
                  const statusLabels = {
                    todo: '⚪ To Do',
                    in_progress: '⚡ In Progress',
                    in_review: '👀 In Review',
                    done: '✅ Done'
                  };

                  return `
                  <tr>
                    <td>
                      <div style="font-weight:700;color:var(--text)">${escapeHtml(t.title)}</div>
                      ${t.description ? `<div style="font-size:11px;color:var(--t3);margin-top:2px">${escapeHtml(t.description)}</div>` : ''}
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="avatar" style="width:28px;height:28px;font-size:10px">${escapeHtml(t.assigned_to_avatar || 'TM')}</div>
                        <div>
                          <div style="font-weight:600;color:var(--text);font-size:12px">${escapeHtml(t.assigned_to_name || 'Team Member')}</div>
                          ${isAssignedToMe ? '<span style="font-size:10px;color:var(--a1);font-weight:700">(You)</span>' : ''}
                        </div>
                      </div>
                    </td>
                    <td style="font-size:11px;color:var(--t2)">
                      <div><strong>${escapeHtml(t.assigned_by_name || 'Manager')}</strong></div>
                      <div style="color:var(--t3)">${t.assigned_at ? fmtDate(t.assigned_at) : '—'}</div>
                    </td>
                    <td>
                      <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;background:${priorityColors[t.priority]||'#6b7280'}18;color:${priorityColors[t.priority]||'#6b7280'};text-transform:capitalize">
                        ${escapeHtml(t.priority || 'Medium')}
                      </span>
                    </td>
                    <td>
                      ${(canModify || isAssignedToMe) ? `
                        <select class="form-input" style="padding:4px 8px;font-size:11px;font-weight:600;width:auto;color:${statusColors[t.status]||'var(--text)'}" onchange="quickUpdateTaskStatus('${t.id}', this.value)">
                          <option value="todo" ${t.status==='todo'?'selected':''}>⚪ To Do</option>
                          <option value="in_progress" ${t.status==='in_progress'?'selected':''}>⚡ In Progress</option>
                          <option value="in_review" ${t.status==='in_review'?'selected':''}>👀 In Review</option>
                          <option value="done" ${t.status==='done'?'selected':''}>✅ Done</option>
                        </select>
                      ` : `
                        <span style="font-weight:700;color:${statusColors[t.status]||'var(--text)'};font-size:12px">
                          ${statusLabels[t.status] || t.status}
                        </span>
                      `}
                    </td>
                    <td style="font-size:12px;color:var(--t2);font-weight:500">
                      ${t.due_date ? fmtDate(t.due_date) : '<span style="color:var(--t3)">No date</span>'}
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex;gap:4px;justify-content:flex-end">
                        ${canModify ? `
                          <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:11px" onclick="openEditTaskModal('${t.id}')">✏️</button>
                          <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:11px;color:var(--err)" onclick="deleteTaskRecord('${t.id}')">🗑️</button>
                        ` : (isAssignedToMe ? `
                          <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:11px" onclick="openUpdateTaskProgressModal('${t.id}', ${t.progress || 0})">Update %</button>
                        ` : (isHr ? `
                          <span style="font-size:11px;color:var(--t3)">View only</span>
                        ` : ''))}
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div style="background:var(--s2);border:1px dashed var(--border);border-radius:10px;padding:24px;text-align:center;color:var(--t3)">
            <div style="font-size:24px;margin-bottom:4px">📝</div>
            <div style="font-size:13px;font-weight:600">No tasks created under this roadmap milestone yet</div>
            ${canModify ? `
              <button class="btn btn-ghost btn-sm" style="margin-top:10px;border:1px solid var(--border)" onclick="openCreateTaskModal('${rm.id}')">+ Add First Task</button>
            ` : ''}
          </div>
        `}
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL DIALOGS: CREATE & EDIT ROADMAPS / TASKS
// ═══════════════════════════════════════════════════════════════════════

function openCreateRoadmapModal() {
  if (isAdmin()) return toast('HR has read-only access and cannot create roadmaps.', 'err');

  const myTeam = allTeams.find(t => t.id === currentProfile?.team_id);
  const eligibleTeams = isSuper() ? allTeams : (myTeam ? [myTeam] : allTeams);

  document.getElementById('modalTitle').textContent = '🗺️ Create Team Roadmap Milestone';
  document.getElementById('modalSub').textContent   = 'Define a strategic objective and milestone for the team';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Assigned Team *</label>
      <select class="form-input" id="rmTeamSelect">
        ${eligibleTeams.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (${escapeHtml(t.department || 'General')})</option>`).join('')}
      </select>
    </div>
    <div class="form-group mb16">
      <label class="form-label">Roadmap Milestone Title *</label>
      <input class="form-input" id="rmTitle" placeholder="e.g. Enterprise Cloud Microservices &amp; API Modernization">
    </div>
    <div class="form-group mb16">
      <label class="form-label">Description / Strategic Objective</label>
      <textarea class="form-input" id="rmDesc" style="min-height:70px" placeholder="Describe the key outcomes, architecture goals, and team expectations..."></textarea>
    </div>
    <div class="g2 mb16">
      <div class="form-group">
        <label class="form-label">Quarter / Cycle *</label>
        <select class="form-input" id="rmQuarter">
          <option value="Q3 2026">Q3 2026</option>
          <option value="Q4 2026">Q4 2026</option>
          <option value="Q1 2027">Q1 2027</option>
          <option value="Q2 2027">Q2 2027</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Target Completion Date</label>
        <input class="form-input" id="rmTargetDate" type="date" value="2026-09-30">
      </div>
    </div>
    <div class="form-group mb16">
      <label class="form-label">Status</label>
      <select class="form-input" id="rmStatus">
        <option value="in_progress">⚡ In Progress</option>
        <option value="planned">🗓️ Planned</option>
        <option value="completed">✅ Completed</option>
        <option value="delayed">⚠️ Delayed</option>
      </select>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewRoadmap()">Create Roadmap →</button>
    </div>`;

  openModal();
}

async function saveNewRoadmap() {
  const team_id = v('rmTeamSelect');
  const title = v('rmTitle');
  const description = v('rmDesc');
  const quarter = v('rmQuarter');
  const target_date = v('rmTargetDate');
  const status = v('rmStatus');

  if (!team_id || !title || !quarter) {
    return toast('Please provide a team, title, and quarter.', 'warn');
  }

  const id = 'rm-' + Date.now();
  const newRm = {
    id,
    team_id,
    title,
    description: description || '',
    quarter,
    year: 2026,
    target_date: target_date || null,
    status: status || 'in_progress',
    created_by: currentProfile?.id || 'u2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tasks: [],
    task_count: 0,
    completed_task_count: 0,
    calculated_progress: 0
  };

  // Optimistic local state updates
  cachedRoadmaps.unshift(newRm);
  MOCK_ROADMAPS.unshift(newRm);

  closeModal();
  toast('✅ Roadmap created successfully!', 'success');
  pageTeamRoadmap();

  if (!isDemo) {
    try {
      await API.createRoadmap({ team_id, title, description, quarter, year: 2026, target_date, status });
    } catch (err) {
      console.warn('API sync notice for roadmap creation:', err.message);
    }
  }
}

function openEditRoadmapModal(roadmapId) {
  if (isAdmin()) return toast('HR has read-only access and cannot edit roadmaps.', 'err');

  const rm = cachedRoadmaps.find(r => r.id === roadmapId) || MOCK_ROADMAPS.find(r => r.id === roadmapId);
  if (!rm) return toast('Roadmap not found', 'err');

  document.getElementById('modalTitle').textContent = '✏️ Edit Team Roadmap Milestone';
  document.getElementById('modalSub').textContent   = 'Update roadmap goals, timeframe, and status';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Roadmap Milestone Title *</label>
      <input class="form-input" id="editRmTitle" value="${escapeHtml(rm.title)}">
    </div>
    <div class="form-group mb16">
      <label class="form-label">Description / Strategic Objective</label>
      <textarea class="form-input" id="editRmDesc" style="min-height:70px">${escapeHtml(rm.description||'')}</textarea>
    </div>
    <div class="g2 mb16">
      <div class="form-group">
        <label class="form-label">Quarter / Cycle *</label>
        <select class="form-input" id="editRmQuarter">
          <option value="Q3 2026" ${rm.quarter==='Q3 2026'?'selected':''}>Q3 2026</option>
          <option value="Q4 2026" ${rm.quarter==='Q4 2026'?'selected':''}>Q4 2026</option>
          <option value="Q1 2027" ${rm.quarter==='Q1 2027'?'selected':''}>Q1 2027</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Target Completion Date</label>
        <input class="form-input" id="editRmTargetDate" type="date" value="${rm.target_date ? rm.target_date.slice(0,10) : '2026-09-30'}">
      </div>
    </div>
    <div class="form-group mb16">
      <label class="form-label">Status</label>
      <select class="form-input" id="editRmStatus">
        <option value="in_progress" ${rm.status==='in_progress'?'selected':''}>⚡ In Progress</option>
        <option value="planned" ${rm.status==='planned'?'selected':''}>🗓️ Planned</option>
        <option value="completed" ${rm.status==='completed'?'selected':''}>✅ Completed</option>
        <option value="delayed" ${rm.status==='delayed'?'selected':''}>⚠️ Delayed</option>
      </select>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditedRoadmap('${rm.id}')">Save Changes →</button>
    </div>`;

  openModal();
}

async function saveEditedRoadmap(roadmapId) {
  const title = v('editRmTitle');
  const description = v('editRmDesc');
  const quarter = v('editRmQuarter');
  const target_date = v('editRmTargetDate');
  const status = v('editRmStatus');

  if (!title || !quarter) return toast('Title and quarter are required.', 'warn');

  const payload = { title, description, quarter, target_date, status };

  // Optimistic local update
  const rm = cachedRoadmaps.find(r => r.id === roadmapId) || MOCK_ROADMAPS.find(r => r.id === roadmapId);
  if (rm) Object.assign(rm, payload);

  closeModal();
  toast('Roadmap updated successfully!', 'success');
  pageTeamRoadmap();

  if (!isDemo) {
    try {
      await API.updateRoadmap(roadmapId, payload);
    } catch (err) {
      console.warn('API sync notice for roadmap update:', err.message);
    }
  }
}

async function deleteRoadmapRecord(roadmapId) {
  if (isAdmin()) return toast('HR has read-only access.', 'err');
  if (!confirm('Are you sure you want to delete this roadmap and all its assigned tasks?')) return;

  // Optimistic local deletion
  const idx = cachedRoadmaps.findIndex(r => r.id === roadmapId);
  if (idx >= 0) cachedRoadmaps.splice(idx, 1);
  const mIdx = MOCK_ROADMAPS.findIndex(r => r.id === roadmapId);
  if (mIdx >= 0) MOCK_ROADMAPS.splice(mIdx, 1);

  toast('Roadmap deleted', 'info');
  pageTeamRoadmap();

  if (!isDemo) {
    try {
      await API.deleteRoadmap(roadmapId);
    } catch (err) {
      console.warn('API sync notice for roadmap deletion:', err.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TASK ASSIGNMENT MODALS
// ═══════════════════════════════════════════════════════════════════════

function openCreateTaskModal(roadmapId) {
  if (isAdmin()) return toast('HR has read-only access and cannot assign tasks.', 'err');

  const rm = cachedRoadmaps.find(r => r.id === roadmapId) || MOCK_ROADMAPS.find(r => r.id === roadmapId);
  if (!rm) return toast('Roadmap not found', 'err');

  // Find team members of the roadmap's team
  const teamMembers = allUsers.filter(u => u.team_id === rm.team_id);
  const eligibleAssignees = teamMembers.length ? teamMembers : (allUsers.length ? allUsers : MOCK_PROFILES);

  document.getElementById('modalTitle').textContent = '📋 Assign New Task & Deliverable';
  document.getElementById('modalSub').textContent   = `Assign a task under "${escapeHtml(rm.title)}"`;
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Task Deliverable Title *</label>
      <input class="form-input" id="taskTitle" placeholder="e.g. Implement Redis Query Caching for High-Volume Endpoints">
    </div>
    <div class="form-group mb16">
      <label class="form-label">Assign To Team Member *</label>
      <select class="form-input" id="taskAssignee">
        <option value="">— Select Team Member —</option>
        ${eligibleAssignees.map(u => `<option value="${u.id}">${escapeHtml(u.full_name)} (${roleLabel(u.role)}${u.department ? ' • ' + u.department : ''})</option>`).join('')}
      </select>
    </div>
    <div class="form-group mb16">
      <label class="form-label">Description / Deliverable Criteria</label>
      <textarea class="form-input" id="taskDesc" style="min-height:60px" placeholder="Specify requirements, technical expectations, and definition of done..."></textarea>
    </div>
    <div class="g2 mb16">
      <div class="form-group">
        <label class="form-label">Priority Level *</label>
        <select class="form-input" id="taskPriority">
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="urgent">🔴 Urgent</option>
          <option value="low">Low Priority</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input class="form-input" id="taskDueDate" type="date" value="2026-09-20">
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewTask('${roadmapId}')">Assign Task →</button>
    </div>`;

  openModal();
}

async function saveNewTask(roadmapId) {
  const title = v('taskTitle');
  const assigned_to = v('taskAssignee');
  const description = v('taskDesc');
  const priority = v('taskPriority');
  const due_date = v('taskDueDate');

  if (!title || !assigned_to) {
    return toast('Please enter a task title and select an assignee.', 'warn');
  }

  const assigneeUser = (allUsers.length ? allUsers : MOCK_PROFILES).find(u => u.id === assigned_to) || { full_name: 'Team Member', email: '', avatar_initials: 'TM' };
  const assignerUser = currentProfile || { full_name: 'Manager', id: 'u2' };

  const id = 'task-' + Date.now();
  const newTask = {
    id,
    roadmap_id: roadmapId,
    title,
    assigned_to,
    assigned_to_name: assigneeUser.full_name,
    assigned_to_email: assigneeUser.email,
    assigned_to_avatar: assigneeUser.avatar_initials || avatarInitials(assigneeUser.full_name),
    assigned_by: assignerUser.id,
    assigned_by_name: assignerUser.full_name,
    description: description || '',
    priority: priority || 'medium',
    due_date: due_date || null,
    status: 'todo',
    progress: 0,
    assigned_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  // Optimistic update
  MOCK_ROADMAP_TASKS.unshift(newTask);
  const rm = cachedRoadmaps.find(r => r.id === roadmapId);
  if (rm) {
    if (!rm.tasks) rm.tasks = [];
    rm.tasks.unshift(newTask);
    rm.task_count = rm.tasks.length;
    const completed = rm.tasks.filter(t => t.status === 'done').length;
    rm.completed_task_count = completed;
    rm.calculated_progress = Math.round((completed / rm.tasks.length) * 100);
  }

  closeModal();
  toast('✅ Task assigned successfully!', 'success');
  pageTeamRoadmap();

  if (!isDemo) {
    try {
      await API.createRoadmapTask(roadmapId, { title, assigned_to, description, priority, due_date, status: 'todo' });
    } catch (err) {
      console.warn('API sync notice for task assignment:', err.message);
    }
  }
}

function openEditTaskModal(taskId) {
  if (isAdmin()) return toast('HR has read-only access.', 'err');

  let foundTask = null;
  cachedRoadmaps.forEach(r => {
    (r.tasks || []).forEach(t => {
      if (t.id === taskId) foundTask = t;
    });
  });
  if (!foundTask) foundTask = MOCK_ROADMAP_TASKS.find(t => t.id === taskId);

  if (!foundTask) return toast('Task not found', 'err');

  const usersList = allUsers.length ? allUsers : MOCK_PROFILES;

  document.getElementById('modalTitle').textContent = '✏️ Edit Task Deliverable';
  document.getElementById('modalSub').textContent   = 'Update task assignment, priority, or deadline';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Task Deliverable Title *</label>
      <input class="form-input" id="editTaskTitle" value="${escapeHtml(foundTask.title)}">
    </div>
    <div class="form-group mb16">
      <label class="form-label">Assignee *</label>
      <select class="form-input" id="editTaskAssignee">
        ${usersList.map(u => `<option value="${u.id}" ${foundTask.assigned_to===u.id?'selected':''}>${escapeHtml(u.full_name)} (${roleLabel(u.role)})</option>`).join('')}
      </select>
    </div>
    <div class="form-group mb16">
      <label class="form-label">Description</label>
      <textarea class="form-input" id="editTaskDesc" style="min-height:60px">${escapeHtml(foundTask.description||'')}</textarea>
    </div>
    <div class="g2 mb16">
      <div class="form-group">
        <label class="form-label">Priority</label>
        <select class="form-input" id="editTaskPriority">
          <option value="urgent" ${foundTask.priority==='urgent'?'selected':''}>🔴 Urgent</option>
          <option value="high" ${foundTask.priority==='high'?'selected':''}>High Priority</option>
          <option value="medium" ${foundTask.priority==='medium'?'selected':''}>Medium Priority</option>
          <option value="low" ${foundTask.priority==='low'?'selected':''}>Low Priority</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input class="form-input" id="editTaskDueDate" type="date" value="${foundTask.due_date ? foundTask.due_date.slice(0,10) : ''}">
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditedTask('${foundTask.id}')">Save Changes →</button>
    </div>`;

  openModal();
}

async function saveEditedTask(taskId) {
  const title = v('editTaskTitle');
  const assigned_to = v('editTaskAssignee');
  const description = v('editTaskDesc');
  const priority = v('editTaskPriority');
  const due_date = v('editTaskDueDate');

  if (!title) return toast('Task title is required.', 'warn');

  const assigneeUser = (allUsers.length ? allUsers : MOCK_PROFILES).find(u => u.id === assigned_to);
  const payload = {
    title,
    assigned_to,
    assigned_to_name: assigneeUser?.full_name,
    assigned_to_avatar: assigneeUser?.avatar_initials || avatarInitials(assigneeUser?.full_name || 'TM'),
    description,
    priority,
    due_date
  };

  // Optimistic update
  cachedRoadmaps.forEach(r => {
    (r.tasks || []).forEach(t => {
      if (t.id === taskId) Object.assign(t, payload);
    });
  });
  const t = MOCK_ROADMAP_TASKS.find(x => x.id === taskId);
  if (t) Object.assign(t, payload);

  closeModal();
  toast('Task updated successfully!', 'success');
  pageTeamRoadmap();

  if (!isDemo) {
    try {
      await API.updateRoadmapTask(taskId, { title, assigned_to, description, priority, due_date });
    } catch (err) {
      console.warn('API sync notice for task update:', err.message);
    }
  }
}

async function quickUpdateTaskStatus(taskId, newStatus) {
  // Optimistically update local cache and memory models
  cachedRoadmaps.forEach(rm => {
    (rm.tasks || []).forEach(t => {
      if (t.id === taskId) {
        t.status = newStatus;
        t.progress = newStatus === 'done' ? 100 : (t.progress || 0);
      }
    });
    const completed = (rm.tasks || []).filter(t => t.status === 'done').length;
    rm.completed_task_count = completed;
    rm.calculated_progress = rm.tasks?.length ? Math.round((completed / rm.tasks.length) * 100) : 0;
  });

  const mockT = MOCK_ROADMAP_TASKS.find(x => x.id === taskId);
  if (mockT) {
    mockT.status = newStatus;
    if (newStatus === 'done') mockT.progress = 100;
  }

  toast(`Task marked as ${newStatus.replace('_', ' ')}`, 'success');
  const container = document.getElementById('roadmapCardsContainer');
  if (container) container.innerHTML = renderRoadmapCards(cachedRoadmaps);

  // Sync with API
  if (!isDemo) {
    try {
      await API.updateRoadmapTask(taskId, { status: newStatus });
    } catch (err) {
      console.warn('API sync notice for status update:', err.message);
    }
  }
}

async function deleteTaskRecord(taskId) {
  if (isAdmin()) return toast('HR has read-only access.', 'err');
  if (!confirm('Are you sure you want to delete this task?')) return;

  // Optimistic local deletion
  cachedRoadmaps.forEach(rm => {
    if (rm.tasks) {
      rm.tasks = rm.tasks.filter(t => t.id !== taskId);
      rm.task_count = rm.tasks.length;
      const completed = rm.tasks.filter(t => t.status === 'done').length;
      rm.completed_task_count = completed;
      rm.calculated_progress = rm.tasks.length ? Math.round((completed / rm.tasks.length) * 100) : 0;
    }
  });
  const idx = MOCK_ROADMAP_TASKS.findIndex(t => t.id === taskId);
  if (idx >= 0) MOCK_ROADMAP_TASKS.splice(idx, 1);

  toast('Task deleted', 'info');
  pageTeamRoadmap();

  if (!isDemo) {
    try {
      await API.deleteRoadmapTask(taskId);
    } catch (err) {
      console.warn('API sync notice for task deletion:', err.message);
    }
  }
}
