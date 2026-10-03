import { useEffect, useState } from 'react';
import { Button, Result, Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import { authAPI, courseAPI } from '../api';
import { useAuth } from '../store/AuthContext';

// 后端负责授权。此处重验用于清除学生界面中的失效数据，不作授权替代。
export default function StudentScope({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ ready: false, error: '', revision: 0 });
  useEffect(() => {
    let alive = true;
    let busy = false;
    let fingerprint;
    let invalidated = false;
    setState({ ready: false, error: '', revision: 0 });
    const check = async () => {
      if (busy || invalidated) return;
      busy = true;
      try {
        const [account, payload] = await Promise.all([authAPI.me(), courseAPI.list()]);
        if (!alive || invalidated) return;
        if (account.user.id !== user.id || account.user.role !== 'student') {
          window.location.assign('/'); return;
        }
        if (account.user.force_reset_password) { window.location.assign('/change-password'); return; }
        const next = JSON.stringify(payload.courses.map((course) => [course.id, course.status, course.updated_at]).sort());
        const changed = fingerprint !== undefined && next !== fingerprint;
        fingerprint = next;
        setState((previous) => ({ ready: true, error: '', revision: previous.revision + (changed ? 1 : 0) }));
      } catch (error) {
        if (alive) setState((previous) => ({ ...previous, ready: false,
          error: error.response?.data?.error || '暂时无法确认账号与课程权限。已隐藏学习内容，请检查网络后重试。' }));
      } finally { busy = false; }
    };
    const invalidate = () => {
      invalidated = true;
      setState((previous) => ({ ...previous, ready: false, error: '内容不可访问，可能已撤回或权限发生变化。请重新检查，或返回探索地图。' }));
    };
    const focus = () => { if (!document.hidden) check(); };
    check();
    const timer = setInterval(focus, 30000);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    window.addEventListener('student-access-invalid', invalidate);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); window.removeEventListener('student-access-invalid', invalidate); };
  }, [user.id, location.pathname, location.search, attempt]);
  if (state.error) return <Result status="warning" title="学习内容暂不可用" subTitle={state.error} extra={<Button onClick={() => setAttempt((value) => value + 1)}>重新检查</Button>} />;
  if (!state.ready) return <Spin style={{ display: 'block', padding: 64 }} />;
  return <div key={`${user.id}:${location.pathname}:${location.search}:${state.revision}`}>{children}</div>;
}
