import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'antd';
import { courseAPI } from '../api';
import { requestError } from '../utils/requestError';
import { STUDENT_COURSES_CHANGED } from './accessPolicy';
import { PixelButton } from './visual/PixelUI';

// 每项下载独立；附件错误不清除已核验的页面。下载后再次核验课程再触发浏览器保存。
export default function CourseResourceDownload({ resource, courseId }) {
  const live = useRef(false), busy = useRef(false), generation = useRef(0), urls = useRef(new Set());
  const [state, setState] = useState({ loading: false, error: null });
  const invalidate = useCallback(() => { generation.current++; live.current = false; }, []);
  useEffect(() => {
    live.current = true;
    const changed = ({ detail }) => {
      if (detail.removedCourseIds.map(String).includes(String(courseId))) { generation.current++; live.current = false; }
    };
    const pendingUrls = urls.current;
    window.addEventListener(STUDENT_COURSES_CHANGED, changed);
    return () => { invalidate(); pendingUrls.forEach(URL.revokeObjectURL); pendingUrls.clear(); window.removeEventListener(STUDENT_COURSES_CHANGED, changed); };
  }, [courseId, resource.id, invalidate]);
  const download = async () => {
    if (busy.current || !live.current) return;
    busy.current = true;
    const ticket = ++generation.current;
    setState({ loading: true, error: null });
    let url;
    try {
      const blob = await courseAPI.downloadResource(resource.id);
      if (!live.current || ticket !== generation.current) return;
      await courseAPI.detail(courseId);
      if (!live.current || ticket !== generation.current) return;
      url = URL.createObjectURL(blob); urls.current.add(url);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = resource.title || '课程资料';
      document.body.append(anchor); anchor.click(); anchor.remove();
    } catch (error) { if (live.current && ticket === generation.current) setState({ loading: false, error }); }
    finally {
      if (url) { URL.revokeObjectURL(url); urls.current.delete(url); }
      if (live.current && ticket === generation.current) { busy.current = false; setState(s => ({ ...s, loading: false })); }
    }
  };
  return <div className="compat-download"><PixelButton size="small" loading={state.loading} onClick={download} aria-label={`${state.error ? '重试下载' : '下载'}：${resource.title || '课程资料'}`}>{state.error ? '重试下载' : '下载资料'}</PixelButton>
    {state.error && <Alert role="alert" type="warning" title="这份资料暂时无法下载" description={requestError(state.error, { action: '下载' })} />}</div>;
}
