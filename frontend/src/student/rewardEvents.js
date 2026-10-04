export const DEMO_REWARDS_CHANGED = 'student-demo-rewards-changed';
export const REWARD_CHANNEL = 'star-voyage-reward-changes-v2';
export const rewardStorageKey = accountId => `star-voyage:rewards:demo:v1:${accountId}`;
export const rewardSyncWarning = '本页会读取已保存记录，但跨页面自动刷新暂不可用。请在其他页面返回或重新读取，不要重复兑换。';
export function notifyDemoRewardsChanged(accountId) {
  let warning = '', channel;
  try {
    channel = new BroadcastChannel(REWARD_CHANNEL);
    channel.postMessage({ accountId: String(accountId) }); // Signal only, never a trusted balance.
  } catch { warning = rewardSyncWarning; }
  finally { try { channel?.close(); } catch { warning = rewardSyncWarning; } }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(DEMO_REWARDS_CHANGED, { detail: { accountId, syncWarning: warning } }));
  return warning;
}
