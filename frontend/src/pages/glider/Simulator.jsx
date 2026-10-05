import { useCourseApis, useCourseId } from '../../student/useCourseApis';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Row, Col, Card, Form, Button, Tag, Space, Spin, message,
  Statistic, Alert, List, Typography, Empty, Result,
} from 'antd';
import { ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import { formatBeijingTime } from '../../utils/date';
import { useAuth } from '../../store/AuthContext';
import { resolveExperimentReturn } from '../../student/experimentContext';
import useGliderRecords from './useGliderRecords';
import { stateMeta, STATE_TIPS } from './gliderModel';
import StudentGliderWorkspace from '../../student/StudentGliderWorkspace';
import { STUDENT_COURSES_CHANGED } from '../../student/accessPolicy';

const { Title, Text } = Typography;

export default function GliderSimulator() {
  const { courseAPI, learningAPI, gliderAPI } = useCourseApis();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const scopedCourse = useCourseId();
  const sourceCourse = scopedCourse || params.get('course_id');
  const sourceLesson = params.get('lesson_id');
  const requestedReturn = params.get('returnTo') || (scopedCourse ? '/courses/'+scopedCourse+'/lab' : null);
  const sourceKey = JSON.stringify([sourceCourse, sourceLesson, requestedReturn]);
  const { user } = useAuth();
  const [form] = Form.useForm();
  const records = useGliderRecords();
  const { history, loadingHistory, historyError, loadHistory, viewingId, viewing, waitSec, pollFailed, pollTimedOut, openRecord, revision } = records;
  const [img, setImg] = useState({ trajectory: null, telemetry: null, video: null });
  const [resultFileError, setResultFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [engineInfo, setEngineInfo] = useState(null);
  const [engineError, setEngineError] = useState(null);
  // 试飞课程/课时关联（决策 D-7）
  const [courses, setCourses] = useState([]);
  const [contextError, setContextError] = useState('');
  const [contextLoading, setContextLoading] = useState(!!sourceCourse);
  const [courseId, setCourseId] = useState(undefined);
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState(undefined);
  const [returnTo, setReturnTo] = useState('/lab');
  const [returning, setReturning] = useState(false);
  const [checkedSource, setCheckedSource] = useState(null);
  const contextPending = user?.role === 'student' && (contextLoading || checkedSource !== sourceKey);

  const verifySource = () => resolveExperimentReturn({ courseId: sourceCourse, lessonId: sourceLesson, returnTo: requestedReturn }, { course: courseAPI.detail, lesson: learningAPI.lesson });
  const returnToSource = async () => {
    if (user?.role !== 'student') { navigate('/dashboard'); return; }
    if (!sourceCourse) { navigate('/lab'); return; }
    setReturning(true);
    try {
      const resolution = await verifySource();
      if (resolution.reason) message.warning(resolution.reason);
      navigate(resolution.path, { state: { experimentNotice: resolution.reason } });
    } finally { setReturning(false); }
  };

  const [engineAttempt, setEngineAttempt] = useState(0);
  // 进入页面检测引擎就绪状态（结果缓存于后端 60s）
  // 注意：探测失败不能静默吞掉——否则按钮看似可用、点击却毫无反应，排查成本极高
  useEffect(() => {
    let alive = true;
    gliderAPI.capabilities()
      .then((res) => { if (alive) { setEngineInfo(res); setEngineError(null); } })
      .catch((err) => {
        if (!alive) return;
        setEngineInfo(null);
        setEngineError(err?.response?.data?.error || err?.message || '无法获取实验环境状态');
      });
    return () => { alive = false; };
  }, [engineAttempt,gliderAPI]);

  // 不自动选中课程；独立进入不产生课程关联。
  useEffect(() => {
    if (user?.role !== 'student') return undefined;
    let alive = true;
    courseAPI.list()
      .then((res) => {
        if (!alive) return;
        const list = res.courses || [];
        setCourses(list);
        if (sourceCourse) {
          resolveExperimentReturn({ courseId: sourceCourse, lessonId: sourceLesson, returnTo: requestedReturn }, { course: courseAPI.detail, lesson: learningAPI.lesson }).then((resolution) => {
            if (!alive) return;
            setReturnTo(resolution.path);
            if (!resolution.available) { setContextError(resolution.reason.replaceAll('已返回', '请返回')); setCourseId(undefined); setLessonId(undefined); setLessons([]); return; }
            setContextError('');
            setCourseId(Number(sourceCourse)); setLessons(resolution.detail.lessons || []);
            setLessonId(sourceLesson ? Number(sourceLesson) : undefined);
            form.setFieldsValue({ course_id: Number(sourceCourse), lesson_id: sourceLesson ? Number(sourceLesson) : undefined });
          }).catch(() => { if (alive) setContextError('无法确认来源课程，请重试。'); })
            .finally(() => { if (alive) { setContextLoading(false); setCheckedSource(sourceKey); } });
        } else {
          setContextError(''); setCourseId(undefined); setLessonId(undefined); setLessons([]); setReturnTo('/lab');
          form.setFieldsValue({ course_id: undefined, lesson_id: undefined });
          setContextLoading(false); setCheckedSource(sourceKey);
        }
      })
      .catch(() => {
        if (!alive) return;
        if (sourceCourse) setContextError('无法确认来源课程，请重试。');
        else { setContextError(''); setCourseId(undefined); setLessonId(undefined); setLessons([]); setReturnTo('/lab'); form.setFieldsValue({ course_id: undefined, lesson_id: undefined }); }
        setContextLoading(false); setCheckedSource(sourceKey);
      });
    return () => { alive = false; };
  }, [user?.role, form, sourceCourse, sourceLesson, requestedReturn, sourceKey,courseAPI,learningAPI]);

  useEffect(() => {
    const updateCourses = (event) => {
      const { courses: availableCourses = [], removedCourseIds = [] } = event.detail || {};
      setCourses(availableCourses);
      if (!removedCourseIds.some((id) => String(id) === String(sourceCourse || courseId))) return;
      setCourseId(undefined); setLessonId(undefined); setLessons([]);
      form.setFieldsValue({ course_id: undefined, lesson_id: undefined });
      if (sourceCourse) {
        setContextError('来源课程已撤回或报名关系已变化，请返回实验室自由使用。');
        setReturnTo('/lab');
      } else message.warning('关联课程已不可访问，已清除课程和课时关联。你仍可独立试飞。');
    };
    window.addEventListener(STUDENT_COURSES_CHANGED, updateCourses);
    return () => window.removeEventListener(STUDENT_COURSES_CHANGED, updateCourses);
  }, [courseId, form, sourceCourse]);

  const handleCourseChange = async (value) => {
    setCourseId(value);
    setLessonId(undefined);
    form.setFieldValue('lesson_id', undefined);
    setLessons([]);
    if (!value) return;
    try {
      const res = await courseAPI.detail(value);
      setLessons(res.lessons || []);
    } catch { setLessons([]); }
  };

  // 模拟成功后加载结果图与飞行回放视频
  useEffect(() => {
    if (user?.role === 'student' || !viewing) return undefined;
    if (viewing.status !== 'success') {
      const t = setTimeout(() => { setImg({ trajectory: null, telemetry: null, video: null }); setResultFileError(''); }, 0);
      return () => clearTimeout(t);
    }
    let alive = true;
    const mimeOf = (name) => (name.endsWith('.mp4') ? 'video/mp4' : name.endsWith('.png') ? 'image/png' : 'application/octet-stream');
    const urls = [];
    const missingFiles = [];
    const load = async (name) => {
      try {
        const res = await gliderAPI.file(viewing.id, name);
        if (!alive) return null;
        const blob = new Blob([res], { type: mimeOf(name) });
        const url = URL.createObjectURL(blob);
        urls.push(url);
        return url;
      } catch { missingFiles.push(name === 'trajectory3d.png' ? '航迹图' : '飞行遥测图'); return null; }
    };
    // 视频改走签名流式地址：支持 Range 拖动，避免整段 blob 下载
    const loadVideo = async () => {
      try {
        const res = await gliderAPI.streamUrl(viewing.id);
        if (!alive || !res.url) return null;
        return res.url;
      } catch { missingFiles.push('飞行回放'); return null; }
    };
    const hasVideo = !!viewing.result?.files?.video;
    (async () => {
      const [trajectory, telemetry, video] = await Promise.all([
        load('trajectory3d.png'),
        load('flight_telemetry.png'),
        hasVideo ? loadVideo() : Promise.resolve(null),
      ]);
      if (alive) {
        setImg({ trajectory, telemetry, video });
        setResultFileError(missingFiles.length ? `${missingFiles.join('、')}暂时无法加载，可能文件已移除或网络中断。试飞参数和数值结果仍可查看，请刷新记录后重试。` : '');
      }
    })();
    // 卸载/切换记录时释放对象 URL，避免反复查看累积内存
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [viewing, user?.role, revision,gliderAPI]);

  const startSim = async (values) => {
    setSubmitting(true); setSubmitError('');
    try {
      if (contextError || contextPending) throw new Error('请先确认来源课程');
      if (sourceCourse) {
        const resolution = await verifySource();
        setReturnTo(resolution.path);
        if (!resolution.available) {
          setContextError(resolution.reason.replaceAll('已返回', '请返回'));
          setCourseId(undefined); setLessonId(undefined); setLessons([]);
          throw new Error(resolution.reason.replaceAll('已返回', '请返回'));
        }
      } else if (courseId) {
        const detail = await courseAPI.detail(courseId);
        if (lessonId && !detail.lessons.some((lesson) => String(lesson.id) === String(lessonId) && lesson.status !== 'cancelled')) throw new Error('关联课时已不可用，请重新选择课时或独立试飞。');
      }
      const r = await gliderAPI.simulate({
        dihedral_deg: values.dihedral,
        cg_x: values.cg,
        speed: values.speed,
        wing_area: values.wing_area,
        mass: values.mass,
        elevator_deg: values.elevator,
        rudder_deg: values.rudder,
        course_id: courseId,
        lesson_id: courseId ? lessonId : undefined,
      });
      openRecord(r.id);
      message.success('模拟已开始，正在计算…');
      loadHistory();
    } catch (err) {
      setSubmitError(err?.response?.data?.error || err?.message || '启动模拟失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = useMemo(() => stateMeta(viewing?.state), [viewing]);
  const isStudent = user?.role === 'student';
  const engineChecking = !engineInfo && !engineError;
  const engineReady = engineInfo?.ready === true;
  const canSubmit = isStudent && engineReady && !contextError && !contextPending;
  const blockedReason = !isStudent
    ? ''
    : engineChecking
      ? '正在检测实验环境…'
      : engineError
        ? `无法确认实验环境：${engineError}`
        : !engineReady
          ? '模拟引擎暂不可用，请稍后再试或联系老师。'
          : contextPending ? '正在确认来源课程…' : contextError;

  if (isStudent) return <StudentGliderWorkspace
    form={form} records={records} startSim={startSim} submitting={submitting} submitError={submitError}
    engineChecking={engineChecking} engineReady={engineReady} canSubmit={canSubmit} blockedReason={blockedReason}
    retryEngine={() => { setEngineInfo(null); setEngineError(null); setEngineAttempt((value) => value + 1); }}
    sourceCourse={sourceCourse} sourceLesson={sourceLesson} courses={courses} lessons={lessons}
    courseId={courseId} lessonId={lessonId} handleCourseChange={handleCourseChange} setLessonId={setLessonId}
    returning={returning} contextPending={contextPending} contextError={contextError}
    returnLabel={sourceCourse && (!contextError || returnTo !== '/lab') ? '返回来源课程' : '返回实验室'}
    returnToSource={returnToSource} returnToLab={() => navigate(scopedCourse ? '/courses/'+scopedCourse+'/lab' : '/explore')}
  />;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} loading={returning} disabled={contextPending} onClick={returnToSource}>{sourceCourse && (!contextError || returnTo !== '/lab') ? '返回来源课程' : '返回实验室'}</Button>
        <Title level={4} style={{ margin: 0 }}>🛩️ 滑翔机模拟实验室</Title>
      </Space>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message={isStudent ? '设定你的滑翔机参数，让物理引擎帮你试飞' : '滑翔机试飞记录（只读视图）'}
        description={isStudent
          ? '调整参数，后台运行现有气动仿真。独立实验不关联课程；试飞结果不会自动提交为作品或完成课时。'
          : user?.role === 'admin'
            ? '模拟提交仅面向学生。管理员可查看全部试飞记录与结果回放。'
            : user?.role === 'academic_mentor'
              ? '模拟提交仅面向学生。您可查看自己课程学生的试飞记录。'
              : '模拟提交仅面向学生。当前角色无试飞记录查看权限。'}
      />

      {isStudent && !engineChecking && blockedReason && (
        <Alert
          style={{ marginBottom: 16 }}
          type={engineError || contextError ? 'error' : 'warning'}
          showIcon
          message="暂时无法提交试飞"
          description={blockedReason}
        />
      )}

      {isStudent && engineReady && engineInfo && !contextError && (
        <Alert
          style={{ marginBottom: 16 }}
          type="success"
          showIcon
          message={`实验环境就绪：${engineInfo.detectedBackend === 'novaphy' ? '真 novaPhy 物理引擎' : (engineInfo.detectedBackend || '参考后端')}`}
          description="你可以调整参数并提交试飞，结果将保存到你的账号。"
        />
      )}

      <Row gutter={16}>
        {/* 左侧：参数表单 + 结果 */}
        <Col xs={24} lg={15}>
          {/* 模拟结果 */}
          {viewingId && (
            <Card
              title={`试飞 #${viewingId}`}
              style={{ marginBottom: 16 }}
              extra={viewing?.status === 'running' ? <Tag color="processing">模拟运行中…</Tag> : undefined}
            >
              {pollTimedOut ? (
                <Result status="warning" title="模拟疑似卡住"
                  subTitle="已等待超过 5 分钟仍未完成。请点击右侧“刷新记录”查看最新状态，或稍后重新提交。" />
              ) : pollFailed ? (
                <Result status="warning" title="暂时读不到模拟状态"
                  subTitle="后端可能仍在计算或已停止。请稍候点击右侧“刷新记录”，或直接刷新页面重试。" />
              ) : !viewing ? (
                <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                  <Spin size="large" />
                  <Text type="secondary">已提交，正在读取模拟状态…</Text>
                </Space>
              ) : viewing.status === 'running' ? (
                  <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                    <Spin size="large" />
                    <Text type="secondary">物理引擎正在计算飞行轨迹与结果图表（真 NovaPhy 通常约 1~2 分钟），已等待约 {waitSec} 秒…</Text>
                  </Space>
                ) : viewing.status === 'error' ? (
                  <Result status="error" title="本次试飞失败" subTitle={viewing.error || '模拟引擎异常'} />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      type={meta.color === 'red' ? 'error' : meta.color === 'orange' ? 'warning' : 'success'}
                      showIcon
                      message={<Text strong>结果：{meta.label}</Text>}
                      description={STATE_TIPS[viewing.state] || '模拟完成。'}
                    />
                    {resultFileError && <Alert type="warning" showIcon message={resultFileError} />}
                    <Row gutter={[8, 8]}>
                      <Col xs={12} sm={8}><Statistic title="滑翔时长" value={viewing.glide_time_s ?? '—'} suffix="s" /></Col>
                      <Col xs={12} sm={8}><Statistic title="水平距离" value={viewing.result?.distance_m ?? '—'} suffix="m" /></Col>
                      <Col xs={12} sm={8}><Statistic title="升阻比 L/D" value={viewing.result?.glide_ratio ?? '—'} /></Col>
                      <Col xs={12} sm={8}><Statistic title="平均下沉率" value={viewing.result?.mean_sink_mps ?? '—'} suffix="m/s" /></Col>
                      <Col xs={12} sm={8}><Statistic title="平均空速" value={viewing.result?.mean_speed_mps ?? '—'} suffix="m/s" /></Col>
                      <Col xs={12} sm={8}><Statistic title="落地高度" value={viewing.result?.alt_end ?? '—'} suffix="m" /></Col>
                    </Row>

                    {/* 历史记录回放（旧版后端生成的 MP4，仅早期记录有）。新试飞不再生成视频：
                        飞行回放将由前端基于逐帧轨迹数据渲染（three.js 接入中），
                        数据接口 GET /api/glider/simulations/:id/trace，指南见 simulation/glider/RENDER_API.md */}
                    {img.video && (
                      <Card size="small" title="✈️ 飞行过程回放（视频）" style={{ marginBottom: 16 }}>
                        <video
                          src={img.video}
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          onError={() => message.warning('视频加载失败：请刷新页面或重新打开本条记录')}
                          style={{ width: '100%', borderRadius: 6, background: '#000' }}
                        />
                        <Text type="secondary">3D 追逐视角回放：从投放到降落的完整飞行过程。</Text>
                      </Card>
                    )}

                    {img.trajectory ? (
                      <Card size="small" title="3D 飞行航迹（世界视角）">
                        <img src={img.trajectory} alt="3D 飞行航迹" style={{ width: '100%', borderRadius: 6 }} />
                      </Card>
                    ) : <Alert type="info" message="航迹图暂未加载，请刷新记录后重新打开。试飞结果以以上数据为准。" />}

                    {img.telemetry && (
                      <Card size="small" title="飞行遥测（高度 / 空速 / 迎角 / 下沉率 / L/D）">
                        <img src={img.telemetry} alt="飞行遥测" style={{ width: '100%', borderRadius: 6 }} />
                      </Card>
                    )}
                  </Space>
                )
              }
            </Card>
          )}
        </Col>

        {/* 右侧：试飞记录 */}
        <Col xs={24} lg={9}>
          <Card
            title={<Space><RocketOutlined /> {isStudent ? '我的试飞记录' : '试飞记录'}</Space>}
            extra={<Button size="small" onClick={loadHistory}>刷新记录</Button>}
          >
            {historyError && <Alert type="error" showIcon title={historyError} />}
            {loadingHistory ? <Spin /> : (
              history.length === 0 ? <Empty description={isStudent ? '还没有试飞记录，先设计一架试试吧' : '暂无试飞记录'} /> : (
                <List
                  size="small"
                  dataSource={history}
                  renderItem={(item) => {
                    const m = stateMeta(item.state);
                    return (
                      <List.Item
                        onClick={() => openRecord(item.id)}
                        style={{ cursor: 'pointer', borderRadius: 6 }}
                      >
                        <List.Item.Meta
                          title={<Space>
                            <span>#{item.id}</span>
                            <Tag color={item.status === 'running' ? 'processing' : item.status === 'error' ? 'error' : m.color}>
                              {item.status === 'running' ? '运行中' : item.status === 'error' ? '失败' : m.label}
                            </Tag>
                          </Space>}
                          description={
                            <Space wrap size={[4, 0]}>
                              <Text type="secondary">上反角 {item.dihedral_deg}°</Text>
                              <Text type="secondary">重心 {item.cg_x > 0 ? '+' : ''}{item.cg_x} m</Text>
                              <Text type="secondary">速度 {item.speed} m/s</Text>
                              {item.wing_area != null && item.wing_area !== 17.5 && (
                                <Text type="secondary">面积 {item.wing_area} m²</Text>
                              )}
                              {item.mass != null && item.mass !== 420 && (
                                <Text type="secondary">质量 {item.mass} kg</Text>
                              )}
                              {item.elevator_deg ? <Text type="secondary">平尾 {item.elevator_deg}°</Text> : null}
                              {item.rudder_deg ? <Text type="secondary">垂尾 {item.rudder_deg}°</Text> : null}
                              {item.glide_time_s != null && <Text type="secondary">· {item.glide_time_s}s</Text>}
                            </Space>
                          }
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>{formatBeijingTime(item.created_at)}</Text>
                      </List.Item>
                    );
                  }}
                />
              )
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
