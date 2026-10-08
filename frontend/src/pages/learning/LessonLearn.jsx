import Alert from '../../student/visual/StudentAlert';
import Sentence from '../../content/Sentence';
import {copyText} from '../../content/copy';
import CopyBlock from '../../content/CopyBlock';
import {useCourseApis} from '../../student/useCourseApis';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  App, Checkbox, Collapse, Empty, Form, Input, Radio, Space, Typography,
} from 'antd';
import {
  CheckCircleOutlined, DownloadOutlined,
  LeftOutlined, PlayCircleOutlined, RightOutlined,
} from '@ant-design/icons';
import PageContainer from '../../components/common/PageContainer';
import AsyncPageState from '../../student/visual/StudentPageState';
import { LEARNING_STEPS, REPORT_STATUS } from '../../constants/status';
import { useAuth } from '../../store/AuthContext';
import { draftKey } from '../../student/model';
import LessonWorks from '../../student/LessonWorks';
import AssociatedExperiments from '../../student/AssociatedExperiments';
import { availableCardIndex, learningStage } from '../../student/experimentContext';
import { PixelButton as Button, PixelProgress, PixelTag } from '../../student/visual/PixelUI';
import { StudyHeader, StudySection } from '../../student/visual/StudyUI';
import PixelIcon from '../../student/visual/PixelIcon';
import LessonTemplate from '../../student/space/LessonTemplate';
import { formatBeijingTime } from '../../utils/date';

const { Text } = Typography;

function answerText(value) {
  if (Array.isArray(value)) return value.join('、');
  if (value === true) return copyText('system.learning.001');
  if (value === false) return copyText('system.learning.002');
  return String(value ?? '-');
}

function Exercise({ exercise, index, onDone }) {
 const { learningAPI }=useCourseApis();
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
    } catch (err) { setError(err.response?.data?.error || copyText('system.learning.003')); }
    finally { setSubmitting(false); }
  };
  const options = (exercise.options || []).map((item, index) => typeof item === 'object'
    ? { label: item.label ?? item.text, value: item.value ?? item.key ?? String(index) }
    : { label: item, value: item });
  let input = <Input.TextArea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={2} placeholder={copyText('system.learning.004')} />;
  if (exercise.question_type === 'single_choice') input = <Radio.Group options={options} value={answer} onChange={(event) => setAnswer(event.target.value)} />;
  if (exercise.question_type === 'multiple_choice') input = <Checkbox.Group options={options} value={answer} onChange={setAnswer} />;
  if (exercise.question_type === 'true_false') input = <Radio.Group options={[{ label: copyText('system.learning.005'), value: true }, { label: copyText('system.learning.006'), value: false }]} value={answer} onChange={(event) => setAnswer(event.target.value)} />;
  return <section className="study-exercise" aria-labelledby={`exercise-${exercise.id}`}>
      <PixelTag>{copyText('system.learning.007')}{index + 1} · {{ single_choice: copyText('system.learning.008'), multiple_choice: copyText('system.learning.009'), true_false: copyText('system.learning.010'), short_answer: copyText('system.learning.011'), fill_blank: copyText('system.learning.012') }[exercise.question_type] || copyText('system.learning.013')}</PixelTag>
      <h5 id={`exercise-${exercise.id}`}>{exercise.prompt}</h5><fieldset disabled={exercise.attempted || submitting || Boolean(result)} aria-label={exercise.prompt}>{input}</fieldset>
      {!exercise.attempted && <Alert type="info" showIcon title={copyText('system.learning.014')} />}
      <Button type="primary" onClick={submit} loading={submitting} disabled={exercise.attempted || Boolean(result) || !hasAnswer}>{copyText('system.learning.015')}</Button>
      {error && <Alert type="error" showIcon title={copyText('system.learning.016')} description={error} />}
      {exercise.attempted && <Alert type={exercise.passed ? 'success' : 'warning'} showIcon title={exercise.passed ? copyText('system.learning.017') : copyText('system.learning.018')} description={<Space orientation="vertical" size={2}><Text>{copyText('system.learning.019')}{answerText(exercise.correct_answer)}</Text><Sentence as={Text}>{copyText('system.learning.020')}{exercise.explanation || copyText('system.learning.021')}</Sentence></Space>} />}
      {result && !exercise.attempted && <Alert type={result.correct ? 'success' : 'warning'} showIcon title={result.correct ? copyText('system.learning.022') : copyText('system.learning.023')} description={<Space orientation="vertical" size={2}><Text>{copyText('system.learning.024')}{answerText(result.correct_answer)}</Text><Sentence as={Text}>{copyText('system.learning.025')}{result.explanation || copyText('system.learning.026')}</Sentence></Space>} />}
  </section>;
}

