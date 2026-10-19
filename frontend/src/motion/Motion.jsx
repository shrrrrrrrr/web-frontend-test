import{useEffect,useId,useRef,useState,useSyncExternalStore}from 'react';
import{useLocation}from 'react-router-dom';
import{useAuth}from '../store/AuthContext';
import catalog from './catalog.json';import copy from './copy.json';
import placements from './placements.json';
import {projectPlacement,imageKey,imagePosition} from './placement';
import{getPlayer,registerSprite,subscribePaused,pausedSnapshot,publishSurface,subscribeSurface,surfaceSnapshot}from './state';
import './motion.css';
export function PixelSprite({id,scale=2,phase,className='',style,slot,semantic}){
 const instance=useId(),offset=phase??([...instance].reduce((n,c)=>n+c.codePointAt(0),0)%8*250);
 const node=useRef(null),asset=catalog.assets[id],{user}=useAuth(),allowed=!user||['student','admin','academic_mentor'].includes(user.role);
 useEffect(()=>{if(allowed&&node.current&&asset)return registerSprite(node.current,asset,{scale,phase:offset});},[asset,scale,offset,allowed]);
 return allowed&&asset?<span ref={node} className={'pixel-sprite '+className} style={{width:asset.width*scale,height:asset.height*scale,...style}} data-motion-id={id} data-motion-slot={slot} data-motion-semantic={semantic} data-motion-state="loading" aria-hidden="true"/>:null;
}
const scenes={campus:['campus-leaves','campus-water'],sky:['sky-cloud','sky-vane'],forest:['forest-leaves','forest-insect'],beach:['beach-surf','beach-flag'],voyage:['voyage-star','voyage-signal']};
function PositionedMotion({kind='scenes',art,background,className=''}){
 const ref=useRef(null),[layout,setLayout]=useState({key:'',items:[]});
 useEffect(()=>{
  const host=ref.current,parent=host.parentElement;
  const img=background?null:parent.querySelector('img');
  let pending;
  const measure=()=>{
   const box={width:host.clientWidth,height:host.clientHeight},css=img?getComputedStyle(img):getComputedStyle(parent,background==='staff'?'::before':null);
   const key=art||(img?imageKey(img.currentSrc||img.src):imageKey(css.backgroundImage.match(/url\(["']?([^"')]+)/)?.[1]));
   const config=placements[kind][key];
   const items=config&&(!img||(img.complete&&img.naturalWidth))?config.items.flatMap((item,i)=>{
    const projection=projectPlacement({width:box.width,height:box.height,sourceWidth:config.size[0],sourceHeight:config.size[1],fit:img?css.objectFit:'cover',position:imagePosition(img?css.objectPosition:css.backgroundPosition)},item);
    return projection?[{...item,...projection,index:i}]:[];
   }):[];
   setLayout(previous=>{const next={key,items};return JSON.stringify(previous)===JSON.stringify(next)?previous:next;});
  };
  const schedule=()=>{cancelAnimationFrame(pending);pending=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(schedule);observer.observe(host);if(img)observer.observe(img);
  img?.addEventListener('load',schedule);img?.addEventListener('error',schedule);window.addEventListener('resize',schedule);schedule();
  return()=>{cancelAnimationFrame(pending);observer.disconnect();img?.removeEventListener('load',schedule);img?.removeEventListener('error',schedule);window.removeEventListener('resize',schedule);};
 },[kind,art,background]);
 return <span ref={ref} className={'motion-scene '+className} data-motion-scene={layout.key} data-motion-kind={kind} data-motion-background={background} aria-hidden="true">{layout.items.map(item=><PixelSprite key={layout.key+item.index} id={item.id} slot={item.index} semantic={item.semantic} scale={item.scale} className="motion-anchored" style={{left:item.x,top:item.y}}/>)}</span>;
}
export function SceneMotion({custom=false,className='',background}){
 return custom?null:<PositionedMotion background={background} className={className}/>;
}
export function MotionSurface({theme='campus',custom=false}){
 useEffect(()=>publishSurface({theme,custom}),[theme,custom]);return null;
}
export function SiteMotionGate(){
 const{user}=useAuth(),{pathname}=useLocation();
 if(pathname!=='/login'&&!['student','admin','academic_mentor'].includes(user?.role))return null;
 return <MotionDock/>;
}
function MotionDock(){
 const surface=useSyncExternalStore(subscribeSurface,surfaceSnapshot,surfaceSnapshot),paused=useSyncExternalStore(subscribePaused,pausedSnapshot,()=>false);
 const theme=surface.custom?'neutral':surface.theme,ids=surface.custom?['neutral-instrument']:(scenes[theme]||scenes.campus);
 return <aside className={'motion-dock motion-dock--'+theme} aria-label={copy['motion.control']} data-motion-surface={theme}>
  <div className="motion-diorama" aria-hidden="true">{ids.map((id,i)=><PixelSprite key={id} id={id} scale={1} phase={i*750} style={{left:i*48,top:0}}/>)}</div>
  <button type="button" className="motion-toggle" data-motion-control onClick={()=>getPlayer().toggle()} aria-pressed={paused} data-motion-copy={paused?'motion.resume':'motion.pause'}>{copy[paused?'motion.resume':'motion.pause']}</button>
 </aside>;
}
export function NodeMotion({art,custom=false,unknown=false}){
 if(custom||unknown||art==='rock')return null;
 return placements.nodes[art]?<PositionedMotion kind="nodes" art={art} className="motion-node"/>:null;
}
