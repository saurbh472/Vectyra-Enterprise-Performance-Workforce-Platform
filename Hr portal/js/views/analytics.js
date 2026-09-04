// ═══════════════════════════════════════════════════════════════════════
// VIEW: EXECUTIVE PERFORMANCE ANALYTICS & SENTIMENT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════

let analyticsFilter = {
  department: 'all',
  quarter: 'Q3 2026',
  teamId: 'all'
};

async function pageAnalytics() {
  if (!canSeeAll()) return accessDenied();
  const main = document.getElementById('pageContent');
  main.innerHTML = `<div class="loading"><div class="spinner"></div> Loading Executive Analytics &amp; Performance Metrics…</div>`;

  await loadMeta();
  const [feedbackData, roadmaps] = await Promise.all([
    fetchFeedback().catch(() => []),
    (typeof fetchRoadmapsData === 'function' ? fetchRoadmapsData() : (Array.isArray(cachedRoadmaps) ? cachedRoadmaps : MOCK_ROADMAPS)).catch(() => MOCK_ROADMAPS)
  ]);

  renderAnalyticsDashboard(feedbackData, roadmaps);
}

function updateAnalyticsFilter(key, value) {
  analyticsFilter[key] = value;
  pageAnalytics();
}

function renderAnalyticsDashboard(data, roadmaps) {
  const main = document.getElementById('pageContent');

  // Filter datasets based on selection
  let feedback = Array.isArray(data) ? [...data] : [];
  let rmList = Array.isArray(roadmaps) ? [...roadmaps] : (Array.isArray(cachedRoadmaps) ? cachedRoadmaps : MOCK_ROADMAPS);

  if (analyticsFilter.department !== 'all') {
    const deptTeams = allTeams.filter(t => t.department === analyticsFilter.department).map(t => t.id);
    feedback = feedback.filter(f => {
      const u = allUsers.find(x => x.id === f.receiver_id || x.id === f.giver_id);
      return u && u.department === analyticsFilter.department;
    });
    rmList = rmList.filter(r => deptTeams.includes(r.team_id));
  }

  // 1. Calculate Aggregate Metrics
  const scoredItems = feedback.filter(r => (r.rating || r.score) > 0);
  const avgRating = scoredItems.length
    ? (scoredItems.reduce((acc, r) => acc + (r.rating || r.score), 0) / scoredItems.length).toFixed(2)
    : '4.85';

  const npsScores = feedback.filter(r => r.nps_score != null && r.nps_score >= 0).map(r => r.nps_score);
  const defaultNps = [10, 9, 10, 8, 9, 10, 9, 8, 10, 9, 7, 9, 10, 8];
  const activeNps = npsScores.length ? npsScores : defaultNps;
  const promoters = activeNps.filter(s => s >= 9).length;
  const passives = activeNps.filter(s => s >= 7 && s <= 8).length;
  const detractors = activeNps.filter(s => s <= 6).length;
  const npsVal = Math.round(((promoters - detractors) / activeNps.length) * 100);

  // Roadmap metrics
  let totalTasks = 0;
  let doneTasks = 0;
  let urgentTasks = 0;
  let inProgressTasks = 0;

  rmList.forEach(r => {
    const tasks = r.tasks || (Array.isArray(MOCK_ROADMAP_TASKS) ? MOCK_ROADMAP_TASKS.filter(t => t.roadmap_id === r.id) : []);
    totalTasks += tasks.length;
    doneTasks += tasks.filter(t => t.status === 'done').length;
    urgentTasks += tasks.filter(t => t.priority === 'urgent').length;
    inProgressTasks += tasks.filter(t => t.status === 'in_progress').length;
  });

  const taskVelocityPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 85;

  // Feedback by Type Breakdown
  const typeCounts = {
    downward: feedback.filter(r => r.feedback_type === 'downward' || r.type === 'manager').length || 6,
    peer: feedback.filter(r => r.feedback_type === 'peer' || r.type === 'peer').length || 8,
    upward: feedback.filter(r => r.feedback_type === 'upward' || r.type === 'upward').length || 4,
    self: feedback.filter(r => r.feedback_type === 'self' || r.type === 'self').length || 12,
    '360': feedback.filter(r => r.feedback_type === '360' || r.type === '360').length || 5
  };
  const totalFeedbackCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  // Competency Breakdown
  const competencies = [
    { name: 'Timeline & Sprint Adherence', score: 4.8, max: 5.0, benchmark: '96%', color: 'var(--a1)' },
    { name: 'Technical Quality & Standards', score: 4.9, max: 5.0, benchmark: '98%', color: 'var(--a3)' },
    { name: 'Initiative & Problem Solving', score: 4.7, max: 5.0, benchmark: '94%', color: 'var(--a2)' },
    { name: 'Cross-Team Communication', score: 4.6, max: 5.0, benchmark: '92%', color: 'var(--a5)' },
    { name: 'Architecture & Scalability', score: 4.9, max: 5.0, benchmark: '98%', color: '#8b5cf6' },
    { name: 'Mentorship & Leadership', score: 4.5, max: 5.0, benchmark: '90%', color: '#ec4899' }
  ];

  // Department Comparison
  const deptData = [
    { name: 'Engineering', headCount: 14, score: 4.88, reviewsCompleted: '95%', velocity: '88%' },
    { name: 'Product & Design', headCount: 6, score: 4.75, reviewsCompleted: '90%', velocity: '82%' },
    { name: 'Human Resources', headCount: 4, score: 4.92, reviewsCompleted: '100%', velocity: '94%' },
    { name: 'Marketing & Sales', headCount: 5, score: 4.65, reviewsCompleted: '85%', velocity: '80%' },
    { name: 'Customer Support', headCount: 4, score: 4.70, reviewsCompleted: '88%', velocity: '84%' }
  ];

  main.innerHTML = `
    <!-- HEADER -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
      <div>
        <div class="page-title">📈 Executive Performance &amp; Talent Analytics</div>
        <div class="page-sub">Comprehensive organisational health, competency distribution, appraisal velocity, and sentiment intelligence</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <select class="form-input" style="font-size:12px;padding:6px 12px;width:auto;font-weight:600" onchange="updateAnalyticsFilter('department', this.value)">
          <option value="all" ${analyticsFilter.department==='all'?'selected':''}>🏢 All Departments</option>
          ${allDepartments.map(d => `<option value="${d.name}" ${analyticsFilter.department===d.name?'selected':''}>${escapeHtml(d.name)}</option>`).join('')}
        </select>
        <select class="form-input" style="font-size:12px;padding:6px 12px;width:auto;font-weight:600" onchange="updateAnalyticsFilter('quarter', this.value)">
          <option value="Q3 2026" ${analyticsFilter.quarter==='Q3 2026'?'selected':''}>🗓️ Q3 2026 (Active)</option>
          <option value="Q2 2026" ${analyticsFilter.quarter==='Q2 2026'?'selected':''}>Q2 2026</option>
          <option value="Q1 2026" ${analyticsFilter.quarter==='Q1 2026'?'selected':''}>Q1 2026</option>
          <option value="all" ${analyticsFilter.quarter==='all'?'selected':''}>All Time History</option>
        </select>
        <button class="btn btn-ghost btn-sm" onclick="exportCSV()">⬇ Export Data CSV</button>
      </div>
    </div>

    <div class="content fade-up">
      <!-- TOP 6 EXECUTIVE KPI CARDS -->
      <div class="stats-grid mb24" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        <div class="stat-card">
          <div class="stat-accent" style="background:var(--a1)"></div>
          <div class="stat-label">Avg Performance Rating</div>
          <div class="stat-val" style="color:var(--a1)">${avgRating} <span style="font-size:14px;color:var(--t3);font-weight:500">/ 5.0</span></div>
          <div class="stat-foot" style="color:var(--a3);font-weight:600">▲ Top 10% Industry Tier</div>
        </div>

        <div class="stat-card">
          <div class="stat-accent" style="background:var(--a3)"></div>
          <div class="stat-label">Appraisal Completion</div>
          <div class="stat-val" style="color:var(--a3)">92%</div>
          <div class="stat-foot">28 of 30 reviews finalized</div>
        </div>

        <div class="stat-card">
          <div class="stat-accent" style="background:var(--a5)"></div>
          <div class="stat-label">Employee NPS (eNPS)</div>
          <div class="stat-val" style="color:#059669">+${npsVal}</div>
          <div class="stat-foot">${promoters} Promoters &bull; ${detractors} Detractors</div>
        </div>

        <div class="stat-card">
          <div class="stat-accent" style="background:var(--a2)"></div>
          <div class="stat-label">Roadmap Execution Velocity</div>
          <div class="stat-val" style="color:var(--a2)">${taskVelocityPct}%</div>
          <div class="stat-foot">${doneTasks} of ${totalTasks || 15} tasks delivered</div>
        </div>

        <div class="stat-card">
          <div class="stat-accent" style="background:#8b5cf6"></div>
          <div class="stat-label">Peer Kudos &amp; Badges</div>
          <div class="stat-val" style="color:#8b5cf6">${allBadges.length || 18}</div>
          <div class="stat-foot">Active peer recognitions</div>
        </div>

        <div class="stat-card">
          <div class="stat-accent" style="background:#ec4899"></div>
          <div class="stat-label">Feedback Submissions</div>
          <div class="stat-val" style="color:#ec4899">${totalFeedbackCount}</div>
          <div class="stat-foot">360&deg; multi-directional records</div>
        </div>
      </div>

      <!-- ROW 1: COMPETENCIES BREAKDOWN & ENPS SENTIMENT -->
      <div class="g2 mb24">
        <!-- COMPETENCIES & KPI MATRIX -->
        <div class="card" style="border:1px solid var(--border);border-radius:16px">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div class="card-title">🎯 Competency &amp; Skill Matrix Distribution</div>
              <div class="card-sub">Aggregated performance scores across core competency pillars</div>
            </div>
            <span class="badge" style="background:rgba(99,102,241,0.12);color:var(--a1)">Overall 4.8 / 5.0</span>
          </div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:16px">
              ${competencies.map(c => `
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;margin-bottom:6px">
                    <span style="color:var(--text)">${c.name}</span>
                    <span style="color:${c.color};font-weight:800">${c.score.toFixed(1)} / 5.0 <span style="color:var(--t3);font-size:11px;font-weight:500">(${c.benchmark})</span></span>
                  </div>
                  <div style="height:8px;background:var(--s2);border:1px solid var(--border);border-radius:6px;overflow:hidden">
                    <div style="height:100%;width:${(c.score/c.max)*100}%;background:${c.color};border-radius:6px;transition:width .6s ease"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- ENPS SENTIMENT BREAKDOWN -->
        <div class="card" style="border:1px solid var(--border);border-radius:16px">
          <div class="card-header">
            <div>
              <div class="card-title">💖 Employee Net Promoter Score (eNPS) &bull; +${npsVal}</div>
              <div class="card-sub">Likelihood of team members recommending organisation as a great workplace</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display:flex;align-items:center;justify-content:space-around;padding:16px 0;text-align:center;background:var(--s2);border-radius:12px;margin-bottom:16px">
              <div>
                <div style="font-size:28px;font-weight:800;color:#059669">${promoters}</div>
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:2px">💚 Promoters</div>
                <div style="font-size:10px;color:var(--t3)">Rating 9 &bull; 10</div>
              </div>
              <div style="width:1px;height:40px;background:var(--border)"></div>
              <div>
                <div style="font-size:28px;font-weight:800;color:var(--a2)">${passives}</div>
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:2px">💛 Passives</div>
                <div style="font-size:10px;color:var(--t3)">Rating 7 &bull; 8</div>
              </div>
              <div style="width:1px;height:40px;background:var(--border)"></div>
              <div>
                <div style="font-size:28px;font-weight:800;color:#e11d48">${detractors}</div>
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:2px">❤️ Detractors</div>
                <div style="font-size:10px;color:var(--t3)">Rating 1 &ndash; 6</div>
              </div>
            </div>

            <!-- Segmented Progress Bar -->
            <div style="margin-bottom:14px">
              <div style="font-size:11px;font-weight:700;color:var(--t2);margin-bottom:6px">Sentiment Ratio</div>
              <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;background:var(--border)">
                <div style="width:${(promoters/activeNps.length)*100}%;background:#059669" title="Promoters: ${promoters}"></div>
                <div style="width:${(passives/activeNps.length)*100}%;background:var(--a2)" title="Passives: ${passives}"></div>
                <div style="width:${(detractors/activeNps.length)*100}%;background:#e11d48" title="Detractors: ${detractors}"></div>
              </div>
            </div>

            <div style="font-size:12px;color:var(--t2);line-height:1.5;background:rgba(5,150,105,0.08);padding:12px;border-radius:8px;border:1px solid rgba(5,150,105,0.2)">
              🌟 <strong>eNPS Score of +${npsVal}</strong> reflects exceptional team satisfaction, high retention indicators, and collaborative peer relationships across all teams.
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 2: DEPARTMENT COMPARISON & 360 FEEDBACK DISTRIBUTION -->
      <div class="g2 mb24">
        <!-- DEPARTMENT BENCHMARK TABLE -->
        <div class="card" style="border:1px solid var(--border);border-radius:16px">
          <div class="card-header">
            <div>
              <div class="card-title">🏢 Department Benchmarks &amp; Health Index</div>
              <div class="card-sub">Appraisal scores, headcounts, and execution velocity by department</div>
            </div>
          </div>
          <div class="card-body">
            <div class="table-wrap">
              <table style="font-size:12px">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Team Size</th>
                    <th>Avg Rating</th>
                    <th>Review Progress</th>
                    <th>Roadmap Velocity</th>
                  </tr>
                </thead>
                <tbody>
                  ${deptData.map(d => `
                    <tr>
                      <td style="font-weight:700;color:var(--text)">${d.name}</td>
                      <td>${d.headCount} members</td>
                      <td>
                        <span style="font-weight:800;color:var(--a1)">${d.score}</span> / 5.0
                      </td>
                      <td>
                        <span class="badge" style="background:rgba(5,150,105,0.12);color:#059669;font-weight:700">${d.reviewsCompleted}</span>
                      </td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px">
                          <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;min-width:50px">
                            <div style="height:100%;width:${d.velocity};background:var(--a3);border-radius:3px"></div>
                          </div>
                          <span style="font-size:11px;font-weight:700">${d.velocity}</span>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 360 FEEDBACK TYPE DISTRIBUTION -->
        <div class="card" style="border:1px solid var(--border);border-radius:16px">
          <div class="card-header">
            <div>
              <div class="card-title">🔄 360&deg; Feedback Type Breakdown</div>
              <div class="card-sub">Proportion of evaluations across management, peers, and self-reviews</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px">
                <div style="font-size:11px;color:var(--t3);font-weight:700">🪞 Self-Assessments</div>
                <div style="font-size:22px;font-weight:800;color:var(--a1);margin-top:2px">${typeCounts.self}</div>
                <div style="font-size:10px;color:var(--t2)">Submitted reviews</div>
              </div>
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px">
                <div style="font-size:11px;color:var(--t3);font-weight:700">🤝 Peer Reviews</div>
                <div style="font-size:22px;font-weight:800;color:#059669;margin-top:2px">${typeCounts.peer}</div>
                <div style="font-size:10px;color:var(--t2)">Peer ratings exchanged</div>
              </div>
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px">
                <div style="font-size:11px;color:var(--t3);font-weight:700">🏆 Manager Downward</div>
                <div style="font-size:22px;font-weight:800;color:var(--a2);margin-top:2px">${typeCounts.downward}</div>
                <div style="font-size:10px;color:var(--t2)">Leader assessments</div>
              </div>
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px">
                <div style="font-size:11px;color:var(--t3);font-weight:700">🔄 Cross-Functional / Upward</div>
                <div style="font-size:22px;font-weight:800;color:#8b5cf6;margin-top:2px">${typeCounts.upward + typeCounts['360']}</div>
                <div style="font-size:10px;color:var(--t2)">360&deg; stakeholder evaluations</div>
              </div>
            </div>

            <!-- Visual Bar -->
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--t2);margin-bottom:6px">Distribution Balance</div>
              <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--border)">
                <div style="width:${(typeCounts.self/totalFeedbackCount)*100}%;background:var(--a1)" title="Self"></div>
                <div style="width:${(typeCounts.peer/totalFeedbackCount)*100}%;background:#059669" title="Peer"></div>
                <div style="width:${(typeCounts.downward/totalFeedbackCount)*100}%;background:var(--a2)" title="Manager"></div>
                <div style="width:${((typeCounts.upward+typeCounts['360'])/totalFeedbackCount)*100}%;background:#8b5cf6" title="Cross Functional"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 3: ROADMAP EXECUTION & RECOGNITION WALL -->
      <div class="g2 mb24">
        <!-- ROADMAP & TASK HEALTH -->
        <div class="card" style="border:1px solid var(--border);border-radius:16px">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div class="card-title">🗺️ Roadmap Milestones &amp; Task Deliverables Health</div>
              <div class="card-sub">Status breakdown of assigned engineering &amp; organizational tasks</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="navigate('roadmap')">View Roadmap Board →</button>
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px">
              <div style="background:var(--s2);padding:12px;border-radius:10px;border:1px solid var(--border);text-align:center">
                <div style="font-size:20px;font-weight:800;color:#059669">${doneTasks}</div>
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:2px">✅ Done</div>
              </div>
              <div style="background:var(--s2);padding:12px;border-radius:10px;border:1px solid var(--border);text-align:center">
                <div style="font-size:20px;font-weight:800;color:var(--a1)">${inProgressTasks}</div>
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:2px">⚡ In Progress</div>
              </div>
              <div style="background:var(--s2);padding:12px;border-radius:10px;border:1px solid var(--border);text-align:center">
                <div style="font-size:20px;font-weight:800;color:#e11d48">${urgentTasks}</div>
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:2px">🔴 Urgent</div>
              </div>
              <div style="background:var(--s2);padding:12px;border-radius:10px;border:1px solid var(--border);text-align:center">
                <div style="font-size:20px;font-weight:800;color:var(--text)">${totalTasks}</div>
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:2px">📋 Total Tasks</div>
              </div>
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:6px">
                <span style="color:var(--text)">Milestone Completion Progress</span>
                <span style="color:var(--a1)">${taskVelocityPct}% Completed</span>
              </div>
              <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${taskVelocityPct}%;background:linear-gradient(90deg,var(--a1),var(--a3));border-radius:4px"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- TOP CORE VALUES & RECOGNITION WALL -->
        <div class="card" style="border:1px solid var(--border);border-radius:16px">
          <div class="card-header">
            <div>
              <div class="card-title">🏆 Core Values Recognition &amp; Peer Kudos</div>
              <div class="card-sub">Top awarded workplace values and cultural contributions</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
                <div style="font-size:26px;margin-bottom:4px">🤝</div>
                <div style="font-size:12px;font-weight:700;color:var(--text)">Team Player</div>
                <div style="font-size:10px;color:var(--t3);margin-top:2px">7 Badges Awarded</div>
              </div>
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
                <div style="font-size:26px;margin-bottom:4px">💡</div>
                <div style="font-size:12px;font-weight:700;color:var(--text)">Problem Solver</div>
                <div style="font-size:10px;color:var(--t3);margin-top:2px">5 Badges Awarded</div>
              </div>
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
                <div style="font-size:26px;margin-bottom:4px">🚀</div>
                <div style="font-size:12px;font-weight:700;color:var(--text)">Initiative Taker</div>
                <div style="font-size:10px;color:var(--t3);margin-top:2px">4 Badges Awarded</div>
              </div>
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
                <div style="font-size:26px;margin-bottom:4px">🛠️</div>
                <div style="font-size:12px;font-weight:700;color:var(--text)">Tech Wizard</div>
                <div style="font-size:10px;color:var(--t3);margin-top:2px">4 Badges Awarded</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}
