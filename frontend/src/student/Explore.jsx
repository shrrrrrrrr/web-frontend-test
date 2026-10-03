import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Collapse, Descriptions, Empty, Grid, Space, Typography } from 'antd';
import { courseAPI } from '../api';
import AsyncPageState from '../components/common/AsyncPageState';
import PageContainer from '../components/common/PageContainer';
import useRemote from './useRemote';
import { buildCourseRoute, currentLesson, scheduleTime } from './routeModel';
import { groupsForCourse, studentTestConfigEnabled } from './config';
import AssociatedExperiments from './AssociatedExperiments';
import PixelIcon from './visual/PixelIcon';
import { PixelButton, PixelImage, PixelPanel, PixelProgress, PixelTag } from './visual/PixelUI';
import './visual/pixel-map.css';

export { default as ExploreHome } from './ExploreHome';

const grades = { primary: '小学', junior: '初中', senior: '高中' };
const difficulties = { basic: '基础', advanced: '进阶', challenge: '挑战' };
const sceneModules = [
  { src: '/assets/pixel-v1/island-observatory.png', width: 1312, height: 1199 },
  { src: '/assets/pixel-v1/island-relay.png', width: 1213, height: 1296 },
];

function learningState(lesson) {
  if (lesson.status === 'cancelled') return { label: '已取消', tone: 'neutral' };
  if (Number(lesson.progress) >= 100) return { label: '学习已完成', tone: 'success' };
  if (Number(lesson.progress) > 0) return { label: '学习进行中', tone: 'current' };
  return { label: '尚未开始', tone: 'neutral' };
}

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
  return <div className="pixel-map-resources">
    <Typography.Title level={3}>课程资源与回放</Typography.Title>
    <Link to={'/courses/' + courseId + '/learn'} className="pixel-map-text-link"><PixelIcon name="book" />查看课程回放与完整回顾</Link>
    {!resources.length ? <Empty description="老师尚未提供课程资料" /> : resources.map((resource) => <div key={resource.id} className="pixel-map-resource">
      <Space wrap><Typography.Text strong>{resource.title}</Typography.Text>{resource.has_file
        ? <PixelButton loading={pending[resource.id]} onClick={() => download(resource)}>下载{resource.title}</PixelButton>
        : <Typography.Text type="secondary">暂无附件</Typography.Text>}</Space>
      {resource.description && <Typography.Paragraph>{resource.description}</Typography.Paragraph>}
      {errors[resource.id] && <Alert type="warning" showIcon title={errors[resource.id]} />}
    </div>)}
  </div>;
}

function LessonDetails({ lesson, tasks, courseId, isCurrent }) {
  const navigate = useNavigate();
  const state = learningState(lesson);
  const href = '/courses/' + courseId + '/lessons/' + lesson.id + '/learn';
  return <PixelPanel className="pixel-map-details" id="selected-lesson-details" data-testid="lesson-details" aria-labelledby="selected-lesson-title">
    <div className="pixel-map-details-kicker"><span>第 {lesson.routeNumber} 关</span>{isCurrent && <PixelTag tone="current">当前课时</PixelTag>}</div>
    <Typography.Title level={3} id="selected-lesson-title">{lesson.title}</Typography.Title>
    <div className="pixel-map-details-state"><PixelTag tone={state.tone}>{state.label}</PixelTag><span>课时学习进度</span></div>
    <PixelProgress value={lesson.progress ?? 0} label={lesson.title + '课时学习进度'} />
    <Typography.Paragraph className="pixel-map-lesson-description">{lesson.description || '老师尚未填写本课时说明。'}</Typography.Paragraph>
    {lesson.status === 'cancelled'
      ? <Alert type="warning" showIcon title="本课时已取消" description={lesson.cancel_reason || '请查看其他课时或联系老师。'} />
      : <div className="pixel-map-enter"><PixelButton type="primary" onClick={() => navigate(href)} icon={<PixelIcon name="continue" />}>进入课时</PixelButton></div>}
    <div className="pixel-map-schedule">
      <Typography.Title level={4}><PixelIcon name="clock" />课时安排</Typography.Title>
      <Descriptions size="small" column={1} colon={false} items={[
        { key: 'start', label: '上课时间', children: scheduleTime(lesson.start_at) },
        { key: 'end', label: '下课时间', children: scheduleTime(lesson.end_at) },
        { key: 'location', label: '地点', children: lesson.location || '待安排' },
        { key: 'teacher', label: '授课人', children: lesson.instructor_name || '待安排' },
        { key: 'duration', label: '时长', children: lesson.duration ? lesson.duration + ' 分钟' : '待安排' },
      ]} />
    </div>
    {lesson.status !== 'cancelled' && <div className="pixel-map-lesson-tasks">
      <Typography.Title level={4}>课后任务</Typography.Title>
      {tasks.length ? <ul>{tasks.map((task) => <li key={task.id}><Link to={href + '?task_id=' + task.id + '#task-' + task.id}>{task.title}</Link>{task.deadline && <span>截止 {scheduleTime(task.deadline)}</span>}</li>)}</ul>
        : <Typography.Paragraph type="secondary">本课时暂无作品任务，可进入课时学习。</Typography.Paragraph>}
      <AssociatedExperiments courseId={courseId} lessonId={lesson.id} />
    </div>}
    <p className="pixel-map-detail-note">作品提交与评审状态，在课时内单独查看。</p>
  </PixelPanel>;
}

