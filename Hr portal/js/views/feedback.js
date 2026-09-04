// ═══════════════════════════════════════════════
// VIEW: FEEDBACK SUBMISSIONS & DETAIL REPORT (WITH FILTERS & CSV EXPORTS)
// ═══════════════════════════════════════════════

let currentFeedbackFilter = {
  search: '',
  type: 'all',
  minRating: 'all',
  sort: 'newest'
};

async function pageSubmit() {
  const main = document.getElementById('pageContent');
  const myTeam = allTeams.find(t => t.id === currentProfile?.team_id);
  main.innerHTML = `<div class="page-header">
    <div>
      <div class="page-title">Submit Feedback</div>
      <div class="page-sub">Choose a feedback type below${myTeam ? ` &bull; Your team: <strong>${escapeHtml(myTeam.name)}</strong>` : ''}</div>
    </div>
  </div><div class="content fade-up">
    <div class="type-grid">
      <div class="type-card" style="--tc:#4f46e5" onclick="selectFormType('manager',this)">
        <div class="type-icon">🏆</div><div class="type-name">Manager Feedback</div><div class="type-desc">Review your manager's leadership, support &amp; direction</div>
      </div>
      <div class="type-card" style="--tc:#059669" onclick="selectFormType('peer',this)">
        <div class="type-icon">🤝</div><div class="type-name">Peer Review</div><div class="type-desc">Give structured feedback to teammates and peers</div>
      </div>
      <div class="type-card" style="--tc:#d97706" onclick="selectFormType('hr',this)">
        <div class="type-icon">🏛️</div><div class="type-name">HR &amp; Culture</div><div class="type-desc">Evaluate HR responsiveness, culture &amp; workplace experience</div>
      </div>
      <div class="type-card" style="--tc:#e11d48" onclick="selectFormType('self',this)">
        <div class="type-icon">🪞</div><div class="type-name">Self Assessment</div><div class="type-desc">Reflect on your own KRAs, accomplishments &amp; growth areas</div>
      </div>
      <div class="type-card" style="--tc:#0284c7" onclick="selectFormType('360',this)">
        <div class="type-icon">🔄</div><div class="type-name">Cross Functional Feedback</div><div class="type-desc">Evaluate colleagues working across different teams &amp; functions</div>
      </div>
      <div class="type-card" style="--tc:#ca8a04" onclick="selectFormType('exit',this)">
        <div class="type-icon">🚪</div><div class="type-name">Exit Interview</div><div class="type-desc">Feedback upon departure or offboarding</div>
      </div>
    </div>
    <div id="formArea"></div>
  </div>`;
}

