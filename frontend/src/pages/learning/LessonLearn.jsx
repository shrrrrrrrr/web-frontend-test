import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert, App, Checkbox, Collapse, Empty, Form, Input, Radio, Space, Typography,
} from 'antd';
import {
  CheckCircleOutlined, DownloadOutlined,
  LeftOutlined, PlayCircleOutlined, RightOutlined,
} from '@ant-design/icons';
import { courseAPI, learningAPI } from '../../api';
import PageContainer from '../../components/common/PageContainer';
import AsyncPageState from '../../components/common/AsyncPageState';
import { LEARNING_STEPS, REPORT_STATUS } from '../../constants/status';
import { useAuth } from '../../store/AuthContext';
import { draftKey } from '../../student/model';
import LessonWorks from '../../student/LessonWorks';
import AssociatedExperiments from '../../student/AssociatedExperiments';
import { availableCardIndex, learningStage } from '../../student/experimentContext';
import { PixelButton as Button, PixelProgress, PixelTag } from '../../student/visual/PixelUI';
import { StudyHeader, StudySection } from '../../student/visual/StudyUI';
import PixelIcon from '../../student/visual/PixelIcon';
import { formatBeijingTime } from '../../utils/date';

const { Text } = Typography;

function answerText(value) {
  if (Array.isArray(value)) return value.join('、');
  if (value === true) return '正确';
  if (value === false) return '错误';
  return String(value ?? '-');
}

function Exercise({ exercise, index, onDone }) {
  const [answer, setAnswer] = useState(exercise.question_type === 'multiple_choice' ? [] : '');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const hasAnswer = Array.isArray(answer) ? answer.length > 0 : answer !== '' && answer !== null && answer !== undefined;
  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const next = await learningAPI.submitExercise(exercise.id, answer);
      setResult(next);
      await onDone();
    } catch (err) { setError(err.response?.data?.error || '答案未能提交，请检查网络后再试。'); }
    finally { setSubmitting(false); }
  };
  const options = (exercise.options || []).map((item, index) => typeof item === 'object'
    ? { label: item.label ?? item.text, value: item.value ?? item.key ?? String(index) }
    : { label: item, value: item });
  let input = <Input.TextArea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={2} placeholder="填写答案" />;
  if (exercise.question_type === 'single_choice') input = <Radio.Group options={options} value={answer} onChange={(event) => setAnswer(event.target.value)} />;
  if (exercise.question_type === 'multiple_choice') input = <Checkbox.Group options={options} value={answer} onChange={setAnswer} />;
  if (exercise.question_type === 'true_false') input = <Radio.Group options={[{ label: '正确', value: true }, { label: '错误', value: false }]} value={answer} onChange={(event) => setAnswer(event.target.value)} />;
  return <section className="study-exercise" aria-labelledby={`exercise-${exercise.id}`}>
      <PixelTag>练习 {index + 1} · {{ single_choice: '单选', multiple_choice: '多选', true_false: '判断', short_answer: '简答', fill_blank: '填空' }[exercise.question_type] || '作答'}</PixelTag>
      <h5 id={`exercise-${exercise.id}`}>{exercise.prompt}</h5><fieldset disabled={exercise.attempted || submitting || Boolean(result)} aria-label={exercise.prompt}>{input}</fieldset>
      {!exercise.attempted && <Alert type="info" showIcon title="本题只有一次作答机会，提交后不能修改" />}
      <Button type="primary" onClick={submit} loading={submitting} disabled={exercise.attempted || Boolean(result) || !hasAnswer}>提交答案</Button>
      {error && <Alert type="error" showIcon title="答案未能提交" description={error} />}
      {exercise.attempted && <Alert type={exercise.passed ? 'success' : 'warning'} showIcon title={exercise.passed ? '回答正确' : '已作答，本题回答不正确'} description={<Space orientation="vertical" size={2}><Text>标准答案：{answerText(exercise.correct_answer)}</Text><Text>答案详解：{exercise.explanation || '导师暂未设置答案详解。'}</Text></Space>} />}
      {result && !exercise.attempted && <Alert type={result.correct ? 'success' : 'warning'} showIcon title={result.correct ? '回答正确' : '回答不正确'} description={<Space orientation="vertical" size={2}><Text>标准答案：{answerText(result.correct_answer)}</Text><Text>答案详解：{result.explanation || '导师暂未设置答案详解。'}</Text></Space>} />}
  </section>;
}

