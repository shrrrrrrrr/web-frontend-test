import {projectPlacement} from './placement.js';
const placements=await fetch('./placements.json').then(r=>r.json()),sourcePicker=document.querySelector('#scene-source');

const catalog=await fetch('/assets/pixel-motion/v1.1/manifest.json').then(r=>r.json()),theme=document.querySelector('#theme'),grid=document.querySelector('#grid'),scene=document.querySelector('#scene'),media=matchMedia('(prefers-reduced-motion:reduce)');let frame=0,paused=false;
const backgrounds={campus:'/assets/redesign-v2/visual-patch/web/campus-select-960.webp',sky:'/assets/public-themes/sky-desktop-960.webp',forest:'/assets/public-themes/forest-desktop-960.webp',beach:'/assets/public-themes/beach-desktop-960.webp',voyage:'/assets/redesign-v2/web/cosmos-960.webp'};
function sprite(a,scale=3){const e=document.createElement('span');e.className='sprite';e.dataset.motion=a.id;e.dataset.scale=scale;e.style.width=a.width*scale+'px';e.style.height=a.height*scale+'px';e.style.backgroundSize=a.width*a.frames*scale+'px '+a.height*scale+'px';e.style.backgroundImage=`url('${a.url}')`;return e;}
function paint(){for(const e of document.querySelectorAll('[data-motion]')){const a=catalog.assets[e.dataset.motion],f=document.querySelector('#static').checked?0:frame;e.style.backgroundPosition=(-a.width*Number(e.dataset.scale)*f)+'px 0';e.dataset.frame=f;}document.querySelector('#toggle').textContent=paused?'播放':'暂停';document.querySelector('#status').textContent=`帧 ${frame+1}/8 · ${paused||media.matches?'静止':'播放'} · 后台自动暂停`;}
function render(){grid.replaceChildren();scene.replaceChildren();scene.style.backgroundImage=backgrounds[theme.value]?`url('${backgrounds[theme.value]}')`:'none';const assets=Object.values(catalog.assets).filter(a=>a.theme===theme.value);for(const a of assets){const article=document.createElement('article'),title=document.createElement('h3');title.textContent=a.id;article.append(title,sprite(a));const still=document.createElement('img');still.src=a.fallback;still.width=96;still.height=64;still.alt='静态首帧';article.append(still);const strip=document.createElement('div');strip.className='frames';for(let f=0;f<a.frames;f++){const one=sprite(a,2);one.removeAttribute('data-motion');one.className='frame';one.style.backgroundPosition=(-a.width*2*f)+'px 0';one.title='第'+(f+1)+'帧';strip.append(one);}article.append(strip);grid.append(article);}renderSources();paint();}
document.querySelector('#toggle').onclick=()=>{paused=!paused;document.querySelector('#toggle').textContent=paused?'播放':'暂停';paint();};for(const[id,delta]of[['next',1],['previous',7]])document.querySelector('#'+id).onclick=()=>{paused=true;frame=(frame+delta)%8;paint();};document.querySelector('#static').onchange=paint;theme.onchange=render;media.addEventListener('change',paint);setInterval(()=>{if(!document.hidden&&!paused&&!media.matches){frame=(frame+1)%8;paint();}},250);

function sceneSource(key){
 if(['campus-select','campus-personal','login-desktop','login-mobile','voyage-reading','voyage-lab'].includes(key))return '/assets/redesign-v2/visual-patch/web/'+key+'-960.webp';
 if(key==='campus-workspace'||key==='campus-mobile')return '/assets/staff-campus/'+key+'-960.webp';
 if(['campus','cosmos','vertical'].includes(key))return '/assets/redesign-v2/web/'+key+'-960.webp';
 return '/assets/public-themes/'+key+'-960.webp';
}
function renderSources(){
 sourcePicker.replaceChildren();
 const keys=Object.keys(placements.scenes).filter(k=>theme.value==='campus'?/^(campus|login)/.test(k):theme.value==='voyage'?/^(cosmos|vertical|voyage)/.test(k):k.startsWith(theme.value));
 for(const key of keys){const o=document.createElement('option');o.value=key;o.textContent=key;sourcePicker.append(o);}
 positionScene();
}
function positionScene(){
 scene.replaceChildren();const key=sourcePicker.value,config=placements.scenes[key];if(!config){scene.style.backgroundImage='none';return;}
 scene.style.backgroundImage=`url('${sceneSource(key)}')`;scene.style.aspectRatio=config.size[0]+'/'+config.size[1];

 for(const item of config.items){const p=projectPlacement({width:scene.clientWidth,height:scene.clientHeight,sourceWidth:config.size[0],sourceHeight:config.size[1]},item);if(!p)continue;const e=sprite(catalog.assets[item.id],p.scale);e.style.left=p.x+'px';e.style.top=p.y+'px';e.title=item.semantic;scene.append(e);}
 paint();
}
sourcePicker.onchange=positionScene;new ResizeObserver(positionScene).observe(scene);

render();
