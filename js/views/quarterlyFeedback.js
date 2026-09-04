// ═══════════════════════════════════════════════════════════════════════
// PREMIUM QUARTERLY FEEDBACK & PERFORMANCE PORTAL MODULE
// Self Review Sheet + KPI Self-Assessment + Dynamic Scope Skill Matrix
// ═══════════════════════════════════════════════════════════════════════

let qrCurrentTab = 'form'; // 'form' | 'archive' | 'teamReviews' | 'templateBuilder'
let qrActiveStep = 1; // 1: Self Review | 2: KPI Assessment | 3: Skill Matrix
let qrSelectedQuarter = 'Q2 (April - July)';
let qrSelectedYear = 2026;
let qrSelectedTeamId = 't2'; // Defaults to Backend Platform / SDN Controller Team
let qrSkillCategoryFilter = 'ALL';
let qrSkillScopeFilter = 'ALL';
let qrSkillSearchQuery = '';

// Preset recommended scopes by team department/domain
const TEAM_PRESET_SCOPES = {
  't1': ['Frontend', 'UI Components', 'State Management', 'Performance & Web Vitals', 'Testing'],
  't2': ['Backend', 'Frontend', 'DevOps', 'Networking', 'Database', 'Cloud & K8s', 'Core Platform', 'Security'],
  't3': ['UI Design', 'UX Research', 'Design Systems', 'Product Strategy', 'Prototyping', 'Product Analytics'],
  't4': ['Recruitment', 'HR Operations', 'Payroll & Compliance', 'Employee Relations', 'Culture & Engagement'],
  't5': ['SEO', 'Content Writing', 'Paid Media', 'Growth Marketing', 'Social Media', 'B2B Lead Gen', 'Branding']
};

// Loaded state for current form session
let qrSelfReviewState = {
  months: [
    { month: 'April, 2026', targets: ['Master Core Platform architecture', 'Contribute to cloud security & licensing implementation'], contributions: ['Integrated ELK & Observability Stack', 'Implemented RBAC enhancements'], topContribution: { targetResult: 'Target: Improve observability\nResult: 100% ELK logs integrated', goodPractice: 'Modular service separation', lessonLearnt: 'Deep understanding of distributed platform flow' } },
    { month: 'May, 2026', targets: ['Improve RBAC maintainability', 'REST API Gateway integration'], contributions: ['Refactored RBAC code', 'Integrated Core Microservice APIs'], topContribution: { targetResult: 'Target: RBAC refactor\nResult: 40% latency reduction', goodPractice: 'Pair programming with backend team', lessonLearnt: 'Keycloak token caching' } },
    { month: 'June, 2026', targets: ['PostgreSQL & Caching research', 'Audit log implementation'], contributions: ['Verified RBAC statistics', 'Resolved licensing database deletion issue'], topContribution: { targetResult: 'Target: Database optimization\nResult: Query indexing verified', goodPractice: 'Automated test suites', lessonLearnt: 'Partition management in PostgreSQL' } },
    { month: 'July, 2026', targets: ['Database scalability improvements', 'Enhance security'], contributions: ['Designed system architecture', 'Fixed critical licensing workflow issues'], topContribution: { targetResult: 'Target: Scaling architecture\nResult: Multi-site support finalized', goodPractice: 'End-to-end integration tests', lessonLearnt: 'High availability clustering' } }
  ],
  goalsForNextQuarter: '• Complete and stabilize Kubernetes cloud deployment of core platform microservices.\n• Improve observability with Prometheus & Grafana.\n• Expand database indexing for multi-tenant scalability.',
  areasOfImprovement: '• Deepen cloud-native architecture & Kubernetes orchestration knowledge.\n• Strengthen automated test coverage for newly developed platform microservices.',
  suggestions: '• Regular knowledge-sharing sessions on distributed cloud architecture would be beneficial for the backend engineering team.\n• Structured architectural design reviews before major feature sprints.',
  managerFeedback: ''
};

let qrKpiState = [
  { id: 'kpi1', name: 'Timeline Adherence', description: '• Completing assigned tasks on time\n• Prioritizing work effectively\n• Managing workload efficiently\n• Avoiding unnecessary delays', selfRating: 5, example: 'Delivered all sprint deliverables on or before deadlines with zero blockers.', challenges: 'Initial delays on TimescaleDB PoC were resolved with team syncs.', managerRating: 0, managerComments: '' },
  { id: 'kpi2', name: 'Initiative Taking', description: '• Taking ownership\n• Solving problems independently\n• Suggesting improvements\n• Volunteering for responsibilities', selfRating: 5, example: 'Spearheaded the ELK stack logging and RBAC token caching redesign.', challenges: 'None', managerRating: 0, managerComments: '' },
  { id: 'kpi3', name: 'Quality of Work', description: '• Delivering accurate work\n• Following standards\n• Reducing errors\n• Attention to detail', selfRating: 5, example: 'Maintained zero regression defects on the licensing workflow release.', challenges: 'Edge cases in multi-tenant session cleanup addressed.', managerRating: 0, managerComments: '' },
  { id: 'kpi4', name: 'Communication & Collaboration', description: '• Clear communication\n• Knowledge sharing\n• Team collaboration\n• Positive participation', selfRating: 5, example: 'Conducted walkthrough sessions with frontend & QA teams for Core Microservice APIs.', challenges: 'None', managerRating: 0, managerComments: '' },
  { id: 'kpi5', name: 'Domain Knowledge', description: '• Code understanding\n• Technical knowledge\n• Business knowledge\n• Continuous learning', selfRating: 5, example: 'Extensive research into distributed cloud architecture and microservices security.', challenges: 'Keeping pace with evolving cloud security and API standards.', managerRating: 0, managerComments: '' },
  { id: 'kpi6', name: 'Leadership Qualities', description: '• Ownership\n• Decision making\n• Mentoring\n• Positive influence', selfRating: 4.5, example: 'Mentored junior developers on Spring Boot and Docker best practices.', challenges: 'Expanding mentorship to cross-functional teams.', managerRating: 0, managerComments: '' }
];

let qrSkillMatrixState = [];
let qrLoadedReviewId = null;

function getScopeClass(scopeText) {
  if (!scopeText) return 'scope-default';
  const s = scopeText.toLowerCase();
  if (s.includes('backend')) return 'scope-backend';
  if (s.includes('frontend')) return 'scope-frontend';
  if (s.includes('devops') || s.includes('cloud')) return 'scope-devops';
  if (s.includes('seo') || s.includes('growth')) return 'scope-seo';
  if (s.includes('content') || s.includes('brand')) return 'scope-content';
  if (s.includes('design') || s.includes('ui') || s.includes('ux')) return 'scope-design';
  if (s.includes('talent') || s.includes('payroll') || s.includes('recruitment') || s.includes('hr')) return 'scope-hr';
  if (s.includes('qa') || s.includes('test')) return 'scope-qa';
  if (s.includes('ai') || s.includes('llm')) return 'scope-ai';
  return 'scope-default';
}

