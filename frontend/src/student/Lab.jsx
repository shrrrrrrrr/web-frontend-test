import { useLocation } from 'react-router-dom';
import Link from './space/SpaceLink';
import { Alert } from 'antd';
import PageContainer from '../components/common/PageContainer';
import { experiments } from './config';
import { PixelButton, PixelPanel, PixelTag } from './visual/PixelUI';
import { StudyHeader } from './visual/StudyUI';
import PixelIcon from './visual/PixelIcon';
import './visual/pixel-lab.css';

const steps = [['调整参数', '先选一个想验证的条件'], ['开始试飞', '提交参数，等待计算'], ['观察结果', '查看数值、航迹和遥测'], ['再调整', '带着发现，继续尝试']];
export default function Lab() {
  const location = useLocation();
  return <PageContainer><div className="study-workspace lab-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="lab" size={20} />OBSERVATORY / LAB</>} title="实验室" description="先提出想法，再用实验验证。在当前课程的实验室自由尝试，不要求先进入课时。" />
    {location.state?.experimentNotice && <Alert type="warning" showIcon title={location.state.experimentNotice} />}
    <ol className="lab-cycle">{steps.map(([title, description], index) => <li key={title}><span className="lab-cycle-number">0{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div>{index < 3 && <PixelIcon name="continue" size={20} />}</li>)}</ol>
    <div className="lab-catalog-heading"><h3>选择一个实验</h3><span>{experiments.length} 项可用实验</span></div>
    <div className="lab-catalog">{experiments.map((experiment) => <PixelPanel className="lab-experiment" key={experiment.id}>
      <div className="lab-experiment-emblem" aria-hidden="true"><PixelIcon name="lab" size={64} /><span>FLIGHT LAB</span></div>
      <div className="lab-experiment-content"><PixelTag>自由实验 · 可重复尝试</PixelTag><h2>{experiment.title}</h2><p>{experiment.description}</p>
        {experiment.id === 'glider' && <dl><div><dt>可以调整</dt><dd>机翼、重心、速度、质量与尾翼，共 7 项参数。</dd></div><div><dt>可以观察</dt><dd>6 项数值指标、三维航迹与飞行遥测图。每次试飞保留独立记录。</dd></div></dl>}
        <Link to={experiment.path}><PixelButton type="primary" icon={<PixelIcon name="continue" />}>开始实验</PixelButton></Link>
      </div>
    </PixelPanel>)}</div>
    <aside className="lab-footnote"><PixelIcon name="book" size={24} /><div><strong>把发现带回学习中</strong><p>实验结果不会自动提交为作品，也不会自动完成课时。从课程进入时，可以返回原来的学习位置。</p></div></aside>
  </div></PageContainer>;
}
