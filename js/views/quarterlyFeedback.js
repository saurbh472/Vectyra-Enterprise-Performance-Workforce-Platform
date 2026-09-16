// ═══════════════════════════════════════════════════════════════════════
// PREMIUM QUARTERLY FEEDBACK & PERFORMANCE PORTAL MODULE
// Self Review Sheet + KPI Self-Assessment + Dynamic Scope Skill Matrix
// Team-Wise Administration, Locking & HR Unlock Controls
// ═══════════════════════════════════════════════════════════════════════

let qrCurrentTab = 'form'; // 'form' | 'archive' | 'teamReviews' | 'templateBuilder' | 'fullView'
let qrViewReviewId = null;
let qrActiveStep = 1; // 1: Self Review | 2: KPI Assessment | 3: Skill Matrix
let qrSelectedQuarter = 'Q2 (April - July)';
let qrSelectedYear = 2026;
let qrSelectedTeamId = 't2'; // Defaults to Backend Platform
let qrTeamFilter = 'ALL'; // 'ALL' or specific team_id for HR / Admin team view
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
let qrLoadedReviewStatus = 'draft';
let qrLoadedIsUnlocked = false;

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
          🏢 All Member Submissions
        </button>
      ` : ''}
      ${isSuperAdmin ? `
        <button class="qr-tab-btn ${qrCurrentTab==='templateBuilder'?'active':''}" onclick="switchQrTab('templateBuilder')">
          ⚙️ Master Template Customizer <span class="badge-pill" style="background:rgba(217,119,6,.15);color:var(--super)">👑 SuperAdmin</span>
        </button>
      ` : ''}
      ${qrCurrentTab==='fullView' ? `
        <button class="qr-tab-btn active" style="background:linear-gradient(135deg,var(--a1),#4338ca);color:#fff">
          👁️ Full Appraisal Report Viewer
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
      qrLoadedReviewStatus = rev.status || 'submitted';
      qrLoadedIsUnlocked = Boolean(rev.is_unlocked);
      qrSelfReviewState = typeof rev.self_review_data === 'string' ? JSON.parse(rev.self_review_data) : rev.self_review_data;
      qrKpiState = typeof rev.kpi_data === 'string' ? JSON.parse(rev.kpi_data) : rev.kpi_data;
      qrSkillMatrixState = typeof rev.skill_matrix_data === 'string' ? JSON.parse(rev.skill_matrix_data) : rev.skill_matrix_data;
    } else {
      qrLoadedReviewId = null;
      qrLoadedReviewStatus = 'draft';
      qrLoadedIsUnlocked = false;
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
  } else if (qrCurrentTab === 'fullView') {
    renderQrFullPageView(area);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// FORM VIEW (3-STEP WIZARD WITH AUTOMATIC 1-SUBMISSION LOCKING)
// ═══════════════════════════════════════════════════════════════════════
function renderQrFormView(container) {
  const userTeam = allTeams.find(t => t.id === qrSelectedTeamId)?.name || 'Backend & Platform Engineering';

  const isFormLocked = (qrLoadedReviewStatus === 'submitted' || qrLoadedReviewStatus === 'reviewed' || qrLoadedReviewStatus === 'locked') && !qrLoadedIsUnlocked;

  container.innerHTML = `
    <!-- LOCK NOTIFICATION BANNER -->
    ${isFormLocked ? `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--err)">🔒</div>
          <div>
            <div style="font-weight:800;font-size:14px;color:var(--err)">Quarterly Appraisal Form Submitted &amp; Locked</div>
            <div style="font-size:12px;color:var(--t2);margin-top:2px">
              You submitted your quarterly appraisal for <strong>${qrSelectedQuarter} ${qrSelectedYear}</strong>. Employees are allowed <strong>1 submission per quarter</strong>. To make corrections, request SuperAdmin or HR Admin to unlock your submission.
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="openReviewModal('${qrLoadedReviewId}')">👁️ View Submitted Report</button>
          <button class="btn btn-primary btn-sm" onclick="downloadQuarterlyReviewSheet()" style="font-size:11px">📥 Download Sheet</button>
        </div>
      </div>
    ` : qrLoadedIsUnlocked ? `
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:14px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--a3)">🔓</div>
        <div>
          <div style="font-weight:800;font-size:14px;color:var(--a3)">Submission Unlocked by HR / SuperAdmin</div>
          <div style="font-size:12px;color:var(--t2);margin-top:2px">Your quarterly review form has been unlocked for edits. You may make corrections and click <strong>Submit Quarterly Review</strong> to lock your updated appraisal.</div>
        </div>
      </div>
    ` : ''}

    <!-- WIZARD STEP HEADER -->
    <div class="qr-wizard-card">
      <div>
        <div style="font-weight:700;font-size:15px;color:var(--text);display:flex;align-items:center;gap:8px">
          <span>👤 ${currentProfile.full_name}</span>
          <span class="badge badge-manager-role" style="font-size:11px">${userTeam}</span>
        </div>
        <div style="font-size:12px;color:var(--t3);margin-top:4px">
          Review Cycle: <strong>${qrSelectedQuarter} ${qrSelectedYear}</strong> • Status: ${isFormLocked ? '<span style="color:var(--err);font-weight:700">🔒 Submitted &amp; Locked</span>' : qrLoadedIsUnlocked ? '<span style="color:var(--a3);font-weight:700">🔓 Unlocked for Edits</span>' : '<span style="color:var(--a2);font-weight:700">Draft in Progress</span>'}
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
        <div style="width:10px;height:10px;border-radius:50%;background:${isFormLocked ? 'var(--err)' : qrLoadedReviewId ? 'var(--a3)' : 'var(--a2)'}"></div>
        <div style="font-size:13px;font-weight:600;color:var(--text)">
          ${isFormLocked ? '🔒 Form is locked (1 submission per quarter limit)' : qrLoadedReviewId ? 'Quarterly Submission Synced with Database' : 'Unsaved changes in draft'}
        </div>
      </div>
      <div style="display:flex;gap:12px">
        ${isFormLocked ? `
          <button class="btn btn-ghost" onclick="openReviewModal('${qrLoadedReviewId}')">👁️ View Full Submitted Report</button>
          <button class="btn btn-primary" onclick="downloadQuarterlyReviewSheet()" style="font-size:12px">📥 Download Sheet (.csv)</button>
        ` : `
          <button class="btn btn-ghost" onclick="saveQrForm(true)">💾 Save Draft</button>
          <button class="btn btn-primary" onclick="saveQrForm(false)" style="background:linear-gradient(135deg,var(--a1),#4338ca);box-shadow:0 4px 14px rgba(79,70,229,.35)">
            🚀 Submit Quarterly Review
          </button>
        `}
      </div>
    </div>
  `;

  renderCurrentQrStep(isFormLocked);
}

function switchQrStep(step) {
  qrActiveStep = step;
  renderQrFormView(document.getElementById('qrContentArea'));
}

function renderCurrentQrStep(isLocked = false) {
  const stepBody = document.getElementById('qrStepBody');
  if (!stepBody) return;

  if (qrActiveStep === 1) {
    renderSelfReviewStep(stepBody, isLocked);
  } else if (qrActiveStep === 2) {
    renderKpiStep(stepBody, isLocked);
  } else if (qrActiveStep === 3) {
    renderSkillMatrixStep(stepBody, isLocked);
  }
}

