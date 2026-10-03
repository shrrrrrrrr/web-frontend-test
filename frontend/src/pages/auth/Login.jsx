import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../store/AuthContext';
import { homeForRole } from '../../utils/roleNavigation';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = await login(values.username, values.password);
      sessionStorage.removeItem('session-notice');
      message.success('登录成功');
      // 若管理员重置过密码，强制先修改密码
      navigate(user?.force_reset_password ? '/change-password' : homeForRole(user?.role), { replace: true });
    } catch {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: -20,
        background: '#f5f5f5',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'transparent',
        zIndex: 0
      }} />
      <Card
        style={{
          position: 'relative',
          zIndex: 1,
          width: 480,
          maxWidth: '95vw',
          borderRadius: 12,
          boxShadow: 'none'
        }}
        styles={{ body: { padding: 40 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 4 }}>星海远航</Title>
          <Text type="secondary">登录后继续你的课程探索</Text>
        </div>
        {sessionStorage.getItem('session-notice') && <Alert type="warning" title={sessionStorage.getItem('session-notice')} style={{ marginBottom: 16 }} />}
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, whitespace: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">还没有账号？请联系管理员创建。</Text>
        </div>
      </Card>
    </div>
  );
}
