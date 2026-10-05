import { useCourseApis, useCourseId } from './useCourseApis';
import { useCallback, useState } from 'react';
import Link from './space/SpaceLink';
import {useCourseNavigate as useNavigate} from './useCourseApis';

import { Alert, Collapse, Empty, Select, Tabs } from 'antd';
import { useAuth } from '../store/AuthContext';
import { formatBeijingTime } from '../utils/date';
import PageContainer from '../components/common/PageContainer';
import AsyncPageState from '../components/common/AsyncPageState';
import useRemote from './useRemote';
import { loadStudentArchive, scoreText, workDimensions } from './archiveModel';
import { PixelButton, PixelPanel, PixelTag } from './visual/PixelUI';
import { StudyHeader, StudySection } from './visual/StudyUI';
import PixelIcon from './visual/PixelIcon';
import { ReflectionFields, WorkRecords } from './ArchiveRecords';
import ArchiveReports from './ArchiveReports';
import './visual/pixel-archive.css';

export default function StudentArchive() {
  const { archiveAPI, courseAPI } = useCourseApis();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('courses');
  const spaceId=useCourseId();
  const [courseId, setCourseId] = useState(spaceId?Number(spaceId):undefined);
  const [refreshing, setRefreshing] = useState(false);
  const fetcher = useCallback(() => loadStudentArchive({ courses: courseAPI.list, enrollments: archiveAPI.getReflections, archive: archiveAPI.generate }, user.id), [user.id,courseAPI,archiveAPI]);
  const { data, loading, error, retry } = useRemote(fetcher, { courseSensitive: true });
  const archive = data?.archive;
  const selection = data?.courses.some((course) => String(course.id) === String(courseId)) ? courseId : undefined;
  const reload = () => { setRefreshing(true); retry(); };
  const coursesContent = <StudySection number="01" title="我参与的课程" description="参与记录不等于完成记录；完成日期仅在老师或系统已有记录时显示。">
    {archive ? archive.courses.length ? <ul className="archive-course-list">{archive.courses.map((course) => <li key={course.enrollment_id}><div><Link className="archive-record-title" to={`/courses/${course.course_id}`}>{course.course_title}</Link><p>参与于 {formatBeijingTime(course.enrolled_at)}</p><p>{course.completed_at ? `课程完成于 ${formatBeijingTime(course.completed_at)}` : '尚无课程完成日期'}</p></div><PixelTag tone="current">参与课程</PixelTag></li>)}</ul> : <Empty description="暂无当前可展示的课程记录。" /> : <p>课程参与记录暂未读取，下方仍可查看已核验课程的课时。</p>}
    <section className="archive-report-browser" aria-label="课时报告查询"><h4>课时学习与报告</h4><p className="study-help">先选课程，再选课时。每份报告的状态独立保留。</p>
      {courseId && !selection && <Alert type="warning" title="所选课程已不可访问，请重新选择。" />}
      <label className="archive-select-label" htmlFor="archive-course">选择课程</label><Select id="archive-course" disabled={!!spaceId} className="archive-select" placeholder="选择课程" allowClear value={selection} onChange={setCourseId} options={(data?.courses || []).map((course) => ({ value: course.id, label: `${course.title} · #${course.id}` }))} />
      {selection ? <ArchiveReports key={selection} courseId={selection} /> : <p className="archive-choice-note">{data?.courses.length ? '尚未选择课程。选择后可浏览课时，查看报告和导师意见。' : '暂无可进入的课程，请联系老师确认课程安排。'}</p>}
    </section>
  </StudySection>;
  const feedback = archive && <>
    <StudySection number="03" title="导师给我的反馈" description="课程评价、报告评审与作品评审分别记录，不合成为总分。">
      <h4>课程过程与成果评价</h4>
      {archive.evaluations.length ? <ul className="archive-evaluations">{archive.evaluations.map((row) => <li key={row.id}><div className="archive-record-heading"><strong>{row.evaluator_name || '导师'} · {({ process: '过程性评价', outcome: '成果评价', peer: '同伴评价', self: '自我评价' })[row.eval_type] || '评价类型未提供'}</strong><PixelTag>{scoreText(row.score)}{row.score != null && ' 分'}</PixelTag></div><p className="study-help">{row.course_title} · {formatBeijingTime(row.created_at)}</p><p className="study-prose">{row.comment || '暂无评语。'}</p></li>)}</ul> : <Empty description="暂无课程评价。" />}
      <div className="archive-feedback-links"><div><h4>学习报告评审</h4><p>按课时查看最新报告的评语与实际评分。</p><PixelButton onClick={() => setTab('courses')}>选择课时查看报告</PixelButton></div><div><h4>作品评审</h4><p>打开具体版本，查看导师评语、修改建议和五项评分。</p><PixelButton onClick={() => setTab('works')}>选择作品查看反馈</PixelButton></div></div>
    </StudySection>
    <StudySection number="05" title="作品评审维度汇总" description="仅汇总作品评审，不代表固定能力标签，也不用于同学排名。">
      {archive.abilityAvailable ? <ul className="archive-dimensions">{workDimensions.map(([field, label]) => <li key={field}><span>{label}</span><strong>{scoreText(archive.ability?.[field])}{archive.ability?.[field] != null && <small> / 5</small>}</strong></li>)}</ul> : <Alert type="info" showIcon title="暂不可汇总" description="现有汇总包含不在当前展示范围内的作品。请进入可查看的作品，阅读单次评审。" />}
      <Link to="/works">查看当前可访问作品的反馈</Link>
    </StudySection>
  </>;
  const trail = archive && <StudySection number="04" title="我的成长足迹" description="保留实际提交、反思和导师记录；一次作品提交不重复计入。">
    {archive.hiddenEvents > 0 && <Alert type="info" showIcon title="部分历史记录暂不展示详情" description="这些系统记录缺少可靠的对象关联，暂时无法确认所属课程。已关联的记录仍可查看。" />}
    {archive.timeline.length ? <ol className="archive-timeline">{archive.timeline.map((event) => <li key={event.id}><div className="archive-record-heading"><PixelTag>{event.kind}</PixelTag><time>{formatBeijingTime(event.at)}</time></div><p className="archive-record-title">{event.text}</p>{event.recorder && <p className="study-help">记录人：{event.recorder}</p>}{event.workId && <Link to={`/works/${event.workId}`}>查看对应作品</Link>}{event.reflection && <Collapse items={[{ key: 'reflection', label: '展开这次反思', children: <ReflectionFields reflection={event.reflection} /> }]} />}</li>)}</ol> : <Empty description="还没有可展示的成长足迹，继续学习，留下你的第一次记录。" />}
  </StudySection>;
  return <PageContainer><div className="study-workspace archive-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="archive" /> GROWTH LOG / 成长记录</>} title="我的成长档案" description="回看参与、作品与反馈，找到下一次改进的方向。">
      <PixelButton aria-label="刷新档案" loading={loading} onClick={reload}>刷新档案</PixelButton><PixelButton type="primary" onClick={() => navigate('/archives/reflection')}>写反思日志</PixelButton>
    </StudyHeader>
    <div className="archive-quick-links"><Link to="/works">我的作品</Link><Link to="/archives/rewards">积分与徽章（本地演示）</Link></div>
    {error && <Alert type="error" showIcon title={refreshing ? '档案刷新失败' : '无法读取档案范围'} description={`${error} 归属核验完成前不展示旧记录。`} action={<PixelButton onClick={reload}>重试读取</PixelButton>} />}
    <AsyncPageState loading={loading}>
      {data && <>
        {data.archiveError && <Alert type="warning" showIcon title="部分资料读取失败" description={data.archiveError} action={<PixelButton onClick={reload}>重试档案</PixelButton>} />}
        <PixelPanel className="archive-overview" aria-label="成长概览"><div className="archive-identity"><PixelIcon name="user" size={32} /><div><strong>{archive?.student.real_name || user.real_name || '我的学习记录'}</strong><p>{archive?.student.school_name || '学校未提供'} · {archive?.student.class_name || '班级未提供'}</p></div></div>
          <dl className="archive-counts">{[['courses', '参与课程'], ['projects', '项目作品'], ['iterations', '作品迭代'], ['reflections', '反思记录'], ['evaluations', '课程评价']].map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{archive ? archive.counts[field] : '—'}</dd></div>)}</dl>
          <p className="archive-scope-note">课程相关记录仅展示当前可进入的课程；仅展示本课程有明确关联的记录；未关联的历史记录不会自动归入本课程。{archive && `资料读取于 ${archive.generatedAt}`}</p>
        </PixelPanel>
        <Tabs className="archive-tabs" activeKey={tab} onChange={setTab} items={[
          { key: 'courses', label: '课程记录', children: coursesContent },
          { key: 'works', label: '作品与迭代', children: archive && <StudySection number="02" title="我留下的作品" description={`${archive.counts.projects} 个项目作品 · ${archive.counts.iterations} 次迭代。各版本分别保留，报告不计入作品。`}><WorkRecords works={archive.works} compact /><div className="study-actions"><PixelButton onClick={() => navigate('/works')}>浏览全部作品</PixelButton></div></StudySection> },
          { key: 'feedback', label: '导师反馈', children: feedback }, { key: 'trail', label: '成长足迹', children: trail },
        ].map((item) => ({ ...item, children: item.children || <Alert type="warning" title="这部分档案尚未读取，请重试档案。" /> }))} />
      </>}
    </AsyncPageState>
  </div></PageContainer>;
}
