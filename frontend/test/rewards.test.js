import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoRewardAdapter } from '../src/student/rewardAdapter.js';
import { createRewardStore } from '../src/student/rewardStore.js';
import { rewardStorageKey, DEMO_REWARDS_CHANGED } from '../src/student/rewardEvents.js';
import { rewardDemoConfig } from '../src/student/rewardConfig.js';
const memory = () => { const values = new Map(); return { values, getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) }; };
const tick = () => new Promise((r) => setImmediate(r));
const denied = () => { throw new Error('injected storage failure'); };

test('奖励契约保持原数值，旧 v1 记录可读，刷新持久且重置只影响本账号', async () => {
  assert.equal(rewardDemoConfig.initialPoints, 120);
  assert.deepEqual(rewardDemoConfig.gifts.map(({ id, cost, stock, limit }) => [id, cost, stock, limit]), [['notebook',40,3,2],['model',160,2,1],['sticker',20,0,1]]);
  assert.deepEqual(rewardDemoConfig.badges.map(({ id, earned }) => [id, earned]), [['record',true],['iterate',false]]);
  const storage = memory();
  const legacy = { balance:80,records:[{id:'legacy',giftId:'notebook',title:'探索笔记本（演示）',cost:40,time:'2026-01-02T03:04:00.000Z',status:'演示兑换成功（不发货）'}],ledger:[{id:'legacy',title:'演示兑换：探索笔记本（演示）',amount:-40,time:'2026-01-02T03:04:00.000Z'},{id:'initial',title:'演示初始积分（非真实发放）',amount:120,time:''}] };
  storage.setItem(rewardStorageKey(1), JSON.stringify(legacy)); storage.setItem('learning:draft:1', 'keep');
  const a=createDemoRewardAdapter(storage,1), b=createDemoRewardAdapter(storage,2);
  assert.equal((await a.load()).records[0].id,'legacy'); assert.equal((await b.load()).balance,120);
  await a.redeem('notebook','new'); await b.redeem('notebook','other');
  assert.equal((await createDemoRewardAdapter(storage,1).load()).balance,40);
  await a.reset(); assert.equal((await a.load()).balance,120);assert.equal((await b.load()).balance,80);assert.equal(storage.getItem('learning:draft:1'),'keep');
});
test('获取、读取、损坏、写入、重置故障分别暴露，不自动删除或伪装成功', async () => {
  await assert.rejects(createDemoRewardAdapter(denied,1).load(),{code:'STORAGE_ACCESS'});
  await assert.rejects(createDemoRewardAdapter({getItem:denied},1).load(),{code:'READ_FAILED'});
  const storage=memory(), a=createDemoRewardAdapter(storage,1);
  for(const corrupt of ['', '{bad', JSON.stringify({balance:120,records:[null],ledger:[]})]) {
    storage.setItem(rewardStorageKey(1),corrupt); await assert.rejects(a.load(),{code:'CORRUPT_DATA'});assert.equal(storage.getItem(rewardStorageKey(1)),corrupt);
  }
  await a.reset();storage.setItem=denied;
  await assert.rejects(a.redeem('notebook','retry'),{code:'WRITE_FAILED'});assert.equal((await a.load()).balance,120);assert.equal((await a.load()).records.length,0);
  storage.removeItem=denied;await assert.rejects(a.reset(),{code:'RESET_FAILED'});
});
test('同一确认失败后复用编号，重复及并发重试只留一条扣分',async()=>{
  const storage=memory(),a=createDemoRewardAdapter(storage,1,{locks:null}),save=storage.setItem;
  storage.setItem=denied;await assert.rejects(a.redeem('notebook','stable-id'));
  storage.setItem=save;await Promise.all([a.redeem('notebook','stable-id'),a.redeem('notebook','stable-id')]);
  const state=await a.load();assert.equal(state.balance,80);assert.equal(state.records.length,1);assert.equal(state.ledger.length,2);
  await assert.rejects(a.redeem('model','no'),{code:'RULE_BLOCKED'});await assert.rejects(a.redeem('sticker','no'),{code:'RULE_BLOCKED'});
  await a.redeem('notebook','second');await assert.rejects(a.redeem('notebook','third'),/上限/);
});
test('兑换与重置使用同一账号锁，两种交叠顺序反映最后保存；取消排队不写入',async()=>{
  const keys=[],storage=memory();let tail=Promise.resolve(),release;
  const locks={request:(key,_options,fn)=>{keys.push(key);const result=tail.then(fn);tail=result.catch(()=>{});return result;}};
  const a=createDemoRewardAdapter(storage,1,{locks}),b=createDemoRewardAdapter(storage,1,{locks});
  tail=new Promise(r=>{release=r;});const redeem=a.redeem('notebook','a'),reset=b.reset();release();await Promise.all([redeem,reset]);assert.equal((await a.load()).balance,120);
  tail=new Promise(r=>{release=r;});const reset2=b.reset(),redeem2=a.redeem('notebook','b');release();await Promise.all([reset2,redeem2]);assert.equal((await a.load()).balance,80);
  tail=new Promise(r=>{release=r;});const controller=new AbortController();const canceled=a.redeem('notebook','c',{signal:controller.signal});controller.abort();release();await assert.rejects(canceled,{name:'AbortError'});assert.equal((await a.load()).balance,80);
  assert.ok(keys.every(key=>key===rewardStorageKey(1)));
});
test('共享状态按账号和键订阅，focus / clear 同步，卸载清理且订阅不重复',async()=>{
  const target=new EventTarget(),storage=memory(),adapter=createDemoRewardAdapter(storage,1);let reads=0;
  const store=createRewardStore({accountId:1,target,adapter:{...adapter,load:()=>{reads++;return adapter.load();}}});
  const off1=store.subscribe(()=>{}),off2=store.subscribe(()=>{});await tick();assert.equal(reads,1);
  const storageEvent=(key)=>Object.assign(new Event('storage'),{key});
  target.dispatchEvent(storageEvent(rewardStorageKey(2)));target.dispatchEvent(new CustomEvent(DEMO_REWARDS_CHANGED,{detail:{accountId:2}}));await tick();assert.equal(reads,1);
  await adapter.redeem('notebook','one');target.dispatchEvent(storageEvent(rewardStorageKey(1)));await tick();assert.equal(store.getSnapshot().data.balance,80);
  await adapter.reset();target.dispatchEvent(new Event('focus'));await tick();assert.equal(store.getSnapshot().data.balance,120);
  target.dispatchEvent(storageEvent(null));target.dispatchEvent(new CustomEvent(DEMO_REWARDS_CHANGED,{detail:{accountId:'1'}}));await tick();assert.equal(reads,5);
  off1();off2();target.dispatchEvent(new Event('focus'));target.dispatchEvent(storageEvent(null));await tick();assert.equal(reads,5);
});
test('交错读取只接受最新快照；短暂故障保留列表但状态失效；卸载后迟到响应无效',async()=>{
  const target=new EventTarget(),pending=[];
  const store=createRewardStore({accountId:1,target,adapter:{load:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}});
  const off=store.subscribe(()=>{});store.refresh();pending[1].resolve({balance:80,gifts:['current']});await tick();pending[0].resolve({balance:120,gifts:['stale']});await tick();assert.equal(store.getSnapshot().data.balance,80);
  store.refresh();pending[2].reject(new Error('read failed'));await tick();assert.equal(store.getSnapshot().status,'error');assert.deepEqual(store.getSnapshot().data.gifts,['current']);
  store.refresh();off();pending[3].resolve({balance:0});await tick();assert.equal(store.getSnapshot().data.balance,80);
});


test('重置已删除但回读失败时明确说明实际结果，不谎称旧记录仍在',async()=>{
  const storage=memory(),adapter=createDemoRewardAdapter(storage,1);await adapter.redeem('notebook','saved');const remove=storage.removeItem;
  storage.removeItem=(key)=>{remove(key);storage.getItem=denied;};await assert.rejects(adapter.reset(),{code:'RESET_VERIFY'});assert.equal(storage.values.has(rewardStorageKey(1)),false);
});
