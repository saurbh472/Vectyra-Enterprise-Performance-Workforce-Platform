async function pageDashboard() {
  const main = document.getElementById('pageContent');
  await loadMeta();

  const myTeam = allTeams.find(t => t.id === currentProfile?.team_id);
  const teamBadge = myTeam
    ? `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,0.15);color:var(--a1);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-top:6px">🏷️ ${myTeam.name}${myTeam.department ? ' &bull; ' + myTeam.department : ''}</span>`
    : '';

  const canAssignGoals = isSuper() || isAdmin() || isManager();

  main.innerHTML = `<div class="page-header">
    <div>
      <div class="page-title">Dashboard</div>
      <div class="page-sub">Welcome back, ${currentProfile?.full_name?.split(' ')[0]}</div>
      ${teamBadge}
    </div>
    <div class="header-right">
      <button class="btn btn-ghost btn-sm" onclick="openGiveKudosModal()">🏆 Give Kudos</button>
      ${canAssignGoals ? `<button class="btn btn-ghost btn-sm" onclick="openAssignGoalModal()">🎯 Assign KRA / Goal</button>` : ''}
      ${canSeeAll() ? `<button class="btn btn-ghost btn-sm" onclick="exportCSV()">⬇ Export CSV</button>` : ''}
      <button class="btn btn-primary btn-sm" onclick="navigate('submit')">+ New Feedback</button>
    </div>
  </div><div class="content" id="dashContent"><div class="loading"><div class="spinner"></div> Loading data…</div></div>`;

  const data = await fetchFeedback();
  feedbackCache = data;

  const total   = data.length;
  const scores  = data.filter(r => r.score > 0).map(r => r.score);
  const avgScore= scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '—';
  const now     = new Date();
  const week    = data.filter(r => (now - new Date(r.created_at)) < 7*86400000).length;
  const npsItems= data.filter(r => r.nps_score != null && r.nps_score >= 0);
  const promoters  = npsItems.filter(r => r.nps_score >= 9).length;
  const detractors = npsItems.filter(r => r.nps_score <= 6).length;
  const nps = npsItems.length ? Math.round(((promoters - detractors) / npsItems.length) * 100) : null;

  const myBadges = allBadges.filter(b => b.awarded_to === currentProfile?.id);

  document.getElementById('dashContent').innerHTML = `
    ${renderActionCenter(data)}
    ${renderDashboardRoadmapWidget()}
    <div class="mb24">
      ${renderBadgesCard(myBadges)}
    </div>
    ${canSeeAll() ? `
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin-bottom:12px">📊 Performance Analytics</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-accent" style="background:var(--a1)"></div>
          <div class="stat-label">Total Responses</div><div class="stat-val">${total}</div>
          <div class="stat-foot">${isSuper() ? 'Company-wide (excluding self)' : 'Company-wide (excluding HR self)'}</div>
        </div>
        <div class="stat-card"><div class="stat-accent" style="background:var(--a3)"></div>
          <div class="stat-label">Avg Score</div><div class="stat-val">${avgScore}</div>
          <div class="stat-foot">out of 5.0</div>
        </div>
        <div class="stat-card"><div class="stat-accent" style="background:var(--a2)"></div>
          <div class="stat-label">This Week</div><div class="stat-val">${week}</div>
          <div class="stat-foot">submissions</div>
        </div>
        <div class="stat-card"><div class="stat-accent" style="background:var(--a5)"></div>
          <div class="stat-label">NPS Score</div>
          <div class="stat-val" style="color:${nps===null?'var(--t3)':nps>=0?'var(--a3)':'var(--a4)'}">${nps===null?'—':(nps>0?'+':'')+nps}</div>
          <div class="stat-foot">${npsItems.length} ratings</div>
        </div>
      </div>
      <div class="g2 mb24">${cardDonut(data)}${cardNPS(npsItems,promoters,detractors,nps)}</div>
      <div class="g2">${cardBarChart(data)}${cardActivity(data)}</div>
    ` : `
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin-bottom:12px">📋 My Submission Activity</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-accent" style="background:var(--a1)"></div>
          <div class="stat-label">Reviews Submitted</div><div class="stat-val">${total}</div>
          <div class="stat-foot">by you</div>
        </div>
        <div class="stat-card"><div class="stat-accent" style="background:var(--a2)"></div>
          <div class="stat-label">This Week</div><div class="stat-val">${week}</div>
          <div class="stat-foot">submissions by you</div>
        </div>
      </div>
      <div class="mb24">${cardActivity(data)}</div>
    `}`;

  updateFeedbackBadge(total);
}