export function CourseMap() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const [selection, setSelection] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const fetcher = useCallback(() => courseAPI.detail(id), [id]);
  const { data, loading, error, retry } = useRemote(fetcher, { courseSensitive: true, courseId: id });
  const current = currentLesson(data?.lessons || [], params.get('lesson'));
  const groups = buildCourseRoute(data?.lessons || [], groupsForCourse(id));
  const lessons = groups.flatMap((group) => group.lessons);
  const selectionKey = id + ':' + (params.get('lesson') || '');
  const selectedId = selection?.key === selectionKey ? selection.lessonId : (params.get('lesson') || current?.id);
  const selected = lessons.find((lesson) => String(lesson.id) === String(selectedId)) || lessons.find((lesson) => lesson.id === current?.id) || lessons[0];
  const course = data?.course;
  const selectedTasks = (data?.tasks || []).filter((task) => String(task.lesson_id) === String(selected?.id));
  const details = selected && <LessonDetails lesson={selected} tasks={selectedTasks} courseId={id} isCurrent={current?.id === selected.id} />;
  const toggleSection = (section) => setOpenSection((previous) => previous === section ? null : section);

  return <PageContainer>
    <div className="pixel-map">
      <header className="pixel-map-header">
        <div>
          <Link to="/explore" className="pixel-map-back"><PixelIcon name="back" />返回探索地图</Link>
          <Typography.Title level={2}>{course?.title || '课程地图'}</Typography.Title>
          <p>选一个关卡，继续你的探索。</p>
        </div>
        {data && <div className="pixel-map-header-actions">
          <PixelButton onClick={() => toggleSection('info')} aria-expanded={openSection === 'info'} aria-controls="course-information" icon={<PixelIcon name="book" />}>课程信息</PixelButton>
          <PixelButton onClick={() => toggleSection('resources')} aria-expanded={openSection === 'resources'} aria-controls="course-resources" icon={<PixelIcon name="archive" />}>课程资源</PixelButton>
        </div>}
      </header>
      {location.state?.experimentNotice && <Alert type="warning" showIcon title={location.state.experimentNotice} className="pixel-map-notice" />}
      <AsyncPageState loading={loading} error={error} onRetry={retry}>
        {data && <>
          {studentTestConfigEnabled && <Alert type="warning" showIcon title="测试课程布局：章节与实验安排仅用于验收。" className="pixel-map-notice" />}
          <PixelPanel className="pixel-map-course-info" id="course-information" hidden={openSection !== 'info'}>
            <Typography.Title level={3}>课程信息</Typography.Title>
            <Typography.Paragraph>{course.description || '老师尚未填写课程简介。'}</Typography.Paragraph>
            <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }} items={[
              { key: 'theme', label: '课程主题', children: course.theme || '暂未填写' },
              { key: 'grade', label: '适用学段', children: grades[course.grade_level] || course.grade_level || '暂未填写' },
              { key: 'difficulty', label: '难度', children: difficulties[course.difficulty] || course.difficulty || '暂未填写' },
              { key: 'lessons', label: '课时安排', children: data.lessons.length + ' 个课时' },
              { key: 'tasks', label: '课后任务', children: data.tasks.length + ' 个任务' },
            ]} />
            <Collapse size="small" items={[{ key: 'intro', label: '课程说明与准备', children: <Descriptions column={1} items={[
              { key: 'question', label: '探究问题', children: course.driving_question || '老师尚未填写' },
              { key: 'story', label: '课程情境', children: course.story_line || '老师尚未填写' },
              { key: 'materials', label: '准备材料', children: course.materials_needed || '暂未提供准备要求' },
            ]} /> }]} />
            <div className="pixel-map-info-links"><Link to={'/courses/' + id + '/learn'}>课程回顾与资料</Link><Link to={'/dashboard/ai?course_id=' + id}>向学习伙伴提问</Link>
              {current && <Link to={'/courses/' + id + '/lessons/' + current.id + '/learn'}>继续当前课时：{current.title}</Link>}
            </div>
            <AssociatedExperiments courseId={id} />
          </PixelPanel>
          <PixelPanel className="pixel-map-course-info" id="course-resources" hidden={openSection !== 'resources'}>
            <CourseResources resources={data.resources || []} courseId={id} />
          </PixelPanel>
          <div className="pixel-map-overview">
            <div><Typography.Title level={3}>课时路线</Typography.Title><span>{data.lessons.length} 个关卡 · 选择节点查看详情</span></div>
            <div className="pixel-map-course-progress"><span>课时学习进度</span><PixelProgress value={data.progress} label="课程课时学习进度" /></div>
          </div>
          {!lessons.length ? <PixelPanel className="pixel-map-empty"><Empty description="这门课程还没有课时，请等待老师发布。" /></PixelPanel> : <div className="pixel-map-layout">
            <div className="pixel-map-stage" aria-label="课程关卡路线">
              <PixelImage src="/assets/pixel-v1/hero-voyage.png" width={2162} height={727} className="pixel-map-sky" imageStyle={{ objectPosition: '70% 38%' }} fallback={<span />} />
              <div className="pixel-map-route-content">
                {groups.map((group, groupIndex) => {
                  const scene = sceneModules[groupIndex % sceneModules.length];
                  return <section key={group.key} className="route-group pixel-map-region" aria-label={group.title}>
                    <h4 className="pixel-map-region-title">{group.title}</h4>
                    <PixelImage {...scene} className="pixel-map-island" imageStyle={{ objectFit: 'contain' }} fallback={<span />} />
                    <ol className="pixel-map-route" style={{ '--region-count': group.lessons.length }}>
                      {group.lessons.map((lesson) => {
                        const state = learningState(lesson);
                        const isCurrent = current?.id === lesson.id;
                        const isSelected = selected?.id === lesson.id;
                        return <li key={lesson.id} className="pixel-map-route-stop" data-lesson-id={lesson.id}>
                          <button type="button" className="route-node" aria-current={isCurrent ? 'step' : undefined} aria-pressed={isSelected} aria-controls="selected-lesson-details"
                            aria-label={'第 ' + lesson.routeNumber + ' 关：' + lesson.title + '，' + state.label + (isCurrent ? '，当前课时' : '')}
                            onClick={() => setSelection({ key: selectionKey, lessonId: lesson.id })}>
                            <span className="pixel-map-node-marker"><span className="pixel-map-node-number">{lesson.routeNumber}</span>{isCurrent && <span className="pixel-map-current-flag">当前</span>}</span>
                            <span className="pixel-map-node-label"><strong>{lesson.title}</strong><PixelTag tone={state.tone}>{state.label}</PixelTag></span>
                          </button>
                          {!screens.lg && isSelected && details}
                        </li>;
                      })}
                    </ol>
                    {groupIndex < groups.length - 1 && <span className="pixel-map-region-bridge" aria-hidden="true"><PixelIcon name="continue" size={16} /></span>}
                  </section>;
                })}
              </div>
              <p className="pixel-map-route-note">路线表示学习顺序，可用课时都能进入。</p>
            </div>
            {screens.lg && <aside className="pixel-map-aside" aria-label="选中课时详情">{details}</aside>}
          </div>}
        </>}
      </AsyncPageState>
    </div>
  </PageContainer>;
}
