import { rewardFailure } from './rewardModel.js';
export const REWARD_DATABASE = 'star-voyage-rewards';
export const REWARD_STORE = 'accounts';
export function openRewardDatabase(factorySource, name = REWARD_DATABASE) {
  return new Promise((resolve, reject) => {
    let factory, request, settled = false;
    const fail = (code, text) => { if (!settled) { settled = true; reject(rewardFailure(code, text)); } };
    try {
      factory = typeof factorySource === 'function' ? factorySource() : factorySource;
      if (!factory) throw Error();
    } catch { fail('DB_UNAVAILABLE', '浏览器不允许访问奖励数据库。请允许本站存储后重试，不会改用临时余额。'); return; }
    try { request = factory.open(name, 1); }
    catch { fail('DB_OPEN', '无法打开本浏览器的奖励数据库。请检查站点存储权限后重试。'); return; }
    request.onblocked = () => fail('DB_BLOCKED', '其他旧页面正在占用奖励数据库。请关闭或刷新旧页面，再重试读取。');
    request.onerror = () => fail('DB_OPEN', '无法打开本浏览器的奖励数据库。请检查站点存储权限后重试。');
    request.onupgradeneeded = () => {
      if (settled) { request.transaction.abort(); return; }
      try {
        if (!request.result.objectStoreNames.contains(REWARD_STORE)) request.result.createObjectStore(REWARD_STORE, { keyPath: 'accountId' });
      } catch {
        fail('DB_OPEN', '奖励数据库初始化失败，原记录未改变。请检查存储权限后重试。');
        request.transaction.abort();
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (settled) { db.close(); return; }
      settled = true;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}
// No async work inside operate: queue requests now and in request callbacks only.
// An aborted transaction never resolves, even if an earlier put request succeeded.
export function rewardTransaction(db, mode, operate, { signal, write = false } = {}) {
  return new Promise((resolve, reject) => {
    let transaction, result, failure;
    const aborted = () => { try { transaction.abort(); } catch { /* Already committed: await complete, do not claim rollback. */ } };
    const cleanup = () => signal?.removeEventListener('abort', aborted);
    const databaseError = () => rewardFailure(write ? 'WRITE_FAILED' : 'READ_FAILED', write
      ? '奖励事务未提交，原已保存记录未改变。请检查存储权限或空间后重试本次操作。'
      : '暂时无法读取奖励数据库。请恢复存储权限后重新读取。');
    if (signal?.aborted) { reject(signal.reason || new DOMException('操作已取消', 'AbortError')); return; }
    try { transaction = db.transaction(REWARD_STORE, mode); }
    catch { reject(databaseError()); return; }
    transaction.oncomplete = () => { cleanup(); resolve(result); };
    transaction.onabort = () => { cleanup(); reject(failure || (signal?.aborted ? signal.reason : null) || databaseError()); };
    transaction.onerror = () => { /* Default request handling aborts the transaction. */ };
    signal?.addEventListener('abort', aborted, { once: true });
    const fail = error => { failure = typeof error?.code === 'string' ? error : databaseError(); aborted(); };
    try { operate(transaction.objectStore(REWARD_STORE), value => { result = value; }, fail); }
    catch (error) { fail(error?.code ? error : databaseError()); }
  });
}
