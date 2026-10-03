import { Typography } from 'antd';
import { PixelPanel } from './PixelUI';
import './pixel-study.css';

export function StudyHeader({ eyebrow, title, description, children }) {
  return <header className="study-header">
    <div className="study-header-context">{eyebrow}</div>
    <div className="study-header-main"><div><Typography.Title level={2}>{title}</Typography.Title>{description && <p>{description}</p>}</div><div className="study-header-actions">{children}</div></div>
  </header>;
}

export function StudySection({ number, title, description, children, className = '', ...props }) {
  return <PixelPanel className={`study-section ${className}`} {...props}>
    <header className="study-section-heading"><span className="study-section-number" aria-hidden="true">{number}</span><div><Typography.Title level={3}>{title}</Typography.Title>{description && <p>{description}</p>}</div></header>
    {children}
  </PixelPanel>;
}
