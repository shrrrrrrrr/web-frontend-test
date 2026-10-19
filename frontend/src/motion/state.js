import{createPlayback}from './playback.js';
let player,users=0;const surfaces=new Map(),listeners=new Set(),fallback=Object.freeze({theme:'campus',custom:false});let surface=fallback;
const storage=()=>{try{return window.localStorage;}catch{return undefined;}};
export function getPlayer(){return player??=createPlayback({document,storage:storage(),media:window.matchMedia('(prefers-reduced-motion: reduce)'),IntersectionObserver:window.IntersectionObserver});}
function release(){users--;if(!users){player?.dispose();player=undefined;}}
export const pausedSnapshot=()=>{if(player)return player.snapshot();try{return storage()?.getItem('pbl.pixel-motion.v1.paused')==='true';}catch{return false;}};
export function subscribePaused(fn){users++;const off=getPlayer().subscribe(fn);return()=>{off();release();};}
export function registerSprite(node,asset,options){users++;const off=getPlayer().register(node,asset,options);return()=>{off();release();};}
export function publishSurface(value){const id=Symbol();surfaces.set(id,value);const update=()=>{surface=[...surfaces.values()].at(-1)||fallback;listeners.forEach(fn=>fn());};update();return()=>{surfaces.delete(id);update();};}
export const surfaceSnapshot=()=>surface;
export const subscribeSurface=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