export default function LessonLearn() {
  const { message, modal } = App.useApp();
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [draftState, setDraftState] = useState('填写后自动保存到本浏览器，按当前账号隔离。');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStage, setActiveStage] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [replayUrl, setReplayUrl] = useState('');
  const [replayAttempt, setReplayAttempt] = useState(0);
  const [activeReplayId, setActiveReplayId] = useState(null);
  const [resourceError, setResourceError] = useState('');
  const [replayError, setReplayError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [reportError, setReportError] = useState('');
  const [reflectionOpen, setReflectionOpen] = useState([]);
  const [form] = Form.useForm();
  const reportDraftKey = draftKey(user.id, courseId, lessonId);
  const saveDraft = (_, values) => {
    try {
      localStorage.setItem(reportDraftKey, JSON.stringify(values));
      setDraftState('已保存到当前浏览器，仅当前账号可恢复。附件不会保存在草稿中。');
    } catch { setDraftState('草稿保存失败，请保留页面并复制填写内容；检查浏览器存储空间后重试。'); }
  };

  const playReplay = async (replayId) => {
    setActiveReplayId(replayId); setReplayError('');
    try { setReplayUrl((await courseAPI.streamUrl(replayId)).url); setReplayAttempt((attempt) => attempt + 1); }
    catch { setReplayUrl(''); setReplayError('课堂回放暂时无法播放，可能已移除或网络中断。请重试或联系导师，其他学习内容仍可继续。'); }
  };

  const load = async ({ restorePosition = false } = {}) => {
    setLoading(true); setError('');
    try {
      const payload = await learningAPI.lesson(lessonId);
      if (String(payload.course.id) !== String(courseId)) throw new Error('课时与课程不匹配');
      setData(payload);
      const requestedStage = Number(searchParams.get('stage'));
      // 已有报告可从原评审页回看；资料调整后的学习阶段不能吞掉档案的只读跳转。
      // 报告表单仍按 progress.report_unlocked 禁用，提交规则没有改变。
      const savedReportStage = payload.report && (requestedStage === 2 || requestedStage === 3);
      const stage = restorePosition && searchParams.has('stage') && Number.isInteger(requestedStage) && requestedStage >= 0 && (requestedStage <= learningStage(payload) || savedReportStage) ? requestedStage : learningStage(payload);
      const requestedCard = restorePosition ? searchParams.get('cardId') : null;
      if (requestedCard) {
        const index = availableCardIndex(payload.cards || [], requestedCard, payload.progress);
        if (index < 0 || stage !== 1) {
          navigate(`/courses/${courseId}`, { replace: true, state: { experimentNotice: '原知识卡片已不可访问或尚未解锁，已返回课程地图。' } });
          return;
        }
        setCardIndex(index);
      } else setCardIndex((current) => Math.min(current, Math.max(0, payload.cards.length - 1)));
      setActiveStage(stage);
      if (!activeReplayId && payload.replays?.length) await playReplay(payload.replays[0].id);
      if (!payload.report || payload.report.status === 'rejected') {
        let savedDraft = null;
        try {
          savedDraft = JSON.parse(localStorage.getItem(reportDraftKey));
          if (savedDraft) setDraftState('已恢复当前浏览器中此账号的报告草稿。继续填写会自动保存在本浏览器。');
        } catch { savedDraft = null; setDraftState('草稿恢复失败，未能读取本浏览器中的记录；请核对并保留填写内容。'); }
        form.setFieldsValue(savedDraft || (payload.report?.status === 'rejected' ? { ...payload.report, reflection: payload.reflection || {} } : {}));
      }
    } catch (err) {
      setData(null);
      if (restorePosition && searchParams.has('cardId') && [403, 404].includes(err?.response?.status)) {
        let target = '/lab';
        try { await courseAPI.detail(courseId); target = `/courses/${courseId}`; } catch { /* no accessible course to return to */ }
        const notice = target === '/lab' ? '来源课程已不可访问，已返回实验室。' : '来源课时已不可访问，已返回课程地图。';
        message.warning(notice);
        navigate(target, { replace: true, state: { experimentNotice: notice } });
        return;
      }
      setError(err?.response?.data?.error || '无法加载本课时，请检查报名和发布状态。');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load({ restorePosition: true }); }, [courseId, lessonId, searchParams]);

  const finishReview = async () => {
    setSubmitting(true); setActionError('');
    try {
      await learningAPI.completeReview(lessonId);
      message.success('课堂回顾已完成，继续学习知识卡片');
      await load();
    } catch (err) { setActionError(err.response?.data?.error || '未能确认课堂回顾，请重试。'); }
    finally { setSubmitting(false); }
  };

  const finishCard = async (card) => {
    setSubmitting(true); setActionError('');
    try {
      await learningAPI.completeCard(card.id);
      const isLast = cardIndex === data.cards.length - 1;
      if (!isLast) setCardIndex(cardIndex + 1);
      message.success(isLast ? '全部知识卡片已完成' : '本卡片已完成，继续下一张');
      await load();
    } catch (err) { setActionError(err.response?.data?.error || '未能完成本卡片，请重试。'); }
    finally { setSubmitting(false); }
  };

  const downloadResource = async (resource) => {
    setResourceError('');
    try {
      const blob = await courseAPI.downloadResource(resource.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = resource.title || '课堂资料'; anchor.click();
      URL.revokeObjectURL(url);
    } catch { setResourceError(`“${resource.title || '课堂资料'}”下载失败，文件可能已移除或网络中断。请重试或联系导师，当前学习和草稿不受影响。`); }
  };

  const submitReport = (values) => {
    modal.confirm({
      title: '确认提交学习报告？',
      content: '提交后进入导师评审；若导师退回，可根据意见提交新版本。',
      onOk: async () => {
        setSubmitting(true); setReportError('');
        try {
          await learningAPI.submitReport(lessonId, { report: values, reflection: values.reflection });
          message.success('学习报告已提交，等待执行导师评审');
          try { localStorage.removeItem(reportDraftKey); } catch { message.warning('报告已提交，但本地草稿未能清理。'); }
          form.resetFields(); await load();
        } catch (err) { setReportError(err.response?.data?.error || '报告未能提交，填写内容仍保留，请检查网络后重试。'); }
        finally { setSubmitting(false); }
      },
    });
  };

  if (!data) return <PageContainer title="课后学习" extra={<Button onClick={() => navigate('/tasks')}>返回课后任务</Button>}><AsyncPageState loading={loading} error={error} onRetry={load}><Empty /></AsyncPageState></PageContainer>;

  const { lesson, cards = [], progress = {}, report } = data;
  const currentStep = learningStage(data);
  const activeCard = cards[cardIndex];
  const cardExercisesDone = activeCard?.exercises?.every((exercise) => exercise.attempted) ?? false;
  const stageDone = [progress.review_completed, progress.cards_done, report && report.status !== 'rejected', report?.status === 'approved'];
  const stageReasons = ['', '完成课堂回顾后开启', '完成全部知识卡片后开启', '提交报告后查看'];
  const reportFields = [['summary', '学习总结'], ['key_points', '关键收获'], ['application', '应用设想'], ['difficulties', '困难与疑问'], ['next_plan', '下一步计划']];
  const reflectionFields = [['difficulty', '遇到的困难'], ['solution', '解决方式'], ['improvement', '可以改进之处'], ['new_question', '新的问题']];
  const validationFailed = ({ errorFields }) => {
    if (errorFields.some(({ name }) => name[0] === 'reflection')) setReflectionOpen(['reflection']);
    const name = errorFields[0]?.name;
    if (name) requestAnimationFrame(() => requestAnimationFrame(() => form.scrollToField(name, { block: 'center', behavior: 'instant', focus: true })));
  };
  const reportTone = report?.status === 'approved' ? 'success' : report?.status === 'rejected' ? 'warning' : 'info';

  return <PageContainer><div className="study-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="book" />{data.course.title}</>} title={lesson.title} description={`正在查看：${LEARNING_STEPS[activeStage]}`}>
      <Button onClick={() => navigate(`/courses/${courseId}?lesson=${lessonId}`)} icon={<PixelIcon name="back" />}>返回课程地图</Button>
      <Button onClick={() => navigate('/tasks')}>返回课后任务</Button>
    </StudyHeader>
    <div className="study-layout">
      <aside className="study-stages" aria-label="本课时学习流程">
        <h3>本课时进度</h3><PixelProgress value={progress.percent || 0} label="本课时学习进度" />
        <p className="study-progress-note">回顾 25% · 卡片 35%<br />报告反思 25% · 导师评审 15%</p>
        <nav aria-label="学习阶段"><ol>{LEARNING_STEPS.map((title, index) => {
          const locked = index > currentStep && !(index === 3 && report);
          const status = locked ? '未解锁' : index === 3 && report ? REPORT_STATUS[report.status]?.label : stageDone[index] ? '已完成' : '待完成';
          return <li key={title}><button type="button" className="study-stage" aria-current={activeStage === index ? 'step' : undefined} disabled={locked} onClick={() => setActiveStage(index)}>
            <span className="study-stage-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{title}</strong><small>{activeStage === index ? '正在查看 · ' : ''}{status}</small>{locked && <small>{stageReasons[index]}</small>}</span>
          </button></li>;
        })}</ol></nav>
        <a className="study-stages-footer" href="#lesson-works">查看本课时任务与作品 ↓</a>
      </aside>
      <div className="study-main">
        {actionError && <Alert type="error" showIcon title={actionError} />}
        {activeStage === 0 && <StudySection number="01" title="第一阶段：课堂回顾" description="回看课堂，整理观察。完成后由你确认，无需等待观看时长。">
          <section aria-label="课堂回放"><h4>课堂回放</h4>
            {replayError && <Alert type="warning" showIcon title="回放暂不可用" description={replayError} action={activeReplayId && <Button onClick={() => playReplay(activeReplayId)}>重试播放</Button>} />}
            {replayUrl ? <video key={`${replayUrl}:${replayAttempt}`} controls src={replayUrl} className="study-video" onError={() => setReplayError('回放文件未能播放，请重试或联系导师。其他学习内容仍可继续。')} /> : !replayError && <Empty description="本课时暂无课堂回放" />}
            <Space wrap>{data.replays.map((replay) => <Button key={replay.id} type={activeReplayId === replay.id ? 'primary' : 'default'} icon={<PlayCircleOutlined />} onClick={() => playReplay(replay.id)}>{replay.title}</Button>)}</Space>
          </section>
          <section className="study-subsection" aria-label="配套资料"><h4>配套资料</h4>
            {resourceError && <Alert type="warning" showIcon title={resourceError} />}
            {data.resources.length === 0 ? <Empty description="本课时暂无配套资料" /> : data.resources.map((resource) => <div className="study-resource" key={resource.id}><div><Text strong>{resource.title}</Text>{resource.description && <p>{resource.description}</p>}</div>{resource.has_file ? <Button icon={<DownloadOutlined />} onClick={() => downloadResource(resource)}>下载资料</Button> : <Text type="secondary">暂无附件</Text>}</div>)}
          </section>
          <AssociatedExperiments variant="study" courseId={courseId} lessonId={lessonId} stage={0} />
          <div className="study-actions">{progress.review_completed ? <><PixelTag tone="success">课堂回顾已完成</PixelTag><Button type="primary" onClick={() => setActiveStage(1)}>继续知识卡片</Button></> : <Button type="primary" loading={submitting} onClick={finishReview}>我已完成课堂回顾</Button>}</div>
        </StudySection>}

        {activeStage === 1 && <StudySection number="02" title="第二阶段：知识卡片与配套练习" description="依次阅读、作答并确认完成。答错后可以查看解析，再继续学习。">
          {!progress.review_completed && <Alert type="warning" showIcon title="请先完成课堂回顾" />}
          {cards.length === 0 ? <Alert type="warning" showIcon title="导师尚未发布知识卡片" description="本阶段不会自动完成。请联系执行导师发布本课时的知识卡片后再继续。" /> : <>
            <nav className="study-card-nav" aria-label="知识卡片">{cards.map((card, index) => <Button key={card.id} type={index === cardIndex ? 'primary' : 'default'} aria-pressed={index === cardIndex} icon={card.completed ? <CheckCircleOutlined /> : null} onClick={() => setCardIndex(index)} disabled={index > 0 && !cards[index - 1].completed}>{index + 1}. {card.title}</Button>)}</nav>
            <div className="study-card-title"><h4>{activeCard.title}</h4><PixelTag tone="current">{cardIndex + 1}/{cards.length}</PixelTag>{activeCard.completed && <PixelTag tone="success">已完成</PixelTag>}</div>
            {activeCard.summary && <p className="study-card-summary">{activeCard.summary}</p>}
            <p className="study-prose">{activeCard.content}</p>
            {activeCard.key_points && <Alert type="info" title="关键要点" description={activeCard.key_points} />}
            {activeCard.common_mistakes && <Alert type="warning" title="常见误区" description={activeCard.common_mistakes} />}
            <AssociatedExperiments variant="study" courseId={courseId} lessonId={lessonId} stage={1} cardId={activeCard.id} />
            {(activeCard.exercises || []).map((exercise, index) => <Exercise key={exercise.id} index={index} exercise={exercise} onDone={load} />)}
            {!activeCard.exercises?.length && <p className="study-help">本卡片没有配套练习，阅读后即可确认完成。</p>}
            {!cardExercisesDone && <Alert type="info" showIcon title="作答全部配套练习后可结束本卡片；每题只有一次机会" style={{ marginTop: 16 }} />}
            <div className="study-actions study-actions--between"><Button icon={<LeftOutlined />} disabled={cardIndex === 0} onClick={() => setCardIndex(cardIndex - 1)}>上一张</Button>{activeCard.completed ? <Button type="primary" icon={<RightOutlined />} disabled={cardIndex === cards.length - 1} onClick={() => setCardIndex(cardIndex + 1)}>下一张</Button> : <Button type="primary" loading={submitting} disabled={!cardExercisesDone} onClick={() => finishCard(activeCard)}>我已学完本卡片</Button>}</div>
            {progress.cards_done && <Button type="primary" block style={{ marginTop: 20 }} onClick={() => setActiveStage(2)}>下一步：学习报告与反思</Button>}
          </>}
        </StudySection>}

        {activeStage === 2 && <StudySection number="03" title="第三阶段：学习报告与反思" description="记录学到了什么，以及你准备怎样改进。报告与作品分别提交、分别评审。">
          {report && <Alert type={reportTone} showIcon title={`第 ${report.version} 版：${REPORT_STATUS[report.status]?.label || report.status}${Number.isInteger(report.score) ? ` · ${report.score} 分` : ''}`} description={report.review_comment} />}
          {(!report || report.status === 'rejected') && <Form form={form} layout="vertical" onFinish={submitReport} onFinishFailed={validationFailed} disabled={!progress.report_unlocked || submitting} onValuesChange={saveDraft}>
            <Alert type={draftState.includes('失败') ? 'error' : 'info'} showIcon title={draftState} description="草稿不会上传服务器；换设备无法恢复。提交成功后清除本地草稿。" />
            <h4>学习记录</h4>
            {reportFields.map(([name, label]) => <Form.Item key={name} name={name} label={label} rules={name === 'summary' ? [{ required: true, whitespace: true, message: '请填写学习总结' }] : []}><Input.TextArea rows={name === 'summary' ? 4 : 2} /></Form.Item>)}
            <Collapse activeKey={reflectionOpen} onChange={setReflectionOpen} items={[{ key: 'reflection', forceRender: true, label: '结构化反思（必填）', children: <>{reflectionFields.map(([name, label]) => <Form.Item key={name} name={['reflection', name]} label={label} rules={name === 'difficulty' ? [{ required: true, whitespace: true, message: '请填写遇到的困难' }] : []}><Input.TextArea rows={2} /></Form.Item>)}</> }]} />
            {!progress.report_unlocked && <Alert type="warning" title="完成课堂回顾、全部知识卡片与配套练习后才能提交报告" />}
            <div className="study-submit-result" aria-live="polite">{reportError && <Alert type="error" showIcon title="报告未能提交" description={reportError} />}</div>
            <div className="study-actions"><Button type="primary" htmlType="submit" loading={submitting}>提交学习报告与反思</Button><p>提交后等待导师评审；退回后可按意见修改。</p></div>
          </Form>}
          {report && report.status !== 'rejected' && <><dl className="study-reading-fields">{reportFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{report[key] || '未填写'}</dd></div>)}{reflectionFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{data.reflection?.[key] || '未填写'}</dd></div>)}</dl><Button type="primary" onClick={() => setActiveStage(3)}>查看导师评审状态</Button></>}
          <AssociatedExperiments variant="study" courseId={courseId} lessonId={lessonId} stage={2} />
        </StudySection>}

        {activeStage === 3 && <StudySection number="04" title="导师评审" description="查看学习报告的反馈，再决定下一步。">
          <Alert type={reportTone} showIcon title={report ? `${REPORT_STATUS[report.status]?.label}${Number.isInteger(report.score) ? ` · ${report.score} 分` : ''}` : '尚未提交学习报告'} description={report?.status === 'submitted' ? '报告正在等待执行导师评审。你可以回看知识卡片、查看已提交的报告，或处理下方的作品任务。' : report?.status === 'rejected' ? '请根据导师意见修改报告，再提交新版本。' : report?.status === 'approved' ? '本版学习报告已通过。作品的提交与评审状态请在下方单独查看。' : '完成前三个阶段后进入导师评审。'} />
          {report && <><div className="study-detail-meta"><span>学习报告 · 第 {report.version} 版</span>{report.submitted_at && <span>提交于 {formatBeijingTime(report.submitted_at)}</span>}</div><div className={`study-feedback${report.status === 'rejected' ? ' study-feedback--rejected' : ''}`}><h4>导师评语</h4><p className="study-prose">{report.review_comment || '导师暂未留下评语。'}</p>{Number.isInteger(report.score) && <p>本版报告评分：<strong>{report.score} 分</strong></p>}</div></>}
          <div className="study-actions"><Button type="primary" onClick={() => setActiveStage(2)}>{report?.status === 'rejected' ? '返回第三阶段修改' : '查看学习报告'}</Button><Button onClick={() => setActiveStage(1)}>回看知识卡片</Button></div>
          <AssociatedExperiments variant="study" courseId={courseId} lessonId={lessonId} stage={3} />
        </StudySection>}
      </div>
    </div>
    <LessonWorks courseId={courseId} lessonId={lessonId} />
  </div></PageContainer>;
}
