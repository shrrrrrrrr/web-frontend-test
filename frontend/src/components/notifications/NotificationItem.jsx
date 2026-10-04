import { Tag } from 'antd';
import { notificationCategories } from '../../constants/notification';
import { formatBeijingTime } from '../../utils/date';
import NotificationLevelTag from './NotificationLevelTag';

export default function NotificationItem({ notification, compact = false, onClick, disabled = false }) {
  const category = notificationCategories[notification.category] || { label: notification.category || '其他' };
  return <button type="button" disabled={disabled} className={`notification-row ${notification.is_read ? 'is-read' : 'is-unread'} ${compact ? 'is-compact' : ''}`} onClick={() => onClick?.(notification)}>
    <span className="notification-row-marker" aria-hidden="true">{notification.is_read ? '✓' : '•'}</span>
    <span className="notification-row-main">
      <span className="notification-row-meta"><Tag>{category.label}</Tag>{!compact && <NotificationLevelTag level={notification.level} />}<span>{notification.is_read ? '已读' : '未读'}</span></span>
      <strong>{notification.title}</strong><span className="notification-summary">{notification.summary || notification.content}</span>
      <time>{formatBeijingTime(notification.received_at || notification.published_at)}</time>
    </span><span aria-hidden="true" className="notification-arrow">↗</span>
  </button>;
}
