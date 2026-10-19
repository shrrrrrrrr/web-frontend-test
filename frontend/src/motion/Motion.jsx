import{useEffect,useId,useRef,useSyncExternalStore}from 'react';
import{useLocation}from 'react-router-dom';
import{useAuth}from '../store/AuthContext';
import catalog from './catalog.json';import copy from './copy.json';
import{getPlayer,registerSprite,subscribePaused,pausedSnapshot,publishSurface,subscribeSurface,surfaceSnapshot}from './state';
import './motion.css';
export function PixelSprite({id,scale=2,phase,className='',style}){
 const instance=useId(),offset=phase??([...instance].reduce((n,c)=>n+c.codePointAt(0),0)%8*250);
 const node=useRef(null),asset=catalog.assets[id],{user}=useAuth(),allowed=!user||['student','admin','academic_mentor'].includes(user.role);
 useEffect(()=>{if(allowed&&node.current&&asset)return registerSprite(node.current,asset,{scale,phase:offset});},[asset,scale,offset,allowed]);
 return allowed&&asset?<span ref={node} className={'pixel-sprite '+className} style={{width:asset.width*scale,height:asset.height*scale,...style}} data-motion-id={id} data-motion-state="loading" aria-hidden="true"/>:null;
}
const scenes={campus:['campus-leaves','campus-water'],sky:['sky-cloud','sky-vane'],forest:['forest-leaves','forest-insect'],beach:['beach-surf','beach-flag'],voyage:['voyage-star','voyage-signal']};
export function SceneMotion({theme='campus',custom=false,className=''}){
 if(custom)return null;
 const ids=scenes[theme]||scenes.campus;
 return <span className={'motion-scene motion-scene--'+theme+' '+className} aria-hidden="true"><PixelSprite id={ids[0]} className="motion-scene-first"/><PixelSprite id={ids[1]} phase={750} className="motion-scene-second"/></span>;
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
export function NodeMotion({art,theme,type,custom=false,unknown=false}){
 if(custom||unknown||art==='rock')return null;
 const id=catalog.assets[art]?art:theme==='voyage'?({visit:'voyage-vr',theory:'voyage-airflow',experiment:'voyage-maker'}[type]||'voyage-led'):null;
 return id?<span className={'motion-node motion-node--'+(type||'template')} aria-hidden="true"><PixelSprite id={id} scale={1}/></span>:null;
}
