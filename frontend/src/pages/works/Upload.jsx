import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Card, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { workAPI, taskAPI } from '../../api';
import { useAuth } from '../../store/AuthContext';
import useRemote from '../../student/useRemote';
import AsyncPageState from '../../components/common/AsyncPageState';
import PageContainer from '../../components/common/PageContainer';

function SubmissionForm({ data, parentId }) {
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
  return <Card title={`${data.task.course_title} · ${data.task.title}`}>
    <p>{data.task.description}</p><p>截止：{data.task.deadline || '未设置'}。是否接受提交以服务器返回结果为准。</p>
    {!allowed ? <Alert type="warning" title="当前作品不能提交新版本" description="只有最新版本被导师退回后才可重新提交。请返回课时查看评审状态。" /> : <Form form={form} layout="vertical" onFinish={submit} onValuesChange={save} disabled={loading}>
      {latest?.reject_reason && <Alert type="warning" title="修改意见" description={latest.reject_reason} />}
      <Alert type={saved.includes('失败') ? 'error' : 'info'} title={saved} style={{ marginBottom: 16 }} />
      {error && <Alert type="error" showIcon title="未能提交" description={error} style={{ marginBottom: 16 }} />}
      <Form.Item name="title" label="作品名称" rules={[{ required: true, whitespace: true, message: '请输入作品名称' }]}><Input /></Form.Item>
      <Form.Item name="description" label="成果文字"><Input.TextArea rows={5} /></Form.Item>
      <Form.Item label="附件（与文字至少提供一项）"><Upload beforeUpload={(value) => { setFile(value); return false; }} maxCount={1} onRemove={() => setFile(null)}><Button icon={<UploadOutlined />}>选择附件</Button></Upload></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>提交作品</Button>
    </Form>}
  </Card>;
}

export default function WorkUpload() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const taskId = params.get('task_id');
  const parentId = params.get('parent_work_id');
  const fetcher = useCallback(() => taskId ? taskAPI.detail(taskId) : Promise.reject(new Error('请从课时中的任务入口提交作品。')), [taskId]);
  const { data, loading, error, retry } = useRemote(fetcher);
  return <PageContainer title="提交作品" extra={<Button onClick={() => navigate(data ? `/courses/${data.task.course_id}/lessons/${data.task.lesson_id}/learn` : '/tasks')}>返回课时或任务</Button>}>
    <AsyncPageState loading={loading} error={error} onRetry={retry}>{data && <SubmissionForm key={`${taskId}:${parentId}`} data={data} parentId={parentId} />}</AsyncPageState>
  </PageContainer>;
}
