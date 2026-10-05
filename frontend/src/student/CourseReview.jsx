import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Link from './space/SpaceLink';

import { Alert } from 'antd';
import {useCourseApis} from './useCourseApis';
import { useAuth } from '../store/AuthContext';
import useRemoteResource from '../hooks/useRemoteResource';
import { ServicePage, ReadState } from '../components/ServiceUI';
import { requestError } from '../utils/requestError';
import { formatBeijingTime } from '../utils/date';
import { STUDENT_ACCESS_CHECK } from './accessPolicy';
import { StudySection } from './visual/StudyUI';
import { PixelButton, PixelPanel, PixelTag } from './visual/PixelUI';
import { courseReadError, replayDuration } from './compatibilityModel';
import { workStatus } from './archiveModel';
import CourseResourceDownload from './CourseResourceDownload';
import useCourseResource from './useCourseResource';
import './visual/pixel-compatibility.css';

export default function CourseReview() {
  const { id } = useParams(), { user } = useAuth();
  return <Review key={`${user.id}:${id}`} id={id} studentId={user.id} />;
}
function Review({ id, studentId }) {
 const {courseAPI}=useCourseApis();
  const read = useCallback(() => courseAPI.detail(id), [id,courseAPI]);
  const { data, loading, error, reload } = useCourseResource(read, id);
  return <ServicePage title="回看课程资料" eyebrow="探索地图 / 课程资料" description={data?.course.title || '课后回看课堂内容，查找资料与提交记录。'} actions={<Link to={`/courses/${id}`}>返回课程地图</Link>}>
    {error ? <PixelPanel className="compat-main-error"><Alert role="alert" type="warning" title={courseReadError(error)} description={requestError(error)} /><div className="compat-row-actions"><PixelButton onClick={reload}>重新读取课程</PixelButton><Link to="/explore">返回探索地图</Link></div></PixelPanel>
      : <ReadState loading={loading} object="课程资料">{data && <>
        <PixelPanel className="review-summary"><div><span className="compat-kicker">01 / 课程摘要</span><h3>{data.course.driving_question || data.course.title}</h3></div><p>{data.course.description || '暂无课程简介，请结合课堂内容与资料学习。'}</p></PixelPanel>
        <div className="review-media-layout"><ReplayRegion courseId={id} /><StudySection number="03" title="课堂资料" description="按需下载老师提供的资料。" className="review-resources">
          {data.resources?.length ? <ul className="compat-records">{data.resources.map(resource => <li key={resource.id}><PixelTag>{({ courseware: '课件', video: '视频', lesson_plan: '课程教案', guide_card: '操作指南', template: '记录模板', other: '其他资料' })[resource.resource_type] || '课程资料'}</PixelTag><h4>{resource.title || '未命名资料'}</h4>
            {resource.has_file ? <CourseResourceDownload resource={resource} courseId={id} /> : <p className="compat-muted">这份资料暂未提供文件。</p>}</li>)}</ul> : <p className="compat-empty">暂无课堂资料。</p>}
        </StudySection></div>
        <div className="review-record-layout"><StudySection number="04" title="课后任务" description="从原课时入口继续学习。">
          {data.tasks?.length ? <ul className="compat-records">{data.tasks.map(task => <li key={task.id}><h4>{task.title}</h4><p className="compat-muted">{task.lesson_title || '课时名称未提供'} · 截止：{task.deadline ? formatBeijingTime(task.deadline) : '未设置'}</p><Link to={`/courses/${id}/lessons/${task.lesson_id}/learn`}>进入课时学习 →</Link></li>)}</ul> : <p className="compat-empty">暂无课后任务。其他学习内容可从课程地图进入。</p>}
        </StudySection><WorksRegion courseId={id} studentId={studentId} onCourseInvalid={reload} /></div>
      </>}</ReadState>}
  </ServicePage>;
}
function WorksRegion({ courseId, studentId, onCourseInvalid }) {
 const {courseAPI,workAPI}=useCourseApis();
  const read = useCallback(async () => {
    const payload = await workAPI.list({ course_id: courseId });
    // 课程空间接口按真实对象归属过滤；课程回读成功后再展示本人版本。
    try { await courseAPI.detail(courseId); }
    catch (error) {
      if ([403, 404].includes(error.response?.status) || (error.response?.status === 400 && error.response?.data?.error === '课程不存在')) void onCourseInvalid();
      throw error;
    }
    return (payload.works || []).filter(work => String(work.student_id) === String(studentId));
  }, [courseId, studentId, onCourseInvalid,courseAPI,workAPI]);
  const state = useRemoteResource(read);
  return <StudySection number="05" title="我的提交" description="作品及其版本记录，报告仍在课时学习页。" className="review-works">
    <ReadState {...state} object="提交记录" empty={!state.data?.length} emptyText="本课程还没有作品提交记录。">
      <ul className="compat-records">{state.data?.map(work => { const status = workStatus(work); return <li key={work.id}><div className="compat-tags"><PixelTag tone={status.tone}>{status.label}</PixelTag><span>第 {work.version || 1} 版</span></div><h4>{work.title}</h4><Link to={`/works/${work.id}`}>{status.revisable ? '查看意见并修改' : '查看作品版本'} →</Link></li>; })}</ul>
    </ReadState>
  </StudySection>;
}
function ReplayRegion({ courseId }) {
 const {courseAPI}=useCourseApis();
  const read = useCallback(() => courseAPI.listReplays(courseId), [courseId,courseAPI]);
  const state = useRemoteResource(read);
  const [selection, setSelection] = useState(null);
  const [player, setPlayer] = useState({ loading: false, error: null, url: '' });
  const video = useRef(null), live = useRef(false), sequence = useRef(0);
  const stop = useCallback(() => {
    const el = video.current;
    if (el) { el.pause(); el.removeAttribute('src'); el.load(); }
  }, []);
  const invalidate = useCallback(() => { live.current = false; sequence.current++; }, []);
  const attachVideo = useCallback(el => {
    video.current = el;
    // 严格模式会重连同一 DOM 引用；恢复清理过的地址，普通重渲染不重设 src。
    if (el.getAttribute('src') !== player.url) el.setAttribute('src', player.url);
    return () => { el.pause(); el.removeAttribute('src'); el.load(); video.current = null; };
  }, [player.url]);
  useEffect(() => { live.current = true; return invalidate; }, [invalidate]);
  const choose = async replay => {
    const ticket = ++sequence.current;
    stop(); setSelection(replay); setPlayer({ loading: true, error: null, url: '' });
    try {
      const result = await courseAPI.streamUrl(replay.id);
      if (!live.current || ticket !== sequence.current) return;
      const target = new URL(result.url, window.location.origin);
      if (target.origin !== window.location.origin || target.pathname !== `/api/courses/replays/${replay.id}/stream`) throw new Error('播放地址不可用，请重新读取。');
      setPlayer({ loading: false, error: null, url: target.href });
    } catch (error) { if (live.current && ticket === sequence.current) setPlayer({ loading: false, error, url: '' }); }
  };
  const reload = () => { sequence.current++; stop(); setSelection(null); setPlayer({ loading: false, error: null, url: '' }); void state.reload(); };
  const mediaFailed = () => {
    sequence.current++; stop(); setPlayer({ loading: false, error: new Error('视频暂时无法播放，地址可能已过期，或文件、网络暂不可用。请重新获取播放地址。'), url: '' });
    window.dispatchEvent(new CustomEvent(STUDENT_ACCESS_CHECK));
  };
  return <StudySection number="02" title="课程回放" description="按需打开回放，播放不会自动完成课时。" className="review-replays">
    <ReadState {...state} reload={reload} object="课程回放" empty={!state.data?.replays?.length} emptyText="暂无课程回放。">
      <div className="review-player-area">
        {player.url ? <video ref={attachVideo} controls preload="metadata" src={player.url} onError={mediaFailed} aria-label={`课程回放：${selection?.title}`} />
          : player.error ? <div className="review-player-feedback"><Alert role="alert" type="warning" title="本段回放暂不可用" description={player.error.message && !player.error.response ? player.error.message : requestError(player.error)} /><PixelButton onClick={() => choose(selection)}>重新获取播放地址</PixelButton></div>
            : <div className="review-player-placeholder" role="status"><span aria-hidden="true">▷</span><p>{player.loading ? '正在获取本段播放地址…' : '选择下方回放，回到课堂现场'}</p></div>}
      </div>
      {selection && <div className="review-playing"><strong>{selection.title}</strong>{player.url && <PixelButton size="small" onClick={() => choose(selection)}>重新获取播放地址</PixelButton>}</div>}
      <ul className="review-replay-list">{state.data?.replays.map(replay => <li key={replay.id}><button type="button" aria-pressed={selection?.id === replay.id} onClick={() => choose(replay)}><span aria-hidden="true">▷</span><div><strong>{replay.title}</strong><p>{replay.recording_date || '录制日期未提供'}{replayDuration(replay.duration_seconds) && ` · ${replayDuration(replay.duration_seconds)}`}</p></div><span>{selection?.id === replay.id ? '当前选择' : '打开'}</span></button></li>)}</ul>
    </ReadState>
  </StudySection>;
}
