import { useState } from 'react';
import { Input } from 'antd';

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return <Input {...props} type={visible ? 'text' : 'password'} suffix={
    <button type="button" className="password-toggle" aria-label={visible ? '隐藏密码' : '显示密码'} aria-pressed={visible}
      onClick={() => setVisible((value) => !value)}>{visible ? '隐藏' : '显示'}</button>
  } />;
}
