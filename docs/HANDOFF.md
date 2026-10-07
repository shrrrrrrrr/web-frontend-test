# 当前交接说明

## 新版第 3/3 步（当前）

以 [第三步 README](redesign-v2/step-03/README.md)、[真实图集](redesign-v2/step-03/index.html)、[实际验证](redesign-v2/step-03/verification.md) 和 [边界](BOUNDARIES.md) 为当前交接。第一步独立课程空间/地图、第二步课程页面/头像/机器人/文案已保留，第三步接入真实维护填写与上传

负责导师/管理员从原课程详情“课程内容维护”或内容工作台进入；普通教师仍只读观察。课程主题、章节、教学提示和实验关联持久化，正式课程不再手改测试 ID 配置。资料/回放归属原对象，学生读取公共＋本课时，封面私有认证读取。原排课、卡片/练习、分配学生、发布、作品版本及报告评审继续原入口；可选说明清空后隐藏，不由快照回填

本机 `npm run build` 后 `npm run preview:v2` 使用 4174/3144 和全新 OS 临时库，4173 不动。测试账号、确切入口与填写步骤见 README；正式环境继续 server/dev，备份后由现有机制追加 017，不初始化/重置已有库。[字段填写地图](redesign-v2/step-03/content-field-map.md)、[上传矩阵](redesign-v2/step-03/upload-formats.md)、[升级与恢复](redesign-v2/step-03/interfaces-and-migrations.md) 教维护者如何操作

系统改字用 [新版 HTML](redesign-v2/step-03/copy-review.html) 与对应 baseline 安全提取；912 个系统 ID（旧 805 不变＋新增 107）及 34 个独立合成快照。前两版文案、素材和图集冻结。未收到用户已保存改稿或正式教材，未宣称应用。草稿 key、账号演示奖励/运势、provider 与参考物理规则保持，完成后停止等待最终复核

## 原第十二轮历史交接（追溯用）

以下保留当时记录；静态配置、无迁移和旧视觉结论不能作为新版当前能力判断

本文件描述第十二轮交付的当前实现。权限恢复补修及当前版本复验见 [补修说明](round-12/patch/README.md)。总入口：[图集](acceptance/index.html) · [验收矩阵](round-12/matrix.md) · [执行结果](round-12.md) · [待办边界](BOUNDARIES.md)。教学内容及真实奖励不在本次前端完成声明内。

## 模块与实现位置

路径以下均相对仓库。

| 入口 / 模块 | 主要实现 | 数据与保留规则 |
| --- | --- | --- |
| 认证、公共状态、角色导航 | frontend/src/store/AuthContext.jsx；api/client.js；components/AppLayout.jsx、RoleGuard.jsx、PageStatus.jsx、NotFound.jsx | 原 JWT/refresh/me/改密；同账号轮换不重挂业务；退出/停用/换号清范围；未知页不静默跳转 |
| 学生外壳/伙伴 | student/visual/StudentShell.jsx、StudentTheme.jsx；student/StudyPartner.jsx | 三入口、顶栏、抽屉、伙伴收起重开；进入原助手路由 |
| 首页与地图 | student/ExploreHome.jsx、Explore.jsx、homeData.js、homeModel.js、routeModel.js | 课程/课时摘要与 tasks；学习、报告、作品分别决定动作；并发受控，不遍历完整学习包 |
| 课时学习与作品 | pages/learning/LessonLearn.jsx；student/LessonWorks.jsx、StudentWorkDetail.jsx、StudentWorks.jsx；pages/works/Upload.jsx | 原 learning / tasks / works 接口；手动回顾、一次作答、卡片完成、报告反思、独立作品版本/评审 |
| 实验 | student/Lab.jsx、StudentGliderWorkspace.jsx；pages/glider/Simulator.jsx；student/experimentContext.js | glider 原七参数、结果/文件接口；独立不伪造课程，来源保留 course/lesson/stage/cardId；返回站内路径经校验 |
| 档案/反思 | student/StudentArchive.jsx、ArchiveRecords.jsx、ArchiveReports.jsx、archiveModel.js；pages/archives/Reflection.jsx | 本人档案与当前课程交集；报告按需；缺字段降级；原反思配额 |
| 奖励 | student/Rewards.jsx、rewardAdapter.js、rewardDatabase.js、rewardStore.js、rewardConfig.js | 本地演示；原生 IndexedDB accounts 按账号事务；数值集中配置 |
| 通知/反馈 | pages/notifications、pages/feedback；store/NotificationProvider.jsx | 原 API、已读/批量/附件/回复；账号级写状态跟随当前筛选 |
| 助手/兼容入口 | student/StudentAssistant.jsx、StudentTasks.jsx、StudentTaskRedirect.jsx、CourseReview.jsx、CourseResourceDownload.jsx | 原 AI provider/来源；任务 replace 跳课时；课程回看摘要、回放、资料、任务、本人作品五区 |
| 可访问范围 | student/StudentScope.jsx、accessPolicy.js、useRemote.js、useCourseResource.js | 进入、焦点、30 秒和对象失败触发原核验；附件失败只局部处理；无后端实时撤回事件 |

