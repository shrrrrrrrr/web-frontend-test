import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Collapse, Descriptions, Empty, Input, List, Space } from 'antd';
import { courseAPI, taskAPI } from '../api';
import AsyncPageState from '../components/common/AsyncPageState';
import useRemote from './useRemote';
import { buildHomeTodos, filterCourses, nextScheduledLesson } from './homeModel';
import { loadExploreHome } from './homeData';
import { PixelButton, PixelImage, PixelPanel, PixelProgress, PixelTag } from './visual/PixelUI';
import PixelIcon from './visual/PixelIcon';
import './visual/pixel-home.css';

const fetchHome = () => loadExploreHome({ courseAPI, taskAPI });
const assets = '/assets/pixel-v1/';
const reportLabels = { approved: '报告已通过', submitted: '报告待评审', rejected: '报告需修改' };
const workLabels = { approved: '作品已通过', pending: '作品待评审', rejected: '作品需修改' };
const grades = { primary: '小学', junior: '初中', senior: '高中' };
const difficulties = { basic: '基础', advanced: '进阶', challenge: '挑战' };

function Todo({ item, primary = false }) {
  const navigate = useNavigate();
  return <div className={`home-todo ${primary ? 'home-todo--primary' : ''}`} data-testid={primary ? 'home-primary-todo' : undefined}>
    <div className="home-todo-copy">
      <h3>{item.title}</h3>
      <p className="home-todo-source">{item.courseTitle} · {item.lessonTitle}</p>
      <Space wrap size={[8, 8]}><PixelTag>课时学习进度 {item.learningProgress}%</PixelTag>
        {reportLabels[item.reportStatus] && <PixelTag tone={item.reportStatus === 'rejected' ? 'warning' : 'neutral'}>{reportLabels[item.reportStatus]}</PixelTag>}
        {workLabels[item.workStatus] && <PixelTag tone={item.workStatus === 'rejected' ? 'warning' : 'neutral'}>{workLabels[item.workStatus]}</PixelTag>}
      </Space>
      <p className="home-todo-description">{item.description}</p>
      {item.taskId && <p className="home-todo-deadline">作品截止：{item.deadline || '未设置'}</p>}
    </div>
    <div className="home-todo-action"><PixelButton type={primary ? 'primary' : 'default'} onClick={() => navigate(item.href)} icon={<PixelIcon name="continue" />}>{item.action}</PixelButton></div>
  </div>;
}

function NextLesson({ lesson }) {
  if (!lesson) return <p className="home-schedule-empty"><PixelIcon name="clock" /> 暂无即将开始的上课安排，可在课程地图查看完整安排。</p>;
  return <Collapse ghost className="home-schedule" items={[{
    key: 'schedule', label: <span><PixelIcon name="clock" /> 下一节课 · {lesson.title} <span className="home-schedule-time">{lesson.start_at.replace('T', ' ')}</span></span>,
    children: <><p>{lesson.courseTitle} · {lesson.title}</p><Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
      { key: 'time', label: '上课时间（北京时间）', children: lesson.start_at.replace('T', ' ') },
      { key: 'place', label: '地点', children: lesson.location || '尚未安排' },
      { key: 'teacher', label: '授课人', children: lesson.instructor_name || '尚未安排' },
      { key: 'duration', label: '时长', children: lesson.duration ? `${lesson.duration} 分钟` : '尚未设置' },
    ]} /><Link to={`/courses/${lesson.courseId}`}>查看课程安排</Link></>,
  }]} />;
}

