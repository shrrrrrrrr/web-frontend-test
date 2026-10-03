import { rewardDemoConfig as config } from './rewardConfig.js';
import { rewardStorageKey } from './rewardEvents.js';

function failure(code, message) { return Object.assign(new Error(message), { code }); }

// Lazy access keeps a denied browser getter inside the recoverable operation.
export function createDemoRewardAdapter(storageSource, accountId, options = {}) {
  if (!accountId) throw new Error('请先登录');
  const key = rewardStorageKey(accountId);
  const storage = () => {
    try {
      const value = typeof storageSource === 'function' ? storageSource() : storageSource;
      if (!value) throw new Error();
      return value;
    } catch { throw failure('STORAGE_ACCESS', '浏览器拒绝提供存储，演示余额暂不可读取。请允许本站存储后重试。'); }
  };
  const initial = () => ({ balance: config.initialPoints, records: [], ledger: [
    { id: 'initial', title: '演示初始积分（非真实发放）', amount: config.initialPoints, time: '' },
  ] });
  const read = () => {
    const source = storage();
    let saved;
    try { saved = source.getItem(key); }
    catch { throw failure('READ_FAILED', '无法读取当前浏览器的演示数据，请检查存储权限后重试。'); }
    if (saved === null || saved === undefined) return initial();
    try {
      const value = JSON.parse(saved);
      if (!value || !Number.isFinite(value.balance) || value.balance < 0 || !Array.isArray(value.records) || !Array.isArray(value.ledger)
        || value.records.some((r) => !r || typeof r.id !== 'string' || typeof r.giftId !== 'string' || typeof r.title !== 'string' || !Number.isFinite(r.cost) || typeof r.time !== 'string')
        || value.ledger.some((r) => !r || typeof r.id !== 'string' || typeof r.title !== 'string' || !Number.isFinite(r.amount) || typeof r.time !== 'string')) throw new Error();
      return value;
    } catch { throw failure('CORRUPT_DATA', '本账号的演示数据损坏。可以重试读取，或确认后重置；当前数据尚未清除。'); }
  };
  const condition = (gift, state) => {
    const count = state.records.filter((record) => record.giftId === gift.id).length;
    if (count >= gift.limit) return '已达到演示兑换次数上限';
    if (count >= gift.stock) return '演示库存不足';
    if (state.balance < gift.cost) return `还差 ${gift.cost - state.balance} 演示积分`;
    return '';
  };
  const snapshot = () => {
    const state = read();
    return { ...state, mode: 'demo', gifts: config.gifts.map((gift) => ({ ...gift, blockedReason: condition(gift, state),
      remaining: Math.max(0, gift.stock - state.records.filter((record) => record.giftId === gift.id).length) })), badges: config.badges };
  };
  const exclusive = (execute, signal) => {
    const run = () => { signal?.throwIfAborted(); return execute(); };
    const locks = Object.hasOwn(options, 'locks') ? options.locks : (typeof window !== 'undefined' ? globalThis.navigator?.locks : null);
    // Both writes share an account lock. The synchronous fallback is not cross-tab atomic.
    return locks ? locks.request(key, signal ? { signal } : {}, run) : run();
  };
  return {
    mode: 'demo',
    load: async () => snapshot(),
    redeem: async (giftId, requestId, { signal } = {}) => exclusive(() => {
      const state = read();
      if (!requestId) throw failure('REQUEST_INVALID', '缺少兑换确认编号，请重新打开详情。');
      const previous = state.records.find((record) => record.id === requestId);
      if (previous) return previous;
      const gift = config.gifts.find((item) => item.id === giftId);
      if (!gift) throw failure('REQUEST_INVALID', '演示礼品不存在');
      const reason = condition(gift, state);
      if (reason) throw failure('RULE_BLOCKED', reason);
      const record = { id: requestId, giftId, title: gift.title, cost: gift.cost, time: new Date().toISOString(), status: '演示兑换成功（不发货）' };
      state.balance -= gift.cost;
      state.records.unshift(record);
      state.ledger.unshift({ id: requestId, title: `演示兑换：${gift.title}`, amount: -gift.cost, time: record.time });
      const source = storage();
      try { source.setItem(key, JSON.stringify(state)); }
      catch { throw failure('WRITE_FAILED', '演示保存失败，未扣除积分。请检查浏览器存储空间或权限后，重试本次兑换。'); }
      return record;
    }, signal),
    reset: async ({ signal } = {}) => exclusive(() => {
      const source = storage();
      try { source.removeItem(key); }
      catch { throw failure('RESET_FAILED', '重置失败，演示记录未清除。请检查浏览器存储权限后重试。'); }
      try { return snapshot(); }
      catch { throw failure('RESET_VERIFY', '演示记录已清除，但暂时无法读取重置后的余额。请恢复存储权限后重试读取。'); }
    }, signal),
  };
}

// No formal reward API exists. Preserve the replaceable load/redeem/reset contract.
export const createRewardAdapter = createDemoRewardAdapter;
