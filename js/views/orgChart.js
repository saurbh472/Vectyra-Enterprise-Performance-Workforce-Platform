// ═══════════════════════════════════════════════
// VIEW: ORG CHART & REVIEW CYCLES
// ═══════════════════════════════════════════════
async function pageOrgChart() {
  if (!canSeeAll()) return accessDenied();
  await loadMeta();

  const roleColor  = { super_admin:'linear-gradient(135deg,#4f46e5,#7c3aed)', admin:'linear-gradient(135deg,#0284c7,#0369a1)', manager:'linear-gradient(135deg,#059669,#047857)', employee:'linear-gradient(135deg,#64748b,#475569)' };
  const roleBg     = { super_admin:'rgba(99,102,241,.1)', admin:'rgba(2,132,199,.1)', manager:'rgba(5,150,105,.1)', employee:'rgba(100,116,139,.07)' };
  const roleBorder = { super_admin:'#4f46e5', admin:'#0284c7', manager:'#059669', employee:'#64748b' };
  const rolePill   = { super_admin:{bg:'rgba(99,102,241,.15)',color:'#818cf8'}, admin:{bg:'rgba(2,132,199,.15)',color:'#38bdf8'}, manager:{bg:'rgba(5,150,105,.15)',color:'#34d399'}, employee:{bg:'rgba(100,116,139,.15)',color:'#94a3b8'} };

  function userCard(u, size) {
    const rc = roleColor[u.role]  || roleColor.employee;
    const rp = rolePill[u.role]   || rolePill.employee;
    const rb = roleBorder[u.role] || '#64748b';
    const bg = roleBg[u.role]     || roleBg.employee;
    const sz = size === 'lg' ? '52px' : '40px';
    const fs = size === 'lg' ? '18px' : '14px';
    const dept = u.department ? `<div style="font-size:11px;color:var(--t3);margin-top:2px">${u.department}</div>` : '';
    return `<div style="display:flex;align-items:center;gap:12px;background:${bg};border:1px solid ${rb}2a;border-left:3px solid ${rb};border-radius:12px;padding:11px 14px;transition:transform .15s,box-shadow .15s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px ${rb}28'" onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="width:${sz};height:${sz};border-radius:12px;flex-shrink:0;background:${rc};display:flex;align-items:center;justify-content:center;font-size:${fs};font-weight:700;color:#fff">${avatarInitials(u.full_name)}</div>
      <div style="min-width:0">
        <div style="font-size:${size==='lg'?'14px':'13px'};font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.full_name}</div>
        <div style="margin-top:4px"><span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${rp.bg};color:${rp.color}">${roleLabel(u.role)}</span></div>
        ${dept}
      </div>
    </div>`;
  }

  const leadership = allUsers.filter(u => u.role === 'super_admin' || u.role === 'admin');
  const managers   = allUsers.filter(u => u.role === 'manager');
  const employees  = allUsers.filter(u => u.role === 'employee');

  // Build team buckets
  const buckets = {};
  allTeams.forEach(t => { buckets[t.id] = { team:t, managers:[], employees:[] }; });
  const noBucket = { team:{name:'Unassigned',department:''}, managers:[], employees:[] };
  managers.forEach(u  => (buckets[u.team_id] || noBucket).managers.push(u));
  employees.forEach(u => (buckets[u.team_id] || noBucket).employees.push(u));

  const teamCards = [...Object.values(buckets), ...(noBucket.managers.length||noBucket.employees.length?[noBucket]:[])].map(({team,managers:mgrs,employees:emps}) => {
    if (!mgrs.length && !emps.length) return '';
    const all = [...mgrs,...emps];
    return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:15px">🏷️</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:var(--text)">${team.name}</div>
          ${team.department?`<div style="font-size:11px;color:var(--t3)">${team.department}</div>`:''}
        </div>
        <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(99,102,241,.1);color:var(--a1)">${all.length} member${all.length!==1?'s':''}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">${all.map(u=>userCard(u,'sm')).join('')}</div>
    </div>`;
  }).join('');

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Organization Structure</div><div class="page-sub">${allUsers.length} people across ${allTeams.length} teams</div></div>
    </div>
    <div class="content fade-up">
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:22px">
        ${Object.entries({super_admin:'Super Admin',admin:'Admin / HR',manager:'Manager',employee:'Employee'}).map(([r,l])=>`
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--t2)">
            <div style="width:10px;height:10px;border-radius:3px;background:${roleBorder[r]}"></div>${l}
          </div>`).join('')}
      </div>
      ${leadership.length ? `
        <div style="margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:10px">🔝 Leadership</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">${leadership.map(u=>userCard(u,'lg')).join('')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px">
          <div style="flex:1;height:1px;background:var(--border)"></div>
          <span style="font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--t3);text-transform:uppercase">Teams</span>
          <div style="flex:1;height:1px;background:var(--border)"></div>
        </div>` : ''}
      <div style="columns:2;column-gap:14px">${teamCards || '<div style="text-align:center;color:var(--t3);padding:40px">No teams configured yet.</div>'}</div>
    </div>`;
}

// ═══════════════════════════════════════════════
// VIEW: REVIEW CYCLES
// ═══════════════════════════════════════════════
async function pageCycles() {
  if (!canSeeAll()) return accessDenied();
  const now = new Date();
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1);
  const qEnd   = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3+3, 0);
  const pct    = Math.min(Math.round(((now-qStart)/(qEnd-qStart))*100),100);
  const qNum   = Math.floor(now.getMonth()/3)+1;
  const yr     = now.getFullYear();
  const prevQ  = qNum===1?4:qNum-1;
  const prevY  = qNum===1?yr-1:yr;

  const cycles = [
    { label:`Q${qNum} ${yr} Company-Wide Review`, status:'Active', pct, color:'#4f46e5', icon:'🔁', deadline:qEnd.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}), types:['Self Assessment','Peer Review','Manager Feedback','Cross Functional Feedback'] },
    { label:`Q${qNum} ${yr} HR Culture Pulse`,    status:'Active', pct:Math.max(pct-8,3), color:'#d97706', icon:'🏛️', deadline:qEnd.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}), types:['HR & Culture'] },
  ];

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Review Cycles</div><div class="page-sub">Track and manage active feedback cycles</div></div>
      <div class="header-right"><button class="btn btn-primary btn-sm" onclick="toast('Cycle creation coming soon!','info')">+ New Cycle</button></div>
    </div>
    <div class="content fade-up">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin-bottom:28px">
        ${cycles.map(c=>`
          <div style="background:var(--bg2);border:1px solid var(--border);border-left:4px solid ${c.color};border-radius:16px;padding:20px">
            <div style="display:flex;gap:12px;margin-bottom:16px">
              <div style="font-size:24px;line-height:1">${c.icon}</div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:700;color:var(--text)">${c.label}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                  <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(5,150,105,.15);color:#34d399">● ${c.status}</span>
                  <span style="font-size:11px;color:var(--t3)">Due ${c.deadline}</span>
                </div>
              </div>
            </div>
            <div style="margin-bottom:14px">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--t2);margin-bottom:6px">
                <span>Quarter Progress</span><span style="font-weight:700;color:${c.color}">${c.pct}%</span>
              </div>
              <div style="height:7px;background:var(--border);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${c.pct}%;background:${c.color};border-radius:4px;transition:width .8s ease"></div>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${c.types.map(t=>`<span style="font-size:10px;padding:3px 9px;border-radius:20px;background:var(--bg3);color:var(--t2);border:1px solid var(--border)">${t}</span>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:12px">📁 Previous Cycles</div>
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;overflow:hidden">
        ${[{icon:'🔁',label:`Q${prevQ} ${prevY} Company-Wide Review`},{icon:'🏛️',label:`Q${prevQ} ${prevY} HR Culture Pulse`}].map((c,i)=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;${i?'border-top:1px solid var(--border)':''}">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:18px">${c.icon}</span>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text)">${c.label}</div>
                <div style="font-size:11px;color:var(--t3)">Completed</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(100,116,139,.1);color:#94a3b8">✓ Closed</span>
              <button class="btn btn-ghost btn-sm" onclick="toast('Archive download coming soon','info')" style="font-size:11px;padding:4px 10px">View Report</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

