import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Pagination, Table } from 'antd';
import { feedbackAPI } from '../../api';
import FeedbackFilters from '../../components/feedback/FeedbackFilters';
import FeedbackStatusTag from '../../components/feedback/FeedbackStatusTag';
import { feedbackTypes } from '../../constants/feedback';
import { useAuth } from '../../store/AuthContext';
import { formatBeijingTime } from '../../utils/date';
import useRemoteResource from '../../hooks/useRemoteResource';
import { ServicePage, ServicePanel, ReadState } from '../../components/ServiceUI';

function Results({ filters, setFilters, student }) {
  const navigate = useNavigate();
  const read = useCallback(async () => (await feedbackAPI.mine(filters)).data, [filters]);
  const resource = useRemoteResource(read);
  const items = resource.data?.items || [], pagination = resource.data?.pagination;
  const change = (page, pageSize) => setFilters((current) => ({ ...current, page, pageSize }));
  const columns = [
    { title: '反馈编号', dataIndex: 'feedback_no', render: (value, row) => <Button type="link" onClick={() => navigate(`/feedback/${row.id}`)}>{value}</Button> },
    { title: '标题', dataIndex: 'title' }, { title: '类型', dataIndex: 'type', render: (value) => feedbackTypes[value] || value },
    { title: '状态', dataIndex: 'status', render: (value) => <FeedbackStatusTag status={value} /> },
    { title: '更新时间', dataIndex: 'updated_at', render: formatBeijingTime },
  ];
  return <ReadState {...resource} object="反馈列表" empty={!items.length} emptyText={filters.status || filters.type ? '没有符合条件的反馈，请调整筛选。' : '你还没有提交反馈。遇到问题时，可以从“提交反馈”告诉管理员。'}>
    {student ? <><div className="feedback-list">{items.map((item) => <Link key={item.id} to={`/feedback/${item.id}`} className="feedback-row">
      <div><span className="feedback-number">{item.feedback_no}</span><FeedbackStatusTag status={item.status} /><span>{feedbackTypes[item.type] || item.type}</span></div>
      <h3>{item.title}</h3><footer><time>{formatBeijingTime(item.updated_at)} 更新</time><span>查看处理进展 ↗</span></footer>
    </Link>)}</div>{pagination && <Pagination className="service-pagination" current={pagination.page} pageSize={pagination.pageSize} total={pagination.total} showSizeChanger showTotal={(total) => `共 ${total} 条`} onChange={change} />}</>
      : <Table rowKey="id" columns={columns} dataSource={items} pagination={pagination ? { current: pagination.page, pageSize: pagination.pageSize, total: pagination.total, onChange: change } : false} />}
  </ReadState>;
}
export default function FeedbackList() {
  const { user } = useAuth(), navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  return <ServicePage title="我的反馈" eyebrow="帮助 / FEEDBACK" description="把问题说清楚，一起让学习更顺畅。" actions={<Button type="primary" onClick={() => navigate('/feedback/new')}>提交反馈</Button>}>
    <ServicePanel><FeedbackFilters value={filters} onChange={setFilters} /><Results key={`${user.id}:${JSON.stringify(filters)}`} filters={filters} setFilters={setFilters} student={user.role === 'student'} /></ServicePanel>
  </ServicePage>;
}
