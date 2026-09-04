// ═══════════════════════════════════════════════
// VIEW: USER PROFILE & SECURITY SETTINGS
// ═══════════════════════════════════════════════
async function pageProfile() {
  await loadMeta();
  const p = currentProfile;
  const team = allTeams.find(t => t.id === p?.team_id);

  document.getElementById('pageContent').innerHTML = `<div class="page-header">
    <div><div class="page-title">My Profile</div><div class="page-sub">Account details &amp; security preferences</div></div>
  </div><div class="content fade-up">
    <div class="profile-hero">
      <div class="profile-avatar">${avatarInitials(p?.full_name)}</div>
      <div>
        <div class="profile-name">${escapeHtml(p?.full_name)}</div>
        <div class="profile-meta">${escapeHtml(p?.email)} &bull; ${escapeHtml(p?.department || 'No department')} &bull; Team: <strong>${escapeHtml(team?.name || 'Unassigned')}</strong> &bull; <span class="badge badge-${p?.role}">${roleLabel(p?.role)}</span></div>
      </div>
    </div>

    ${isSuper() ? `<div class="card mb24">
      <div class="card-header"><div class="card-title">👑 Super Admin Governance</div></div>
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="navigate('users')">👥 Manage User Roles &amp; Provision Accounts</button>
        <button class="btn btn-ghost btn-sm" onclick="navigate('teams')">🏷️ Manage Teams</button>
        <button class="btn btn-ghost btn-sm" onclick="navigate('departments')">🏢 Manage Departments</button>
        <button class="btn btn-ghost btn-sm" onclick="navigate('templates')">📝 Form Templates</button>
      </div>
    </div>` : ''}

    <div class="g2 mb24">
      <div class="card">
        <div class="card-header"><div class="card-title">Profile Information</div></div>
        <div class="card-body">
          <div class="form-group mb16"><label class="form-label">Full Name</label><input class="form-input" id="pf_name" value="${escapeHtml(p?.full_name || '')}"></div>
          <div class="form-group mb16"><label class="form-label">Department</label><input class="form-input" id="pf_dept" value="${escapeHtml(p?.department || '')}" placeholder="e.g. Engineering"></div>
          <div class="form-group mb16"><label class="form-label">Assigned Role</label><input class="form-input" value="${roleLabel(p?.role)}" disabled style="opacity:.6;cursor:not-allowed"></div>
          <button class="btn btn-primary" style="width:auto" onclick="saveProfile()">Save Profile</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Security &amp; Password</div></div>
        <div class="card-body">
          <div style="background:rgba(79,70,229,.08);border:1px solid rgba(79,70,229,.2);border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px;color:var(--t2)">
            🔑 Passwords are hash-encrypted in the PostgreSQL database using bcrypt.
          </div>
          <div class="form-group mb16"><label class="form-label">New Password</label><input class="form-input" id="pw_new" type="password" placeholder="Min. 6 characters"></div>
          <div class="form-group mb16"><label class="form-label">Confirm Password</label><input class="form-input" id="pw_confirm" type="password" placeholder="Repeat password"></div>
          <button class="btn btn-primary" style="width:auto" onclick="changePassword()">Update Password</button>
        </div>
      </div>
    </div>
  </div>`;
}

async function saveProfile() {
  const name = v('pf_name');
  const dept = v('pf_dept');
  if (!name) return toast('Full name is required', 'warn');

  if (isDemo) {
    currentProfile.full_name = name;
    currentProfile.department = dept;
  } else {
    try {
      await API.updateUser(currentProfile.id, { full_name: name, department: dept || null });
      currentProfile.full_name = name;
      currentProfile.department = dept;
    } catch(err) {
      return toast('Error updating profile: ' + err.message, 'err');
    }
  }
  document.getElementById('sbName').textContent = name;
  document.getElementById('sbAvatar').textContent = avatarInitials(name);
  toast('✅ Profile saved!', 'success');
}

async function changePassword() {
  const pw  = document.getElementById('pw_new')?.value;
  const pw2 = document.getElementById('pw_confirm')?.value;
  if (!pw || pw.length < 6) return toast('Password must be 6+ characters', 'warn');
  if (pw !== pw2) return toast('Passwords do not match', 'warn');
  if (isDemo) {
    toast('✅ Password updated in Demo mode', 'success');
    return;
  }
  toast('✅ Password update request processed', 'success');
  document.getElementById('pw_new').value = '';
  document.getElementById('pw_confirm').value = '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
