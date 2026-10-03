# 第五轮交付：课时学习与作品提交视觉

日期：2026-10-03。基于第四轮 `7bc578b` 继续，开始时工作区干净；没有重建或回退项目。本轮沿用「晴空观测站」，完成具体课时工作区、课时作品与实验入口、作品提交和学生作品详情，停在本轮验收。

## 查看与启动

- [按页面、状态与尺寸查看真实浏览器截图](round-05/index.html)。支持 1440×900、768×1024、390×844 筛选；首屏与滚动后分别标注。
- [视觉与组件规范](../DESIGN.md)。首页、地图保留第四轮，旧图见 [第四轮图集](round-04/index.html)。
- 在 `app` 目录两个终端分别运行 `npm run server`、`npm run dev`，访问 `http://127.0.0.1:5173`。本地合成学生账号 `student_wang` / `student123`。安装说明见 [README](../README.md)，已有库无需重新初始化。
- `npm run test:e2e:round5` 使用独立临时 SQLite、独立浏览器上下文和端口 3124/5186，完成真实 API 交互并生成本轮截图；随后运行 `node scripts/build-round5-gallery.mjs` 重建离线图集。

截图中的课程、任务、题目、报告和作品均为明确标注的合成验收材料。测试仅在临时库设置评审与撤回等状态，不向开发库导入正式教学内容，不覆盖第三、四轮历史截图。日常初始化库尚无知识卡片，会如实显示等待导师发布；完整闭环可用上述隔离浏览器测试复现。

## 页面层级与交互

目标用户是获准访问具体课时及本人记录的学生。沿用原角色、课程发布、有效报名、对象归属和强制改密限制，后端仍为最终授权边界。

| 页面 | 主任务与层级 | 关键状态与动作 |
| --- | --- | --- |
| `/courses/:courseId/lessons/:lessonId/learn` | 真实课程/课时标题与返回入口 → 四阶段导航和小进度 → 当前学习内容 → 独立作品任务区 | 当前浏览、完成、锁定分别表示；保留 stage/cardId、`#lesson-works`、task_id 定位 |
| 课堂回顾 | 回放播放器与列表 → 配套资料 → 手动确认完成 | 无回放、无资料、播放/下载失败可重试，其他学习不卸载；同一播放地址重试会重建媒体元素 |
| 知识卡片与练习 | 卡片位置与导航 → 标题/摘要/正文/要点/误区 → 一次作答与就近反馈 → 完成卡片 | 五种题型、无题卡片、未解锁、已完成；答错可查看解析，仍须全部作答后确认完成 |
| 报告与反思 | 原反馈与草稿位置 → 学习记录 → 可展开的结构化反思 → 提交确认 | 隐藏必填字段验证失败会展开并聚焦；提交错误靠近按钮；已提交内容只读，退回才可修改 |
| 导师评审 | 真实状态 → 报告版本与时间 → 评语/已有分数 → 实际可用下一步 | 待评审可以回看卡片、报告或处理作品；通过不代表作品通过，无倒计时与奖励承诺 |
| 课时作品与实验 | 独立任务标题、说明、截止、版本与下一步；实验小提示区只在已有配置匹配处出现 | 无作品任务有准确空状态；最新作品退回仍能修改；实验不自动提交或完成课时 |
| `/works/upload` | 所属课程与任务 → 修改意见/草稿说明 → 名称/成果文字 → 单附件与提交 | 名称必填，成果文字或附件至少一项；失败保留当页文字和 File，成功沿用返回原课时流程 |
| `/works/:id` 学生分支 | 作品内容/真实提交时间 → 附件 → 对应版本反馈；侧边版本记录 | 可切换历史版本；旧退回版存在新版时标已修改；仅最新退回版可重新提交；附件局部错误可重试 |

桌面使用紧凑深蓝阶段导航与宽浅色阅读区，作品页为主内容与任务/版本说明两栏。768px、390px 上下排列，阶段按钮两列换行；作品提交先交代任务再填写，作品详情先读内容与反馈再看版本记录。正文 16px，长标题自然换行，长表单自然滚动，不固定阶段导航、不放大幅首屏插画。动态底部留白仍由原学习伙伴管理，弹窗层级高于伙伴。

共用 `StudyHeader`、`StudySection`，复用 PixelPanel、PixelButton、PixelTag、PixelProgress 和 Ant Design 表单、弹窗及选择器。学习样式限制在 `.student-pixel .study-*` 下；作品详情明确分为 StudentWorkDetail 与原 StaffWorkDetail，管理员和执行导师保留原评审表单。旧课程级 `/courses/:id/learn` 不变。

没有新增图片或外部字体。小图标继续使用已有原创 book、archive、back、lab，伙伴使用第四轮 WebP 派生图；[原素材清单](../frontend/public/assets/pixel-v1/manifest.json) 与源记录保持不变。

