import Alert from '../../content/RoleAlert';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button} from 'antd';
import { useAuth } from '../../store/AuthContext';
import { homeForRole } from '../../utils/roleNavigation';
import { requestError } from '../../utils/requestError';
import PasswordInput from '../../components/PasswordInput';
import { StudyHeader } from '../../student/visual/StudyUI';
import { PixelPanel } from '../../student/visual/PixelUI';
import '../../student/visual/pixel-service.css';

export default function ChangePassword() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const forced = !!user?.force_reset_password, student = user?.role === 'student';
  const Panel = student ? PixelPanel : Card;
  const onFinish = async (values) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const next = await changePassword({ old_password: values.old_password, new_password: values.new_password });
      navigate(homeForRole(next.role), { replace: true });
    } catch (err) { setError(requestError(err, { action: '修改密码', write: true })); }
    finally { pending.current = false; setBusy(false); }
  };
  return <div className={student ? 'service-page password-page' : ''} style={!student ? { maxWidth: 520, margin: '32px auto', padding: 16 } : undefined}>
    {student ? <StudyHeader eyebrow="账号 / PASSWORD" title={forced ? '先设置你的新密码' : '修改密码'} description={forced ? '完成这一步，就可以继续探索。' : '使用原密码验证后，设置新的登录密码。'} /> : <h2>修改密码</h2>}
    <Panel className="password-panel">
      {forced && <Alert type="info" showIcon title="这是首次登录或管理员重置后的密码。修改成功后才能继续使用其他功能。" />}
      {error && <Alert role="alert" type="error" showIcon title={error} />}
      <Form layout="vertical" size="large" onFinish={onFinish}>
        <Form.Item name="old_password" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}><PasswordInput autoComplete="current-password" /></Form.Item>
        <Form.Item name="new_password" label="新密码" dependencies={['old_password']}
          extra="至少 8 位；大写字母、小写字母、数字、特殊字符，至少包含三类。不能与原密码相同。"
          rules={[{ required: true, message: '请输入新密码' }, { min: 8, message: '密码至少 8 位' }, ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value) return Promise.resolve();
              if (value === getFieldValue('old_password')) return Promise.reject(new Error('新密码不能与原密码相同'));
              if ([/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length < 3) return Promise.reject(new Error('密码需包含至少三类字符'));
              return Promise.resolve();
            },
          })]}><PasswordInput autoComplete="new-password" /></Form.Item>
        <Form.Item name="confirm_password" label="确认新密码" dependencies={['new_password']} rules={[{ required: true, message: '请再次输入新密码' }, ({ getFieldValue }) => ({
          validator: (_, value) => !value || value === getFieldValue('new_password') ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致')),
        })]}><PasswordInput autoComplete="new-password" /></Form.Item>
        <Button type="primary" htmlType="submit" loading={busy} block aria-label="确认修改">确认修改</Button>
      </Form>
      <div className="password-footer">{!forced && <Button onClick={() => navigate(homeForRole(user.role))}>返回</Button>}<Button onClick={() => { logout(); navigate('/login'); }}>退出登录</Button></div>
    </Panel>
  </div>;
}
