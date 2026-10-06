import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),source=path.join(root,'frontend/src'),file=path.join(source,'content/uiCopy.jsx');
const data=JSON.parse(readFileSync(file,'utf8').split(/export const uiCopy\s*=\s*/)[1].trim().replace(/;$/,''));
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):['.js','.jsx'].includes(path.extname(e.name))?[path.join(dir,e.name)]:[]);}
const all=walk(source).filter(f=>f!==file).map(f=>readFileSync(f,'utf8')).join('\n');
const used=new Set([...all.matchAll(/copyText\(['"]([^'"]+)/g),...all.matchAll(/<CopyBlock id=['"]([^'"]+)/g)].map(m=>m[1]));
const record={systemIds:Object.keys(data).length,usedIds:used.size,missing:[...used].filter(id=>!data[id]),unused:Object.keys(data).filter(id=>!used.has(id)),teachingSnapshots:JSON.parse(readFileSync(path.join(root,'docs/redesign-v2/step-02/teaching-snapshots.json'),'utf8')).length};
writeFileSync(path.join(root,'docs/redesign-v2/step-02/evidence/copy-id-audit.json'),JSON.stringify(record,null,2)+'\n');
if(record.missing.length||record.unused.length)throw Error('文案 ID 接入不一致 '+JSON.stringify(record));console.log(`${record.systemIds} 个实际 UI ID 全部接入，${record.teachingSnapshots} 个教学来源快照独立；没有缺失或未使用项。`);