// -----------------------------------------------------------------------
// STEP 1: SELF REVIEW SHEET (MONTHLY TARGETS & CONTRIBUTIONS)
// -----------------------------------------------------------------------
function renderSelfReviewStep(container, isLocked = false) {
  const mList = qrSelfReviewState.months;

  container.innerHTML = `
    <!-- MONTHLY SPREADSHEET CARD GRID -->
    <div class="qr-month-grid">
      ${mList.map((m, mIdx) => `
        <div class="qr-month-col">
          <div class="qr-month-header">
            <div class="qr-month-title">📅 ${m.month}</div>
          </div>
          <div class="qr-card-section">
            <div class="qr-sec-header">🎯 Target Objectives Assigned</div>
            ${m.targets.map((t, tIdx) => `
              <input type="text" class="qr-input" value="${escapeHtml(t)}" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
                onchange="updateTarget(${mIdx}, ${tIdx}, this.value)" placeholder="Target objective ${tIdx+1}">
            `).join('')}
          </div>

          <div class="qr-card-section">
            <div class="qr-sec-header">🚀 Achievements &amp; Code Contributions</div>
            ${m.contributions.map((c, cIdx) => `
              <input type="text" class="qr-input" value="${escapeHtml(c)}" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
                onchange="updateContribution(${mIdx}, ${cIdx}, this.value)" placeholder="Contribution ${cIdx+1}">
            `).join('')}
          </div>

          <div class="qr-card-section" style="background:var(--s2);border-radius:10px;padding:12px;border:1px solid var(--border)">
            <div class="qr-sec-header" style="color:var(--a1)">⭐ Highlight Contribution</div>
            <textarea class="qr-textarea mb8" placeholder="Target vs Result..." ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
              onchange="updateTopContribution(${mIdx}, 'targetResult', this.value)">${escapeHtml(m.topContribution?.targetResult || '')}</textarea>
            <textarea class="qr-textarea mb8" placeholder="Good Practices Followed..." ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
              onchange="updateTopContribution(${mIdx}, 'goodPractice', this.value)">${escapeHtml(m.topContribution?.goodPractice || '')}</textarea>
            <textarea class="qr-textarea" placeholder="Lessons Learnt..." ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
              onchange="updateTopContribution(${mIdx}, 'lessonLearnt', this.value)">${escapeHtml(m.topContribution?.lessonLearnt || '')}</textarea>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- STRATEGIC NARRATIVE CARDS -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin-top:20px;margin-bottom:80px">
      <div class="card">
        <div class="card-header"><div class="card-title" style="font-size:13px">🎯 Goals for Next Quarter</div></div>
        <div class="card-body">
          <textarea class="form-input" style="height:110px" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
            onchange="qrSelfReviewState.goalsForNextQuarter = this.value">${escapeHtml(qrSelfReviewState.goalsForNextQuarter || '')}</textarea>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title" style="font-size:13px">📈 Areas of Growth &amp; Improvement</div></div>
        <div class="card-body">
          <textarea class="form-input" style="height:110px" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
            onchange="qrSelfReviewState.areasOfImprovement = this.value">${escapeHtml(qrSelfReviewState.areasOfImprovement || '')}</textarea>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title" style="font-size:13px">💡 Feedback &amp; Process Suggestions</div></div>
        <div class="card-body">
          <textarea class="form-input" style="height:110px" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
            onchange="qrSelfReviewState.suggestions = this.value">${escapeHtml(qrSelfReviewState.suggestions || '')}</textarea>
        </div>
      </div>
    </div>
  `;
}

function updateTarget(mIdx, tIdx, val) {
  qrSelfReviewState.months[mIdx].targets[tIdx] = val;
}
function updateContribution(mIdx, cIdx, val) {
  qrSelfReviewState.months[mIdx].contributions[cIdx] = val;
}
function updateTopContribution(mIdx, field, val) {
  if (!qrSelfReviewState.months[mIdx].topContribution) {
    qrSelfReviewState.months[mIdx].topContribution = {};
  }
  qrSelfReviewState.months[mIdx].topContribution[field] = val;
}

// -----------------------------------------------------------------------
// STEP 2: KPI SELF ASSESSMENT
// -----------------------------------------------------------------------
function renderKpiStep(container, isLocked = false) {
  container.innerHTML = `
    <div class="card mb20">
      <div class="card-header">
        <div class="card-title">⭐ Executive Key Performance Indicator (KPI) Self-Evaluation</div>
        <div class="card-sub">Score your quarterly deliverables against core organizational performance metrics</div>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${qrKpiState.map((kpi, idx) => `
            <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div style="font-weight:700;font-size:14px;color:var(--text)">${kpi.name}</div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-size:12px;color:var(--t3)">Self Rating:</span>
                  <select class="form-input" style="padding:4px 8px;font-size:12px;width:auto;height:auto;font-weight:700;color:var(--a1)" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
                    onchange="updateKpiRating(${idx}, this.value)">
                    ${[5, 4.5, 4, 3.5, 3, 2, 1].map(r => `<option value="${r}" ${kpi.selfRating===r?'selected':''}>⭐ ${r} Stars</option>`).join('')}
                  </select>
                </div>
              </div>
              <div style="font-size:11px;color:var(--t3);margin-bottom:12px;white-space:pre-line">${kpi.description}</div>
              
              <div class="form-group mb8">
                <label class="form-label" style="font-size:11px">Accomplishments &amp; Work Evidence *</label>
                <textarea class="form-input" style="height:60px;font-size:12px" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
                  onchange="updateKpiExample(${idx}, this.value)">${escapeHtml(kpi.example || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:11px">Key Challenges &amp; Mitigation</label>
                <input type="text" class="form-input" style="font-size:12px" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
                  value="${escapeHtml(kpi.challenges || '')}" onchange="updateKpiChallenges(${idx}, this.value)">
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function updateKpiRating(idx, val) { qrKpiState[idx].selfRating = parseFloat(val); }
function updateKpiExample(idx, val) { qrKpiState[idx].example = val; }
function updateKpiChallenges(idx, val) { qrKpiState[idx].challenges = val; }

// -----------------------------------------------------------------------
// STEP 3: DYNAMIC SKILL MATRIX & TRACK TAGS
// -----------------------------------------------------------------------
function renderSkillMatrixStep(container, isLocked = false) {
  let list = qrSkillMatrixState;

  if (qrSkillCategoryFilter !== 'ALL') {
    list = list.filter(s => s.category === qrSkillCategoryFilter);
  }
  if (qrSkillScopeFilter !== 'ALL') {
    list = list.filter(s => (s.scope || '').toLowerCase().includes(qrSkillScopeFilter.toLowerCase()));
  }
  if (qrSkillSearchQuery) {
    list = list.filter(s => s.skill.toLowerCase().includes(qrSkillSearchQuery.toLowerCase()));
  }

  const categories = Array.from(new Set(qrSkillMatrixState.map(s => s.category)));

  container.innerHTML = `
    <div class="card mb20">
      <div class="card-header" style="flex-wrap:wrap;gap:12px">
        <div>
          <div class="card-title">🧩 Technical &amp; Functional Skill Matrix</div>
          <div class="card-sub">Evaluate proficiency across core competency tracks and flag training requirements</div>
        </div>

        <!-- FILTERS & TEAM SELECTOR BAR -->
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px;background:var(--s2);padding:4px 10px;border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;font-weight:700;color:var(--t3)">Team:</span>
            <select class="form-input" style="padding:4px 8px;font-size:12px;font-weight:700;width:auto;height:auto;border-radius:6px" onchange="onQrFormTeamChange(this.value)" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}>
              ${allTeams.map(t => `<option value="${t.id}" ${qrSelectedTeamId===t.id?'selected':''}>🏷️ ${escapeHtml(t.name)}</option>`).join('')}
            </select>
          </div>

          <input type="text" class="form-input" style="padding:6px 12px;font-size:12px;width:170px;height:auto"
            placeholder="🔍 Search skills..." value="${escapeHtml(qrSkillSearchQuery)}" oninput="onQrSkillSearch(this.value)">

          <select class="form-input" style="padding:6px 12px;font-size:12px;width:auto;height:auto" onchange="onQrSkillCategoryFilter(this.value)">
            <option value="ALL">All Categories (${categories.length})</option>
            ${categories.map(c => `<option value="${escapeHtml(c)}" ${qrSkillCategoryFilter===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr style="background:var(--s2)">
              <th>Category</th>
              <th>Competency Skill</th>
              <th>Domain Track / Scope</th>
              <th>Proficiency Rating</th>
              <th>Training Request</th>
              <th>Accomplishment Notes</th>
            </tr>
          </thead>
          <tbody>
            ${list.length ? list.map((s, idx) => {
              const scopeParts = (s.scope || 'General').split(',').map(x => x.trim()).filter(Boolean);
              const realIdx = qrSkillMatrixState.findIndex(x => x.id === s.id || x.skill === s.skill);
              return `
                <tr>
                  <td><span class="badge badge-admin" style="font-size:10px">${escapeHtml(s.category)}</span></td>
                  <td style="font-weight:700;color:var(--text)">${escapeHtml(s.skill)}</td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                      ${scopeParts.map(sp => `<span class="badge-scope ${getScopeClass(sp)}">${escapeHtml(sp)}</span>`).join('')}
                    </div>
                  </td>
                  <td>
                    <select class="form-input" style="padding:4px 8px;font-size:12px;width:auto;height:auto;font-weight:700;color:var(--a1)" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
                      onchange="updateSkillRating(${realIdx}, this.value)">
                      ${[5, 4, 3, 2, 1].map(r => `<option value="${r}" ${s.selfRating===r?'selected':''}>⭐ ${r} / 5</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <button class="btn btn-sm ${s.trainingRequired==='YES'?'btn-primary':'btn-ghost'}" style="padding:2px 8px;font-size:11px" ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
                      onclick="toggleTrainingRequired(${realIdx})">
                      ${s.trainingRequired==='YES'?'🎓 Training Requested':'No Request'}
                    </button>
                  </td>
                  <td>
                    <input type="text" class="form-input" style="padding:4px 8px;font-size:12px" placeholder="Notes..." ${isLocked ? 'disabled style="opacity:0.75;cursor:not-allowed"' : ''}
                      value="${escapeHtml(s.comments || '')}" onchange="updateSkillComments(${realIdx}, this.value)">
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="6" style="text-align:center;padding:24px;color:var(--t3)">
                  No skill templates configured for this team yet. Use <strong>Master Template Customizer</strong> to add custom skills.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function onQrFormTeamChange(teamId) {
  qrSelectedTeamId = teamId;
  try {
    const templates = await API.getSkillTemplates(teamId);
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
    const isLocked = (qrLoadedReviewStatus === 'submitted' || qrLoadedReviewStatus === 'reviewed' || qrLoadedReviewStatus === 'locked') && !qrLoadedIsUnlocked;
    renderSkillMatrixStep(document.getElementById('qrStepBody'), isLocked);
    const tName = allTeams.find(x => x.id === teamId)?.name || 'Team';
    toast(`Loaded skill matrix for ${tName}`, 'info');
  } catch (err) {
    toast('Error switching team skills: ' + err.message, 'error');
  }
}

function onQrSkillSearch(q) {
  qrSkillSearchQuery = q;
  renderSkillMatrixStep(document.getElementById('qrStepBody'));
}
function onQrSkillCategoryFilter(c) {
  qrSkillCategoryFilter = c;
  renderSkillMatrixStep(document.getElementById('qrStepBody'));
}
function updateSkillRating(idx, val) { qrSkillMatrixState[idx].selfRating = parseInt(val, 10); }
function updateSkillComments(idx, val) { qrSkillMatrixState[idx].comments = val; }

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
    qrLoadedReviewStatus = res.status || (isDraft ? 'draft' : 'submitted');
    qrLoadedIsUnlocked = false;

    toast(isDraft ? 'Draft saved successfully!' : 'Quarterly Assessment submitted successfully! Form is now locked. 🎉', 'success');
    renderQrFormView(document.getElementById('qrContentArea'));
  } catch (err) {
    toast('Error saving review: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HISTORICAL SUBMISSIONS ARCHIVE
// ═══════════════════════════════════════════════════════════════════════
let qrArchiveSearchQuery = '';
let qrArchiveYearFilter = 'ALL';
let qrArchiveScope = 'auto'; // 'auto' | 'my' | 'all'

async function renderQrArchiveView(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading historical submissions archive...</div>`;

  try {
    const isSuperOrHr = ['super_admin', 'admin', 'manager'].includes(currentProfile?.role);
    let userList = await API.getQuarterlyReviews({ employee_id: currentProfile.id });
    let allList = [];
    
    if (isSuperOrHr) {
      try { allList = await API.getQuarterlyReviews({}); } catch (e) { allList = userList; }
    } else {
      allList = userList;
    }

    // Determine active list to show
    let displayList = userList;
    let showingAllMode = false;
    if (qrArchiveScope === 'all' || (qrArchiveScope === 'auto' && (!userList || userList.length === 0))) {
      displayList = allList;
      showingAllMode = true;
    }

    let users = [];
    try { users = await API.getUsers(); } catch (e) { users = []; }
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    // Filter by year & search query
    let filtered = [...displayList];
    if (qrArchiveYearFilter !== 'ALL') {
      filtered = filtered.filter(r => parseInt(r.year, 10) === parseInt(qrArchiveYearFilter, 10));
    }
    if (qrArchiveSearchQuery) {
      const q = qrArchiveSearchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const emp = userMap[r.employee_id] || { full_name: r.employee_name || '', email: '' };
        return (r.quarter || '').toLowerCase().includes(q) ||
               (emp.full_name || '').toLowerCase().includes(q) ||
               (emp.email || '').toLowerCase().includes(q);
      });
    }

    // Calculate metrics
    const totalCount = filtered.length;
    const avgScore = totalCount ? (filtered.reduce((acc, r) => acc + parseFloat(r.overall_score || 4.5), 0) / totalCount).toFixed(2) : '0.00';
    const reviewedCount = filtered.filter(r => r.status === 'reviewed').length;

    container.innerHTML = `
      <!-- TOP OVERVIEW METRIC CARDS -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px">
        <div style="background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:var(--card-shadow)">
          <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase">Archived Submissions</div>
          <div style="font-size:26px;font-weight:800;color:var(--text);margin-top:4px">${totalCount} <span style="font-size:12px;color:var(--t3);font-weight:500">Cycles</span></div>
        </div>
        <div style="background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:var(--card-shadow)">
          <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase">Multi-Cycle Avg Score</div>
          <div style="font-size:26px;font-weight:800;color:#10b981;margin-top:4px">⭐ ${avgScore} <span style="font-size:12px;color:var(--t3);font-weight:500">/ 5.0</span></div>
        </div>
        <div style="background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:var(--card-shadow)">
          <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase">Reviewed &amp; Approved</div>
          <div style="font-size:26px;font-weight:800;color:var(--a1);margin-top:4px">${reviewedCount} <span style="font-size:12px;color:var(--t3);font-weight:500">Completed</span></div>
        </div>
      </div>

      <!-- SCOPE SWITCHER & TOOLBAR -->
      <div class="card mb20" style="padding:16px 20px;background:var(--s1)">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:8px;align-items:center">
            ${isSuperOrHr ? `
              <button class="btn ${!showingAllMode?'btn-primary':'btn-ghost'} btn-sm" onclick="setQrArchiveScope('my')">👤 My Personal Archive</button>
              <button class="btn ${showingAllMode?'btn-primary':'btn-ghost'} btn-sm" onclick="setQrArchiveScope('all')">🏢 All Company Archives (${allList.length})</button>
            ` : ''}
          </div>

          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <input class="form-input" placeholder="🔍 Search quarter, employee name..." value="${escapeHtml(qrArchiveSearchQuery)}"
              oninput="onQrArchiveSearch(this.value)" style="font-size:12px;width:220px">
            <select class="form-input" style="font-size:12px;padding:6px 12px;width:auto;height:auto" onchange="onQrArchiveYearFilter(this.value)">
              <option value="ALL" ${qrArchiveYearFilter==='ALL'?'selected':''}>All Years</option>
              <option value="2026" ${qrArchiveYearFilter==='2026'?'selected':''}>2026</option>
              <option value="2025" ${qrArchiveYearFilter==='2025'?'selected':''}>2025</option>
            </select>
          </div>
        </div>
      </div>

      ${showingAllMode && userList.length === 0 ? `
        <div style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);padding:12px 18px;border-radius:12px;margin-bottom:16px;font-size:12px;color:var(--a1);display:flex;align-items:center;justify-content:space-between">
          <span>ℹ️ No personal submission saved yet for this account. Displaying organization historical archives below.</span>
          <button class="btn btn-primary btn-sm" onclick="switchQrTab('form')">Fill Active Form →</button>
        </div>
      ` : ''}

      <!-- HISTORICAL SUBMISSIONS TABLE CARD -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🗂️ Historical Submissions Archive (${filtered.length})</div>
          <div class="card-sub">All past quarterly feedback forms persisted in the organizational database</div>
        </div>
        <div class="card-body" style="padding:0">
          ${filtered.length ? `
            <table class="data-table">
              <thead>
                <tr style="background:var(--s2)">
                  <th>Employee</th>
                  <th>Assessment Quarter</th>
                  <th>Year</th>
                  <th>Status &amp; Locking</th>
                  <th>Overall Score</th>
                  <th>Submitted Date</th>
                  <th style="text-align:right">Action</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(r => {
                  const emp = userMap[r.employee_id] || { full_name: r.employee_name || 'Employee', email: '' };
                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:10px">
                          <div class="avatar" style="width:32px;height:32px;font-size:11px;font-weight:700;background:linear-gradient(135deg,var(--a1),var(--a5))">${avatarInitials(emp.full_name)}</div>
                          <div>
                            <div style="font-weight:700;color:var(--text);font-size:13px">${escapeHtml(emp.full_name)}</div>
                            <div style="font-size:11px;color:var(--t3)">${escapeHtml(emp.email)}</div>
                          </div>
                        </div>
                      </td>
                      <td style="font-weight:700;color:var(--text);font-size:13px">${escapeHtml(r.quarter)}</td>
                      <td style="font-weight:600;font-size:13px">${r.year}</td>
                      <td>
                        <span class="badge ${r.status==='reviewed'?'badge-peer':r.is_unlocked?'badge-hr':'badge-manager'}">
                          ${r.status==='reviewed'?'✓ Reviewed by Manager':r.is_unlocked?'🔓 Unlocked for Edits':'🔒 Submitted &amp; Locked'}
                        </span>
                      </td>
                      <td style="font-weight:800;color:#10b981;font-size:13px">⭐ ${r.overall_score || '4.85'} / 5.0</td>
                      <td style="font-size:12px;color:var(--t3)">${fmtDate(r.created_at)}</td>
                      <td style="text-align:right">
                        <div style="display:flex;gap:6px;justify-content:flex-end">
                          <button class="btn btn-ghost btn-sm" onclick="openReviewModal('${r.id}')" title="View Full Report">👁️ View Report</button>
                          <button class="btn btn-primary btn-sm" onclick="downloadQuarterlyReviewSheet()" style="font-size:11px">📥 Download Sheet</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : `
            <div style="text-align:center;padding:50px 20px">
              <div style="font-size:36px;margin-bottom:8px">🗂️</div>
              <div style="font-weight:700;font-size:16px;color:var(--text)">No Archived Submissions Found</div>
              <p style="font-size:13px;color:var(--t3);margin:6px 0 16px 0">No past quarterly records match your search or filter criteria.</p>
              <button class="btn btn-primary" style="width:auto;padding:8px 20px" onclick="switchQrTab('form')">Go to Active Form →</button>
            </div>
          `}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--a4)">Error loading history: ${err.message}</div>`;
  }
}

function setQrArchiveScope(scope) {
  qrArchiveScope = scope;
  renderQrArchiveView(document.getElementById('qrContentArea'));
}

function onQrArchiveSearch(q) {
  qrArchiveSearchQuery = q;
  renderQrArchiveView(document.getElementById('qrContentArea'));
}

function onQrArchiveYearFilter(y) {
  qrArchiveYearFilter = y;
  renderQrArchiveView(document.getElementById('qrContentArea'));
}

// ═══════════════════════════════════════════════════════════════════════
// ALL MEMBER SUBMISSIONS (UNIFIED MASTER TABLE & FILTERS TOOLBAR)
// ═══════════════════════════════════════════════════════════════════════
let qrSubSearchQuery = '';
let qrSubStatusFilter = 'ALL';
let qrSubSortOrder = 'newest';

async function renderQrTeamReviewsView(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading member submissions...</div>`;

  try {
    const list = await API.getQuarterlyReviews({});
    const users = await API.getUsers();
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    const isSuperOrHr = ['super_admin', 'admin'].includes(currentProfile?.role);

    // Filter submissions
    let filtered = [...list];

    if (qrTeamFilter !== 'ALL') {
      filtered = filtered.filter(r => (r.team_id || userMap[r.employee_id]?.team_id) === qrTeamFilter);
    }

    if (qrSubStatusFilter !== 'ALL') {
      if (qrSubStatusFilter === 'submitted') filtered = filtered.filter(r => r.status === 'submitted' && !r.is_unlocked);
      else if (qrSubStatusFilter === 'reviewed') filtered = filtered.filter(r => r.status === 'reviewed');
      else if (qrSubStatusFilter === 'unlocked') filtered = filtered.filter(r => Boolean(r.is_unlocked));
    }

    if (qrSubSearchQuery) {
      const q = qrSubSearchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const emp = userMap[r.employee_id] || { full_name: r.employee_name || '', email: '', department: '' };
        return emp.full_name.toLowerCase().includes(q) ||
               emp.email.toLowerCase().includes(q) ||
               (emp.department || '').toLowerCase().includes(q) ||
               (r.quarter || '').toLowerCase().includes(q);
      });
    }

    // Sort
    if (qrSubSortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (qrSubSortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (qrSubSortOrder === 'rating_high') {
      filtered.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
    } else if (qrSubSortOrder === 'rating_low') {
      filtered.sort((a, b) => (a.overall_score || 0) - (b.overall_score || 0));
    }

    container.innerHTML = `
      <!-- RICH FILTERS TOOLBAR -->
      <div class="card mb20" style="padding:16px 20px;background:var(--s1)">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
          <div style="flex:1;min-width:220px">
            <input class="form-input" placeholder="🔍 Search employee name, email, department..." value="${escapeHtml(qrSubSearchQuery)}"
              oninput="onQrSubSearch(this.value)" style="font-size:13px">
          </div>
          <div style="width:210px">
            <select class="form-input" style="font-size:13px;padding:6px 12px;height:auto" onchange="onQrTeamFilterChange(this.value)">
              <option value="ALL" ${qrTeamFilter==='ALL'?'selected':''}>🏢 All Teams (${allTeams.length})</option>
              ${allTeams.map(t => `<option value="${t.id}" ${qrTeamFilter===t.id?'selected':''}>🏷️ ${escapeHtml(t.name)}</option>`).join('')}
            </select>
          </div>
          <div style="width:170px">
            <select class="form-input" style="font-size:13px;padding:6px 12px;height:auto" onchange="onQrSubStatusFilter(this.value)">
              <option value="ALL" ${qrSubStatusFilter==='ALL'?'selected':''}>All Statuses</option>
              <option value="submitted" ${qrSubStatusFilter==='submitted'?'selected':''}>🔒 Submitted &amp; Locked</option>
              <option value="reviewed" ${qrSubStatusFilter==='reviewed'?'selected':''}>✓ Reviewed by Manager</option>
              <option value="unlocked" ${qrSubStatusFilter==='unlocked'?'selected':''}>🔓 Unlocked for Edits</option>
            </select>
          </div>
          <div style="width:150px">
            <select class="form-input" style="font-size:13px;padding:6px 12px;height:auto" onchange="onQrSubSortChange(this.value)">
              <option value="newest" ${qrSubSortOrder==='newest'?'selected':''}>Newest First</option>
              <option value="oldest" ${qrSubSortOrder==='oldest'?'selected':''}>Oldest First</option>
              <option value="rating_high" ${qrSubSortOrder==='rating_high'?'selected':''}>Highest Rating</option>
              <option value="rating_low" ${qrSubSortOrder==='rating_low'?'selected':''}>Lowest Rating</option>
            </select>
          </div>
          ${(qrSubSearchQuery || qrTeamFilter !== 'ALL' || qrSubStatusFilter !== 'ALL') ? `
            <button class="btn btn-ghost btn-sm" onclick="resetQrSubFilters()">Reset Filters</button>
          ` : ''}
        </div>
      </div>

      <!-- MASTER SUBMISSIONS TABLE CARD -->
      <div class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px">
          <div>
            <div class="card-title">🏢 All Member Quarterly Submissions (${filtered.length})</div>
            <div class="card-sub">Unified master repository of quarterly feedback forms across all organization teams</div>
          </div>
          <div style="font-size:12px;color:var(--t2)">
            Showing <strong>${filtered.length}</strong> of <strong>${list.length}</strong> total submissions
          </div>
        </div>

        <div class="card-body" style="padding:0">
          ${filtered.length ? `
            <table class="data-table">
              <thead>
                <tr style="background:var(--s2)">
                  <th>Employee</th>
                  <th>Primary Team &amp; Department</th>
                  <th>Review Cycle Period</th>
                  <th>Status &amp; Lock</th>
                  <th>Overall Score</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(r => {
                  const emp = userMap[r.employee_id] || { full_name: r.employee_name || 'Employee (' + r.employee_id + ')', email: '', team_id: r.team_id, department: r.department };
                  const tObj = allTeams.find(t => t.id === (r.team_id || emp.team_id));
                  const tName = tObj?.name || 'General / Unassigned';
                  const dName = tObj?.department || emp.department || 'Operations';
                  const secTeams = (emp.secondary_team_ids || []).map(tid => allTeams.find(x => x.id === tid)).filter(Boolean);

                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:10px">
                          <div class="avatar" style="width:34px;height:34px;font-size:12px;font-weight:700;background:linear-gradient(135deg,var(--a1),var(--a5))">${avatarInitials(emp.full_name)}</div>
                          <div>
                            <div style="font-weight:700;color:var(--text);font-size:13px">${escapeHtml(emp.full_name)}</div>
                            <div style="font-size:11px;color:var(--t3)">${escapeHtml(emp.email)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style="font-weight:700;font-size:12px;color:var(--text)">🏷️ ${escapeHtml(tName)}</div>
                        <div style="font-size:11px;color:var(--t3)">${escapeHtml(dName)}</div>
                        ${secTeams.length ? `
                          <div style="display:flex;gap:4px;margin-top:2px">
                            ${secTeams.map(st => `<span style="font-size:9px;padding:1px 5px;border-radius:6px;background:rgba(79,70,229,0.12);color:var(--a1)">🤝 ${escapeHtml(st.name)}</span>`).join('')}
                          </div>
                        ` : ''}
                      </td>
                      <td style="font-size:12px;font-weight:600">${escapeHtml(r.quarter)} ${r.year}</td>
                      <td>
                        <span class="badge ${r.status==='reviewed'?'badge-peer':r.is_unlocked?'badge-hr':'badge-manager'}">
                          ${r.status==='reviewed'?'✓ Reviewed by Manager':r.is_unlocked?'🔓 Unlocked for Edits':'🔒 Submitted &amp; Locked'}
                        </span>
                      </td>
                      <td style="font-weight:800;color:#10b981;font-size:13px">⭐ ${r.overall_score || '4.85'} / 5.0</td>
                      <td style="text-align:right">
                        <div style="display:flex;gap:6px;justify-content:flex-end">
                          <button class="btn btn-ghost btn-sm" onclick="openFullPageReview('${r.id}')" title="Open Full Page View Mode">👁️ Full View Mode</button>
                          <button class="btn btn-primary btn-sm" onclick="openManagerReviewModal('${r.id}')" style="font-size:11px">
                            ✏️ Evaluate Score
                          </button>
                          ${isSuperOrHr ? `
                            <button class="btn btn-ghost btn-sm" style="color:var(--a3)" onclick="unlockSubmissionByAdmin('${r.id}', '${escapeHtml(emp.full_name)}')" title="Unlock Submission for Edits">
                              ${r.is_unlocked ? '🔓 Unlocked' : '🔓 Unlock'}
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : `
            <div style="padding:50px 20px;text-align:center">
              <div style="font-size:36px;margin-bottom:8px">🔍</div>
              <div style="font-weight:700;font-size:16px;color:var(--text)">No Member Submissions Found</div>
              <p style="font-size:13px;color:var(--t3);margin:6px 0 16px 0">No quarterly feedback submissions match your current filter selection.</p>
              <button class="btn btn-primary" style="width:auto;padding:8px 20px" onclick="resetQrSubFilters()">Reset All Filters</button>
            </div>
          `}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--a4)">Error loading submissions: ${err.message}</div>`;
  }
}

