// ═══════════════════════════════════════════════
// VIEW: USER MANAGEMENT, PROVISIONING & DETAILED USER PROFILE
// ═══════════════════════════════════════════════
async function pageUsers() {
  if (!canSeeAll()) return accessDenied();
  await loadMeta();

  // Fetch feedback cache if empty for stats
  if (!feedbackCache.length && !isDemo) {
    try { feedbackCache = await API.getFeedback(); } catch(e) {}
  }

  const isSuper = currentProfile?.role === 'super_admin';

  document.getElementById('pageContent').innerHTML = `
  <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <div class="page-title">User Management</div>
      <div class="page-sub">Provision user accounts, assign roles, view full profiles &amp; team structures</div>
    </div>
    <button class="btn btn-primary" onclick="openCreateUserModal()">➕ Create New User Account</button>
  </div>
  <div class="content fade-up">
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Team</th>
              <th>Department</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${allUsers.map(u => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="avatar" style="width:32px;height:32px;font-size:11px;font-weight:700">${avatarInitials(u.full_name)}</div>
                  <div>
                    <div style="color:var(--text);font-size:13px;font-weight:600">${escapeHtml(u.full_name)}</div>
                    <div style="font-size:11px;color:var(--t3)">${escapeHtml(u.email)}</div>
                  </div>
                </div>
              </td>
              <td>
                <select class="form-input" style="padding:4px 8px;font-size:12px;width:auto" onchange="updateUserRole('${u.id}',this.value)">
                  <option value="employee" ${u.role==='employee'?'selected':''}>Employee</option>
                  <option value="manager" ${u.role==='manager'?'selected':''}>Manager</option>
                  <option value="admin" ${u.role==='admin'?'selected':''}>Admin (HR)</option>
                  <option value="super_admin" ${u.role==='super_admin'?'selected':''}>Super Admin</option>
                </select>
              </td>
              <td>
                <select class="form-input" style="padding:4px 8px;font-size:12px;width:auto" onchange="updateUserTeam('${u.id}',this.value)">
                  <option value="">No Team</option>
                  ${allTeams.map(t => `<option value="${t.id}" ${u.team_id===t.id?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}
                </select>
              </td>
              <td style="color:var(--t3);font-size:12px">${escapeHtml(u.department || '—')}</td>
              <td><span class="badge badge-${u.role}">${roleLabel(u.role)}</span></td>
              <td style="text-align:right">
                <div style="display:flex;gap:6px;justify-content:flex-end">
                  <button class="btn btn-ghost btn-sm" onclick="openViewUserModal('${u.id}')" title="View Full Profile & Info">👁️ View Info</button>
                  ${isSuper && u.id !== currentProfile.id ? `<button class="btn btn-ghost btn-sm" style="color:var(--err)" onclick="confirmDeleteUser('${u.id}','${escapeHtml(u.full_name)}')">🗑️</button>` : ''}
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
// DETAILED USER INFO MODAL
// ═══════════════════════════════════════════════
function openViewUserModal(userId) {
  const u = allUsers.find(x => x.id === userId);
  if (!u) return toast('User not found', 'warn');

  const team = allTeams.find(t => t.id === u.team_id);
  const userBadges = allBadges.filter(b => b.awarded_to === u.id);
  const userGoals  = allGoals.filter(g => g.assigned_to === u.id);
  const fbReceived = feedbackCache.filter(f => f.receiver_id === u.id || f.subject_id === u.id);
  const fbGiven    = feedbackCache.filter(f => f.giver_id === u.id || f.submitted_by === u.id);

  // Compute avg rating
  const ratings = fbReceived.filter(f => f.rating || f.score).map(f => Number(f.rating || f.score));
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';

  document.getElementById('modalTitle').textContent = '👤 User Profile & Info';
  document.getElementById('modalSub').textContent   = `Detailed Overview for ${u.full_name}`;
  document.getElementById('modalBody').innerHTML = `
    <!-- PROFILE HERO HEADER -->
    <div style="display:flex;align-items:center;gap:14px;background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:20px">
      <div class="avatar" style="width:48px;height:48px;font-size:16px;font-weight:800;background:linear-gradient(135deg,var(--a1),var(--a2))">${avatarInitials(u.full_name)}</div>
      <div style="flex:1">
        <div style="font-size:16px;font-weight:700;color:var(--text)">${escapeHtml(u.full_name)}</div>
        <div style="font-size:12px;color:var(--t3);margin-top:2px">${escapeHtml(u.email)}</div>
        <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="badge badge-${u.role}">${roleLabel(u.role)}</span>
          <span style="font-size:11px;color:var(--t2);background:var(--s1);padding:2px 8px;border-radius:12px;border:1px solid var(--border)">🏢 ${escapeHtml(u.department || 'No Department')}</span>
          <span style="font-size:11px;color:var(--t2);background:var(--s1);padding:2px 8px;border-radius:12px;border:1px solid var(--border)">🏷️ Team: ${escapeHtml(team?.name || 'Unassigned')}</span>
        </div>
      </div>
    </div>

    <!-- METRICS GRID -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">
      <div style="background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:18px;font-weight:800;color:var(--a1)">${fbReceived.length}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Feedback Recv</div>
      </div>
      <div style="background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:18px;font-weight:800;color:var(--a3)">${fbGiven.length}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Feedback Given</div>
      </div>
      <div style="background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:18px;font-weight:800;color:var(--a2)">${avgRating} ★</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Avg Rating</div>
      </div>
      <div style="background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:18px;font-weight:800;color:var(--a5)">${userBadges.length}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Badges</div>
      </div>
    </div>

    <!-- SYSTEM DETAILS & METADATA -->
    <div style="background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">System Information</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">
        <div><span style="color:var(--t3)">User ID:</span> <code style="background:var(--s2);padding:2px 6px;border-radius:4px">${u.id}</code></div>
        <div><span style="color:var(--t3)">Created Date:</span> <strong>${fmtDate(u.created_at)}</strong></div>
        <div><span style="color:var(--t3)">Account Status:</span> <span style="color:var(--a3);font-weight:600">● Active</span></div>
        <div><span style="color:var(--t3)">Department:</span> <strong>${escapeHtml(u.department || 'Unassigned')}</strong></div>
      </div>
    </div>

    <!-- RECOGNITION BADGES -->
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">🏆 Recognition &amp; Awarded Badges (${userBadges.length})</div>
      ${userBadges.length ? `
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${userBadges.map(b => {
            const sender = allUsers.find(x => x.id === b.awarded_by) || { full_name: b.awarded_by_name || 'Leader' };
            return `
              <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:6px 12px;font-size:12px;display:inline-flex;align-items:center;gap:8px">
                <span>${b.icon || '⭐'}</span>
                <div>
                  <span style="font-weight:700;color:var(--text)">${escapeHtml(b.title)}</span>
                  <span style="font-size:10px;color:var(--t3);margin-left:4px">(From ${escapeHtml(sender.full_name)})</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<div style="font-size:12px;color:var(--t3);font-style:italic">No badges awarded yet</div>'}
    </div>

    <!-- ASSIGNED KRAs / GOALS -->
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">🎯 Assigned KRAs &amp; Goals (${userGoals.length})</div>
      ${userGoals.length ? `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${userGoals.map(g => `
            <div style="background:var(--s1);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:4px">
                <strong style="color:var(--text)">${escapeHtml(g.title)}</strong>
                <span style="font-weight:700;color:var(--a1)">${g.progress || 0}%</span>
              </div>
              <div style="background:var(--border);height:6px;border-radius:3px;overflow:hidden">
                <div style="background:var(--a1);height:100%;width:${g.progress || 0}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<div style="font-size:12px;color:var(--t3);font-style:italic">No goals assigned yet</div>'}
    </div>

    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    </div>`;

  openModal();
}

function openCreateUserModal() {
  const depts = allDepartments.length ? allDepartments : MOCK_DEPARTMENTS;
  const teams = allTeams.length ? allTeams : MOCK_TEAMS;

  document.getElementById('modalTitle').textContent = '👤 Create New User Account';
  document.getElementById('modalSub').textContent   = 'Provision credentials for employee login';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:rgba(79,70,229,.08);border:1px solid rgba(79,70,229,.2);border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:12px;color:var(--t2)">
      🔑 <b>SuperAdmin Provisioning:</b> After creating this account, copy the credentials and securely share them with the user.
    </div>

    <div class="form-row mb16">
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input class="form-input" id="nuName" placeholder="e.g. Jordan Lee">
      </div>
      <div class="form-group">
        <label class="form-label">Work Email *</label>
        <input class="form-input" id="nuEmail" type="email" placeholder="jordan@company.com">
      </div>
    </div>

    <div class="form-row mb16">
      <div class="form-group">
        <label class="form-label">Initial Password *</label>
        <div style="display:flex;gap:6px">
          <input class="form-input" id="nuPass" placeholder="Min 6 chars" value="Pass@${Math.floor(1000 + Math.random() * 9000)}">
          <button class="btn btn-ghost btn-sm" onclick="generateRandomPass()" style="white-space:nowrap">🎲 Random</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">System Role *</label>
        <select class="form-input" id="nuRole">
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin (HR)</option>
          ${currentProfile?.role === 'super_admin' ? '<option value="super_admin">Super Admin</option>' : ''}
        </select>
      </div>
    </div>

    <div class="form-row mb16">
      <div class="form-group">
        <label class="form-label">Department</label>
        <select class="form-input" id="nuDept" onchange="onNuDeptChange(this.value)">
          <option value="">— Select Department —</option>
          ${depts.map(d => `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Assign Team</label>
        <select class="form-input" id="nuTeam">
          <option value="">— Select Team —</option>
          ${teams.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (${escapeHtml(t.department||'General')})</option>`).join('')}
        </select>
      </div>
    </div>

    <div id="createUserErr"></div>

    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreateUser()" id="createUserBtn">✨ Create Account &amp; Generate Credentials</button>
    </div>`;

  openModal();
}

function generateRandomPass() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('nuPass').value = pass;
}

function onNuDeptChange(dept) {
  const teamSel = document.getElementById('nuTeam');
  if (!teamSel) return;
  const teams = allTeams.length ? allTeams : MOCK_TEAMS;
  const filtered = dept ? teams.filter(t => t.department === dept) : teams;
  teamSel.innerHTML = '<option value="">— Select Team —</option>' +
    filtered.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
}

async function submitCreateUser() {
  const full_name  = v('nuName');
  const email      = v('nuEmail');
  const password   = v('nuPass');
  const role       = v('nuRole');
  const department = v('nuDept');
  const team_id    = v('nuTeam');

  if (!full_name || !email || !password) {
    document.getElementById('createUserErr').innerHTML = `<div class="alert alert-err" style="margin-top:12px">Please fill in Full Name, Email, and Password.</div>`;
    return;
  }

  setBtnLoad('createUserBtn', true);

  if (isDemo) {
    const newProf = {
      id: 'u-' + Date.now(),
      full_name, email, role, department, team_id,
      avatar_initials: avatarInitials(full_name)
    };
    MOCK_PROFILES.push(newProf);
    allUsers.push(newProf);
    setBtnLoad('createUserBtn', false);
    showCredentialsSummaryModal(full_name, email, password);
    pageUsers();
    return;
  }

  try {
    const res = await API.createUser({
      full_name, email, password, role, department, team_id
    });
    setBtnLoad('createUserBtn', false);
    await loadMeta();
    showCredentialsSummaryModal(full_name, email, password);
    pageUsers();
  } catch (err) {
    setBtnLoad('createUserBtn', false);
    document.getElementById('createUserErr').innerHTML = `<div class="alert alert-err" style="margin-top:12px">❌ ${err.message}</div>`;
  }
}

function showCredentialsSummaryModal(name, email, password) {
  document.getElementById('modalTitle').textContent = '✅ Account Created Successfully!';
  document.getElementById('modalSub').textContent   = 'Share these login credentials with the user';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:var(--text)">
      Account for <b>${escapeHtml(name)}</b> has been created in PostgreSQL database.
    </div>

    <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px">
      <div style="margin-bottom:8px;font-size:12px;color:var(--t3);text-transform:uppercase;letter-spacing:1px;font-weight:700">Account Credentials</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="color:var(--t2);font-size:13px">Email:</span>
        <strong style="font-family:monospace;font-size:13px">${escapeHtml(email)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="color:var(--t2);font-size:13px">Password:</span>
        <strong style="font-family:monospace;font-size:13px;color:var(--a1)">${escapeHtml(password)}</strong>
      </div>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">Done</button>
      <button class="btn btn-primary" onclick="copyCredentials('${escapeHtml(email)}','${escapeHtml(password)}')">📋 Copy Credentials</button>
    </div>`;

  openModal();
}

function copyCredentials(email, password) {
  const text = `Vectyra HR & Performance Portal Credentials:\nEmail: ${email}\nPassword: ${password}\nURL: ${window.location.origin}`;
  navigator.clipboard.writeText(text);
  toast('📋 Credentials copied to clipboard!', 'success');
}

async function updateUserRole(userId, role) {
  if (isDemo) {
    const u = MOCK_PROFILES.find(x => x.id === userId);
    if (u) u.role = role;
  } else {
    try {
      await API.updateUser(userId, { role });
    } catch(err) {
      toast(`Failed to update role: ${err.message}`, 'err');
      return;
    }
  }
  toast('Role updated successfully!', 'success');
}

async function updateUserTeam(userId, teamId) {
  if (isDemo) {
    const u = MOCK_PROFILES.find(x => x.id === userId);
    if (u) u.team_id = teamId || null;
  } else {
    try {
      await API.updateUser(userId, { team_id: teamId || null });
    } catch(err) {
      toast(`Failed to update team: ${err.message}`, 'err');
      return;
    }
  }
  toast('Team updated successfully!', 'success');
}

function confirmDeleteUser(userId, name) {
  if (!confirm(`Are you sure you want to delete the account for ${name}? This action cannot be undone.`)) return;

  if (isDemo) {
    allUsers = allUsers.filter(u => u.id !== userId);
    pageUsers();
    toast(`Account for ${name} deleted`, 'info');
    return;
  }

  API.deleteUser(userId).then(() => {
    toast(`Account for ${name} deleted`, 'info');
    pageUsers();
  }).catch(err => {
    toast(`Delete failed: ${err.message}`, 'err');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
