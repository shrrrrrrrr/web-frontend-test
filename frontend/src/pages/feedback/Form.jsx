import Alert from '../../content/RoleAlert';
import RoleSentence from '../../content/RoleSentence';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Select, Switch } from 'antd';
import { feedbackAPI } from '../../api';
import { feedbackModuleOptions, feedbackTypeOptions } from '../../constants/feedback';
import { useAuth } from '../../store/AuthContext';
import { feedbackFileError, studentFeedbackModules } from '../../utils/feedbackFiles';
import { requestError } from '../../utils/requestError';
import { ServicePage, ServicePanel } from '../../components/ServiceUI';

function CreateForm({ user }) {
  const navigate = useNavigate(), location = useLocation();
  const [busy, setBusy] = useState(false), [files, setFiles] = useState([]);
  const [error, setError] = useState(''), [fileError, setFileError] = useState('');
  const pending = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const selectFiles = (event) => {
    const next = [...files], errors = [];
    for (const file of event.target.files) {
      const problem = feedbackFileError(file, next.length);
      if (problem) errors.push(`${file.name}：${problem}`); else next.push(file);
    }
    setFiles(next); setFileError(errors.join('\n')); event.target.value = '';
  };
  const submit = async (values) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const data = new FormData();
      Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null) data.append(key, typeof value === 'string' ? value.trim() : value); });
      data.set('source_path', location.state?.from || '/feedback/new');
      data.set('client_info', navigator.userAgent);
      files.forEach((file) => data.append('attachments', file));
      const response = await feedbackAPI.create(data);
      if (alive.current) navigate(`/feedback/${response.data.feedback.id}`, { state: { submitted: true } });
    } catch (err) { if (alive.current) setError(requestError(err, { action: '提交反馈', write: true })); }
    finally { if (alive.current) { pending.current = false; setBusy(false); } }
  };
  const moduleOptions = user.role === 'student' ? Object.entries(studentFeedbackModules).map(([value, label]) => ({ value, label })) : feedbackModuleOptions;
  return <ServicePage title="提交反馈" eyebrow="帮助 / NEW FEEDBACK" description="遇到问题或有新建议，都可以告诉管理员。" actions={<Button onClick={() => navigate('/feedback')}>返回我的反馈</Button>}>
    <ServicePanel className="feedback-form-panel">
      <RoleSentence className="service-note">说清楚你的操作、实际情况和期望结果，能帮助管理员更快理解问题。提交后可在“我的反馈”查看进展。</RoleSentence>
      <Form layout="vertical" initialValues={{ allow_contact: true, contact: user.email || user.phone || '' }} onFinish={submit}>
        <div className="service-form-pair">
          <Form.Item name="type" label="反馈类型" rules={[{ required: true, message: '请选择反馈类型' }]}><Select aria-label="反馈类型" options={feedbackTypeOptions} placeholder="请选择反馈类型" /></Form.Item>
          <Form.Item name="module" label="关联模块（选填）"><Select aria-label="关联模块" allowClear options={moduleOptions} placeholder="选择问题出现的位置" /></Form.Item>
        </div>
        <Form.Item name="title" label="反馈标题" extra="5–100 字，用一句话概括问题或建议。" rules={[{ required: true, whitespace: true, message: '请输入反馈标题' }, { transform: (value) => value?.trim(), min: 5, max: 100, message: '标题长度为 5 到 100 字' }]}><Input maxLength={100} showCount placeholder="例如：知识卡片中的图片无法打开" /></Form.Item>
        <Form.Item name="description" label="详细描述" extra="10–5000 字，请勿填写密码等敏感信息。" rules={[{ required: true, whitespace: true, message: '请输入详细描述' }, { transform: (value) => value?.trim(), min: 10, max: 5000, message: '描述长度为 10 到 5000 字' }]}>
          <Input.TextArea rows={6} maxLength={5000} showCount placeholder={'1. 进行了什么操作\n2. 实际出现什么情况\n3. 希望得到怎样的帮助'} />
        </Form.Item>
        <div className="feedback-file-picker">
          <label htmlFor="feedback-files">附件（选填）</label><RoleSentence id="feedback-files-help">最多 3 个，每个不超过 10 MiB。支持 PNG、JPG/JPEG、WEBP、PDF。</RoleSentence>
          <input id="feedback-files" aria-describedby="feedback-files-help" type="file" multiple accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={selectFiles} disabled={busy} />
          {fileError && <Alert type="error" role="alert" title={fileError} />}
          {files.length > 0 && <ul>{files.map((file, index) => <li key={`${file.name}:${index}`}><span><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(1)} KiB · 待随反馈提交</small></span><Button disabled={busy} aria-label={`移除 ${file.name}`} onClick={() => setFiles((value) => value.filter((_, i) => i !== index))}>移除</Button></li>)}</ul>}
        </div>
        <Form.Item name="contact" label="联系方式（选填）" rules={[{ max: 200, message: '联系方式不能超过 200 字' }]}><Input autoComplete="off" maxLength={200} placeholder="可填写邮箱或手机号" /></Form.Item>
        <Form.Item name="allow_contact" label="允许管理员进一步联系" valuePropName="checked"><Switch /></Form.Item>
        {error && <Alert role="alert" type="error" showIcon title={error} />}
        <div className="service-submit"><Button type="primary" htmlType="submit" loading={busy} aria-label="提交反馈">提交反馈</Button><span>文字与附件仅保留在本页，尚未提交到服务器；刷新会丢失。</span></div>
      </Form>
    </ServicePanel>
  </ServicePage>;
}
export default function FeedbackForm() {
  const { user } = useAuth();
  return <CreateForm key={user.id} user={user} />;
}
