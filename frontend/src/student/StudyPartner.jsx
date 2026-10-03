import { useState } from 'react';
import { Button, Space } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

export default function StudyPartner() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = location.pathname.match(/^\/courses\/(\d+)/)?.[1];
  return <div className="study-partner"><Space>
    <Button type="primary" onClick={() => collapsed ? setCollapsed(false) : navigate(`/dashboard/ai${courseId ? `?course_id=${courseId}` : ''}`)}>{collapsed ? '打开学习伙伴' : '向灵境小智提问'}</Button>
    {!collapsed && <Button aria-label="收起学习伙伴" onClick={() => setCollapsed(true)}>收起</Button>}
  </Space></div>;
}
