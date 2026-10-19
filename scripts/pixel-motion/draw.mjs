// Original editable integer-grid drawing source. No raster editing or model calls.
export const VERSION='1.0.0',NAMESPACE='assets/pixel-motion/v1',FRAMES=8,FRAME_MS=250;
export const palette={ink:'#132a49',paper:'#fbf6e8',teal:'#087f80',cyan:'#89e5ec',gold:'#e6b84d',leaf:'#759c49',dark:'#355e4a',foam:'#fff9dd',water:'#46a6c3',cloud:'#dcecf2'};
export const specs=[
 ['campus-leaves','campus','leaf'],['campus-water','campus','water'],['campus-flag','campus','flag'],
 ['sky-cloud','sky','cloud'],['sky-vane','sky','vane'],['sky-airflow','sky','air'],
 ['forest-leaves','forest','leaf'],['forest-firefly','forest','insect'],['forest-insect','forest','insect'],
 ['beach-surf','beach','water'],['beach-flag','beach','flag'],['beach-beacon','beach','beacon'],
 ['voyage-star','voyage','star'],['voyage-signal','voyage','signal'],['voyage-led','voyage','led'],
 ['voyage-vr','voyage','scan'],['voyage-airflow','voyage','air'],['voyage-maker','voyage','led'],
 ['neutral-instrument','neutral','led'],
 ...['campus','sky','forest','beach'].flatMap(theme=>['scan',theme==='sky'?'air':theme==='forest'?'leaf':'flag',theme==='beach'?'beacon':'led'].map((kind,i)=>[theme+'-node'+(i+1),theme,kind]))
].map(([id,theme,kind])=>({id,theme,kind,width:48,height:32,frames:FRAMES,frameMs:FRAME_MS,staticFrame:0,anchor:[.5,.5],scale:'integer nearest-neighbor; no interpolated rotation'}));

export function draw(spec,frame){
 const w=spec.width,h=spec.height,p=Array.from({length:h},()=>Array(w).fill(null));
 const dot=(x,y,c)=>{if(x>=0&&x<w&&y>=0&&y<h)p[y][x]=palette[c]||c;};
 const rect=(x,y,a,b,c)=>{for(let j=y;j<y+b;j++)for(let i=x;i<x+a;i++)dot(i,j,c);};
 const line=(x,y,dx,dy,n,c)=>{for(let i=0;i<n;i++)dot(x+dx*i,y+dy*i,c);};
 const wave=[0,1,2,1,0,-1,-2,-1][frame];
 const leaf=spec.theme==='forest'?'leaf':'gold';
 const detail=spec.id.includes('-node')||['voyage-vr','voyage-maker'].includes(spec.id);
 if(spec.kind==='leaf'){
  if(!detail){line(1,15,1,0,28,'dark');line(8,15,1,-1,7,'dark');line(22,15,1,1,6,'dark');}
  for(const[x,y]of[[6,8],[16,6],[27,10],[25,20]]){rect(x+wave,y,8,3,leaf);rect(x+1+wave,y-2,5,2,leaf);rect(x+2+wave,y+3,4,2,'dark');dot(x+6+wave,y,'paper');}
 }else if(spec.kind==='water'){
  for(let row=0;row<3;row++){let x=(wave*(row===1?-1:1)+row*9+48)%23;const y=8+row*7+Math.abs(wave)%2;rect(x,y,13-row*2,2,spec.theme==='beach'?'foam':'cyan');rect(x+7,y+2,7,1,'water');rect((x+23)%38,y-2,6,1,'foam');}
 }else if(spec.kind==='cloud'){
  for(const[x,y,s]of[[3,14,0],[12,10,1],[23,15,2]]){rect(x,y+(s===1?wave:0),14,6,'paper');rect(x+3,y-3+(s===1?wave:0),8,3,'paper');rect(x,y+5+(s===1?wave:0),13,2,'cloud');}
 }else if(spec.kind==='flag'||spec.kind==='vane'){
  if(!detail){rect(15,4,2,25,'ink');rect(11,29,10,2,'teal');}
  if(spec.kind==='flag'){for(let x=0;x<19;x++){const y=6+Math.round(Math.sin((x+frame*2)/5));rect(17+x,y,1,7,x<12?'gold':'paper');}rect(17,14,12,1,'teal');}
  else {rect(5+wave,9,26,2,'teal');line(5+wave,9,1,-1,4,'gold');line(5+wave,10,1,1,4,'gold');rect(28+wave,7,5,6,'paper');}
 }else if(spec.kind==='star'){
  const n=[2,3,4,5,4,3,2,2][frame];rect(23,15,2,2,'paper');rect(24,15-n,1,n*2+2,'cyan');rect(24-n,16,n*2+2,1,'cyan');dot(16,8,frame%3===0?'gold':'cloud');dot(36,24,frame%4===0?'paper':'cloud');
 }else if(spec.kind==='insect'){
  const x=19+wave,y=14+[0,0,1,2,1,0,-1,-1][frame];rect(x,y,4,4,'gold');dot(x+1,y+1,'paper');rect(x-3,y+(frame%2),3,2,'cloud');rect(x+4,y+(frame%2),3,2,'cyan');
 }else if(spec.kind==='air'){
  for(let n=0;n<3;n++){const y=9+n*6;for(let x=0;x<28;x++){if((x+frame*2+n)%13<8)dot(8+x,y+Math.round(Math.sin((x+frame)/6)),n===1?'paper':'cyan');}}
 }else if(spec.kind==='beacon'){
  if(!detail){rect(20,12,8,17,'paper');rect(19,10,10,3,'ink');rect(22,5,4,5,'gold');rect(18,28,12,2,'teal');}for(let n=0;n<3;n++)rect(28+n*4,7+wave+n%2,3,2,n===Math.floor(frame/2)%3?'paper':'cyan');
 }else if(spec.kind==='scan'){
  if(!detail){rect(8,5,32,22,'ink');rect(10,7,28,18,'teal');rect(12,9,24,14,'dark');rect(18,29,12,2,'ink');rect(22,26,4,4,'paper');}rect(13+(frame%6)*3,10,2,12,'cyan');dot(33,8,frame%3===0?'gold':'cyan');
 }else if(spec.kind==='signal'){
  rect(22,22,4,7,'paper');rect(16,29,16,2,'ink');for(let n=0;n<3;n++){if(n<1+frame%4){const length=4+n+(frame%4===3?1:0);line(20-n*4,17-n*4,1,-1,length,'cyan');line(24,14-n*4,1,1,length,'cyan');}}
 }else{
  if(!detail){rect(8,8,32,18,'ink');rect(10,10,28,14,'paper');}for(let n=0;n<4;n++){rect(13+n*6,13,3,3,n===Math.floor(frame/2)%4?'gold':'teal');rect(13+n*6,19,3,2,n===frame%4?'cyan':'teal');}
 }
 return p;
}
export function svg(spec,frames){
 const colors=[...new Set(frames.flat(2).filter(Boolean))];
 const paths=colors.map(color=>{let d='';for(let f=0;f<frames.length;f++)for(let y=0;y<spec.height;y++){let x=0;while(x<spec.width){if(frames[f][y][x]!==color){x++;continue;}const start=x;while(x<spec.width&&frames[f][y][x]===color)x++;d+=`M${start+f*spec.width} ${y}h${x-start}v1H${start+f*spec.width}z`;}}return `<path fill="${color}" d="${d}"/>`;}).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width*frames.length}" height="${spec.height}" viewBox="0 0 ${spec.width*frames.length} ${spec.height}" shape-rendering="crispEdges">${paths}</svg>\n`;
}
