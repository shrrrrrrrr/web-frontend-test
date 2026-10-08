import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../store/AuthContext';


import StudentScope from '../student/StudentScope';

import { PageLoading } from './PageStatus';
import StudentShell from '../student/visual/StudentShell';
import StaffShell from './StaffShell';



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
    return location.pathname !== '/change-password'
      ? <StudentScope><StudentShell><div className="student-content-body"><Outlet /></div></StudentShell></StudentScope>
      : <StudentShell><Outlet /></StudentShell>;
  }

  return <StaffShell><Outlet/></StaffShell>;
}
