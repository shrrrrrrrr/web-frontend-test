import test from 'node:test';
import assert from 'node:assert/strict';
import placements from '../src/motion/placements.json' with {type:'json'};
import {projectPlacement,imageKey,imagePosition} from '../src/motion/placement.js';
test('登录水波使用横竖图各自水面源坐标，cover 裁切后仍在水面',()=>{
 for(const [width,height,key] of [[1440,900,'login-desktop'],[768,1024,'login-desktop'],[390,844,'login-mobile'],[360,640,'login-mobile'],[844,390,'login-desktop']]){
  const config=placements.scenes[key],item=config.items.find(i=>i.id==='campus-water'),p=projectPlacement({width,height,sourceWidth:config.size[0],sourceHeight:config.size[1]},item);
  assert.ok(p,`${width}×${height}`);assert.ok(p.x>=p.region.x&&p.y>=p.region.y);assert.ok(p.x+p.width<=p.region.x+p.region.width&&p.y+p.height<=p.region.y+p.region.height);
 }
});
test('裁掉的对象不挪位置；contain/非居中裁切与源图同步',()=>{
 const item={point:[.1,.8],region:[0,.6,.3,.4]};
 assert.equal(projectPlacement({width:100,height:500,sourceWidth:960,sourceHeight:540},item),null);
 const p=projectPlacement({width:960,height:960,sourceWidth:960,sourceHeight:540,fit:'contain',position:[0,0]},item);
 assert.equal(p.x,72);assert.equal(p.y,416);
 const q=projectPlacement({width:960,height:960,sourceWidth:960,sourceHeight:540,fit:'contain',position:[1,1]},item);
 assert.equal(q.y-p.y,420);
});
test('逐图配置区分无水后台、校园用途、封面、移动图及18种关卡',()=>{
 assert.ok(!placements.scenes['campus-workspace'].items.some(i=>i.id.includes('water')));
 assert.notDeepEqual(placements.scenes['login-desktop'],placements.scenes['campus-personal']);
 assert.notDeepEqual(placements.scenes['beach-desktop'],placements.scenes['beach-cover']);
 assert.equal(Object.keys(placements.nodes).length,18);
 for(const config of [...Object.values(placements.scenes),...Object.values(placements.nodes)])for(const item of config.items){
  assert.ok(item.semantic);assert.ok(projectPlacement({width:config.size[0],height:config.size[1],sourceWidth:config.size[0],sourceHeight:config.size[1]},item),item.id);
 }
 assert.equal(imageKey('/assets/staff-campus/campus-workspace-1536.webp'),'campus-workspace');
 assert.deepEqual(imagePosition('65% 0%'),[.65,0]);
});
