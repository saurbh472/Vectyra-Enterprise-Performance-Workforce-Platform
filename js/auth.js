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

  const cleanEmail = email.trim().toLowerCase();

  // 1. ALWAYS TRY LIVE BACKEND REST API LOGIN FIRST
  try {
    const data = await API.login(cleanEmail, pass);
    currentUser = data.user;
    currentProfile = data.user;
    isDemo = false;
    localStorage.removeItem('PC_DEMO_MODE');
    await loadMeta();
    setBtnLoad('loginBtn', false);
    renderApp();
    toast(`Welcome back, ${data.user.full_name}!`, 'success');
    return;
  } catch (apiErr) {
    console.warn('API login failed or server offline, checking fallback demo authentication:', apiErr?.message);
    
    // If backend returned a specific error response (like invalid email or password), and user is NOT explicitly in Demo mode, display the error
    if (!isDemo && apiErr?.message && !apiErr.message.includes('Failed to fetch')) {
      setBtnLoad('loginBtn', false);
      return authErr(`❌ ${apiErr.message || 'Sign-in failed. Please check your credentials.'}`);
    }
  }

  // 2. FALLBACK DEMO MODE AUTHENTICATION (For offline testing)
  window.DYNAMIC_DEMO_CREDENTIALS = window.DYNAMIC_DEMO_CREDENTIALS || [];
  
  const DEMO_CREDENTIALS = [
    { email: 'admin@gmail.com', pass: 'superadmin' },
    { email: 'superadmin@company.com', pass: 'demo123' },
    { email: 'hr@company.com',         pass: 'demo123' },
    { email: 'manager@company.com',    pass: 'demo123' },
    { email: 'employee@company.com',   pass: 'demo123' },
    ...window.DYNAMIC_DEMO_CREDENTIALS
  ];

  const validCred = DEMO_CREDENTIALS.find(
    c => c.email.toLowerCase() === cleanEmail && c.pass === pass
  );

  if (validCred) {
    let matched = MOCK_PROFILES.find(p => p.email.toLowerCase() === cleanEmail);
    if (!matched && validCred.profile) {
      matched = validCred.profile;
      MOCK_PROFILES.push(matched);
    }

    if (matched) {
      isDemo = true;
      localStorage.setItem('PC_DEMO_MODE', 'true');
      currentUser    = { id: matched.id, email: matched.email };
      currentProfile = matched;
      allUsers = [...MOCK_PROFILES];
      allTeams = [...MOCK_TEAMS];
      setBtnLoad('loginBtn', false);
      renderApp();
      toast(`Signed in as ${matched.full_name} (Demo Mode)`, 'success');
      return;
    }
  }

  setBtnLoad('loginBtn', false);
  authErr('❌ Invalid email or password. Please check your credentials.');
}

async function doLogout() {
  if (!isDemo) {
    API.logout();
  }
  currentUser = null;
  currentProfile = null;
  if (typeof qrCurrentTab !== 'undefined') qrCurrentTab = 'form';
  if (typeof qrActiveStep !== 'undefined') qrActiveStep = 1;
  window.qrGallerySelectedTeamId = null;
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
