import { rewardDemoConfig as config } from './rewardConfig.js';
export const rewardFailure = (code, message) => Object.assign(new Error(message), { code });
export const initialRewardState = () => ({ balance: config.initialPoints, records: [], ledger: [
  { id: 'initial', title: '演示初始积分（非真实发放）', amount: config.initialPoints, time: '' },
] });
export function validateRewardState(value) {
  if (!value || !Number.isFinite(value.balance) || value.balance < 0 || !Array.isArray(value.records) || !Array.isArray(value.ledger)
    || value.records.some(r => !r || typeof r.id !== 'string' || typeof r.giftId !== 'string' || typeof r.title !== 'string' || !Number.isFinite(r.cost) || typeof r.time !== 'string')
    || value.ledger.some(r => !r || typeof r.id !== 'string' || typeof r.title !== 'string' || !Number.isFinite(r.amount) || typeof r.time !== 'string'))
    throw rewardFailure('CORRUPT_DATA', '本账号的演示数据损坏。可以重试读取，或确认后重置；当前数据尚未清除。');
  return value;
}
export function rewardCondition(gift, state) {
  const count = state.records.filter(record => record.giftId === gift.id).length;
  if (count >= gift.limit) return '已达到演示兑换次数上限';
  if (count >= gift.stock) return '演示库存不足';
  if (state.balance < gift.cost) return `还差 ${gift.cost - state.balance} 演示积分`;
  return '';
}
export function rewardSnapshot(state) {
  validateRewardState(state);
  return { ...state, mode: 'demo', gifts: config.gifts.map(gift => ({ ...gift, blockedReason: rewardCondition(gift, state),
    remaining: Math.max(0, gift.stock - state.records.filter(record => record.giftId === gift.id).length) })), badges: config.badges };
}
// Pure rule application; the caller must read and apply this inside one readwrite transaction.
export function redeemReward(state, giftId, requestId) {
  validateRewardState(state);
  if (!requestId) throw rewardFailure('REQUEST_INVALID', '缺少兑换确认编号，请重新打开详情。');
  const previous = state.records.find(record => record.id === requestId);
  if (previous) return { record: previous, changed: false };
  const gift = config.gifts.find(item => item.id === giftId);
  if (!gift) throw rewardFailure('REQUEST_INVALID', '演示礼品不存在');
  const reason = rewardCondition(gift, state);
  if (reason) throw rewardFailure('RULE_BLOCKED', reason);
  const record = { id: requestId, giftId, title: gift.title, cost: gift.cost, time: new Date().toISOString(), status: '演示兑换成功（不发货）' };
  state.balance -= gift.cost; state.records.unshift(record);
  state.ledger.unshift({ id: requestId, title: `演示兑换：${gift.title}`, amount: -gift.cost, time: record.time });
  return { record, changed: true };
}