function renderActionCenter(data) {
  const currentUserId = currentProfile?.id;
  const isSuperAdmin = isSuper();
  const isHr = isAdmin();
  const isMgr = isManager();

  // Peer review counts given by current user
  const peerCount = (data || []).filter(r => (r.feedback_type === 'peer' || r.type === 'peer') && (r.giver_id === currentUserId || r.submitted_by === currentUserId)).length;

  const cycleTitle = 'Q3 2026 Performance Appraisal';
  const cycleSubtitle = 'Quarterly Self-Review, Skill Matrix Assessment & Feedback';

  if (isSuperAdmin || isHr) {
    return `
      <div style="background:linear-gradient(135deg,rgba(79,70,229,.09),rgba(124,58,237,.05));border:1px solid rgba(79,70,229,.22);border-radius:16px;padding:20px;margin-bottom:24px;box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:16px;font-weight:800;color:var(--text)">📋 Active Appraisal Cycle: ${cycleTitle}</span>
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(5,150,105,.15);color:#34d399">● Active Evaluation Window</span>
            </div>
            <div style="font-size:12px;color:var(--t2);margin-top:4px">Executive oversight &bull; Monitor company-wide quarterly appraisals and team execution roadmaps</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="qrCurrentTab='archive';navigate('quarterly')">📂 All Appraisals Hub</button>
            <button class="btn btn-primary btn-sm" onclick="navigate('cycles')">🔁 Manage Review Cycles</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
          <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="qrCurrentTab='archive';navigate('quarterly')">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">📊 Company Review Submissions</div>
              <div style="font-size:11px;color:var(--a1);margin-top:2px;font-weight:600">View All Department Scores</div>
            </div>
            <span style="font-size:16px">📑</span>
          </div>

          <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="navigate('roadmap')">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">🗺️ Team Roadmaps Oversight</div>
              <div style="font-size:11px;color:var(--a3);margin-top:2px;font-weight:600">Company-wide Deliverables</div>
            </div>
            <span style="font-size:16px">🎯</span>
          </div>

          <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="qrCurrentTab='templateBuilder';navigate('quarterly')">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">📝 Skill Matrix Templates</div>
              <div style="font-size:11px;color:var(--t2);margin-top:2px">Configure Competencies</div>
            </div>
            <span style="font-size:16px">⚙️</span>
          </div>

          <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="navigate('analytics')">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">📈 Sentiment &amp; NPS Reports</div>
              <div style="font-size:11px;color:var(--a2);margin-top:2px;font-weight:600">Real-Time Metrics</div>
            </div>
            <span style="font-size:16px">📈</span>
          </div>
        </div>
      </div>`;
  }

  if (isMgr) {
    return `
      <div style="background:linear-gradient(135deg,rgba(79,70,229,.09),rgba(124,58,237,.05));border:1px solid rgba(79,70,229,.22);border-radius:16px;padding:20px;margin-bottom:24px;box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:16px;font-weight:800;color:var(--text)">📋 Active Review Cycle: ${cycleTitle}</span>
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(5,150,105,.15);color:#34d399">● Active Appraisal Window</span>
            </div>
            <div style="font-size:12px;color:var(--t2);margin-top:4px">${cycleSubtitle} &bull; Complete team evaluations before cycle closing</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" onclick="qrCurrentTab='teamReviews';navigate('quarterly')">🏆 Grade Team Appraisals →</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
          <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">🏆 Team Member Appraisals</div>
              <div style="font-size:11px;color:var(--a1);margin-top:2px;font-weight:600">Review &amp; Grade Direct Reports</div>
            </div>
            <button class="btn btn-primary btn-sm" style="font-size:11px;padding:4px 8px" onclick="qrCurrentTab='teamReviews';navigate('quarterly')">Grade →</button>
          </div>

          <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">🪞 Manager Self-Review</div>
              <div style="font-size:11px;color:var(--t2);margin-top:2px">Your KPIs &amp; Achievements</div>
            </div>
            <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 8px" onclick="qrCurrentTab='form';navigate('quarterly')">Open Form →</button>
          </div>

          <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">🗺️ Team Roadmaps &amp; Tasks</div>
              <div style="font-size:11px;color:var(--a3);margin-top:2px;font-weight:600">Assign &amp; Track Deliverables</div>
            </div>
            <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 8px" onclick="navigate('roadmap')">Plan →</button>
          </div>

          <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">🤝 Peer Reviews</div>
              <div style="font-size:11px;color:var(--t2);margin-top:2px">${peerCount} feedback given</div>
            </div>
            <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 8px" onclick="selectFormType('peer');navigate('submit')">+ Feedback</button>
          </div>
        </div>
      </div>`;
  }

  // Employee View
  return `
    <div style="background:linear-gradient(135deg,rgba(79,70,229,.09),rgba(124,58,237,.05));border:1px solid rgba(79,70,229,.22);border-radius:16px;padding:20px;margin-bottom:24px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:16px;font-weight:800;color:var(--text)">📋 Active Review Cycle: ${cycleTitle}</span>
            <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(5,150,105,.15);color:#34d399">● Open For Submissions</span>
          </div>
          <div style="font-size:12px;color:var(--t2);margin-top:4px">${cycleSubtitle} &bull; Complete your self-assessment and technical skill matrix</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="qrCurrentTab='form';navigate('quarterly')">🪞 Complete Self-Review &amp; Skill Matrix →</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
        <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text)">🪞 Quarterly Self-Review</div>
            <div style="font-size:11px;color:var(--a1);margin-top:2px;font-weight:600">Skill Matrix &amp; Achievements</div>
          </div>
          <button class="btn btn-primary btn-sm" style="font-size:11px;padding:4px 8px" onclick="qrCurrentTab='form';navigate('quarterly')">Start Form →</button>
        </div>

        <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text)">🤝 Peer Review &amp; Kudos</div>
            <div style="font-size:11px;color:var(--t2);margin-top:2px">${peerCount} reviews submitted</div>
          </div>
          <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 8px" onclick="selectFormType('peer');navigate('submit')">+ Review Peer</button>
        </div>

        <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text)">🗺️ My Team Deliverables</div>
            <div style="font-size:11px;color:var(--a3);margin-top:2px;font-weight:600">Roadmap Tasks &amp; Milestones</div>
          </div>
          <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 8px" onclick="navigate('roadmap')">View Tasks →</button>
        </div>

        <div style="background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text)">📜 Previous Reviews</div>
            <div style="font-size:11px;color:var(--t2);margin-top:2px">Appraisal History</div>
          </div>
          <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 8px" onclick="qrCurrentTab='archive';navigate('quarterly')">History →</button>
        </div>
      </div>
    </div>`;
}