除第一行公共组件外，表中 frontend/src/ 前缀省略。管理员/导师/教师/新媒体继续原页面，不因学生改版扩大权限。

## 启动与环境

### 已有环境

在根目录 `npm run server`，另一终端 `npm run dev`。原有本地配置、库与附件保持不动。默认网页 `http://127.0.0.1:5173`，API `http://127.0.0.1:3000/api`。后端通过现有 scripts/local-server.cjs 绑定回环地址；若存在根 .venv 且未设 GLIDER_PYTHON，包装器选用其 Python 与 reference 后端。

### 首次克隆

```powershell
npm ci
npm --prefix frontend ci
npm --prefix backend ci
```

这些是按三个既有锁文件安装的步骤，本轮没有重做联网安装，不保证本机以外的原生模块安装环境。保留锁文件，不通过升级解决环境差异。

配置参照 [backend/.env.example](../backend/.env.example)。仅在尚无 backend/.env 时自行复制；不要覆盖现有文件。必须自行替换 JWT_SECRET 占位字符串；使用模型配置时另设独立 64 位十六进制 AI_CONFIG_SECRET 并妥善备份，不能与 JWT 共用、不能随意更换导致原配置不可解密。PORT、CORS_ORIGIN、DB_PATH、UPLOAD_PATH、FEEDBACK_UPLOAD_PATH 与本机实际地址/目录一致，AI_ALLOWED_BASE_URLS 只允许实际服务域名。GLIDER_PYTHON 指向可用解释器，GLIDER_BACKEND=reference 用于本地参考引擎；本轮 GLIDER_RENDERER=mpl。不要提交 .env、密钥、数据库或附件。

### 空目录隔离启动

下面是无需覆盖 backend/.env 的隔离方式，配置全部通过当前终端环境变量传给子进程。需要已有安装依赖；初始化创建的是原项目示例数据，**不是正式星海远航课程**。

```powershell
$acceptanceData = Join-Path $env:TEMP ('star-voyage-local-' + [guid]::NewGuid())
New-Item -ItemType Directory $acceptanceData | Out-Null
$env:NODE_ENV='test'
$env:DB_PATH=Join-Path $acceptanceData 'local.db'
$env:UPLOAD_PATH=Join-Path $acceptanceData 'uploads'
$env:FEEDBACK_UPLOAD_PATH=Join-Path $acceptanceData 'feedback'
$env:JWT_SECRET=node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
$env:CORS_ORIGIN='http://127.0.0.1:5173'
$env:GLIDER_BACKEND='reference'
$env:GLIDER_RENDERER='mpl'
# Python 已配置时指定 GLIDER_PYTHON；勿覆盖用户已有环境。
npm run db:init
npm run server
# 第二个终端在同一仓库运行 npm run dev
```

