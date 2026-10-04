import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const root=process.cwd();
const files=['README.md','DESIGN.md','docs/HANDOFF.md','docs/round-12.md','docs/round-12/matrix.md','docs/round-12/evidence/commands.md','docs/acceptance/index.html','docs/round-12/patch/index.html','docs/round-12/patch/README.md','docs/round-12/patch/evidence/commands.md'];
let count=0;
for(const file of files){
 const text=fs.readFileSync(file,'utf8');
 const links=file.endsWith('.html')?[...text.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]):[...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]);
 for(const value of links){if(/^(?:https?:|#|mailto:)/.test(value))continue;const href=value.split('#')[0].split('?')[0];assert.ok(fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(href))),file+' -> '+href);count++;}
}
console.log('Changed delivery documents: '+files.length+'; existing local link targets: '+count+'.');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'docs/round-12/patch/index.html')).href);
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 const images=await page.locator('img').evaluateAll(items=>items.map(i=>({src:i.getAttribute('src'),width:i.naturalWidth,height:i.naturalHeight})));
 assert.deepEqual(images.map(i=>[i.width,i.height]),[[390,844],[1365,900]]);
 console.log('Patch screenshots: '+JSON.stringify(images));
 for(const [width,height]of [[1365,900],[768,1024],[390,844]]){await page.setViewportSize({width,height});await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth+1);console.log('Patch gallery no horizontal overflow: '+width+'x'+height);}
 assert.deepEqual(errors,[]);console.log('Patch gallery uncaught browser errors: 0.');
}finally{await browser.close();}
