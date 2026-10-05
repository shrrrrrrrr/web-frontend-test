import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Form, Input, Button } from 'antd';
import { useAuth } from '../../store/AuthContext';
import { homeForRole } from '../../utils/roleNavigation';
import { getSessionNotice } from '../../utils/authSession';
import { requestError } from '../../utils/requestError';
import PasswordInput from '../../components/PasswordInput';
import StudentTheme from '../../student/visual/StudentTheme';
import PixelIcon from '../../student/visual/PixelIcon';
import { PixelPanel, PixelButton } from '../../student/visual/PixelUI';
import SceneArt from '../../student/space/SceneArt';
import {PLATFORM_NAME} from '../../student/space/identity';
import '../../student/visual/pixel-service.css';

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const { login, authError, retryRestore, loading } = useAuth();
  const navigate = useNavigate();
  const notice = error || authError || getSessionNotice();
  const onFinish = async (values) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const user = await login(values.username.trim(), values.password);
      navigate(user.force_reset_password ? '/change-password' : homeForRole(user.role), { replace: true });
    } catch (err) { setError(requestError(err, { action: '登录' })); }
    finally { pending.current = false; setBusy(false); }
  };
  return <StudentTheme><main className="voyage-login space-login">
    <header className="login-brand"><PixelIcon name="map" size={40} /><div><strong>{PLATFORM_NAME}</strong><span>账号登录</span></div></header>
    <div className="login-layout">
      <section className="login-scene" aria-label="北航校园像素场景"><SceneArt name="campus" priority/><div className="space-login-caption"><h1>{PLATFORM_NAME}</h1></div></section>
      <PixelPanel className="login-panel">
        <span className="service-eyebrow">欢迎回来</span><h2>登录你的账号</h2><p className="service-muted">继续课程探索，记录新的发现。</p>
        {notice && <Alert role="alert" type="warning" showIcon title={notice} />}
        {authError && <Button onClick={retryRestore} loading={loading}>重新读取登录信息</Button>}
        <Form layout="vertical" onFinish={onFinish} size="large" requiredMark="optional">
          <Form.Item name="username" label="账号" rules={[{ required: true, whitespace: true, message: '请输入账号' }]}>
            <Input autoComplete="username" placeholder="账号" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <PasswordInput autoComplete="current-password" placeholder="密码" />
          </Form.Item>
          <PixelButton type="primary" htmlType="submit" loading={busy} block>登录</PixelButton>
        </Form>
        <p className="login-account-note">还没有账号？请联系管理员创建。</p>
      </PixelPanel>
    </div><footer className="login-footer">{PLATFORM_NAME}<span>账号由管理员提供</span></footer>
  </main></StudentTheme>;
}