async function pageQuarterlyFeedback() {
  const container = document.getElementById('pageContent');
  if (!container) return;

  if (currentProfile?.team_id) {
    qrSelectedTeamId = currentProfile.team_id;
  }

  const isSuperAdmin = currentProfile?.role === 'super_admin';
  const isMgr = isManager() || canSeeAll();

  container.innerHTML = `
    <!-- HEADER HERO SECTION -->
    <div style="background:linear-gradient(135deg,rgba(79,70,229,.07),rgba(6,182,212,.04));border:1px solid var(--border);border-radius:18px;padding:24px 28px;margin-bottom:24px;box-shadow:var(--card-shadow);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px">
      <div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
          <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--a1),var(--a5));display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;box-shadow:0 4px 14px rgba(79,70,229,.35)">🗓️</div>
          <div>
            <h1 class="page-title" style="font-size:24px;margin:0">Quarterly Feedback &amp; Performance Portal</h1>
            <p class="page-sub" style="margin:2px 0 0 0">Unified Self-Review Sheet, KPI Assessment &amp; Team-Specific Skill Matrix</p>
          </div>
        </div>
      </div>

      <!-- QUARTER & YEAR SELECTOR DROPDOWNS -->
      <div style="display:flex;gap:12px;align-items:center;background:var(--s1);padding:10px 16px;border-radius:14px;border:1px solid var(--border);box-shadow:var(--card-shadow)">
        <div>
          <label style="font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--t3);display:block;margin-bottom:3px">Assessment Quarter</label>
          <select id="qrQuarterSel" class="form-input" style="padding:6px 12px;font-size:12px;font-weight:600;height:auto;border-radius:8px" onchange="onQrQuarterChange(this.value)">
            <option value="Q2 (April - July)" ${qrSelectedQuarter==='Q2 (April - July)'?'selected':''}>Q2 (April - July)</option>
            <option value="Q1 (Jan - March)" ${qrSelectedQuarter==='Q1 (Jan - March)'?'selected':''}>Q1 (Jan - March)</option>
            <option value="Q3 (July - Sept)" ${qrSelectedQuarter==='Q3 (July - Sept)'?'selected':''}>Q3 (July - Sept)</option>
            <option value="Q4 (Oct - Dec)" ${qrSelectedQuarter==='Q4 (Oct - Dec)'?'selected':''}>Q4 (Oct - Dec)</option>
          </select>
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--t3);display:block;margin-bottom:3px">Year</label>
          <select id="qrYearSel" class="form-input" style="padding:6px 12px;font-size:12px;font-weight:600;height:auto;border-radius:8px" onchange="onQrYearChange(this.value)">
            <option value="2026" ${qrSelectedYear===2026?'selected':''}>2026</option>
            <option value="2025" ${qrSelectedYear===2025?'selected':''}>2025</option>
          </select>
        </div>
      </div>
    </div>

    <!-- MODULE NAVIGATION TABS -->
    <div class="qr-tab-nav">
      <button class="qr-tab-btn ${qrCurrentTab==='form'?'active':''}" onclick="switchQrTab('form')">
        ✏️ Active Feedback Form
      </button>
      <button class="qr-tab-btn ${qrCurrentTab==='archive'?'active':''}" onclick="switchQrTab('archive')">
        🗂️ Historical Submissions Archive
      </button>
      ${isMgr ? `
        <button class="qr-tab-btn ${qrCurrentTab==='teamReviews'?'active':''}" onclick="switchQrTab('teamReviews')">
          👥 Team Member Reviews
        </button>
      ` : ''}
      ${isSuperAdmin ? `
        <button class="qr-tab-btn ${qrCurrentTab==='templateBuilder'?'active':''}" onclick="switchQrTab('templateBuilder')">
          ⚙️ Master Template Customizer <span class="badge-pill" style="background:rgba(217,119,6,.15);color:var(--super)">👑 SuperAdmin</span>
        </button>
      ` : ''}
    </div>

    <!-- CONTENT BODY AREA -->
    <div id="qrContentArea"></div>
  `;

  await loadQuarterlyFeedbackData();
  renderQrActiveTab();
}

function onQrQuarterChange(q) {
  qrSelectedQuarter = q;
  updateQuarterMonths();
  loadQuarterlyFeedbackData().then(() => renderQrActiveTab());
}

function onQrYearChange(y) {
  qrSelectedYear = parseInt(y, 10);
  updateQuarterMonths();
  loadQuarterlyFeedbackData().then(() => renderQrActiveTab());
}

function updateQuarterMonths() {
  if (qrSelectedQuarter.includes('April')) {
    qrSelfReviewState.months = [
      { month: `April, ${qrSelectedYear}`, targets: ['Master Core Platform architecture', 'Licensing implementation'], contributions: ['Integrated ELK Stack', 'RBAC enhancements'], topContribution: { targetResult: 'Observability enhanced', goodPractice: 'Modular code', lessonLearnt: 'Distributed architecture' } },
      { month: `May, ${qrSelectedYear}`, targets: ['RBAC maintainability', 'REST API Gateway integration'], contributions: ['Refactored RBAC code', 'Integrated APIs'], topContribution: { targetResult: 'Latency reduced', goodPractice: 'Pair review', lessonLearnt: 'Keycloak tokens' } },
      { month: `June, ${qrSelectedYear}`, targets: ['Database optimization', 'Audit log implementation'], contributions: ['Verified statistics', 'Resolved license deletion bug'], topContribution: { targetResult: 'Indexing verified', goodPractice: 'Unit test suites', lessonLearnt: 'Partition policies' } },
      { month: `July, ${qrSelectedYear}`, targets: ['Database scalability', 'Enhance security'], contributions: ['Designed architecture', 'Fixed licensing issues'], topContribution: { targetResult: 'Multi-site support', goodPractice: 'E2E testing', lessonLearnt: 'Clustering' } }
    ];
  } else if (qrSelectedQuarter.includes('Jan')) {
    qrSelfReviewState.months = [
      { month: `January, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } },
      { month: `February, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } },
      { month: `March, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } }
    ];
  } else if (qrSelectedQuarter.includes('July') && qrSelectedQuarter.includes('Sept')) {
    qrSelfReviewState.months = [
      { month: `July, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } },
      { month: `August, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } },
      { month: `September, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } }
    ];
  } else {
    qrSelfReviewState.months = [
      { month: `October, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } },
      { month: `November, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } },
      { month: `December, ${qrSelectedYear}`, targets: ['', ''], contributions: ['', ''], topContribution: { targetResult: '', goodPractice: '', lessonLearnt: '' } }
    ];
  }
}

async function loadQuarterlyFeedbackData() {
  try {
    const templates = await API.getSkillTemplates(qrSelectedTeamId);
    
    const reviews = await API.getQuarterlyReviews({
      employee_id: currentProfile.id,
      quarter: qrSelectedQuarter,
      year: qrSelectedYear
    });

    if (reviews && reviews.length > 0) {
      const rev = reviews[0];
      qrLoadedReviewId = rev.id;
      qrSelfReviewState = typeof rev.self_review_data === 'string' ? JSON.parse(rev.self_review_data) : rev.self_review_data;
      qrKpiState = typeof rev.kpi_data === 'string' ? JSON.parse(rev.kpi_data) : rev.kpi_data;
      qrSkillMatrixState = typeof rev.skill_matrix_data === 'string' ? JSON.parse(rev.skill_matrix_data) : rev.skill_matrix_data;
    } else {
      qrLoadedReviewId = null;
      qrSkillMatrixState = templates.map(t => ({
        id: t.id,
        category: t.category,
        skill: t.skill_name,
        scope: t.scope || (t.is_backend && t.is_frontend ? 'Backend, Frontend' : t.is_backend ? 'Backend' : t.is_frontend ? 'Frontend' : 'General'),
        selfRating: 4,
        comments: '',
        trainingRequired: 'NO',
        managerRating: 0,
        managerComments: ''
      }));
    }
  } catch (err) {
    console.warn('Error loading quarterly feedback data:', err);
  }
}

