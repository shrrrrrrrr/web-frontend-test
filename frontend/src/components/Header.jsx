import { Layout, Dropdown, Space, Avatar, Button, Tag } from 'antd';
import { UserOutlined, LogoutOutlined, MessageOutlined, KeyOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {copyText} from '../content/copy';
import NotificationBell from './notifications/NotificationBell';

const { Header } = Layout;

const roleMap = {
  admin: { label: '管理员', color: 'red' },
  academic_mentor: { label: '学术导师', color: 'blue' },
  teacher: { label: '教师', color: 'green' },
  student: { label: '学生', color: 'cyan' },
  media: { label: '新媒体', color: 'orange' },
};

export default function HeaderBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleInfo = roleMap[user?.role] || { label: user?.role, color: 'default' };

  return (
    <Header className="staff-header"><Button className="staff-back" aria-label={copyText('next2.staff.back')} onClick={()=>window.history.state?.idx? navigate(-1):navigate(user.role==='teacher'?'/observer':'/dashboard')}>← {copyText('next2.staff.back')}</Button>
      <Space size="middle">
        {!user?.force_reset_password && <NotificationBell />}
        <Button
          type="text"
          icon={<MessageOutlined />}
          onClick={() => navigate(user?.role === 'admin' ? '/feedback/manage' : '/feedback/new', { state: { from: location.pathname } })}
        >
          帮助与反馈
        </Button>
        <Dropdown menu={{
          items: [
            { key: 'feedback', label: '我的反馈', onClick: () => navigate('/feedback') },
            { key: 'change-password', icon: <KeyOutlined />, label: '修改密码', onClick: () => navigate('/change-password') },
            { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
          ]
        }}>
          <Button type="text" className="staff-account"><Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <span style={{ fontWeight: 500 }}>{user?.real_name}</span>
            <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
          </Space></Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
