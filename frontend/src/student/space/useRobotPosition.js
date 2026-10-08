import {useEffect,useRef,useState} from 'react';
const KEY='pbl:robot-position:v1';
export function robotBounds(){const v=window.visualViewport;return {left:v?.offsetLeft||0,top:v?.offsetTop||0,width:v?.width||innerWidth,height:v?.height||innerHeight};}
export function clampRobot(p,b,size){const minX=b.left+12,maxX=Math.max(minX,b.left+b.width-size-12),minY=b.top+Math.min(132,Math.max(12,b.height-size-32)),maxY=Math.max(minY,b.top+b.height-size-20);return{x:Math.min(maxX,Math.max(minX,p.x)),y:Math.min(maxY,Math.max(minY,p.y))};}
const defaultPosition=b=>({x:b.left+b.width-102,y:b.top+b.height-120});
export default function useRobotPosition(size){
 const [position,setPosition]=useState(()=>{const b=robotBounds();let p=defaultPosition(b);try{const saved=JSON.parse(localStorage.getItem(KEY));if(Number.isFinite(saved?.x)&&Number.isFinite(saved?.y))p=saved;}catch{/* UI preference is optional. */}return clampRobot(p,b,size);});
 const drag=useRef(null),suppress=useRef(false),current=useRef(position);
 const moveTo=p=>{const next=clampRobot(p,robotBounds(),size);current.current=next;setPosition(next);return next;};
 const persist=p=>{try{localStorage.setItem(KEY,JSON.stringify(p));}catch{/* No teaching/reward storage dependency. */}};
 useEffect(()=>{const resize=()=>{setPosition(p=>{const next=clampRobot(p,robotBounds(),size);current.current=next;return next;});};resize();window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);return()=>{window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('scroll',resize);};},[size]);
 return {position,reset(){const p=moveTo(defaultPosition(robotBounds()));persist(p);},
  pointerDown(e){if(e.button!==0||!e.isPrimary)return;suppress.current=false;drag.current={pointer:e.pointerId,x:e.clientX,y:e.clientY,start:current.current,moved:false};/* Touch has native implicit capture. */if(e.pointerType!=='touch')e.currentTarget.setPointerCapture(e.pointerId);},
  pointerMove(e){const d=drag.current;if(!d||d.pointer!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>6)d.moved=true;if(d.moved)moveTo({x:d.start.x+dx,y:d.start.y+dy});},
  pointerUp(e){const d=drag.current;if(!d||d.pointer!==e.pointerId)return false;const touchTap=e.pointerType==='touch'&&!d.moved;if(d.moved||touchTap)suppress.current=true;if(d.moved)persist(current.current);drag.current=null;/* Confirm a touch tap here; compatibility click may be absent after drag. */return touchTap;},
  pointerCancel(){drag.current=null;persist(current.current);},
  consumeClick(e){const blocked=suppress.current&&e.detail!==0;suppress.current=false;return blocked;}
 };
}
