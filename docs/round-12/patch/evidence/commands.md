# 第十二轮权限恢复补修：实际命令与证据

工作目录：`C:\Users\shr\Desktop\nmg前端\app`。起始提交 `f5989eb2ad49702b63c0ce5ce01090e3b18c19ba`，本次受测版本为该提交加本次补修；最终应用与测试指纹见 [summary.json](summary.json)。仅以下指定套件在此版本执行，旧 122 项统计不累加。

## 未修复代码复现与测试校准

新增回归后先执行：

```powershell
node --test tests/access.browser.test.js
```

各次运行依次保存输出，没有覆盖原交付证据：

1. `test-setup-first.txt`：测试最初把 Axios 解包后的业务数据当作原响应读取 status；改为浏览器实际网络响应。
2. `reproduction-before-fix.txt`：未修复应用，同文档站内重入，真实 GET 200，旧挡板没有重试入口；预期失败。
3. `reproduction-edit-not-applied.txt`：一次文本编辑未应用，仍是旧应用，重复复现；不算修复后的验证。
4. `test-status-first.txt`：修复已生效；测试误等 403，原后端取消课时返回 404；校准精确断言，403 改为明确的故障注入分支。
5. `test-layout-first.txt`：切换到 390 宽后过早检查布局；改为等待页面实际无横向溢出，断言保留。
6. `test-previous-check-race.txt`：站内恢复已通过，但旧撤课场景在前一条对象核验结束前发 focus，导致测试请求被合并。改为等待前一条完整核验结束后再撤课；应用检查逻辑未改。

最终权限回归（新的隔离库、真实 API）：

```powershell
$env:ROUND12_PATCH_CAPTURE_DELIVERY='1'
node --test tests/access.browser.test.js
Remove-Item Env:ROUND12_PATCH_CAPTURE_DELIVERY
```

输出保存为 [access-after-fix.txt](access-after-fix.txt)。截图标志仅用于该套件的两张补图，不更新旧完整图集。

## 前端检查

```powershell
npm run lint
npm test
$env:VITE_STUDENT_TEST_CONFIG='1'
npm run build
Remove-Item Env:VITE_STUDENT_TEST_CONFIG
```

对应 [lint.txt](lint.txt)、[unit.txt](unit.txt)、[build.txt](build.txt)。构建时置测试标志用于验证生产 `DEV=false` 确实关闭测试配置；未变更正式配置。三条命令退出码均为 0；58 项单测通过。

## 指定浏览器套件顺序复验

```powershell
foreach ($suite in @('round10', 'round11', 'round12')) {
  node --test "tests/$suite.browser.test.js" *> "docs/round-12/patch/evidence/$suite.txt"
  Write-Output "${suite}_EXIT=$LASTEXITCODE"
}
```

在权限套件完成后执行上述循环，文件逐一运行，各自新建隔离 SQLite、上传目录和随机测试凭据，未复用用户数据库。端口：access 3120/5182，round10 3129/5191，round11 3130/5193 与测试 HTTPS provider 3131，round12 3132/5194 与正式预览 5195。未设置 ROUND12_CAPTURE_DELIVERY；其例行诊断截图保留在被忽略的 test-results，不覆盖旧 18 张截图。

第十二轮使用已有 Python 3.12.10 与 reference 引擎运行一次真实课程试飞，再执行缺解释器分支；未改算法。第十一轮 provider 与视频均在本机用合成夹具生成，不调用外部收费模型。

最终日志：[round10.txt](round10.txt) · [round11.txt](round11.txt) · [round12.txt](round12.txt)。结果只按每个场景的最终有效运行计一次，父测试另计。第十轮已有 20 组并发刷新单独记录，不作为 20 条业务场景；未执行 round10-rewards 的 120 组压力循环。

## 交付资料核对

补图加载、尺寸、入口链接与差异边界另见本目录 delivery-check.txt 和 scope-check.txt。没有修改之前 docs/round-12/evidence 内任何原始 txt/json 输出。新增日志入库只移除行尾空白和末尾空行，不改变命令状态、报错或数值。

本次补图和改动文档的可复跑检查：

```powershell
node docs/round-12/patch/evidence/check-delivery.mjs
```

该脚本只验证相关文档的本地链接、两张新补图的真实尺寸和补图页面三尺寸布局，不重复整套旧图集或业务场景。
