// ===== New Life - auth.js (Login + Cloud Save) =====
console.log('auth.js loaded OK');

(function () {
  const PREFIX = 'nl_';
  const FLAG = 'nl_synced_';
  const $ = (id) => document.getElementById(id);

  let currentUser = null;
  let db = null;
  let auth = null;
  let pushTimer = null;
  let mode = 'login';

  const origSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    origSet.call(this, k, v);
    if (this === window.localStorage && currentUser && typeof k === 'string' && k.indexOf(PREFIX) === 0) {
      schedulePush();
    }
  };

  function localData() {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0) o[k] = localStorage.getItem(k);
    }
    return o;
  }
  function removeLocalData() {
    Object.keys(localData()).forEach((k) => localStorage.removeItem(k));
  }
  function sameData(a, b) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => a[k] === b[k]);
  }

  // ---------- Login overlay markup ----------
  const overlay = document.createElement('div');
  overlay.className = 'auth-overlay';
  overlay.innerHTML =
    '<div class="modal auth-modal">' +
      '<h2>NEW <span>LIFE</span></h2>' +
      '<p class="modal-sub">Log in or create a new account. Your data stays safe across every device.</p>' +
      '<div id="authLoading" class="auth-loading">Loading...</div>' +
      '<div id="authBox" style="display:none">' +
        '<div class="auth-tabs">' +
          '<button type="button" id="tabLogin" class="active">Login</button>' +
          '<button type="button" id="tabSignup">Sign up</button>' +
        '</div>' +
        '<form id="authForm" novalidate>' +
          '<div class="field"><label for="authEmail">Email</label>' +
          '<input type="email" id="authEmail" placeholder="you@example.com" autocomplete="email"></div>' +
          '<div class="field"><label for="authPass">Password (at least 6 characters)</label>' +
          '<input type="password" id="authPass" autocomplete="current-password"></div>' +
          '<p id="authMsg" class="auth-msg"></p>' +
          '<button type="submit" class="btn" id="authSubmit">Login</button>' +
          '<button type="button" class="btn-link" id="authForgot">Forgot password?</button>' +
        '</form>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  function showLoading(text, isError) {
    const el = $('authLoading');
    if (!el) return;
    el.textContent = text;
    el.style.color = isError ? '#ff6b6b' : '';
    el.style.display = 'block';
    const box = $('authBox');
    if (box) box.style.display = 'none';
    overlay.classList.remove('hidden');
  }
  function showForm() {
    const l = $('authLoading');
    const b = $('authBox');
    if (l) l.style.display = 'none';
    if (b) b.style.display = 'block';
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }
  function msg(text, ok) {
    const el = $('authMsg');
    if (!el) return;
    el.style.color = ok ? '#4ade80' : '#ff6b6b';
    el.textContent = text;
  }

  function setMode(m) {
    mode = m;
    $('tabLogin').classList.toggle('active', m === 'login');
    $('tabSignup').classList.toggle('active', m === 'signup');
    $('authSubmit').textContent = m === 'login' ? 'Login' : 'Create Account';
    $('authPass').setAttribute('autocomplete', m === 'login' ? 'current-password' : 'new-password');
    msg('');
  }
  $('tabLogin').addEventListener('click', () => setMode('login'));
  $('tabSignup').addEventListener('click', () => setMode('signup'));

  function friendly(err) {
    const m = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/missing-password': 'Please enter your password.',
      'auth/user-not-found': 'No account found with this email. Please sign up.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/email-already-in-use': 'An account already exists with this email. Please log in.',
      'auth/weak-password': 'Password must be at least 6 characters long.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Please check your internet connection.',
      'auth/operation-not-allowed': 'Email/Password login is not enabled in Firebase.',
      'auth/unauthorized-domain': 'This domain is not authorized in Firebase.'
    };
    return m[err && err.code] || ('Error: ' + ((err && err.message) || 'Something went wrong'));
  }

  if (location.protocol === 'file:') {
    showLoading('Do not open the page directly via double-click for login. Use VS Code Live Server.', true);
    return;
  }
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey) {
    showLoading('Please add your Firebase config in firebase-config.js.', true);
    return;
  }
  if (typeof firebase === 'undefined') {
    showLoading('Firebase failed to load. Check your internet connection and refresh.', true);
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(cfg);
  }
  auth = firebase.auth();
  db = firebase.firestore();
  try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
  showLoading('Loading...');

  $('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('authEmail').value.trim();
    const pass = $('authPass').value;
    if (!email) { msg('Please enter your email.'); return; }
    if (pass.length < 6) { msg('Password must be at least 6 characters long.'); return; }
    $('authSubmit').disabled = true;
    msg('');
    try {
      if (mode === 'signup') await auth.createUserWithEmailAndPassword(email, pass);
      else await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
      msg(friendly(err));
    }
    $('authSubmit').disabled = false;
  });

  $('authForgot').addEventListener('click', async () => {
    const email = $('authEmail').value.trim();
    if (!email) { msg('Please enter your email above first.'); return; }
    try {
      await auth.sendPasswordResetEmail(email);
      msg('Password reset link sent to your email.', true);
    } catch (err) {
      msg(friendly(err));
    }
  });

  function setStatus(text) {
    const el = $('syncStatus');
    if (el) el.textContent = text;
  }
  function schedulePush() {
    setStatus('Saving...');
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 1200);
  }
  async function push() {
    if (!currentUser) return;
    clearTimeout(pushTimer);
    pushTimer = null;
    try {
      await db.collection('users').doc(currentUser.uid).set({
        data: localData(),
        updated: firebase.firestore.FieldValue.serverTimestamp()
      });
      setStatus('✓ Saved to cloud');
    } catch (err) {
      console.error(err);
      setStatus('⚠ Save failed');
    }
  }

  function showUserBar(user) {
    const bar = $('profileBar');
    if (!bar) return;
    let info = bar.querySelector('.profile-text span');
    if (info) info.textContent = user.email + '  |  ✓ Saved to cloud';
    
    if (!bar.querySelector('#logoutBtn')) {
      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '8px';
      
      const out = document.createElement('button');
      out.type = 'button';
      out.className = 'btn btn-small btn-ghost';
      out.id = 'logoutBtn';
      out.textContent = 'Logout';
      out.addEventListener('click', logout);
      btnContainer.appendChild(out);
      bar.appendChild(btnContainer);
    }
  }

  async function logout() {
    try {
      if (pushTimer) await push();
      const uid = currentUser ? currentUser.uid : '';
      await auth.signOut();
      currentUser = null;
      sessionStorage.removeItem(FLAG + uid);
      removeLocalData();
    } catch (err) {
      console.error(err);
    }
    location.reload();
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
  }

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      currentUser = null;
      showForm();
      return;
    }
    showLoading('Syncing your data...');

    let syncDone = false;
    const fallbackTimer = setTimeout(() => {
      if (!syncDone) {
        currentUser = user;
        showUserBar(user);
        hideOverlay();
      }
    }, 3000);

    try {
      const flagKey = FLAG + user.uid;
      const firstSync = !sessionStorage.getItem(flagKey);
      const snap = await withTimeout(db.collection('users').doc(user.uid).get(), 2500);
      
      syncDone = true;
      clearTimeout(fallbackTimer);

      const cloud = snap.exists ? ((snap.data() && snap.data().data) || {}) : {};
      const local = localData();

      if (!snap.exists) {
        currentUser = user;
        sessionStorage.setItem(flagKey, '1');
        await push();
      } else if (firstSync) {
        let changed = false;
        Object.keys(cloud).forEach((k) => {
          if (local[k] !== cloud[k]) { origSet.call(localStorage, k, cloud[k]); changed = true; }
        });
        sessionStorage.setItem(flagKey, '1');
        if (changed) { location.reload(); return; }
        currentUser = user;
      } else {
        currentUser = user;
        if (!sameData(local, cloud)) await push();
      }

      showUserBar(user);
      hideOverlay();
    } catch (err) {
      syncDone = true;
      clearTimeout(fallbackTimer);
      currentUser = user;
      showUserBar(user);
      hideOverlay();
    }
  });
})();