async function pageAllFeedback() {
  if (!canSeeAll()) {
    return accessDenied();
  }
  const rawData = await fetchFeedback();
  const title = isSuper() ? 'Company Feedback Oversight' : 'Company Feedback Oversight (HR)';
  const subTitle = isSuper()
    ? '🔒 Executive Oversight: You can view all company feedback & ratings including evaluations for HR. Feedback directed to Super Admin is routed exclusively to HR.'
    : '🔒 HR Oversight: You can view all company feedback & ratings including evaluations for Super Admin. Feedback directed to HR is routed exclusively to Super Admin.';

  document.getElementById('pageContent').innerHTML = `
  <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <div class="page-title">${title}</div>
      <div class="page-sub">${subTitle}</div>
    </div>
    <button class="btn btn-primary" onclick="openExportCSVModal()">📊 Export Reports (CSV)</button>
  </div>
  <div class="content fade-up">
    <!-- FILTERS TOOLBAR -->
    <div class="card mb16" style="padding:14px;background:var(--s1)">
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
        <div style="flex:1;min-width:200px">
          <input class="form-input" id="fbSearchInput" placeholder="🔍 Search subject, submitter, or comments…" value="${escapeHtml(currentFeedbackFilter.search)}" oninput="updateFeedbackFilter('search', this.value)" style="font-size:13px">
        </div>
        <div style="width:160px">
          <select class="form-input" id="fbTypeSelect" onchange="updateFeedbackFilter('type', this.value)" style="font-size:13px">
            <option value="all" ${currentFeedbackFilter.type==='all'?'selected':''}>All Feedback Types</option>
            <option value="manager" ${currentFeedbackFilter.type==='manager'?'selected':''}>Manager Feedback</option>
            <option value="peer" ${currentFeedbackFilter.type==='peer'?'selected':''}>Peer Review</option>
            <option value="hr" ${currentFeedbackFilter.type==='hr'?'selected':''}>HR &amp; Culture</option>
            <option value="self" ${currentFeedbackFilter.type==='self'?'selected':''}>Self Assessment</option>
            <option value="360" ${currentFeedbackFilter.type==='360'?'selected':''}>Cross Functional (360)</option>
            <option value="exit" ${currentFeedbackFilter.type==='exit'?'selected':''}>Exit Interview</option>
          </select>
        </div>
        <div style="width:130px">
          <select class="form-input" id="fbRatingSelect" onchange="updateFeedbackFilter('minRating', this.value)" style="font-size:13px">
            <option value="all" ${currentFeedbackFilter.minRating==='all'?'selected':''}>All Ratings</option>
            <option value="5" ${currentFeedbackFilter.minRating==='5'?'selected':''}>5 Stars Only</option>
            <option value="4" ${currentFeedbackFilter.minRating==='4'?'selected':''}>4+ Stars</option>
            <option value="3" ${currentFeedbackFilter.minRating==='3'?'selected':''}>3+ Stars</option>
          </select>
        </div>
        <div style="width:140px">
          <select class="form-input" id="fbSortSelect" onchange="updateFeedbackFilter('sort', this.value)" style="font-size:13px">
            <option value="newest" ${currentFeedbackFilter.sort==='newest'?'selected':''}>Newest First</option>
            <option value="oldest" ${currentFeedbackFilter.sort==='oldest'?'selected':''}>Oldest First</option>
            <option value="rating_high" ${currentFeedbackFilter.sort==='rating_high'?'selected':''}>Highest Rating</option>
            <option value="rating_low" ${currentFeedbackFilter.sort==='rating_low'?'selected':''}>Lowest Rating</option>
          </select>
        </div>
        ${(currentFeedbackFilter.search || currentFeedbackFilter.type !== 'all' || currentFeedbackFilter.minRating !== 'all') ? `
          <button class="btn btn-ghost btn-sm" onclick="resetFeedbackFilters()">Reset Filters</button>
        ` : ''}
      </div>
    </div>

    <!-- FEEDBACK TABLE CONTAINER -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Receiver / Subject</th><th>Submitted By</th><th>Rating</th><th>Date</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody id="feedbackTableBody">
            ${renderFeedbackRows(rawData)}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function updateFeedbackFilter(key, val) {
  currentFeedbackFilter[key] = val;
  const tbody = document.getElementById('feedbackTableBody');
  if (tbody) {
    tbody.innerHTML = renderFeedbackRows(feedbackCache);
  }
}

function resetFeedbackFilters() {
  currentFeedbackFilter = { search: '', type: 'all', minRating: 'all', sort: 'newest' };
  pageAllFeedback();
}

function renderFeedbackRows(data) {
  const userMap = {};
  allUsers.forEach(u => userMap[u.id] = u.full_name);

  let filtered = [...data];

  // Search filter
  if (currentFeedbackFilter.search) {
    const q = currentFeedbackFilter.search.toLowerCase();
    filtered = filtered.filter(r => {
      const rec = (userMap[r.receiver_id] || r.subject_name || '').toLowerCase();
      const giv = (r.is_anonymous ? 'anonymous' : (userMap[r.giver_id] || '')).toLowerCase();
      const txt = (r.content || '').toLowerCase();
      return rec.includes(q) || giv.includes(q) || txt.includes(q);
    });
  }

  // Type filter
  if (currentFeedbackFilter.type !== 'all') {
    filtered = filtered.filter(r => (r.feedback_type || r.type) === currentFeedbackFilter.type);
  }

  // Rating filter
  if (currentFeedbackFilter.minRating !== 'all') {
    const minR = parseFloat(currentFeedbackFilter.minRating);
    filtered = filtered.filter(r => (r.rating || r.score || 0) >= minR);
  }

  // Sorting
  filtered.sort((a, b) => {
    if (currentFeedbackFilter.sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (currentFeedbackFilter.sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (currentFeedbackFilter.sort === 'rating_high') return (b.rating || b.score || 0) - (a.rating || a.score || 0);
    if (currentFeedbackFilter.sort === 'rating_low') return (a.rating || a.score || 0) - (b.rating || b.score || 0);
    return 0;
  });

  if (!filtered.length) {
    return `<tr><td colspan="6"><div class="empty"><div class="empty-icon">📭</div><div class="empty-sub">No feedback records match your filters</div></div></td></tr>`;
  }

  return filtered.map(r => {
    const receiverObj = allUsers.find(u => u.id === r.receiver_id) || {};
    const receiverName = userMap[r.receiver_id] || r.subject_name || receiverObj.full_name || 'Team Member';
    const giverName = r.is_anonymous ? '🔒 Anonymous' : (userMap[r.giver_id] || r.giver_id || 'User');
    const typeKey = r.feedback_type || r.type || 'peer';

    let routingBadge = '';
    if (receiverObj.role === 'admin' && isSuper()) {
      routingBadge = `<div style="font-size:10px;font-weight:700;color:var(--a2);margin-top:2px">🏛️ HR Feedback &bull; Routed to Super Admin</div>`;
    } else if (receiverObj.role === 'super_admin' && isAdmin()) {
      routingBadge = `<div style="font-size:10px;font-weight:700;color:var(--a1);margin-top:2px">👑 Super Admin Feedback &bull; Routed to HR</div>`;
    }

    return `<tr>
      <td><span class="badge badge-${typeKey}">${typeLabel(typeKey)}</span></td>
      <td style="color:var(--text);font-weight:600">
        <div>${escapeHtml(receiverName)}</div>
        ${routingBadge}
      </td>
      <td>${escapeHtml(giverName)}</td>
      <td style="font-weight:600;color:var(--a3)">${r.rating ? r.rating : (r.score ? Number(r.score).toFixed(1) : '—')} ★</td>
      <td style="font-size:12px;color:var(--t3)">${fmtDate(r.created_at)}</td>
      <td style="text-align:right">
        <div style="display:flex;gap:6px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" onclick="openDetail('${r.id}')">View Detail</button>
          ${isSuper() ? `<button class="btn btn-ghost btn-sm" style="color:var(--err)" onclick="deleteRecord('${r.id}')" title="Delete entry so employee can resubmit">🗑️ Delete</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function pageMyFeedback() {
  const data = await fetchFeedback();
  const mySubmissions = data.filter(r => r.giver_id === currentProfile?.id || (isDemo && r.submitted_by === currentProfile?.id));

  const userMap = {};
  allUsers.forEach(u => userMap[u.id] = u.full_name);

  document.getElementById('pageContent').innerHTML = `
  <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <div class="page-title">My Feedback Submissions</div>
      <div class="page-sub">🔒 Strictly private to you. View all evaluations and ratings you have submitted.</div>
    </div>
    <button class="btn btn-primary" onclick="navigate('submit')">+ Submit New Feedback</button>
  </div>
  <div class="content fade-up">
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Review Subject</th><th>Your Rating</th><th>Anonymous?</th><th>Date</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            ${mySubmissions.length ? mySubmissions.map(r => {
              const receiverName = userMap[r.receiver_id] || r.subject_name || 'Team Member';
              const typeKey = r.feedback_type || r.type || 'peer';
              return `<tr>
                <td><span class="badge badge-${typeKey}">${typeLabel(typeKey)}</span></td>
                <td style="color:var(--text);font-weight:600">${escapeHtml(receiverName)}</td>
                <td style="font-weight:600;color:var(--a3)">${r.rating ? r.rating : (r.score ? Number(r.score).toFixed(1) : '—')} ★</td>
                <td>${r.is_anonymous ? '<span style="color:var(--a2);font-weight:600">🔒 Yes (Anonymous)</span>' : '<span style="color:var(--t3)">No</span>'}</td>
                <td style="font-size:12px;color:var(--t3)">${fmtDate(r.created_at)}</td>
                <td style="text-align:right">
                  <button class="btn btn-ghost btn-sm" onclick="openDetail('${r.id}')">View Details</button>
                </td>
              </tr>`;
            }).join('') : `<tr><td colspan="6"><div class="empty"><div class="empty-icon">📝</div><div class="empty-sub">You have not submitted any feedback yet</div><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="navigate('submit')">+ Submit Feedback</button></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
// DETAILED QUESTION & ANSWER FEEDBACK MODAL
// ═══════════════════════════════════════════════
async function openDetail(id) {
  let r = feedbackCache.find(x => x.id === id) || (isDemo ? MOCK_FEEDBACK.find(x => x.id === id) : null);
  if (!r) return toast('Record not found', 'err');

  const userMap = {};
  allUsers.forEach(u => userMap[u.id] = u.full_name);

  const typeKey = r.feedback_type || r.type || 'peer';
  const receiverName = userMap[r.receiver_id] || r.subject_name || 'Team Member';
  const giverName = r.is_anonymous ? '🔒 Anonymous' : (userMap[r.giver_id] || 'User');

  // Extract structured peer_details metrics and questions
  let peerData = r.peer_details;
  let plainContentText = r.content || r.strengths || '';

  if (!peerData && r.content) {
    try {
      const jsonStart = r.content.indexOf('{');
      if (jsonStart !== -1) {
        plainContentText = r.content.substring(0, jsonStart).trim();
        peerData = JSON.parse(r.content.substring(jsonStart));
      }
    } catch (e) {}
  }

  // Fallback: If peerData is not stored in payload, construct it from form templates so every single question is displayed!
  if (!peerData) {
    const tpls = getTemplates();
    const formTpl = tpls[typeKey];
    if (formTpl && (formTpl.metrics?.length || formTpl.questions?.length)) {
      peerData = {
        metrics: (formTpl.metrics || []).map(m => ({ label: m.label, rating: r.rating || 5, feedback: '' })),
        questions: (formTpl.questions || []).map(q => ({ question: q.question, rating: r.rating || 5, feedback: '' }))
      };
    }
  }

  let structuredHtml = '';

  if (peerData && (peerData.metrics?.length || peerData.questions?.length)) {
    structuredHtml = `
      <!-- SECTION 1: QUALITY METRICS -->
      ${peerData.metrics && peerData.metrics.length ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--text);margin-bottom:10px">📊 Quality Attributes &amp; Competencies</div>
          <div class="table-wrap mb20">
            <table>
              <thead><tr><th>Quality Metric</th><th>Rating</th><th>Submitted Comment / Feedback</th></tr></thead>
              <tbody>
                ${peerData.metrics.map(m => `<tr>
                  <td style="font-weight:600;color:var(--text);white-space:nowrap;font-size:13px">${escapeHtml(m.label)}</td>
                  <td style="font-weight:700;color:var(--a3);white-space:nowrap;font-size:13px">${m.rating || 5} ★</td>
                  <td style="font-size:13px">${m.feedback ? escapeHtml(m.feedback) : '<span style="color:var(--t3);font-style:italic">Satisfactory / No specific comment</span>'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- SECTION 2: QUALITATIVE QUESTIONS & ANSWERS -->
      ${peerData.questions && peerData.questions.length ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--text);margin-bottom:12px">❓ Detailed Qualitative Questions &amp; Answers</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${peerData.questions.map((q, idx) => `
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:14px">
                <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">Q${idx+1}: ${escapeHtml(q.question)}</div>
                <div style="font-size:12px;color:var(--a3);font-weight:700;margin-bottom:8px">Rating: ${q.rating || 5} ★</div>
                <div style="background:var(--s1);border:1px solid var(--border);border-radius:6px;padding:10px;font-size:13px;color:var(--t2);line-height:1.5">
                  ${q.feedback ? escapeHtml(q.feedback) : '<span style="color:var(--t3);font-style:italic">Evaluated &amp; Approved</span>'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  document.getElementById('modalTitle').textContent = `${typeLabel(typeKey)} Evaluation Detail`;
  document.getElementById('modalSub').textContent   = `Submitted ${fmtDate(r.created_at)} &bull; 🔒 Role Protected Response`;

  document.getElementById('modalBody').innerHTML = `
    <div class="detail-row"><div class="dk">Feedback Type</div><div class="dv"><span class="badge badge-${typeKey}">${typeLabel(typeKey)}</span></div></div>
    <div class="detail-row"><div class="dk">Submitted By</div><div class="dv">${escapeHtml(giverName)}</div></div>
    <div class="detail-row"><div class="dk">Receiver / Subject</div><div class="dv"><strong>${escapeHtml(receiverName)}</strong></div></div>
    <div class="detail-row"><div class="dk">Overall Score</div><div class="dv" style="font-weight:800;color:var(--a3);font-size:18px">${r.rating || r.score || 5} / 5.0 ★</div></div>

    ${plainContentText && !plainContentText.startsWith('Evaluated across') ? `
      <div style="margin-top:14px;padding:12px;background:var(--s2);border:1px solid var(--border);border-radius:8px">
        <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:4px">Summary Notes / Strengths</div>
        <div style="font-size:13px;color:var(--text);line-height:1.5">${escapeHtml(plainContentText)}</div>
      </div>
    ` : ''}

    ${structuredHtml}

    <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--border)">
      <button class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Print Response Report</button>
      <div style="display:flex;gap:8px">
        ${isSuper() ? `<button class="btn btn-danger btn-sm" onclick="deleteRecord('${r.id}')">🗑️ Delete for Resubmission</button>` : ''}
        <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      </div>
    </div>`;

  openModal();
}

async function deleteRecord(id) {
  if (!confirm('Delete this feedback entry?')) return;
  if (isDemo) {
    MOCK_FEEDBACK = MOCK_FEEDBACK.filter(x=>x.id!==id);
  } else {
    try {
      await API.deleteFeedback(id);
    } catch(err) {
      toast(`Delete failed: ${err.message}`, 'err');
      return;
    }
  }
  closeModal();
  toast('Deleted feedback entry', 'info');
  pageAllFeedback();
}

// ═══════════════════════════════════════════════
// ORG-WIDE & TEAM-LEVEL ORGANIZED CSV EXPORTS
// ═══════════════════════════════════════════════
function openExportCSVModal() {
  const depts = allDepartments.length ? allDepartments : MOCK_DEPARTMENTS;
  const teams = allTeams.length ? allTeams : MOCK_TEAMS;

  document.getElementById('modalTitle').textContent = '📊 Export Organized CSV Reports';
  document.getElementById('modalSub').textContent   = 'Download company-wide or team-level feedback reports';
  document.getElementById('modalBody').innerHTML = `
    <!-- OPTION 1: WHOLE ORGANISATION REPORT -->
    <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">🏢 Whole Organisation Report</div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:12px">Export all feedback submissions across all departments and teams into a single organized CSV file.</div>
      <button class="btn btn-primary" onclick="exportReportCSV('org');closeModal()" style="width:100%">📥 Download Whole Organisation Report (CSV)</button>
    </div>

    <!-- OPTION 2: PER-TEAM REPORT -->
    <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">🏷️ Per-Team Report</div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:10px">Select a specific team to export feedback responses for its members.</div>
      <div class="form-group mb12">
        <select class="form-input" id="exportTeamSelect" style="background:var(--s1)">
          <option value="">— Select Team —</option>
          ${teams.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (${escapeHtml(t.department || 'General')})</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-ghost" onclick="triggerTeamExport()" style="width:100%;border:1px solid var(--border);background:var(--s1)">📥 Download Team Report (CSV)</button>
    </div>

    <!-- OPTION 3: PER-DEPARTMENT REPORT -->
    <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">🏢 Per-Department Report</div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:10px">Select a department to export all feedback within that division.</div>
      <div class="form-group mb12">
        <select class="form-input" id="exportDeptSelect" style="background:var(--s1)">
          <option value="">— Select Department —</option>
          ${depts.map(d => `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-ghost" onclick="triggerDeptExport()" style="width:100%;border:1px solid var(--border);background:var(--s1)">📥 Download Department Report (CSV)</button>
    </div>
    
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    </div>`;

  openModal();
}

function triggerTeamExport() {
  const teamId = v('exportTeamSelect');
  if (!teamId) return toast('Please select a team', 'warn');
  exportReportCSV('team', teamId);
  closeModal();
}

function triggerDeptExport() {
  const deptName = v('exportDeptSelect');
  if (!deptName) return toast('Please select a department', 'warn');
  exportReportCSV('dept', deptName);
  closeModal();
}

function formatCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  str = str.replace(/\r?\n|\r/g, ' ; ');
  return `"${str}"`;
}

function exportReportCSV(scope, idVal) {
  const data = feedbackCache && feedbackCache.length ? feedbackCache : [];
  if (!data.length) return toast('No feedback data available for export', 'warn');

  const userObjMap = {};
  allUsers.forEach(u => userObjMap[u.id] = u);

  const teamMap = {};
  allTeams.forEach(t => teamMap[t.id] = t);

  let filtered = [...data];
  let fileNamePrefix = 'vectyra_whole_organisation_report';

  if (scope === 'team' && idVal) {
    const selectedTeam = teamMap[idVal];
    const teamName = selectedTeam?.name || idVal;
    fileNamePrefix = `vectyra_team_${teamName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const teamUserIds = allUsers.filter(u => u.team_id === idVal).map(u => u.id);
    filtered = filtered.filter(f =>
      f.team_id === idVal ||
      teamUserIds.includes(f.receiver_id) ||
      teamUserIds.includes(f.giver_id)
    );
  } else if (scope === 'dept' && idVal) {
    fileNamePrefix = `vectyra_dept_${idVal.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const deptUserIds = allUsers.filter(u => u.department === idVal).map(u => u.id);
    filtered = filtered.filter(f =>
      deptUserIds.includes(f.receiver_id) ||
      deptUserIds.includes(f.giver_id)
    );
  }

  if (!filtered.length) return toast('No feedback records found for the selected filter', 'warn');

  const headers = [
    'Feedback ID',
    'Feedback Type',
    'Receiver Name',
    'Receiver Email',
    'Receiver Department',
    'Receiver Team',
    'Submitted By',
    'Submitter Email',
    'Submitter Role',
    'Anonymous Submission',
    'Overall Rating',
    'Review Cycle',
    'Submission Date',
    'Quality Attributes Breakdown',
    'Qualitative Questions & Answers Breakdown',
    'Summary Notes & Comments'
  ];

  const rows = filtered.map(r => {
    const recUser = userObjMap[r.receiver_id] || {};
    const recName = recUser.full_name || r.subject_name || r.receiver_id || 'Team Member';
    const recEmail = recUser.email || '—';
    const recDept = recUser.department || '—';
    const recTeam = teamMap[recUser.team_id]?.name || '—';

    const givUser = userObjMap[r.giver_id] || {};
    const givName = r.is_anonymous ? 'Anonymous' : (givUser.full_name || r.giver_id || 'User');
    const givEmail = r.is_anonymous ? 'Anonymous' : (givUser.email || '—');
    const givRole = r.is_anonymous ? 'Anonymous' : roleLabel(givUser.role || 'employee');

    const typeKey = r.feedback_type || r.type || 'peer';
    const ratingVal = r.rating || r.score || 5;

    // Parse structured Q&A
    let peerData = r.peer_details;
    let plainNotes = r.content || r.strengths || '';
    if (!peerData && r.content) {
      try {
        const jsonStart = r.content.indexOf('{');
        if (jsonStart !== -1) {
          plainNotes = r.content.substring(0, jsonStart).trim();
          peerData = JSON.parse(r.content.substring(jsonStart));
        }
      } catch (e) {}
    }

    if (!peerData) {
      const tpls = getTemplates();
      const formTpl = tpls[typeKey];
      if (formTpl) {
        peerData = {
          metrics: (formTpl.metrics || []).map(m => ({ label: m.label, rating: ratingVal, feedback: '' })),
          questions: (formTpl.questions || []).map(q => ({ question: q.question, rating: ratingVal, feedback: '' }))
        };
      }
    }

    let metricsStr = '';
    if (peerData?.metrics?.length) {
      metricsStr = peerData.metrics.map(m => `${m.label}: ${m.rating}★ (${m.feedback || 'Satisfactory'})`).join(' | ');
    }

    let questionsStr = '';
    if (peerData?.questions?.length) {
      questionsStr = peerData.questions.map((q, idx) => `Q${idx+1} [${q.question}]: ${q.rating}★ -> ${q.feedback || 'Evaluated'}`).join(' | ');
    }

    return [
      formatCsvCell(r.id),
      formatCsvCell(typeLabel(typeKey)),
      formatCsvCell(recName),
      formatCsvCell(recEmail),
      formatCsvCell(recDept),
      formatCsvCell(recTeam),
      formatCsvCell(givName),
      formatCsvCell(givEmail),
      formatCsvCell(givRole),
      formatCsvCell(r.is_anonymous ? 'Yes' : 'No'),
      formatCsvCell(`${ratingVal} / 5`),
      formatCsvCell(r.review_cycle || 'Q3 2026'),
      formatCsvCell(fmtDate(r.created_at)),
      formatCsvCell(metricsStr || '—'),
      formatCsvCell(questionsStr || '—'),
      formatCsvCell(plainNotes || '—')
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(formatCsvCell).join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileNamePrefix}_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast(`✅ CSV Report downloaded (${filtered.length} records)!`, 'success');
}

// Alias for backwards compatibility
function exportCSV() {
  openExportCSVModal();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
