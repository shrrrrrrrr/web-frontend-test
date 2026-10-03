import { useRef, useState } from 'react';
import { Alert, Collapse, Empty, Form, InputNumber, Select, Spin, Tag, Image, message } from 'antd';
import { flightParameters, initialFlightParameters, flightMetrics, stateMeta, STATE_TIPS } from '../pages/glider/gliderModel';
import { useGliderFile } from '../pages/glider/useGliderRecords';
import { formatBeijingTime } from '../utils/date';
import { PixelButton, PixelPanel, PixelTag } from './visual/PixelUI';
import { StudyHeader, StudySection } from './visual/StudyUI';
import PixelIcon from './visual/PixelIcon';
import './visual/pixel-lab.css';

function ResultFile({ record, revision, name, title }) {
  const file = useGliderFile(record.id, name, revision);
  const [preview, setPreview] = useState(false);
  return <figure className="flight-file" data-file={name}>
    <figcaption>{title}</figcaption>
    {file.status === 'loading' ? <div className="flight-file-placeholder"><Spin size="small" /> 正在读取{title}…</div>
      : file.status === 'error' ? <Alert type="warning" showIcon title={`${title}暂时无法加载`}
        description="文件可能已移除或网络中断。其他数值和图表仍可查看。"
        action={<PixelButton onClick={file.retry}>重试{title}</PixelButton>} />
        : name === 'video' ? <video src={file.url} controls playsInline preload="metadata" onError={file.fail} aria-label="历史试飞视频" />
          : <><Image src={file.url} alt={title} onError={file.fail} preview={{ open: preview, onOpenChange: setPreview }} /><PixelButton className="flight-zoom" size="small" onClick={() => setPreview(true)}>放大查看{title}</PixelButton></>}
  </figure>;
}

function RecordResults({ records }) {
  const { viewingId, viewing, waitSec, pollFailed, pollTimedOut, openRecord, revision } = records;
  const meta = stateMeta(viewing?.state);
  return <>
    <div className="flight-record-heading"><PixelTag tone={viewing?.status === 'success' ? 'success' : 'neutral'}>{viewingId ? `试飞 #${viewingId}` : '还未选择试飞'}</PixelTag>
      {viewing && <time>{formatBeijingTime(viewing.created_at)}</time>}
      {viewingId && <PixelButton size="small" onClick={() => openRecord(viewingId)}>重新读取本条记录</PixelButton>}
    </div>
    {viewing && <Collapse className="flight-snapshot" items={[{ key: 'snapshot', label: `试飞 #${viewing.id} 使用的参数`, children: <><p className="flight-note">这是本条记录提交时的参数；参数编辑区的修改尚未用于本次结果。</p><dl className="flight-snapshot-grid">{flightParameters.map((parameter) => <div key={parameter.field}><dt>{parameter.title}</dt><dd>{viewing[parameter.field] ?? '—'} {parameter.unit}</dd></div>)}</dl></> }]} />}
    {!viewingId ? <div className="flight-ready"><PixelIcon name="lab" size={56} /><h4>把一个想法，交给一次试飞</h4><p>先调整参数，再点击「开始试飞」。<br />结果将保存在下方的试飞记录中。</p><span>调整参数 → 试飞 → 观察结果 → 再调整</span></div>
      : pollTimedOut ? <Alert type="warning" showIcon title="等待已超过 5 分钟" description="已停止自动读取。后台可能仍在计算，你可以重新读取这条记录。重读不会再次提交试飞。" action={<PixelButton onClick={() => openRecord(viewingId)}>重试读取</PixelButton>} />
        : pollFailed ? <Alert type="warning" showIcon title="暂时读不到模拟状态" description="已连续 3 次读取失败。后台可能仍在计算，请重试读取。" action={<PixelButton onClick={() => openRecord(viewingId)}>重试读取</PixelButton>} />
          : !viewing ? <div className="flight-running" role="status"><Spin /><h4>正在读取模拟状态…</h4><p>正在查看试飞 #{viewingId}</p></div>
            : viewing.status === 'running' ? <div className="flight-running" role="status"><Spin /><PixelTag>运行中</PixelTag><h4>正在计算飞行轨迹与图表</h4><p>本次查看已等待 {waitSec} 秒，每 2 秒读取一次状态。</p><p>计算结果将保存到你的账号，可以稍后从历史记录查看。</p></div>
              : viewing.status === 'error' ? <Alert type="error" showIcon title="本次计算失败" description={viewing.error || '模拟引擎异常，请稍后再试。'} />
                : <>
                  <div className="flight-outcome"><span className="flight-computed"><PixelIcon name="check" size={20} />计算成功</span><h4>结果：{meta.label}</h4><p>{STATE_TIPS[viewing.state] || '模拟完成。'}</p></div>
                  <dl className="flight-metrics">{flightMetrics(viewing).map(({ label, value, unit }) => <div key={label}><dt>{label}</dt><dd>{value}<small>{unit}</small></dd></div>)}</dl>
                  <p className="flight-note">本次可查看数值和图表。观察变化，再决定下一次要调整什么。</p>
                  <ResultFile key={`trajectory-${viewing.id}`} record={viewing} revision={revision} name="trajectory3d.png" title="三维航迹" />
                  <ResultFile key={`telemetry-${viewing.id}`} record={viewing} revision={revision} name="flight_telemetry.png" title="飞行遥测" />
                  {viewing.result?.files?.video && <ResultFile key={`video-${viewing.id}`} record={viewing} revision={revision} name="video" title="飞行过程回放" />}
                </>}

  </>;
}

