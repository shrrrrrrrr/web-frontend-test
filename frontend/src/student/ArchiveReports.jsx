import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Empty, Select } from 'antd';
import { courseAPI, learningAPI } from '../api';
import { formatBeijingTime } from '../utils/date';
import useRemote from './useRemote';
import AsyncPageState from '../components/common/AsyncPageState';
import { reportSummary, scoreText } from './archiveModel';
import { PixelTag } from './visual/PixelUI';

function LessonReport({ courseId, lessonId }) {
  const fetcher = useCallback(async () => {
    const result = await learningAPI.lesson(lessonId);
    if (String(result.course?.id) !== String(courseId)) throw new Error('课时归属发生变化，请重新选择。');
    await courseAPI.detail(courseId);
    return result;
  }, [courseId, lessonId]);
  const { data, loading, error, retry } = useRemote(fetcher, { courseSensitive: true });
  const summary = data ? reportSummary(data) : null;
  const report = summary?.report;
  return <div className="archive-report-result" aria-live="polite"><AsyncPageState loading={loading} error={error} onRetry={retry}>{data && <>
    <div className="archive-record-heading"><h4>{data.lesson.title}</h4><PixelTag tone={summary.tone}>{summary.label}</PixelTag></div>
    <p>课时学习进度：{data.progress?.percent == null ? '暂未提供' : `${data.progress.percent}%`}</p>
    {report ? <><p>最新报告 · 第 {report.version} 版 · 提交于 {formatBeijingTime(report.submitted_at)}</p>
      <div className="study-feedback"><h4>报告评审</h4><p>{report.review_comment || '暂无导师评语。'}</p><p>报告评分：{scoreText(report.score)}{report.score != null && ' 分'}</p>{report.reviewed_at && <><p>评审时间：{formatBeijingTime(report.reviewed_at)}</p><p className="study-help">导师姓名暂未提供</p></>}</div>
      <div className="archive-inline-actions"><Link to={`/courses/${courseId}/lessons/${lessonId}/learn?stage=2`}>{report.status === 'rejected' ? '修改学习报告' : '查看最新报告'}</Link><Link to={`/courses/${courseId}/lessons/${lessonId}/learn?stage=3`}>查看报告评审</Link></div>
      <p className="study-help">这里显示最新报告，不是完整版本历史。作品状态请在「作品与迭代」中查看。</p>
    </> : <><Alert type="info" showIcon title={summary.label} description={data.progress?.report_unlocked ? '可以回到课时整理学习报告。' : '完成课堂回顾、全部知识卡片与配套练习后才能提交报告。'} /><Link to={`/courses/${courseId}/lessons/${lessonId}/learn`}>继续本课时学习</Link></>}
  </>}</AsyncPageState></div>;
}

export default function ArchiveReports({ courseId }) {
  const [lessonId, setLessonId] = useState();
  const fetcher = useCallback(() => courseAPI.detail(courseId), [courseId]);
  const { data, loading, error, retry } = useRemote(fetcher, { courseSensitive: true });
  return <AsyncPageState loading={loading} error={error} onRetry={retry}>{data && <>
    <label className="archive-select-label" htmlFor="archive-lesson">选择课时</label>
    <Select id="archive-lesson" placeholder="选择课时后查看最新报告" value={lessonId} onChange={setLessonId} className="archive-select" allowClear options={(data.lessons || []).map((lesson) => ({ value: lesson.id, label: `${lesson.title}${lesson.status === 'cancelled' ? '（已取消）' : ''}`, disabled: lesson.status === 'cancelled' }))} />
    {!data.lessons?.length ? <Empty description="这门课程还没有课时。" /> : lessonId ? <LessonReport key={lessonId} courseId={courseId} lessonId={lessonId} /> : <p className="archive-choice-note">选择一个课时，查看真实学习进度、最新报告与评审。没有作品任务的课时也可以查看。</p>}
  </>}</AsyncPageState>;
}