## 核对后的业务依据

- `backend/services/learningService.js` 与 `backend/helpers/learningGate.js`：回顾手动确认；卡片顺序不变；每题一次，全部作答而非全部答对才能完成；无已发布卡片不自动完成。进度仍为回顾 25%、卡片 35%、报告反思 25%、评审 15%，作品不参与该计算。
- 报告必填 `summary` 与 `reflection.difficulty`。保留 `key_points`、`application`、`difficulties`、`next_plan` 和反思 `solution`、`improvement`、`new_question`；没有合并字段或增加报告附件。提交、退回、新版本、评分继续用原接口。
- `backend/controllers/workController.js`、`backend/middleware/upload.js`：单文件最大 100 MB，原扩展名/MIME/签名检查不变；作品名必填，文字或附件至少一项。沿用 `has_newer_version` 与最新版本校验。详情接口提供 course_id，未提供 lesson_id，因此详情返回课程地图，不编造课时跳转。
- 草稿键仍为原账号/对象隔离键：报告 `draftKey(user.id, courseId, lessonId)`；作品 `star-voyage:work:v1:{userId}:{taskId}:{parentId|first}`。仅保存在当前浏览器，不保存附件、不称云同步；保存失败明确提示，提交成功后清理。
- 实验匹配与返回仍使用原配置、experimentContext 和接口核验，传递 courseId、lessonId、stage、cardId、returnTo；测试关联只在开发测试开关下启用，正式配置未变。
- 页面 loading、空状态、网络失败重试及对象权限失效继续复用原 AsyncPageState、StudentScope 与请求策略。附件 404 只显示局部错误；作品详情额外用现有课程详情接口核验所属课程，课程列表变化时重新读取并核验，清除失效内容。

本轮新发现并修复的交互问题：折叠反思中未挂载的必填项会漏验，现预挂载并在验证失败时展开定位；小智 DOM 顺序调整后，开关展开再顺向 Tab 可到提问，收起或 Escape 回开关。减少动画模式下保留组件清理所需的极短结束事件，同时让浮动菜单立即定位，避免加载提示滞留和版本菜单跑到视口外。版本切换重置学生详情的局部附件错误。

## 接口、演示和边界

- 真实接口：本轮课时、卡片、作答、报告、反思、资源、作品上传、历史版本、评审结果、实验来源校验与权限核验；没有新增接口或伪造成功。
- 本地演示：原积分、兑换、徽章继续明确标记演示，配置和适配层没有变化。
- 尚待确认：正式教学内容、章节与课时归属、正式实验关联、奖励规则和本轮视觉反馈。测试内容不写入正式配置。
- **已核实的原接口差异**：`backend/helpers/workPolicy.js` 的学生 `canViewWork` 只判断作品是否本人；作品详情及下载没有同时检查课程发布与有效报名。因此课程撤回后，原作品接口仍可能返回本人的历史作品。本轮学生详情通过现有课程接口复核后才展示，并在课程变化时清除；不能把这项前端处理当成后端授权修复。直接调用原作品/下载 API 的这一限制仍存在，后端修改超出本轮授权范围，需单独确认处理。
- 未扩展：任务/作品总列表、实验室主体、成长档案、奖励、登录页与旧课程学习页；它们仅保留原衔接。本轮范围内的交付以实际验证记录为准。
- 构建仍提示共享包超过 500 kB；Ant Design 原公共组件仍有弃用项和静态 message 提示。没有为此升级依赖、重写数据层或声称消除了所有控制台警告。

原仓库只读引用为 `49c179eed0656b34d8b5a03491c8afd9a9d1de77`，唯一提交与推送目标为新仓库 `shrrrrrrrr/web-frontend-test`。后端、仿真、锁文件、正式课程配置、奖励规则和已有素材未改。

## 实际检查与结果

环境为 Windows、Node.js 26.2.0、Edge 154.0.4258.37。以下浏览器场景数不重复计入 Node 父测试。

| 检查 | 实际结果 |
| --- | --- |
| `npm run lint` | 最终代码通过，0 错误 |
| `npm test` | 33/33 前端单测通过，原业务断言保留 |
| `npm run build` | 最终代码通过；仍有共享包超过 500 kB 的提示 |
| `node --test tests/round5.browser.test.js` | 最终 10/10 场景通过，无浏览器未捕获异常 |
| `node --test tests/round2.browser.test.js tests/round3.browser.test.js tests/round4.browser.test.js` | 公共动画修正后 7/7 + 9/9 + 6/6 通过 |
| `node --test tests/access.browser.test.js` | 7/7 通过，附件与无关请求不清空报告，真实撤回清除内容 |
| `node --test tests/browser.test.js` | 本轮前段已运行，7/7 通过；后续改动由上述受影响回归覆盖，没有重复运行物理试飞 |
| 离线图集 | Edge 直接打开通过；53 张图片全部加载，59 个本地链接存在；三尺寸筛选及窄屏布局通过，JS 错误 0。见 [检查记录](round-05/gallery-check.json) |
| `git diff --check` | 通过 |
| 修改范围核对 | 后端、仿真、锁文件、正式配置、首页/地图源码、原接口请求层、旧学习页、原素材、第三/四轮截图均无修改 |