function CourseCard({ course, detail }) {
  const navigate = useNavigate();
  return <PixelPanel as="article" className="home-course-card" data-testid="home-course-card">
    <div className="home-course-cover">
      <PixelImage src={course.cover_image || `${assets}course-voyage.png`} width={1536} height={1024}
        alt={course.cover_image ? `${course.title}封面` : '探索课程插画'}
        fallback={<PixelImage src={`${assets}course-voyage.png`} alt="探索课程插画" width={1536} height={1024} />} />
      {!course.cover_image && <span className="home-cover-label">探索课程</span>}
    </div>
    <div className="home-course-copy">
      <Space wrap size={[8, 8]}><PixelTag tone="success">可进入</PixelTag>{[course.theme, grades[course.grade_level] || course.grade_level, difficulties[course.difficulty] || course.difficulty].filter(Boolean).map((label, index) => <PixelTag key={index}>{label}</PixelTag>)}</Space>
      <h3>{course.title}</h3>
      <p className="home-course-description">{course.description || '进入课程查看课时与任务。'}</p>
      <div className="home-course-bottom">
        {detail && <div className="home-course-progress"><span>{detail.lessons?.length || 0} 个课时 · 学习进度</span><PixelProgress value={detail.progress} label={`${course.title}学习进度`} /></div>}
        <PixelButton type="primary" onClick={() => navigate(`/courses/${course.id}`)} icon={<PixelIcon name="map" />}>进入课程地图</PixelButton>
      </div>
    </div>
  </PixelPanel>;
}

export default function ExploreHome() {
  const { data, loading, error, retry } = useRemote(fetchHome, { courseSensitive: true });
  const [query, setQuery] = useState('');
  const todos = buildHomeTodos(data || {});
  const next = todos[0];
  const courses = filterCourses(data?.courses || [], query);
  const nextLesson = nextScheduledLesson(data?.courseDetails);
  return <div className="pixel-home">
    <header className="home-horizon">
      <PixelImage className="home-horizon-image" src={`${assets}hero-voyage.png`} width={2162} height={727} alt="" fetchPriority="high" />
      <div className="home-horizon-copy"><span className="home-eyebrow">STAR VOYAGE / 2057</span><h1>探索地图</h1><p>选择课程，继续你的探索。课程由老师分配。</p></div>
      <span className="home-horizon-label" aria-hidden="true">KEEP EXPLORING</span>
    </header>
    <AsyncPageState loading={loading} error={error} onRetry={retry}>
      {Boolean(data?.warnings.length) && <Alert type="warning" showIcon title="部分信息需要重新加载" style={{ marginBottom: 16 }}
        description={<>{data.warnings.map((warning, index) => <p key={index}>{warning}</p>)}<PixelButton onClick={retry}>重新加载首页</PixelButton></>} />}
      <PixelPanel className="home-next">
        <div className="home-section-heading"><h2><PixelIcon name="continue" /> 下一次闯关</h2><span>从这里接着探索</span></div>
        {next ? <Todo item={next} primary /> : <Empty description={data?.warnings.length ? '待办尚未完整加载，请重新加载或进入课程查看。' : '暂无需要立即处理的待办，可以进入课程查看学习内容和评审状态。'} />}
        {todos.length > 1 && <Collapse ghost className="home-more-todos" items={[{
          key: 'more', label: `还有 ${todos.length - 1} 项学习或作品待办`,
          children: <List dataSource={todos.slice(1)} pagination={todos.length > 6 ? { pageSize: 5 } : false}
            renderItem={(item) => <List.Item key={item.id}><Todo item={item} /></List.Item>} />,
        }]} />}
      </PixelPanel>
      <section className="home-courses" aria-label="我的课程">
        <div className="home-courses-heading"><h2><PixelIcon name="book" /> 我的课程</h2>
          <Input.Search aria-label="搜索我的课程" placeholder="搜索课程名称或主题" value={query} onChange={(event) => setQuery(event.target.value)} allowClear />
        </div>
        {!data?.courses.length ? <PixelPanel><Empty description="老师还没有为你分配已发布的课程，请联系老师。" /></PixelPanel>
          : !courses.length ? <PixelPanel><Empty description="没有找到匹配的课程，请换个词或清空搜索。" /></PixelPanel>
            : <div className="home-course-list">{courses.map((course) => <CourseCard key={course.id} course={course} detail={data?.courseDetails.find((entry) => String(entry.course.id) === String(course.id))} />)}</div>}
      </section>
      <div className="home-secondary"><NextLesson lesson={nextLesson} /><nav aria-label="学习快捷入口"><Link to="/tasks">课后任务</Link><Link to="/works">我的作品</Link><Link to="/archives/reflection">反思日志</Link></nav></div>
    </AsyncPageState>
  </div>;
}
