import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Popover } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../api';
import useNotifications from '../../hooks/useNotifications';
import useRemoteResource from '../../hooks/useRemoteResource';
import NotificationItem from './NotificationItem';
import { useAuth } from '../../store/AuthContext';
import { canRoleAccessPath } from '../../utils/roleNavigation';
import { requestError } from '../../utils/requestError';
import { ReadState } from '../ServiceUI';

function Recent({ close }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshUnread, reduceUnread, countError } = useNotifications();
  const read = useCallback(async () => (await notificationAPI.recent(8)).data.items, []);
  const resource = useRemoteResource(read);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef(false);
  const handleClick = async (item) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      if (!item.is_read) { await notificationAPI.markRead(item.id); if (!resource.isCurrent()) return; reduceUnread(); }
      if (!resource.isCurrent()) return;
      void refreshUnread().catch(() => {});
      close();
      navigate(canRoleAccessPath(user.role, item.action_url) ? item.action_url : `/notifications/${item.id}`);
    } catch (err) { if (resource.isCurrent()) setError(requestError(err, { action: '打开通知', write: true })); }
    finally { if (resource.isCurrent()) { pending.current = false; setBusy(false); } }
  };
  return <div className="notification-popover" role="region" aria-label="最近通知">
    <header><strong>最近通知</strong><Button type="link" onClick={() => { close(); navigate('/notifications'); }}>查看全部</Button><Button type="text" onClick={close} aria-label="关闭最近通知">×</Button></header>
    {countError && <Alert type="warning" title="未读数暂未读取" action={<Button aria-label="重试" onClick={() => refreshUnread().catch(() => {})}>重试</Button>} />}
    {error && <Alert type="error" role="alert" title={error} />}
    <div className="notification-popover-list"><ReadState {...resource} object="通知" empty={!resource.data?.length} emptyText="暂时没有通知">
      {resource.data?.map((item) => <NotificationItem key={item.id} notification={item} compact disabled={busy} onClick={handleClick} />)}
    </ReadState></div><footer>显示最近 8 条通知</footer>
  </div>;
}
export default function NotificationBell({ icon, buttonClassName }) {
  const { user } = useAuth();
  const { unreadCount, countError } = useNotifications();
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const close = useCallback(() => { setOpen(false); trigger.current?.focus(); }, []);
  useEffect(() => {
    const escape = (event) => { if (event.key === 'Escape') close(); };
    if (open) window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open, close]);
  if (!user || user.force_reset_password) return null;
  return <Popover fresh destroyOnHidden trigger="click" placement="bottomRight" open={open} onOpenChange={setOpen}
    rootClassName={user.role === 'student' ? 'student-pixel service-popover' : undefined}
    content={<div>{open && <Recent key={user.id} close={close} />}</div>} styles={{ body: { padding: 0 } }}>
    <Badge count={countError ? '!' : unreadCount ?? '—'} overflowCount={99} size="small">
      <Button ref={trigger} type="text" shape="circle" className={buttonClassName} aria-label="通知" aria-expanded={open}
        title={countError ? '未读数读取失败' : unreadCount === null ? '正在读取未读数' : `${unreadCount} 条未读`} icon={icon || <BellOutlined />} />
    </Badge>
  </Popover>;
}
