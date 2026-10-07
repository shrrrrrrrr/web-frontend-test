import Alert from '../student/visual/StudentAlert';
import Sentence from '../content/Sentence';
import { useEffect, useRef, useState } from 'react';
import { Empty, Modal, Pagination, Spin, Tabs } from 'antd';
import { Link } from 'react-router-dom';
import PageContainer from '../components/common/PageContainer';
import { formatBeijingTime } from '../utils/date';
import { useRewards } from './useRewards';
import { PixelButton, PixelImage, PixelPanel, PixelTag } from './visual/PixelUI';
import PixelIcon from './visual/PixelIcon';
import { StudyHeader } from './visual/StudyUI';
import './visual/pixel-rewards.css';


// Explicitly cycle at the edges: browser chrome is outside the library's focusin trap.
function trapDialogFocus(event) {
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')].filter((node) => node.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (!first) { event.preventDefault(); return; }
  if (event.shiftKey && (document.activeElement === first || document.activeElement.classList.contains('reward-dialog-body'))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function RewardArt({ id, badge = false }) {
  return <PixelImage className="reward-art" src={`/assets/pixel-v1/rewards/${badge ? 'badge' : 'gift'}-${id}.svg`} width={128} height={128} alt="" />;
}
function GiftConditions({ gift, available }) {
  return <><dl className="reward-conditions"><div><dt>本账号演示库存</dt><dd>{gift.remaining} 件</dd></div><div><dt>本账号限兑</dt><dd>{gift.limit} 次</dd></div></dl>
    <Sentence className={`reward-condition ${available && !gift.blockedReason ? 'reward-condition--ready' : ''}`}>{available ? gift.blockedReason || '可以兑换' : '当前条件暂不可核对'}</Sentence></>;
}
function RecordList({ data, ledger = false, highlight }) {
  const [page, setPage] = useState(1);
  const current = Math.min(page, Math.max(1, Math.ceil(data.length / 8)));
  return <PixelPanel className="reward-history"><header><h3>{ledger ? '每一笔演示积分' : '本浏览器的兑换记录'}</h3><Sentence>{ledger ? '仅包含演示初始值和本地演示兑换。' : '记录属于当前账号，不代表礼品已发放。'}</Sentence></header>
    {!data.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有演示兑换记录" /> : <ol className="reward-record-list">{data.slice((current - 1) * 8, current * 8).map((item) => <li key={item.id} className={highlight === item.id ? 'reward-record--highlight' : ''}>
      <span className={`reward-record-mark ${ledger && item.amount > 0 ? 'reward-record-mark--initial' : ''}`} aria-hidden="true"><PixelIcon name={ledger && item.amount > 0 ? 'coin' : 'archive'} /></span>
      <div className="reward-record-text"><strong>{item.title}</strong><Sentence>{item.time ? <time dateTime={item.time}>{formatBeijingTime(item.time)}（北京时间）</time> : '演示初始值 · 无发放时间'}</Sentence>{!ledger && <PixelTag tone="neutral">{item.status || '本地演示记录（不发货）'}</PixelTag>}{highlight === item.id && <span className="reward-current-record">本次兑换</span>}</div>
      <div className={`reward-amount ${ledger && item.amount > 0 ? 'reward-amount--positive' : ''}`}><strong>{ledger ? `${item.amount > 0 ? '+' : ''}${item.amount}` : `−${item.cost}`}</strong><span>演示积分</span></div>
    </li>)}</ol>}
    {data.length > 8 && <Pagination current={current} pageSize={8} total={data.length} onChange={setPage} showSizeChanger={false} />}
  </PixelPanel>;
}

