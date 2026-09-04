// ═══════════════════════════════════════════════
// VIEW: QUESTION TEMPLATES MANAGER (ADMIN & SUPER ADMIN)
// ═══════════════════════════════════════════════
let currentTemplateTab = 'manager';

async function pageQuestionTemplates() {
  if (!canSeeAll()) return accessDenied();
  const tpls = getTemplates();
  const currentTpl = tpls[currentTemplateTab] || { metrics: [], questions: [] };

  document.getElementById('pageContent').innerHTML = `<div class="page-header">
    <div>
      <div class="page-title">Form Templates &amp; Questions Manager</div>
      <div class="page-sub">Customize quality rating metrics and qualitative questions for all feedback forms</div>
    </div>
    <div class="header-right">
      <button class="btn btn-ghost btn-sm" onclick="resetQuestionTemplates()">🔄 Reset Defaults</button>
      <button class="btn btn-primary btn-sm" onclick="saveActiveTemplate()">💾 Save Template</button>
    </div>
  </div><div class="content fade-up">
    <!-- FORM TYPE TABS -->
    <div class="auth-tabs mb24" style="max-width:800px">
      ${Object.keys(DEFAULT_QUESTION_TEMPLATES).map(type => `
        <button class="auth-tab ${currentTemplateTab===type?'active':''}" onclick="switchTemplateTab('${type}')">${typeLabel(type)}</button>
      `).join('')}
    </div>

    <div class="g2">
      <!-- QUALITY METRICS EDITOR -->
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Section 1: Quality Attributes &amp; Metrics</div><div class="card-sub">Rating criteria with score stars &amp; comment box</div></div>
          <button class="btn btn-ghost btn-sm" onclick="addMetricItem()">+ Add Metric</button>
        </div>
        <div class="card-body">
          <div id="metricsList" style="display:flex;flex-direction:column;gap:10px">
            ${currentTpl.metrics.map((m, idx) => `
              <div style="display:flex;gap:8px;align-items:center" id="m_row_${idx}">
                <span style="font-size:12px;color:var(--t3);font-weight:700;width:24px">${idx+1}.</span>
                <input class="form-input metric-input" value="${m.label}" placeholder="Attribute Name (e.g. Quality of Work)">
                <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
              </div>
            `).join('')}
          </div>
          ${!currentTpl.metrics.length ? '<div style="font-size:12px;color:var(--t3);padding:10px 0">No quality metrics configured yet. Click "+ Add Metric" to create one.</div>' : ''}
        </div>
      </div>

      <!-- QUALITATIVE QUESTIONS EDITOR -->
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Section 2: Behavioral &amp; Qualitative Questions</div><div class="card-sub">In-depth questions with detailed response boxes</div></div>
          <button class="btn btn-ghost btn-sm" onclick="addQuestionItem()">+ Add Question</button>
        </div>
        <div class="card-body">
          <div id="questionsList" style="display:flex;flex-direction:column;gap:12px">
            ${currentTpl.questions.map((q, idx) => `
              <div style="display:flex;gap:8px;align-items:flex-start" id="q_row_${idx}">
                <span style="font-size:12px;color:var(--t3);font-weight:700;width:24px;padding-top:8px">Q${idx+1}.</span>
                <textarea class="form-input question-input" style="min-height:50px;font-size:13px">${q.question}</textarea>
                <button class="btn btn-danger btn-sm" style="margin-top:4px" onclick="this.parentElement.remove()">✕</button>
              </div>
            `).join('')}
          </div>
          ${!currentTpl.questions.length ? '<div style="font-size:12px;color:var(--t3);padding:10px 0">No qualitative questions configured yet. Click "+ Add Question" to create one.</div>' : ''}
        </div>
      </div>
    </div>
  </div>`;
}

function switchTemplateTab(type) {
  currentTemplateTab = type;
  pageQuestionTemplates();
}

function addMetricItem() {
  const list = document.getElementById('metricsList');
  if (!list) return;
  const count = list.children.length;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;align-items:center';
  row.innerHTML = `<span style="font-size:12px;color:var(--t3);font-weight:700;width:24px">${count+1}.</span>
    <input class="form-input metric-input" placeholder="New Metric Name (e.g. Flexibility)">
    <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}

function addQuestionItem() {
  const list = document.getElementById('questionsList');
  if (!list) return;
  const count = list.children.length;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
  row.innerHTML = `<span style="font-size:12px;color:var(--t3);font-weight:700;width:24px;padding-top:8px">Q${count+1}.</span>
    <textarea class="form-input question-input" placeholder="New Question statement…" style="min-height:50px;font-size:13px"></textarea>
    <button class="btn btn-danger btn-sm" style="margin-top:4px" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}

function saveActiveTemplate() {
  const tpls = getTemplates();
  const metricInputs = document.querySelectorAll('.metric-input');
  const questionInputs = document.querySelectorAll('.question-input');

  const newMetrics = [];
  metricInputs.forEach((inp, i) => {
    const val = inp.value.trim();
    if (val) newMetrics.push({ id: `${currentTemplateTab}_m_${i}`, label: val });
  });

  const newQuestions = [];
  questionInputs.forEach((inp, i) => {
    const val = inp.value.trim();
    if (val) newQuestions.push({ id: `${currentTemplateTab}_q_${i}`, question: val });
  });

  tpls[currentTemplateTab] = { metrics: newMetrics, questions: newQuestions };
  saveTemplates(tpls);
  pageQuestionTemplates();
}

function resetQuestionTemplates() {
  if (!confirm('Reset all form templates to original default questions?')) return;
  localStorage.removeItem('PC_QUESTION_TEMPLATES');
  toast('Reset to default templates', 'info');
  pageQuestionTemplates();
}
