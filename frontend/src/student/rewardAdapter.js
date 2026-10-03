import { rewardDemoConfig as config } from './rewardConfig.js';

export function createDemoRewardAdapter(storage, accountId) {
  if (!accountId) throw new Error('请先登录');
  const key = `star-voyage:rewards:demo:v1:${accountId}`;
  const initial = () => ({ balance: config.initialPoints, records: [], ledger: [
    { id: 'initial', title: '演示初始积分（非真实发放）', amount: config.initialPoints, time: '' },
  ] });
  const read = () => {
    let saved;
    try { saved = storage.getItem(key); } catch { throw new Error('无法读取当前浏览器的演示数据，请检查存储权限。'); }
    if (!saved) return initial();
    try {
      const value = JSON.parse(saved);
      if (!Number.isFinite(value.balance) || !Array.isArray(value.records) || !Array.isArray(value.ledger)) throw new Error();
      return value;
    } catch { throw new Error('本账号的演示数据损坏，请重置演示数据。'); }
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
  return {
    mode: 'demo',
    load: async () => snapshot(),
    redeem: async (giftId, requestId) => {
      const execute = () => {
        const state = read();
        if (!requestId) throw new Error('缺少兑换确认编号，请重试。');
        const previous = state.records.find((record) => record.id === requestId);
        if (previous) return previous;
        const gift = config.gifts.find((item) => item.id === giftId);
        if (!gift) throw new Error('演示礼品不存在');
        const reason = condition(gift, state);
        if (reason) throw new Error(reason);
        const record = { id: requestId, giftId, title: gift.title, cost: gift.cost, time: new Date().toISOString(), status: '演示兑换成功（不发货）' };
        state.balance -= gift.cost;
        state.records.unshift(record);
        state.ledger.unshift({ id: requestId, title: `演示兑换：${gift.title}`, amount: -gift.cost, time: record.time });
        try { storage.setItem(key, JSON.stringify(state)); } catch { throw new Error('演示保存失败，未扣除积分，请检查浏览器存储空间后重试。'); }
        return record;
      };
      // 同账号多个标签页共享演示记录，串行更新避免余额覆盖。
      if (typeof window !== 'undefined' && globalThis.navigator?.locks) return navigator.locks.request(key, execute);
      return execute();
    },
    reset: async () => { storage.removeItem(key); return snapshot(); },
  };
}

// 未来真实适配器实现 load/redeem 即可；当前没有正式积分接口。
export const createRewardAdapter = createDemoRewardAdapter;
