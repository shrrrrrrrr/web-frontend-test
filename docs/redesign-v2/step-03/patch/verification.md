# 本轮实际验证记录

2026-10-08（Asia/Shanghai）。起始 HEAD/远端 `d2defe029ef9eac7f1f726783bce7aa2de7d017c`，工作区干净。原仓库引用 SHA `49c179eed0656b34d8b5a03491c8afd9a9d1de77` 未变。产品只改 `ContentMaintenance.jsx`、`UploadQueue.jsx`；原旅程测试仅增加独立截图输出参数，全部业务断言保留。新增真实浏览器补修测试，不新增后端业务或依赖

## 实际检查

| 执行 | 结果 | 证据 |
| --- | --- | --- |
| `npm run lint` | 通过，0 error / 0 warning | [lint](logs/lint-final.txt) |
| `npm run build` | Vite 生产构建通过 | [build](logs/build-final.txt) |
| `npm test` | 67/67，0 跳过 | [前端](logs/frontend-final.txt) |
| `npm run test:backend` | 完整 173/173，0 跳过，包含上一轮维护/上传/升级/权限契约 | [后端](logs/backend-final.txt) |
| 新增补修浏览器 | 8 个业务子场景＋1 个父级，9/9；滚入新批次行后的图集复验同样 9/9 | [完整复验](logs/browser-final.txt) · [最后一次取证复验](logs/browser-screenshots-final.txt) · [具名记录](browser-screenshots-final.json) |
| 原第三步维护完整旅程 | 10 个业务子场景＋1 个父级，11/11；`pageErrors=[]` | [日志](logs/journey-final.txt) · [旅程记录](evidence/journey.json) |
| 受保护范围/冻结文件 | 后端、迁移、仿真、依赖、全部文案/字体/素材与既有交接无改动 | [范围与哈希](evidence/scope-audit.json) |
| 原预览只读核验 | 原 4173/4174/3144 PID、预览元数据及库路径保持；4174 返回新 dist 和有效资源 | [核验日志](logs/preview-check-final.txt) · [前](evidence/preview-before.json) · [后](evidence/preview-after.json) |
| 图集辅助核验 | 13 张通过截图与 3 张旧缺陷取证可解码，全部本地链接存在，零页面脚本错误 | [日志](logs/gallery-check-final.txt) · [记录](evidence/gallery-check.json) |

业务场景共 **18 个，父级 2 个另计**。补修重复复跑不累计成新增场景。没有将原独立取证脚本退出码 0 当成验收通过，没有复跑或再次声称前轮全部 76 场景和 120 组奖励压力验证

准确具名汇总见 [最终 18＋2 记录](evidence/verification-results.json)；图集/静态预览辅助核验不另算业务场景

## 八项新增回归

1. 新增章节→等待保存及回读→同弹窗改名保存：POST 后 PUT 原 ID，数据库只增加一个对象；同课真实课时归属后学生地图读取改名
2. 新增实验关联→同弹窗改名：PUT 更新原 ID，关联数量不增；额外跨课对象和重复来源负向请求仍由原后端拒绝，唯一约束不改
3. 章节/关联创建成功、GET 回读故意失败：保留服务端 ID、输入及已保存提示。章节重读不 POST，关联在回读失败后直接改字也更新同一对象；数据库不增副本
4. 创建请求模拟接口 503、确认数据库未新增：输入和未保存确认保留，拒绝放弃时弹窗保持；解除故障后经真实 API 创建、再保存改名仍更新同 ID
5. 21 份选择只入队 20；取消 20 份后不刷新选择新文件成功，20 个取消历史保留，上次容量错误消失
6. 20 份真实上传成功后再选两份：保留 20 个原 ID/token，不重传成功项。混合失败保标题和说明；失败项占容量，后续选择仅接受剩余额度。重试后数据库 token 与失败请求相等、说明不丢，实际 POST 总数核对无额外重传
7. 请求经真实 API 已落库，延迟响应时取消：界面未确认，仍计 20 份待处理容量；在途按钮防重复，重试原 token 返回同资源 ID，库中不增第二份。未把取消显示为“服务器一定没保存”
8. 上传成功但回读失败：成功 ID 保留，重读不重传；新选择不清成功历史。撤销创建和受邀授课范围后上传真实 403、数据库不改，主动“重新读取”按原行为清除无权限维护内容。没有把原上传错误处理说成自动重读