没有重复运行整套后端或仿真测试。旧回归只调整了实际更换的资源行选择器，并将第四轮重跑图片改写到 `test-results/round4`，没有删除业务断言。权限复核新增使用现有接口，没有改 StudentScope 或后端规则。

| 本轮关键场景 | 实际验证结果 |
| --- | --- |
| 四阶段与回顾 | 三尺寸通过，锁定原因可见；播放器真实缺失与重试、资源 404 不影响手动确认回顾 |
| 有题与无题卡片 | 单选、多选、判断、填空、简答全部通过；数据库每题仅一次作答，答错后完成卡片；无题可确认，无卡片仍停在 25% 且报告未解锁 |
| 实验往返与空任务 | 指定课时卡片 2 进入测试关联滑翔机后返回 stage=1、cardId=2；未新增作品、未提交试飞；无任务课时显示准确空状态 |
| 报告校验与草稿 | 缺失总结阻止确认；折叠困难字段会展开并聚焦；全部九个字段恢复；模拟存储配额失败有提示且文字保留；网络提交失败保留内容，重试成功后草稿清理 |
| 报告版本与独立作品 | 待评审、退回、修改为第 2 版及通过状态通过；学习进度 100% 时作品仍可首次提交，作品退回时仍可修改 |
| 作品首次提交与上传失败 | 名称及文字/附件要求通过；刷新恢复文字草稿；真实无效 PDF 被服务器拒绝，未重选附件再次提交仍触发签名校验；更换合法测试 PDF 后成功返回原课时 |
| 作品版本与局部失败 | 最新退回版可创建第 2 版；原附件不冒充新附件；旧版本标已修改、无修改按钮，旧版提交 URL 不开放表单；附件 404 后正文与反馈保留；三尺寸版本菜单可实际点击 |
| 公共伙伴与弹窗 | 三尺寸下开关 Enter → 顺向 Tab 到提问；Escape/收起回开关；390px 伙伴展开时报告确认、取消实际点击中心无遮挡 |
| 管理员与导师 | 两角色原表单存在且无学生主题；导师通过原界面真实提交五项 4 分，学生可查看对应维度与反馈 |
| 网络与撤回 | 详情请求中断时清空旧内容并显示中文重试说明；恢复网络重新加载成功；真实课程撤回后学生详情清空，刷新旧链接仍不展示作品 |

## 截图与 Git 交付

最终图集包含 53 张截图：桌面 22 张、平板 15 张、窄屏 16 张。均为真实视口截图，没有裁切或后期修图。已人工查看桌面卡片/上传页、平板阶段导航、窄屏报告修改意见/上传失败/确认弹窗/版本菜单/五项评分，以及课程撤回清空状态。

| 页面代表状态 | 1440×900 | 768×1024 | 390×844 |
| --- | --- | --- | --- |
| 知识卡片首屏 | [桌面](round-05/screenshots/02-card-first-screen-desktop-1440.png) | [平板](round-05/screenshots/02-card-first-screen-tablet-768.png) | [窄屏](round-05/screenshots/02-card-first-screen-mobile-390.png) |
| 报告待评审内容区 | [桌面](round-05/screenshots/07-report-pending-content-scrolled-desktop-1440.png) | [平板](round-05/screenshots/07-report-pending-content-scrolled-tablet-768.png) | [窄屏](round-05/screenshots/07-report-pending-content-scrolled-mobile-390.png) |
| 作品提交首屏 | [桌面](round-05/screenshots/09-work-upload-first-screen-desktop-1440.png) | [平板](round-05/screenshots/09-work-upload-first-screen-tablet-768.png) | [窄屏](round-05/screenshots/09-work-upload-first-screen-mobile-390.png) |
| 作品反馈滚动后 | [桌面](round-05/screenshots/17-work-approved-feedback-scrolled-desktop-1440.png) | [平板](round-05/screenshots/17-work-approved-feedback-scrolled-tablet-768.png) | [窄屏](round-05/screenshots/17-work-approved-feedback-scrolled-mobile-390.png) |

提交标题：`feat(student): style lesson learning and work submission flows`。最终提交号及推送结果见本轮交付消息，或在新仓库执行 `git log -1 --oneline`。提交中不包含数据库、上传文件、密钥、node_modules、临时调试脚本或构建输出。

本轮结束后等待验收，不继续扩展实验室主体或成长档案视觉。
