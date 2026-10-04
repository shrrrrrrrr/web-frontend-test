import axios from 'axios';
import { message } from 'antd';
import { accessCheckForError, STUDENT_ACCESS_CHECK } from '../student/accessPolicy';
import { readAuthSession, saveAuthSession, sessionRevision, isSessionStopped, stopAuthSession, authStoppedError } from '../utils/authSession';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const settings = { baseURL: API_BASE, timeout: 15000, headers: { 'Content-Type': 'application/json' } };
const client = axios.create(settings);
const authClient = axios.create(settings);
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
let refreshPromise = null;
const publicAuth = (url = '') => /^\/auth\/(login|refresh|logout)$/.test(url);
const readSession = () => readAuthSession(() => window.localStorage);
function isTokenExpiringSoon(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp && payload.exp * 1000 - Date.now() < REFRESH_THRESHOLD_MS;
  } catch { return false; }
}
async function doRefresh() {
  const revision = sessionRevision();
  const { refresh_token } = readSession();
  if (!refresh_token) throw Object.assign(new Error('登录已失效，请重新登录。'), { code: 'NO_REFRESH' });
  const res = await authClient.post('/auth/refresh', { refresh_token });
  if (revision !== sessionRevision() || isSessionStopped()) throw authStoppedError();
  try { saveAuthSession(() => window.localStorage, res.data); }
  catch (error) {
    stopAuthSession('刷新后的登录信息无法保存，请恢复浏览器存储后重新登录。');
    authClient.post('/auth/logout', { refresh_token: res.data.refresh_token }).catch(() => {});
    throw error;
  }
  return res.data.token;
}
function refresh() {
  if (!refreshPromise || refreshPromise.revision !== sessionRevision()) {
    const revision = sessionRevision();
    const promise = doRefresh().finally(() => { if (refreshPromise?.promise === promise) refreshPromise = null; });
    refreshPromise = { revision, promise };
  }
  return refreshPromise.promise;
}
function handleRefreshFailure(error, revision) {
  if (revision === sessionRevision() && (error.response?.status === 401 || error.code === 'NO_REFRESH')) {
    stopAuthSession('登录已失效，请重新登录；如账号被停用，请联系老师。');
  }
}
client.interceptors.request.use(async (config) => {
  if (publicAuth(config.url)) return config;
  if (isSessionStopped() || (config._authRevision !== undefined && config._authRevision !== sessionRevision())) throw authStoppedError();
  config._authRevision = sessionRevision();
  let { token } = readSession();
  if (!config._retry && isTokenExpiringSoon(token)) {
    try { token = await refresh(); }
    catch (error) {
      handleRefreshFailure(error, config._authRevision);
      // A transient proactive refresh failure can still use an unexpired access token.
      if (isSessionStopped() || error.code === 'AUTH_STORAGE' || error.code === 'AUTH_STOPPED') throw error;
    }
  }
  if (config._authRevision !== sessionRevision()) throw authStoppedError();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use(
  (response) => {
    if (!publicAuth(response.config.url) && response.config._authRevision !== sessionRevision()) throw authStoppedError();
    return response.data;
  },
  async (error) => {
    const { config, response } = error;
    if (error.code === 'AUTH_STORAGE' || error.code === 'AUTH_STOPPED') return Promise.reject(error);
    if (!publicAuth(config?.url) && config?._authRevision !== sessionRevision()) return Promise.reject(authStoppedError());
    if (typeof Blob !== 'undefined' && response?.data instanceof Blob && response.data.size < 65536) {
      try { response.data = JSON.parse(await response.data.text()); } catch { /* Not a JSON error. */ }
    }
    if (!publicAuth(config?.url) && config?._authRevision !== sessionRevision()) return Promise.reject(authStoppedError());
    if (response?.status === 401 && !publicAuth(config?.url)) {
      if (!config._retry) {
        config._retry = true;
        try {
          const persisted = readSession().token;
          // A concurrent request may already have rotated credentials before this 401 arrived.
          const token = persisted && config.headers.Authorization !== `Bearer ${persisted}` ? persisted : await refresh();
          config.headers.Authorization = `Bearer ${token}`;
          return client(config);
        } catch (refreshError) {
          handleRefreshFailure(refreshError, config._authRevision);
          return Promise.reject(refreshError);
        }
      }
      stopAuthSession('登录已失效，请重新登录；如账号被停用，请联系老师。');
      return Promise.reject(error);
    }
    if (response?.status === 403 && response.data?.code === 'FORCE_RESET') {
      window.dispatchEvent(new CustomEvent('auth-force-reset'));
      return Promise.reject(error);
    }
    const accessCheck = accessCheckForError(error);
    if (accessCheck) window.dispatchEvent(new CustomEvent(STUDENT_ACCESS_CHECK, { detail: accessCheck }));
    if (!config?.silent) message.error(response?.data?.error || response?.data?.message || '请求失败');
    return Promise.reject(error);
  }
);
export default client;
