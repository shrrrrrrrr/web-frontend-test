import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Descriptions, Form, Input, Select, Space } from 'antd';
import { feedbackAPI } from '../../api';
import FeedbackMessageForm from '../../components/feedback/FeedbackMessageForm';
import FeedbackPriorityTag from '../../components/feedback/FeedbackPriorityTag';
import FeedbackStatusTag from '../../components/feedback/FeedbackStatusTag';
import FeedbackTimeline from '../../components/feedback/FeedbackTimeline';
import { feedbackModules, feedbackPriorityOptions, feedbackStatuses, feedbackStatusTransitions, feedbackTypes } from '../../constants/feedback';
import { useAuth } from '../../store/AuthContext';
import { formatBeijingTime } from '../../utils/date';
import { studentFeedbackModules } from '../../utils/feedbackFiles';
import { requestError } from '../../utils/requestError';
import useRemoteResource from '../../hooks/useRemoteResource';
import { ServicePage, ServicePanel, ReadState, ServiceModal, OperationNotice } from '../../components/ServiceUI';

function Attachment({ file }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const isCurrent = () => alive.current;
  const pending = useRef(false);
  const download = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const blob = await feedbackAPI.downloadAttachment(file.id);
      if (!isCurrent()) return;
      const url = URL.createObjectURL(blob);
      try { const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.original_name; anchor.click(); }
      finally { URL.revokeObjectURL(url); }
    } catch (err) { if (isCurrent()) setError(requestError(err, { action: '下载附件' })); }
    finally { if (isCurrent()) { pending.current = false; setBusy(false); } }
  };
  return <li><div><strong>{file.original_name}</strong><small>{Math.ceil(file.file_size / 1024)} KiB</small>
    {error && <Alert role="alert" type="error" title={error} />}</div><Button loading={busy} onClick={download}>{error ? '重试下载' : '下载附件'}</Button></li>;
}
function Detail({ id }) {
  const { user } = useAuth(), navigate = useNavigate(), location = useLocation();
  const read = useCallback(async () => (await feedbackAPI.detail(id)).data, [id]);
  const resource = useRemoteResource(read);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(location.state?.submitted ? { type: 'success', text: '反馈已提交。可在本页查看编号和处理进展。' } : null);
  const [reopen, setReopen] = useState(false), [resolve, setResolve] = useState(false);
  const [reopenForm] = Form.useForm(), [resolveForm] = Form.useForm();
  const pending = useRef(false);
  const reread = async () => { const ok = await resource.reload(); if (ok && resource.isCurrent()) setNotice(null); };
  const run = async (action, success, acknowledged) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setNotice(null);
    try {
      await action();
      if (!resource.isCurrent()) return;
      acknowledged?.(); // Clear an acknowledged reply before the independent GET.
      const ok = await resource.reload();
      if (resource.isCurrent()) setNotice({ type: ok ? 'success' : 'warning', text: ok ? success : `${success}。已完成操作，显示暂未刷新；请重新读取，不要重复提交。`, retry: !ok });
    } catch (error) {
      if (resource.isCurrent()) {
        setNotice({ type: 'error', text: requestError(error, { action: '提交', write: true }) });
        if ([403, 404].includes(error.response?.status)) void resource.reload();
      }
    } finally { if (resource.isCurrent()) { pending.current = false; setBusy(false); } }
  };
  const feedback = resource.data?.feedback, admin = user.role === 'admin';
  const owner = feedback?.user_id === user.id;
  const canReply = admin || (owner && !['closed', 'rejected'].includes(feedback?.status));
  const canReopen = owner && ['resolved', 'closed', 'rejected'].includes(feedback?.status);
  const modules = user.role === 'student' ? studentFeedbackModules : feedbackModules;
  return <ServicePage title="反馈详情" eyebrow="帮助 / FOLLOW UP" actions={<Button onClick={() => navigate(admin ? '/feedback/manage' : '/feedback')}>返回反馈列表</Button>}>
    <OperationNotice value={notice?.type !== 'error' || !feedback ? notice : null} onRetry={reread} />
    <ReadState {...resource} object="反馈">
      {feedback && <>
        <ServicePanel><article className="service-article">
          <div className="service-metadata"><span className="feedback-number">{feedback.feedback_no}</span><FeedbackStatusTag status={feedback.status} /><span>{feedbackTypes[feedback.type] || feedback.type}</span></div>
          <h1>{feedback.title}</h1>
          <Descriptions size="small" column={{ xs: 1, md: 2 }} items={[
            { key: 'module', label: '关联模块', children: modules[feedback.module] || '未指定' },
            { key: 'time', label: '提交时间', children: formatBeijingTime(feedback.created_at) },
            ...(admin ? [{ key: 'priority', label: '优先级', children: <FeedbackPriorityTag priority={feedback.priority} /> }] : []),
          ]} />
          <h2>问题描述</h2><div className="service-prose">{feedback.description}</div>
          {feedback.resolution && <div className="feedback-resolution"><h2>处理结果</h2><div className="service-prose">{feedback.resolution}</div></div>}
        </article></ServicePanel>
        {resource.data.attachments.length > 0 && <ServicePanel><h2>提交的附件</h2><ul className="feedback-attachments">{resource.data.attachments.map((file) => <Attachment key={file.id} file={file} />)}</ul></ServicePanel>}
        <ServicePanel><h2>处理记录</h2><div className="feedback-timeline"><FeedbackTimeline messages={resource.data.messages} /></div></ServicePanel>
        <ServicePanel><h2>继续沟通</h2><OperationNotice value={notice?.type === 'error' && !reopen && !resolve ? notice : null} />
          {canReply ? <FeedbackMessageForm loading={busy} onSubmit={(content, ack) => run(() => feedbackAPI.reply(id, content), '回复已发送', ack)} /> : <p>该反馈已结束。如仍有问题，可以申请重新处理。</p>}
          <Space wrap className="service-actions">
            {owner && feedback.status === 'resolved' && <Button type="primary" disabled={busy} onClick={() => run(() => feedbackAPI.confirm(id), '已确认解决')}>确认已解决</Button>}
            {canReopen && <Button disabled={busy} onClick={() => setReopen(true)}>申请重新处理</Button>}
          </Space>
        </ServicePanel>
        {admin && <ServicePanel><h2>管理员处理</h2><Space wrap>
          <span>优先级：</span><Select aria-label="优先级" disabled={busy} value={feedback.priority} options={feedbackPriorityOptions} style={{ width: 120 }}
            onChange={(priority) => run(() => feedbackAPI.updatePriority(id, priority), '优先级已更新')} />
          <span>变更状态：</span><Select aria-label="变更状态" disabled={busy} placeholder="选择下一状态" style={{ width: 160 }}
            options={(feedbackStatusTransitions[feedback.status] || []).map((value) => ({ value, label: feedbackStatuses[value]?.label || value }))}
            onChange={(status) => run(() => feedbackAPI.updateStatus(id, status), '状态已更新')} />
          {!['closed', 'rejected'].includes(feedback.status) && <Button disabled={busy} onClick={() => setResolve(true)}>填写处理结果</Button>}
        </Space><FeedbackMessageForm internal loading={busy} onSubmit={(content, ack) => run(() => feedbackAPI.addInternalNote(id, content), '内部备注已保存', ack)} /></ServicePanel>}
      </>}
    </ReadState>
    <ServiceModal title="申请重新处理" open={reopen} onCancel={() => !busy && setReopen(false)} okText="提交原因" cancelText="取消" confirmLoading={busy} onOk={() => reopenForm.submit()}>
      <p>说明问题为什么还未解决，管理员会看到你的补充。</p><OperationNotice value={notice} />
      <Form form={reopenForm} layout="vertical" onFinish={({ reason }) => run(() => feedbackAPI.reopen(id, reason.trim()), '反馈已重新打开', () => { setReopen(false); reopenForm.resetFields(); })}>
        <Form.Item name="reason" label="重新处理的原因" rules={[{ required: true, whitespace: true, message: '请说明原因' }, { max: 2000, message: '原因不能超过 2000 字' }]}><Input.TextArea rows={5} maxLength={2000} showCount /></Form.Item>
      </Form>
    </ServiceModal>
    {admin && <ServiceModal title="填写处理结果" open={resolve} onCancel={() => !busy && setResolve(false)} okText="提交处理结果" cancelText="取消" confirmLoading={busy} onOk={() => resolveForm.submit()}>
      <OperationNotice value={notice} /><Form form={resolveForm} layout="vertical" onFinish={({ resolution }) => run(() => feedbackAPI.resolve(id, resolution.trim()), '反馈已标记为已处理', () => { setResolve(false); resolveForm.resetFields(); })}>
        <Form.Item name="resolution" label="处理结果" rules={[{ required: true, whitespace: true, message: '请填写处理结果' }, { max: 5000 }]}><Input.TextArea rows={5} maxLength={5000} showCount /></Form.Item>
      </Form>
    </ServiceModal>}
  </ServicePage>;
}
export default function FeedbackDetail() {
  const { id } = useParams(), { user } = useAuth();
  return <Detail key={`${user.id}:${id}`} id={id} />;
}
