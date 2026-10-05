import { useCourseApis } from '../../student/useCourseApis';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {useCourseNavigate as useNavigate} from '../../student/useCourseApis';

import { Alert, App, Form, Input, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../../store/AuthContext';
import useRemote from '../../student/useRemote';
import AsyncPageState from '../../components/common/AsyncPageState';
import PageContainer from '../../components/common/PageContainer';
import { PixelButton as Button, PixelTag } from '../../student/visual/PixelUI';
import { StudyHeader, StudySection } from '../../student/visual/StudyUI';
import PixelIcon from '../../student/visual/PixelIcon';
import { formatBeijingTime } from '../../utils/date';

function SubmissionForm({ data, parentId }) {
  const { workAPI } = useCourseApis();
  const { message } = App.useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('文字草稿自动保存到当前浏览器，按账号与任务隔离；附件不保存。');
  const key = `star-voyage:work:v1:${user.id}:${data.task.id}:${parentId || 'first'}`;
  const latest = data.works[0];
  const allowed = parentId ? latest && String(latest.id) === parentId && latest.review_status === 'rejected' : !latest;
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(key));
      form.setFieldsValue(draft || (parentId && latest ? { title: latest.title, description: latest.description } : {}));
    } catch {
      // 浏览器外部存储读取失败，需要向当前表单报告。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved('无法恢复本地草稿，请重新填写；原附件需要重新选择。');
    }
  }, [key, form, parentId, latest]);
  const save = (_, values) => {
    try { localStorage.setItem(key, JSON.stringify(values)); setSaved('文字草稿已保存到当前浏览器，仅当前账号可恢复；附件请在提交前选择。'); }
    catch { setSaved('草稿保存失败，请复制文字留存，再检查浏览器存储权限或空间。'); }
  };
  const submit = async (values) => {
    if (!values.description?.trim() && !file) { setError('请填写成果文字或选择附件，至少提供一项。'); return; }
    setLoading(true); setError('');
    try {
      const payload = new FormData();
      if (file) payload.append('file', file);
      payload.append('title', values.title.trim());
      payload.append('description', values.description || '');
      payload.append('task_id', data.task.id);
      payload.append('enrollment_id', data.task.enrollment_id);
      payload.append('parent_work_id', parentId || '');
      await workAPI.upload(payload);
      try { localStorage.removeItem(key); } catch { /* 已成功提交，不重复上传 */ }
      message.success('作品已提交，等待导师评审');
      navigate(`/courses/${data.task.course_id}/lessons/${data.task.lesson_id}/learn`);
    } catch (err) { setError(err.response?.data?.error || '提交或附件上传失败，文字和已选附件仍保留在本页面，请检查网络后重试。'); }
    finally { setLoading(false); }
  };
  return <div className="study-submit-layout"><StudySection number="W" title={parentId ? '修改你的作品' : '记录你的成果'} description="给作品起一个名字，用文字或附件展示你的探索。">
    {!allowed ? <Alert type="warning" title="当前作品不能提交新版本" description="只有最新版本被导师退回后才可重新提交。请返回课时查看评审状态。" /> : <Form form={form} layout="vertical" onFinish={submit} onValuesChange={save} disabled={loading} scrollToFirstError={{ block: 'center', focus: true }}>
      {latest?.reject_reason && <Alert type="warning" title="修改意见" description={latest.reject_reason} />}
      <Alert type={saved.includes('失败') ? 'error' : 'info'} title={saved} style={{ marginBottom: 16 }} />
      <Form.Item name="title" label="作品名称" rules={[{ required: true, whitespace: true, message: '请输入作品名称' }]}><Input /></Form.Item>
      <Form.Item name="description" label="成果文字" extra="说明你做了什么、依据是什么，以及改进的过程。"><Input.TextArea rows={6} /></Form.Item>
      <section className="study-subsection"><h4>附件与提交</h4>
        <Form.Item label="附件（与文字至少提供一项）" extra="一次提交 1 个文件，最大 100 MB。附件不会保存在浏览器草稿中。"><Upload beforeUpload={(value) => { setFile(value); return false; }} maxCount={1} onRemove={() => setFile(null)}><Button icon={<UploadOutlined />}>选择附件</Button></Upload></Form.Item>
        <p className="study-help">支持 JPG、JPEG、PNG、GIF、WebP、MP4、WebM、PDF、DOC、DOCX、PPT、PPTX、ZIP、OBJ、GLB、GLTF、STL；文件类型、内容和大小由服务器检查。</p>
      </section>
      <div className="study-submit-result" aria-live="polite">{error && <Alert type="error" showIcon title="未能提交" description={error} />}</div>
      <div className="study-actions"><Button type="primary" htmlType="submit" loading={loading}>提交作品</Button><p>提交后等待导师评审；学习报告需在课时中单独提交。</p></div>
    </Form>}
  </StudySection><aside className="study-context" aria-label="作品任务信息"><h3>这次要完成的任务</h3><PixelTag tone={parentId ? 'warning' : 'current'}>{parentId ? '退回修改 · 新版本' : '首次提交'}</PixelTag><dl><dt>所属课程</dt><dd>{data.task.course_title}</dd><dt>作品任务</dt><dd>{data.task.title}</dd><dt>任务说明</dt><dd className="study-prose">{data.task.description || '老师尚未填写任务说明。'}</dd><dt>截止时间</dt><dd>{data.task.deadline ? formatBeijingTime(data.task.deadline) : '未设置'}</dd>{latest && <><dt>当前已有版本</dt><dd>第 {latest.version} 版</dd></>}</dl><p>是否接受提交以服务器校验为准。</p></aside></div>;
}

export default function WorkUpload() {
  const { taskAPI } = useCourseApis();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const taskId = params.get('task_id');
  const parentId = params.get('parent_work_id');
  const fetcher = useCallback(() => taskId ? taskAPI.detail(taskId) : Promise.reject(new Error('请从课时中的任务入口提交作品。')), [taskId,taskAPI]);
  const { data, loading, error, retry } = useRemote(fetcher);
  return <PageContainer><div className="study-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="archive" />作品提交</>} title="提交作品" description={parentId ? '根据导师意见改进，保留每一次探索的版本。' : '把你的观察、方案和验证过程整理成作品。'}><Button icon={<PixelIcon name="back" />} onClick={() => navigate(data ? `/courses/${data.task.course_id}/lessons/${data.task.lesson_id}/learn` : '/tasks')}>返回课时或任务</Button></StudyHeader>
    <AsyncPageState loading={loading} error={error === 'Network Error' ? '网络连接失败，请检查连接后重新加载。' : error} onRetry={retry}>{data && <SubmissionForm key={`${taskId}:${parentId}`} data={data} parentId={parentId} />}</AsyncPageState>
  </div></PageContainer>;
}