function switchQrTab(tab) {
  qrCurrentTab = tab;
  pageQuarterlyFeedback();
}

function renderQrActiveTab() {
  const area = document.getElementById('qrContentArea');
  if (!area) return;

  if (qrCurrentTab === 'form') {
    renderQrFormView(area);
  } else if (qrCurrentTab === 'archive') {
    renderQrArchiveView(area);
  } else if (qrCurrentTab === 'teamReviews') {
    renderQrTeamReviewsView(area);
  } else if (qrCurrentTab === 'templateBuilder') {
    renderQrTemplateBuilderView(area);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// FORM VIEW (3-STEP EXECUTIVE WIZARD)
// ═══════════════════════════════════════════════════════════════════════
function renderQrFormView(container) {
  const userTeam = allTeams.find(t => t.id === qrSelectedTeamId)?.name || 'Backend & Platform Engineering';

  container.innerHTML = `
    <!-- WIZARD STEP HEADER -->
    <div class="qr-wizard-card">
      <div>
        <div style="font-weight:700;font-size:15px;color:var(--text);display:flex;align-items:center;gap:8px">
          <span>👤 ${currentProfile.full_name}</span>
          <span class="badge badge-manager-role" style="font-size:11px">${userTeam}</span>
        </div>
        <div style="font-size:12px;color:var(--t3);margin-top:4px">
          Review Cycle: <strong>${qrSelectedQuarter} ${qrSelectedYear}</strong> • Status: ${qrLoadedReviewId ? '<span style="color:var(--a3);font-weight:700">✓ Submitted &amp; Saved</span>' : '<span style="color:var(--a2);font-weight:700">Draft in Progress</span>'}
        </div>
      </div>

      <!-- STEP NAVIGATION BUTTONS -->
      <div class="qr-step-nav">
        <button onclick="switchQrStep(1)" class="qr-step-btn ${qrActiveStep===1?'active':''}">
          <span class="qr-step-num">1</span> 1. Self Review Sheet
        </button>
        <button onclick="switchQrStep(2)" class="qr-step-btn ${qrActiveStep===2?'active':''}">
          <span class="qr-step-num">2</span> 2. KPI Self-Assessment
        </button>
        <button onclick="switchQrStep(3)" class="qr-step-btn ${qrActiveStep===3?'active':''}">
          <span class="qr-step-num">3</span> 3. Skill Matrix (${qrSkillMatrixState.length})
        </button>
      </div>
    </div>

    <!-- CURRENT STEP BODY -->
    <div id="qrStepBody"></div>

    <!-- FLOATING BOTTOM ACTION BAR -->
    <div class="qr-sticky-bar">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:10px;height:10px;border-radius:50%;background:${qrLoadedReviewId?'var(--a3)':'var(--a2)'}"></div>
        <div style="font-size:13px;font-weight:600;color:var(--text)">
          ${qrLoadedReviewId ? 'Quarterly Submission Synced with Database' : 'Unsaved changes in draft'}
        </div>
      </div>
      <div style="display:flex;gap:12px">
        <button class="btn btn-ghost" onclick="saveQrForm(true)">💾 Save Draft</button>
        <button class="btn btn-primary" onclick="saveQrForm(false)" style="background:linear-gradient(135deg,var(--a1),#4338ca);box-shadow:0 4px 14px rgba(79,70,229,.35)">
          🚀 Submit Quarterly Review
        </button>
      </div>
    </div>
  `;

  renderCurrentQrStep();
}

function switchQrStep(step) {
  qrActiveStep = step;
  renderQrFormView(document.getElementById('qrContentArea'));
}

function renderCurrentQrStep() {
  const stepBody = document.getElementById('qrStepBody');
  if (!stepBody) return;

  if (qrActiveStep === 1) {
    renderSelfReviewStep(stepBody);
  } else if (qrActiveStep === 2) {
    renderKpiStep(stepBody);
  } else if (qrActiveStep === 3) {
    renderSkillMatrixStep(stepBody);
  }
}

// -----------------------------------------------------------------------
// STEP 1: SELF REVIEW SHEET (MONTHLY TARGETS & CONTRIBUTIONS)
// -----------------------------------------------------------------------
function renderSelfReviewStep(container) {
  const mList = qrSelfReviewState.months;

  container.innerHTML = `
    <!-- MONTHLY SPREADSHEET CARD GRID -->
    <div class="qr-month-grid">
      ${mList.map((m, mIdx) => `
        <div class="qr-month-col">
          <div class="qr-month-header">
            <div class="qr-month-title">📅 ${m.month}</div>
            <span class="badge badge-manager-role" style="font-size:10px">Month ${mIdx+1}</span>
          </div>

          <!-- TARGETS SECTION -->
          <div>
            <div class="qr-section-tag" style="color:var(--a1)">🎯 Planned Targets</div>
            <div id="targetList_${mIdx}">
              ${m.targets.map((tVal, tIdx) => `
                <div class="qr-chip-row">
                  <input type="text" class="qr-chip-input" placeholder="Target objective..."
                    value="${escapeHtml(tVal)}"
                    onchange="qrSelfReviewState.months[${mIdx}].targets[${tIdx}]=this.value">
                  <button type="button" class="qr-del-btn" onclick="removeSelfReviewTarget(${mIdx}, ${tIdx})" title="Remove">✕</button>
                </div>
              `).join('')}
            </div>
            <button type="button" class="qr-add-btn" onclick="addSelfReviewTargetLine(${mIdx})">+ Add Target</button>
          </div>

          <!-- CONTRIBUTIONS SECTION -->
          <div>
            <div class="qr-section-tag" style="color:var(--a3)">⚡ Work Contribution</div>
            <div id="contribList_${mIdx}">
              ${m.contributions.map((cVal, cIdx) => `
                <div class="qr-chip-row">
                  <input type="text" class="qr-chip-input" placeholder="Delivered work..."
                    value="${escapeHtml(cVal)}"
                    onchange="qrSelfReviewState.months[${mIdx}].contributions[${cIdx}]=this.value">
                  <button type="button" class="qr-del-btn" onclick="removeSelfReviewContrib(${mIdx}, ${cIdx})" title="Remove">✕</button>
                </div>
              `).join('')}
            </div>
            <button type="button" class="qr-add-btn" onclick="addSelfReviewContribLine(${mIdx})">+ Add Contribution</button>
          </div>

          <!-- TOP CONTRIBUTION BREAKDOWN -->
          <div style="background:var(--s2);padding:12px;border-radius:10px;border:1px solid var(--border)">
            <div class="qr-section-tag" style="color:var(--super)">🏆 Top Contribution</div>
            
            <label class="form-label" style="font-size:10px;margin-bottom:3px">Target vs Result</label>
            <textarea class="form-input mb8" style="font-size:11px;height:45px;padding:6px"
              placeholder="Target: ... \nResult: ..."
              onchange="qrSelfReviewState.months[${mIdx}].topContribution.targetResult=this.value">${escapeHtml(m.topContribution?.targetResult || '')}</textarea>

            <label class="form-label" style="font-size:10px;margin-bottom:3px">Good Practice</label>
            <input type="text" class="form-input mb8" style="font-size:11px;padding:6px"
              placeholder="Good practice followed..."
              value="${escapeHtml(m.topContribution?.goodPractice || '')}"
              onchange="qrSelfReviewState.months[${mIdx}].topContribution.goodPractice=this.value">

            <label class="form-label" style="font-size:10px;margin-bottom:3px">Lesson Learnt</label>
            <input type="text" class="form-input" style="font-size:11px;padding:6px"
              placeholder="Key lesson learnt..."
              value="${escapeHtml(m.topContribution?.lessonLearnt || '')}"
              onchange="qrSelfReviewState.months[${mIdx}].topContribution.lessonLearnt=this.value">
          </div>
        </div>
      `).join('')}
    </div>

    <!-- STRATEGIC SUMMARY PANELS -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;margin-bottom:24px">
      <div class="card" style="border-top:4px solid var(--a1)">
        <div class="card-header">
          <div class="card-title">🎯 Goals for Next Quarter</div>
        </div>
        <div class="card-body">
          <textarea class="form-input" style="height:120px;font-size:12px;line-height:1.6"
            placeholder="Outline planned technical objectives and goals for the upcoming quarter..."
            onchange="qrSelfReviewState.goalsForNextQuarter=this.value">${escapeHtml(qrSelfReviewState.goalsForNextQuarter || '')}</textarea>
        </div>
      </div>

      <div class="card" style="border-top:4px solid var(--a2)">
        <div class="card-header">
          <div class="card-title">📈 Areas of Improvement</div>
        </div>
        <div class="card-body">
          <textarea class="form-input" style="height:120px;font-size:12px;line-height:1.6"
            placeholder="Identify technical skills, estimation, or domain areas to strengthen..."
            onchange="qrSelfReviewState.areasOfImprovement=this.value">${escapeHtml(qrSelfReviewState.areasOfImprovement || '')}</textarea>
        </div>
      </div>

      <div class="card" style="border-top:4px solid var(--a3)">
        <div class="card-header">
          <div class="card-title">💡 Suggestions (If any)</div>
        </div>
        <div class="card-body">
          <textarea class="form-input" style="height:120px;font-size:12px;line-height:1.6"
            placeholder="Process enhancements, cross-team collaboration ideas, or feedback..."
            onchange="qrSelfReviewState.suggestions=this.value">${escapeHtml(qrSelfReviewState.suggestions || '')}</textarea>
        </div>
      </div>
    </div>

    <!-- MANAGER FEEDBACK BOX -->
    <div class="card" style="background:linear-gradient(135deg,rgba(79,70,229,.05),transparent);border:1px solid rgba(79,70,229,.3);margin-bottom:24px">
      <div class="card-header" style="border-bottom:1px solid rgba(79,70,229,.2)">
        <div class="card-title" style="color:var(--a1)">🗣️ Manager's Feedback &amp; Direction</div>
      </div>
      <div class="card-body" style="font-size:13px;line-height:1.6;color:var(--text)">
        ${qrSelfReviewState.managerFeedback ? escapeHtml(qrSelfReviewState.managerFeedback) : '<span style="color:var(--t3);font-style:italic">Manager feedback will appear here after evaluation.</span>'}
      </div>
    </div>
  `;
}

function addSelfReviewTargetLine(mIdx) {
  qrSelfReviewState.months[mIdx].targets.push('');
  renderSelfReviewStep(document.getElementById('qrStepBody'));
}

function removeSelfReviewTarget(mIdx, tIdx) {
  qrSelfReviewState.months[mIdx].targets.splice(tIdx, 1);
  renderSelfReviewStep(document.getElementById('qrStepBody'));
}

function addSelfReviewContribLine(mIdx) {
  qrSelfReviewState.months[mIdx].contributions.push('');
  renderSelfReviewStep(document.getElementById('qrStepBody'));
}

function removeSelfReviewContrib(mIdx, cIdx) {
  qrSelfReviewState.months[mIdx].contributions.splice(cIdx, 1);
  renderSelfReviewStep(document.getElementById('qrStepBody'));
}

// -----------------------------------------------------------------------
// STEP 2: KPI SELF-ASSESSMENT SCORECARDS
// -----------------------------------------------------------------------
function renderKpiStep(container) {
  const avgSelfKpi = (qrKpiState.reduce((a, k) => a + (k.selfRating || 0), 0) / qrKpiState.length).toFixed(1);

  container.innerHTML = `
    <!-- KPI SUMMARY BAR -->
    <div style="background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:16px 20px;margin-bottom:20px;box-shadow:var(--card-shadow);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-weight:700;font-size:15px;color:var(--text)">Quarterly KPI Performance Assessment</div>
        <div style="font-size:12px;color:var(--t3);margin-top:2px">Evaluate yourself on key delivery and collaboration indicators (1 to 5 Stars).</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;background:var(--s2);padding:6px 14px;border-radius:10px">
        <span style="font-size:12px;font-weight:600;color:var(--t2)">Average KPI Score:</span>
        <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--a2)">⭐ ${avgSelfKpi} / 5.0</span>
      </div>
    </div>

    <!-- 6 KPI CARDS GRID -->
    <div class="qr-kpi-grid">
      ${qrKpiState.map((kpi, kIdx) => `
        <div class="qr-kpi-card">
          <div class="qr-kpi-head">
            <div>
              <div style="font-weight:700;font-size:15px;color:var(--text);display:flex;align-items:center;gap:8px">
                <span class="badge badge-admin" style="font-size:11px">KPI ${kIdx+1}</span>
                ${kpi.name}
              </div>
            </div>

            <!-- STAR RATING SELECTOR (1 to 5) -->
            <div style="text-align:right">
              <label style="font-size:10px;font-weight:700;color:var(--t3);display:block;margin-bottom:4px;text-transform:uppercase">Self Rating</label>
              <div class="qr-rating-stars-bar">
                ${[1, 2, 3, 4, 5].map(star => `
                  <button type="button" class="qr-star-btn ${kpi.selfRating>=star?'active':''}"
                    onclick="setKpiRating(${kIdx}, ${star})" title="${star} Stars">
                    ${star}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- DESCRIPTION GUIDANCE BOX -->
          <div style="background:var(--s2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:11px;color:var(--t2);line-height:1.6;white-space:pre-line">
            <strong style="color:var(--text)">Criteria &amp; Definition:</strong><br>${kpi.description}
          </div>

          <!-- MANDATORY EXAMPLE & CHALLENGES -->
          <div style="display:grid;grid-template-columns:1fr;gap:12px">
            <div>
              <label class="form-label" style="font-size:11px">Work Example (Mandatory) *</label>
              <textarea class="form-input" style="height:65px;font-size:11px;line-height:1.5"
                placeholder="Provide concrete work examples demonstrating timeline adherence, initiative, or quality..."
                onchange="qrKpiState[${kIdx}].example=this.value">${escapeHtml(kpi.example || '')}</textarea>
            </div>
            <div>
              <label class="form-label" style="font-size:11px">Challenges &amp; Lessons</label>
              <textarea class="form-input" style="height:55px;font-size:11px;line-height:1.5"
                placeholder="Describe any hurdles encountered and solutions applied..."
                onchange="qrKpiState[${kIdx}].challenges=this.value">${escapeHtml(kpi.challenges || '')}</textarea>
            </div>
          </div>

          ${kpi.managerRating > 0 ? `
            <div style="margin-top:14px;padding:10px 12px;background:rgba(5,150,105,.08);border:1px solid rgba(5,150,105,.2);border-radius:8px;display:flex;justify-content:space-between;align-items:center;font-size:12px">
              <div><strong style="color:var(--a3)">Manager Rating:</strong> ⭐ ${kpi.managerRating} / 5</div>
              <div style="color:var(--t2)"><em>${escapeHtml(kpi.managerComments || 'Good progress')}</em></div>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function setKpiRating(kIdx, rating) {
  qrKpiState[kIdx].selfRating = rating;
  renderKpiStep(document.getElementById('qrStepBody'));
}

// -----------------------------------------------------------------------
// STEP 3: SKILL MATRIX (DYNAMIC SCOPE BADGES & SCOPE FILTERING)
// -----------------------------------------------------------------------
function renderSkillMatrixStep(container) {
  const userTeam = allTeams.find(t => t.id === qrSelectedTeamId)?.name || 'Backend & Platform Engineering';
  
  // Extract all unique categories and unique scope tags from loaded skills
  const categories = Array.from(new Set(qrSkillMatrixState.map(s => s.category).filter(Boolean)));
  const allScopes = Array.from(new Set(
    qrSkillMatrixState.flatMap(s => (s.scope || 'General').split(',').map(x => x.trim())).filter(Boolean)
  ));

  // Filter skills by category, scope, and search query
  const filteredSkills = qrSkillMatrixState.filter(s => {
    const matchCat = qrSkillCategoryFilter === 'ALL' || s.category === qrSkillCategoryFilter;
    const sScopeStr = s.scope || 'General';
    const matchScope = qrSkillScopeFilter === 'ALL' || sScopeStr.toLowerCase().includes(qrSkillScopeFilter.toLowerCase());
    const matchSearch = !qrSkillSearchQuery || s.skill.toLowerCase().includes(qrSkillSearchQuery.toLowerCase()) || s.category.toLowerCase().includes(qrSkillSearchQuery.toLowerCase()) || sScopeStr.toLowerCase().includes(qrSkillSearchQuery.toLowerCase());
    return matchCat && matchScope && matchSearch;
  });

  // Calculate statistics
  const totalSkills = qrSkillMatrixState.length;
  const avgRating = totalSkills > 0 ? (qrSkillMatrixState.reduce((a, s) => a + (parseFloat(s.selfRating) || 0), 0) / totalSkills).toFixed(1) : '0.0';
  const trainingReqCount = qrSkillMatrixState.filter(s => s.trainingRequired === 'YES').length;

  container.innerHTML = `
    <!-- TOP STATS METRIC TILES -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:20px">
      <div class="stat-card" style="padding:14px 18px">
        <div class="stat-accent" style="background:var(--a1)"></div>
        <div class="stat-label">Total Matrix Skills</div>
        <div class="stat-val" style="font-size:26px">${totalSkills}</div>
        <div class="stat-foot">${userTeam}</div>
      </div>
      <div class="stat-card" style="padding:14px 18px">
        <div class="stat-accent" style="background:var(--a2)"></div>
        <div class="stat-label">Average Proficiency</div>
        <div class="stat-val" style="font-size:26px;color:var(--a2)">⭐ ${avgRating}</div>
        <div class="stat-foot">Out of 5.0 scale</div>
      </div>
      <div class="stat-card" style="padding:14px 18px">
        <div class="stat-accent" style="background:var(--a4)"></div>
        <div class="stat-label">Training Needed</div>
        <div class="stat-val" style="font-size:26px;color:var(--a4)">${trainingReqCount}</div>
        <div class="stat-foot">Skills flagged for workshops</div>
      </div>
    </div>

    <!-- FILTER & SEARCH BAR -->
    <div class="card mb20">
      <div class="card-body" style="padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">
          <!-- LIVE SEARCH -->
          <div style="position:relative;flex:1;max-width:340px">
            <input type="text" class="form-input" style="padding:8px 12px 8px 32px;font-size:12px"
              placeholder="🔍 Search skills or scopes (e.g. SEO, Backend, Cloud)..."
              value="${escapeHtml(qrSkillSearchQuery)}"
              oninput="qrSkillSearchQuery=this.value;renderSkillMatrixStep(document.getElementById('qrStepBody'))">
          </div>

          <div style="font-size:12px;color:var(--t3)">
            Showing <strong>${filteredSkills.length}</strong> of ${totalSkills} team skills
          </div>
        </div>

        <!-- CATEGORY FILTER PILLS -->
        <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">Filter by Category:</div>
        <div class="qr-cat-pill-nav" style="margin-bottom:12px">
          <button type="button" class="qr-cat-pill ${qrSkillCategoryFilter==='ALL'?'active':''}"
            onclick="qrSkillCategoryFilter='ALL';renderSkillMatrixStep(document.getElementById('qrStepBody'))">
            All Categories (${totalSkills})
          </button>
          ${categories.map(cat => {
            const count = qrSkillMatrixState.filter(s => s.category === cat).length;
            return `
              <button type="button" class="qr-cat-pill ${qrSkillCategoryFilter===cat?'active':''}"
                onclick="qrSkillCategoryFilter='${cat}';renderSkillMatrixStep(document.getElementById('qrStepBody'))">
                ${cat} (${count})
              </button>
            `;
          }).join('')}
        </div>

        <!-- DYNAMIC SCOPE / DOMAIN TRACK FILTER PILLS -->
        ${allScopes.length > 0 ? `
          <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">Filter by Team Scope / Domain:</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
            <button type="button" class="qr-scope-chip ${qrSkillScopeFilter==='ALL'?'active':''}"
              onclick="qrSkillScopeFilter='ALL';renderSkillMatrixStep(document.getElementById('qrStepBody'))">
              All Scopes
            </button>
            ${allScopes.map(sc => `
              <button type="button" class="qr-scope-chip ${qrSkillScopeFilter===sc?'active':''}"
                onclick="qrSkillScopeFilter='${sc}';renderSkillMatrixStep(document.getElementById('qrStepBody'))">
                🏷️ ${sc}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <!-- SKILL MATRIX DATA TABLE -->
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr style="background:var(--s2)">
                <th style="width:200px">Skill Name</th>
                <th style="width:130px">Category</th>
                <th style="width:180px">Scope / Domain</th>
                <th style="width:140px;text-align:center">Self Rating (0 - 5)</th>
                <th>Comments</th>
                <th style="width:130px;text-align:center">Training Required</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSkills.map((s) => {
                const globalIdx = qrSkillMatrixState.findIndex(x => x.skill === s.skill && x.category === s.category);
                const scopeParts = (s.scope || 'General').split(',').map(x => x.trim()).filter(Boolean);

                return `
                  <tr>
                    <td style="font-weight:700;color:var(--text)">${s.skill}</td>
                    <td><span class="badge badge-admin" style="font-size:10px">${s.category}</span></td>
                    <td>
                      <div style="display:flex;gap:4px;flex-wrap:wrap">
                        ${scopeParts.map(sp => `<span class="badge-scope ${getScopeClass(sp)}">${sp}</span>`).join('')}
                      </div>
                    </td>
                    <td style="text-align:center">
                      <select class="form-input" style="padding:4px 8px;font-size:12px;font-weight:700;height:auto;width:75px;margin:0 auto"
                        onchange="qrSkillMatrixState[${globalIdx}].selfRating=parseFloat(this.value);renderSkillMatrixStep(document.getElementById('qrStepBody'))">
                        ${[0, 1, 2, 3, 3.5, 4, 4.5, 5].map(r => `
                          <option value="${r}" ${parseFloat(s.selfRating)===r?'selected':''}>⭐ ${r}</option>
                        `).join('')}
                      </select>
                    </td>
                    <td>
                      <input type="text" class="form-input" style="font-size:11px;padding:5px 10px"
                        placeholder="Optional comment / proficiency details..."
                        value="${escapeHtml(s.comments || '')}"
                        onchange="qrSkillMatrixState[${globalIdx}].comments=this.value">
                    </td>
                    <td style="text-align:center">
                      <button type="button" class="btn btn-sm ${s.trainingRequired==='YES'?'btn-danger':'btn-ghost'}"
                        style="font-size:11px;padding:4px 12px;border-radius:20px;font-weight:700"
                        onclick="toggleTrainingRequired(${globalIdx})">
                        ${s.trainingRequired==='YES'?'YES ⚠️':'NO ✓'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function toggleTrainingRequired(idx) {
  qrSkillMatrixState[idx].trainingRequired = qrSkillMatrixState[idx].trainingRequired === 'YES' ? 'NO' : 'YES';
  renderSkillMatrixStep(document.getElementById('qrStepBody'));
}

async function saveQrForm(isDraft) {
  try {
    toast(isDraft ? 'Saving draft...' : 'Submitting quarterly feedback...', 'info');

    const kpiAvg = qrKpiState.reduce((acc, k) => acc + (k.selfRating || 0), 0) / qrKpiState.length;
    const skillAvg = qrSkillMatrixState.reduce((acc, s) => acc + (s.selfRating || 0), 0) / (qrSkillMatrixState.length || 1);
    const overallScore = ((kpiAvg + skillAvg) / 2).toFixed(2);

    const payload = {
      quarter: qrSelectedQuarter,
      year: qrSelectedYear,
      team_id: qrSelectedTeamId,
      self_review_data: qrSelfReviewState,
      kpi_data: qrKpiState,
      skill_matrix_data: qrSkillMatrixState,
      overall_score: parseFloat(overallScore),
      status: isDraft ? 'draft' : 'submitted'
    };

    const res = await API.saveQuarterlyReview(payload);
    qrLoadedReviewId = res.id;
    toast(isDraft ? 'Draft saved successfully!' : 'Quarterly Assessment submitted successfully! 🎉', 'success');
    renderQrFormView(document.getElementById('qrContentArea'));
  } catch (err) {
    toast('Error saving review: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HISTORICAL SUBMISSIONS ARCHIVE
// ═══════════════════════════════════════════════════════════════════════
async function renderQrArchiveView(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading historical submissions...</div>`;

  try {
    const list = await API.getQuarterlyReviews({ employee_id: currentProfile.id });

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:50px 20px">
          <div style="font-size:42px;margin-bottom:12px">🗂️</div>
          <div style="font-weight:700;font-size:18px;color:var(--text)">No Saved Quarterly Submissions Found</div>
          <p style="font-size:13px;color:var(--t3);margin:6px 0 16px 0">Submit your active review to view and review historical quarters here.</p>
          <button class="btn btn-primary" style="width:auto;padding:10px 24px" onclick="switchQrTab('form')">Go to Active Form →</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">🗂️ Historical Submissions Archive (${list.length})</div>
          <div class="card-sub">All past quarterly feedback forms persisted in one place</div>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr style="background:var(--s2)">
                <th>Quarter</th>
                <th>Year</th>
                <th>Status</th>
                <th>Overall Rating</th>
                <th>Submitted On</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(r => `
                <tr>
                  <td style="font-weight:700;color:var(--text)">${r.quarter}</td>
                  <td>${r.year}</td>
                  <td>
                    <span class="badge ${r.status==='reviewed'?'badge-peer':'badge-manager'}">
                      ${r.status==='reviewed'?'✓ Reviewed by Manager':'Submitted'}
                    </span>
                  </td>
                  <td style="font-weight:800;color:var(--a2)">⭐ ${r.overall_score || '4.5'} / 5.0</td>
                  <td style="font-size:12px;color:var(--t3)">${new Date(r.created_at).toLocaleDateString()}</td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm" onclick="openReviewModal('${r.id}')">👁️ View Full Form</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--a4)">Error loading history: ${err.message}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEAM MEMBER REVIEWS (MANAGER WORKFLOW)
// ═══════════════════════════════════════════════════════════════════════
async function renderQrTeamReviewsView(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading team reviews...</div>`;

  try {
    const list = await API.getQuarterlyReviews({});
    const users = await API.getUsers();
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:50px 20px">
          <div style="font-size:42px;margin-bottom:12px">👥</div>
          <div style="font-weight:700;font-size:18px;color:var(--text)">No Team Reviews Submitted Yet</div>
          <p style="font-size:13px;color:var(--t3);margin-top:6px">Submissions by team members will appear here for manager ratings and review.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">👥 Team Member Quarterly Feedback Submissions (${list.length})</div>
          <div class="card-sub">Review employee quarterly submissions and input manager evaluation scores</div>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr style="background:var(--s2)">
                <th>Employee</th>
                <th>Department / Team</th>
                <th>Cycle</th>
                <th>Status</th>
                <th>Self Rating Avg</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(r => {
                const emp = userMap[r.employee_id] || { full_name: 'Employee (' + r.employee_id + ')' };
                return `
                  <tr>
                    <td style="font-weight:700;color:var(--text)">${emp.full_name}</td>
                    <td style="font-size:12px;color:var(--t2)">${emp.department || 'Engineering'}</td>
                    <td>${r.quarter} ${r.year}</td>
                    <td>
                      <span class="badge ${r.status==='reviewed'?'badge-peer':'badge-hr'}">
                        ${r.status==='reviewed'?'Manager Reviewed':'Pending Evaluation'}
                      </span>
                    </td>
                    <td style="font-weight:800;color:var(--a2)">⭐ ${r.overall_score || '4.5'}</td>
                    <td style="text-align:right">
                      <button class="btn btn-primary btn-sm" onclick="openManagerReviewModal('${r.id}')">
                        ✏️ Evaluate &amp; Add Feedback
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--a4)">Error loading team reviews: ${err.message}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE CUSTOMIZER (SUPER ADMIN DYNAMIC SCOPE BUILDER)
// ═══════════════════════════════════════════════════════════════════════
async function renderQrTemplateBuilderView(container) {
  if (currentProfile?.role !== 'super_admin') {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:36px;margin-bottom:8px">🔒</div>
        <div style="font-weight:700;font-size:16px;color:var(--a4)">Super Admin Access Required</div>
        <p style="font-size:13px;color:var(--t3);margin-top:4px">Only a Super Admin has permissions to add, edit, or remove matrix skills.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading template customizer...</div>`;

  try {
    const templates = await API.getSkillTemplates(qrSelectedTeamId);
    const teams = allTeams.length ? allTeams : MOCK_TEAMS;
    const currentTeam = teams.find(t => t.id === qrSelectedTeamId);
    const presetScopes = TEAM_PRESET_SCOPES[qrSelectedTeamId] || ['General', 'Core', 'Specialized', 'Operations'];

    container.innerHTML = `
      <div class="card mb20">
        <div class="card-header" style="flex-wrap:wrap;gap:12px">
          <div>
            <div class="card-title" style="display:flex;align-items:center;gap:8px">
              <span>⚙️ Master Skill Matrix &amp; Team Scope Customizer</span>
              <span class="badge badge-super_admin" style="font-size:10px">Super Admin Exclusive</span>
            </div>
            <div class="card-sub">Configure skills, categories, and flexible domain/scopes for each team</div>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <label style="font-size:12px;font-weight:700">Team:</label>
            <select class="form-input" style="padding:6px 12px;font-size:12px;height:auto;width:auto" onchange="qrSelectedTeamId=this.value;renderQrTemplateBuilderView(document.getElementById('qrContentArea'))">
              ${teams.map(t => `<option value="${t.id}" ${qrSelectedTeamId===t.id?'selected':''}>${t.name} (${t.department||'General'})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="card-body">
          <!-- ADD NEW SKILL FORM WITH DYNAMIC SCOPE SELECTOR -->
          <div style="background:var(--s2);padding:18px;border-radius:14px;margin-bottom:24px;border:1px solid var(--border)">
            <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:var(--text);display:flex;align-items:center;gap:6px">
              <span>+ Add Skill for Team: <strong>${currentTeam?.name || 'Selected Team'}</strong></span>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1.5fr 1.8fr auto;gap:12px;align-items:end">
              <div>
                <label class="form-label" style="font-size:11px">Category</label>
                <input type="text" id="newSkillCat" class="form-input" style="padding:7px 10px;font-size:12px" placeholder="e.g. Topics, Tools, Channels..." list="categoryList">
                <datalist id="categoryList">
                  <option value="Topics">
                  <option value="Framework">
                  <option value="Language">
                  <option value="Tools">
                  <option value="Database">
                  <option value="Networking">
                  <option value="Container">
                  <option value="AI Tools">
                  <option value="Channels">
                  <option value="Analytics">
                  <option value="Operations">
                  <option value="Design">
                </datalist>
              </div>

              <div>
                <label class="form-label" style="font-size:11px">Skill Name</label>
                <input type="text" id="newSkillName" class="form-input" style="padding:7px 10px;font-size:12px" placeholder="e.g. TimescaleDB, SEO, Figma...">
              </div>

              <div>
                <label class="form-label" style="font-size:11px">Team Scope / Track Tags</label>
                <input type="text" id="newSkillScope" class="form-input" style="padding:7px 10px;font-size:12px"
                  placeholder="e.g. Backend, Frontend, or SEO..." value="${presetScopes[0] || 'General'}">
              </div>

              <button class="btn btn-primary" style="padding:8px 18px;height:38px" onclick="addCustomSkillTemplate()">+ Add Skill</button>
            </div>

            <!-- QUICK SCOPE PRESET CHIPS -->
            <div style="margin-top:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase">Quick Preset Scopes:</span>
              ${presetScopes.map(ps => `
                <button type="button" class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 8px;border-radius:12px"
                  onclick="appendScopeToInput('newSkillScope', '${ps}')">
                  + ${ps}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- SKILLS TABLE -->
          <table class="data-table">
            <thead>
              <tr style="background:var(--s2)">
                <th>Category</th>
                <th>Skill Name</th>
                <th>Scope / Domain Tags</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${templates.map(st => {
                const scopeParts = (st.scope || (st.is_backend && st.is_frontend ? 'Backend, Frontend' : st.is_backend ? 'Backend' : st.is_frontend ? 'Frontend' : 'General')).split(',').map(x => x.trim()).filter(Boolean);
                return `
                  <tr>
                    <td><span class="badge badge-admin" style="font-size:11px">${st.category}</span></td>
                    <td style="font-weight:700;color:var(--text)">${st.skill_name}</td>
                    <td>
                      <div style="display:flex;gap:4px;flex-wrap:wrap">
                        ${scopeParts.map(sp => `<span class="badge-scope ${getScopeClass(sp)}">${sp}</span>`).join('')}
                      </div>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex;gap:6px;justify-content:flex-end">
                        <button class="btn btn-ghost btn-sm" onclick="openEditSkillModal('${st.id}', '${escapeHtml(st.skill_name)}', '${st.category}', '${escapeHtml(st.scope || scopeParts.join(', '))}')">
                          ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteCustomSkillTemplate('${st.id}')">
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--a4)">Error: ${err.message}</div>`;
  }
}

function appendScopeToInput(inputId, tag) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const current = el.value.trim();
  if (!current) {
    el.value = tag;
  } else if (!current.includes(tag)) {
    el.value = current + ', ' + tag;
  }
}

async function addCustomSkillTemplate() {
  const cat = v('newSkillCat');
  const name = v('newSkillName');
  const scope = v('newSkillScope') || 'General';

  if (!name || !cat) return toast('Please enter skill name and category', 'warn');

  try {
    await API.addSkillTemplate({
      team_id: qrSelectedTeamId,
      category: cat,
      skill_name: name,
      scope: scope
    });
    toast('New skill added to team template!', 'success');
    renderQrTemplateBuilderView(document.getElementById('qrContentArea'));
  } catch (err) {
    toast(err.message, 'error');
  }
}

function openEditSkillModal(id, skillName, category, scope) {
  const presetScopes = TEAM_PRESET_SCOPES[qrSelectedTeamId] || ['General', 'Core', 'Specialized', 'Operations'];

  document.getElementById('modalTitle').textContent = `✏️ Edit Skill: ${skillName}`;
  document.getElementById('modalSub').textContent = `Super Admin Team Scope & Template Management`;
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Category</label>
      <input type="text" id="editSkillCat" class="form-input" value="${category}" list="categoryList">
    </div>
    <div class="form-group mb16">
      <label class="form-label">Skill Name</label>
      <input type="text" id="editSkillName" class="form-input" value="${skillName}">
    </div>
    <div class="form-group mb16">
      <label class="form-label">Scope / Domain Track Tags (comma-separated)</label>
      <input type="text" id="editSkillScope" class="form-input" value="${scope}">
      
      <!-- PRESET TAGS QUICK CLICK -->
      <div style="margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase">Presets:</span>
        ${presetScopes.map(ps => `
          <button type="button" class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 8px;border-radius:12px"
            onclick="appendScopeToInput('editSkillScope', '${ps}')">
            + ${ps}
          </button>
        `).join('')}
      </div>
    </div>
    <div style="margin-top:20px">
      <button class="btn btn-primary" onclick="saveEditedSkill('${id}')">Save Changes ✓</button>
    </div>
  `;
  openModal();
}

async function saveEditedSkill(id) {
  const cat = v('editSkillCat');
  const name = v('editSkillName');
  const scope = v('editSkillScope') || 'General';

  if (!name || !cat) return toast('Skill name and category cannot be empty', 'warn');

  try {
    await API.updateSkillTemplate(id, {
      category: cat,
      skill_name: name,
      scope: scope,
      team_id: qrSelectedTeamId
    });
    closeModal();
    toast('Skill successfully updated!', 'success');
    renderQrTemplateBuilderView(document.getElementById('qrContentArea'));
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteCustomSkillTemplate(id) {
  if (!confirm('Are you sure you want to remove this skill from the master template?')) return;
  try {
    await API.deleteSkillTemplate(id);
    toast('Skill removed from template', 'info');
    renderQrTemplateBuilderView(document.getElementById('qrContentArea'));
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL POPUPS FOR VIEWING & MANAGER EVALUATION
// ═══════════════════════════════════════════════════════════════════════
async function openReviewModal(reviewId) {
  try {
    const rev = await API.getQuarterlyReviewById(reviewId);
    const selfData = typeof rev.self_review_data === 'string' ? JSON.parse(rev.self_review_data) : rev.self_review_data;
    const kpiData = typeof rev.kpi_data === 'string' ? JSON.parse(rev.kpi_data) : rev.kpi_data;
    const skillData = typeof rev.skill_matrix_data === 'string' ? JSON.parse(rev.skill_matrix_data) : rev.skill_matrix_data;

    document.getElementById('modalTitle').textContent = `📄 Quarterly Review — ${rev.quarter} ${rev.year}`;
    document.getElementById('modalSub').textContent = `Overall Score: ⭐ ${rev.overall_score || '4.5'} / 5.0 • Status: ${rev.status}`;
    document.getElementById('modalBody').innerHTML = `
      <div style="max-height:70vh;overflow-y:auto;padding-right:6px">
        <h4 style="margin:0 0 8px 0;color:var(--a1)">1. Goals &amp; Improvements</h4>
        <div style="background:var(--s2);padding:12px;border-radius:10px;font-size:12px;line-height:1.6" class="mb16">
          <strong>Next Quarter Goals:</strong><br>${escapeHtml(selfData.goalsForNextQuarter || 'N/A')}<br><br>
          <strong>Areas of Improvement:</strong><br>${escapeHtml(selfData.areasOfImprovement || 'N/A')}<br><br>
          <strong>Suggestions:</strong><br>${escapeHtml(selfData.suggestions || 'N/A')}
        </div>

        <h4 style="margin:0 0 8px 0;color:var(--a1)">2. KPI Self Ratings</h4>
        <div class="mb16">
          ${kpiData.map(k => `
            <div style="margin-bottom:8px;padding:10px;background:var(--s1);border-radius:8px;border:1px solid var(--border);font-size:12px">
              <div style="display:flex;justify-content:space-between;font-weight:700">
                <span>${k.name}</span>
                <span style="color:var(--a2)">⭐ ${k.selfRating} / 5</span>
              </div>
              <div style="font-size:11px;color:var(--t2);margin-top:4px"><em>Example:</em> ${escapeHtml(k.example || 'None')}</div>
              ${k.managerRating > 0 ? `<div style="color:var(--a3);font-size:11px;margin-top:4px"><strong>Manager Score:</strong> ⭐ ${k.managerRating} / 5 — ${escapeHtml(k.managerComments)}</div>` : ''}
            </div>
          `).join('')}
        </div>

        <h4 style="margin:0 0 8px 0;color:var(--a1)">3. Skill Matrix Proficiency</h4>
        <div style="max-height:220px;overflow-y:auto">
          <table class="data-table" style="font-size:11px">
            <thead>
              <tr style="background:var(--s2)"><th>Skill</th><th>Scope</th><th>Rating</th><th>Training</th></tr>
            </thead>
            <tbody>
              ${skillData.map(s => `
                <tr>
                  <td style="font-weight:600">${s.skill}</td>
                  <td><span class="badge-scope ${getScopeClass(s.scope)}">${s.scope || 'General'}</span></td>
                  <td>⭐ ${s.selfRating}</td>
                  <td>${s.trainingRequired==='YES'?'<span style="color:var(--a4);font-weight:700">YES</span>':'NO'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    openModal();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function openManagerReviewModal(reviewId) {
  try {
    const rev = await API.getQuarterlyReviewById(reviewId);
    const selfData = typeof rev.self_review_data === 'string' ? JSON.parse(rev.self_review_data) : rev.self_review_data;
    const kpiData = typeof rev.kpi_data === 'string' ? JSON.parse(rev.kpi_data) : rev.kpi_data;
    const skillData = typeof rev.skill_matrix_data === 'string' ? JSON.parse(rev.skill_matrix_data) : rev.skill_matrix_data;

    document.getElementById('modalTitle').textContent = `✏️ Manager Evaluation & Ratings`;
    document.getElementById('modalSub').textContent = `Quarter: ${rev.quarter} ${rev.year}`;
    document.getElementById('modalBody').innerHTML = `
      <div style="max-height:70vh;overflow-y:auto;padding-right:6px">
        <div class="form-group mb16">
          <label class="form-label">Manager Feedback for Self Review Sheet</label>
          <textarea id="mgrFbText" class="form-input" style="height:80px">${escapeHtml(selfData.managerFeedback || '')}</textarea>
        </div>

        <h4 style="margin:16px 0 10px 0;color:var(--a1)">Score Employee KPIs (1 to 5 Stars)</h4>
        ${kpiData.map((k, idx) => `
          <div style="background:var(--s2);padding:12px;border-radius:10px;margin-bottom:10px" id="mgrKpiBox_${idx}">
            <div style="font-weight:700;font-size:12px;margin-bottom:6px;display:flex;justify-content:space-between">
              <span>${k.name}</span>
              <span style="color:var(--t3);font-size:11px">Employee Score: ⭐ ${k.selfRating}</span>
            </div>
            <div style="display:grid;grid-template-columns:110px 1fr;gap:10px">
              <select id="mgrKpiScore_${idx}" class="form-input" style="padding:4px 8px;font-size:12px;height:auto">
                ${[1, 2, 3, 4, 4.5, 5].map(r => `<option value="${r}" ${k.managerRating===r?'selected':''}>⭐ ${r} Stars</option>`).join('')}
              </select>
              <input type="text" id="mgrKpiComm_${idx}" class="form-input" style="padding:4px 8px;font-size:12px"
                placeholder="Manager assessment comment..." value="${escapeHtml(k.managerComments || '')}">
            </div>
          </div>
        `).join('')}

        <div style="margin-top:20px">
          <button class="btn btn-primary" style="width:100%" onclick="submitManagerEvaluation('${rev.id}')">
            Submit Manager Evaluation ✓
          </button>
        </div>
      </div>
    `;

    openModal();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function submitManagerEvaluation(reviewId) {
  try {
    const rev = await API.getQuarterlyReviewById(reviewId);
    const kpiData = typeof rev.kpi_data === 'string' ? JSON.parse(rev.kpi_data) : rev.kpi_data;
    const skillData = typeof rev.skill_matrix_data === 'string' ? JSON.parse(rev.skill_matrix_data) : rev.skill_matrix_data;

    kpiData.forEach((k, idx) => {
      const scoreEl = document.getElementById(`mgrKpiScore_${idx}`);
      const commEl = document.getElementById(`mgrKpiComm_${idx}`);
      if (scoreEl) k.managerRating = parseFloat(scoreEl.value);
      if (commEl) k.managerComments = commEl.value;
    });

    const mgrFeedback = v('mgrFbText');

    await API.submitManagerReview(reviewId, {
      kpi_data: kpiData,
      skill_matrix_data: skillData,
      manager_feedback: mgrFeedback,
      overall_score: 4.8
    });

    closeModal();
    toast('Manager evaluation submitted successfully!', 'success');
    renderQrTeamReviewsView(document.getElementById('qrContentArea'));
  } catch (err) {
    toast(err.message, 'error');
  }
}
