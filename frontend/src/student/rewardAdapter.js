import { rewardStorageKey, notifyDemoRewardsChanged } from './rewardEvents.js';
import { initialRewardState, validateRewardState, redeemReward, rewardSnapshot, rewardFailure } from './rewardModel.js';
import { openRewardDatabase, rewardTransaction, REWARD_DATABASE } from './rewardDatabase.js';

const corrupt = () => rewardFailure('CORRUPT_DATA', '本账号的演示数据损坏。可以重试读取，或确认后重置；当前数据尚未清除。');
function validateAccount(record) {
  if (!record?.initialized || record.schemaVersion !== 1 || !Number.isInteger(record.revision) || record.revision < 1) throw corrupt();
  validateRewardState(record.state);
  return record;
}
// The first argument is a v1 migration source only. It is never a write destination.
export function createDemoRewardAdapter(storageSource, accountId, options = {}) {
  if (!accountId) throw new Error('请先登录');
  const key = rewardStorageKey(accountId), id = String(accountId);
  const databaseName = options.databaseName || REWARD_DATABASE;
  const factory = Object.hasOwn(options, 'indexedDB') ? options.indexedDB : (() => window.indexedDB);
  let syncWarning = '', initialized = false;
  const legacyState = () => {
    let storage, saved;
    try {
      storage = typeof storageSource === 'function' ? storageSource() : storageSource;
      if (!storage) throw Error();
    } catch { throw rewardFailure('STORAGE_ACCESS', '浏览器拒绝读取旧版演示记录。请允许本站存储后重试；旧记录尚未改变。'); }
    try { saved = storage.getItem(key); }
    catch { throw rewardFailure('READ_FAILED', '无法读取本账号的旧版演示记录，请恢复存储权限后重试。'); }
    if (saved === null || saved === undefined) return { state: initialRewardState(), source: 'new' };
    try { return { state: validateRewardState(JSON.parse(saved)), source: 'v1' }; }
    catch { throw corrupt(); }
  };
  const read = db => rewardTransaction(db, 'readonly', (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => done(request.result);
  });
  const ensure = async (db, signal) => {
    const existing = await read(db);
    if (existing !== undefined) return validateAccount(existing); // Do not touch localStorage again.
    const legacy = legacyState(); // Preparation outside the live readwrite transaction.
    return rewardTransaction(db, 'readwrite', (store, done, fail) => {
      const request = store.get(id);
      request.onsuccess = () => {
        try {
          if (request.result !== undefined) { done(validateAccount(request.result)); return; }
          const account = { accountId: id, schemaVersion: 1, initialized: true, source: legacy.source,
            initializedAt: new Date().toISOString(), revision: 1, state: legacy.state };
          store.put(account); done(account);
        } catch (error) { fail(error); }
      };
    }, { signal, write: true });
  };
  const withDatabase = async operation => {
    const db = await openRewardDatabase(factory, databaseName);
    try { return await operation(db); } finally { db.close(); }
  };
  const change = async (kind, giftId, requestId, { signal } = {}) => {
    signal?.throwIfAborted();
    const result = await withDatabase(async db => {
      if (kind !== 'reset' && !initialized) { await ensure(db, signal); initialized = true; }
      return rewardTransaction(db, 'readwrite', (store, done, fail) => {
        const request = store.get(id);
        request.onsuccess = () => {
          try {
            const existing = request.result;
            if (kind === 'reset') {
              // Confirmed reset also recovers corrupt/missing state, without reading a broken v1 source.
              const account = { accountId: id, schemaVersion: 1, initialized: true, source: 'reset',
                initializedAt: existing?.initializedAt || new Date().toISOString(),
                revision: Number.isInteger(existing?.revision) && existing.revision >= 1 ? existing.revision + 1 : 1, state: initialRewardState() };
              store.put(account); done(rewardSnapshot(account.state)); return;
            }
            const account = validateAccount(existing);
            const { record, changed } = redeemReward(account.state, giftId, requestId);
            if (changed) { account.revision++; store.put(account); }
            done(record);
          } catch (error) { fail(error); }
        };
      }, { signal, write: true });
    });
    // This runs only after complete. Broadcast failure must never turn a committed write into failure.
    initialized = true;
    syncWarning = notifyDemoRewardsChanged(accountId);
    return result;
  };
  return {
    mode: 'demo',
    load: () => withDatabase(async db => { const account = await ensure(db); initialized = true; return { ...rewardSnapshot(account.state), syncWarning }; }),
    redeem: (giftId, requestId, settings) => change('redeem', giftId, requestId, settings),
    reset: settings => change('reset', undefined, undefined, settings),
  };
}
export const createRewardAdapter = createDemoRewardAdapter;
