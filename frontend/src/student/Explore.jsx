import { useCallback, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Collapse, Descriptions, Empty, Progress, Space, Tag, Typography } from 'antd';
import { courseAPI } from '../api';
import AsyncPageState from '../components/common/AsyncPageState';
import PageContainer from '../components/common/PageContainer';
import useRemote from './useRemote';
import { buildCourseRoute, currentLesson, scheduleTime } from './routeModel';
import { groupsForCourse, studentTestConfigEnabled } from './config';
import AssociatedExperiments from './AssociatedExperiments';

export { default as ExploreHome } from './ExploreHome';

const grades = { primary: '小学', junior: '初中', senior: '高中' };
const difficulties = { basic: '基础', advanced: '进阶', challenge: '挑战' };

function CourseResources({ resources, courseId }) {
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState({});
  const download = async (resource) => {
    setErrors((previous) => ({ ...previous, [resource.id]: '' }));
    setPending((previous) => ({ ...previous, [resource.id]: true }));
    try {
      const blob = await courseAPI.downloadResource(resource.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = resource.title || '课程资料'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setErrors((previous) => ({ ...previous, [resource.id]: error.response?.status === 404 ? '这份附件暂不可用，请联系老师补充。你可以继续学习其他内容。' : '这份资料未能下载，请重试；若课程权限有变化，将重新确认。' }));
    } finally { setPending((previous) => ({ ...previous, [resource.id]: false })); }
  };
  return <Card title="课程资源与回放" style={{ marginTop: 16 }}>
    <Link to={`/courses/${courseId}/learn`}>查看课程回放与完整回顾</Link>
    {!resources.length ? <Empty description="老师尚未提供课程资料" /> : resources.map((resource) => <div key={resource.id} style={{ marginTop: 12 }}>
      <Space wrap><Typography.Text>{resource.title}</Typography.Text>{resource.has_file
        ? <Button loading={pending[resource.id]} onClick={() => download(resource)}>下载{resource.title}</Button>
        : <Typography.Text type="secondary">暂无附件</Typography.Text>}</Space>
      {resource.description && <Typography.Paragraph>{resource.description}</Typography.Paragraph>}
      {errors[resource.id] && <Alert type="warning" showIcon title={errors[resource.id]} />}
    </div>)}
  </Card>;
}

export function CourseMap() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const fetcher = useCallback(() => courseAPI.detail(id), [id]);
  const { data, loading, error, retry } = useRemote(fetcher, { courseSensitive: true, courseId: id });
  const current = currentLesson(data?.lessons || [], params.get('lesson'));
  const groups = buildCourseRoute(data?.lessons || [], groupsForCourse(id));
  const course = data?.course;
  return <PageContainer title={course?.title || '课程地图'} description={course?.driving_question} extra={<Link to="/explore">返回探索地图</Link>}>
    {location.state?.experimentNotice && <Alert type="warning" showIcon title={location.state.experimentNotice} style={{ marginBottom: 16 }} />}
    <AsyncPageState loading={loading} error={error} onRetry={retry}>
      {data && <>
        {studentTestConfigEnabled && <Alert type="warning" showIcon title="测试配置：章节及配套实验仅用于功能验收，不代表正式教学安排。" style={{ marginBottom: 16 }} />}
        <Alert type="info" showIcon title="路线表示课时顺序，所有可用课时均可进入。具体学习步骤以课时内的真实状态为准。" />
        <Card title="课程信息" style={{ margin: '16px 0' }}>
          <Typography.Paragraph>{course.description || '老师尚未填写课程简介。'}</Typography.Paragraph>
          <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }} items={[
            { key: 'theme', label: '课程主题', children: course.theme || '暂未填写' },
            { key: 'grade', label: '适用学段', children: grades[course.grade_level] || course.grade_level || '暂未填写' },
            { key: 'difficulty', label: '难度', children: difficulties[course.difficulty] || course.difficulty || '暂未填写' },
            { key: 'lessons', label: '课时安排', children: `${data.lessons.length} 个课时` },
            { key: 'tasks', label: '课后任务', children: `${data.tasks.length} 个任务` },
          ]} />
          <Collapse size="small" items={[{ key: 'intro', label: '课程说明与准备', children: <Descriptions column={1} items={[
            { key: 'question', label: '探究问题', children: course.driving_question || '老师尚未填写' },
            { key: 'story', label: '课程情境', children: course.story_line || '老师尚未填写' },
            { key: 'materials', label: '准备材料', children: course.materials_needed || '暂未提供准备要求' },
          ]} /> }]} />
          <div style={{ margin: '16px 0' }}><Typography.Text>课时学习进度（作品评审单独查看）</Typography.Text><Progress percent={data.progress} /></div>
          <Space wrap><Link to={`/courses/${id}/learn`}>课程回顾与资料</Link><Link to={`/dashboard/ai?course_id=${id}`}>向学习伙伴提问</Link>
            {current && <Link to={`/courses/${id}/lessons/${current.id}/learn`}>继续当前课时：{current.title}</Link>}
          </Space>
          <AssociatedExperiments courseId={id} />
        </Card>
        <Typography.Title level={3}>课时路线</Typography.Title>
        <Typography.Paragraph type="secondary">当前节点优先标记进行中的课时。节点编号只表示顺序，不是解锁条件。</Typography.Paragraph>
        {!data.lessons.length && <Empty description="这门课程还没有课时，请等待老师发布。" />}
        {groups.map((group) => <section key={group.key} className="route-group" aria-label={group.title}>
          <Typography.Title level={4}>{group.title}</Typography.Title>
          <ol className="lesson-route" style={{ '--route-count': group.lessons.length }}>
            {group.lessons.map((lesson) => {
              const isCurrent = current?.id === lesson.id;
              const href = `/courses/${id}/lessons/${lesson.id}/learn`;
              const tasks = data.tasks.filter((task) => String(task.lesson_id) === String(lesson.id));
              return <li key={lesson.id} className="lesson-route-item" data-lesson-id={lesson.id}>
                {lesson.status === 'cancelled' ? <span className="route-node route-node-cancelled" aria-label={`第 ${lesson.routeNumber} 关已取消`}>{lesson.routeNumber}</span>
                  : <Link className="route-node" to={href} aria-current={isCurrent ? 'step' : undefined} aria-label={`第 ${lesson.routeNumber} 关：${lesson.title}${isCurrent ? '，当前课时' : ''}`}>{lesson.routeNumber}</Link>}
                <Card size="small" className="route-lesson-card" title={<span>{lesson.title} {isCurrent && <Tag color="blue">当前课时</Tag>}</span>}>
                  <Typography.Paragraph>{lesson.description || '老师尚未填写本课时说明。'}</Typography.Paragraph>
                  <Descriptions size="small" column={1} items={[
                    { key: 'start', label: '上课时间', children: scheduleTime(lesson.start_at) },
                    { key: 'end', label: '下课时间', children: scheduleTime(lesson.end_at) },
                    { key: 'location', label: '地点', children: lesson.location || '待安排' },
                    { key: 'teacher', label: '授课人', children: lesson.instructor_name || '待安排' },
                    { key: 'duration', label: '时长', children: lesson.duration ? `${lesson.duration} 分钟` : '待安排' },
                  ]} />
                  <Progress percent={lesson.progress ?? 0} size="small" />
                  {lesson.status === 'cancelled' ? <Alert type="warning" title="本课时已取消" description={lesson.cancel_reason || '请查看其他课时或联系老师。'} /> : <>
                    <Space wrap><Tag>{lesson.progress >= 100 ? '课时学习已完成' : lesson.progress > 0 ? '课时学习进行中' : '课时学习尚未开始'}</Tag><Link to={href}><Button type="primary">进入课时</Button></Link></Space>
                    <div style={{ marginTop: 12 }}>{tasks.length ? <Space orientation="vertical">{tasks.map((task) => <Link key={task.id} to={`${href}?task_id=${task.id}#task-${task.id}`}>{task.title}{task.deadline ? ` · 截止 ${scheduleTime(task.deadline)}` : ''}</Link>)}</Space> : <Typography.Text type="secondary">本课时暂无作品任务，可进入课时学习。</Typography.Text>}</div>
                    <AssociatedExperiments courseId={id} lessonId={lesson.id} />
                  </>}
                </Card>
              </li>;
            })}
          </ol>
        </section>)}
        <CourseResources resources={data.resources || []} courseId={id} />
      </>}
    </AsyncPageState>
  </PageContainer>;
}
