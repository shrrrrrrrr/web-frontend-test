# 第二步实际验证记录

最终核对日期：2026-10-06（北京时间）。基线 `e4511e8`。仅在新建隔离 SQLite、合成课程和临时附件目录测试，未读取或初始化用户业务库、未覆盖真实模型设置。浏览器 Microsoft Edge `154.0.4258.53`；原后端和 reference 仿真接口照常执行。

## 检查结果

| 实际执行 | 结果 | 原始记录 |
| --- | --- | --- |
| `npm run lint` | 通过，0 错误/警告 | [lint](evidence/lint.txt) |
| `npm run build` | 通过，当前生产产物 | [build](evidence/build.txt) |
| `npm test` | 63/63 单测通过 | [前端单测](evidence/frontend-unit.txt) |
| `npm run test:backend` | 160/160 通过，含头像/旧 schema 兼容升级 | [后端全量](evidence/backend.txt) |
| 头像与课程浮窗浏览器测试 | 13 个业务场景通过（TAP 14，含父测试） | [专项](evidence/step02-browser.txt) · [尺寸与 provider 记录](evidence/step02-browser-details.json) |
| 课程页面状态浏览器测试 | 5 个业务场景通过（TAP 6） | [状态](evidence/page-states.txt) |
| 文案 HTML/JSX 浏览器测试 | 3 个业务场景通过（TAP 4） | [文案浏览器](evidence/copy-browser.txt) |
| `npm run test:e2e:v2` | 17 个既有业务场景通过（TAP 19） | [真实学习闭环](evidence/v2-business.txt) |
| `npm run test:e2e:v2:patch` | 5 个既有业务场景通过（TAP 6） | [字体与场景地图](evidence/v2-patch.txt) |
| 既有跨标签登录/通知/奖励浏览器回归 | 11 个业务场景通过（TAP 12） | [跨标签](evidence/auth-tabs.txt) |
| 离线文案安全提取 | 6/6 通过 | [提取](evidence/copy-extraction.txt) |
| 文案接入审计 | 769/769 UI ID 实际引用，无缺失/未使用；另 34 个教学快照 | [审计](evidence/copy-id-audit.json) |
| 4174 实际生产预览 | 当前 index/入口静态资源逐字节与 dist 一致；真实中文字体、头像读写与五尺寸通过；本地素材页 10 张图片均实际解码 | [预览记录](evidence/preview-4174.json) · [执行输出](evidence/preview-4174.txt) |
| 交付文件核对 | 260 个 HTML 本地链接存在；39 个素材母版及发布文件 SHA256 与清单一致 | [交付文件](evidence/delivery-files.json) |

浏览器业务场景合计 **54 个**。TAP 包含父测试，不能把父测试重复计作业务场景。所有表中结果对应本轮实际运行；没有修改第一步或旧轮次的计数。后端修改仅头像偏好与兼容迁移，评分、学习门槛、物理引擎和奖励存储未改。

## 关键证据

