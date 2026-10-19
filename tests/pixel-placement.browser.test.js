import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {chromium} from 'playwright';
import {prepareMotionFixture,serveFixture,root} from './pixel-motion-fixture.mjs';
import placements from '../frontend/src/motion/placements.json' with {type:'json'};
import {projectPlacement,imagePosition} from '../frontend/src/motion/placement.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('场景源坐标、真实裁切像素及反证（不依赖小器件）',{timeout:300000},async t=>{
 const f=prepareMotionFixture(3584,4614),runtime=await serveFixture(f,3584,4614),browser=await chromium.launch({channel:'msedge',headless:true});
 const out=path.join(root,'docs/pixel-motion/placement-patch'),images=path.join(out,'images');fs.mkdirSync(images,{recursive:true});const records=[],contexts=[],errors=[];
 const scenario=(name,fn)=>process.env.PBL_PLACEMENT_ONLY&&!process.env.PBL_PLACEMENT_ONLY.split('|').some(part=>name.includes(part))?Promise.resolve():t.test(name,fn);
 const page=async(role,viewport={width:1440,height:900})=>{const c=await browser.newContext({viewport}),p=await c.newPage();contexts.push(c);p.on('pageerror',e=>errors.push(e.message));await p.goto(runtime.base+'/login');if(role){await p.getByLabel('账号',{exact:true}).fill('mentor_review_'+role);await p.getByLabel('密码',{exact:true}).fill(f.password);await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForURL(u=>u.pathname!='/login');}return p;};
 async function actualChange(p,locator,label,{save=false}={}){
  await p.bringToFront();await locator.waitFor({state:'visible'});await locator.scrollIntoViewIfNeeded();
  const box=await locator.boundingBox();assert.ok(box.width>0&&box.height>0,label+' is visible');
  const shots=[],frames=[];
  for(let n=0;n<8;n++){shots.push(await locator.screenshot());frames.push(await locator.getAttribute('data-frame'));await p.waitForTimeout(280);if(new Set(shots.map(hash)).size>1)break;}
  if(new Set(shots.map(hash)).size<=1)await p.screenshot({path:path.join(images,'DEBUG-'+label+'.png')});
  assert.ok(new Set(shots.map(hash)).size>1,label+' target pixels must change, independently of the dock '+JSON.stringify({box,frames,state:await locator.getAttribute('data-motion-state')}));
  // Rendering the very same crop with only this target hidden proves the changing ink is not occluded.
  await locator.evaluate(e=>e.style.visibility='hidden');const absent=await p.screenshot({clip:box});await locator.evaluate(e=>e.style.visibility='');
  assert.ok(shots.some(s=>hash(s)!==hash(absent)),label+' visible ink must differ from absent target');
  const row={label,box,frames,hashes:shots.map(hash),absentHash:hash(absent),status:'passed'};records.push(row);
  if(save){fs.writeFileSync(path.join(images,label+'-a.png'),shots[0]);fs.writeFileSync(path.join(images,label+'-b.png'),shots.at(-1));await p.screenshot({path:path.join(images,label+'-page.png')});}
  return row;
 }
 async function alignment(locator){
  await locator.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const info=await locator.evaluate(e=>{const host=e.parentElement,img=host.dataset.motionBackground?null:host.parentElement.querySelector('img'),r=host.getBoundingClientRect(),s=e.getBoundingClientRect(),css=img?getComputedStyle(img):getComputedStyle(host.parentElement,'::before');return {key:host.dataset.motionScene,kind:host.dataset.motionKind,id:e.dataset.motionId,slot:e.dataset.motionSlot,host:{x:r.x,y:r.y,width:r.width,height:r.height},sprite:{x:s.x,y:s.y,width:s.width,height:s.height},fit:img?css.objectFit:'cover',position:img?css.objectPosition:css.backgroundPosition,currentSrc:img?.currentSrc};});
  const config=placements[info.kind][info.key],item=config.items[Number(info.slot)];assert.ok(item,'known source semantic region');
  const expected=projectPlacement({width:info.host.width,height:info.host.height,sourceWidth:config.size[0],sourceHeight:config.size[1],fit:info.fit,position:imagePosition(info.position)},item);assert.ok(expected);
  for(const name of ['x','y'])assert.ok(Math.abs(info.sprite[name]-info.host[name]-expected[name])<1.1,info.key+' exact crop mapping '+name+' '+JSON.stringify({info,expected}));
  records.push({label:info.key+'-alignment',...info,semantic:item.semantic,sourcePoint:item.point,sourceRegion:item.region,projection:expected,status:'passed'});
 }
 try{
  await scenario('五个登录尺寸：水面区域、像素变帧、暂停和减少运动；表单可操作',async()=>{
   const p=await page();for(const[width,height]of[[1440,900],[768,1024],[390,844],[360,640],[844,390]]){
    await p.setViewportSize({width,height});await p.goto(runtime.base+'/login');const key=width<768?'login-mobile':'login-desktop',target=p.locator(`[data-motion-scene="${key}"] [data-motion-id="campus-water"]`);
    await target.waitFor();await alignment(target);await actualChange(p,target,'login-'+width+'x'+height,{save:true});
    await p.getByLabel('账号',{exact:true}).fill('input remains usable');assert.equal(await p.getByLabel('账号',{exact:true}).inputValue(),'input remains usable');
   }
   const target=p.locator('.patch-login-scene .motion-anchored').last();await p.getByRole('button',{name:'暂停动效',exact:true}).click();const a=await target.screenshot();await p.waitForTimeout(600);assert.deepEqual(await target.screenshot(),a);await p.getByRole('button',{name:'恢复动效',exact:true}).click();await actualChange(p,target,'login-resume');
   await p.emulateMedia({reducedMotion:'reduce'});const b=await target.screenshot();await p.waitForTimeout(600);assert.deepEqual(await target.screenshot(),b);await p.emulateMedia({reducedMotion:'no-preference'});
  });
  await scenario('五主题代表背景及全部12公共关卡、三个远航关卡真实像素',async()=>{
   const p=await page('student');
   for(const[id,theme]of[[92011,'campus'],[92012,'sky'],[92013,'forest'],[92014,'beach'],[9001,'voyage']]){
    await p.goto(runtime.base+'/courses/'+id);await p.locator('.route-node .motion-node .pixel-sprite').first().waitFor();
    const background=p.locator('.space-map-art .motion-anchored');assert.ok(await background.count()>0,theme+' backdrop has source-bound motion');
    let proved=false;
    for(let n=0;n<await background.count();n++){try{const target=background.nth(n);await alignment(target);await actualChange(p,target,theme+'-background-'+n,{save:true});proved=true;break;}catch(e){if(n+1===await background.count())throw e;}}
    assert.ok(proved);
    const nodes=p.locator('.route-node .motion-node .pixel-sprite');for(let n=0;n<3;n++){await alignment(nodes.nth(n));await actualChange(p,nodes.nth(n),theme+'-node-'+(n+1),{save:true});}
    await p.setViewportSize({width:1920,height:1080});const sidebar=p.locator('.space-sidebar-art .motion-anchored').first();await sidebar.waitFor();await alignment(sidebar);await actualChange(p,sidebar,theme+'-sidebar',{save:true});await p.setViewportSize({width:1440,height:900});
    if(id!==9001)assert.equal(await p.locator('.route-node').last().locator('.motion-node').count(),0);
    const first=p.locator('.route-node').first(),box=await first.boundingBox(),anchor=await first.locator('.space-landing-anchor').boundingBox();await p.waitForTimeout(600);assert.deepEqual(await first.boundingBox(),box);assert.deepEqual(await first.locator('.space-landing-anchor').boundingBox(),anchor);await first.press('Enter');await p.getByTestId('lesson-details').waitFor();await p.keyboard.press('Escape');
   }
  });
  await scenario('反证：小器件仍变帧，隐藏场景或关卡时目标检查必须拒绝',async()=>{
   const p=await page();const target=p.locator('.patch-login-scene [data-motion-id="campus-water"]');await target.waitFor();await target.evaluate(e=>e.style.opacity='0');
   await actualChange(p,p.locator('.motion-diorama .pixel-sprite').first(),'counterexample-dock-keeps-playing');
   await assert.rejects(actualChange(p,target,'counterexample-missing-background'),/target pixels must change/);records.push({label:'background-negative-control',status:'correctly rejected while dock plays'});
   const s=await page('student');await s.goto(runtime.base+'/courses/92013');const node=s.locator('.route-node .motion-node .pixel-sprite').first();await node.waitFor();await node.evaluate(e=>e.style.opacity='0');
   await assert.rejects(actualChange(s,node,'counterexample-missing-node'),/target pixels must change/);records.push({label:'node-negative-control',status:'correctly rejected while dock remains mounted'});
  });
  await scenario('校园选课/个人、admin/mentor底图与侧栏；关卡窄屏及交互',async()=>{
   const p=await page('student');for(const route of ['/explore','/me']){await p.goto(runtime.base+route);const target=p.locator('.space-underlay .motion-anchored').last();await target.waitFor();await alignment(target);await actualChange(p,target,route.slice(1)+'-background',{save:true});}
   await p.setViewportSize({width:390,height:844});await p.goto(runtime.base+'/courses/92013');const node=p.locator('.route-node .motion-node .pixel-sprite').first();await alignment(node);await actualChange(p,node,'forest-node-mobile',{save:true});await p.locator('.route-node').first().press('Enter');await p.getByTestId('lesson-details').waitFor();await p.keyboard.press('Escape');
   for(const role of ['admin','mentor']){const s=await page(role);await s.goto(runtime.base+'/courses/91001?tab=maintenance');await s.getByRole('button',{name:'新建课时',exact:true}).waitFor();
    for(const viewport of [{width:1440,height:900},{width:390,height:844}]){await s.setViewportSize(viewport);const targets=s.locator('.staff-content>.motion-background .motion-anchored'),target=viewport.width<768?targets.first():targets.last();await target.waitFor();await alignment(target);await actualChange(s,target,role+'-'+viewport.width+'-background',{save:true});}
   }
  });
  await scenario('动态源图预览逐项核对横竖背景与封面；封面不复用桌面坐标',async()=>{
   const p=await page();await p.goto(runtime.base+'/pixel-motion-preview/index.html');
   for(const theme of ['campus','sky','forest','beach','voyage']){
    await p.locator('#theme').selectOption(theme);const keys=await p.locator('#scene-source option').evaluateAll(es=>es.map(e=>e.value));
    for(const key of keys){await p.locator('#scene-source').selectOption(key);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await actualChange(p,p.locator('#scene>.sprite').last(),'source-'+key,{save:true});}
   }
  });
  assert.deepEqual(errors,[]);
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({records,pageErrors:errors,scope:'fresh synthetic SQLite; real Edge screenshots of background/node sprite bounding crops, not dock inference; explicit negative controls',nativeHidden:'not_verified'},null,2));await browser.close();await runtime.close();}
});