function renderBadgesCard(badges) {
  const received = allBadges.filter(b => b.awarded_to === currentProfile?.id);
  const given    = allBadges.filter(b => b.awarded_by === currentProfile?.id);
  const displayBadges = canSeeAll() ? (allBadges.length ? allBadges : badges) : [...received, ...given];

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">🏆 Recognition &amp; Badges Showcase</div>
          <div class="card-sub">${received.length} received &bull; ${given.length} awarded by you</div>
        </div>
        <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="openGiveKudosModal()">+ Give Kudos</button>
      </div>
      <div class="card-body">
        ${displayBadges.length ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
            ${displayBadges.map(b => {
              const recipient = allUsers.find(u => u.id === b.awarded_to) || { full_name: b.awarded_to_name || 'Employee' };
              const sender    = allUsers.find(u => u.id === b.awarded_by) || { full_name: b.awarded_by_name || 'Leader' };
              const isToMe   = b.awarded_to === currentProfile?.id;
              const isFromMe = b.awarded_by === currentProfile?.id;

              return `
                <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;text-align:center">
                  <div style="font-size:28px;margin-bottom:4px">${b.icon || '🏆'}</div>
                  <div style="font-size:12px;font-weight:700;color:var(--text)">${escapeHtml(b.title)}</div>
                  <div style="font-size:11px;color:var(--a1);font-weight:600;margin-top:4px">
                    To: <strong>${isToMe ? 'You' : escapeHtml(recipient.full_name)}</strong>
                  </div>
                  <div style="font-size:10px;color:var(--t3);margin-top:2px">
                    From: <strong>${isFromMe ? 'You' : escapeHtml(sender.full_name)}</strong>
                  </div>
                  ${b.comment ? `<div style="font-size:10px;color:var(--t2);margin-top:6px;font-style:italic">"${escapeHtml(b.comment)}"</div>` : ''}
                </div>`;
            }).join('')}
          </div>
        ` : `
          <div style="text-align:center;padding:30px;color:var(--t3)">
            <div style="font-size:24px;margin-bottom:6px">🏆</div>
            <div style="font-size:13px;font-weight:600">No badges awarded yet</div>
            <div style="font-size:11px;margin-top:2px">Badges earned during peer reviews and kudos will appear here</div>
          </div>
        `}
      </div>
    </div>`;
}

function renderDashboardRoadmapWidget() {
  const canModify = isSuper() || isManager();
  const isHr = isAdmin();
  const rawList = (cachedRoadmaps && Array.isArray(cachedRoadmaps) && cachedRoadmaps.length) ? cachedRoadmaps : (isDemo ? MOCK_ROADMAPS : (Array.isArray(cachedRoadmaps) && cachedRoadmaps.length ? cachedRoadmaps : MOCK_ROADMAPS));
  const roadmaps = Array.isArray(rawList) ? rawList : [];

  return `
    <div class="card mb24" style="border:1px solid var(--border);border-radius:16px;background:var(--card)">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <div class="card-title">🗺️ Team Roadmap &amp; Execution Tasks</div>
          <div class="card-sub">${isManager() ? 'Set team deliverables and assign tasks to your team members' : isHr ? 'Company-wide roadmap and task assignment oversight (Read-Only)' : isSuper() ? 'Executive oversight & task execution management across all teams' : 'Quarterly team milestones and assigned deliverables'}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${canModify ? `<button class="btn btn-ghost btn-sm" onclick="openCreateRoadmapModal()">+ New Roadmap</button>` : ''}
          <button class="btn btn-primary btn-sm" onclick="navigate('roadmap')">Open Full Roadmap →</button>
        </div>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
          ${roadmaps.slice(0, 3).map(rm => {
            const teamObj = allTeams.find(t => t.id === rm.team_id) || { name: 'Engineering Team' };
            const tasks = rm.tasks || (isDemo ? MOCK_ROADMAP_TASKS.filter(t => t.roadmap_id === rm.id) : []);
            const completed = tasks.filter(t => t.status === 'done').length;
            const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

            return `
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer" onclick="navigate('roadmap')">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                    <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;background:rgba(99,102,241,0.15);color:var(--a1)">${escapeHtml(teamObj.name)}</span>
                    <span style="font-size:11px;color:var(--t3);font-weight:600">${escapeHtml(rm.quarter || 'Q3 2026')}</span>
                  </div>
                  <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">${escapeHtml(rm.title)}</div>
                  <div style="font-size:11px;color:var(--t3);line-height:1.4">${escapeHtml((rm.description||'').slice(0, 75))}${rm.description && rm.description.length > 75 ? '…' : ''}</div>
                </div>
                <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
                  <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--t2);margin-bottom:4px">
                    <span>${completed} of ${tasks.length} tasks completed</span>
                    <strong style="color:var(--a1)">${pct}%</strong>
                  </div>
                  <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--a1),var(--a3));border-radius:3px"></div>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

