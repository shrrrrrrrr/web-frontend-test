# 课时编辑防丢稿与报告预览 · 补修交接

本轮接续 `832ead9ac8540bf4454c92b6d4e6428f3a3716b0`。开始时工作区干净；只管理新仓库 `shrrrrrrrr/web-frontend-test`。本轮不新增业务、后端字段、永久草稿或公网部署。

- [五尺寸截图与本地证据入口](index.html)
- [教材填写、上传、保存及发布指南](../真实教材录入使用指南.html)
- [指南 Markdown 源稿](../真实教材录入使用指南.md)
- [逐场景验证与首跑记录](verification.md)

## 修复范围

1. 阶段、卡片、课时、学生效果切换及相关编辑入口共用确认逻辑。取消保持当前面板和输入；确认丢弃才清理输入与未保存标记。维护顶部重新读取保留所选课时与阶段，确认后仅清理编辑面板。
2. 原位编辑分别记录正文修改和待处理队列。保存正文只清正文修改，不清待上传、失败或结果未确认选件。取消关闭、切换或离开保留原 File、标题、说明、上传 token 和既有 ID；未知结果继续用原 token 核对重试。
3. 保存/上传进行中阻止站内卸载。退出维护组件会清理父级标记，防止权限清除后残留处理中状态。账号失效和强制改密继续按原认证处理。
4. 学生与维护预览共用原报告字段定义：`system.learning.055`～`059`。五项原人工标题保持，维护两种模式都禁用提交，教材预览不读取学生私有学习记录。

仍采用“先上传图片，再另存正文”的两步流程。确认丢弃临时输入不撤销已成功上传的资源或已保存正文；未插入图片可从当前课时已有图片中选择，无需重复上传。内存队列与临时正文不具备永久、跨设备或崩溃恢复能力。浏览器刷新/关页提示由浏览器控制，强制离开仍可能丢失临时输入。

## 真实环境与数据

实际查看入口：[本地教学平台](http://127.0.0.1:4184)。管理员或负责执行导师进入课程 → 课程内容维护 → 可视化填写 / 学生效果预览。真实第一课仍为 `/courses/9003/lessons/90022/learn`；ID 仅用于说明本机核对对象，产品没有写死绑定。

4184 / 3154 继续使用原 `.local/teaching`，本轮未重启服务、未初始化、未重置、未切临时库。构建前核对了运行路径，并生成在线 SQLite 一致备份 `.local/teaching-before-authoring-patch-20261011`。备份保留原已有的 1 个缺失资源引用，未造文件掩盖。

本轮开始另取私有校验基线 `.local/authoring-patch-20261011`：56 张表、21 个附件/反馈文件、15 个系统文案及审阅文件和私有配置。除认证会话生命周期外不排除学习、评分、金币、签到或文章字段；复验按当前基线比较，避免用历史备份覆盖之后的合法教学记录。真实文章原文字及九个图片位置、手工文案、附件与教学数据保持不变。

截图、日志、合成库、实际库、照片、备份及私有配置均留本机忽略目录；Git 只收源码和脱敏文档。截图来自真实 Edge 浏览器中的独立合成教材，明确不是正式课程或真实学生数据。

## 如何独立复验

在 `app` 目录运行：

```powershell
npm run lint
npm run build:teaching
npm test
$env:PBL_PATCH_RUN='independent'
node --test tests/lesson-authoring-patch.browser.test.js
$env:PBL_AUTHORING_RUN='patch-independent'
node --test tests/lesson-authoring.browser.test.js
$env:PBL_EVIDENCE_DIR='docs/lesson-authoring/regression/teaching'
$env:PBL_STEP02_RUN='patch-independent'
node --test tests/lesson-authoring-teaching.browser.test.js
$env:PBL_COINS_RUN='patch-independent'
node --test tests/lesson-authoring-coins.browser.test.js
node --test tests/lesson-authoring-copy.browser.test.js
node scripts/audit-authoring-patch.mjs check
```

构建只更新前端文件。日常更新前仍应按指南先做一致备份；本轮服务已运行，无需再次 start。浏览器套件各自建合成库，只操作隔离端口。数据校验工具的 `baseline` 只在不存在目标目录时创建，拒绝覆盖已有基线。

后端本轮未改，相关完整检查用 `node --test --test-concurrency=1 test/*.test.js` 在 `backend` 目录执行。没有为增加数量重复运行迁移、备份恢复或全部仿真测试；既有维护回归中的一次参考引擎真实试飞仍正常执行。

未验收边界：真实手机软键盘、系统强制关闭/休眠丢内存、真实设备触摸行为、永久教材草稿和公网运维。本轮结束后停止，等待独立复核。
