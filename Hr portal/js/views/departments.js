// ═══════════════════════════════════════════════
// VIEW: DEPARTMENT MANAGEMENT (ADMIN & SUPER ADMIN)
// ═══════════════════════════════════════════════
async function pageDepartments() {
  if (!canSeeAll()) return accessDenied();
  await loadMeta();

  const depts = allDepartments.length ? allDepartments : MOCK_DEPARTMENTS;

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div class="page-title">Department Management</div>
        <div class="page-sub">Manage company departments and team organization</div>
      </div>
      <button class="btn btn-primary" onclick="openAddDepartmentModal()">+ New Department</button>
    </div>
    <div class="content fade-up">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px" id="deptGrid">
        ${depts.map(d => renderDeptCard(d)).join('')}
      </div>
    </div>`;
}

function renderDeptCard(d) {
  const teamCount = allTeams.filter(t => t.department === d.name).length;
  const userCount = allUsers.filter(u => u.department === d.name).length;

  return `
    <div class="card" style="border-left:4px solid var(--a1)" id="dept-card-${d.id}">
      <div class="card-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px">
          <div>
            <div style="font-size:16px;font-weight:700;color:var(--text)">🏢 ${escapeHtml(d.name)}</div>
            <div style="font-size:12px;color:var(--t3);margin-top:4px">${escapeHtml(d.description || 'No description provided.')}</div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:12px" onclick="openEditDepartmentModal('${d.id}')" title="Edit">✏️</button>
            <button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:12px;color:var(--a4)" onclick="deleteDepartment('${d.id}')" title="Delete">🗑️</button>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
          <div style="font-size:12px;color:var(--t2)">🏷️ <strong>${teamCount}</strong> Team${teamCount!==1?'s':''}</div>
          <div style="font-size:12px;color:var(--t2)">👥 <strong>${userCount}</strong> Member${userCount!==1?'s':''}</div>
        </div>
      </div>
    </div>`;
}

function openAddDepartmentModal() {
  document.getElementById('modalTitle').textContent = '🏢 Add New Department';
  document.getElementById('modalSub').textContent   = 'Create a new organizational department';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Department Name *</label>
      <input class="form-input" id="deptModalName" type="text" placeholder="e.g. Quality Assurance, Security, Legal">
    </div>
    <div class="form-group mb16">
      <label class="form-label">Description (Optional)</label>
      <input class="form-input" id="deptModalDesc" type="text" placeholder="Short summary of responsibilities">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewDepartment()">Create Department</button>
    </div>`;
  openModal();
}

async function saveNewDepartment() {
  const name = v('deptModalName');
  const desc = v('deptModalDesc');
  if (!name) return toast('Please enter a department name', 'warn');

  const exists = allDepartments.some(d => d.name.toLowerCase() === name.toLowerCase());
  if (exists) return toast('A department with this name already exists', 'warn');

  const newDept = {
    id: 'd-' + Date.now(),
    name: name,
    description: desc || ''
  };

  if (!isDemo) {
    try {
      await API.createDepartment(name);
    } catch(e) {
      console.warn('API createDepartment error:', e.message);
    }
  }

  const updated = [...allDepartments, newDept];
  saveDepartments(updated);
  closeModal();
  toast(`Department "${name}" created!`, 'success');
  pageDepartments();
}

function openEditDepartmentModal(id) {
  const d = allDepartments.find(item => item.id === id);
  if (!d) return;

  document.getElementById('modalTitle').textContent = '✏️ Edit Department';
  document.getElementById('modalSub').textContent   = `Update details for ${d.name}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group mb16">
      <label class="form-label">Department Name *</label>
      <input class="form-input" id="deptModalName" type="text" value="${escapeHtml(d.name)}">
    </div>
    <div class="form-group mb16">
      <label class="form-label">Description (Optional)</label>
      <input class="form-input" id="deptModalDesc" type="text" value="${escapeHtml(d.description || '')}">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="updateDepartment('${d.id}')">Save Changes</button>
    </div>`;
  openModal();
}

async function updateDepartment(id) {
  const name = v('deptModalName');
  const desc = v('deptModalDesc');
  if (!name) return toast('Please enter a department name', 'warn');

  const idx = allDepartments.findIndex(item => item.id === id);
  if (idx === -1) return;

  allDepartments[idx].name = name;
  allDepartments[idx].description = desc || '';

  saveDepartments(allDepartments);
  closeModal();
  toast(`Department updated successfully!`, 'success');
  pageDepartments();
}

async function deleteDepartment(id) {
  const d = allDepartments.find(item => item.id === id);
  if (!d) return;

  if (!confirm(`Are you sure you want to delete department "${d.name}"?`)) return;

  const updated = allDepartments.filter(item => item.id !== id);
  saveDepartments(updated);
  toast(`Department "${d.name}" removed`, 'info');
  pageDepartments();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