function quickReviewTeammate(memberId) {
  selectFormType('peer');
  navigate('submit');
  setTimeout(() => {
    const sel = document.getElementById('fb_subject');
    if (sel) sel.value = memberId;
  }, 150);
}

function openGiveKudosModal() {
  document.getElementById('modalTitle').textContent = '🏆 Award Recognition Badge';
  document.getElementById('modalSub').textContent   = 'Send a shoutout or appreciation badge to a colleague';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Award To *</label>
      <select class="form-input" id="kudosRecipient">
        <option value="">— Select Colleague —</option>
        ${allUsers.filter(u => u.id !== currentProfile?.id).map(u => `<option value="${u.id}">${u.full_name} (${roleLabel(u.role)}${u.department ? ' • ' + u.department : ''})</option>`).join('')}
      </select>
    </div>
    <div class="form-group mb16">
      <label class="form-label">Badge *</label>
      <select class="form-input" id="kudosBadge">
        <option value="team_player">🤝 Team Player</option>
        <option value="problem_solver">💡 Problem Solver</option>
        <option value="initiative_taker">🚀 Initiative Taker</option>
        <option value="top_performer">⭐ Top Performer</option>
        <option value="creative_thinker">🎨 Creative Thinker</option>
        <option value="technical_wizard">🛠️ Technical Wizard</option>
      </select>
    </div>
    <div class="form-group mb16">
      <label class="form-label">Appreciation Note (Optional)</label>
      <input class="form-input" id="kudosComment" placeholder="e.g. Great job handling the client launch smoothly!">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveKudosBadge()">Send Kudos 🏆</button>
    </div>`;
  openModal();
}

async function saveKudosBadge() {
  const recipientId = v('kudosRecipient');
  const badgeType   = v('kudosBadge');
  const comment     = v('kudosComment');

  if (!recipientId || !badgeType) return toast('Please select a colleague and badge', 'warn');

  const recipientUser = allUsers.find(u => u.id === recipientId);

  const badgeMap = {
    team_player: { title: 'Team Player', icon: '🤝' },
    problem_solver: { title: 'Problem Solver', icon: '💡' },
    initiative_taker: { title: 'Initiative Taker', icon: '🚀' },
    top_performer: { title: 'Top Performer', icon: '⭐' },
    creative_thinker: { title: 'Creative Thinker', icon: '🎨' },
    technical_wizard: { title: 'Technical Wizard', icon: '🛠️' }
  };
  const bInfo = badgeMap[badgeType];

  const newBadge = {
    id: 'b-' + Date.now(),
    badge_type: badgeType,
    icon: bInfo.icon,
    title: bInfo.title,
    awarded_to: recipientId,
    awarded_to_name: recipientUser?.full_name || 'Employee',
    awarded_by: currentProfile?.id,
    awarded_by_name: currentProfile?.full_name || 'Super Admin',
    comment: comment || 'Appreciation Shoutout',
    created_at: new Date().toISOString()
  };

  saveBadges([newBadge, ...allBadges]);

  closeModal();
  toast(`🏆 Kudos badge awarded to ${recipientUser?.full_name || 'Employee'}!`, 'success');
  pageDashboard();
}

function cardDonut(data) {
  const types  = {manager:0,peer:0,hr:0,self:0,'360':0,exit:0};
  data.forEach(r => { if (r.type in types) types[r.type]++; });
  const total  = Object.values(types).reduce((a,b)=>a+b,0);
  const colors = {manager:'#4f46e5',peer:'#059669',hr:'#d97706',self:'#e11d48','360':'#0284c7',exit:'#ca8a04'};
  const labels = {manager:'Manager',peer:'Peer',hr:'HR & Culture',self:'Self Assessment','360':'Cross Functional',exit:'Exit'};
  let arcs = '', offset = 0;
  const r = 35, circ = 2 * Math.PI * r;
  Object.entries(types).forEach(([type, count]) => {
    if (!count) return;
    const d = (count / total) * circ;
    arcs += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${colors[type]}" stroke-width="16"
      stroke-dasharray="${d} ${circ-d}" stroke-dashoffset="${-offset}" transform="rotate(-90 50 50)"/>`;
    offset += d;
  });
  const legend = Object.entries(types).filter(([,v])=>v>0).map(([t,n]) =>
    `<div style="display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:6px"><div style="width:10px;height:10px;border-radius:3px;background:${colors[t]}"></div>${labels[t]}<span style="margin-left:auto;font-weight:700">${n}</span></div>`).join('');
  return `<div class="card"><div class="card-header"><div><div class="card-title">Feedback by Type</div></div></div>
    <div class="card-body"><div style="display:flex;align-items:center;gap:20px">
      <svg width="96" height="96" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="35" fill="none" stroke="var(--border)" stroke-width="16"/>
        ${total ? arcs : ''}
      </svg>
      <div style="flex:1">${total ? legend : '<div class="empty-sub">No data yet</div>'}</div>
    </div></div></div>`;
}

