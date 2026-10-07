# 实际验证记录

日期：2026-10-07。Edge `154.0.4258.53`，Playwright 驱动真实 React/REST 页面。数据库、上传目录、测试证书及 provider 全部隔离，不重置真实学习库。原照片/PDF、reference 与原仓库未写入。日志在 [evidence](evidence/)，失败记录不删除

入库日志仅去除行尾空白和末尾空行，保留首次失败内容、堆栈、通过/失败计数

## 最终检查

| 检查与实际命令（项目根目录） | 结果与证据 |
| --- | --- |
| `npm run lint` | 通过，`lint-delivery.log` |
| `npm run build` | 通过，`build-delivery.log`；Vite 8.2.1，无依赖升级 |
| `npm test` | 66/66，`frontend-test-delivery.log`，含末尾格式、富文本结构、URL/文件/输入/显隐原值 |
| `npm run test:backend` | 164/164，`backend-test.log`；其中新运势 4 项认证/角色/日期/隔离/无业务写入测试，后端此后无修改 |
| `node scripts/audit-step02-copy.mjs docs/redesign-v2/step-02/visual-patch/evidence/copy-id-audit.json` | 803 现用、2 保留、34 教学快照，没有缺失/闲置 ID |
| `scripts/extract-copy-edits.py` 分别提取旧版及新版 HTML（新版使用 `--baseline`） | 各 0 修改、0 冲突、0 拒绝，未应用；见 `*-copy-extract-delivery.json` |
| `node scripts/build-visual-patch-docs.mjs` | 注册 11 素材，原 769 ID 和三个冻结文件保护核对通过 |
| `node scripts/verify-visual-patch-preview.mjs` | 最终 4174 HTML/JS/CSS 与 dist 哈希一致、真实字体、真实运势、六尺寸、11 素材解码、839 编辑条目、全部图集图片路径通过；`preview-4174-final.log/json`（JSON 为 `preview-4174.json`） |
| `git diff --check` | 通过，无空白错误 |

## 浏览器场景：只统计实际子场景

以下共 68 个去重子场景通过，父 test 不充作业务场景。这是各文件最近通过结果的汇总，不声称包含首次失败的命令整批通过

| 文件与命令 | 通过子场景 | 对应保留日志 |
| --- | ---: | --- |
| `node --test tests/redesign-v2.browser.test.js` | 11 | `related-browser-rerun.log` 中此文件全部通过 |
| `node --test tests/redesign-v2.patch.browser.test.js` | 5 | `related-browser-rerun.log` 中此文件全部通过 |
| `node --test tests/redesign-v2.states.browser.test.js` | 6 | `related-browser-first.log` 中此文件全部通过 |
| `node --test tests/redesign-v2.step02-copy.browser.test.js` | 3 | `related-browser-first.log` 中此文件全部通过 |
| `node --test tests/redesign-v2.step02-states.browser.test.js` | 5 | `related-browser-first.log` 中此文件全部通过 |
| `node --test tests/redesign-v2.step02.browser.test.js` | 13 | `related-browser-first.log` 中此文件全部通过 |
| `node --test tests/redesign-v2.visual-patch.browser.test.js` | 8 | `visual-browser-final2.log`：9/9 Node test（含 1 父 test），0 失败 |
| `node --test --test-concurrency=1 tests/round10-rewards.browser.test.js tests/round10.browser.test.js` | 17 | `rewards-browser-first.log`：19/19 Node test（含 2 父 test），0 失败 |

实际原批命令使用 `node --test --test-concurrency=1` 串行列出前七个文件，避免复用测试端口冲突；首次统计 47 Node test、41 通过/6 失败（含父项，早退未执行项目不计通过）。复跑 v2、patch 和新增 visual 三文件统计 27 Node test、25 通过/2 失败，其中唯一失败子场景为新增触摸专项；其后 visual 单独修正复跑，最终 8 个子场景均通过

## 关键场景结果