原 10 段旅程另覆盖切课不带文件、队列取消/失败恢复、索引重试、导师/教师权限、撤回/恢复、课时/资料读取、报告/作品分开、原评审/第二版本/档案以及原参考引擎试飞返回卡片。视口为 1440×900、768×1024、390×844、360×800、844×390；全部截图输出另存，不覆盖旧图集

## 首次失败与修正

[既有独立缺陷取证](evidence/independent-review/edge-cases.json) 记录章节两 ID、关联重复 POST 冲突、取消 20 后无法入队。来源为原 `test-results/root-review-step03`，其原件未改；取证退出成功不是产品验收成功

- [首次新测试](logs/browser-before.txt)：0/9；包含按钮可访问名称、回读提示、字段标签及受邀导师夹具的测试偏差，不把这些全部归为产品缺陷
- [校准后原代码](logs/browser-before-recheck.txt)：1/9。创建后再次保存/回读恢复及取消/成功历史的六条路径实际失败；在途取消＋原 token 恢复通过。另一个失权场景原测试等待自动重读，与既有上传行为不符，改为核验真实 403 后按既有“重新读取”清除范围；没有放开权限或删数据库断言
- 最小产品修复后 [首次复验](logs/browser-after-first.txt)：7/9；产品保存及容量路径均已通过，余下一条的浏览器请求对象延后采样只取得一份 multipart 正文。改为在失败拦截处捕获实际 token，与恢复上传后的数据库 token/title/description 直接比较，同时保留实际总 POST 数、原成功 ID 和数量断言
- [完整复验](logs/browser-final.txt)：9/9，无跳过；[原旅程](logs/journey-final.txt)：11/11，无跳过。截图另将新批次行滚入可视区复核，未改业务断言；该次原始日志一并保留

只读预览核验的临时脚本首跑因 Node 的 `require` 与顶层 await 混用报模块格式错误，明确使用 ESM 后核验通过；不将该脚本错误说成产品故障或删改预览数据。首次及后续测试记录均保留，不使用正式库重置制造通过

## 复现命令

在 `C:\Users\shr\Desktop\nmg前端\app`，使用既有依赖和 `.venv`：

```powershell
npm run lint
npm run build
npm test
npm run test:backend

$env:PBL_EVIDENCE_DIR = 'C:/Users/shr/Desktop/nmg前端/app/docs/redesign-v2/step-03/patch/regression'
$env:PBL_PATCH_RUN = 'manual-rerun'
node --test tests/redesign-v2.step03-patch.browser.test.js

$env:PBL_STEP03_SCREENSHOTS = 'test-results/step03-patch/manual-journey-screenshots'
node --test tests/redesign-v2.step03.browser.test.js
```

两个浏览器文件按顺序执行，不能同时使用 5199/3148/3150 的同一夹具。setup 每次创建临时库及上传目录，退出仅关闭自己的测试子进程。前一测试的 `PBL_PATCH_RUN`、截图文件夹可改名留存，不清理用户现有取证

已有 4174 不重启；手动刷新读取当前生产构建。核验只读 HTTP，不在现有预览登录或写入。启动与账号沿用 [前轮交接](../README.md)，重启 `preview:v2` 的丢弃临时填写语义不改

## 提交和边界

只正常提交推送 `shrrrrrrrr/web-frontend-test` 的 `main`，最终提交信息及远端一致/工作区检查在最终答复列明，可用 `git rev-parse HEAD`、`git ls-remote origin refs/heads/main`、`git status --short` 复核。原仓库只读，无部署、强推或旧数据清理

未重跑全部历史浏览器压力组；未验证正式教材、后续文案改稿、外部模型质量、真机/软键盘、多浏览器、实际业务库升级或生产部署。奖励仍是账号级本地演示，队列仍是当前页面内存状态。两项补修后停止，等待最终复核
