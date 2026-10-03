import { Link } from 'react-router-dom';
import { Alert, Button, Card } from 'antd';
import PageContainer from '../components/common/PageContainer';
import { experiments } from './config';

export default function Lab() {
  return <PageContainer title="实验室" description="先提出想法，再用实验验证。你可以独立进行实验。">
    <Alert type="info" showIcon title="实验结果不会自动提交为作品，也不会自动完成课时。" style={{ marginBottom: 16 }} />
    <div className="student-card-grid">{experiments.map((experiment) => <Card key={experiment.id} title={experiment.title}><p>{experiment.description}</p><Link to={experiment.path}><Button type="primary">开始实验</Button></Link></Card>)}</div>
  </PageContainer>;
}
