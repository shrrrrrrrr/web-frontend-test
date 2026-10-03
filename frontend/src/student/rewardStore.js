import { DEMO_REWARDS_CHANGED, rewardStorageKey } from './rewardEvents.js';

// One account snapshot is shared by the header and page. No fallback persistence.
export function createRewardStore({ accountId, adapter, target }) {
  let state = { data: null, status: 'loading', error: null, refreshing: false };
  let sequence = 0;
  const listeners = new Set();
  const publish = (next) => { state = next; listeners.forEach((listener) => listener()); };
  const refresh = async () => {
    if (!listeners.size) return;
    const ticket = ++sequence;
    publish({ ...state, refreshing: true });
    try {
      const data = await adapter.load();
      if (ticket === sequence && listeners.size) publish({ data, status: 'ready', error: null, refreshing: false });
    } catch (error) {
      if (ticket === sequence && listeners.size) publish({ ...state, status: 'error', error, refreshing: false });
    }
  };
  const onStorage = (event) => { if (event.key === null || event.key === rewardStorageKey(accountId)) refresh(); };
  const onChange = (event) => { if (String(event.detail?.accountId) === String(accountId)) refresh(); };
  const subscribe = (listener) => {
    listeners.add(listener);
    if (listeners.size === 1) {
      target.addEventListener('focus', refresh);
      target.addEventListener('storage', onStorage);
      target.addEventListener(DEMO_REWARDS_CHANGED, onChange);
      refresh();
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size) {
        sequence++;
        target.removeEventListener('focus', refresh);
        target.removeEventListener('storage', onStorage);
        target.removeEventListener(DEMO_REWARDS_CHANGED, onChange);
      }
    };
  };
  const mutate = async (operation) => {
    try { return await operation(); }
    finally { await refresh(); }
  };
  return { subscribe, getSnapshot: () => state, refresh,
    redeem: (...args) => mutate(() => adapter.redeem(...args)),
    reset: (...args) => mutate(() => adapter.reset(...args)),
  };
}
