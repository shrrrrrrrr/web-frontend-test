import { useCallback, useState } from 'react';
import Link from './space/SpaceLink';
import { Select } from 'antd';
import {useCourseApis} from './useCourseApis';
import { useAuth } from '../store/AuthContext';
import { ServicePage, ReadState } from '../components/ServiceUI';
import { PixelPanel, PixelTag, PixelProgress } from './visual/PixelUI';
import { taskGroups, taskLabels, reportLabels, learningPercent } from './compatibilityModel';
import { workStatus } from './archiveModel';
import { formatBeijingTime } from '../utils/date';
import useCourseResource from './useCourseResource';
import './visual/pixel-compatibility.css';

export default function StudentTasks() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  return <ServicePage title="课后任务" eyebrow="探索地图 / 任务入口" description="找到要继续的课时，查看报告和作品各自的状态。" actions={<Link to="/explore">返回探索地图</Link>}>
    <PixelPanel className="compat-task-toolbar"><div><label htmlFor="task-status">按学习状态筛选</label><p>这里显示老师布置的任务。其他课时可从课程地图继续学习。</p></div>
      <Select id="task-status" aria-label="按学习状态筛选" value={status} onChange={setStatus} options={[{ value: '', label: '全部任务' }, ...Object.entries(taskLabels).map(([value, label]) => ({ value, label }))]} />
    </PixelPanel>
    <TaskResults key={`${user.id}:${status}`} status={status} />
  </ServicePage>;
}
function TaskResults({ status }) {
 const {taskAPI,courseAPI}=useCourseApis();
  const read = useCallback(async () => {
    const payload = await taskAPI.list(status ? { status } : {});
    const current = await courseAPI.list();
    const allowed = new Set((current.courses || []).map(c => String(c.id)));
    return (payload.tasks || []).filter(t => allowed.has(String(t.course_id)));
  }, [status,taskAPI,courseAPI]);
  const state = useCourseResource(read);
  const groups = taskGroups(state.data || []);
  return <ReadState {...state} empty={!groups.length} object="课后任务" emptyText={status ? '这个学习状态下暂无任务，可切换筛选或返回探索地图。' : '暂无课后任务。没有作品任务的课时，也可以从课程地图继续学习。'}>
    <div className="compat-task-groups">{groups.map(group => <PixelPanel key={group.id} className="compat-task-group" data-course-id={group.id}>
      <header><div><span className="compat-muted">课程 {group.id} · {group.tasks.length} 项任务</span><h3>{group.title || '课程名称未提供'}</h3></div><Link to={`/courses/${group.id}`}>课程地图 →</Link></header>
      <ul>{group.tasks.map(task => {
        const progress = learningPercent(task.learning_progress), work = workStatus({ review_status: task.review_status });
        const action = task.report_status === 'rejected' ? '修改报告' : task.status === 'completed' ? '查看学习结果' : task.status === 'submitted' ? '查看评审状态' : '继续学习';
        const target = `/courses/${task.course_id}/lessons/${task.lesson_id}/learn${task.report_status === 'rejected' ? '?stage=2' : ''}`;
        return <li className="compat-task-row" key={task.id}><div className="compat-task-heading"><h4>{task.title}</h4><PixelTag tone={task.status === 'completed' ? 'success' : 'current'}>{taskLabels[task.status] || '学习状态待确认'}</PixelTag></div>
          <p className="compat-muted">所属课时：{task.lesson_title || '未提供'}<span className="compat-meta-divider"> / </span>截止：{task.deadline ? formatBeijingTime(task.deadline) : '未设置'}</p>
          <div className="compat-task-bottom"><div className="compat-task-status"><div className="compat-task-progress"><span>课时学习进度</span>{progress == null ? <span className="compat-muted">暂未提供</span> : <PixelProgress value={progress} label={`${task.title}课时学习进度`} />}</div>
            <div className="compat-tags"><span>报告：{reportLabels[task.report_status] || '暂无报告状态'}</span>{task.work_id && <PixelTag tone={work.tone}>作品：{work.label}</PixelTag>}</div></div>
            <div className="compat-row-actions"><Link className="compat-primary-link" to={target}>{action}</Link>{task.work_id && <Link to={`/works/${task.work_id}`}>{task.review_status === 'rejected' ? '修改作品' : '查看作品'}</Link>}</div>
          </div>
        </li>;
      })}</ul>
      <p className="compat-footnote">学习状态来自课时进度与报告；作品评审单独显示。</p>
    </PixelPanel>)}</div>
  </ReadState>;
}
