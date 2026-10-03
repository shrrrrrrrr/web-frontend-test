import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(root, 'backend/package.json'));
const Database = require('better-sqlite3');
const scratch = mkdtempSync(path.join(tmpdir(), 'star-voyage-round8-'));
const shots = path.join(root, process.env.ROUND8_CAPTURE_DELIVERY === '1' ? 'docs/round-08/screenshots' : 'test-results/round8');
const base = 'http://127.0.0.1:5189';
const apiBase = 'http://127.0.0.1:3127';
const env = { ...process.env, NODE_ENV: 'test', DB_PATH: path.join(scratch, 'round8.db'),
  JWT_SECRET: randomBytes(32).toString('hex'), UPLOAD_PATH: path.join(scratch, 'uploads'),
  FEEDBACK_UPLOAD_PATH: path.join(scratch, 'feedback'), CORS_ORIGIN: base, API_PROXY_TARGET: apiBase,
  GLIDER_BACKEND: 'reference', GLIDER_PYTHON: path.join(root,'.venv/Scripts/python.exe'), GLIDER_RENDERER: 'mpl', VITE_STUDENT_TEST_CONFIG: '1', LOGIN_RATE_LIMIT_IP: '500', LOGIN_RATE_LIMIT_USER: '500' };
const viewports = [[1440, 900, 'desktop-1440'], [768, 1024, 'tablet-768'], [390, 844, 'mobile-390']];
async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Service did not start: ${url}`);
}
async function login(page, username = 'student_wang', password = 'student123') {
  await page.goto(`${base}/login`);
  await page.getByPlaceholder('账号', { exact: true }).fill(username);
  await page.getByPlaceholder('密码', { exact: true }).fill(password);
  await page.getByRole('button', { name: /登\s*录/ }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '页面无横向溢出');
}
async function visibleAction(locator) {
  await locator.scrollIntoViewIfNeeded();
  assert.ok(await locator.evaluate((element) => {
    const r = element.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return r.top >= 64 && r.bottom <= innerHeight && (hit === element || element.contains(hit));
  }), '实际操作未被顶栏或伙伴遮挡');
}
async function shot(page, name, firstScreen = true) {
  await page.locator('.ant-message-notice').last().waitFor({ state: 'hidden', timeout: 10000 });
  if (firstScreen) await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(180);
  await noOverflow(page);
  await page.screenshot({ path: path.join(shots, name + '.png'), fullPage: false, animations: 'disabled' });
}
async function sizes(page, name, focus) {
  for (const [width, height, label] of viewports) {
    await page.setViewportSize({ width, height });
    if (focus) await focus.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await shot(page, `${name}-${label}`, !focus);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}


test('第八轮：奖励视觉、本地存储与双标签一致性', { timeout: 360000 }, async (t) => {
  mkdirSync(shots,{recursive:true});mkdirSync(path.join(root,'test-results'),{recursive:true});
  execFileSync(process.execPath,['database/init.js'],{cwd:path.join(root,'backend'),env,stdio:'pipe'});
  const db=new Database(env.DB_PATH);
  db.prepare("UPDATE courses SET title=title||'（测试课程）'").run();
  const server=spawn(process.execPath,['-e',"require('./app').listen(3127,'127.0.0.1')"],{cwd:path.join(root,'backend'),env,windowsHide:true,stdio:'pipe'});
  const vite=spawn(process.execPath,[path.join(root,'frontend/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5189','--strictPort'],{cwd:path.join(root,'frontend'),env,windowsHide:true,stdio:'pipe'});
  let logs='',browser;
  for(const child of [server,vite]){child.stdout.on('data',c=>logs+=c);child.stderr.on('data',c=>logs+=c);}
  try {
    await Promise.all([waitFor(base),waitFor(apiBase+'/api/health')]);
    browser=await chromium.launch({channel:'msedge',headless:true});
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage();page.setDefaultTimeout(12000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const key='star-voyage:rewards:demo:v1:4';
    const button=(name,p=page)=>p.getByRole('button',{name,exact:true});
    const tab=(name,p=page)=>p.getByRole('tab',{name,exact:true}).click();
    const balance=async(value,p=page)=>{await p.getByTestId('reward-balance').getByText(String(value),{exact:true}).waitFor();await p.getByTestId('header-demo-points').getByText(String(value),{exact:true}).waitFor();};
    const saved=(p=page)=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    const gift=async(id='notebook',p=page)=>{await tab('礼品',p);await p.locator('[data-gift='+id+']').getByRole('button',{name:'查看礼品详情',exact:true}).click();};
    const start=async(p=page)=>{await gift('notebook',p);await button('演示兑换',p).click();};
    const close=async(p=page)=>{await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});};
    const reset=async(p=page)=>{await button('重置演示数据',p).click();await button('确认重置演示数据',p).click();await p.getByRole('dialog').waitFor({state:'hidden'});await balance(120,p);};
    const sync=()=>page.evaluate(()=>window.dispatchEvent(new CustomEvent('student-demo-rewards-changed',{detail:{accountId:4}})));
    const scenario=async(name,run)=>{let failure;await t.test(name,async()=>{try{await run();}catch(error){failure=error;console.error(page.url(),(await page.locator('body').innerText()).slice(0,6000));await page.screenshot({path:path.join(root,'test-results/round8-failure.png'),fullPage:true});throw error;}});if(failure)throw failure;};
    await login(page);await page.getByTestId('header-demo-points').click();await balance(120);
    await scenario('真实浏览器演示：四标签、三尺寸、详情取消与键盘焦点',async()=>{
      assert.equal(await saved(),null);
      await sizes(page,'01-gifts-demo-first');
      assert.ok(await page.locator('[data-gift=notebook]').evaluate(el=>el.getBoundingClientRect().top<900));
      await tab('兑换记录');await page.getByText('还没有演示兑换记录',{exact:true}).waitFor();await sizes(page,'02-empty-records-demo-first');
      await tab('积分明细');await page.getByText('演示初始值 · 无发放时间',{exact:true}).waitFor();await sizes(page,'03-ledger-initial-demo-first');
      await tab('徽章');await sizes(page,'04-badges-demo-first');
      for(const [index,id] of [[0,'earned'],[1,'unearned']]){
        const trigger=button('查看徽章详情').nth(index);await trigger.focus();await page.keyboard.press('Enter');
        await sizes(page,'05-badge-'+id+'-demo-modal');await close();assert.ok(await trigger.evaluate(el=>el===document.activeElement));
      }
      await gift();await sizes(page,'06-gift-detail-demo-modal');
      await button('演示兑换').click();await sizes(page,'07-confirm-demo-modal');await button('返回详情').click();await close();await balance(120);assert.equal(await saved(),null);
      for(const [id,reason,prefix] of [['model','还差 40 演示积分','08-insufficient'],['sticker','演示库存不足','09-out-of-stock']]){
        await gift(id);assert.ok(await button('演示兑换').isDisabled());await page.getByRole('dialog').getByText(reason,{exact:true}).waitFor();await sizes(page,prefix+'-demo-modal');await close();
      }
      await page.getByRole('tab',{name:'礼品',exact:true}).focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.locator('#reward-tabs-tab-ledger').getAttribute('aria-selected').then(v=>assert.equal(v,'true'));
    });
    await scenario('写入失败保留同次确认，快速重复与重试仅一条扣分，刷新持久化',async()=>{
      await page.evaluate(()=>{window.rewardTestSet=Storage.prototype.setItem;window.rewardTestIds=[];Storage.prototype.setItem=function(k,v){if(k.startsWith('star-voyage:rewards:')){window.rewardTestIds.push(JSON.parse(v).records[0].id);throw new DOMException('Injected quota','QuotaExceededError');}return window.rewardTestSet.call(this,k,v);};});
      await start();await button('确认演示兑换').click();await page.getByText('未完成演示兑换',{exact:true}).waitFor();assert.equal(await page.getByRole('dialog').count(),1);await balance(120);assert.equal(await saved(),null);
      await sizes(page,'10-write-failure-injected-modal');
      await page.evaluate(()=>{Storage.prototype.setItem=function(k,v){if(k.startsWith('star-voyage:rewards:'))window.rewardTestIds.push(JSON.parse(v).records[0].id);return window.rewardTestSet.call(this,k,v);};});
      await button('重试本次兑换').evaluate(el=>{el.click();el.click();});
      await page.getByText('演示兑换成功',{exact:true}).waitFor();await balance(80);
      const ids=await page.evaluate(()=>window.rewardTestIds);assert.equal(new Set(ids).size,1);assert.equal((await saved()).records.length,1);
      await sizes(page,'11-success-demo-modal');await button('查看本次兑换记录').click();await page.getByText('本次兑换',{exact:true}).waitFor();
      await sizes(page,'12-records-demo-first');await tab('积分明细');await sizes(page,'13-ledger-demo-first');
      await page.evaluate(()=>{Storage.prototype.setItem=window.rewardTestSet;});await page.reload();await balance(80);
      await start();await button('确认演示兑换').click();await page.getByText('演示兑换成功',{exact:true}).waitFor();await button('返回礼品').click();await balance(40);
      await gift();await page.getByRole('dialog').getByText('已达到演示兑换次数上限',{exact:true}).waitFor();assert.ok(await button('演示兑换').isDisabled());await sizes(page,'14-limit-demo-modal');await close();
    });
    await scenario('存储 getter / getItem / 损坏 / removeItem 故障可恢复，不白屏或自动删除',async()=>{
      await page.evaluate(()=>{window.rewardTestDescriptor=Object.getOwnPropertyDescriptor(window,'localStorage');Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Injected getter denial','SecurityError');}});});
      await sync();await page.getByTestId('reward-balance').getByText('暂不可读取',{exact:true}).waitFor();assert.match(await page.getByTestId('header-demo-points').innerText(),/—/);await page.getByText(/浏览器拒绝提供存储/).waitFor();await sizes(page,'15-storage-getter-injected-first');
      await page.evaluate(()=>Object.defineProperty(window,'localStorage',window.rewardTestDescriptor));await button('重试读取').click();await balance(40);
      await page.evaluate(()=>{window.rewardTestGet=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k.startsWith('star-voyage:rewards:'))throw new Error('Injected read failure');return window.rewardTestGet.call(this,k);};});
      await sync();await page.getByText(/无法读取当前浏览器的演示数据/).waitFor();await sizes(page,'16-read-failure-injected-first');
      await page.evaluate(()=>{Storage.prototype.getItem=window.rewardTestGet;});await button('重试读取').click();await balance(40);
      const previous=await saved();await page.evaluate(k=>localStorage.setItem(k,'{broken-json'),key);await sync();await page.getByText(/本账号的演示数据损坏/).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'{broken-json');await sizes(page,'17-corrupt-injected-first');
      await button('重置演示数据').click();await sizes(page,'18-reset-demo-modal');await button('取消').click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'{broken-json');
      await page.evaluate(()=>{window.rewardTestRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k.startsWith('star-voyage:rewards:'))throw new Error('Injected reset failure');return window.rewardTestRemove.call(this,k);};});
      await button('重置演示数据').click();await button('确认重置演示数据').click();await page.getByText('未完成重置',{exact:true}).waitFor();await sizes(page,'19-reset-failure-injected-modal');assert.equal(await page.getByRole('dialog').count(),1);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'{broken-json');
      await page.evaluate(()=>{Storage.prototype.removeItem=window.rewardTestRemove;});await button('重试重置').click();await page.getByRole('dialog').waitFor({state:'hidden'});await balance(120);
      await page.evaluate(({key,previous})=>localStorage.setItem(key,JSON.stringify(previous)),{key,previous});await sync();await balance(40);await reset();
    });
    await scenario('实际双标签 storage 同步：详情、顶栏、列表、焦点和清空事件',async()=>{
      const second=await context.newPage();second.setDefaultTimeout(12000);second.on('pageerror',e=>errors.push(e.message));await second.goto(base+'/archives/rewards');await balance(120,second);
      await gift('model',second);await start();await button('确认演示兑换').click();await page.getByText('演示兑换成功',{exact:true}).waitFor();await balance(80);await balance(80,second);await second.getByRole('dialog').getByText('还差 80 演示积分',{exact:true}).waitFor();
      await close(second);await tab('积分明细',second);await second.locator('.reward-amount strong').getByText('-40',{exact:true}).waitFor();
      await tab('兑换记录',second);await second.getByText('演示兑换成功（不发货）',{exact:true}).waitFor();
      await button('返回礼品').click();await reset();await balance(120,second);assert.equal(await second.getByRole('tab',{name:'兑换记录',exact:true}).getAttribute('aria-selected'),'true');await second.getByText('还没有演示兑换记录',{exact:true}).waitFor();
      // A controlled same-page write deliberately omits the custom event; returning focus repairs it.
      await second.evaluate(async()=>{const {createRewardAdapter}=await import('/src/student/rewardAdapter.js');await createRewardAdapter(localStorage,4).redeem('notebook','focus-case');});
      await second.evaluate(()=>window.dispatchEvent(new Event('focus')));await balance(80,second);await balance(80);
      await second.evaluate(k=>{localStorage.removeItem(k);window.dispatchEvent(new StorageEvent('storage',{key:null}));},key);await balance(120,second);await balance(120);
      await second.close();
    });
    await scenario('实际 Web Locks：双标签兑换与重置排队，两个顺序及最终 UI 一致',async()=>{
      const second=await context.newPage();await second.goto(base+'/archives/rewards');await balance(120,second);
      const hold=async()=>{await second.evaluate(k=>{window.rewardLockReady=false;window.rewardLockDone=navigator.locks.request(k,()=>{window.rewardLockReady=true;return new Promise(r=>{window.releaseRewardLock=r;});});},key);await second.waitForFunction(()=>window.rewardLockReady);};
      const release=()=>second.evaluate(()=>{window.releaseRewardLock();});
      const waitQueue=async(count)=>{await second.waitForFunction(async({key,count})=>(await navigator.locks.query()).pending.filter(x=>x.name===key).length===count,{key,count});};
      await hold();await start();await button('确认演示兑换').click();await waitQueue(1);await button('重置演示数据',second).click();await button('确认重置演示数据',second).click();await waitQueue(2);
      assert.equal(await page.getByRole('dialog').count(),1);await release();await balance(120);await balance(120,second);await second.getByRole('dialog').waitFor({state:'hidden'});await page.getByText('演示记录已变化',{exact:true}).waitFor();await button('返回礼品').click();assert.equal(await saved(),null);
      await hold();await button('重置演示数据',second).click();await button('确认重置演示数据',second).click();await waitQueue(1);await start();await button('确认演示兑换').click();await waitQueue(2);await release();await page.getByText('演示兑换成功',{exact:true}).waitFor();await balance(80);await balance(80,second);assert.equal((await saved()).records.length,1);await button('返回礼品').click();
      await hold();await start();await start(second);await button('确认演示兑换').click();await button('确认演示兑换',second).click();await waitQueue(2);await release();await balance(40);await balance(40,second);assert.equal((await saved()).records.length,2);assert.equal(await page.getByRole('dialog').count(),1);assert.equal(await second.getByRole('dialog').count(),1);
      // Only one additional redemption fits the unchanged per-account limit.
      assert.equal(await page.getByText('未完成演示兑换',{exact:true}).count()+await second.getByText('未完成演示兑换',{exact:true}).count(),1);
      await close();await close(second);await reset();await second.close();
    });
    await scenario('离开与退出清理在途操作，账号隔离，无锁同步回退，其他角色无学生弹层',async()=>{
      const holder=await context.newPage();await holder.goto(base+'/archives/rewards');await balance(120,holder);
      const hold=async()=>{await holder.evaluate(k=>{window.ready=false;navigator.locks.request(k,()=>{window.ready=true;return new Promise(r=>{window.release=r;});});},key);await holder.waitForFunction(()=>window.ready);};
      await hold();await start();await button('确认演示兑换').click();
      // Browser history navigation unmounts the reward page even while a modal operation is pending.
      await page.evaluate(()=>{history.pushState({},'', '/archives');window.dispatchEvent(new PopStateEvent('popstate'));});
      await page.locator('.archive-workspace').waitFor();await holder.evaluate(()=>window.release());await page.waitForTimeout(100);assert.equal(await saved(),null);assert.equal(await page.getByRole('dialog').count(),0);
      await page.getByTestId('header-demo-points').click();await balance(120);await hold();await start();await button('确认演示兑换').click();
      // Existing cross-tab auth protocol forces reload, destroying this account's outstanding page.
      await holder.evaluate(()=>{localStorage.removeItem('token');localStorage.removeItem('refresh_token');localStorage.removeItem('user');});
      await page.waitForURL('**/login');await holder.evaluate(()=>window.release());await holder.close();
      await login(page,'student_chen');await page.getByTestId('header-demo-points').click();await balance(120);assert.equal(await page.getByRole('dialog').count(),0);
      await page.evaluate(()=>Object.defineProperty(navigator,'locks',{configurable:true,value:undefined}));
      await start();await button('确认演示兑换').click();await page.getByText('演示兑换成功',{exact:true}).waitFor();await balance(80);await button('返回礼品').click();assert.equal(await saved(),null);
      await page.evaluate(()=>delete navigator.locks);
      await button('个人中心').click();await page.getByRole('menuitem',{name:'退出登录',exact:true}).click();await login(page);await page.getByTestId('header-demo-points').click();await balance(120);
      for(const [username,password] of [['adminpbl','admin123'],['mentor_zhang','mentor123'],['teacher_li','teacher123']]){
        const other=await browser.newPage();await login(other,username,password);assert.equal(await other.locator('.student-pixel').count(),0);await other.goto(base+'/archives/rewards');await other.getByText('当前身份无法访问此页面',{exact:true}).waitFor();assert.equal(await other.locator('.reward-workspace,.reward-modal-root').count(),0);await other.close();
      }
      assert.deepEqual(errors,[]);
    });
    await scenario('长历史与窄屏分页、弹窗焦点约束、素材正常加载',async()=>{
      await page.evaluate(async()=>{
        const {createRewardAdapter}=await import('/src/student/rewardAdapter.js');const initial=await createRewardAdapter(localStorage,4).load();
        const records=Array.from({length:11},(_,i)=>({id:'history-'+i,giftId:'notebook',title:'探索笔记本（演示）— 历史兼容布局测试，较长名称仍应完整换行 '+i,cost:40,time:'2026-01-02T03:04:00.000Z',status:'演示兑换成功（不发货）'}));
        localStorage.setItem('star-voyage:rewards:demo:v1:4',JSON.stringify({...initial,records}));window.dispatchEvent(new CustomEvent('student-demo-rewards-changed',{detail:{accountId:4}}));
      });
      await tab('兑换记录');await page.getByRole('listitem',{name:'2',exact:true}).click();assert.equal(await page.locator('.reward-record-list>li').count(),3);await sizes(page,'20-long-records-fixture-scrolled',page.locator('.reward-history'));
      await reset();await gift();await page.setViewportSize({width:390,height:844});
      for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>!!document.activeElement.closest('.ant-modal')));}
      await visibleAction(button('演示兑换'));await noOverflow(page);await close();await page.setViewportSize({width:1440,height:900});
      assert.equal(await page.locator('.reward-art img').evaluateAll(imgs=>imgs.filter(img=>!img.complete||!img.naturalWidth).length),0);
      assert.deepEqual(errors,[]);
    });

    await scenario('拒绝存储后首次挂载奖励页仍可重试，背景更新保留标签与滚动',async()=>{
      await page.locator('.study-header-context a').click();await page.locator('.archive-counts dd').first().waitFor();
      await page.evaluate(()=>{window.rewardTestDescriptor=Object.getOwnPropertyDescriptor(window,'localStorage');Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Injected getter denial before reward mount','SecurityError');}});});
      await page.getByTestId('header-demo-points').click();await page.getByTestId('reward-balance').getByText('暂不可读取',{exact:true}).waitFor();assert.equal(await page.locator('.reward-workspace').count(),1);
      await page.evaluate(()=>Object.defineProperty(window,'localStorage',window.rewardTestDescriptor));await button('重试读取').click();await balance(120);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
      await page.setViewportSize({width:390,height:844});await page.locator('[data-gift=sticker]').scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);await sync();await balance(120);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<2);await tab('徽章');await sync();assert.equal(await page.locator('#reward-tabs-tab-badges').getAttribute('aria-selected'),'true');await page.setViewportSize({width:1440,height:900});assert.deepEqual(errors,[]);
    });
  } finally {if(browser)await browser.close();server.kill();vite.kill();db.close();writeFileSync(path.join(root,'test-results/round8-server.log'),logs);}
});