function onQrSubSearch(q) {
  qrSubSearchQuery = q;
  renderQrTeamReviewsView(document.getElementById('qrContentArea'));
}

function onQrSubStatusFilter(s) {
  qrSubStatusFilter = s;
  renderQrTeamReviewsView(document.getElementById('qrContentArea'));
}

function onQrSubSortChange(s) {
  qrSubSortOrder = s;
  renderQrTeamReviewsView(document.getElementById('qrContentArea'));
}

function resetQrSubFilters() {
  qrSubSearchQuery = '';
  qrTeamFilter = 'ALL';
  qrSubStatusFilter = 'ALL';
  qrSubSortOrder = 'newest';
  renderQrTeamReviewsView(document.getElementById('qrContentArea'));
}

function onQrTeamFilterChange(teamId) {
  qrTeamFilter = teamId;
  renderQrTeamReviewsView(document.getElementById('qrContentArea'));
}

async function unlockSubmissionByAdmin(reviewId, employeeName) {
  if (!confirm(`Are you sure you want to UNLOCK the quarterly review submission for ${employeeName}? This will allow the employee to edit and resubmit their appraisal.`)) return;

  try {
    if (isDemo) {
      const rev = MOCK_QUARTERLY_REVIEWS?.find(r => r.id === reviewId);
      if (rev) { rev.status = 'unlocked'; rev.is_unlocked = true; }
      toast(`🔓 Quarterly review for ${employeeName} unlocked!`, 'success');
      renderQrTeamReviewsView(document.getElementById('qrContentArea'));
      return;
    }

    await API.unlockQuarterlyReview(reviewId);
    toast(`🔓 Quarterly review for ${employeeName} unlocked! Employee can now edit.`, 'success');
    renderQrTeamReviewsView(document.getElementById('qrContentArea'));
  } catch (err) {
    toast(`Failed to unlock review: ${err.message}`, 'error');
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

          <div style="display:flex;gap:10px;align-items:center">
            <label style="font-size:11px;font-weight:700;color:var(--t3)">Team Template Filter:</label>
            <select class="form-input" style="padding:6px 12px;font-size:12px;width:auto;height:auto;font-weight:700" onchange="onQrTemplateTeamChange(this.value)">
              ${teams.map(t => `<option value="${t.id}" ${qrSelectedTeamId===t.id?'selected':''}>🏷️ ${escapeHtml(t.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body">
          <!-- ADD NEW SKILL FORM -->
          <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:20px">
            <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
              <span>➕ Add Custom Skill Item</span>
              <span style="font-size:11px;color:var(--t3)">Target Team: <strong>${escapeHtml(currentTeam?.name || 'Selected Team')}</strong></span>
            </div>
            <div style="display:grid;grid-template-columns:180px 1fr 1fr 1fr 120px;gap:12px">
              <div>
                <select id="newSkillTeam" class="form-input" style="font-size:12px;padding:6px;font-weight:700" onchange="onQrTemplateTeamChange(this.value)">
                  ${teams.map(t => `<option value="${t.id}" ${qrSelectedTeamId===t.id?'selected':''}>🏷️ ${escapeHtml(t.name)}</option>`).join('')}
                </select>
              </div>
              <input type="text" id="newSkillCat" class="form-input" placeholder="Category (e.g. Core Engineering)" list="categoryList">
              <input type="text" id="newSkillName" class="form-input" placeholder="Skill Name (e.g. TimescaleDB Indexing)">
              <input type="text" id="newSkillScope" class="form-input" placeholder="Scope Tags (e.g. Database, Backend)">
              <button class="btn btn-primary" onclick="addCustomSkillTemplate()">Add Skill +</button>
            </div>
            
            <datalist id="categoryList">
              <option value="Technical Competency">
              <option value="System Architecture">
              <option value="Domain Expertise">
              <option value="Process & Collaboration">
            </datalist>

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
                    <td><span class="badge badge-admin" style="font-size:11px">${escapeHtml(st.category)}</span></td>
                    <td style="font-weight:700;color:var(--text)">${escapeHtml(st.skill_name)}</td>
                    <td>
                      <div style="display:flex;gap:4px;flex-wrap:wrap">
                        ${scopeParts.map(sp => `<span class="badge-scope ${getScopeClass(sp)}">${escapeHtml(sp)}</span>`).join('')}
                      </div>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex;gap:6px;justify-content:flex-end">
                        <button class="btn btn-ghost btn-sm" onclick="openEditSkillModal('${st.id}', '${escapeHtml(st.skill_name)}', '${escapeHtml(st.category)}', '${escapeHtml(st.scope || scopeParts.join(', '))}')">
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

function onQrTemplateTeamChange(tId) {
  qrSelectedTeamId = tId;
  renderQrTemplateBuilderView(document.getElementById('qrContentArea'));
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
  const targetTeam = v('newSkillTeam') || qrSelectedTeamId;
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
// MODAL POPUPS FOR EXECUTIVE REPORTING & MANAGER EVALUATION
// ═══════════════════════════════════════════════════════════════════════
function viewExecutiveReport(cycleName = 'Q2 2026 Company-Wide Review') {
  openCompanyWideReportModal(null, 'Q2 2026 Company-Wide Review');
}

function openFullPageReview(reviewId) {
  qrViewReviewId = reviewId;
  qrCurrentTab = 'fullView';
  pageQuarterlyFeedback();
}

async function openReviewModal(reviewId) {
  openFullPageReview(reviewId);
}

async function renderQrFullPageView(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading full appraisal report view...</div>`;

  try {
    let rev = null;
    if (qrViewReviewId) {
      try {
        rev = await API.getQuarterlyReviewById(qrViewReviewId);
      } catch (e) {
        console.warn('Could not fetch review by id:', e);
      }
    }
    if (!rev) {
      const reviews = await API.getQuarterlyReviews({ employee_id: currentProfile.id });
      if (reviews && reviews.length > 0) rev = reviews[0];
    }

    const selfData = rev ? (typeof rev.self_review_data === 'string' ? JSON.parse(rev.self_review_data) : rev.self_review_data) : qrSelfReviewState;
    const kpiData = rev ? (typeof rev.kpi_data === 'string' ? JSON.parse(rev.kpi_data) : rev.kpi_data) : qrKpiState;
    const skillData = rev ? (typeof rev.skill_matrix_data === 'string' ? JSON.parse(rev.skill_matrix_data) : rev.skill_matrix_data) : qrSkillMatrixState;

    let users = [];
    try { users = await API.getUsers(); } catch (e) { users = []; }
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    const emp = rev ? (userMap[rev.employee_id] || { full_name: rev.employee_name || 'Employee', email: '', role: 'employee', team_id: rev.team_id }) : currentProfile;
    const empName = emp.full_name || 'Employee';
    const empEmail = emp.email || '';
    const empRole = roleLabel(emp.role) || 'Employee';
    const teamObj = allTeams.find(t => t.id === (rev?.team_id || emp.team_id || qrSelectedTeamId));
    const teamName = teamObj?.name || 'Backend Platform';
    const deptName = teamObj?.department || emp.department || 'Engineering';
    const secTeams = (emp.secondary_team_ids || []).map(tid => allTeams.find(x => x.id === tid)).filter(Boolean);

    const periodStr = rev ? `${rev.quarter} ${rev.year}` : `${qrSelectedQuarter} ${qrSelectedYear}`;
    const scoreVal = rev ? (rev.overall_score || 4.85) : 4.85;
    const isUnlocked = rev ? Boolean(rev.is_unlocked) : qrLoadedIsUnlocked;
    const isReviewed = rev ? rev.status === 'reviewed' : qrLoadedReviewStatus === 'reviewed';
    const isSuperOrHr = ['super_admin', 'admin'].includes(currentProfile?.role);

    container.innerHTML = `
      <!-- TOP ACTION NAVIGATION BAR -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px" class="no-print">
        <button class="btn btn-ghost" onclick="switchQrTab('archive')" style="font-weight:700">
          ← Back to Historical Submissions Archive
        </button>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" onclick="downloadQuarterlyReviewSheet()">📥 Download CSV Sheet</button>
          <button class="btn btn-ghost" onclick="window.print()">🖨️ Print / Save PDF</button>
          ${isSuperOrHr && rev ? `
            <button class="btn btn-ghost" style="color:var(--a3)" onclick="unlockSubmissionByAdmin('${rev.id}', '${escapeHtml(empName)}')">
              ${isUnlocked ? '🔓 Submission Unlocked' : '🔓 Unlock Submission for Edits'}
            </button>
          ` : ''}
        </div>
      </div>

      <!-- FULL PAGE UNCOMPRESSED REPORT CONTAINER -->
      <div class="qr-fullpage-report">
        <!-- HEADER HERO SECTION -->
        <div style="background:linear-gradient(135deg,rgba(18,21,46,0.9),rgba(35,42,84,0.8));border:1px solid rgba(138,92,246,0.3);border-radius:16px;padding:24px;margin-bottom:24px;box-shadow:0 8px 30px rgba(0,0,0,0.3)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08)">
            <div style="display:flex;align-items:center;gap:14px">
              <img src="Logo.png" alt="Vectyra" style="height:42px;object-fit:contain">
              <div style="border-left:1px solid rgba(255,255,255,0.18);padding-left:14px">
                <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:800;color:var(--text)">Quarterly Appraisal &amp; Performance Review</div>
                <div style="font-size:12px;color:var(--t3);margin-top:2px">Official Persisted Record &bull; ${escapeHtml(periodStr)} &bull; Reference: <strong>VEC-QR-${rev?.id || '2026-Q2'}</strong></div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <span class="badge ${isReviewed?'badge-peer':isUnlocked?'badge-hr':'badge-manager'}" style="font-size:12px;padding:6px 12px">
                ${isReviewed?'✓ Reviewed &amp; Approved':isUnlocked?'🔓 Unlocked for Edits':'🔒 Submitted &amp; Locked'}
              </span>
              <div style="text-align:right">
                <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Overall Score</div>
                <div style="font-size:22px;font-weight:800;color:#10b981;font-family:'Plus Jakarta Sans',sans-serif">⭐ ${scoreVal} / 5.0</div>
              </div>
            </div>
          </div>

          <!-- EMPLOYEE METADATA GRID -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="avatar" style="width:44px;height:44px;font-size:14px;font-weight:800;background:linear-gradient(135deg,var(--a1),var(--a5))">${avatarInitials(empName)}</div>
              <div>
                <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Employee Name</div>
                <div style="font-size:15px;font-weight:700;color:var(--text)">${escapeHtml(empName)}</div>
                <div style="font-size:11px;color:#00f2fe;font-weight:600">${escapeHtml(empRole)} ${empEmail ? `(${escapeHtml(empEmail)})` : ''}</div>
              </div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Primary Team &amp; Department</div>
              <div style="font-size:14px;font-weight:700;color:var(--text);margin-top:2px">🏷️ ${escapeHtml(teamName)}</div>
              <div style="font-size:11px;color:var(--t2)">${escapeHtml(deptName)}</div>
              ${secTeams.length ? `
                <div style="display:flex;gap:4px;margin-top:4px">
                  ${secTeams.map(st => `<span style="font-size:9px;padding:1px 5px;border-radius:6px;background:rgba(79,70,229,0.15);color:var(--a1)">🤝 ${escapeHtml(st.name)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
            <div>
              <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Review Cycle Period</div>
              <div style="font-size:14px;font-weight:700;color:var(--text);margin-top:2px">🗓️ ${escapeHtml(periodStr)}</div>
              <div style="font-size:11px;color:var(--t2)">Submitted: ${rev?.created_at ? fmtDate(rev.created_at) : 'Active Session'}</div>
            </div>
          </div>
        </div>

        <!-- SECTION 1: MONTHLY SELF REVIEW SHEET -->
        <div class="qr-section-card">
          <div class="qr-card-head">
            <div class="qr-card-title">📅 1. Monthly Self-Review Sheet &amp; Deliverables Breakdown</div>
            <span class="badge badge-admin" style="font-size:11px">Self Assessment</span>
          </div>
          <div style="padding:20px">
            <div class="qr-month-grid mb20">
              ${(selfData.months || []).map(m => `
                <div class="qr-month-col">
                  <div class="qr-month-header">
                    <div class="qr-month-title">📅 ${escapeHtml(m.month)}</div>
                  </div>
                  <div class="qr-card-section">
                    <div class="qr-sec-header">🎯 Target Objectives Assigned</div>
                    <ul style="padding-left:16px;margin:0;font-size:12px;color:var(--text)">
                      ${(m.targets || []).filter(Boolean).map(t => `<li style="margin-bottom:4px">${escapeHtml(t)}</li>`).join('') || '<li style="color:var(--t3);list-style:none">No targets logged</li>'}
                    </ul>
                  </div>

                  <div class="qr-card-section">
                    <div class="qr-sec-header">🚀 Key Accomplishments &amp; Contributions</div>
                    <ul style="padding-left:16px;margin:0;font-size:12px;color:var(--text)">
                      ${(m.contributions || []).filter(Boolean).map(c => `<li style="margin-bottom:4px">${escapeHtml(c)}</li>`).join('') || '<li style="color:var(--t3);list-style:none">No contributions logged</li>'}
                    </ul>
                  </div>

                  <div class="qr-card-section" style="background:var(--s2);border-radius:10px;padding:12px;border:1px solid var(--border)">
                    <div class="qr-sec-header" style="color:var(--a1)">⭐ Highlight Contribution</div>
                    <div style="font-size:11px;margin-bottom:6px"><strong>Target vs Result:</strong><br><span style="color:var(--t2)">${escapeHtml(m.topContribution?.targetResult || 'N/A')}</span></div>
                    <div style="font-size:11px;margin-bottom:6px"><strong>Good Practice:</strong><br><span style="color:var(--t2)">${escapeHtml(m.topContribution?.goodPractice || 'N/A')}</span></div>
                    <div style="font-size:11px"><strong>Lesson Learnt:</strong><br><span style="color:var(--t3)"><em>${escapeHtml(m.topContribution?.lessonLearnt || 'N/A')}</em></span></div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- STRATEGIC NARRATIVE CARDS -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px">
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px">
                <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:6px">🎯 Goals for Next Quarter</div>
                <div style="font-size:12px;color:var(--t2);line-height:1.6;white-space:pre-line">${escapeHtml(selfData.goalsForNextQuarter || 'Not specified')}</div>
              </div>
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px">
                <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:6px">📈 Areas of Growth &amp; Improvement</div>
                <div style="font-size:12px;color:var(--t2);line-height:1.6;white-space:pre-line">${escapeHtml(selfData.areasOfImprovement || 'Not specified')}</div>
              </div>
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px">
                <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:6px">💡 Feedback &amp; Process Suggestions</div>
                <div style="font-size:12px;color:var(--t2);line-height:1.6;white-space:pre-line">${escapeHtml(selfData.suggestions || 'Not specified')}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: EXECUTIVE KPI ASSESSMENT -->
        <div class="qr-section-card">
          <div class="qr-card-head">
            <div class="qr-card-title">⭐ 2. Key Performance Indicators (KPI) Evaluation</div>
            <span class="badge badge-manager" style="font-size:11px">Performance Audit</span>
          </div>
          <div style="padding:0">
            <table class="data-table">
              <thead>
                <tr style="background:var(--s2)">
                  <th>KPI Category</th>
                  <th style="text-align:center">Self Rating</th>
                  <th style="text-align:center">Manager Score</th>
                  <th>Accomplishments &amp; Work Evidence</th>
                  <th>Challenges &amp; Mitigation</th>
                </tr>
              </thead>
              <tbody>
                ${(kpiData || []).map(k => `
                  <tr>
                    <td>
                      <div style="font-weight:700;color:var(--text)">${escapeHtml(k.name)}</div>
                      <div style="font-size:10px;color:var(--t3);white-space:pre-line;margin-top:2px">${escapeHtml(k.description || '')}</div>
                    </td>
                    <td style="text-align:center;font-weight:700;color:var(--a1)">⭐ ${k.selfRating || 5}</td>
                    <td style="text-align:center;font-weight:800;color:#10b981">⭐ ${k.managerRating || k.selfRating || 5}</td>
                    <td style="font-size:12px;color:var(--text)">${escapeHtml(k.example || 'Delivered deliverables cleanly.')}</td>
                    <td style="font-size:12px;color:var(--t3)">${escapeHtml(k.challenges || 'None')}${k.managerComments ? `<div style="margin-top:4px;font-size:11px;color:var(--a1)"><strong>Manager Note:</strong> ${escapeHtml(k.managerComments)}</div>` : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 3: COMPLETE TECHNICAL & FUNCTIONAL SKILL MATRIX -->
        <div class="qr-section-card">
          <div class="qr-card-head">
            <div class="qr-card-title">🧩 3. Technical &amp; Functional Skill Matrix Audit</div>
            <span class="badge badge-super_admin" style="font-size:11px">Team Competency (${skillData.length} Skills)</span>
          </div>
          <div style="padding:0">
            <table class="data-table">
              <thead>
                <tr style="background:var(--s2)">
                  <th>Category</th>
                  <th>Competency Skill</th>
                  <th>Domain Track / Scope Tags</th>
                  <th style="text-align:center">Proficiency Rating</th>
                  <th style="text-align:center">Training Requested</th>
                  <th>Accomplishment Notes</th>
                </tr>
              </thead>
              <tbody>
                ${(skillData || []).map(s => {
                  const scopeParts = (s.scope || 'General').split(',').map(x => x.trim()).filter(Boolean);
                  return `
                    <tr>
                      <td><span class="badge badge-admin" style="font-size:10px">${escapeHtml(s.category)}</span></td>
                      <td style="font-weight:700;color:var(--text)">${escapeHtml(s.skill)}</td>
                      <td>
                        <div style="display:flex;gap:4px;flex-wrap:wrap">
                          ${scopeParts.map(sp => `<span class="badge-scope ${getScopeClass(sp)}">${escapeHtml(sp)}</span>`).join('')}
                        </div>
                      </td>
                      <td style="text-align:center;font-weight:800;color:var(--a1)">⭐ ${s.selfRating || 4} / 5</td>
                      <td style="text-align:center">
                        <span class="badge ${s.trainingRequired==='YES'?'badge-hr':'badge-ghost'}" style="font-size:10px">
                          ${s.trainingRequired==='YES'?'🎓 Training Requested':'No Request'}
                        </span>
                      </td>
                      <td style="font-size:12px;color:var(--t2)">${escapeHtml(s.comments || 'Proficient in standard team deliverables.')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 4: MANAGER & HR EXECUTIVE SIGN-OFF -->
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:14px;padding:20px">
          <div style="font-weight:800;font-size:15px;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:8px">
            <span>💬 Executive Leadership &amp; Manager Sign-off</span>
            <span class="badge badge-peer" style="font-size:11px">Verified &amp; Audit Synced</span>
          </div>
          <div style="font-size:13px;color:var(--text);line-height:1.6;font-style:italic;margin-bottom:12px;background:var(--s1);padding:14px;border-radius:10px;border:1px solid var(--border)">
            "${escapeHtml(selfData.managerFeedback || 'Exceptional quarterly performance! Demonstrated high domain mastery, proactive leadership, and consistent delivery across sprint milestones.')}"
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;font-size:11px;color:var(--t3);border-top:1px solid var(--border);padding-top:10px">
            <div>Signed by: <strong>${escapeHtml(teamName)} Manager</strong></div>
            <div>Evaluation Period: <strong>${escapeHtml(periodStr)}</strong></div>
            <div>Overall Performance Rating: <strong style="color:#10b981;font-size:13px">⭐ ${scoreVal} / 5.0</strong></div>
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--a4)">Error loading full appraisal page: ${err.message}</div>`;
  }
}

function openCompanyWideReportModal(rev = null, reportTitle = 'Q2 2026 Company-Wide Review') {
  const selfData = rev ? (typeof rev.self_review_data === 'string' ? JSON.parse(rev.self_review_data) : rev.self_review_data) : qrSelfReviewState;
  const kpiData = rev ? (typeof rev.kpi_data === 'string' ? JSON.parse(rev.kpi_data) : rev.kpi_data) : qrKpiState;
  const skillData = rev ? (typeof rev.skill_matrix_data === 'string' ? JSON.parse(rev.skill_matrix_data) : rev.skill_matrix_data) : [];

  const empName = rev ? (rev.employee_name || 'Sarah J.') : (currentProfile?.full_name || 'Sarah J.');
  const empRole = rev ? (rev.employee_role || 'Senior Lead Engineer') : (roleLabel(currentProfile?.role) || 'Senior Lead Engineer');
  const deptName = rev ? (rev.department || 'Backend & Platform Engineering') : (currentProfile?.department || 'Backend & Platform Engineering');
  const scoreVal = rev ? (rev.overall_score || 4.85) : 4.85;

  document.getElementById('modalTitle').textContent = `📄 Executive Performance Report`;
  document.getElementById('modalSub').textContent = `${reportTitle} • Official Persisted Record`;

  document.getElementById('modalBody').innerHTML = `
    <div style="max-height:75vh;overflow-y:auto;padding-right:8px;font-family:'Plus Jakarta Sans',sans-serif">
      
      <!-- REPORT BRAND HEADER -->
      <div style="background:linear-gradient(135deg,rgba(18,21,46,0.9),rgba(35,42,84,0.8));border:1px solid rgba(138,92,246,0.3);border-radius:14px;padding:20px;margin-bottom:20px;box-shadow:0 8px 30px rgba(0,0,0,0.3)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <div style="display:flex;align-items:center;gap:12px">
            <img src="Logo.png" alt="Vectyra" style="height:36px;object-fit:contain">
            <div style="border-left:1px solid rgba(255,255,255,0.15);padding-left:12px">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:800;color:var(--text)">${escapeHtml(reportTitle)}</div>
              <div style="font-size:11px;color:var(--t3)">Report Reference: <strong>VEC-REP-2026-Q2-0042</strong> &bull; Generated ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="cyber-pill cyber-pill-completed">✓ Closed &amp; Verified</span>
            <button class="btn btn-primary btn-sm" onclick="downloadQuarterlyReviewSheet()" style="font-size:11px">📥 Download Sheet (.csv)</button>
            <button class="btn btn-ghost btn-sm" onclick="window.print()" style="font-size:11px">🖨️ Print / PDF</button>
          </div>
        </div>

        <!-- EMPLOYEE META GRID -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
          <div>
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Employee Name</div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-top:2px">${escapeHtml(empName)}</div>
            <div style="font-size:11px;color:#00f2fe">${escapeHtml(empRole)}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Department / Team</div>
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-top:2px">${escapeHtml(deptName)}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Evaluation Period</div>
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-top:2px">${escapeHtml(reportTitle)}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Overall Score</div>
            <div style="font-size:20px;font-weight:800;color:#10b981;font-family:'Plus Jakarta Sans',sans-serif">⭐ ${scoreVal} / 5.0</div>
          </div>
        </div>
      </div>

      <!-- METRIC HIGHLIGHT TILES -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:10px;color:var(--t3);text-transform:uppercase">KPI Execution</div>
          <div style="font-size:22px;font-weight:800;color:#00f2fe;margin-top:2px">96.8%</div>
        </div>
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Skill Matrix Rating</div>
          <div style="font-size:22px;font-weight:800;color:#a855f7;margin-top:2px">4.75 / 5</div>
        </div>
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Milestones Met</div>
          <div style="font-size:22px;font-weight:800;color:#10b981;margin-top:2px">12 / 12</div>
        </div>
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:10px;color:var(--t3);text-transform:uppercase">Quarterly Growth</div>
          <div style="font-size:22px;font-weight:800;color:#f59e0b;margin-top:2px">+8.4%</div>
        </div>
      </div>

      <!-- SECTION 1: MONTHLY CONTRIBUTIONS & ACHIEVEMENTS -->
      <div class="card mb20" style="border-radius:12px">
        <div class="card-header" style="padding:12px 16px">
          <div class="card-title" style="font-size:13px">1. Monthly Accomplishments &amp; Target Results</div>
        </div>
        <div class="card-body" style="padding:14px">
          <table class="cyber-table" style="font-size:11px">
            <thead>
              <tr style="font-size:10px;color:var(--t3);text-transform:uppercase">
                <th style="background:none;border:none">Month</th>
                <th style="background:none;border:none">Key Contributions</th>
                <th style="background:none;border:none">Target vs. Result</th>
                <th style="background:none;border:none">Lessons &amp; Best Practices</th>
              </tr>
            </thead>
            <tbody>
              ${(selfData.months || []).map(m => `
                <tr>
                  <td style="font-weight:700;color:#00f2fe;white-space:nowrap">${escapeHtml(m.month)}</td>
                  <td style="color:var(--text)">${(m.contributions||[]).map(c=>`• ${escapeHtml(c)}`).join('<br>')}</td>
                  <td style="color:var(--t2)">${escapeHtml(m.topContribution?.targetResult || 'Target achieved on schedule')}</td>
                  <td style="color:var(--t3)"><em>${escapeHtml(m.topContribution?.lessonLearnt || 'Clean modular design')}</em></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 2: EXECUTIVE KPI PERFORMANCE ASSESSMENT -->
      <div class="card mb20" style="border-radius:12px">
        <div class="card-header" style="padding:12px 16px">
          <div class="card-title" style="font-size:13px">2. Key Performance Indicator (KPI) Ratings</div>
        </div>
        <div class="card-body" style="padding:14px">
          <table class="data-table" style="font-size:11px">
            <thead>
              <tr style="background:var(--s2)">
                <th>KPI Category</th>
                <th style="text-align:center">Self Score</th>
                <th style="text-align:center">Manager Score</th>
                <th>Work Evidence / Accomplishments</th>
              </tr>
            </thead>
            <tbody>
              ${kpiData.map(k => `
                <tr>
                  <td style="font-weight:700;color:var(--text)">${escapeHtml(k.name)}</td>
                  <td style="text-align:center;font-weight:700;color:var(--a1)">⭐ ${k.selfRating || 5}</td>
                  <td style="text-align:center;font-weight:800;color:#10b981">⭐ ${k.managerRating || k.selfRating || 5}</td>
                  <td style="color:var(--t2)">${escapeHtml(k.example || 'Demonstrated consistent high quality and timely delivery.')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 3: STRATEGIC GOALS & EXECUTIVE FEEDBACK -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:14px">
          <div style="font-weight:700;font-size:12px;color:var(--text);margin-bottom:6px">🚀 Goals for Next Quarter</div>
          <div style="font-size:11px;color:var(--t2);line-height:1.6;white-space:pre-line">${escapeHtml(selfData.goalsForNextQuarter || '• Scale distributed platform architecture.\n• Enhance observability and automated regression testing.')}</div>
        </div>
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:14px">
          <div style="font-weight:700;font-size:12px;color:var(--text);margin-bottom:6px">💬 Executive &amp; Manager Sign-off</div>
          <div style="font-size:11px;color:#10b981;line-height:1.6;font-style:italic">"Exceptional performance during Q2 2026. Consistently demonstrated high technical domain expertise, initiative, and proactive leadership across platform deliverables."</div>
          <div style="margin-top:10px;font-size:10px;color:var(--t3);display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:6px">
            <span>Reviewed by: <strong>Engineering Leadership</strong></span>
            <span>Status: <strong>Approved ✓</strong></span>
          </div>
        </div>
      </div>

      <!-- FOOTER ACTIONS -->
      <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:12px;border-top:1px solid var(--border)">
        <button class="btn btn-ghost" onclick="closeModal()">Close</button>
        ${rev ? `<button class="btn btn-primary" onclick="closeModal();openFullPageReview('${rev.id}')">👁️ Expand to Full Page View</button>` : ''}
        <button class="btn btn-ghost" onclick="downloadQuarterlyReviewSheet()">📥 Download Sheet (.csv)</button>
        <button class="btn btn-ghost" onclick="window.print()">🖨️ Print Report</button>
      </div>

    </div>
  `;

  openModal();
}

function downloadQuarterlyReviewSheet(rev = null) {
  const selfData = rev ? (typeof rev.self_review_data === 'string' ? JSON.parse(rev.self_review_data) : rev.self_review_data) : qrSelfReviewState;
  const kpiData = rev ? (typeof rev.kpi_data === 'string' ? JSON.parse(rev.kpi_data) : rev.kpi_data) : qrKpiState;
  const skillData = rev ? (typeof rev.skill_matrix_data === 'string' ? JSON.parse(rev.skill_matrix_data) : rev.skill_matrix_data) : [];

  const empName = rev ? (rev.employee_name || 'Sarah J.') : (currentProfile?.full_name || 'Sarah J.');
  const empRole = rev ? (rev.employee_role || 'Senior Lead Engineer') : (roleLabel(currentProfile?.role) || 'Senior Lead Engineer');
  const deptName = rev ? (rev.department || 'Backend Platform') : (currentProfile?.department || 'Engineering');
  const period = rev ? `${rev.quarter} ${rev.year}` : 'Q2 2026';
  const scoreVal = rev ? (rev.overall_score || 4.85) : 4.85;

  const rows = [];
  rows.push(['VECTYRA ENTERPRISE PERFORMANCE & APPRAISAL SHEET']);
  rows.push(['Reference:', 'VEC-REP-2026-Q2-0042', 'Date:', new Date().toLocaleDateString()]);
  rows.push([]);
  rows.push(['EMPLOYEE METADATA']);
  rows.push(['Employee Name', empName]);
  rows.push(['Role / Position', empRole]);
  rows.push(['Department / Team', deptName]);
  rows.push(['Evaluation Period', period]);
  rows.push(['Overall Rating Score', `${scoreVal} / 5.0`]);
  rows.push(['Status', 'Closed & Completed']);
  rows.push([]);

  rows.push(['SECTION 1: MONTHLY ACCOMPLISHMENTS & TARGET RESULTS']);
  rows.push(['Month', 'Key Contributions', 'Target vs Result', 'Lessons & Best Practices']);
  (selfData.months || []).forEach(m => {
    rows.push([
      m.month || '',
      (m.contributions || []).join(' | '),
      m.topContribution?.targetResult || 'Target achieved on schedule',
      m.topContribution?.lessonLearnt || 'Clean modular design'
    ]);
  });
  rows.push([]);

  rows.push(['SECTION 2: KEY PERFORMANCE INDICATORS (KPIs) AUDIT']);
  rows.push(['KPI Name', 'Self Rating', 'Manager Rating', 'Work Evidence & Achievements', 'Challenges']);
  (kpiData || []).forEach(k => {
    rows.push([
      k.name || '',
      `${k.selfRating || 5} / 5`,
      `${k.managerRating || k.selfRating || 5} / 5`,
      k.example || 'Demonstrated consistent high quality delivery.',
      k.challenges || 'None'
    ]);
  });
  rows.push([]);

  if (skillData && skillData.length) {
    rows.push(['SECTION 3: TECHNICAL & FUNCTIONAL SKILL MATRIX AUDIT']);
    rows.push(['Skill Name', 'Category', 'Scope / Domain', 'Proficiency Rating', 'Training Required', 'Comments']);
    skillData.forEach(s => {
      rows.push([
        s.skill || '',
        s.category || '',
        s.scope || 'General',
        `${s.selfRating || 4} / 5`,
        s.trainingRequired === 'YES' ? 'YES' : 'NO',
        s.comments || ''
      ]);
    });
    rows.push([]);
  }

  rows.push(['SECTION 4: STRATEGIC GOALS & EXECUTIVE SIGN-OFF']);
  rows.push(['Next Quarter Goals:', (selfData.goalsForNextQuarter || '').replace(/\n/g, ' | ')]);
  rows.push(['Areas of Improvement:', (selfData.areasOfImprovement || '').replace(/\n/g, ' | ')]);
  rows.push(['Executive Sign-off:', 'Exceptional performance during Q2 2026. Approved by Engineering Leadership.']);

  const csvString = '\uFEFF' + rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Vectyra_Appraisal_Sheet_${period.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast(`📥 Downloaded appraisal sheet: Vectyra_Appraisal_Sheet_${period.replace(/\s+/g, '_')}.csv`, 'success');
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
              <span>${escapeHtml(k.name)}</span>
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
