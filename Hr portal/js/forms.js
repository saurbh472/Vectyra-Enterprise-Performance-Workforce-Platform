// ═══════════════════════════════════════════════
// DYNAMIC FORM BUILDER & SUBMISSION HANDLER
// ═══════════════════════════════════════════════
function selectFormType(type, el) {
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('formArea').innerHTML = buildForm(type);
}

function buildForm(type) {
  const tpls = getTemplates();
  const formTpl = tpls[type];
  if (formTpl && (formTpl.metrics?.length || formTpl.questions?.length)) {
    return buildStructuredForm(type, formTpl);
  }
  return `<div class="form-wrap">
    <div class="form-head"><div class="form-head-title">${typeLabel(type)} Form</div></div>
    <div class="form-body">
       <div class="form-group"><label class="form-label">Subject (Who is this review for?)</label>
         <select class="form-input" id="fb_subject">
           <option value="">— Select a person —</option>
           ${allUsers.filter(u => u.id !== currentProfile?.id).map(u => `<option value="${u.id}">${u.full_name} (${roleLabel(u.role)})</option>`).join('')}
         </select>
       </div>
      <div class="rating-group"><div class="rating-qlabel">Overall Rating</div>${fRating('rating_overall')}</div>
      <div class="form-group"><label class="form-label">Key Strengths &amp; Accomplishments</label><textarea class="form-input" id="fb_strengths" style="min-height:80px"></textarea></div>
      <div class="form-group"><label class="form-label">Areas for Improvement</label><textarea class="form-input" id="fb_improvements" style="min-height:80px"></textarea></div>
      <div class="form-group">
        <label class="switch"><input type="checkbox" id="fb_anon"><span class="slider"></span></label>
        <span style="font-size:12px;color:var(--t2);margin-left:8px;font-weight:600">Submit Anonymously (Mask my identity)</span>
      </div>
    </div>
    <div class="form-foot" style="padding:16px 26px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <button class="btn btn-primary" onclick="submitFeedbackForm('${type}')">Submit Feedback →</button>
    </div>
  </div>`;
}

