import { Button, Result } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import { StudentPageStatus } from './PageStatus';
import { PixelButton } from '../student/visual/PixelUI';
import { useAuth } from '../store/AuthContext';
import { homeForRole } from '../utils/roleNavigation';

export function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homeForRole(user?.role)} replace />;
}

export default function RoleGuard({ roles, children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user || roles.includes(user.role)) return children;
  if (user.role === 'student') return <StudentPageStatus code="403" title="当前身份无法访问此页面"
    description="这个页面不属于学生账号的使用范围。返回探索地图，继续你已获授权的学习。">
    <PixelButton type="primary" onClick={() => navigate(homeForRole(user.role), { replace: true })}>返回探索地图</PixelButton>
  </StudentPageStatus>;
  return <Result
    status="403"
    title="当前身份无法访问此页面"
    subTitle="该功能不属于你的工作范围，请从当前身份的工作台继续。"
    extra={<Button type="primary" onClick={() => navigate(homeForRole(user.role), { replace: true })}>返回工作台</Button>}
  />;
}