export default function LessonLearn() {
 const { courseAPI,learningAPI }=useCourseApis();
  const { message, modal } = App.useApp();
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [draftState, setDraftState] = useState(copyText('system.learning.027'));
  const [draftFailed, setDraftFailed] = useState(false);
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
      setDraftState(copyText('system.learning.028'));
      setDraftFailed(false);
    } catch { setDraftFailed(true); setDraftState(copyText('system.learning.029')); }
  };

  const playReplay = async (replayId) => {
    setActiveReplayId(replayId); setReplayError('');
    try { setReplayUrl((await courseAPI.streamUrl(replayId)).url); setReplayAttempt((attempt) => attempt + 1); }
    catch { setReplayUrl(''); setReplayError(copyText('system.learning.030')); }
  };

  const load = async ({ restorePosition = false } = {}) => {
    setLoading(true); setError('');
    try {
      const payload = await learningAPI.lesson(lessonId);
      if (String(payload.course.id) !== String(courseId)) throw new Error(copyText('system.learning.031'));
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
          navigate(`/courses/${courseId}`, { replace: true, state: { experimentNotice: copyText('system.learning.032') } });
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
          if (savedDraft) setDraftState(copyText('system.learning.033'));
        } catch { savedDraft = null; setDraftFailed(true); setDraftState(copyText('system.learning.034')); }
        form.setFieldsValue(savedDraft || (payload.report?.status === 'rejected' ? { ...payload.report, reflection: payload.reflection || {} } : {}));
      }
    } catch (err) {
      setData(null);
      if (restorePosition && searchParams.has('cardId') && [403, 404].includes(err?.response?.status)) {
        let target = '/explore';
        try { await courseAPI.detail(courseId); target = `/courses/${courseId}`; } catch { /* no accessible course to return to */ }
        const notice = target === '/explore' ? copyText('system.learning.035') : copyText('system.learning.036');
        message.warning(notice);
        navigate(target, { replace: true, state: { experimentNotice: notice } });
        return;
      }
      setError(err?.response?.data?.error || copyText('system.learning.037'));
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load({ restorePosition: true }); }, [courseId, lessonId, searchParams]);

  const finishReview = async () => {
    setSubmitting(true); setActionError('');
    try {
      await learningAPI.completeReview(lessonId);
      message.success(copyText('system.learning.038'));
      await load();
    } catch (err) { setActionError(err.response?.data?.error || copyText('system.learning.039')); }
    finally { setSubmitting(false); }
  };

  const finishCard = async (card) => {
    setSubmitting(true); setActionError('');
    try {
      await learningAPI.completeCard(card.id);
      const isLast = cardIndex === data.cards.length - 1;
      if (!isLast) setCardIndex(cardIndex + 1);
      message.success(isLast ? copyText('system.learning.040') : copyText('system.learning.041'));
      await load();
    } catch (err) { setActionError(err.response?.data?.error || copyText('system.learning.042')); }
    finally { setSubmitting(false); }
  };

  const downloadResource = async (resource) => {
    setResourceError('');
    try {
      const blob = await courseAPI.downloadResource(resource.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = resource.file_name || resource.title || copyText('system.learning.043'); anchor.click();
      URL.revokeObjectURL(url);
    } catch { setResourceError(`“${resource.title || copyText('system.learning.044')}”下载失败，文件可能已移除或网络中断。请重试或联系导师，当前学习和草稿不受影响。`); }
  };

  const submitReport = (values) => {
    modal.confirm({
      title: copyText('system.learning.045'),
      content: copyText('system.learning.046'),
      onOk: async () => {
        setSubmitting(true); setReportError('');
        try {
          await learningAPI.submitReport(lessonId, { report: values, reflection: values.reflection });
          message.success(copyText('system.learning.047'));
          try { localStorage.removeItem(reportDraftKey); } catch { message.warning(copyText('system.learning.048')); }
          form.resetFields(); await load();
        } catch (err) { setReportError(err.response?.data?.error || copyText('system.learning.049')); }
        finally { setSubmitting(false); }
      },
    });
  };

  if (!data) return <PageContainer title={copyText('system.learning.050')} extra={<Button onClick={() => navigate('/tasks')}>{copyText('system.learning.051')}</Button>}><AsyncPageState loading={loading} error={error} onRetry={load}><Empty /></AsyncPageState></PageContainer>;

  const { lesson, cards = [], progress = {}, report } = data;
  const currentStep = learningStage(data);
  const activeCard = cards[cardIndex];
  const cardExercisesDone = activeCard?.exercises?.every((exercise) => exercise.attempted) ?? false;
  if(data.lesson.presentation_type==='visit'||data.lesson.content_state==='preparing')return <LessonTemplate data={data}/>;
  const stageDone = [progress.review_completed, progress.cards_done, report && report.status !== 'rejected', report?.status === 'approved'];
  const stageReasons = ['', copyText('system.learning.052'), copyText('system.learning.053'), copyText('system.learning.054')];
  const reportFields = [['summary', copyText('system.learning.055')], ['key_points', copyText('system.learning.056')], ['application', copyText('system.learning.057')], ['difficulties', copyText('system.learning.058')], ['next_plan', copyText('system.learning.059')]];
  const reflectionFields = [['difficulty', copyText('system.learning.060')], ['solution', copyText('system.learning.061')], ['improvement', copyText('system.learning.062')], ['new_question', copyText('system.learning.063')]];
  const validationFailed = ({ errorFields }) => {
    if (errorFields.some(({ name }) => name[0] === 'reflection')) setReflectionOpen(['reflection']);
    const name = errorFields[0]?.name;
    if (name) requestAnimationFrame(() => requestAnimationFrame(() => form.scrollToField(name, { block: 'center', behavior: 'instant', focus: true })));
  };
  const reportTone = report?.status === 'approved' ? 'success' : report?.status === 'rejected' ? 'warning' : 'info';

  return <PageContainer><div className="study-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="book" />{data.course.title}</>} title={lesson.title} description={`正在查看：${LEARNING_STEPS[activeStage]}`}>
      <Button onClick={() => navigate(`/courses/${courseId}?lesson=${lessonId}`)} icon={<PixelIcon name="back" />}>{copyText('system.learning.064')}</Button>
      <Button onClick={() => navigate('/tasks')}>{copyText('system.learning.065')}</Button>
    </StudyHeader>
    <div className="study-layout">
      <aside className="study-stages" aria-label={copyText('system.learning.066')}>
        <h3>{copyText('system.learning.067')}</h3><PixelProgress value={progress.percent || 0} label={copyText('system.learning.068')} />
        <Sentence className="study-progress-note">{copyText('system.learning.069')}<br />{copyText('system.learning.070')}</Sentence>
        <nav aria-label={copyText('system.learning.071')}><ol>{LEARNING_STEPS.map((title, index) => {
          const locked = index > currentStep && !(index === 3 && report);
          const status = locked ? copyText('system.learning.072') : index === 3 && report ? REPORT_STATUS[report.status]?.label : stageDone[index] ? copyText('system.learning.073') : copyText('system.learning.074');
          return <li key={title}><button type="button" className="study-stage" aria-current={activeStage === index ? 'step' : undefined} disabled={locked} onClick={() => setActiveStage(index)}>
            <span className="study-stage-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{title}</strong><small>{activeStage === index ? copyText('system.learning.075') : ''}{status}</small>{locked && <small>{stageReasons[index]}</small>}</span>
          </button></li>;
        })}</ol></nav>
        <a className="study-stages-footer" href="#lesson-works">{copyText('system.learning.076')}</a>
      </aside>
      <div className="study-main">
        {lesson.teaching_tip&&<Alert type="info" title={<Sentence>{lesson.teaching_tip}</Sentence>}/>}
        {actionError && <Alert type="error" showIcon title={actionError} />}
        {activeStage === 0 && <StudySection number="01" title={copyText('system.learning.077')} description={copyText('system.learning.078')}>
          <section aria-label={copyText('system.learning.079')}><h4>{copyText('system.learning.080')}</h4>
            {replayError && <Alert type="warning" showIcon title={copyText('system.learning.081')} description={replayError} action={activeReplayId && <Button onClick={() => playReplay(activeReplayId)}>{copyText('system.learning.082')}</Button>} />}
            {replayUrl ? <video key={`${replayUrl}:${replayAttempt}`} controls src={replayUrl} className="study-video" onError={() => setReplayError(copyText('system.learning.083'))} /> : !replayError && <Empty description={copyText('system.learning.084')} />}
            <Space wrap>{data.replays.map((replay) => <Button key={replay.id} type={activeReplayId === replay.id ? 'primary' : 'default'} icon={<PlayCircleOutlined />} onClick={() => playReplay(replay.id)}>{replay.title}</Button>)}</Space>
          </section>
          <section className="study-subsection" aria-label={copyText('system.learning.085')}><h4>{copyText('system.learning.086')}</h4>
            {resourceError && <Alert type="warning" showIcon title={resourceError} />}
            {data.resources.length === 0 ? <Empty description={copyText('system.learning.087')} /> : data.resources.map((resource) => <div className="study-resource" key={resource.id}><div><Text strong>{resource.title}</Text>{resource.description && <Sentence>{resource.description}</Sentence>}</div>{resource.has_file ? <Button icon={<DownloadOutlined />} onClick={() => downloadResource(resource)}>{copyText('system.learning.088')}</Button> : <Text type="secondary">{copyText('system.learning.089')}</Text>}</div>)}
          </section>
          <AssociatedExperiments variant="study" courseId={courseId} lessonId={lessonId} stage={0} />
          <div className="study-actions">{progress.review_completed ? <><PixelTag tone="success">{copyText('system.learning.090')}</PixelTag><Button type="primary" onClick={() => setActiveStage(1)}>{copyText('system.learning.091')}</Button></> : <Button type="primary" loading={submitting} onClick={finishReview}>{copyText('system.learning.092')}</Button>}</div>
        </StudySection>}

        {activeStage === 1 && <StudySection number="02" title={copyText('system.learning.093')} description={copyText('system.learning.094')}>
          {!progress.review_completed && <Alert type="warning" showIcon title={copyText('system.learning.095')} />}
          {cards.length === 0 ? <Alert type="warning" showIcon title={copyText('system.learning.096')} description={copyText('system.learning.097')} /> : <>
            <nav className="study-card-nav" aria-label={copyText('system.learning.098')}>{cards.map((card, index) => <Button key={card.id} type={index === cardIndex ? 'primary' : 'default'} aria-pressed={index === cardIndex} icon={card.completed ? <CheckCircleOutlined /> : null} onClick={() => setCardIndex(index)} disabled={index > 0 && !cards[index - 1].completed}>{index + 1}. {card.title}</Button>)}</nav>
            <div className="study-card-title"><h4>{activeCard.title}</h4><PixelTag tone="current">{cardIndex + 1}/{cards.length}</PixelTag>{activeCard.completed && <PixelTag tone="success">{copyText('system.learning.099')}</PixelTag>}</div>
            {activeCard.summary && <Sentence className="study-card-summary">{activeCard.summary}</Sentence>}
            <Sentence className="study-prose">{activeCard.content}</Sentence>
            {activeCard.key_points && <Alert type="info" title={copyText('system.learning.100')} description={activeCard.key_points} />}
            {activeCard.common_mistakes && <Alert type="warning" title={copyText('system.learning.101')} description={activeCard.common_mistakes} />}
            <AssociatedExperiments variant="study" courseId={courseId} lessonId={lessonId} stage={1} cardId={activeCard.id} />
            {(activeCard.exercises || []).map((exercise, index) => <Exercise key={exercise.id} index={index} exercise={exercise} onDone={load} />)}
            {!activeCard.exercises?.length && <CopyBlock id="system.learning.102" as="p" className="study-help"/>}
            {!cardExercisesDone && <Alert type="info" showIcon title={copyText('system.learning.103')} style={{ marginTop: 16 }} />}
            <div className="study-actions study-actions--between"><Button icon={<LeftOutlined />} disabled={cardIndex === 0} onClick={() => setCardIndex(cardIndex - 1)}>{copyText('system.learning.104')}</Button>{activeCard.completed ? <Button type="primary" icon={<RightOutlined />} disabled={cardIndex === cards.length - 1} onClick={() => setCardIndex(cardIndex + 1)}>{copyText('system.learning.105')}</Button> : <Button type="primary" loading={submitting} disabled={!cardExercisesDone} onClick={() => finishCard(activeCard)}>{copyText('system.learning.106')}</Button>}</div>
            {progress.cards_done && <Button type="primary" block style={{ marginTop: 20 }} onClick={() => setActiveStage(2)}>{copyText('system.learning.107')}</Button>}
          </>}
        </StudySection>}

        {activeStage === 2 && <StudySection number="03" title={copyText('system.learning.108')} description={copyText('system.learning.109')}>
          {report && <Alert type={reportTone} showIcon title={`第 ${report.version} 版：${REPORT_STATUS[report.status]?.label || report.status}${Number.isInteger(report.score) ? ` · ${report.score} 分` : ''}`} description={report.review_comment} />}
          {(!report || report.status === 'rejected') && <Form form={form} layout="vertical" onFinish={submitReport} onFinishFailed={validationFailed} disabled={!progress.report_unlocked || submitting} onValuesChange={saveDraft}>
            <Alert type={draftFailed ? 'error' : 'info'} showIcon title={draftState} description={copyText('system.learning.111')} />
            <h4>{copyText('system.learning.112')}</h4>
            {reportFields.map(([name, label]) => <Form.Item key={name} name={name} label={label} rules={name === 'summary' ? [{ required: true, whitespace: true, message: copyText('system.learning.113') }] : []}><Input.TextArea rows={name === 'summary' ? 4 : 2} /></Form.Item>)}
            <Collapse activeKey={reflectionOpen} onChange={setReflectionOpen} items={[{ key: 'reflection', forceRender: true, label: copyText('system.learning.114'), children: <>{reflectionFields.map(([name, label]) => <Form.Item key={name} name={['reflection', name]} label={label} rules={name === 'difficulty' ? [{ required: true, whitespace: true, message: copyText('system.learning.115') }] : []}><Input.TextArea rows={2} /></Form.Item>)}</> }]} />
            {!progress.report_unlocked && <Alert type="warning" title={copyText('system.learning.116')} />}
            <div className="study-submit-result" aria-live="polite">{reportError && <Alert type="error" showIcon title={copyText('system.learning.117')} description={reportError} />}</div>
            <div className="study-actions"><Button type="primary" htmlType="submit" loading={submitting}>{copyText('system.learning.118')}</Button><CopyBlock id="system.learning.119" as="p" /></div>
          </Form>}
          {report && report.status !== 'rejected' && <><dl className="study-reading-fields">{reportFields.map(([key, label]) => <div key={key}><dt>{label}</dt><Sentence as="dd">{report[key] || copyText('system.learning.120')}</Sentence></div>)}{reflectionFields.map(([key, label]) => <div key={key}><dt>{label}</dt><Sentence as="dd">{data.reflection?.[key] || copyText('system.learning.121')}</Sentence></div>)}</dl><Button type="primary" onClick={() => setActiveStage(3)}>{copyText('system.learning.122')}</Button></>}
          <AssociatedExperiments variant="study" courseId={courseId} lessonId={lessonId} stage={2} />
        </StudySection>}

        {activeStage === 3 && <StudySection number="04" title={copyText('system.learning.123')} description={copyText('system.learning.124')}>
          <Alert type={reportTone} showIcon title={report ? `${REPORT_STATUS[report.status]?.label}${Number.isInteger(report.score) ? ` · ${report.score} 分` : ''}` : copyText('system.learning.125')} description={report?.status === 'submitted' ? copyText('system.learning.126') : report?.status === 'rejected' ? copyText('system.learning.127') : report?.status === 'approved' ? copyText('system.learning.128') : copyText('system.learning.129')} />
          {report && <><div className="study-detail-meta"><span>{copyText('system.learning.130')}{report.version}{copyText('system.learning.131')}</span>{report.submitted_at && <span>{copyText('system.learning.132')}{formatBeijingTime(report.submitted_at)}</span>}</div><div className={`study-feedback${report.status === 'rejected' ? ' study-feedback--rejected' : ''}`}><h4>{copyText('system.learning.133')}</h4><Sentence className="study-prose">{report.review_comment || copyText('system.learning.134')}</Sentence>{Number.isInteger(report.score) && <Sentence>{copyText('system.learning.135')}<strong>{report.score}{copyText('system.learning.136')}</strong></Sentence>}</div></>}
          <div className="study-actions"><Button type="primary" onClick={() => setActiveStage(2)}>{report?.status === 'rejected' ? copyText('system.learning.137') : copyText('system.learning.138')}</Button><Button onClick={() => setActiveStage(1)}>{copyText('system.learning.139')}</Button></div>
          <AssociatedExperiments variant="study" courseId={courseId} lessonId={lessonId} stage={3} />
        </StudySection>}
      </div>
    </div>
    <LessonWorks courseId={courseId} lessonId={lessonId} />
  </div></PageContainer>;
}
