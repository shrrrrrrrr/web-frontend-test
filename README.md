# 当前交付：徽章陈列室与小智点击 · 第1步

[真实4184徽章墙](http://127.0.0.1:4184/me/badges) · [五尺寸截图与原创素材](docs/badge-room/step-01/index.html) · [本步增量文案](docs/badge-room/step-01/copy-review/index.html) · [验证与边界](docs/badge-room/step-01/verification.md)

只完成第1步，未实施金币或连续签到改造。旧交付保持可访问，详见下方历史入口。

# 当前交付 · 地图、头像、运势与全站文案体验补修

真实入口 http://127.0.0.1:4184/explore，API 3154，继续使用原持久教学数据。已合并 183 处用户改稿，完成三种原创像素关卡、九段不重叠路线、原头像入口同步、宜/忌各30条与逐页文案审阅。完成后停止等待复核。

[当前验收与真实截图](docs/experience-patch/index.html) · [点字改稿目录](docs/experience-patch/copy-review/index.html) · [改稿方法](docs/experience-patch/copy-guide.md) · [实际验证](docs/experience-patch/verification.md) · [交付及保护边界](docs/experience-patch/README.md)

以下为历史交付记录；当前状态以上述体验补修文档为准。

---

# 先前交付 · 下一版第 3/3 步完成

当前入口为 http://127.0.0.1:4184/explore（API 3154），教学数据持续使用 `.local/teaching`。三步已完成：十关地图与真实空模板、维护填写/上传与开放反思、每日本地演示签到与后端真实通关徽章及两类演示兑换。当前交付完成后停止，等待最终复核。

[总验收入口](docs/acceptance/index.html) · [第三步真实图集/素材](docs/next-version/step-03/index.html) · [实际验证](docs/next-version/step-03/verification.md) · [启动/备份/恢复](docs/next-version/step-03/README.md) · [本轮可改文案](docs/next-version/step-03/copy-review.html)

金币仍是按浏览器账号隔离的 IndexedDB 演示，签到按服务器北京时间每日 +5。真实徽章由后端统一核验原回顾、全部已发布卡片/必做练习、最新报告与全部有效作品任务最新版本，唯一持久授予；演示金币重置不删除真实徽章、签到去重或兑换同步意图。参观无个人完成依据、空模板和未来节点不能获章。演示兑换只写本人事件和管理员站内通知，不是支付、真实库存或配送。

迁移 021 仅增量新增定义/授予/演示事件。原 45 张表的既有字段和记录、文件与稳定配置已核验；旧 dist、冻结文案/图集、旧服务及公网隧道未覆盖或切换。正式教材、VR个人完成记录、公众号文章、后七课内容与真实奖励仍待提供。

---

以下为此前阶段的历史交接，状态以本页开头及第三步文档为准。

# PBL 科创平台 · 历史前端说明

新版第 1/3 步补修完成，等待地图视觉复核；第 2、3 步尚未开始。保留 `7bf3115`、`e25aba5`、`57dea89`，本次在 `57dea89` 上补修字体与场景关卡，保留现有技术栈和业务。**当前验收以补修文档为准，旧轮次结论保留为历史。**

**[补修前后对照与素材图集](docs/redesign-v2/step-01/patch/index.html)** · [补修交付](docs/redesign-v2/step-01/patch/README.md) · [本次验证](docs/redesign-v2/step-01/patch/verification.md) · [路由与数据范围](docs/redesign-v2/step-01/routes-and-scope.md)

当前字体为官方 ChillReunion v2.700 Round（寒蝉团圆体圆体），本地 WOFF2、静态 500 字重；包含 OFL 1.1 许可。三种新增透明像素设施仅用于显式宇宙主题，编号、课时标题、状态和路线仍由真实 DOM/SVG 绘制。

## 当前入口

| 路径 | 学生内容 |
| --- | --- |
| `/explore` | 已分配课程选择；只有一门也保留选择。旧 `/dashboard`、`/courses` 兼容 |
| `/me` | 账号身份、演示积分徽章、礼品兑换/记录、改密、通知、反馈、退出 |
| `/courses/:courseId` | 直接进入真实课时地图，含本课待办、资源、安排、任务/作品入口 |
| `/courses/:courseId/lessons/:lessonId/learn` | 原学习闭环、报告反思、独立作品及评审状态 |
| `/courses/:courseId/lab`、`/glider` 后缀 | 当前课程自由实验、试飞历史；可携课时与卡片来源返回 |
| `/courses/:courseId/archives`、`/works`、`/reflection` 后缀 | 当前课程本人档案、作品版本和反思 |
| `/courses/:courseId/assistant` | 过渡期现有整页提问；能力依实际后台配置 |
| `/notifications`、`/feedback`、`/change-password` | 平台服务页；强制改密优先 |

旧对象链接读取真实归属后定位课程；没有来源的全局入口先选课程。后台角色原工作台和同名业务路由保留。学生不能自行报名、退课或改变主题绑定，后端才是权限边界。

## 新版隔离预览

在仓库根目录运行：

```powershell
npm run build
npm run preview:v2
```

打开 **http://127.0.0.1:4174**，测试账号 `student_wang / student123`。创建全新临时库和随机子进程密钥，使用合成课程 9001/9002；不覆盖已有库、`.env` 或用户配置。API 使用 3144。**4173 是其他应用，不停止它。** Node 依赖和参考 Python 环境需已安装，详见新版交付说明。当前 `.venv/Scripts/python.exe` 用于 reference；未验证 Linux novaPhy 或全新机器联网安装。

已有本地业务环境仍分别用 `npm run server`、`npm run dev`，默认 API 3000、前端 5173。已有库只启动，不执行 reset 或为预览覆盖变量。

## 本次补修复验

```powershell
npm run lint
npm test
npm run build
npm run test:e2e:v2
npm run test:e2e:v2:patch
# 先启动 preview:v2，再核对 4174 并截图
node scripts/capture-v2-patch.mjs
```

实际结果及日志在补修验证记录：lint/build、61 项单测、22 个浏览器业务场景通过。本次没有后端、接口、数据库迁移、依赖或仿真变更，不重复运行全部后端测试。第一步原有课程范围 API 保持不变。奖励仍为账号本地演示，未实现真实发放、发货或跨设备同步。

正式课程 ID、教材、章节和实验绑定待确认，9001/9002 明确标注测试。未绑定课程的旧试飞和作品保留旧本人 API，不自动分配到第一门课；本步没有新增未归属历史浏览页。角色头像、机器人浮窗、内部页面精修、完整文案交接、维护端内容表单均未进入实施。

[当前设计规范](DESIGN.md) · [源码来源](SOURCE.md) · [新版边界说明](docs/redesign-v2/step-01/README.md)

## 历史交付

[旧版总验收](docs/acceptance/index.html) · [十二轮交接](docs/HANDOFF.md) · [权限恢复补修](docs/round-12/patch/README.md)

[新版第一步原交付](docs/redesign-v2/step-01/README.md) · [原截图与 Smiley Sans 字体验证记录](docs/redesign-v2/step-01/verification.md)（历史构建，不作为 ChillReunion 验证证据）

[第一轮](docs/round-01.md) · [第二轮](docs/round-02.md) · [第三轮](docs/round-03.md) · [第四轮](docs/round-04.md) · [第五轮](docs/round-05.md) · [第六轮](docs/round-06.md) · [第七轮](docs/round-07.md) · [第八轮](docs/round-08.md) · [第九轮](docs/round-09.md) · [第十轮](docs/round-10.md) · [第十一轮](docs/round-11.md) · [第十二轮](docs/round-12.md)

历史测试脚本保留；旧导航断言以其历史轮次为背景，不代表本步全部重新运行。第十轮跨标签脚本仅适配反思路径及退出入口，业务断言保留并实际复验。
