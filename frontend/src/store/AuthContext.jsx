/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI } from '../api';
import { saveAuthSession, readAuthSession, AUTH_SESSION_ENDED, stopAuthSession, resumeAuthSession, isSessionStopped, persistentSessionBlocked, getSessionNotice, setSessionNotice, invalidateSessionRequests, authStoppedError } from '../utils/authSession';
import { requestError } from '../utils/requestError';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const generation = useRef(0);
  const invalidate = useCallback(() => { generation.current++; }, []);
  const restore = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setAuthError(''); setUser(null);
    try {
      if (isSessionStopped() || persistentSessionBlocked()) {
        setSessionNotice(getSessionNotice() || '上次会话已退出，请重新登录。');
        return;
      }
      const { token } = readAuthSession(() => window.localStorage);
      if (token) {
        const res = await authAPI.me();
        if (current === generation.current) setUser(res.user);
      }
    } catch (error) {
      if (current === generation.current) setAuthError(requestError(error, { action: '恢复登录' }));
    } finally { if (current === generation.current) setLoading(false); }
  }, []);
  useEffect(() => {
    const ended = () => { invalidate(); setUser(null); setLoading(false); setAuthError(''); };
    const forced = () => setUser((value) => value ? { ...value, force_reset_password: true } : value);
    const changed = (event) => {
      // Re-verify the server identity after another tab changes credentials.
      if (event.key === 'user' || (event.key === 'token' && !event.newValue)) { invalidateSessionRequests(); void restore(); }
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
  }, [restore, invalidate]);
  const logout = () => {
    let refreshToken;
    try { refreshToken = readAuthSession(() => window.localStorage).refresh_token; } catch { /* Local content must still disappear. */ }
    stopAuthSession('已退出登录。');
    if (refreshToken) authAPI.logout(refreshToken).catch(() => {});
  };
  const applySession = (res, passwordChanged = false) => {
    try {
      const nextUser = saveAuthSession(() => window.localStorage, res);
      resumeAuthSession(); setAuthError(''); setUser(nextUser);
      return nextUser;
    } catch (error) {
      const reason = passwordChanged
        ? '密码已经修改，但新登录信息无法保存。请恢复浏览器存储后，用新密码重新登录。'
        : error.message;
      stopAuthSession(reason);
      if (res.refresh_token) authAPI.logout(res.refresh_token).catch(() => {});
      throw Object.assign(error, { message: reason, code: passwordChanged ? 'PASSWORD_CHANGED_STORAGE' : 'AUTH_STORAGE' });
    }
  };
  const login = async (username, password) => {
    // Invalidate responses belonging to a previous account before attempting a new sign-in.
    stopAuthSession('');
    const current = ++generation.current;
    setAuthError('');
    const res = await authAPI.login(username, password);
    if (current !== generation.current) throw authStoppedError();
    return applySession(res);
  };
  const changePassword = async (data) => {
    const current = generation.current;
    const res = await authAPI.changePassword(data);
    if (current !== generation.current) throw authStoppedError();
    return applySession(res, true);
  };
  const refreshUser = async () => {
    const current = generation.current;
    const res = await authAPI.me();
    if (current !== generation.current) throw authStoppedError();
    setUser(res.user); return res.user;
  };
  return <AuthContext.Provider value={{ user, loading, authError, retryRestore: restore, login, logout, refreshUser, changePassword }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
