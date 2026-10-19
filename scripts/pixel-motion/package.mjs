import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{execFileSync}from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../..'),arg=process.argv.indexOf('--out');if(arg<0||!process.argv[arg+1])throw Error('Usage: node scripts/pixel-motion/package.mjs --out ABSOLUTE_OUTPUT_DIRECTORY');
const dirty=execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim().length>0;
if(dirty&&!process.argv.includes('--allow-dirty'))throw Error('Commit verified integration before release packaging. --allow-dirty creates a development-only rehearsal package.');
const out=path.resolve(process.argv[arg+1]);fs.mkdirSync(out,{recursive:true});const entries=new Map(),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(name,file)=>{if(name.includes('..')||name.startsWith('/')||name.includes('\\'))throw Error('Unsafe ZIP member');entries.set(name,fs.readFileSync(path.join(root,file)));};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'art/pixel-motion/v1.1/import-manifest.json'),'utf8'));
for(const f of manifest.files){const source='frontend/public/'+f.path,bytes=fs.readFileSync(path.join(root,source));if(bytes.length!==f.bytes||sha(bytes)!==f.sha256)throw Error('Generate and verify assets first: '+f.path);put('runtime/'+f.path,source);}
put('runtime/pixel-motion-import.json','art/pixel-motion/v1.1/import-manifest.json');
for(const name of fs.readdirSync(path.join(root,'art/pixel-motion/v1.1')).filter(n=>n.endsWith('.frames.json')).sort())put('source/frames/'+name,'art/pixel-motion/v1.1/'+name);
for(const name of['draw.mjs','generate.mjs','package.mjs'])put('source/scripts/pixel-motion/'+name,'scripts/pixel-motion/'+name);
for(const name of['Motion.jsx','state.js','playback.js','motion.css','copy.json','catalog.json','placement.js','placements.json'])put('source/frontend/src/motion/'+name,'frontend/src/motion/'+name);
for(const name of['index.html','preview.js','placement.js','placements.json'])put('source/frontend/public/pixel-motion-preview/'+name,'frontend/public/pixel-motion-preview/'+name);
put('PLACEMENT.md','docs/pixel-motion/placement-patch/PLACEMENT.md');
put('source/README.md','art/pixel-motion/README.md');put('tools/import-assets.mjs','scripts/pixel-motion/import-assets.mjs');put('DEPLOY.md','docs/pixel-motion/DEPLOY.md');put('SOURCE-GUIDE.md','docs/pixel-motion/SOURCE-GUIDE.md');
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
entries.set('PACKAGE.json',Buffer.from(JSON.stringify({version:'1.1.0',compatibility:'pixel-motion-v1.1',sourceRepository:'https://github.com/shrrrrrrrr/web-frontend-test.git',sourceBranch:'feat/pixel-scene-motion',codeCommit:commit,workingTreeDirty:dirty,developmentOnly:dirty,sourceBaseline:'f03e585e88cdc17369351857e432d835cae472f1',namespace:manifest.namespace,themes:['campus','sky','forest','beach','voyage'],sprites:31,frames:248,runtimeFiles:manifest.files.length,runtimeBytes:manifest.files.reduce((n,f)=>n+f.bytes,0),requiresIntegratedCode:true,databaseImport:false,source:'Original editable native SVG pixel frames; no Aseprite/model claim'},null,2)+'\n'));
entries.set('FILE-SHA256.json',Buffer.from(JSON.stringify([...entries].map(([file,bytes])=>({file,bytes:bytes.length,sha256:sha(bytes)})),null,2)+'\n'));
// ZIP STORE, UTF-8 filenames, deterministic DOS date; no runtime dependency.
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc=bytes=>{let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;};
let offset=0;const locals=[],central=[];
for(const[file,bytes]of [...entries].sort(([a],[b])=>a<b?-1:a>b?1:0)){const name=Buffer.from(file),checksum=crc(bytes),header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(33,12);header.writeUInt32LE(checksum,14);header.writeUInt32LE(bytes.length,18);header.writeUInt32LE(bytes.length,22);header.writeUInt16LE(name.length,26);locals.push(header,name,bytes);
 const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(33,14);c.writeUInt32LE(checksum,16);c.writeUInt32LE(bytes.length,20);c.writeUInt32LE(bytes.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);central.push(c,name);offset+=header.length+name.length+bytes.length;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.size,8);end.writeUInt16LE(entries.size,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...locals,directory,end]),name='pixel-motion-v1.1-placement-complete.zip';fs.writeFileSync(path.join(out,name),zip);fs.writeFileSync(path.join(out,name+'.sha256'),sha(zip)+'  '+name+'\n');
const summary={version:'1.1.0',workingTreeDirty:dirty,developmentOnly:dirty,file:name,bytes:zip.length,sha256:sha(zip),members:entries.size,codeCommit:commit,runtimeFiles:manifest.files.length,runtimeBytes:manifest.files.reduce((n,f)=>n+f.bytes,0),sprites:31,frames:248};fs.writeFileSync(path.join(out,'package-info.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
