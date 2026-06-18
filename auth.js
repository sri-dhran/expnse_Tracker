/**
 * Expenxe — Auth Module
 * Client-side user accounts stored in localStorage.
 * Passwords are SHA-256 hashed (+ salt) before storage.
 */

const AUTH_USERS_KEY   = 'expenxe_users';
const AUTH_SESSION_KEY = 'expenxe_session';
const SALT             = 'expenxe_2026_salt';

// ── Crypto ─────────────────────────────────────────────
async function hashPassword(password) {
    const encoder    = new TextEncoder();
    const data       = encoder.encode(password + SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Storage helpers ─────────────────────────────────────
function getUsers() {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || {};
}
function saveUsers(u) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(u));
}

// ── Session ─────────────────────────────────────────────
function getCurrentUser() {
    return localStorage.getItem(AUTH_SESSION_KEY) || null;
}
function setSession(username) {
    localStorage.setItem(AUTH_SESSION_KEY, username);
}
function logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
    location.reload();
}

// ── Sign-up ─────────────────────────────────────────────
async function signup(username, password, confirm) {
    const uname = username.trim().toLowerCase().replace(/\s+/g, '_');

    if (uname.length < 3)        return { ok: false, msg: 'Username must be at least 3 characters.' };
    if (!/^[a-z0-9_]+$/.test(uname)) return { ok: false, msg: 'Only letters, numbers and _ allowed in username.' };
    if (password.length < 4)     return { ok: false, msg: 'Password must be at least 4 characters.' };
    if (password !== confirm)    return { ok: false, msg: 'Passwords do not match.' };

    const users = getUsers();
    if (users[uname])            return { ok: false, msg: 'Username already taken. Try another.' };

    const hash = await hashPassword(password);
    users[uname] = { passwordHash: hash, createdAt: new Date().toISOString() };
    saveUsers(users);
    setSession(uname);
    return { ok: true };
}

// ── Login ───────────────────────────────────────────────
async function login(username, password) {
    const uname = username.trim().toLowerCase().replace(/\s+/g, '_');
    const users = getUsers();
    const user  = users[uname];

    if (!user) return { ok: false, msg: 'No account found with that username.' };

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) return { ok: false, msg: 'Incorrect password.' };

    setSession(uname);
    return { ok: true };
}

// ── Auth-screen bootstrap ────────────────────────────────
(function bootAuth() {
    const authEl = document.getElementById('auth-screen');
    const appEl  = document.querySelector('.app-container');

    if (!authEl || !appEl) return;

    if (getCurrentUser()) {
        // Already logged in → show app
        authEl.style.display = 'none';
        appEl.style.display  = 'flex';
        return;
    }

    // Not logged in → show auth, hide app
    authEl.style.display  = 'flex';
    appEl.style.display   = 'none';

    // ── View switching ──────────────────────────────────
    const loginView  = document.getElementById('auth-login-view');
    const signupView = document.getElementById('auth-signup-view');

    function showLogin()  { loginView.classList.add('active');  signupView.classList.remove('active'); clearErrors(); }
    function showSignup() { signupView.classList.add('active'); loginView.classList.remove('active');  clearErrors(); }

    document.getElementById('goto-signup').addEventListener('click', showSignup);
    document.getElementById('goto-login').addEventListener('click', showLogin);

    // ── Error helper ────────────────────────────────────
    function showError(id, msg) {
        const el = document.getElementById(id);
        if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
    }
    function clearErrors() {
        ['login-error', 'signup-error'].forEach(id => showError(id, ''));
    }

    // ── Loading helper ──────────────────────────────────
    function setLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.disabled = loading;
        btn.querySelector('.btn-label').style.display  = loading ? 'none'  : 'inline';
        btn.querySelector('.btn-loader').style.display = loading ? 'inline': 'none';
    }

    // ── Login form ──────────────────────────────────────
    document.getElementById('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        clearErrors();
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;

        setLoading('login-submit', true);
        const res = await login(u, p);
        setLoading('login-submit', false);

        if (res.ok) {
            authEl.classList.add('auth-exit');
            setTimeout(() => location.reload(), 400);
        } else {
            showError('login-error', res.msg);
        }
    });

    // ── Signup form ─────────────────────────────────────
    document.getElementById('signup-form').addEventListener('submit', async e => {
        e.preventDefault();
        clearErrors();
        const u  = document.getElementById('signup-username').value;
        const p  = document.getElementById('signup-password').value;
        const cp = document.getElementById('signup-confirm').value;

        setLoading('signup-submit', true);
        const res = await signup(u, p, cp);
        setLoading('signup-submit', false);

        if (res.ok) {
            authEl.classList.add('auth-exit');
            setTimeout(() => location.reload(), 400);
        } else {
            showError('signup-error', res.msg);
        }
    });
})();
