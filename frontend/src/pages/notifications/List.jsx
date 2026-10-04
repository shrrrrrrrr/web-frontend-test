import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Pagination, Space } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../api';
import { useAuth } from '../../store/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import useRemoteResource from '../../hooks/useRemoteResource';
import NotificationFilters from '../../components/notifications/NotificationFilters';
import NotificationItem from '../../components/notifications/NotificationItem';
import { ServicePage, ServicePanel, ReadState, ServiceModal, OperationNotice } from '../../components/ServiceUI';
import { requestError } from '../../utils/requestError';

function Results({ filters, setFilters, notice, setNotice, busy, setBusy, pendingRef }) {
  const navigate = useNavigate();
  const { refreshUnread } = useNotifications();
  const read = useCallback(async () => {
    const data = (await notificationAPI.list(filters)).data;
    return data;
  }, [filters]);
  const resource = useRemoteResource(read);
  useEffect(() => {
    if (!resource.data) return;
    const last = Math.max(1, Math.ceil(resource.data.pagination.total / filters.pageSize));
    if (filters.page > last) setFilters((value) => ({ ...value, page: last }));
  }, [resource.data, filters, setFilters]);
  const [confirm, setConfirm] = useState(false);
  const reread = async () => {
    const [list, count] = await Promise.all([resource.reload(), refreshUnread().then(() => true, () => false)]);
    if (resource.isCurrent()) setNotice(list && count ? null : { type: 'warning', text: '显示暂未刷新，请重新读取。', retry: true });
    return list && count;
  };
  const run = async (action, success) => {
    if (pendingRef.current) return;
    pendingRef.current = true; setBusy(true); setNotice(null);
    try {
      await action();
      setNotice({ type: 'success', text: success });
      if (!resource.isCurrent()) { void refreshUnread().catch(() => setNotice({ type: 'warning', text: success + '。已完成操作，未读数显示暂未刷新。', retry: true })); return; }
      setConfirm(false);
      const ok = await reread();
      if (resource.isCurrent()) setNotice({ type: ok ? 'success' : 'warning', text: ok ? success : `${success}。已完成操作，显示暂未刷新。`, retry: !ok });
    } catch (err) { if (resource.isCurrent()) setNotice({ type: 'error', text: requestError(err, { action: '通知操作', write: true }) }); }
    finally { pendingRef.current = false; setBusy(false); }
  };
  const items = resource.data?.items || [], pagination = resource.data?.pagination;
  return <ServicePanel>
    <div className="service-toolbar"><NotificationFilters value={filters} onChange={setFilters} /><Space wrap>
      <Button disabled={busy || notice?.retry} onClick={() => run(notificationAPI.markAllRead, '已将全部通知标为已读')}>全部已读</Button>
      <Button disabled={busy || notice?.retry} onClick={() => setConfirm(true)}>清理已读</Button>
    </Space></div>
    <p className="service-muted">批量操作适用于当前账号的全部未隐藏通知，包括其他筛选条件和分页中的通知。</p>
    <OperationNotice value={notice} onRetry={reread} />
    <ReadState {...resource} object="通知列表" empty={!items.length} emptyText={filters.read || filters.category || filters.level ? '没有符合筛选条件的通知，可调整筛选。' : '暂时没有通知。有新消息时，会出现在这里。'}>
      <div className="notification-list">{items.map((item) => <NotificationItem key={item.id} notification={item} onClick={() => navigate(`/notifications/${item.id}`)} />)}</div>
      {pagination && <Pagination className="service-pagination" current={pagination.page} pageSize={pagination.pageSize} total={pagination.total} showSizeChanger showTotal={(total) => `共 ${total} 条`}
        onChange={(page, pageSize) => setFilters((value) => ({ ...value, page, pageSize }))} />}
    </ReadState>
    <ServiceModal title="清理全部已读通知？" open={confirm} onCancel={() => !busy && setConfirm(false)} okText="确认清理" cancelText="取消" confirmLoading={busy}
      onOk={() => run(notificationAPI.hideRead, '已隐藏全部已读通知')}>
      <p>当前账号所有已读通知将从列表中隐藏，包括当前筛选和分页之外的通知。不会删除课程、反馈或其他业务记录。</p>
      {confirm && <OperationNotice value={notice} />}
    </ServiceModal>
  </ServicePanel>;
}
export default function NotificationList() {
  const { user } = useAuth(), location = useLocation();
  const [notice, setNotice] = useState(location.state?.notice || null), [busy, setBusy] = useState(false);
  const pendingRef = useRef(false);
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  return <ServicePage title="通知中心" eyebrow="消息 / NOTIFICATIONS" description="课程提醒、导师反馈和处理进展，都在这里。">
    <Results key={`${user.id}:${JSON.stringify(filters)}`} filters={filters} setFilters={setFilters} notice={notice} setNotice={setNotice} busy={busy} setBusy={setBusy} pendingRef={pendingRef} />
  </ServicePage>;
}