这里的 test 环境仅用于本机隔离测试。已有数据不运行 db:init/reset；原 db:init 本身会拒绝覆盖有业务数据的库。生产账号供应、服务部署与密钥管理不是本轮验收。示例学生账号来自 init.js（如 student_wang），只用于临时库，不要求修改现有用户密码。

参考 Python 依赖来自原 [simulation/glider/requirements.txt](../simulation/glider/requirements.txt)。本轮已有环境：Python 3.12.10、NumPy 2.5.3、Matplotlib 3.11.2、Pillow 12.3.0；没有安装或验证 novaPhy。缺解释器时实际界面提示「模拟引擎暂不可用，请稍后再试或联系老师」，禁用开始试飞，保留参数和重新检查环境。助手未启用显示「灵境小智暂未启用」；启用但缺配置走真实服务错误，允许修复配置后主动重试，不提供假回答或隐式规则回退。

### 本机正式构建预览

```powershell
npm run build
$env:API_PROXY_TARGET='http://127.0.0.1:3000'
npm --prefix frontend run preview -- --host 127.0.0.1 --port 4173
```

先启动对应的本地 API。Vite preview 使用既有 /api 与 /uploads 代理，静态路径回退到 SPA；测试脚本会自动用 3132 / 5195 启动自己的隔离组合。本轮正式产物验证登录、探索、课时深链刷新、通知、伙伴与 403；构建时特意设测试标志为 1 验证 DEV 判断仍关闭测试映射和预览页。日常正式构建不需要该标志。

Vite preview 仅本机验收，非生产部署方案。现有生产 CSP meta 保留，实际部署还需静态服务的安全头、HTTPS、API 路由及运维配置，未在本轮发布公网。

## 正式、测试与本地保存

- 正式章节：frontend/src/student/config.js 的 courseGroups。按负责人确认的真实 courseId 和 lessonIds 填写；未分组课时仍可见，顺序不创造解锁门槛。
- 正式实验绑定：frontend/src/student/experimentConfig.js 的 EXPERIMENT_ASSOCIATIONS。可指定 courseId / lessonId / stage / cardId，实验 ID 从 config.js 注册项选择。不要按名称推断。两项当前均为空。
- 合成映射：同文件内测试数组，仅 import.meta.env.DEV 且 VITE_STUDENT_TEST_CONFIG=1 时消费。fixtures 里课程、卡片、媒体和回答用于自动验收，不是正式教材。
- 报告与作品文本草稿按当前账号和对象隔离保存在浏览器 localStorage；界面说明本机保存，不包括文件内容。提交成功后按原逻辑清除。反馈、独立反思、助手未发送内容没有新增持久草稿，刷新/离页可能丢失。
- 真实已提交作品、报告、反思、试飞和反馈由原服务器保存。评分不等于积分，实验成功不等于课时完成或作品提交。
- 奖励仅 IndexedDB `star-voyage-rewards` / `accounts`，初始 120。首次合法 v1 localStorage 数据导入一次，保留备份、不双写；重置写初始快照而不删初始化记录。旧标签必须刷新，旧版本写入不会合并；代码回退不会回退浏览器数据。读写失败停止操作并说明，禁止悄悄用内存成功代替持久成功。

## 复验与维护

见 [本轮结果](round-12.md)、[矩阵](round-12/matrix.md)。npm run test:acceptance 顺序运行 11 个测试文件。测试使用真实本地 API，故障场景用明确响应拦截或临时库状态变化；不会读用户实际数据库、模型配置或附件。OpenSSL / ffmpeg / Edge / Python 是浏览器套件额外条件。

如仅回退本轮前端及文档，用 Git 正常 revert 对应提交，不强推。没有本轮数据库迁移；回退代码不恢复旧业务数据或本地奖励数据。后端范围缺口仍在 [边界](BOUNDARIES.md)，不要把前端已滤除误当服务端已经修复。
