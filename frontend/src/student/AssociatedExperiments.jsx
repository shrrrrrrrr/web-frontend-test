import { Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { associatedExperiments, configuredExperiments } from './experimentConfig';
import { associatedExperimentLink } from './experimentContext';
import { PixelButton } from './visual/PixelUI';
import PixelIcon from './visual/PixelIcon';

export default function AssociatedExperiments({ courseId, lessonId, stage, cardId, variant = 'inline' }) {
  const navigate = useNavigate();
  const context = { courseId, lessonId, stage, cardId };
  const items = associatedExperiments(context, configuredExperiments(import.meta.env.DEV && import.meta.env.VITE_STUDENT_TEST_CONFIG === '1'));
  if (!items.length) return null;
  if (variant === 'study') return <aside className="study-experiment" aria-label="关联实验">
    <div className="study-experiment-heading"><PixelIcon name="lab" />动手验证一下</div>
    <Space wrap>{items.map((item) => <PixelButton key={item.id} onClick={() => navigate(associatedExperimentLink(context, item.experiment))}>{item.label}</PixelButton>)}</Space>
    <p className="study-help">返回时恢复当前学习位置；试飞不会自动提交作品或完成课时。</p>
  </aside>;
  return <Space wrap style={{ marginBottom: 16 }}>
    {items.map((item) => <Button key={item.id} onClick={() => navigate(associatedExperimentLink(context, item.experiment))}>{item.label}</Button>)}
    <Typography.Text type="secondary">返回时恢复当前学习位置；试飞不会自动提交作品或完成课时。</Typography.Text>
  </Space>;
}