function buildStructuredForm(type, tpl) {
  const metrics = tpl.metrics || [];
  const questions = tpl.questions || [];
  const colors = { manager: 'var(--a1)', peer: 'var(--a3)', hr: 'var(--a2)', self: 'var(--a4)', '360': 'var(--a5)', exit: '#ca8a04' };
  const color = colors[type] || 'var(--a1)';

  return `<div class="form-wrap">
    <div class="form-head" style="background:linear-gradient(135deg,rgba(79,70,229,.08),transparent)">
      <div class="form-head-title" style="color:${color}">${typeLabel(type)} Evaluation</div>
      <div style="font-size:12px;color:var(--t2)">Provide thorough ratings and constructive feedback</div>
    </div>
    <div class="form-body">
      ${type === 'self' ? `
        <div class="form-group mb24" style="background:rgba(225,29,72,.06);border:1px solid rgba(225,29,72,.2);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#e11d48,#be185d);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff">${avatarInitials(currentProfile?.full_name)}</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--text)">${currentProfile?.full_name}</div>
            <div style="font-size:11px;color:var(--t3)">Self Assessment — This review is about you</div>
          </div>
        </div>
        <input type="hidden" id="fb_subject" value="${currentProfile?.id}">
      ` : `
        <div class="form-group mb24">
          <label class="form-label" style="font-size:13px;font-weight:700">Subject (Who is this review for?)</label>
          <select class="form-input" id="fb_subject">
            ${(() => {
              const pool = allUsers.filter(u => u.id !== currentProfile.id);
              if (type === 'manager') {
                const managers = pool.filter(u => isManagerRole(u.role));
                if (!managers.length) return `<option value="">No managers found</option>`;

                const myTeam = allTeams.find(t => t.id === currentProfile.team_id);
                const explicitMgr = myTeam?.manager_id ? managers.find(u => u.id === myTeam.manager_id) : null;
                const teamLeads = managers.filter(u => u.team_id === currentProfile.team_id && u.id !== explicitMgr?.id);

                const teamManagers = [];
                if (explicitMgr) teamManagers.push(explicitMgr);
                teamLeads.forEach(tl => teamManagers.push(tl));

                const otherManagers = managers.filter(u => !teamManagers.some(tm => tm.id === u.id));
                const defaultSelectId = teamManagers.length ? teamManagers[0].id : '';

                let html = '<option value="">— Select a Manager —</option>';

                if (teamManagers.length) {
                  html += `<optgroup label="🌟 Your Team Manager & Leadership">`;
                  html += teamManagers.map(u =>
                    `<option value="${u.id}" ${u.id === defaultSelectId ? 'selected' : ''}>${u.full_name} (${roleLabel(u.role)}${u.id === explicitMgr?.id ? ' • Team Manager' : ' • Team Leadership'})</option>`
                  ).join('');
                  html += `</optgroup>`;
                }

                if (otherManagers.length) {
                  html += `<optgroup label="🏢 Other Managers & Leadership">`;
                  html += otherManagers.map(u =>
                    `<option value="${u.id}">${u.full_name} (${roleLabel(u.role)}${u.department ? ' • ' + u.department : ''})</option>`
                  ).join('');
                  html += `</optgroup>`;
                }

                return html;
              }

              if (!pool.length) return `<option value="">No eligible people found</option>`;
              return '<option value="">— Select a person —</option>' +
                pool.map(u => `<option value="${u.id}">${u.full_name} (${roleLabel(u.role)}${u.department ? ' • ' + u.department : ''})</option>`).join('');
            })()}
          </select>
        </div>
      `}

      ${metrics.length ? `
        <div style="margin-bottom:28px">
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:var(--text);margin-bottom:4px">Section 1: Quality Attributes &amp; Competencies</div>
          <div style="font-size:12px;color:var(--t3);margin-bottom:16px">Rate each quality metric from 1 to 5 stars and add specific comments</div>

          <div style="display:flex;flex-direction:column;gap:14px">
            ${metrics.map((m, idx) => `
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:16px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
                  <div style="font-size:13px;font-weight:700;color:var(--text)">${idx+1}. ${m.label}</div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:11px;color:var(--t3);font-weight:600">Rating:</span>
                    ${fRating('dyn_r_' + m.id)}
                  </div>
                </div>
                <input class="form-input" id="dyn_f_${m.id}" type="text" placeholder="Add specific feedback or comments on ${m.label.toLowerCase()}…" style="font-size:13px;background:var(--s1)">
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${questions.length ? `
        <div style="margin-bottom:24px">
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:var(--text);margin-bottom:4px">Section 2: Qualitative &amp; Behavioral Questions</div>
          <div style="font-size:12px;color:var(--t3);margin-bottom:16px">Provide detailed observations and feedback</div>

          <div style="display:flex;flex-direction:column;gap:18px">
            ${questions.map((q, idx) => `
              <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:18px">
                <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px;line-height:1.4">Q${idx+1}: ${q.question}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                  <span style="font-size:11px;color:var(--t3);font-weight:600">Score:</span>
                  ${fRating('dyn_r_' + q.id)}
                </div>
                <textarea class="form-input" id="dyn_f_${q.id}" placeholder="Provide specific examples, details, or feedback…" style="min-height:70px;font-size:13px;background:var(--s1)"></textarea>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${(type === 'peer' || type === '360') ? `
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:24px">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">🏆 Award a Recognition Badge (Optional)</div>
          <div style="font-size:12px;color:var(--t3);margin-bottom:12px">Recognize this colleague's top strength with a badge</div>
          <select class="form-input" id="fb_award_badge" style="background:var(--s1)">
            <option value="">— Select a Badge to Award (Optional) —</option>
            <option value="team_player">🤝 Team Player — Outstanding collaboration &amp; teamwork</option>
            <option value="problem_solver">💡 Problem Solver — Exceptional troubleshooting &amp; ingenuity</option>
            <option value="initiative_taker">🚀 Initiative Taker — Proactive leadership &amp; ownership</option>
            <option value="top_performer">⭐ Top Performer — Consistently exceeds goals &amp; standards</option>
            <option value="creative_thinker">🎨 Creative Thinker — Innovative solutions &amp; fresh ideas</option>
            <option value="technical_wizard">🛠️ Technical Wizard — Deep expertise &amp; technical mastery</option>
          </select>
        </div>
      ` : ''}

      <div class="form-group" style="padding-top:14px;border-top:1px solid var(--border)">
        <label class="switch"><input type="checkbox" id="fb_anon"><span class="slider"></span></label>
        <span style="font-size:12px;color:var(--t2);margin-left:8px;font-weight:600">Submit Anonymously (Hide my identity)</span>
      </div>
    </div>
    <div class="form-foot" style="padding:16px 26px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <button class="btn btn-primary" onclick="submitFeedbackForm('${type}')" style="background:${color}">Submit ${typeLabel(type)} Feedback →</button>
    </div>
  </div>`;
}

function fRating(id) {
  return `<div class="stars" id="${id}" data-val="5">
    ${[1,2,3,4,5].map(i=>`<span class="star on" onclick="setStar('${id}',${i})">★</span>`).join('')}
  </div>`;
}

function setStar(id, val) {
  const el = document.getElementById(id); if (!el) return;
  el.dataset.val = val;
  el.querySelectorAll('.star').forEach((s, idx) => s.classList.toggle('on', idx < val));
}

function getRatingVal(id) {
  const el = document.getElementById(id);
  if (!el) return 5;
  return parseInt(el.dataset.val || 5);
}

async function submitFeedbackForm(type) {
  const subjectId = gv('fb_subject');
  const subjUser = allUsers.find(u=>u.id===subjectId);
  if (!subjectId) return toast('Please select a subject', 'warn');

  const tpls = getTemplates();
  const formTpl = tpls[type];
  let score = 5;
  let peerDetailsObj = null;

  if (formTpl && (formTpl.metrics?.length || formTpl.questions?.length)) {
    const metricsData = (formTpl.metrics || []).map(m => ({
      key: m.id,
      label: m.label,
      rating: getRatingVal('dyn_r_' + m.id),
      feedback: gv('dyn_f_' + m.id)
    }));

    const questionsData = (formTpl.questions || []).map(q => ({
      id: q.id,
      question: q.question,
      rating: getRatingVal('dyn_r_' + q.id),
      feedback: gv('dyn_f_' + q.id)
    }));

    const allRatings = [...metricsData.map(m => m.rating), ...questionsData.map(q => q.rating)];
    if (allRatings.length) {
      score = Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1));
    }
    peerDetailsObj = { metrics: metricsData, questions: questionsData };
  } else {
    score = parseInt(document.getElementById('rating_overall')?.dataset.val || 5);
  }

  let fullContent = '';
  if (peerDetailsObj) {
    const summaryText = gv('fb_strengths') ? `${gv('fb_strengths')}\n\n` : '';
    fullContent = summaryText + JSON.stringify(peerDetailsObj);
  } else {
    fullContent = gv('fb_strengths') || 'Feedback submission';
  }

  const data = {
    receiver_id: subjectId,
    feedback_type: type,
    review_cycle: 'c1',
    content: fullContent,
    rating: Math.round(score),
    is_anonymous: document.getElementById('fb_anon')?.checked || false,
    peer_details: peerDetailsObj
  };

  await saveRecord(data);

  toast(`✅ ${typeLabel(type)} feedback submitted successfully!`, 'success');
  navigate('dashboard');
}

async function saveRecord(data) {
  if (isDemo) {
    data.id = 'f-' + Date.now();
    data.giver_id = currentProfile.id;
    data.created_at = new Date().toISOString();
    MOCK_FEEDBACK.unshift(data);
    return;
  }
  await API.createFeedback(data);
}

async function fetchFeedback() {
  if (isDemo) {
    const getProfileRole = (profileId) => {
      const p = (allUsers.length ? allUsers : MOCK_PROFILES).find(x => x.id === profileId);
      return p ? p.role : null;
    };

    if (isSuper()) {
      // Super Admin sees all except feedback directed to Super Admin
      return MOCK_FEEDBACK.filter(r => {
        const receiverRole = getProfileRole(r.receiver_id);
        return r.receiver_id !== currentProfile.id && receiverRole !== 'super_admin';
      });
    } else if (isAdmin()) {
      // HR sees all except feedback directed to HR (feedback for HR directed to Superadmin only; sees feedback for Superadmin)
      return MOCK_FEEDBACK.filter(r => {
        const receiverRole = getProfileRole(r.receiver_id);
        return r.receiver_id !== currentProfile.id && receiverRole !== 'admin';
      });
    } else {
      // Managers / Employees can only view their own submitted feedback
      return MOCK_FEEDBACK.filter(r => r.giver_id === currentProfile.id);
    }
  }

  try {
    const list = await API.getFeedback();
    feedbackCache = list || [];
    return feedbackCache;
  } catch (err) {
    toast(`Error loading feedback: ${err.message}`, 'err');
    return [];
  }
}
