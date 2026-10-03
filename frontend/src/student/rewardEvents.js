export const DEMO_REWARDS_CHANGED = 'student-demo-rewards-changed';

// Same-tab storage writes do not emit the browser storage event.
export function notifyDemoRewardsChanged(accountId) {
  window.dispatchEvent(new CustomEvent(DEMO_REWARDS_CHANGED, { detail: { accountId } }));
}