export default function Rewards() {
  const { data, status, error, refreshing, syncWarning, store } = useRewards();
  const [activeTab, setActiveTab] = useState('gifts');
  const [dialog, setDialog] = useState(null);
  const [operationError, setOperationError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [highlight, setHighlight] = useState(null);
  const inFlight = useRef(false), lifecycle = useRef(null), trigger = useRef(null), dialogBody = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    store.refresh();
    return () => controller.abort();
  }, [store]);
  useEffect(() => {
    if (dialog?.kind) dialogBody.current?.focus();
  }, [dialog?.kind]);
  const ready = status === 'ready' && !refreshing;
  const gift = data?.gifts.find((item) => item.id === dialog?.giftId);
  const badge = data?.badges.find((item) => item.id === dialog?.badgeId);
  const resultExists = status === 'ready' && data.records.some((item) => item.id === dialog?.record?.id);
  const open = (next, event) => { trigger.current = event.currentTarget; setOperationError(null); setDialog(next); };
  const close = () => { if (!inFlight.current) { setDialog(null); setOperationError(null); } };
  const confirm = () => { setOperationError(null); setDialog({ ...dialog, kind: 'confirm', requestId: crypto.randomUUID() }); };
  const execute = async () => {
    if (inFlight.current) return;
    const signal = lifecycle.current.signal;
    inFlight.current = true; setBusy(true); setOperationError(null); setNotice('');
    try {
      if (dialog.kind === 'reset') {
        await store.reset({ signal });
        if (signal.aborted) return;
        setDialog(null); setHighlight(null); setNotice('本账号的奖励演示数据已重置。');
      } else {
        const record = await store.redeem(dialog.giftId, dialog.requestId, { signal });
        if (signal.aborted) return;
        setDialog({ kind: 'success', record });
      }
    } catch (err) { if (!signal.aborted) setOperationError(err); }
    finally { if (!signal.aborted) { inFlight.current = false; setBusy(false); } }
  };
  const title = dialog?.kind === 'reset' ? '重置本账号的演示数据？' : dialog?.kind === 'confirm' ? '确认演示兑换'
    : dialog?.kind === 'success' ? (status === 'ready' && !resultExists ? '演示记录已变化' : '演示兑换成功') : badge?.title || gift?.title || '演示详情';
  const showRecord = () => { setActiveTab('records'); setHighlight(dialog.record.id); close(); trigger.current = null; requestAnimationFrame(() => document.querySelector('#reward-tabs-tab-records')?.focus()); };
  let footer;
  if (dialog?.kind === 'gift') footer = <><PixelButton onClick={close}>关闭</PixelButton><PixelButton type="primary" disabled={!ready || !!gift?.blockedReason} onClick={confirm}>演示兑换</PixelButton></>;
  else if (dialog?.kind === 'confirm') footer = <><PixelButton disabled={busy} onClick={() => { setOperationError(null); setDialog({ ...dialog, kind: 'gift' }); }}>返回详情</PixelButton><PixelButton type="primary" loading={busy} disabled={!ready || !!gift?.blockedReason} onClick={execute}>{operationError ? '重试本次兑换' : '确认演示兑换'}</PixelButton></>;
  else if (dialog?.kind === 'reset') footer = <><PixelButton disabled={busy} onClick={close}>取消</PixelButton><PixelButton danger loading={busy} onClick={execute}>{operationError ? '重试重置' : '确认重置演示数据'}</PixelButton></>;
  else if (dialog?.kind === 'success') footer = <><PixelButton onClick={() => { setActiveTab('gifts'); close(); }}>返回礼品</PixelButton><PixelButton type="primary" onClick={showRecord}>查看本次兑换记录</PixelButton></>;
  else footer = <PixelButton onClick={close}>关闭</PixelButton>;

  return <PageContainer><div className="study-workspace reward-workspace">
    <StudyHeader eyebrow={<Link to="/me">我的 / 本地演示</Link>} title="积分与徽章" description="浏览礼品，查看演示记录。">
      <PixelButton onClick={(event) => open({ kind: 'reset' }, event)}>重置演示数据</PixelButton>
    </StudyHeader>
    <PixelPanel className="reward-overview" aria-label="演示积分概况">
      <div className="reward-balance"><PixelIcon name="coin" size={36} /><div><span>演示积分余额</span><strong data-testid="reward-balance">{status === 'ready' ? data.balance : status === 'loading' ? '读取中' : '暂不可读取'}</strong></div></div>
      <div className="reward-scope"><PixelTag tone="neutral">本地演示，规则待定</PixelTag><Sentence>只保存在本浏览器，按当前账号隔离。<br />不会扣除真实积分，也不会真实发货。</Sentence></div>
    </PixelPanel>
    {syncWarning && <Alert className="reward-notice" type="warning" showIcon title="跨页面显示提醒" description={syncWarning} />}
    {notice && <Alert className="reward-notice" type="success" showIcon title={notice} closable />}
    {error && <Alert className="reward-notice" type="error" showIcon title="演示数据暂不可用" description={<>{error.message}{data && <Sentence>下面保留上次读取的列表，当前兑换条件暂停使用。</Sentence>}</>} action={<PixelButton onClick={store.refresh} loading={refreshing}>重试读取</PixelButton>} />}
    {status === 'loading' && <div className="reward-loading"><Spin /><Sentence>正在读取本账号的演示记录</Sentence></div>}
    {data && <Tabs id="reward-tabs" className="reward-tabs" activeKey={activeTab} onChange={setActiveTab} items={[
      { key: 'gifts', label: '礼品', children: <><div className="reward-section-intro"><h3>礼品陈列架</h3><span>图案与兑换条件均为演示</span></div><div className="reward-gift-grid">{data.gifts.map((item, index) => <PixelPanel as="article" key={item.id} className="reward-gift" data-gift={item.id}>
        <div className="reward-gift-art"><span className="reward-item-number" aria-hidden="true">0{index + 1}</span><RewardArt id={item.id} /><span className="reward-art-caption">礼品演示</span></div>
        <div className="reward-gift-content"><h3>{item.title}</h3><Sentence className="reward-cost"><PixelIcon name="coin" size={20} /><strong>{item.cost}</strong><span>演示积分</span></Sentence><GiftConditions gift={item} available={ready} /><PixelButton block onClick={(event) => open({ kind: 'gift', giftId: item.id }, event)}>查看礼品详情</PixelButton></div>
      </PixelPanel>)}</div><Sentence className="reward-footnote">库存与限兑次数只计算本账号的本地演示记录。</Sentence></> },
      { key: 'ledger', label: '积分明细', children: <RecordList data={data.ledger} ledger /> },
      { key: 'records', label: '兑换记录', children: <RecordList data={data.records} highlight={highlight} /> },
      { key: 'badges', label: '徽章', children: <><div className="reward-section-intro"><h3>探索徽章</h3><span>演示视觉稿 · 正式条件待制定</span></div><div className="reward-badge-grid">{data.badges.map((item) => <PixelPanel as="article" className={`reward-badge ${item.earned ? '' : 'reward-badge--unearned'}`} key={item.id}>
        <div className="reward-badge-art"><RewardArt id={item.id} badge /></div><div><PixelTag tone={item.earned ? 'success' : 'neutral'}>{item.earned ? '演示已获得' : '演示未获得'}</PixelTag><h3>{item.title}</h3><Sentence>{item.description}</Sentence><PixelButton onClick={(event) => open({ kind: 'badge', badgeId: item.id }, event)}>查看徽章详情</PixelButton></div>
      </PixelPanel>)}</div></> },
    ]} />}
    <Modal open={!!dialog} title={title} rootClassName="student-pixel student-interactions reward-modal-root" className="reward-modal" width={560} centered
      closable={busy ? false : { 'aria-label': '关闭弹窗' }} keyboard={!busy} mask={{ closable: !busy }} onCancel={close} footer={footer} focusable={{ trap: true, focusTriggerAfterClose: false }} modalRender={(node) => <div onKeyDownCapture={trapDialogFocus}>{node}</div>}
      afterClose={() => { if (trigger.current?.isConnected) trigger.current.focus(); }}
      afterOpenChange={(isOpen) => { if (isOpen) dialogBody.current?.focus(); }}>
      <div ref={dialogBody} tabIndex={-1} className="reward-dialog-body">
        <span className="reward-dialog-demo">本地演示 · 规则待定</span>
        {(dialog?.kind === 'gift' || dialog?.kind === 'confirm') && gift && <>
          <div className="reward-detail-heading"><RewardArt id={gift.id} /><div><h3>{gift.title}</h3><Sentence className="reward-cost"><strong>{gift.cost}</strong> 演示积分</Sentence></div></div>
          <Sentence>{gift.description}</Sentence><GiftConditions gift={gift} available={ready} />
          {dialog.kind === 'confirm' && <Sentence className="reward-confirm-note">确认后消耗 <strong>{gift.cost} 演示积分</strong>，仅保存本账号的本地记录，不会真实发货。</Sentence>}
          {!ready && <Alert type="warning" title={error?.message || '正在重新核对当前条件'} action={error && <PixelButton onClick={store.refresh} loading={refreshing}>重新核对</PixelButton>} />}
        </>}
        {dialog?.kind === 'badge' && badge && <><div className="reward-badge-detail"><RewardArt id={badge.id} badge /><PixelTag tone={badge.earned ? 'success' : 'neutral'}>{badge.earned ? '演示已获得' : '演示未获得'}</PixelTag></div><Sentence>{badge.description}</Sentence><Sentence className="reward-confirm-note">{badge.condition}</Sentence></>}
        {dialog?.kind === 'reset' && <><Sentence>只清除<strong>当前账号在本浏览器</strong>的奖励演示记录，余额恢复为配置的演示初始值。</Sentence><Sentence>学习成果、报告、作品和其他账号的数据不受影响。</Sentence><Sentence className="reward-confirm-note">此操作会清除演示兑换记录与兑换明细，无法撤销。</Sentence></>}
        {dialog?.kind === 'success' && <><div className="reward-success-mark" aria-hidden="true"><PixelIcon name="check" size={40} /></div><h3 className="reward-success-title">{dialog.record.title}</h3><Sentence className="reward-success-copy">已保存本次本地演示记录，不会发货。</Sentence><dl className="reward-conditions"><div><dt>本次消耗</dt><dd>{dialog.record.cost} 演示积分</dd></div><div><dt>保存时间（北京）</dt><dd>{formatBeijingTime(dialog.record.time)}</dd></div></dl>
          {status === 'ready' && !resultExists && <Alert type="info" title="记录已在其他页面重置，请以当前兑换记录为准。" />}
          {error && <Alert type="warning" title="本次已保存，但当前余额暂不可读取，请重试读取。" />}
        </>}
        {operationError && <Alert className="reward-operation-error" type="error" showIcon title={dialog?.kind === 'reset' ? '未完成重置' : '未完成演示兑换'} description={operationError.message} />}
      </div>
    </Modal>
  </div></PageContainer>;
}
