import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Collapse, Empty, Input, Select } from 'antd';
import { courseAPI, workAPI } from '../api';
import PageContainer from '../components/common/PageContainer';
import AsyncPageState from '../components/common/AsyncPageState';
import useRemote from './useRemote';
import { loadStudentWorks } from './workListModel';
import { workCounts } from './archiveModel';
import { WorkRecords } from './ArchiveRecords';
import { StudyHeader, StudySection } from './visual/StudyUI';
import { PixelButton } from './visual/PixelUI';
import PixelIcon from './visual/PixelIcon';
import './visual/pixel-archive.css';

export default function StudentWorks() {
  const [query, setQuery] = useState('');
  const [courseId, setCourseId] = useState();
  const fetcher = useCallback(() => loadStudentWorks({ courses: courseAPI.list, works: (params) => workAPI.list(params, { silent: true }), tasks: workAPI.pendingTasks }, { search: query, courseId }), [query, courseId]);
  const { data, loading, error, retry } = useRemote(fetcher, { courseSensitive: true });
  const { works = [], courses = [], tasks = [] } = data || {};
  const counts = workCounts(works);
  return <PageContainer><div className="study-workspace archive-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="book" /> WORKS / 作品与迭代</>} title="我的作品" description="从一次尝试到一次改进，每个版本都有自己的记录。"><Link to="/archives"><PixelButton icon={<PixelIcon name="back" />}>返回成长档案</PixelButton></Link></StudyHeader>
    {data?.filterInvalid && <Alert type="warning" showIcon title="筛选课程已不可访问，相关作品已清除。" action={<PixelButton onClick={() => setCourseId(undefined)}>清除课程筛选</PixelButton>} />}
    <StudySection number="W" title="浏览作品" description={data ? `当前结果：${counts.projects} 个项目作品 · ${counts.iterations} 次迭代。版本不重复计为项目。` : '按名称或课程找到自己的提交。'}>
      <div className="archive-filters"><div><label className="archive-select-label" htmlFor="work-search">作品名称</label><Input.Search id="work-search" placeholder="搜索作品" value={query} onChange={(event) => setQuery(event.target.value)} onSearch={setQuery} allowClear /></div><div><label className="archive-select-label" htmlFor="work-course">课程筛选</label><Select id="work-course" allowClear placeholder="按课程筛选" value={data?.filterInvalid ? undefined : courseId} onChange={setCourseId} options={courses.map((course) => ({ value: course.id, label: `${course.title} · #${course.id}` }))} /></div><PixelButton loading={loading} onClick={retry}>刷新作品</PixelButton></div>
      <AsyncPageState loading={loading} error={error} onRetry={retry}>{data && <WorkRecords works={works} />}</AsyncPageState>
    </StudySection>
    {data && <Collapse className="archive-pending" defaultActiveKey={['tasks']} items={[{ key: 'tasks', label: `待办任务（${tasks.length}）`, children: tasks.length ? <ul className="archive-task-list">{tasks.map((task) => <li key={task.id}><div><strong>{task.title}</strong><p>{task.course_title} · {task.description || '暂无任务简介'}</p></div><Link to={`/works/upload?task_id=${task.id}&enrollment_id=${task.enrollment_id}`}>提交作品</Link></li>)}</ul> : <Empty description="暂无待提交任务" /> }]} />}
  </div></PageContainer>;
}
