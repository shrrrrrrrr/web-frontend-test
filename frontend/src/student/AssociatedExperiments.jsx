import { Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { associatedExperiments, configuredExperiments } from './experimentConfig';
import { associatedExperimentLink } from './experimentContext';

export default function AssociatedExperiments({ courseId, lessonId, stage, cardId }) {
  const navigate = useNavigate();
  const context = { courseId, lessonId, stage, cardId };
  const items = associatedExperiments(context, configuredExperiments(import.meta.env.DEV && import.meta.env.VITE_STUDENT_TEST_CONFIG === '1'));
  if (!items.length) return null;
  return <Space wrap style={{ marginBottom: 16 }}>
    {items.map((item) => <Button key={item.id} onClick={() => navigate(associatedExperimentLink(context, item.experiment))}>{item.label}</Button>)}
    <Typography.Text type="secondary">返回时恢复当前学习位置；试飞不会自动提交作品或完成课时。</Typography.Text>
  </Space>;
}