| 场景 | 实际验证与截图 |
| --- | --- |
| 头像 | 6 人姓名/角色对齐；初始 null，真实写入、回读、另一个浏览器重新登录；另一学生与另一课隔离，未知枚举/外加账号/路径及非学生写请求拒绝。写成功回读失败只提示重新读取，不重复写。 [选择](screenshots/avatars-1440.png) · [真实已保存](screenshots/preview-avatar-saved.png) · [失败](screenshots/avatars-error.png) · [回读失败](screenshots/avatars-readback-error.png) |
| 会话与输入 | 同课地图/学习/实验/档案/作品保留问答与草稿；收起期间仍接收回复；发送中编辑下一条不丢失；重复 Enter 不增加请求；中文输入法与 Shift+Enter；旧消息滚动不抢位置。 [桌面](screenshots/chat-1440.png) · [手机](screenshots/chat-390.png) · [错误](screenshots/chat-service-error.png) |
| 范围与清理 | 切课、退出、换账号、停用、强制改密和真实撤回清理；迟到 A 回复不进入 B；恢复重新核验不恢复旧回答。普通 JWT 轮换保输入与 DOM。 [撤回](screenshots/course-withdrawn.png) · [实验撤回](screenshots/lab-withdrawn.png) |
| 助手真实边界 | 真实目录、enabled、服务错误、资料改版移除旧引用与恢复提问；单次 question 协议、站内引用、文本 HTML 不执行；旧助手链接 replace 打开一次，后退不再中转。隔离 HTTPS 回环 provider，不验收外部模型质量。 [改版](screenshots/chat-content-changed.png) · [引用](screenshots/chat-sources.png) · [预览未启用](screenshots/preview-chat-disabled-390.png) |
| 响应式与可达 | 1440×900、768×1024、390×844、360×800、844×390；无页面横向溢出，头像图片实际可见；手机遮罩、窗内点击、Escape、Tab 和焦点恢复；桌面窗外焦点 Escape；浮层互斥、按钮实际命中。 [横屏](screenshots/chat-844.png) · [键盘高度模拟](screenshots/chat-keyboard-height.png) |
| 学习、作品、版本 | 报告通过而作品退回仍可改；无作品任务继续学习；原一次练习与四阶段；报告/作品独立提交，真实版本 2；导师评分后本课档案隔离；课时取消清除，恢复后原浏览器草稿继续。 [学习](screenshots/preview-learning-1440.png) · [卡片](screenshots/learning-card-action.png) · [合法附件新版本](screenshots/work-version-created.png) |
| 局部失败与限制 | 附件 404 不卸载学习；长文字、模拟 503 上传失败保留输入；真实 `.txt` 类型拒绝不生成版本，合法 PNG 重交成功。独立反思保持真实每日一次，失败不重复保存。 [404](screenshots/learning-attachment-404.png) · [上传失败](screenshots/work-upload-submit-error.png) · [原类型限制](screenshots/work-upload-type-rejected.png) · [反思限制](screenshots/reflection-limit.png) |
| 实验 | 七参数 reference 引擎真实计算，courseId/lessonId 归属正确；从卡片 900112 返回原 stage/card；不增加报告/作品或自动完课。课程自由实验不造 lessonId，不混别课及未关联历史。真实结果见 [reference-flight.json](evidence/reference-flight.json)、[试飞](screenshots/reference-flight.png)、[返回卡片](screenshots/return-card.png) |
| 档案、奖励与其他角色 | 本课报告、作品、版本、反馈可靠读取，缺失反馈与空作品有说明；账号演示奖励切课不重置，双标签兑换最终一致；普通教师、导师、管理员原入口与字体保持。 [档案](screenshots/preview-archive-768.png) · [缺失反馈](screenshots/archive-empty-feedback.png) · [空作品](screenshots/works-empty.png) |
| 人工文案 | HTML 保存和 JSON 导出保留 ID、显隐、引号、尖括号与换行；JSX/HTML 冲突列出而不自动覆盖；实际页面 disabled/空串不显示、无空说明容器；不执行表达式或脚本，未知 ID/删除必要操作拒绝。实验两种返回标签改为相同文字后，独立返回实验室入口及真实跳转仍正确；权限错误判断使用既有 API 语义，不依赖人工文案。 [编辑](screenshots/copy-review-edited.png) · [实际删除](screenshots/copy-optional-deleted.png) |

实验注册列表只注册已有滑翔机，没有凭空生成未来实验或假空列表；其加载与错误截图是共享的真实课程授权边界。模拟服务故障与网络延迟均明确标为隔离验收，成功路径、权限撤回、附件类型拒绝、保存与试飞由实际后端执行。

跨标签测试中的客户端 `Date.now` 临时置为 JWT 到期前 240 秒，只用于触发前端提前刷新；未修改后端时钟或宣称把后端 JWT 改成过期。助手限额沿用每账号每分钟 8 次，专项恢复验证实际等待原窗口结束，没有放宽规则。

## 先失败后修正

[首次后端记录](evidence/backend-first-failure.txt)：旧升级断言停在迁移 15，已随新增 16 更新；另有 Node 测试进程反序列化异常，独立头像测试及全量复验均通过。未删除业务断言。

浏览器初次错误记录保存在 [failures](evidence/failures/)：同源 CSP 测试请求写错、按钮/接口定位、桌面窗外 Escape、上传测试用了原规则不支持的 txt、文案换行显示。分别修正测试或实际组件后复验。最后窄屏隐藏姓名误隐藏头像图层也已修复并增加图片可见性断言，不把修复前截图算通过。

最终文案与实验回归首次因验收脚本没有关闭头像弹窗而点击被遮罩拦截，记录见 [copy-return-test-modal.txt](evidence/failures/copy-return-test-modal.txt)。按正常操作关闭弹窗后复验通过，未强制穿透遮罩点击。两处文案与业务判断分离后，重新运行 lint、build、前端单测、文案浏览器、安全提取及既有 17 个真实业务场景；后端与仿真代码没有再次变化。

最后检查交付截图发现素材 HTML 相对路径多退一级，保留 [修复前截图](evidence/failures/assets-preview-path-before-fix.png)。已修正素材与 JSX 文件链接；预览验证增加全部图片 `complete && naturalWidth > 0` 断言，十项素材实际解码后重新截图通过。

## 复验命令与剩余边界

```powershell
cd C:\Users\shr\Desktop\nmg前端\app
npm run lint
npm test
npm run build
npm run test:backend
npm run test:e2e:v2
npm run test:e2e:v2:patch
npm run test:e2e:v2:step02
node --test tests/round10.browser.test.js
.\.venv\Scripts\python.exe tests/copy-extraction.test.py
node scripts/audit-step02-copy.mjs
```

专项文案浏览器测试会在隔离 dev 运行时临时改两处文案验证可删，finally 恢复源码；请勿与开发者正在人工改稿同时运行。它不写真实数据库。日常生产预览在 4174，4173 无关应用保持原进程。

没有真机软键盘/屏幕阅读器/外部 AI 质量验收；390×440 是窗口高度模拟。正式课程内容、主题/章节/实验绑定与用户最终文案仍待确认。第三步教师/管理员填写与资料上传完善没有实施，不自动进入下一步。
