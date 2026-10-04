import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { homeForRole } from '../utils/roleNavigation';
import { StudentPageStatus } from './PageStatus';
import { PixelButton } from '../student/visual/PixelUI';

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const goHome = () => navigate(homeForRole(user?.role), { replace: true });
  if (user?.role === 'student') return <StudentPageStatus code="404" title="页面未找到"
    description="这个地址可能有误，或页面已经移动。返回探索地图，选择接下来要学习的课程。">
    <PixelButton type="primary" onClick={goHome}>返回探索地图</PixelButton>
  </StudentPageStatus>;
  return <Result status="404" title="页面未找到" subTitle="这个地址可能有误，或页面已经移动。请返回当前身份的首页继续。"
    extra={<Button type="primary" onClick={goHome}>返回工作台</Button>} />;
}
