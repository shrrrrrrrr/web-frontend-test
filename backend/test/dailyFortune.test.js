const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
process.env.DB_PATH=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'pbl-fortune-')),'test.db');process.env.JWT_SECRET=crypto.randomBytes(32).toString('hex');process.env.NODE_ENV='test';
const {dailyFortune,VERSION}=require('../services/dailyFortune'),app=require('../app'),db=require('../config/database');
let server,url;const tokens={};
before(async()=>{
 const hash=require('bcryptjs').hashSync('test123',4);for(const[id,role]of[[1,'student'],[2,'student'],[3,'teacher']])db.prepare('INSERT INTO users(id,username,password_hash,real_name,role) VALUES(?,?,?,?,?)').run(id,'u'+id,hash,'合成账号'+id,role);
 await new Promise(resolve=>server=app.listen(0,resolve));url='http://127.0.0.1:'+server.address().port;
 for(const id of[1,2,3])tokens[id]=(await fetch(url+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'u'+id,password:'test123'})}).then(r=>r.json())).token;
});
after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();});
const get=(id,suffix='')=>fetch(url+'/api/account/daily-fortune'+suffix,{headers:id?{Authorization:'Bearer '+tokens[id]}:{}});
test('北京时间午夜切日，账号和日期稳定派生，受控枚举无重复宜',()=>{
 const beforeMidnight=dailyFortune(1,new Date('2026-10-07T15:59:59Z')),afterMidnight=dailyFortune(1,new Date('2026-10-07T16:00:00Z'));
 assert.equal(beforeMidnight.date,'2026-10-07');assert.equal(afterMidnight.date,'2026-10-08');assert.equal(beforeMidnight.nextUpdateAt,'2026-10-07T16:00:00.000Z');
 assert.deepEqual(beforeMidnight,dailyFortune(1,new Date('2026-10-07T00:00:00Z')));assert.equal(beforeMidnight.version,VERSION);assert.equal(new Set(beforeMidnight.good).size,2);
 assert.notDeepEqual(beforeMidnight,dailyFortune(2,new Date('2026-10-07T15:59:59Z')));
});
test('同账号新 token/跨客户端固定结果，认证账号隔离，读取不写业务表',async()=>{
 const counts=()=>db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(({name})=>[name,db.prepare('SELECT count(*) n FROM "'+name+'"').get().n]);
 const original=counts(),first=await get(1);assert.equal(first.status,200);assert.equal(first.headers.get('cache-control'),'no-store');const result=await first.json();
 const again=await get(1);assert.deepEqual(await again.json(),result);assert.deepEqual(await(await get(2)).json(),dailyFortune(2));assert.deepEqual(counts(),original);
});
test('指定他人/课程/日期被拒绝，未登录和维护角色不能读取',async()=>{
 for(const query of ['?userId=2','?courseId=1','?date=2026-01-01','?student_id=2'])assert.equal((await get(1,query)).status,400);
 assert.equal((await get()).status,401);assert.equal((await get(3)).status,403);
});
test('强制改密、停用和失效 token 沿用全局认证边界',async()=>{
 db.prepare('UPDATE users SET force_reset_password=1 WHERE id=1').run();assert.equal((await(await get(1)).json()).code,'FORCE_RESET');
 db.prepare('UPDATE users SET force_reset_password=0,is_active=0 WHERE id=1').run();assert.equal((await get(1)).status,401);
 tokens[1]='expired-token';assert.equal((await get(1)).status,401);
});
