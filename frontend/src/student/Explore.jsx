import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Empty, Progress, Space, Tag, Typography } from 'antd';
import { courseAPI, taskAPI } from '../api';
import AsyncPageState from '../components/common/AsyncPageState';
import PageContainer from '../components/common/PageContainer';
import useRemote from './useRemote';
import { groupLessons, nextTask, experimentLink } from './model';
import { courseGroups } from './config';

const fetchHome = async () => {
  const [courses, tasks] = await Promise.all([courseAPI.list(), taskAPI.list()]);
  return { courses: courses.courses || [], tasks: tasks.tasks || [] };
};

export function ExploreHome() {
  const { data, loading, error, retry } = useRemote(fetchHome);
  const next = nextTask(data?.tasks || []);
  return <PageContainer title="探索地图" description="选择课程，继续你的探索。课程由老师分配。" extra={<Space wrap><Link to="/tasks">课后任务</Link><Link to="/works">我的作品</Link></Space>}>
    <AsyncPageState loading={loading} error={error} onRetry={retry}>
      <Card title="下一次闯关" style={{ marginBottom: 20 }}>
        {next ? <Space orientation="vertical"><Typography.Text strong>{next.title}</Typography.Text><Typography.Text>{next.course_title} · {next.lesson_title}</Typography.Text>
          <Typography.Text>截止：{next.deadline || '未设置'}</Typography.Text>
          <Typography.Text>{next.report_status === 'rejected' ? '导师提出了修改建议，回到报告查看并完善。' : '回到本课时，按学习流程继续。'}</Typography.Text>
          <Link to={`/courses/${next.course_id}/lessons/${next.lesson_id}/learn`}><Button type="primary">{next.report_status === 'rejected' ? '查看并修改' : '继续学习'}</Button></Link>
        </Space> : <Empty description="暂无待完成任务，可以进入课程查看学习内容和评审状态。" />}
      </Card>
      {!data?.courses.length ? <Card><Empty description="老师还没有为你分配已发布的课程，请联系老师。" /></Card> : <div className="student-card-grid">{data.courses.map((course) => <Card key={course.id} title={course.title}>
        <Typography.Paragraph>{course.description || '进入课程查看课时与任务。'}</Typography.Paragraph>
        <Link to={`/courses/${course.id}`}><Button type="primary">进入课程地图</Button></Link>
      </Card>)}</div>}
    </AsyncPageState>
  </PageContainer>;
}

export function CourseMap() {
  const { id } = useParams();
  const fetcher = useCallback(() => courseAPI.detail(id), [id]);
  const { data, loading, error, retry } = useRemote(fetcher);
  return <PageContainer title={data?.course.title || '课程地图'} description={data?.course.driving_question} extra={<Link to="/explore">返回探索地图</Link>}>
    <AsyncPageState loading={loading} error={error} onRetry={retry}>
      {data && <>
        <Alert type="info" showIcon title="路线表示学习顺序。每一站对应一个真实课时，能否进行下一步以课时内的学习状态为准。" />
        <Card style={{ margin: '16px 0' }}><Typography.Text>课程进度</Typography.Text><Progress percent={data.progress} />
          <Space wrap><Link to={`/courses/${id}/learn`}>课程回顾与资料</Link><Link to={`/dashboard/ai?course_id=${id}`}>向学习伙伴提问</Link><Link to={experimentLink(id, null, `/courses/${id}`)}>进入滑翔机实验</Link></Space>
        </Card>
        {!data.lessons.length && <Empty description="这门课程还没有课时，请等待老师发布。" />}
        {groupLessons(data.lessons, courseGroups[id]).map((group) => <Card key={group.title} title={group.title} style={{ marginBottom: 16 }}>
          {group.lessons.map((lesson) => <Card key={lesson.id} size="small" style={{ marginBottom: 12 }} title={lesson.title}>
            <Typography.Paragraph>{lesson.description}</Typography.Paragraph><Progress percent={lesson.progress} />
            {lesson.status === 'cancelled' ? <Alert type="warning" title="本课时已取消" description={lesson.cancel_reason || '请查看其他课时或联系老师。'} /> : <Space wrap>
              <Tag>{lesson.progress >= 100 ? '已完成' : lesson.progress > 0 ? '进行中' : '尚未开始'}</Tag>
              <Link to={`/courses/${id}/lessons/${lesson.id}/learn`}><Button type="primary">进入课时</Button></Link>
            </Space>}
          </Card>)}
        </Card>)}
      </>}
    </AsyncPageState>
  </PageContainer>;
}
