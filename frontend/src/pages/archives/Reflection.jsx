import { useCourseApis } from '../../student/useCourseApis';
import { useEffect, useRef, useState } from 'react';
import {useCourseNavigate as useNavigate} from '../../student/useCourseApis';

import { Alert, Form, Input, Select, Result } from 'antd';
import { STUDENT_COURSES_CHANGED } from '../../student/accessPolicy';
import { loadArchiveScope } from '../../student/archiveModel';
import PageContainer from '../../components/common/PageContainer';
import { StudyHeader, StudySection } from '../../student/visual/StudyUI';
import { PixelButton } from '../../student/visual/PixelUI';
import PixelIcon from '../../student/visual/PixelIcon';
import '../../student/visual/pixel-archive.css';

const errorText = (error) => error.response?.data?.error || '网络连接失败，请重试；本页文字仍然保留。';
export default function Reflection() {
  const { archiveAPI, courseAPI } = useCourseApis();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [scope, setScope] = useState({ loading: true, enrollments: [], error: '' });
  const [lessons, setLessons] = useState({ loading: false, rows: [], error: '' });
  const [notice, setNotice] = useState('');
  const [submitError, setSubmitError] = useState('');
  const sequence = useRef(0);
  const scopeSequence = useRef(0);
  const alive = useRef(false);
  const scopeRef = useRef([]);
  const refreshRef = useRef(null);
  const invalidate = () => {
    sequence.current += 1;
    form.setFieldsValue({ enrollment_id: undefined, lesson_id: undefined });
    setLessons({ loading: false, rows: [], error: '' });
    setNotice('所选课程已不可访问，已清除课程与课时关联。反思文字仍保留，请重新选择课程。');
  };
  const refreshScope = async () => {
    const request = ++scopeSequence.current;
    setScope((current) => ({ ...current, loading: true, error: '' }));
    try {
      const next = await loadArchiveScope({ courses: courseAPI.list, enrollments: archiveAPI.getReflections });
      if (!alive.current || request !== scopeSequence.current) return null;
      const selected = form.getFieldValue('enrollment_id');
      if (selected && !next.enrollments.some((row) => String(row.enrollment_id) === String(selected))) invalidate();
      scopeRef.current = next.enrollments;
      setScope({ loading: false, enrollments: next.enrollments, error: '' });
      if (!form.getFieldValue('enrollment_id') && next.enrollments.length===1) {
        form.setFieldValue('enrollment_id',next.enrollments[0].enrollment_id);
        void selectCourse(next.enrollments[0].enrollment_id);
      }
      return next;
    } catch (error) {
      if (alive.current && request === scopeSequence.current) setScope((current) => ({ ...current, loading: false, error: errorText(error) }));
      return null;
    }
  };
  useEffect(() => { refreshRef.current = refreshScope; });
  useEffect(() => {
    alive.current = true;
    refreshRef.current();
    const update = ({ detail }) => {
      const allowed = new Set(detail.courses.map((course) => String(course.id)));
      const selected = scopeRef.current.find((row) => row.enrollment_id === form.getFieldValue('enrollment_id'));
      if (selected && !allowed.has(String(selected.course_id))) {
        sequence.current += 1;
        form.setFieldsValue({ enrollment_id: undefined, lesson_id: undefined });
        setLessons({ loading: false, rows: [], error: '' });
        setNotice('所选课程已不可访问，已清除课程与课时关联。反思文字仍保留，请重新选择课程。');
      }
      scopeRef.current = scopeRef.current.filter((row) => allowed.has(String(row.course_id)));
      setScope((current) => ({ ...current, enrollments: scopeRef.current }));
      refreshRef.current();
    };
    window.addEventListener(STUDENT_COURSES_CHANGED, update);
    return () => { alive.current = false; scopeSequence.current += 1; sequence.current += 1; window.removeEventListener(STUDENT_COURSES_CHANGED, update); };
  }, [form]);
  const selectCourse = async (enrollmentId) => {
    const request = ++sequence.current;
    form.setFieldValue('lesson_id', undefined);
    setNotice(''); setSubmitError('');
    const enrollment = scopeRef.current.find((row) => row.enrollment_id === enrollmentId);
    setLessons({ loading: Boolean(enrollment), rows: [], error: '' });
    if (!enrollment) return;
    try {
      const result = await courseAPI.detail(enrollment.course_id);
      if (alive.current && request === sequence.current) setLessons({ loading: false, rows: result.lessons || [], error: '' });
    } catch (error) {
      if (alive.current && request === sequence.current) {
        setLessons({ loading: false, rows: [], error: errorText(error) });
        if ([403, 404].includes(error.response?.status)) await refreshScope();
      }
    }
  };
  const submit = async (values) => {
    setSubmitting(true); setSubmitError('');
    try {
      // 原反思提交只校验有效报名，展示端先核验发布状态，失败不发送提交。
      const confirmed = await refreshScope();
      if (!confirmed) throw new Error('暂时无法核验课程，请重试。反思尚未提交，文字仍保留。');
      const enrollment = confirmed.enrollments.find((row) => String(row.enrollment_id) === String(values.enrollment_id));
      if (!enrollment) throw new Error('课程关联已失效，请重新选择后提交。');
      if (String(form.getFieldValue('enrollment_id')) !== String(values.enrollment_id)) throw new Error('课程选择发生变化，请核对后再次提交。');
      await archiveAPI.submitReflection(values);
      if (alive.current) setDone(true);
    } catch (error) {
      if (alive.current) setSubmitError(error.response?.data?.error || error.message || errorText(error));
      if (error.response?.data?.error?.includes('报名记录')) await refreshScope();
    } finally { if (alive.current) setSubmitting(false); }
  };
  return <PageContainer><div className="study-workspace archive-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="book" /> REFLECTION / 反思日志</>} title="把这次学习，留给下一次自己" description="记下困难、尝试与发现，为下一步留下线索。"><PixelButton icon={<PixelIcon name="back" />} onClick={() => navigate('/archives')}>返回成长档案</PixelButton></StudyHeader>
    {done ? <StudySection number="✓" title="反思已提交"><Result status="success" title="反思日志提交成功" subTitle="已保存到你的服务端成长记录，可以返回档案查看。" extra={<PixelButton type="primary" onClick={() => navigate('/archives')}>查看成长档案</PixelButton>} /></StudySection> : <div className="archive-reflection-layout">
      <StudySection number="R" title="今天的反思" description="课程必选，课时可选；请用自己的话记录。">
        {notice && <Alert type="warning" showIcon title={notice} />}
        {scope.error && <Alert type="warning" showIcon title="课程范围暂未确认" description={scope.error} action={<PixelButton onClick={refreshScope}>重试课程</PixelButton>} />}
        {!scope.loading && !scope.error && !scope.enrollments.length && <Alert type="info" title="暂无可进入的课程" description="请联系老师确认课程安排。已填写文字保留在当前页面。" />}
        <Form form={form} layout="vertical" onFinish={submit} disabled={submitting} onFinishFailed={({ errorFields }) => { if (errorFields[0]) form.scrollToField(errorFields[0].name, { focus: true, block: 'center' }); }}>
          <Form.Item name="enrollment_id" label="本次课程" rules={[{ required: true, message: '请选择课程' }]}><Select placeholder="选择课程" loading={scope.loading} disabled={submitting || scope.loading || Boolean(scope.error)} onChange={selectCourse} options={scope.enrollments.map((row) => ({ value: row.enrollment_id, label: `${row.course_title} · #${row.course_id}` }))} /></Form.Item>
          <Form.Item name="lesson_id" label="本次课时（可选）"><Select allowClear placeholder="选择课时（可选）" loading={lessons.loading} disabled={submitting || lessons.loading || Boolean(lessons.error)} options={lessons.rows.map((lesson) => ({ value: lesson.id, label: lesson.title }))} /></Form.Item>
          {lessons.error && <Alert type="warning" showIcon title="课时读取失败" description={lessons.error} action={<PixelButton onClick={() => selectCourse(form.getFieldValue('enrollment_id'))}>重试课时</PixelButton>} />}
          {[['difficulty', '遇到的困难', '今天学习中最难理解或完成的部分'], ['solution', '解决方式', '你尝试了什么，哪些方法有用'], ['improvement', '改进收获', '这次有什么收获，下次准备怎样调整'], ['new_question', '新问题', '还想继续探究的问题']].map(([name, label, placeholder]) => <Form.Item key={name} name={name} label={label} rules={name === 'difficulty' ? [{ required: true, whitespace: true, message: '请填写遇到的困难' }] : []}><Input.TextArea rows={3} placeholder={placeholder} /></Form.Item>)}
          <div className="study-submit-result" aria-live="polite">{submitError && <Alert type="error" showIcon title="反思未能提交" description={submitError} />}</div>
          <div className="study-actions"><PixelButton aria-label="提交反思日志" type="primary" htmlType="submit" loading={submitting} disabled={scope.loading || Boolean(scope.error) || !scope.enrollments.length}>提交反思日志</PixelButton><p>当前文字仅在本页保留，离开或刷新页面会丢失。提交成功后才保存到服务端。</p></div>
        </Form>
      </StudySection>
      <aside className="study-context"><h3>给自己一点思考时间</h3><p>困难可以很具体：哪个现象和预期不同？哪一步还没有找到证据？</p><p>反思不需要标准答案，记录你的实际尝试和下一步计划。</p><h3>提交说明</h3><p>独立反思日志每天可提交一次，以北京时间为准。当天学习报告中提交的反思也可能占用这次额度；是否可提交由服务器判断。</p><p>课程报告仍从课时学习页面提交。这里不会代替或完成报告任务。</p></aside>
    </div>}
  </div></PageContainer>;
}
