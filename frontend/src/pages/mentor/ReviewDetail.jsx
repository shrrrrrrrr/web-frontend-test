import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Alert, Button, Card, Collapse, Descriptions, Form, Input, InputNumber,
  Modal, Progress, Space, Table, Tag, Typography, message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { mentorReviewAPI } from '../../api';
import PageContainer from '../../components/common/PageContainer';
import AsyncPageState from '../../components/common/AsyncPageState';

import {ReflectionFields} from '../../student/ArchiveRecords';

const dimensions = [
  ['knowledge_understanding', '知识理解'],
  ['problem_analysis', '问题分析'],
  ['practical_application', '实践应用'],
  ['reflection_expression', '反思表达'],
];

export default function ReviewDetail() {
  const { reportId } = useParams();
  const navigate=useNavigate(),location=useLocation(),sequence=useRef(0);
  const queueReturn=/^\/mentor\/reviews(?:\?|$)/.test(location.state?.queueReturn||'')?location.state.queueReturn:'/mentor/reviews';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const load = async () => {
    const ticket=++sequence.current;setLoading(true);setError('');setData(null);
    try {const result=await mentorReviewAPI.detail(reportId);if(ticket===sequence.current)setData(result);}
    catch(err){if(ticket===sequence.current)setError(err?.response?.data?.error||'无法加载评审详情');}
    finally{if(ticket===sequence.current)setLoading(false);}
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load();return()=>{sequence.current++;}; }, [reportId]);

  const review = async (status) => {
    const values = await form.validateFields(['score', 'comment', 'dimensions']);
    if (status === 'rejected' && !values.comment?.trim()) return message.warning('退回时请填写修改意见');
    Modal.confirm({
      title: status === 'approved' ? '确认通过这份报告？' : '确认退回第三阶段修改？',
      content: `${data.student.real_name} · ${data.lesson.title} · ${values.score} 分`,
      onOk: async () => {
        setSubmitting(true);
        try {
          await mentorReviewAPI.review(reportId, { status, comment: values.comment, score: values.score, dimensions: values.dimensions });
          message.success('评审结果已提交'); await load();
        } finally { setSubmitting(false); }
      },
    });
  };

  if (!data) return <PageContainer title="学习报告评审"><AsyncPageState loading={loading} error={error} onRetry={load}><span /></AsyncPageState></PageContainer>;
  const { report, reflection, cards, progress } = data;
  const dimensionItems = dimensions.map(([key, label]) => ({ key, label, children: report.score_dimensions?.[key] === undefined ? '-' : `${report.score_dimensions[key]} 分` }));

  return <PageContainer
    title={`${data.student.real_name} · ${data.lesson.title}`}
    description={`${data.course.title} · 学习报告第 ${report.version} 版 · ${report.status === 'submitted' ? '待评审' : report.status === 'approved' ? '已通过' : '需修改'}`}
    extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(queueReturn)}>返回评审队列</Button>}
  >
    <div className="mentor-review-layout">
      <div>
        <Card className="content-card" title="学习报告" style={{ marginBottom: 16 }}><Descriptions column={1} bordered size="small">
          <Descriptions.Item label="学习总结">{report.summary}</Descriptions.Item>
          <Descriptions.Item label="关键收获">{report.key_points || '-'}</Descriptions.Item>
          <Descriptions.Item label="应用设想">{report.application || '-'}</Descriptions.Item>
          <Descriptions.Item label="困难与疑问">{report.difficulties || '-'}</Descriptions.Item>
          <Descriptions.Item label="下一步计划">{report.next_plan || '-'}</Descriptions.Item>
        </Descriptions></Card>
        <Card className="content-card" title="反思记录" style={{marginBottom:16}}><ReflectionFields reflection={reflection || {}}/></Card>
        <Card className="content-card" title="知识学习证据"><Table size="small" pagination={false} rowKey="id" dataSource={cards} columns={[
          { title: '知识卡片', dataIndex: 'title' },
          { title: '状态', render: (_, row) => <Tag color={row.completed_at ? 'green' : 'default'}>{row.completed_at ? '已完成' : '未完成'}</Tag> },
          { title: '答题得分', dataIndex: 'best_score', render: (value) => `${value} 分` },
          { title: '作答次数', dataIndex: 'attempt_count' },
        ]} /></Card>
      </div>

      <aside className="mentor-review-aside">
        <Card className="content-card" title="学习闭环" style={{ marginBottom: 16 }}><Progress type="circle" percent={progress.percent || 0} /><Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>课堂回顾、知识卡片、报告与反思共同作为评审依据。</Typography.Paragraph></Card>
        {report.status === 'submitted' ? <Card className="content-card" title="评审结论">
          <Form form={form} layout="vertical">
            <Form.Item name="score" label="总分" rules={[{ required: true, message: '请填写总分' }, { type: 'number', min: 0, max: 100 }]}><InputNumber min={0} max={100} precision={0} addonAfter="分" style={{ width: '100%' }} /></Form.Item>
            <Collapse ghost items={[{ key: 'dimensions', label: '可选维度评分', children: <>{dimensions.map(([key, label]) => <Form.Item key={key} name={['dimensions', key]} label={label} rules={[{ type: 'number', min: 0, max: 100 }]}><InputNumber min={0} max={100} precision={0} addonAfter="分" style={{ width: '100%' }} /></Form.Item>)}</> }]} />
            <Form.Item name="comment" label="评审意见"><Input.TextArea rows={5} maxLength={5000} showCount placeholder="通过时可填写鼓励和建议；退回时必须说明修改要求" /></Form.Item>
            <Space direction="vertical" style={{ width: '100%' }}><Button block type="primary" loading={submitting} onClick={() => review('approved')}>通过报告</Button><Button block danger loading={submitting} onClick={() => review('rejected')}>退回第三阶段修改</Button></Space>
          </Form>
        </Card> : <Card className="content-card" title="评审结果">
          <Alert type={report.status === 'approved' ? 'success' : 'warning'} showIcon message={`${report.status === 'approved' ? '报告已通过' : '报告已退回修改'} · ${Number.isInteger(report.score) ? `${report.score} 分` : '未评分'}`} description={report.review_comment} />
          {report.score_dimensions && <Descriptions column={1} size="small" items={dimensionItems} style={{ marginTop: 16 }} />}
        </Card>}
      </aside>
    </div>
  </PageContainer>;
}
