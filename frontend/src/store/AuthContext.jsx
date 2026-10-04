/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI } from '../api';
import { saveAuthSession, readAuthSession, AUTH_SESSION_ENDED, AUTH_SESSION_STATE, AUTH_PENDING,
  stopAuthSession, suspendAuthSession, resumeAuthSession, isSessionStopped, persistentSessionBlocked,
  getSessionNotice, setSessionNotice, invalidateSessionRequests, sharedSessionHint, authStoppedError } from '../utils/authSession';
import { requestError } from '../utils/requestError';

const AuthContext = createContext(null);
const sameIdentity = (a, b) => !!a && !!b && ['id', 'role', 'school_id', 'class_id'].every(key => String(a[key] ?? '') === String(b[key] ?? ''));
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), userRef = useRef(null);
  const [loading, setLoading] = useState(true), [authError, setAuthError] = useState('');
  const generation = useRef(0), verification = useRef(0);
  const updateUser = useCallback(next => { userRef.current = next; setUser(next); }, []);
  const invalidate = useCallback(() => { generation.current++; verification.current++; }, []);
  const restore = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setAuthError(''); updateUser(null);
    try {
      if (isSessionStopped() || persistentSessionBlocked()) {
        setSessionNotice(getSessionNotice() || '上次会话已退出，请重新登录。');
        return;
      }
      const { token } = readAuthSession(() => window.localStorage);
      if (token) {
        const res = await authAPI.me();
        if (current === generation.current) updateUser(res.user);
      }
    } catch (error) {
      if (current === generation.current) setAuthError(requestError(error, { action: '恢复登录' }));
    } finally { if (current === generation.current) setLoading(false); }
  }, [updateUser]);
  useEffect(() => {
    const ended = () => { invalidate(); updateUser(null); setLoading(false); setAuthError(''); };
    const forced = () => {
      if (!userRef.current || userRef.current.force_reset_password) return;
      invalidate(); invalidateSessionRequests();
      updateUser({ ...userRef.current, force_reset_password: true });
    };
    const verifyStable = async () => {
      let hint;
      try { hint = sharedSessionHint(); }
      catch {
        // A failed hint cannot grant an identity. Restore offers a recoverable storage error.
        invalidateSessionRequests(); void restore(); return;
      }
      if (hint.pending) return; // The save's final marker will schedule a stable verification.
      if (hint.event?.kind === 'ended' || !hint.token) {
        if (!isSessionStopped()) suspendAuthSession('该账号已在其他页面退出，请重新登录。');
        return;
      }
      const currentUser = userRef.current;
      if (!sameIdentity(currentUser, hint.user) || isSessionStopped()) {
        invalidate(); invalidateSessionRequests(); updateUser(null);
        resumeAuthSession();
        void restore();
        return;
      }
      if (hint.event?.kind === 'force-reset' || hint.user?.force_reset_password) forced();
      const ticket = ++verification.current, current = generation.current;
      try {
        // Only the server can confirm the identity. The hint above controls lifecycle, not access.
        const res = await authAPI.me();
        if (ticket !== verification.current || current !== generation.current || isSessionStopped()) return;
        if (!sameIdentity(currentUser, res.user)) {
          invalidateSessionRequests(); updateUser(null); void restore(); return;
        }
        if (res.user.force_reset_password && !userRef.current?.force_reset_password) forced();
        updateUser(res.user); setAuthError('');
      } catch (error) {
        // Confirmed 401/FORCE_RESET already follows the global path; transient reads keep inputs.
        if (ticket === verification.current && current === generation.current && !isSessionStopped())
          setAuthError(requestError(error, { action: '复核登录' }));
      }
    };
    const changed = event => {
      if (event.key === AUTH_SESSION_STATE) {
        // Ignore an obsolete queued event if a newer stable save has already superseded it.
        try { if (event.newValue !== window.localStorage.getItem(AUTH_SESSION_STATE)) return; } catch { /* Verify safely below. */ }
        void verifyStable();
      } else if (event.key === null || (event.key === 'token' && !event.newValue)) {
        try {
          const hint = sharedSessionHint();
          if (!hint.pending && !hint.token) suspendAuthSession('该账号已在其他页面退出，请重新登录。');
        } catch { invalidateSessionRequests(); void restore(); }
      } else if (event.key === AUTH_PENDING && !event.newValue) {
        // Compatibility with an older tab that has not yet emitted the stable marker.
        try { if (!window.localStorage.getItem(AUTH_SESSION_STATE)) void verifyStable(); } catch { void restore(); }
      }
    };
    window.addEventListener(AUTH_SESSION_ENDED, ended);
    window.addEventListener('auth-force-reset', forced);
    window.addEventListener('storage', changed);
    void restore();
    return () => {
      invalidate();
      window.removeEventListener(AUTH_SESSION_ENDED, ended);
      window.removeEventListener('auth-force-reset', forced);
      window.removeEventListener('storage', changed);
    };
  }, [restore, invalidate, updateUser]);
  const logout = () => {
    let refreshToken;
    try { refreshToken = readAuthSession(() => window.localStorage).refresh_token; } catch { /* Still hide local content. */ }
    stopAuthSession('已退出登录。');
    if (refreshToken) authAPI.logout(refreshToken).catch(() => {});
  };
  const applySession = (res, passwordChanged = false) => {
    try {
      const nextUser = saveAuthSession(() => window.localStorage, res, passwordChanged ? 'password' : 'login');
      resumeAuthSession(); setAuthError(''); updateUser(nextUser);
      return nextUser;
    } catch (error) {
      const reason = passwordChanged
        ? '密码已经修改，但新登录信息无法保存。请恢复浏览器存储后，用新密码重新登录。' : error.message;
      stopAuthSession(reason);
      if (res.refresh_token) authAPI.logout(res.refresh_token).catch(() => {});
      throw Object.assign(error, { message: reason, code: passwordChanged ? 'PASSWORD_CHANGED_STORAGE' : 'AUTH_STORAGE' });
    }
  };
  const login = async (username, password) => {
    stopAuthSession('');
    const current = ++generation.current;
    setAuthError('');
    const res = await authAPI.login(username, password);
    if (current !== generation.current) throw authStoppedError();
    return applySession(res);
  };
  const changePassword = async data => {
    const current = generation.current;
    const res = await authAPI.changePassword(data);
    if (current !== generation.current) throw authStoppedError();
    return applySession(res, true);
  };
  const refreshUser = async () => {
    const current = generation.current;
    const res = await authAPI.me();
    if (current !== generation.current) throw authStoppedError();
    updateUser(res.user); return res.user;
  };
  return <AuthContext.Provider value={{ user, loading, authError, retryRestore: restore, login, logout, refreshUser, changePassword }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
