import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import{VERSION,NAMESPACE,specs,draw,svg}from './draw.mjs';
const root=path.resolve(import.meta.dirname,'../..'),out=path.join(root,'frontend/public',NAMESPACE),source=path.join(root,'art/pixel-motion/v1.1');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(source,{recursive:true});
const assets={};for(const spec of specs){const frames=Array.from({length:spec.frames},(_,i)=>draw(spec,i));
 fs.writeFileSync(path.join(out,spec.id+'.sheet.svg'),svg(spec,frames));fs.writeFileSync(path.join(out,spec.id+'.still.svg'),svg(spec,[frames[spec.staticFrame]]));
 fs.writeFileSync(path.join(source,spec.id+'.frames.json'),JSON.stringify({spec,frames}));assets[spec.id]={...spec,url:'/'+NAMESPACE+'/'+spec.id+'.sheet.svg',fallback:'/'+NAMESPACE+'/'+spec.id+'.still.svg',frameDurations:Array(spec.frames).fill(spec.frameMs),loopMs:spec.frameMs*spec.frames};
}
const manifest={version:VERSION,compatibility:'pixel-motion-v1.1',namespace:NAMESPACE,authoring:'Original repo-native integer-grid SVG frames; no AI/model call, no third-party art or video',assets};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.mkdirSync(path.join(root,'frontend/src/motion'),{recursive:true});fs.writeFileSync(path.join(root,'frontend/src/motion/catalog.json'),JSON.stringify(manifest,null,2)+'\n');
const files=fs.readdirSync(out).sort().map(name=>{const bytes=fs.readFileSync(path.join(out,name));return{path:NAMESPACE+'/'+name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
fs.writeFileSync(path.join(source,'import-manifest.json'),JSON.stringify({version:VERSION,compatibility:'pixel-motion-v1.1',namespace:NAMESPACE,files},null,2)+'\n');
for(const name of ['placement.js','placements.json'])fs.copyFileSync(path.join(root,'frontend/src/motion',name),path.join(root,'frontend/public/pixel-motion-preview',name));
console.log(JSON.stringify({version:VERSION,sprites:specs.length,frames:specs.length*8,files:files.length,bytes:files.reduce((s,f)=>s+f.bytes,0)}));
