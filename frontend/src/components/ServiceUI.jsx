import { Alert, Button, Card, Empty, Spin, Modal } from 'antd';
import { useAuth } from '../store/AuthContext';
import { StudyHeader } from '../student/visual/StudyUI';
import { PixelPanel } from '../student/visual/PixelUI';
import { requestError, objectErrorTitle } from '../utils/requestError';
import '../student/visual/pixel-service.css';

export function ServicePage({ title, eyebrow, description, actions, children }) {
  const { user } = useAuth();
  return <div className={user?.role === 'student' ? 'service-page' : 'service-standard'}>
    {user?.role === 'student'
      ? <StudyHeader title={title} eyebrow={eyebrow} description={description}>{actions}</StudyHeader>
      : <header style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', marginBottom: 16 }}><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{actions}</header>}
    {children}
  </div>;
}
export function ServicePanel({ children, className = '' }) {
  const { user } = useAuth();
  return user?.role === 'student' ? <PixelPanel className={`service-panel ${className}`}>{children}</PixelPanel> : <Card>{children}</Card>;
}
export function ReadState({ loading, error, reload, empty, emptyText, object = '内容', children }) {
  if (loading) return <div className="service-loading" role="status"><Spin /><p>正在读取{object}…</p></div>;
  if (error) return <Alert type="error" showIcon role="alert" title={objectErrorTitle(error, object)} description={requestError(error)} action={<Button onClick={reload}>重新读取</Button>} />;
  if (empty) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText || '暂时没有内容'} />;
  return children;
}
export function OperationNotice({ value, onRetry }) {
  return value ? <Alert role="status" showIcon type={value.type} title={value.text}
    action={value.retry && onRetry ? <Button onClick={onRetry}>重新读取显示</Button> : undefined} /> : null;
}
function containFocus(event) {
  if (event.key !== 'Tab') return;
  const dialog = event.currentTarget.closest('[role="dialog"]') || event.currentTarget;
  const items = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter((item) => item.getClientRects().length);
  if (!items.length) return;
  const first = items[0], last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
export function ServiceModal(props) {
  const { user } = useAuth();
  return <Modal {...props} okButtonProps={{ ...props.okButtonProps, 'aria-label': props.okText || '确定' }} rootClassName={user?.role === 'student' ? 'student-pixel service-modal' : undefined}
    modalRender={(node) => <div onKeyDownCapture={containFocus}>{node}</div>} />;
}
