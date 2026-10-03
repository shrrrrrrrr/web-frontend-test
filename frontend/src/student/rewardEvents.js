export const DEMO_REWARDS_CHANGED = 'student-demo-rewards-changed';
export const rewardStorageKey = (accountId) => `star-voyage:rewards:demo:v1:${accountId}`;

// Same-tab storage writes do not emit the browser storage event.
export function notifyDemoRewardsChanged(accountId) {
  window.dispatchEvent(new CustomEvent(DEMO_REWARDS_CHANGED, { detail: { accountId } }));
}
