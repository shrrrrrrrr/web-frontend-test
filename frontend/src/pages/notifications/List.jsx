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

function Results({ filters, setFilters, currentReadRef }) {
  const navigate = useNavigate();
  const read = useCallback(async () => (await notificationAPI.list(filters)).data, [filters]);
  const resource = useRemoteResource(read);
  useEffect(() => {
    const reload = resource.reload;
    currentReadRef.current = reload;
    return () => { if (currentReadRef.current === reload) currentReadRef.current = null; };
  }, [currentReadRef, resource.reload]);
  useEffect(() => {
    if (!resource.data) return;
    const last = Math.max(1, Math.ceil(resource.data.pagination.total / filters.pageSize));
    if (filters.page > last) setFilters(value => ({ ...value, page: last }));
  }, [resource.data, filters, setFilters]);
  const items = resource.data?.items || [], pagination = resource.data?.pagination;
  return <ReadState {...resource} object="通知列表" empty={!items.length} emptyText={filters.read || filters.category || filters.level ? '没有符合筛选条件的通知，可调整筛选。' : '暂时没有通知。有新消息时，会出现在这里。'}>
    <div className="notification-list">{items.map(item => <NotificationItem key={item.id} notification={item} onClick={() => navigate(`/notifications/${item.id}`)} />)}</div>
    {pagination && <Pagination className="service-pagination" current={pagination.page} pageSize={pagination.pageSize} total={pagination.total} showSizeChanger showTotal={total => `共 ${total} 条`}
      onChange={(page, pageSize) => setFilters(value => ({ ...value, page, pageSize }))} />}
  </ReadState>;
}
function AccountList() {
  const location = useLocation(), { refreshUnread } = useNotifications();
  const [notice, setNotice] = useState(location.state?.notice || null), [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 }), [confirm, setConfirm] = useState(false);
  const pending = useRef(false), alive = useRef(false), currentReadRef = useRef(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const readLatest = async () => {
    // A filter may change again while its read is in flight. Follow the currently mounted reader.
    for (let attempt = 0; attempt < 3 && alive.current; attempt++) {
      const read = currentReadRef.current;
      if (!read) return false;
      const ok = await read();
      if (read === currentReadRef.current) return ok;
    }
    return false;
  };
  const reread = async () => {
    const [list, count] = await Promise.all([readLatest(), refreshUnread().then(() => true, () => false)]);
    if (alive.current) setNotice(list && count ? null : { type: 'warning', text: '显示暂未刷新，请重新读取。', retry: true });
    return list && count;
  };
  const run = async (action, success) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setNotice(null);
    try {
      await action();
      if (!alive.current) return;
      setConfirm(false);
      setNotice({ type: 'success', text: success });
      const ok = await reread();
      if (alive.current) setNotice({ type: ok ? 'success' : 'warning', text: ok ? success : `${success}。已完成操作，显示暂未刷新。`, retry: !ok });
    } catch (error) {
      if (alive.current) setNotice({ type: 'error', text: requestError(error, { action: '通知操作', write: true }) });
    } finally { if (alive.current) { pending.current = false; setBusy(false); } }
  };
  return <ServicePage title="通知中心" eyebrow="消息 / NOTIFICATIONS" description="课程提醒、导师反馈和处理进展，都在这里。">
    <ServicePanel>
      <div className="service-toolbar"><NotificationFilters value={filters} onChange={setFilters} /><Space wrap>
        <Button disabled={busy || notice?.retry} onClick={() => run(notificationAPI.markAllRead, '已将全部通知标为已读')}>全部已读</Button>
        <Button disabled={busy || notice?.retry} onClick={() => setConfirm(true)}>清理已读</Button>
      </Space></div>
      <p className="service-muted">批量操作适用于当前账号的全部未隐藏通知，包括其他筛选条件和分页中的通知。</p>
      <OperationNotice value={notice} onRetry={reread} />
      <Results key={JSON.stringify(filters)} filters={filters} setFilters={setFilters} currentReadRef={currentReadRef} />
      <ServiceModal title="清理全部已读通知？" open={confirm} onCancel={() => !busy && setConfirm(false)} okText="确认清理" cancelText="取消" confirmLoading={busy}
        onOk={() => run(notificationAPI.hideRead, '已隐藏全部已读通知')}>
        <p>当前账号所有已读通知将从列表中隐藏，包括当前筛选和分页之外的通知。不会删除课程、反馈或其他业务记录。</p>
        {confirm && <OperationNotice value={notice} />}
      </ServiceModal>
    </ServicePanel>
  </ServicePage>;
}
export default function NotificationList() {
  const { user } = useAuth();
  return <AccountList key={user.id} />;
}
