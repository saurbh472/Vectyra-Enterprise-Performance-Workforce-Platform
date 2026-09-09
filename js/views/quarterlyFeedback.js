// ═══════════════════════════════════════════════════════════════════════
// PREMIUM QUARTERLY FEEDBACK & PERFORMANCE PORTAL MODULE
// Self Review Sheet + KPI Self-Assessment + Dynamic Scope Skill Matrix
// Team-Wise Administration, Locking & HR Unlock Controls
// ═══════════════════════════════════════════════════════════════════════

let qrCurrentTab = 'form'; // 'form' | 'archive' | 'teamReviews' | 'templateBuilder'
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
          👥 Team-Wise Member Appraisals
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

        <!-- FILTERS & SEARCH BAR -->
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input type="text" class="form-input" style="padding:6px 12px;font-size:12px;width:180px;height:auto"
            placeholder="🔍 Search skills..." value="${escapeHtml(qrSkillSearchQuery)}" oninput="onQrSkillSearch(this.value)">

          <select class="form-input" style="padding:6px 12px;font-size:12px;width:auto;height:auto" onchange="onQrSkillCategoryFilter(this.value)">
            <option value="ALL">All Categories</option>
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
            ${list.map((s, idx) => {
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
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
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
                  <td style="font-weight:700;color:var(--text)">${escapeHtml(r.quarter)}</td>
                  <td>${r.year}</td>
                  <td>
                    <span class="badge ${r.status==='reviewed'?'badge-peer':r.is_unlocked?'badge-hr':'badge-manager'}">
                      ${r.status==='reviewed'?'✓ Reviewed by Manager':r.is_unlocked?'🔓 Unlocked for Edits':'🔒 Submitted & Locked'}
                    </span>
                  </td>
                  <td style="font-weight:800;color:var(--a2)">⭐ ${r.overall_score || '4.5'} / 5.0</td>
                  <td style="font-size:12px;color:var(--t3)">${fmtDate(r.created_at)}</td>
                  <td style="text-align:right">
                    <div style="display:flex;gap:6px;justify-content:flex-end">
                      <button class="btn btn-ghost btn-sm" onclick="openReviewModal('${r.id}')">👁️ View Report</button>
                      <button class="btn btn-primary btn-sm" onclick="downloadQuarterlyReviewSheet()" style="font-size:11px">📥 Download Sheet</button>
                    </div>
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
// TEAM-WISE MEMBER REVIEWS (MANAGER & SUPERADMIN / HR WORKFLOW)
// ═══════════════════════════════════════════════════════════════════════
async function renderQrTeamReviewsView(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading team-wise reviews...</div>`;

  try {
    const list = await API.getQuarterlyReviews({});
    const users = await API.getUsers();
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    const isSuperOrHr = ['super_admin', 'admin'].includes(currentProfile?.role);

    // Group reviews by Team
    const teamBuckets = {};
    allTeams.forEach(t => {
      teamBuckets[t.id] = { team: t, reviews: [], totalMembers: 0 };
    });
    const unassignedBucket = { team: { id: 'unassigned', name: 'Unassigned / General', department: 'General' }, reviews: [], totalMembers: 0 };

    users.forEach(u => {
      const tid = u.team_id || 'unassigned';
      if (teamBuckets[tid]) teamBuckets[tid].totalMembers++;
      else unassignedBucket.totalMembers++;
    });

    list.forEach(r => {
      const tid = r.team_id || userMap[r.employee_id]?.team_id || 'unassigned';
      if (teamBuckets[tid]) teamBuckets[tid].reviews.push(r);
      else unassignedBucket.reviews.push(r);
    });

    const bucketsToRender = qrTeamFilter === 'ALL' 
      ? [...Object.values(teamBuckets), unassignedBucket].filter(b => b.totalMembers > 0 || b.reviews.length > 0)
      : [...Object.values(teamBuckets), unassignedBucket].filter(b => b.team.id === qrTeamFilter);

    container.innerHTML = `
      <!-- TEAM FILTER & CONTROL BAR -->
      <div class="card mb20" style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-weight:700;font-size:14px;color:var(--text)">Filter Appraisals by Team:</div>
          <select class="form-input" style="padding:6px 12px;font-size:12px;font-weight:600;width:auto;height:auto" onchange="onQrTeamFilterChange(this.value)">
            <option value="ALL" ${qrTeamFilter==='ALL'?'selected':''}>🏢 All Teams Overview (${allTeams.length})</option>
            ${allTeams.map(t => `<option value="${t.id}" ${qrTeamFilter===t.id?'selected':''}>🏷️ ${escapeHtml(t.name)}</option>`).join('')}
          </select>
        </div>

        <div style="font-size:12px;color:var(--t2)">
          Showing <strong>${list.length}</strong> quarterly appraisal submissions across <strong>${bucketsToRender.length}</strong> active teams
        </div>
      </div>

      <!-- TEAM BUCKETS LIST -->
      ${bucketsToRender.map(b => {
        const t = b.team;
        const revs = b.reviews;
        const submittedCount = revs.filter(r => r.status === 'submitted' || r.status === 'reviewed').length;
        const pct = b.totalMembers ? Math.round((submittedCount / b.totalMembers) * 100) : 0;

        return `
          <div class="card mb20">
            <div class="card-header" style="flex-wrap:wrap;gap:12px">
              <div>
                <div class="card-title" style="display:flex;align-items:center;gap:8px">
                  <span>🏷️ ${escapeHtml(t.name)}</span>
                  <span style="font-size:11px;color:var(--t3);font-weight:500">(${escapeHtml(t.department || 'General')})</span>
                </div>
                <div class="card-sub" style="margin-top:4px">
                  Team Progress: <strong>${submittedCount} of ${b.totalMembers} members submitted</strong> (${pct}%)
                </div>
              </div>

              <!-- PROGRESS BAR -->
              <div style="width:160px">
                <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;color:var(--a1);margin-bottom:3px">
                  <span>Submission Rate</span>
                  <span>${pct}%</span>
                </div>
                <div style="background:var(--border);height:6px;border-radius:3px;overflow:hidden">
                  <div style="background:var(--a1);height:100%;width:${pct}%"></div>
                </div>
              </div>
            </div>

            <div class="card-body" style="padding:0">
              ${revs.length ? `
                <table class="data-table">
                  <thead>
                    <tr style="background:var(--s2)">
                      <th>Employee</th>
                      <th>Cycle Period</th>
                      <th>Status &amp; Lock</th>
                      <th>Self Rating Avg</th>
                      <th style="text-align:right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${revs.map(r => {
                      const emp = userMap[r.employee_id] || { full_name: 'Employee (' + r.employee_id + ')', email: '' };
                      const secTeams = (emp.secondary_team_ids || []).map(tid => allTeams.find(x => x.id === tid)).filter(Boolean);
                      return `
                        <tr>
                          <td>
                            <div style="display:flex;align-items:center;gap:10px">
                              <div class="avatar" style="width:32px;height:32px;font-size:11px;font-weight:700">${avatarInitials(emp.full_name)}</div>
                              <div>
                                <div style="font-weight:700;color:var(--text);font-size:13px">${escapeHtml(emp.full_name)}</div>
                                <div style="font-size:11px;color:var(--t3)">${escapeHtml(emp.email)}</div>
                                ${secTeams.length ? `
                                  <div style="display:flex;gap:4px;margin-top:2px">
                                    ${secTeams.map(st => `<span style="font-size:9px;padding:1px 4px;border-radius:6px;background:rgba(79,70,229,0.12);color:var(--a1)">🤝 ${escapeHtml(st.name)}</span>`).join('')}
                                  </div>
                                ` : ''}
                              </div>
                            </div>
                          </td>
                          <td style="font-size:12px;font-weight:600">${escapeHtml(r.quarter)} ${r.year}</td>
                          <td>
                            <span class="badge ${r.status==='reviewed'?'badge-peer':r.is_unlocked?'badge-hr':'badge-manager'}">
                              ${r.status==='reviewed'?'✓ Reviewed by Manager':r.is_unlocked?'🔓 Unlocked for Edits':'🔒 Submitted & Locked'}
                            </span>
                          </td>
                          <td style="font-weight:800;color:var(--a2)">⭐ ${r.overall_score || '4.5'}</td>
                          <td style="text-align:right">
                            <div style="display:flex;gap:6px;justify-content:flex-end">
                              <button class="btn btn-ghost btn-sm" onclick="openReviewModal('${r.id}')" title="View Full Report">👁️ Report</button>
                              <button class="btn btn-primary btn-sm" onclick="openManagerReviewModal('${r.id}')">
                                ✏️ Evaluate Score
                              </button>
                              ${isSuperOrHr ? `
                                <button class="btn btn-ghost btn-sm" style="color:var(--a3)" onclick="unlockSubmissionByAdmin('${r.id}', '${escapeHtml(emp.full_name)}')" title="Unlock Submission for Edits">
                                  🔓 Unlock
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
                <div style="padding:24px;text-align:center;color:var(--t3);font-size:13px">
                  No submissions yet for this team for ${qrSelectedQuarter} ${qrSelectedYear}.
                </div>
              `}
            </div>
          </div>
        `;
      }).join('')}
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--a4)">Error loading team reviews: ${err.message}</div>`;
  }
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
            <label style="font-size:11px;font-weight:700;color:var(--t3)">Team Template:</label>
            <select class="form-input" style="padding:6px 12px;font-size:12px;width:auto;height:auto" onchange="onQrTemplateTeamChange(this.value)">
              ${teams.map(t => `<option value="${t.id}" ${qrSelectedTeamId===t.id?'selected':''}>🏷️ ${escapeHtml(t.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body">
          <!-- ADD NEW SKILL FORM -->
          <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:20px">
            <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:12px">➕ Add Custom Skill Item to ${escapeHtml(currentTeam?.name || 'Team')}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 120px;gap:12px">
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

async function openReviewModal(reviewId) {
  try {
    const rev = await API.getQuarterlyReviewById(reviewId);
    openCompanyWideReportModal(rev, `${rev.quarter} ${rev.year} Performance Review`);
  } catch (err) {
    toast(err.message, 'error');
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
              <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--text)">${escapeHtml(reportTitle)}</div>
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
            <div style="font-size:20px;font-weight:800;color:#10b981;font-family:'Syne',sans-serif">⭐ ${scoreVal} / 5.0</div>
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
        <button class="btn btn-primary" onclick="downloadQuarterlyReviewSheet()">📥 Download Sheet (.csv)</button>
        <button class="btn btn-ghost" onclick="window.print()">🖨️ Print Full Report</button>
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
