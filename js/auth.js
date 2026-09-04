// ═══════════════════════════════════════════════
// AUTH PROCEDURES & SESSION MANAGEMENT
// ═══════════════════════════════════════════════
function showAuth() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appShell').style.display   = 'none';
  document.getElementById('demoBanner').style.display = isDemo ? 'flex' : 'none';
}

async function doLogin() {
  const email = v('loginEmail');
  const pass  = v('loginPass');
  if (!email || !pass) return authErr('Please enter both email and password.');

  setBtnLoad('loginBtn', true);

  // Demo emails — work in demo mode
  const DEMO_EMAILS = ['admin@gmail.com','superadmin@company.com','hr@company.com','manager@company.com','employee@company.com'];
  const isDemoEmail = DEMO_EMAILS.includes(email.toLowerCase());

  if (isDemo && isDemoEmail) {
    const DEMO_CREDENTIALS = [
      { email: 'admin@gmail.com', pass: 'superadmin' },
      { email: 'superadmin@company.com', pass: 'demo123' },
      { email: 'hr@company.com',         pass: 'demo123' },
      { email: 'manager@company.com',    pass: 'demo123' },
      { email: 'employee@company.com',   pass: 'demo123' },
    ];
    const validCred = DEMO_CREDENTIALS.find(
      c => c.email.toLowerCase() === email.toLowerCase() && c.pass === pass
    );
    if (!validCred) {
      setBtnLoad('loginBtn', false);
      return authErr('❌ Invalid demo credentials. Demo password is <b>demo123</b> for all demo accounts.');
    }
    const matched = MOCK_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      setBtnLoad('loginBtn', false);
      return authErr('❌ Demo account not found.');
    }
    currentUser    = { id: matched.id, email: matched.email };
    currentProfile = matched;
    allUsers = [...MOCK_PROFILES];
    allTeams = [...MOCK_TEAMS];
    setBtnLoad('loginBtn', false);
    renderApp();
    toast(`Signed in as ${matched.full_name} (Demo Mode)`, 'success');
    return;
  }

  // ─── LIVE POSTGRES API LOGIN ───
  if (isDemo && !isDemoEmail) {
    isDemo = false;
    localStorage.removeItem('PC_DEMO_MODE');
  }

  try {
    const data = await API.login(email, pass);
    currentUser = data.user;
    currentProfile = data.user;
    await loadMeta();
    setBtnLoad('loginBtn', false);
    renderApp();
    toast(`Welcome back, ${data.user.full_name}!`, 'success');
  } catch (err) {
    setBtnLoad('loginBtn', false);
    authErr(`❌ ${err.message || 'Sign-in failed. Please check your credentials.'}`);
  }
}

async function doLogout() {
  if (!isDemo) {
    API.logout();
  }
  currentUser = null;
  currentProfile = null;
  showAuth();
  toast('Signed out successfully', 'info');
}

function authErr(msg, success = false) {
  const errEl = document.getElementById('authError');
  if (errEl) {
    errEl.innerHTML = `<div class="alert ${success ? 'alert-info' : 'alert-err'}">${msg}</div>`;
  }
}

function enableDemoMode() {
  isDemo = true;
  localStorage.setItem('PC_DEMO_MODE', 'true');
  document.getElementById('loginEmail').value = 'admin@gmail.com';
  document.getElementById('loginPass').value  = 'superadmin';
  doLogin();
}

function disableDemoMode() {
  isDemo = false;
  localStorage.removeItem('PC_DEMO_MODE');
  currentUser = null;
  currentProfile = null;
  document.getElementById('demoBanner').style.display = 'none';
  showAuth();
  toast('Switched to Live PostgreSQL Mode', 'info');
}

// Auto sign-in on app start if JWT token is stored
async function checkStoredSession() {
  if (isDemo) return;
  const token = API.getToken();
  if (!token) return showAuth();

  try {
    await loadProfile();
    await loadMeta();
    renderApp();
  } catch (err) {
    console.warn('Session expired or invalid token:', err);
    API.logout();
    showAuth();
  }
}