export default function StudentGliderWorkspace({ form, records, startSim, submitting, submitError, engineChecking, engineReady,
  canSubmit, blockedReason, retryEngine, sourceCourse, sourceLesson, courses, lessons, courseId, lessonId,
  handleCourseChange, setLessonId, returning, contextPending, contextError, returnLabel, returnToSource, returnToLab }) {
  const [advanced, setAdvanced] = useState([]);
  const resultRef = useRef(null);
  const course = courses.find((item) => String(item.id) === String(sourceCourse));
  const lesson = lessons.find((item) => String(item.id) === String(sourceLesson));
  const openRecord = (id) => { records.openRecord(id); resultRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); };
  const finishFailed = ({ errorFields }) => {
    const field = errorFields?.[0];
    if (flightParameters.slice(3).some((parameter) => parameter.name === field?.name?.[0])) setAdvanced(['advanced']);
    message.error(`无法开始试飞：${field?.errors?.[0] || '请检查参数'}`);
    if (field) setTimeout(() => form.scrollToField(field.name, { focus: true, block: 'center' }), 0);
  };
  const parameterInput = (parameter) => <Form.Item key={parameter.name} name={parameter.name} label={parameter.label}
    extra={<>{parameter.extra}<span className="flight-range">范围 {parameter.min}–{parameter.max} {parameter.unit} · 每步 {parameter.step}</span></>}
    rules={[{ required: !!parameter.required, type: 'number', min: parameter.min, max: parameter.max, message: `请设置${parameter.title}（${parameter.min}–${parameter.max} ${parameter.unit}）` }]}>
    <InputNumber min={parameter.min} max={parameter.max} step={parameter.step} style={{ width: '100%' }} suffix={parameter.unit} />
  </Form.Item>;
  return <div className="study-workspace lab-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="lab" size={20} />实验室 / 滑翔机</>} title="滑翔机模拟实验室" description="改变一个条件，观察一次飞行。让结果帮助你调整下一次尝试。">
      <PixelButton icon={<PixelIcon name="back" />} loading={returning} disabled={contextPending} onClick={returnToSource}>{returnLabel}</PixelButton>
      {sourceCourse && returnLabel !== '返回实验室' && <PixelButton onClick={returnToLab}>返回实验室</PixelButton>}
    </StudyHeader>
    <div className="flight-context"><PixelTag>{sourceCourse ? '课程中的实验' : '自由实验'}</PixelTag><span>{sourceCourse ? contextError ? '来源已不可访问' : <><span>{course?.title || '正在确认来源课程'}</span>{lesson && <><span aria-hidden="true"> / </span><span>{lesson.title}</span></>}</> : '无需选择课程，可独立试飞；也可按需关联课程。'}</span></div>
    <p className="flight-boundary">试飞结果保存到你的账号，不会自动提交作品或完成课时。</p>
    <div className="flight-layout">
      <StudySection number="01" title="调整参数" description="这里是正在编辑的参数。" className="flight-parameters">
        <div className={`flight-engine ${engineReady && !blockedReason ? 'flight-engine--ready' : ''}`} role="status"><span>{engineChecking ? <Spin size="small" /> : <PixelIcon name={engineReady && !blockedReason ? 'check' : 'clock'} size={20} />}{blockedReason || '实验环境就绪，可以开始试飞。'}</span>{!engineChecking && !engineReady && <PixelButton size="small" onClick={retryEngine}>重新检查环境</PixelButton>}</div>
        <Form form={form} layout="vertical" initialValues={initialFlightParameters} onFinish={startSim} onFinishFailed={finishFailed}>
          {flightParameters.slice(0, 3).map(parameterInput)}
          <Collapse activeKey={advanced} onChange={setAdvanced} items={[{ key: 'advanced', label: '机身与尾翼（进阶 · 4 项）', forceRender: true, children: flightParameters.slice(3).map(parameterInput) }]} />
          <Collapse className="flight-association" items={[{ key: 'association', label: sourceCourse ? '查看固定课程关联' : '关联课程 / 课时（可选）', forceRender: true, children: <>
            <Form.Item name="course_id" label="关联课程（可选）" extra={sourceCourse ? '来自课程的实验保留原学习位置。' : '留空为独立实验；选择后本次试飞才会关联课程。'}><Select placeholder="独立实验（不关联课程）" allowClear disabled={!!sourceCourse} value={courseId} onChange={handleCourseChange} options={courses.map((item) => ({ value: item.id, label: item.title }))} /></Form.Item>
            <Form.Item name="lesson_id" label="关联课时（可选）"><Select placeholder="选择课时" allowClear value={lessonId} onChange={setLessonId} disabled={!courseId || !!sourceCourse} options={lessons.map((item) => ({ value: item.id, label: item.title }))} /></Form.Item>
          </> }]} />
          <div className="flight-submit">{submitError && <Alert role="alert" type="error" showIcon title="未能开始试飞" description={submitError} />}<PixelButton type="primary" htmlType="submit" icon={<PixelIcon name="continue" />} loading={submitting} disabled={!canSubmit} block>{submitting ? '正在提交试飞' : engineChecking ? '正在检测实验环境…' : '开始试飞'}</PixelButton><p>提交后将使用当前参数进行一次新试飞。</p></div>
        </Form>
      </StudySection>
      <div ref={resultRef} className="flight-result-anchor" tabIndex={-1}><StudySection number="02" title="观察结果" description="每次试飞都有自己的记录，结果与编辑区分开保存。" className="flight-results"><RecordResults records={records} /></StudySection></div>
    </div>
    <PixelPanel className="flight-history" aria-label="我的试飞记录">
      <header><div><span className="flight-kicker">FLIGHT LOG</span><h3>我的试飞记录</h3><p>选择一条查看当时的结果，不会更改正在编辑的参数。</p></div><PixelButton onClick={records.loadHistory} loading={records.loadingHistory}>刷新记录</PixelButton></header>
      {records.historyError ? <Alert type="error" showIcon title={records.historyError} action={<PixelButton onClick={records.loadHistory}>重试加载记录</PixelButton>} />
        : records.loadingHistory ? <Spin description="正在加载记录"><div className="flight-history-loading" /></Spin>
          : !records.history.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有试飞记录，先设计一架试试吧" />
            : <ul>{records.history.map((item) => <li key={item.id}><button type="button" className="flight-history-entry" aria-pressed={records.viewingId === item.id} onClick={() => openRecord(item.id)}>
              <span className="flight-history-id">#{item.id}<Tag color={item.status === 'running' ? 'processing' : item.status === 'error' ? 'error' : stateMeta(item.state).color}>{item.status === 'running' ? '运行中' : item.status === 'error' ? '计算失败' : stateMeta(item.state).label}</Tag></span>
              <span className="flight-history-params">上反角 {item.dihedral_deg ?? '—'}° · 重心 {item.cg_x > 0 ? '+' : ''}{item.cg_x ?? '—'} m · 速度 {item.speed ?? '—'} m/s</span>
              <time>{formatBeijingTime(item.created_at)}</time><span className="flight-history-open">{records.viewingId === item.id ? '正在查看' : '查看结果'} <PixelIcon name="continue" size={16} /></span>
            </button></li>)}</ul>}
    </PixelPanel>
  </div>;
}
