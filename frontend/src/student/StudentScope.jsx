import { useEffect, useRef, useState } from 'react';
import { Alert, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { PageLoading, StudentPageStatus } from '../components/PageStatus';
import { authAPI, courseAPI } from '../api';
import client from '../api/client';
import { useAuth } from '../store/AuthContext';
import { currentAccessTarget, removedCourseIds, STUDENT_ACCESS_CHECK, STUDENT_COURSES_CHANGED } from './accessPolicy';

// 后端负责最终授权。这里只清除已确认失效的页面，并保留与错误无关的输入。
export default function StudentScope({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const route = useRef(location);
  const checkRef = useRef(null);
  const [state, setState] = useState({ userId: user.id, ready: false, warning: '', courses: null, blocked: null, archiveRevision: 0 });

  useEffect(() => {
    route.current = location;
    checkRef.current?.();
  }, [location]); // 阶段/卡片 URL 变化只重验，不重建页面。

  useEffect(() => {
    let alive = true;
    let running = false;
    let queuedObjectCheck = false;
    let knownCourses;
    const check = async (verifyObject = false) => {
      if (running) { queuedObjectCheck ||= verifyObject; return; }
      running = true;
      const target = currentAccessTarget(route.current.pathname, route.current.search);
      try {
        const [account, payload] = await Promise.all([authAPI.me(), courseAPI.list()]);
        if (!alive) return;
        if (String(account.user.id) !== String(user.id) || account.user.role !== 'student') {
          window.location.assign('/'); return;
        }
        if (account.user.force_reset_password) { window.location.assign('/change-password'); return; }
        const courses = payload.courses || [];
        const removed = knownCourses ? removedCourseIds(knownCourses, courses) : [];
        const previousIds = knownCourses?.map((course) => String(course.id)).sort().join(',');
        const nextIds = courses.map((course) => String(course.id)).sort().join(',');
        if (knownCourses && previousIds !== nextIds) {
          window.dispatchEvent(new CustomEvent(STUDENT_COURSES_CHANGED, { detail: { removedCourseIds: removed, courses } }));
        }
        knownCourses = courses;
        setState((previous) => ({ ...previous, userId: user.id, ready: true, warning: '', courses,
          blocked: previous.userId === user.id ? previous.blocked : null,
          archiveRevision: previous.userId === user.id ? previous.archiveRevision + (removed.length ? 1 : 0) : 0 }));

        // 附件错误无法证明课程撤回。只对当前课程/作品/任务读接口做一次核验，
        // 成功时不重新装载其数据，更不会重置正在填写的表单。
        if (target.endpoint && (verifyObject || removed.length)) {
          try {
            await client.get(target.endpoint, { studentAccessProbe: true, silent: true });
            if (alive) setState((previous) => ({ ...previous,
              blocked: previous.blocked?.key === target.key ? null : previous.blocked }));
          } catch (error) {
            if (!alive) return;
            if ([403, 404].includes(error.response?.status)
              || (error.response?.status === 400 && error.response?.data?.error === '作品不存在')) {
              setState((previous) => ({ ...previous, blocked: { key: target.key,
                reason: error.response?.data?.error || '当前内容已不可访问，可能已撤回或权限发生变化。' } }));
            } else {
              setState((previous) => ({ ...previous, warning: '暂时无法重新核验当前内容，请检查网络后重试。页面中的填写内容仍保留。' }));
            }
          }
        }
      } catch (error) {
        if (alive) setState((previous) => ({ ...previous, warning: error.response?.data?.error
          || '暂时无法重新检查账号与课程，请检查网络后重试。已有填写内容仍保留，提交时仍由服务器校验。' }));
      } finally {
        running = false;
        if (alive && queuedObjectCheck) { queuedObjectCheck = false; check(true); }
      }
    };
    checkRef.current = check;
    const focus = () => { if (!document.hidden) check(); };
    const verify = () => check(true);
    check();
    const timer = setInterval(focus, 30000);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    window.addEventListener(STUDENT_ACCESS_CHECK, verify);
    return () => {
      alive = false; checkRef.current = null; clearInterval(timer);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', focus);
      window.removeEventListener(STUDENT_ACCESS_CHECK, verify);
    };
  }, [user.id]);

  if (state.userId !== user.id) return <PageLoading>正在确认可进入的课程，请稍候。</PageLoading>;
  const target = currentAccessTarget(location.pathname, location.search);
  const missingCourse = target.courseId && state.courses && !state.courses.some((course) => String(course.id) === target.courseId);
  const blocked = state.blocked?.key === target.key ? state.blocked : null;
  const retry = <Button onClick={() => checkRef.current?.(true)}>重新检查</Button>;
  if (missingCourse || blocked) return <StudentPageStatus title="当前内容已不可访问"
    description={<>{missingCourse ? '课程已撤回或报名关系已变化，相关学习内容已清除。请返回探索地图选择可进入的课程。' : blocked.reason}
      {state.warning && <><br /><span role="status">{state.warning}</span></>}</>}>
    <Link to="/explore" className="student-status-return">返回探索地图</Link>
    {retry}
  </StudentPageStatus>;
  if (!state.ready) return state.warning
    ? <StudentPageStatus title="暂时无法确认账号与课程" description="暂时无法连接服务来确认你的账号与课程。这不代表课程已撤回，请检查网络后重新检查。">{retry}</StudentPageStatus>
    : <PageLoading>正在确认可进入的课程，请稍候。</PageLoading>;
  return <>
    {state.warning && <Alert type="warning" showIcon title="权限检查暂未完成" description={state.warning} action={retry} style={{ margin: 16 }} />}
    <div key={`${user.id}:${location.pathname}:${location.pathname === '/archives' ? state.archiveRevision : 0}`}>{children}</div>
  </>;
}
