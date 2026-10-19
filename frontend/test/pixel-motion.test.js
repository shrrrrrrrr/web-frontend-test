import test from 'node:test';import assert from 'node:assert/strict';
import{createPlayback}from '../src/motion/playback.js';
import{draw,specs}from '../../scripts/pixel-motion/draw.mjs';
function harness({fail=false,denied=false}={}){
 let time=0,seq=0;const jobs=new Map(),doc=new EventTarget(),view=new EventTarget(),media=new EventTarget();doc.defaultView=view;doc.hidden=false;media.matches=false;
 const observers=[];class Observer{constructor(fn){this.fn=fn;observers.push(this);}observe(node){this.node=node;}unobserve(){}disconnect(){this.disconnected=true;}}
 const storage={getItem(){if(denied)throw Error('storage unavailable');return null;},setItem(){if(denied)throw Error('storage unavailable');}};
 const loadImage=()=>({set src(value){this.url=value;fail?this.onerror():this.onload();}});
 const player=createPlayback({document:doc,storage,media,IntersectionObserver:Observer,now:()=>time,setTimer:fn=>{const id=++seq;jobs.set(id,fn);return id;},clearTimer:id=>jobs.delete(id),loadImage});
 return{player,doc,media,jobs,advance(ms=250){time+=ms;const pending=[...jobs.values()];jobs.clear();pending.forEach(fn=>fn());},visible(node,value){observers[0].fn([{target:node,isIntersecting:value,intersectionRatio:value?1:0}]);}};
}
const node=()=>({style:{},dataset:{}}),asset={width:48,height:32,frames:8,frameMs:250,loopMs:2000,staticFrame:0,url:'/sheet.svg',fallback:'/still.svg'};
test('逐帧素材均为整数格原生形状变化；五主题与12公共模板完整',()=>{
 assert.equal(specs.length,31);for(const s of specs){const frames=Array.from({length:8},(_,i)=>draw(s,i));assert.ok(new Set(frames.map(f=>JSON.stringify(f))).size>=4,s.id);assert.ok(frames.every(f=>f.length===32&&f.every(r=>r.length===48)));}
 for(const theme of['campus','sky','forest','beach'])for(const n of[1,2,3])assert.ok(specs.some(s=>s.id===theme+'-node'+n));assert.ok(specs.some(s=>s.id==='voyage-vr'));
});
test('可见内容真实换帧；多个精灵共享一个4fps时钟，离屏/隐藏不补帧',()=>{
 const h=harness(),a=node(),b=node(),offA=h.player.register(a,asset),offB=h.player.register(b,asset,{phase:750});
 assert.equal(h.jobs.size,0);h.visible(a,true);h.visible(b,true);assert.equal(h.jobs.size,1);h.advance();h.advance();assert.notEqual(a.dataset.frame,'0');assert.notEqual(a.dataset.frame,b.dataset.frame);
 h.doc.hidden=true;h.doc.dispatchEvent(new Event('visibilitychange'));const frozen=a.dataset.frame;assert.equal(h.jobs.size,0);h.advance(60000);assert.equal(a.dataset.frame,frozen);
 h.doc.hidden=false;h.doc.dispatchEvent(new Event('visibilitychange'));h.advance();assert.equal(a.dataset.frame,frozen);h.visible(a,false);h.visible(b,false);assert.equal(h.jobs.size,0);offA();offB();h.player.dispose();assert.equal(h.player.stats().sprites,0);
});
test('暂停与减少运动稳定静态帧，存储失败不崩溃；清理时钟与observer',()=>{
 const h=harness({denied:true}),n=node(),off=h.player.register(n,asset);h.visible(n,true);h.advance();h.advance();h.player.toggle();const frame=n.dataset.frame;h.advance(1000);assert.equal(n.dataset.frame,frame);assert.equal(h.player.snapshot(),true);h.player.toggle();h.advance();h.advance();assert.notEqual(n.dataset.frame,frame);
 h.media.matches=true;h.media.dispatchEvent(new Event('change'));assert.equal(n.dataset.frame,'0');assert.equal(h.jobs.size,0);off();h.player.dispose();assert.equal(h.jobs.size,0);
});
test('精灵404使用静态后备，不留离散帧偏移或继续运行时钟',()=>{
 const h=harness({fail:true}),n=node(),off=h.player.register(n,asset,{phase:750});h.visible(n,true);assert.equal(n.dataset.motionState,'failed');assert.equal(n.style.backgroundPosition,'0px 0px');assert.match(n.style.backgroundImage,/still.svg/);assert.equal(h.jobs.size,0);off();h.player.dispose();
});