| 场景 | 实际结果 |
| --- | --- |
| 登录默认、错误、图片失败、显隐、重复、改密/停用 | 六尺寸整屏无水平/正常页面纵向滚动；短屏表单内操作可达；500 错误不伪造成功；延迟双击只提交一次；真实强制改密优先、停用认证后回登录 |
| 平台/课程主题与权限 | 平台校园、显式星海 ID 宇宙、未知课程校园；无课程/撤回清理、恢复重新检查、迟到 A 不进入 B；单课程不自动跳过选择 |
| 运势 | 两独立浏览器同账号同日一致，服务端北京时间午夜更新；不同账号哈希输入隔离，不要求结果一定不同；失败重试、定时/可见重读、换账号迟到丢弃；奖励存储和业务表不变化 |
| 地图 Modal | 图像点击、Enter、Space、CDP 触摸实际打开同一居中框；默认不弹；Tab 限制、Escape、遮罩/关闭、回焦点、真实 wheel 底层锁、长内容内部滚动、首部进课可达；取消/撤回不绕过权限 |
| 交互 | 鼠标 hover/press、键盘、触摸 scale=.98、释放恢复；路线上 anchor 不动；disabled/loading、reduce 状态和输入稳定；管理员/导师/教师保持原入口，无学生动效 |
| 机器人与头像 | 原持久化、重登、跨课程/账号隔离、保存/回读失败、同课切页草稿、关闭期间请求完成、中文 IME、旧消息滚动、来源安全、撤回及迟到清理共 13 场景通过；透明 head 和图片失败入口可用 |
| 学习/作品/报告 | 报告通过但作品退回仍可修改；无作品任务继续学习；报告和作品各自提交、导师原评审、档案按课程；附件 404 不卸载页面、真实上传失败保输入、新版本可提交 |
| 实验 | 7 参数原参考引擎真实试飞成功，轨迹/遥测/历史重开；指定课时卡片 900112 进入再回原卡片；不自动提交作品/完成学习；无关联入口不伪造、自由实验保留 |
| 奖励/跨标签 | 原 IndexedDB 本地演示 120 组事务压力、第三标签 12 次观察及兑换/重置；同账号刷新保留反馈、反思、回复、其他角色表单，20 组凭据并发轮换 0 失败 |
| 文案安全 | 导出 HTML/JSON 特殊字符与显隐、删除及双来源冲突保持；隔离副本临时 JSX 修改；完整显示只去尾句号，API 原文/输入不变，无原条目重写 |

## 六尺寸与对比度

1440×900、1920×1080、768×1024、390×844、360×640、844×390。图集包含登录、选择、我的/运势、地图默认/弹窗、学习透明标题、实验封面、机器人关闭/打开；hover、press、focus、touch、reduce、短键盘高度、200% 等效放大、长详情及图片失败均有样例

最终静态预览另外截取 49 张当前构建页面，见 [preview-screenshots](preview-screenshots/)。源码测试图集与这组预览都使用真实 Edge，浏览器尺寸/触摸/键盘模拟并不等于真机验收

读取真实 computedStyle，用半透明面板覆盖最暗黑色背景的保守合成计算：登录说明 7.41:1、学习标题正文 5.84:1、运势边界 4.99:1、我的账号说明 10.68:1，均超过 4.5:1。此为所列正文区域的颜色核验，不声称做了全站图像像素采样或完整 WCAG 认证。CDP 实际字形为 `ChillReunion_Round` 自定义字体

## 首次失败与修正

- lint 曾发现遗漏导入、未使用导入及 JSX 闭合问题，修正后最终 lint/build 通过，保留早期日志
- Modal 最初 Tab 逃逸与底层滚动未锁，增加焦点限制和成对滚动锁；将错误的脚本 scrollBy 测试改为真实 wheel，不以程序强制滚动冒充用户输入
- 键盘事件放在 AntD App 未传到 DOM，移至实际 root；触摸 CSS active 不稳定，增加仅视觉按下/取消状态，不自行派发点击。最终鼠标、键盘、触摸通过
- 原旧测试期望 Link 包 Button、登录 h1 缺失，修复单一原生入口语义与标题后更新对应角色断言；提交/接口/DB 业务断言保持
- 360×640 实验主操作曾超出首屏，调整移动顺序与封面高度后通过，不删业务介绍
- 新增账号状态测试曾在强制改密页用 focus 等待停用跳转超时。原页不含课程 Scope 焦点核验，改用真实刷新/认证请求证明停用拦截，未新增授权规则

保留 `visual-browser-first.log`、`visual-browser-rerun1..4.log`、`visual-browser-final.log` 与 `related-browser-first/rerun.log`。最终结果以 `visual-browser-final2.log`、`*-delivery.log` 和各已通过文件为准

## 未覆盖与停止边界

AI 回归为隔离本地 HTTPS provider，未调用真实外部模型、未评估外部回答质量；当前 4174 依实际状态显示未启用。正式星海课程内容/章节归属未交付；奖励仍本地演示；生成素材的审美、真机与具体部署环境仍需人工验收。未改评分、作答门槛、物理算法、数据库结构或新增奖励业务；第 3/3 步维护端填写与上传未实施
