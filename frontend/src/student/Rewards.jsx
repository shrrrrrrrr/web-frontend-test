import { useCallback, useMemo, useState } from 'react';
import { Alert, App, Button, Card, Empty, Modal, Result, Space, Statistic, Table, Tabs, Tag } from 'antd';
import { useAuth } from '../store/AuthContext';
import PageContainer from '../components/common/PageContainer';
import AsyncPageState from '../components/common/AsyncPageState';
import { createRewardAdapter } from './rewardAdapter';
import { notifyDemoRewardsChanged } from './rewardEvents';
import useRemote from './useRemote';

export default function Rewards() {
  const { user } = useAuth();
  const { modal, message } = App.useApp();
  const adapter = useMemo(() => createRewardAdapter(localStorage, user.id), [user.id]);
  const fetcher = useCallback(() => adapter.load(), [adapter]);
  const { data, loading, error, retry } = useRemote(fetcher);
  const [giftId, setGiftId] = useState(null);
  const [badge, setBadge] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const gift = data?.gifts.find((item) => item.id === giftId);
  const confirm = () => {
    const requestId = crypto.randomUUID();
    modal.confirm({ title: '确认演示兑换', content: `使用 ${gift.cost} 演示积分兑换 ${gift.title}？只会更新本浏览器的演示记录，不扣真实积分、不发货。`,
      okText: '确认演示兑换', cancelText: '取消',
      onOk: async () => {
        setBusy(true);
        try { setResult(await adapter.redeem(gift.id, requestId)); notifyDemoRewardsChanged(user.id); setGiftId(null); retry(); }
        catch (err) { message.error(err.message); retry(); throw err; }
        finally { setBusy(false); }
      },
    });
  };
  const reset = () => modal.confirm({ title: '重置本账号的演示数据？', content: '仅清除当前浏览器中的演示余额和兑换记录。', onOk: async () => {
    try { await adapter.reset(); notifyDemoRewardsChanged(user.id); retry(); } catch (err) { message.error(err.message); }
  } });
  return <PageContainer title="积分与徽章" description="这里是可操作的奖励流程演示，正式规则尚未制定。" extra={<Button onClick={reset}>重置演示数据</Button>}>
    <Alert type="warning" showIcon title="本地演示模式 · 非真实积分、兑换或徽章" description="数据只保存在当前浏览器，并按登录账号隔离。不会发放礼品，不会把练习成绩换算为积分。" style={{ marginBottom: 16 }} />
    <AsyncPageState loading={loading} error={error} onRetry={retry}>
      {data && <><Card><Statistic title="演示积分余额" value={data.balance} /></Card><Tabs items={[
        { key: 'gifts', label: '礼品', children: <div className="student-card-grid">{data.gifts.map((item) => <Card key={item.id} title={item.title}><p>{item.cost} 演示积分 · 演示库存 {item.remaining}</p><p>{item.blockedReason || '满足演示兑换条件'}</p><Button onClick={() => setGiftId(item.id)}>查看礼品详情</Button></Card>)}</div> },
        { key: 'ledger', label: '积分明细', children: <Table rowKey="id" dataSource={data.ledger} pagination={false} scroll={{ x: 500 }} columns={[{ title: '说明', dataIndex: 'title' }, { title: '演示变动', dataIndex: 'amount' }, { title: '时间', dataIndex: 'time', render: (value) => value ? new Date(value).toLocaleString() : '演示初始值' }]} /> },
        { key: 'records', label: '兑换记录', children: <Table rowKey="id" dataSource={data.records} scroll={{ x: 600 }} columns={[{ title: '礼品', dataIndex: 'title' }, { title: '演示积分', dataIndex: 'cost' }, { title: '状态', dataIndex: 'status' }, { title: '时间', dataIndex: 'time', render: (value) => new Date(value).toLocaleString() }]} /> },
        { key: 'badges', label: '徽章', children: <div className="student-card-grid">{data.badges.map((item) => <Card key={item.id} title={item.title}><Tag color={item.earned ? 'green' : 'default'}>{item.earned ? '演示已获得' : '演示未获得'}</Tag><p>{item.description}</p><Button onClick={() => setBadge(item)}>查看徽章详情</Button></Card>)}</div> },
      ]} /></>}
    </AsyncPageState>
    <Modal open={!!giftId} title={gift?.title || '礼品详情'} onCancel={() => setGiftId(null)} footer={gift ? <Button type="primary" loading={busy} disabled={!!gift.blockedReason} onClick={confirm}>演示兑换</Button> : null}>
      {gift ? <Space orientation="vertical"><p>{gift.description}</p><p>需要 {gift.cost} 演示积分；本账号限兑 {gift.limit} 次；演示剩余 {gift.remaining} 件。</p><Alert type={gift.blockedReason ? 'warning' : 'info'} title={gift.blockedReason || '可以演示兑换，不会真实发货。'} /></Space> : <Empty description="正在刷新礼品状态" />}
    </Modal>
    <Modal open={!!badge} title={badge?.title} onCancel={() => setBadge(null)} footer={<Button onClick={() => setBadge(null)}>关闭</Button>}><p>{badge?.description}</p><p>{badge?.condition}</p></Modal>
    <Modal open={!!result} onCancel={() => setResult(null)} footer={<Button onClick={() => setResult(null)}>完成</Button>}><Result status="success" title="演示兑换成功" subTitle={`${result?.title || ''} · 仅保存本地演示记录，不会发货。`} /></Modal>
  </PageContainer>;
}
