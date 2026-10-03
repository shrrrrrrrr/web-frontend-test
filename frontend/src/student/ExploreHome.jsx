import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Collapse, Descriptions, Empty, Input, List, Space, Tag, Typography } from 'antd';
import { courseAPI, taskAPI } from '../api';
import AsyncPageState from '../components/common/AsyncPageState';
import PageContainer from '../components/common/PageContainer';
import useRemote from './useRemote';
import { buildHomeTodos, filterCourses, nextScheduledLesson } from './homeModel';
import { loadExploreHome } from './homeData';

const fetchHome = () => loadExploreHome({ courseAPI, taskAPI });
const reportLabels = { approved: '报告已通过', submitted: '报告待评审', rejected: '报告需修改' };
const workLabels = { approved: '作品已通过', pending: '作品待评审', rejected: '作品需修改' };
const grades = { primary: '小学', junior: '初中', senior: '高中' };
const difficulties = { basic: '基础', advanced: '进阶', challenge: '挑战' };

function Todo({ item, primary = false }) {
  return <Space orientation="vertical" style={{ width: '100%' }}>
    <Typography.Text strong>{item.title}</Typography.Text>
    <Typography.Text>{item.courseTitle} · {item.lessonTitle}</Typography.Text>
    <Space wrap><Tag>课时学习进度 {item.learningProgress}%</Tag>
      {reportLabels[item.reportStatus] && <Tag>{reportLabels[item.reportStatus]}</Tag>}
      {workLabels[item.workStatus] && <Tag>{workLabels[item.workStatus]}</Tag>}
    </Space>
    {item.taskId && <Typography.Text>作品截止：{item.deadline || '未设置'}</Typography.Text>}
    <Typography.Text>{item.description}</Typography.Text>
    <Link to={item.href}><Button type={primary ? 'primary' : 'default'}>{item.action}</Button></Link>
  </Space>;
}

export default function ExploreHome() {
  const { data, loading, error, retry } = useRemote(fetchHome, { courseSensitive: true });
  const [query, setQuery] = useState('');
  const todos = buildHomeTodos(data || {});
  const next = todos[0];
  const courses = filterCourses(data?.courses || [], query);
  const nextLesson = nextScheduledLesson(data?.courseDetails);
  return <PageContainer title="探索地图" description="选择课程，继续你的探索。课程由老师分配。" extra={<Space wrap><Link to="/tasks">课后任务</Link><Link to="/works">我的作品</Link><Link to="/archives/reflection">反思日志</Link></Space>}>
    <AsyncPageState loading={loading} error={error} onRetry={retry}>
      {Boolean(data?.warnings.length) && <Alert type="warning" showIcon title="部分信息需要重新加载" style={{ marginBottom: 16 }}
        description={<>{data.warnings.map((warning, index) => <p key={index}>{warning}</p>)}<Button onClick={retry}>重新加载首页</Button></>} />}
      <Card title="下一次闯关" style={{ marginBottom: 20 }}>
        {next ? <Todo item={next} primary /> : <Empty description={data?.warnings.length ? '待办尚未完整加载，请重新加载或进入课程查看。' : '暂无需要立即处理的待办，可以进入课程查看学习内容和评审状态。'} />}
        {todos.length > 1 && <Collapse style={{ marginTop: 16 }} items={[{
          key: 'more', label: `还有 ${todos.length - 1} 项学习或作品待办`,
          children: <List dataSource={todos.slice(1)} pagination={todos.length > 6 ? { pageSize: 5 } : false}
            renderItem={(item) => <List.Item key={item.id}><Todo item={item} /></List.Item>} />,
        }]} />}
      </Card>
      <Card title="下一节课" style={{ marginBottom: 20 }}>
        {nextLesson ? <>
          <Typography.Paragraph strong>{nextLesson.courseTitle} · {nextLesson.title}</Typography.Paragraph>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
            { key: 'time', label: '上课时间（北京时间）', children: nextLesson.start_at.replace('T', ' ') },
            { key: 'place', label: '地点', children: nextLesson.location || '尚未安排' },
            { key: 'teacher', label: '授课人', children: nextLesson.instructor_name || '尚未安排' },
            { key: 'duration', label: '时长', children: nextLesson.duration ? `${nextLesson.duration} 分钟` : '尚未设置' },
          ]} />
          <Link to={`/courses/${nextLesson.courseId}`}>查看课程安排</Link>
        </> : <Typography.Text type="secondary">暂无即将开始的上课安排，可进入课程地图查看完整课时安排。</Typography.Text>}
      </Card>
      <Space wrap style={{ marginBottom: 16 }}><Typography.Title level={4} style={{ margin: 0 }}>我的课程</Typography.Title>
        <Input.Search aria-label="搜索我的课程" placeholder="搜索课程名称或主题" value={query} onChange={(event) => setQuery(event.target.value)} allowClear style={{ maxWidth: '100%', width: 280 }} />
      </Space>
      {!data?.courses.length ? <Card><Empty description="老师还没有为你分配已发布的课程，请联系老师。" /></Card>
        : !courses.length ? <Card><Empty description="没有找到匹配的课程，请换个词或清空搜索。" /></Card>
          : <div className="student-card-grid">{courses.map((course) => <Card key={course.id} title={course.title}>
            <Space wrap>{[course.theme, grades[course.grade_level] || course.grade_level, difficulties[course.difficulty] || course.difficulty].filter(Boolean).map((label, index) => <Tag key={index}>{label}</Tag>)}</Space>
            <Typography.Paragraph style={{ marginTop: 12 }}>{course.description || '进入课程查看课时与任务。'}</Typography.Paragraph>
            <Link to={`/courses/${course.id}`}><Button type="primary">进入课程地图</Button></Link>
          </Card>)}</div>}
    </AsyncPageState>
  </PageContainer>;
}
