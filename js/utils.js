// ═══════════════════════════════════════════════
// UTILITY HELPERS & ROLE CHECKS
// ═══════════════════════════════════════════════
const ROLE = { SUPER:'super_admin', ADMIN:'admin', MANAGER:'manager', EMP:'employee' };
const isSuper   = () => currentProfile?.role === ROLE.SUPER;
const isAdmin   = () => currentProfile?.role === ROLE.ADMIN;
const isManager = () => currentProfile?.role === ROLE.MANAGER || isSuper() || isAdmin(); // super_admin/admin can also manage teams
const isEmp     = () => currentProfile?.role === ROLE.EMP;
const canSeeAll = () => isSuper() || isAdmin();
// A user who can manage people: pure managers AND admins AND super_admins
const canManage = () => isSuper() || isAdmin() || currentProfile?.role === ROLE.MANAGER;
const roleLabel = r => ({ super_admin:'Super Admin', admin:'Admin (HR)', manager:'Manager', employee:'Employee' }[r] || r);
const typeLabel = t => ({ manager:'Manager Feedback', peer:'Peer Review', hr:'HR & Culture', self:'Self Assessment', '360':'Cross Functional Feedback', exit:'Exit Interview' }[t] || t);
// Helper: users who can appear as a manager subject (can be reviewed as manager)
const isManagerRole = r => ['super_admin','admin','manager'].includes(r);

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function avatarInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1]?.[0]||'')).toUpperCase();
}

function v(id) { return (document.getElementById(id)?.value||'').trim(); }
function gv(id) { return (document.getElementById(id)?.value||'').trim(); }

function setBtnLoad(id, loading) {
  const el = document.getElementById(id);
  if (!el) return;
  if (loading) {
    if (!el.dataset.origText) el.dataset.origText = el.textContent;
    el.textContent = 'Please wait…';
    el.disabled = true;
  } else {
    el.textContent = el.dataset.origText || 'Submit';
    el.disabled = false;
  }
}

function toast(msg, type='info') {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const el   = document.createElement('div');
  const c    = {success:'var(--a3)',warn:'var(--a2)',err:'var(--a4)',info:'var(--a1)'};
  el.className = 'toast';
  el.style.borderLeftColor = c[type]||c.info;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.animation='tOut .25s ease forwards'; setTimeout(()=>el.remove(),250); }, 3000);
}

function updateFeedbackBadge(n) {
  const el = document.getElementById('feedbackBadge');
  if (el) { el.textContent=n; el.style.display=n>0?'inline-flex':'none'; }
}

function accessDenied() {
  document.getElementById('pageContent').innerHTML = `<div style="text-align:center;padding:60px 20px">
    <div style="font-size:48px;margin-bottom:12px">🔒</div>
    <h2>Access Restricted</h2>
    <p style="color:var(--t3);margin-top:6px;font-size:13px">You do not have permission to view this section.</p>
  </div>`;
}

function openModal() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.add('open');
}

function closeModal() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('open');
}

function closeOverlay(e) {
  if (e.target.id === 'overlay') closeModal();
}

function injectForgotPassword() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm && !document.getElementById('forgotLink')) {
    const link = document.createElement('div');
    link.id = 'forgotLink';
    link.style.cssText = 'text-align:right;margin-top:-8px;margin-bottom:14px';
    link.innerHTML = `<button onclick="toast('Password reset link sent to work email','info')" style="background:none;border:none;color:var(--t3);font-size:12px;cursor:pointer;font-family:inherit">Forgot password?</button>`;
    loginForm.insertBefore(link, loginForm.querySelector('.btn'));
  }
}

function refreshNotifBell() {
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = 'none';
}

function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  panel?.classList.toggle('open');
}

function markAllRead() {
  refreshNotifBell();
  toast('Notifications cleared', 'info');
}

function handleGlobalSearch(q) {
  if (!q.trim()) return;
}