function cardNPS(npsItems, promoters, detractors, nps) {
  const total = npsItems.length;
  const passives = total - promoters - detractors;
  const pPct = total ? Math.round((promoters/total)*100) : 0;
  const dPct = total ? Math.round((detractors/total)*100) : 0;
  const pasPct = total ? (100 - pPct - dPct) : 0;

  return `<div class="card"><div class="card-header"><div><div class="card-title">NPS Score</div><div class="card-sub">Employee Net Promoter</div></div></div>
    <div class="card-body">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div style="font-size:36px;font-weight:800;color:${nps===null?'var(--t3)':nps>=0?'var(--a3)':'var(--a4)'}">${nps===null?'—':(nps>0?'+':'')+nps}</div>
        <div style="font-size:12px;color:var(--t3)">based on ${total} NPS score responses</div>
      </div>
      <div style="height:12px;background:var(--border);border-radius:6px;overflow:hidden;display:flex">
        <div style="width:${dPct}%;background:var(--a4)" title="Detractors (${dPct}%)"></div>
        <div style="width:${pasPct}%;background:var(--a2)" title="Passives (${pasPct}%)"></div>
        <div style="width:${pPct}%;background:var(--a3)" title="Promoters (${pPct}%)"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--t3);margin-top:6px">
        <span>Detractors (0–6)</span><span>Passives (7–8)</span><span>Promoters (9–10)</span>
      </div>
    </div></div>`;
}

