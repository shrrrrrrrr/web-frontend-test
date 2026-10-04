import { Button, Form, Input } from 'antd';

export default function FeedbackMessageForm({ onSubmit, loading = false, internal = false }) {
  const [form] = Form.useForm();
  return <Form name={internal ? 'feedback-internal' : 'feedback-reply'} form={form} layout="vertical" onFinish={({ content }) => onSubmit(content.trim(), () => form.resetFields())}>
    <Form.Item name="content" label={internal ? '内部备注' : '回复内容'} rules={[{ required: true, whitespace: true, message: '请输入内容' }, { max: 2000, message: '内容不能超过 2000 字' }]}>
      <Input.TextArea rows={4} maxLength={2000} showCount placeholder={internal ? '仅管理员可见' : '补充操作步骤，或说明问题是否已经解决'} />
    </Form.Item>
    <Button type={internal ? 'default' : 'primary'} htmlType="submit" loading={loading} aria-label={internal ? '保存内部备注' : '发送回复'}>{internal ? '保存内部备注' : '发送回复'}</Button>
  </Form>;
}
