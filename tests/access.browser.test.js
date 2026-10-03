import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(root, 'backend/package.json'));
const Database = require('better-sqlite3');
const scratch = mkdtempSync(path.join(tmpdir(), 'star-voyage-access-'));
const dbPath = path.join(scratch, 'test.db');
const backendUrl = 'http://127.0.0.1:3120';
const base = 'http://127.0.0.1:5182';
const env = { ...process.env, NODE_ENV: 'test', DB_PATH: dbPath, PORT: '3120',
  JWT_SECRET: randomBytes(32).toString('hex'), UPLOAD_PATH: path.join(scratch, 'uploads'),
  FEEDBACK_UPLOAD_PATH: path.join(scratch, 'feedback'), CORS_ORIGIN: base, API_PROXY_TARGET: backendUrl,
  LOGIN_RATE_LIMIT_IP: '500', LOGIN_RATE_LIMIT_USER: '500' };

async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) return; } catch { /* 等待独立测试服务 */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Service did not start: ${url}`);
}

test('权限错误仅清理失效对象，保留不相关输入（真实本地 API）', { timeout: 120000 }, async (t) => {
  execFileSync(process.execPath, ['database/init.js'], { cwd: path.join(root, 'backend'), env, stdio: 'pipe' });
  const db = new Database(dbPath);
  // 以下都是独立临时库中的明确测试夹具，不修改应用后端或正式教学数据。
  db.prepare("INSERT INTO knowledge_cards (id, lesson_id, title, content, sort_order, status, created_by) VALUES (1,1,'权限验证测试卡','仅用于本地错误隔离回归。',1,'published',2)").run();
  db.prepare("INSERT INTO resources (id,course_id,lesson_id,resource_type,title,file_path,upload_by) VALUES (99,1,1,'other','故意缺失的测试附件',?,2)").run(path.join(scratch, 'uploads/missing.pdf'));
  db.prepare("UPDATE courses SET status='published' WHERE id=2").run();
  db.prepare('INSERT INTO enrollments (student_id,course_id) VALUES (4,2)').run();
  const server = spawn(process.execPath, ['-e', "require('./app').listen(3120, '127.0.0.1')"], { cwd: path.join(root, 'backend'), env, windowsHide: true, stdio: 'pipe' });
  const vite = spawn(process.execPath, [path.join(root, 'frontend/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5182', '--strictPort'], { cwd: path.join(root, 'frontend'), env, windowsHide: true, stdio: 'pipe' });
  let browser;
  let logs = '';
  for (const child of [server, vite]) {
    child.stdout.on('data', (chunk) => { logs += chunk; });
    child.stderr.on('data', (chunk) => { logs += chunk; });
  }
  try {
    await Promise.all([waitFor(`${backendUrl}/api/health`), waitFor(base)]);
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    mkdirSync(path.join(root, 'test-results'), { recursive: true });
    t.afterEach(async (subtest) => {
      if (!subtest.passed) {
        console.log('FAILED ACCESS PAGE', subtest.name, page.url(), (await page.locator('body').innerText()).slice(0, 4000));
        await page.screenshot({ path: path.join(root, 'test-results/access-failure.png'), fullPage: true });
      }
    });
    await page.goto(`${base}/login`);
    await page.getByPlaceholder('账号', { exact: true }).fill('student_wang');
    await page.getByPlaceholder('密码', { exact: true }).fill('student123');
    await page.getByRole('button', { name: /登\s*录/ }).click();
    await page.waitForURL('**/explore');
    await page.getByRole('heading', { name: '探索地图', exact: true }).waitFor();
    const recheck = async () => {
      const response = page.waitForResponse((value) => value.url() === `${base}/api/courses` && value.status() === 200);
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await response;
    };

    await t.test('真实附件 404 显示局部错误，学习页和导航继续存在', async () => {
      await page.goto(`${base}/courses/1/lessons/1/learn`);
      await page.getByRole('button', { name: /下载资料/ }).click();
      await page.getByText(/“故意缺失的测试附件”下载失败/).waitFor();
      await page.getByRole('heading', { name: '认识月球环境', exact: true }).waitFor();
      assert.equal(await page.getByText('当前内容已不可访问', { exact: true }).count(), 0);
      assert.equal(await page.getByRole('menuitem').count(), 3);
      await page.getByRole('button', { name: '我已完成课堂回顾', exact: true }).click();
      await page.getByRole('button', { name: '我已学完本卡片', exact: true }).click();
      await page.getByLabel('学习总结', { exact: true }).fill('错误隔离测试：这段未提交报告必须保留。');
      await page.evaluate(() => { window.accessTestInput = document.querySelector('#summary'); });
    });

    await t.test('附件 404、无关课程拒绝和课程更新时间变化不重建正在填写的报告', async () => {
      for (const url of ['/courses/resources/99/download', '/courses/3']) {
        const probe = page.waitForResponse((value) => value.url() === `${base}/api/learning/lessons/1` && value.status() === 200);
        await page.evaluate(async (requestUrl) => {
          const { default: client } = await import('/src/api/client.js');
          try { await client.get(requestUrl, { responseType: requestUrl.endsWith('/download') ? 'blob' : 'json' }); } catch { /* 预期真实 404/403 */ }
        }, url);
        await probe;
        assert.ok(await page.evaluate(() => window.accessTestInput === document.querySelector('#summary')), '原报告输入节点仍挂载');
        assert.equal(await page.getByLabel('学习总结', { exact: true }).inputValue(), '错误隔离测试：这段未提交报告必须保留。');
      }
      db.prepare("UPDATE courses SET updated_at='2030-01-01 00:00:00' WHERE id=1").run();
      await recheck();
      assert.ok(await page.evaluate(() => window.accessTestInput === document.querySelector('#summary')));
    });

    await t.test('不相关课程撤回和后台网络失败保留当前报告，重试可恢复检查', async () => {
      db.prepare("UPDATE courses SET status='draft' WHERE id=2").run();
      const probe = page.waitForResponse((value) => value.url() === `${base}/api/learning/lessons/1` && value.status() === 200);
      await recheck(); await probe;
      assert.ok(await page.evaluate(() => window.accessTestInput === document.querySelector('#summary')));
      await context.route('**/api/auth/me', (route) => route.abort('failed'));
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await page.getByText('权限检查暂未完成', { exact: true }).waitFor();
      assert.ok(await page.evaluate(() => window.accessTestInput === document.querySelector('#summary')));
      assert.equal(await page.getByLabel('学习总结', { exact: true }).inputValue(), '错误隔离测试：这段未提交报告必须保留。');
      await context.unroute('**/api/auth/me');
      await page.getByRole('button', { name: '重新检查', exact: true }).click();
      await page.getByText('权限检查暂未完成', { exact: true }).waitFor({ state: 'hidden' });
    });

    await t.test('真实当前课程撤回清除学习内容并保留可用导航', async () => {
      db.prepare("UPDATE courses SET status='draft' WHERE id=1").run();
      await recheck();
      await page.getByText('当前内容已不可访问', { exact: true }).waitFor();
      assert.equal(await page.getByLabel('学习总结', { exact: true }).count(), 0);
      assert.equal(await page.getByRole('heading', { name: '认识月球环境', exact: true }).count(), 0);
      assert.equal(await page.getByRole('menuitem').count(), 3);
      await page.getByRole('button', { name: '返回探索地图', exact: true }).click();
      await page.getByText('老师还没有为你分配已发布的课程，请联系老师。').waitFor();
    });

    await t.test('单个课时对象失效时仅清当前页，课程仍可进入', async () => {
      db.prepare("UPDATE courses SET status='published' WHERE id=1").run();
      await page.goto(`${base}/courses/1/lessons/1/learn?stage=2`);
      await page.getByLabel('学习总结', { exact: true }).waitFor();
      const status = db.prepare('SELECT status FROM lessons WHERE id=1').get().status;
      db.prepare("UPDATE lessons SET status='cancelled' WHERE id=1").run();
      await page.evaluate(async () => {
        const { default: client } = await import('/src/api/client.js');
        try { await client.get('/learning/lessons/1'); } catch { /* 真实课时对象不可访问 */ }
      });
      await page.getByText('当前内容已不可访问', { exact: true }).waitFor();
      assert.equal(await page.getByLabel('学习总结', { exact: true }).count(), 0);
      assert.equal(await page.getByRole('menuitem').count(), 3);
      db.prepare('UPDATE lessons SET status=? WHERE id=1').run(status);
      await page.getByRole('button', { name: '重新检查', exact: true }).click();
      await page.getByLabel('学习总结', { exact: true }).waitFor();
      assert.equal(await page.getByLabel('学习总结', { exact: true }).inputValue(), '错误隔离测试：这段未提交报告必须保留。');
    });

    await t.test('反思课程撤回仅移除关联，未提交正文保留', async () => {
      db.prepare("UPDATE courses SET status='published' WHERE id IN (1,2)").run();
      await page.goto(`${base}/archives/reflection`);
      await page.getByLabel('遇到的困难', { exact: true }).fill('本地测试反思文字应保留。');
      await page.getByLabel('本次课程', { exact: true }).click();
      await page.locator('.ant-select-item-option-content').filter({ hasText: '月球基地设计师' }).click();
      db.prepare("UPDATE courses SET status='draft' WHERE id=2").run();
      await recheck();
      assert.equal(await page.getByLabel('遇到的困难', { exact: true }).inputValue(), '本地测试反思文字应保留。');
      assert.match(await page.locator('.ant-select').first().innerText(), /月球基地设计师/);
      db.prepare("UPDATE courses SET status='draft' WHERE id=1").run();
      await recheck();
      await page.getByText(/所选课程已不可访问，已清除课程与课时关联/).waitFor();
      assert.equal(await page.getByLabel('遇到的困难', { exact: true }).inputValue(), '本地测试反思文字应保留。');
      assert.doesNotMatch(await page.locator('.ant-select').first().innerText(), /月球基地设计师/);
    });

    await t.test('助手课程撤回清除课程上下文，保留尚未发送的问题', async () => {
      db.prepare("UPDATE courses SET status='published' WHERE id IN (1,2)").run();
      // 只启用现有界面以测试未发送输入；不发送请求、不配置模型或密钥。
      db.prepare('UPDATE ai_settings SET enabled=1 WHERE id=1').run();
      await page.goto(`${base}/dashboard/ai?course_id=1`);
      const question = page.getByPlaceholder('输入与当前课程相关的问题');
      await question.fill('这是一段尚未发送的测试问题。');
      db.prepare("UPDATE courses SET status='draft' WHERE id=2").run();
      await recheck();
      assert.equal(await question.inputValue(), '这是一段尚未发送的测试问题。');
      assert.equal(await question.isEnabled(), true);
      db.prepare("UPDATE courses SET status='draft' WHERE id=1").run();
      await recheck();
      await page.getByText(/当前课程已不可访问，已清除该课程的提问上下文/).waitFor();
      assert.equal(await question.inputValue(), '这是一段尚未发送的测试问题。');
      assert.equal(await question.isDisabled(), true);
      assert.doesNotMatch(await page.locator('.ant-select').first().innerText(), /月球基地设计师/);
    });
    assert.deepEqual(errors, [], '无浏览器未捕获异常');
  } catch (error) { console.error(logs.slice(-4000)); throw error; }
  finally { await browser?.close(); server.kill(); vite.kill(); db.close(); }
});
