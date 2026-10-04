// Browser persistence guards only; token protocol and server authorization are unchanged.
export const AUTH_SESSION_ENDED = 'auth-session-ended';
export const AUTH_KEYS = ['token', 'refresh_token', 'user'];
const PENDING = 'auth-session-pending';
const BLOCKED = 'auth-session-blocked';
let revision = 0, stopped = false, memoryNotice = null;
export const sessionRevision = () => revision;
export const invalidateSessionRequests = () => { revision++; };
export const isSessionStopped = () => stopped;
const source = (value) => typeof value === 'function' ? value() : value;
function storageError(stage, message, cleanupFailed = false) {
  return Object.assign(new Error(message), { code: 'AUTH_STORAGE', stage, cleanupFailed });
}
export function clearAuthSession(storage) {
  const errors = [];
  let target;
  try { target = source(storage); } catch { return false; }
  // Attempt every key even if one removal fails.
  for (const key of AUTH_KEYS) {
    try { target.removeItem(key); } catch { errors.push(key); }
  }
  if (!errors.length) { try { target.removeItem(PENDING); } catch { errors.push(PENDING); } }
  if (errors.length) { try { target.setItem(PENDING, '1'); } catch { /* Browser may deny all persistence. */ } }
  return errors.length === 0;
}
export function readAuthSession(storage) {
  let target;
  try { target = source(storage); } catch { throw storageError('get', '浏览器不允许访问登录存储。请允许本站存储后重试，或重新登录。'); }
  try {
    if (target.getItem(PENDING)) throw storageError('incomplete', '上次登录信息未完整保存，请恢复浏览器存储后重新登录。');
    return { token: target.getItem('token'), refresh_token: target.getItem('refresh_token') };
  } catch (error) {
    if (error.code === 'AUTH_STORAGE') throw error;
    throw storageError('read', '无法读取登录信息，请检查浏览器存储权限后重试。');
  }
}
export function saveAuthSession(storage, session) {
  if (!session?.token || !session?.refresh_token || !session?.user?.id) throw new Error('服务端未返回完整登录信息，请重新登录。');
  let target;
  try { target = source(storage); } catch { throw storageError('get', '浏览器不允许保存登录信息，请允许本站存储后重新登录。'); }
  try {
    // A marker prevents a partially saved set from being restored on a later page load.
    target.setItem(PENDING, '1');
    for (const key of AUTH_KEYS) target.removeItem(key);
    target.setItem('token', session.token);
    target.setItem('refresh_token', session.refresh_token);
    target.setItem('user', JSON.stringify(session.user));
    target.removeItem(PENDING);
    return session.user;
  } catch {
    // Keep the marker if cleanup cannot complete.
    let clean = true;
    for (const key of AUTH_KEYS) { try { target.removeItem(key); } catch { clean = false; } }
    if (clean) { try { target.removeItem(PENDING); } catch { clean = false; } }
    throw storageError('write', clean ? '登录信息保存失败，未进入账号页面。请恢复浏览器存储后重新登录。' : '登录信息保存失败，部分旧记录暂时无法清理。当前页面已停止使用这些信息，请恢复存储后重新登录。', !clean);
  }
}
export function setSessionNotice(text) {
  memoryNotice = text || '';
  try { if (text) window.sessionStorage.setItem('session-notice', text); else window.sessionStorage.removeItem('session-notice'); } catch { /* Notices are not identity credentials. */ }
}
export function getSessionNotice() {
  if (memoryNotice !== null) return memoryNotice;
  try { return window.sessionStorage.getItem('session-notice') || ''; } catch { return ''; }
}
export function persistentSessionBlocked() {
  try { return window.sessionStorage.getItem(BLOCKED) === '1'; } catch { return false; }
}
export function stopAuthSession(reason) {
  stopped = true; revision++;
  try { window.sessionStorage.setItem(BLOCKED, '1'); } catch { /* Runtime guard still stops this page. */ }
  const clean = clearAuthSession(() => window.localStorage);
  const notice = reason + (clean ? '' : ' 浏览器暂时无法清理全部登录记录；当前页面已停止使用，请恢复存储后重新登录。');
  setSessionNotice(notice);
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_ENDED, { detail: { reason: notice } }));
  return clean;
}
export function resumeAuthSession() {
  stopped = false; revision++;
  try { window.sessionStorage.removeItem(BLOCKED); } catch { try { window.sessionStorage.setItem(BLOCKED, '0'); } catch { /* Credentials already persisted; this optional fence may require a new tab. */ } }
  setSessionNotice('');
}
export function authStoppedError() { return Object.assign(new Error('当前会话已停止，请重新登录。'), { code: 'AUTH_STOPPED' }); }
