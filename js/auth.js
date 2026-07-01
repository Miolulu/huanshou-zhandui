/** 本地账号注册 / 登录（浏览器 localStorage，成长数据按账号隔离） */

const ACCOUNTS_KEY = 'hszd_accounts_v1';
const SESSION_KEY = 'hszd_session_v1';
const LEGACY_PROFILE_KEY = 'hszd_player_profile_v1';

function loadAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function hashPassword(password) {
  const text = password + ':hszd_salt';
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
  return `f_${(h >>> 0).toString(16)}`;
}

function validateUsername(username) {
  const u = username.trim();
  if (u.length < 3 || u.length > 16) return '账号需 3-16 个字符';
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(u)) return '账号仅支持中文、字母、数字、下划线';
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 6) return '密码至少 6 位';
  if (password.length > 32) return '密码最多 32 位';
  return null;
}

function validateNickname(nickname) {
  const n = nickname.trim();
  if (n.length < 2 || n.length > 12) return '昵称需 2-12 个字符';
  return null;
}

/** 清理旧版全局档案与无效 session，不影响已注册账号 */
export function cleanupLegacyAuthData() {
  localStorage.removeItem(LEGACY_PROFILE_KEY);

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    const accounts = loadAccounts();
    const acc = accounts[session.usernameKey];
    if (!acc || acc.id !== session.accountId) {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const accounts = loadAccounts();
    const acc = accounts[session.usernameKey];
    if (!acc || acc.id !== session.accountId) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { ...session, nickname: acc.nickname };
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getSession();
}

export function getCurrentAccountId() {
  return getSession()?.accountId || null;
}

export function getCurrentUsername() {
  return getSession()?.username || null;
}

export async function register(username, password, nickname) {
  const uErr = validateUsername(username);
  if (uErr) throw new Error(uErr);
  const pErr = validatePassword(password);
  if (pErr) throw new Error(pErr);
  const nErr = validateNickname(nickname);
  if (nErr) throw new Error(nErr);

  const key = username.trim().toLowerCase();
  const accounts = loadAccounts();
  if (accounts[key]) throw new Error('该账号已被注册');

  const accountId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  accounts[key] = {
    id: accountId,
    username: username.trim(),
    passwordHash: await hashPassword(password),
    nickname: nickname.trim(),
    createdAt: Date.now(),
  };
  saveAccounts(accounts);

  const session = {
    accountId,
    username: accounts[key].username,
    usernameKey: key,
    loginAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { accountId, username: accounts[key].username, nickname: accounts[key].nickname };
}

export async function login(username, password) {
  const uErr = validateUsername(username);
  if (uErr) throw new Error(uErr);
  const pErr = validatePassword(password);
  if (pErr) throw new Error(pErr);

  const key = username.trim().toLowerCase();
  const accounts = loadAccounts();
  const acc = accounts[key];
  if (!acc) throw new Error('账号不存在，请先注册');
  const hash = await hashPassword(password);
  if (hash !== acc.passwordHash) throw new Error('密码错误');

  const session = {
    accountId: acc.id,
    username: acc.username,
    usernameKey: key,
    loginAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { accountId: acc.id, username: acc.username, nickname: acc.nickname };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function updateAccountNickname(nickname) {
  const nErr = validateNickname(nickname);
  if (nErr) throw new Error(nErr);
  const session = getSession();
  if (!session) throw new Error('未登录');

  const accounts = loadAccounts();
  const acc = accounts[session.usernameKey];
  if (!acc) throw new Error('账号不存在');
  acc.nickname = nickname.trim();
  saveAccounts(accounts);
  return acc.nickname;
}