function cardBarChart(data) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const counts = new Array(6).fill(0);
  const monthLabels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(months[d.getMonth()]);
  }
  data.forEach(r => {
    if (!r.created_at) return;
    const d = new Date(r.created_at);
    const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diffMonths >= 0 && diffMonths < 6) {
      counts[5 - diffMonths]++;
    }
  });
  const max = Math.max(...counts, 1);
  const bars = counts.map((cnt, i) => {
    const h = Math.round((cnt / max) * 100);
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="width:100%;height:100px;display:flex;align-items:flex-end;background:var(--s2);border-radius:6px;overflow:hidden">
        <div style="width:100%;height:${h}%;background:linear-gradient(180deg,var(--a1),var(--a2));border-radius:6px 6px 0 0;transition:height .4s"></div>
      </div>
      <div style="font-size:10px;color:var(--t3)">${monthLabels[i]}</div>
    </div>`;
  }).join('');

  return `<div class="card"><div class="card-header"><div><div class="card-title">Monthly Submissions</div></div></div>
    <div class="card-body"><div style="display:flex;gap:10px">${bars}</div></div></div>`;
}

function cardActivity(data) {
  const cols = {manager:'#4f46e5',peer:'#059669',hr:'#d97706',self:'#e11d48','360':'#0284c7',exit:'#ca8a04'};
  const msgs = {manager:'submitted Manager feedback',peer:'completed Peer review',hr:'submitted HR feedback',self:'completed Self Review','360':'completed 360° review',exit:'submitted Exit Interview'};
  return `<div class="card"><div class="card-header"><div class="card-title">Recent Activity</div></div>
    <div class="card-body">
      ${data.length ? data.slice(0,6).map(r=>`
        <div class="act-item">
          <div class="act-dot" style="background:${cols[r.type]||'var(--a1)'}"></div>
          <div>
            <div class="act-text"><strong>${r.is_anonymous?'Anonymous':r.profiles_submitted?.full_name||'Unknown'}</strong> ${msgs[r.type]||'submitted feedback'}</div>
            <div class="act-time">${fmtDate(r.created_at)}</div>
          </div>
        </div>`).join('') :
        `<div class="empty"><div class="empty-icon">💤</div><div class="empty-sub">No activity yet</div></div>`}
    </div></div>`;
}
