import Alert from '../student/visual/StudentAlert';
import Sentence from '../content/Sentence';
import {useCourseApis} from './useCourseApis';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Link from './space/SpaceLink';

import { Empty } from 'antd';
import AsyncPageState from '../student/visual/StudentPageState';
import useRemote from './useRemote';
import { PixelTag } from './visual/PixelUI';
import { StudySection } from './visual/StudyUI';
import { formatBeijingTime } from '../utils/date';

function WorkTask({ task, enrollmentId }) {
 const { taskAPI }=useCourseApis();
  const [paramsFromLocation] = useSearchParams();
  const targetRef = useRef(null);
  const fetcher = useCallback(() => taskAPI.detail(task.id), [task.id,taskAPI]);
  const { data, loading, error, retry } = useRemote(fetcher);
  useEffect(() => {
    if (!loading && !error && data && paramsFromLocation.get('task_id') === String(task.id)) targetRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [data, loading, error, paramsFromLocation, task.id]);
  const latest = data?.works?.[0];
  const params = new URLSearchParams({ task_id: task.id, enrollment_id: enrollmentId });
  if (latest) params.set('parent_work_id', latest.id);
  return <article ref={targetRef} id={`task-${task.id}`} className="study-task" aria-labelledby={`task-title-${task.id}`}><h4 id={`task-title-${task.id}`}>{task.title}</h4><Sentence className="study-prose">{task.description || '老师尚未填写任务说明。'}</Sentence><Sentence className="study-help">截止：{task.deadline ? formatBeijingTime(task.deadline) : '未设置'}</Sentence>
    <AsyncPageState loading={loading} error={error} onRetry={retry}>
      <ul className="study-work-versions">{data?.works.map((work) => <li key={work.id}><Link to={`/works/${work.id}`}><span>第 {work.version} 版 · {work.title}</span><PixelTag tone={work.review_status === 'approved' ? 'success' : work.review_status === 'rejected' && work.id === latest.id ? 'warning' : 'neutral'}>{work.review_status === 'rejected' ? work.id === latest.id ? '需修改' : '已修改' : work.review_status === 'approved' ? '已通过' : '待评审'}</PixelTag></Link></li>)}</ul>
      {latest?.reject_reason && <Alert type="warning" title="导师退回修改" description={latest.reject_reason} />}
      <div style={{ marginTop: 12 }}>{!latest || latest.review_status === 'rejected'
        ? <Link to={`/works/upload?${params}`} className="pixel-link-button">{latest ? '提交修改后的作品' : '提交作品'}</Link>
        : <Sentence>{latest.review_status === 'approved' ? '作品已通过评审。' : '作品已提交，等待导师评审后再按意见处理。'}</Sentence>}</div>
    </AsyncPageState>
  </article>;
}

export default function LessonWorks({ courseId, lessonId }) {
 const { courseAPI }=useCourseApis();
  const location = useLocation();
  const sectionRef = useRef(null);
  const fetcher = useCallback(() => courseAPI.detail(courseId), [courseId,courseAPI]);
  const { data, loading, error, retry } = useRemote(fetcher);
  useEffect(() => {
    if (!loading && !error && data && location.hash === '#lesson-works') sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [data, loading, error, location.hash]);
  const tasks = data?.tasks.filter((task) => String(task.lesson_id) === String(lessonId)) || [];
  return <StudySection ref={sectionRef} id="lesson-works" className="lesson-works" number="W" title="本课时任务与作品" description="查看作品要求、提交版本和导师意见。">
    <Alert type="info" title="作品与学习报告分别保存和评审。这里的作品提交不会替代上方的学习报告。" />
    <AsyncPageState loading={loading} error={error} onRetry={retry}>{!tasks.length ? <Empty description="本课时暂无作品任务" /> : tasks.map((task) => <WorkTask key={task.id} task={task} enrollmentId={data.enrollments[0]?.id} />)}</AsyncPageState>
  </StudySection>;
}
