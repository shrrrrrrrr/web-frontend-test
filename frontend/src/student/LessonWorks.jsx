import { useCallback, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Empty, Space, Tag } from 'antd';
import { taskAPI, courseAPI } from '../api';
import AsyncPageState from '../components/common/AsyncPageState';
import useRemote from './useRemote';

function WorkTask({ task, enrollmentId }) {
  const [paramsFromLocation] = useSearchParams();
  const targetRef = useRef(null);
  const fetcher = useCallback(() => taskAPI.detail(task.id), [task.id]);
  const { data, loading, error, retry } = useRemote(fetcher);
  useEffect(() => {
    if (!loading && !error && data && paramsFromLocation.get('task_id') === String(task.id)) targetRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [data, loading, error, paramsFromLocation, task.id]);
  const latest = data?.works?.[0];
  const params = new URLSearchParams({ task_id: task.id, enrollment_id: enrollmentId });
  if (latest) params.set('parent_work_id', latest.id);
  return <Card ref={targetRef} id={`task-${task.id}`} size="small" title={task.title} style={{ marginTop: 12 }}><p>{task.description}</p><p>截止：{task.deadline || '未设置'}</p>
    <AsyncPageState loading={loading} error={error} onRetry={retry}>
      <Space wrap>{data?.works.map((work) => <Link key={work.id} to={`/works/${work.id}`}>第 {work.version} 版 · {work.title}<Tag>{work.review_status === 'rejected' ? '需修改' : work.review_status === 'approved' ? '已通过' : '待评审'}</Tag></Link>)}</Space>
      {latest?.reject_reason && <Alert type="warning" title="导师退回修改" description={latest.reject_reason} />}
      <div style={{ marginTop: 12 }}>{!latest || latest.review_status === 'rejected'
        ? <Link to={`/works/upload?${params}`}><Button>{latest ? '提交修改后的作品' : '提交作品'}</Button></Link>
        : <p>{latest.review_status === 'approved' ? '作品已通过评审。' : '作品已提交，等待导师评审后再按意见处理。'}</p>}</div>
    </AsyncPageState>
  </Card>;
}

export default function LessonWorks({ courseId, lessonId }) {
  const location = useLocation();
  const sectionRef = useRef(null);
  const fetcher = useCallback(() => courseAPI.detail(courseId), [courseId]);
  const { data, loading, error, retry } = useRemote(fetcher);
  useEffect(() => {
    if (!loading && !error && data && location.hash === '#lesson-works') sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [data, loading, error, location.hash]);
  const tasks = data?.tasks.filter((task) => String(task.lesson_id) === String(lessonId)) || [];
  return <Card ref={sectionRef} id="lesson-works" title="本课时任务与作品" style={{ marginTop: 20 }}>
    <Alert type="info" title="作品与学习报告分别保存和评审。这里的作品提交不会替代上方的学习报告。" />
    <AsyncPageState loading={loading} error={error} onRetry={retry}>{!tasks.length ? <Empty description="本课时暂无作品任务" /> : tasks.map((task) => <WorkTask key={task.id} task={task} enrollmentId={data.enrollments[0]?.id} />)}</AsyncPageState>
  </Card>;
}
