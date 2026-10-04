import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuth } from '../store/AuthContext';
import Sidebar from './Sidebar';
import HeaderBar from './Header';
import StudentScope from '../student/StudentScope';
import StudyPartner from '../student/StudyPartner';
import { PageLoading } from './PageStatus';
import StudentShell from '../student/visual/StudentShell';

const { Content } = Layout;

export default function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading>正在确认登录状态，请稍候。</PageLoading>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 强制修改密码：管理员重置密码后，未改密前禁止访问其他页面
  if (user?.force_reset_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (user.role === 'student') {
    return <StudentShell>{location.pathname !== '/change-password'
      ? <StudentScope><div className="student-content-body"><Outlet /><StudyPartner /></div></StudentScope>
      : <Outlet />}</StudentShell>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ minWidth: 0 }}>
        <HeaderBar />
        <Content style={{ background: '#f5f7fa', minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
