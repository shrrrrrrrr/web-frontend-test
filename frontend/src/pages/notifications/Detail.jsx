import { useCallback, useRef, useState } from 'react';
import { Button, Space, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { notificationAPI } from '../../api';
import { notificationCategories } from '../../constants/notification';
import NotificationLevelTag from '../../components/notifications/NotificationLevelTag';
import useNotifications from '../../hooks/useNotifications';
import useRemoteResource from '../../hooks/useRemoteResource';
import { useAuth } from '../../store/AuthContext';
import { canRoleAccessPath } from '../../utils/roleNavigation';
import { formatBeijingTime } from '../../utils/date';
import { requestError } from '../../utils/requestError';
import { ServicePage, ServicePanel, ReadState, OperationNotice } from '../../components/ServiceUI';

function Detail({ id }) {
  const { user } = useAuth();
  const navigate = useNavigate(), { refreshUnread } = useNotifications();
  const read = useCallback(async () => {
    const data = (await notificationAPI.detail(id)).data.notification;
    void refreshUnread().catch(() => {});
    return data;
  }, [id, refreshUnread]);
  const resource = useRemoteResource(read);
  const [notice, setNotice] = useState(null), [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const refreshCount = async () => {
    try { await refreshUnread(); if (resource.isCurrent()) setNotice(null); }
    catch { if (resource.isCurrent()) setNotice({ type: 'warning', text: '已完成操作，未读数显示暂未刷新。', retry: true }); }
  };
  const run = async (hide = false) => {
    if (pending.current || !resource.data) return;
    pending.current = true; setBusy(true); setNotice(null);
    const nextRead = !resource.data.is_read;
    try {
      await (hide ? notificationAPI.hide(id) : nextRead ? notificationAPI.markRead(id) : notificationAPI.markUnread(id));
      if (!resource.isCurrent()) return;
      if (hide) {
        let ok = true;
        try { await refreshUnread(); } catch { ok = false; }
        if (resource.isCurrent()) navigate('/notifications', { state: { notice: { type: ok ? 'success' : 'warning', text: ok ? '通知已隐藏。' : '通知已隐藏。已完成操作，未读数显示暂未刷新。', retry: !ok } } });
      } else {
        // GET detail marks read. Never re-read it after marking unread.
        resource.update((data) => ({ ...data, is_read: nextRead ? 1 : 0 }));
        await refreshCount();
      }
    } catch (err) {
      if (resource.isCurrent()) {
        if ([403, 404].includes(err.response?.status)) void resource.reload();
        setNotice({ type: 'error', text: requestError(err, { action: '通知操作', write: true }) });
      }
    } finally { if (resource.isCurrent()) { pending.current = false; setBusy(false); } }
  };
  const item = resource.data;
  return <ServicePage title="通知详情" eyebrow="消息 / READING" actions={<Button onClick={() => navigate('/notifications')}>返回通知列表</Button>}>
    <ServicePanel><OperationNotice value={notice} onRetry={refreshCount} /><ReadState {...resource} object="通知">
      {item && <article className="service-article">
        <div className="service-metadata"><Tag>{notificationCategories[item.category]?.label || item.category}</Tag><NotificationLevelTag level={item.level} /><span>{item.is_read ? '已读' : '未读'}</span><time>{formatBeijingTime(item.published_at || item.received_at)}</time></div>
        <h1>{item.title}</h1><div className="service-prose">{item.content}</div>
        <Space wrap className="service-actions">
          {canRoleAccessPath(user.role, item.action_url) && <Button type="primary" onClick={() => navigate(item.action_url)}>查看相关内容</Button>}
          <Button disabled={busy} onClick={() => run()}>标记为{item.is_read ? '未读' : '已读'}</Button>
          <Button disabled={busy} onClick={() => run(true)}>隐藏通知</Button>
        </Space>
      </article>}
    </ReadState></ServicePanel>
  </ServicePage>;
}
export default function NotificationDetail() {
  const { id } = useParams(), { user } = useAuth();
  return <Detail key={`${user.id}:${id}`} id={id} />;
}
