# 新版第三步实际验证

验证日期：2026-10-08（Asia/Shanghai）。在前序 `5777e98ffd176992bccfd8202bb2c60cc893d567` 上继续，原仓库参考 SHA 保持 `49c179eed0656b34d8b5a03491c8afd9a9d1de77`。测试、升级复验与 4174 预览全部使用临时隔离库，不初始化或重置用户业务库。浏览器为本机 Microsoft Edge 154.0.4258.53 的 Playwright 无头模式；截图中的教学内容为合成验收数据

## 最终结果与统计口径

| 实际执行 | 结果 | 原始证据 |
| --- | --- | --- |
| `npm run lint` | 通过，0 error / 0 warning | [lint](evidence/lint-final.txt) |
| `npm run build` | Vite 生产构建成功 | [build](evidence/build-final.txt) |
| `npm test` | 67/67，未跳过 | [前端单测](evidence/frontend-final.txt) |
| `npm run test:backend` | 完整后端 173/173，未跳过；包含本轮 9 个维护/上传/升级契约测试 | [后端完整测试](evidence/backend-final.txt) |
| 文案安全提取 Python 测试 | 6/6，包含空值、disabled、特殊字符、非法 JSX、双来源冲突 | [安全提取](evidence/copy-safety-final.txt) |
| 新旧文案与冻结文件保护 | 912 个系统 ID；805 个旧条目完全相等，107 个新增；946 个审阅条目；前两步交接、字体、美术和锁文件无改动 | [审核日志](evidence/copy-audit-handoff.txt) · [哈希与 ID](evidence/copy-audit.json) |
| 本轮及既有浏览器回归 | 76 个具名业务子场景最终通过；10 个父级包装另计，不把父级或压力组当作新增业务场景 | [逐场景最终结果](evidence/verification-results.json) |
| 最终 4174 生产预览 | 3 个业务子场景＋1 个父级，4/4；真实主题/章节、维护页、三尺寸和交接文件可打开 | [刷新后预览](evidence/browser-preview-refreshed.txt) · [预览记录](evidence/preview-browser.json) |

浏览器统计按同名场景的最后一次实际执行结果汇总，不将重复复跑累加。维护/第二步联合批次原始结果为 **42/44**，其中文案测试 1 个子场景及其父级失败；专项复验 **4/4** 已通过。核心回归 **19/19**，账号/奖励回归 **19/19**，最终预览 **4/4**。合并后的 76 个业务子场景＝第二步/维护 39＋核心 17＋账号/奖励 17＋最终预览 3。没有将曾失败的联合批次改写为“一次全绿 86/86”

联合批次的 39 个子场景包含：维护旅程 10、头像/机器人 13、局部状态 5、第二步视觉补修 8、文案交接 3。详细结果分别见 [联合原始日志](evidence/browser-maintenance-final.txt)、[文案专项复验](evidence/browser-copy-final.txt)、[核心](evidence/browser-core-final.txt)、[账号与奖励](evidence/browser-account-final.txt)

## 关键场景逐项核验

| 场景 | 实际结果与依据 |
| --- | --- |
| 导师创建→填写→学生读取 | 导师通过真实页面创建 9003 合成课程、保存介绍/主题/章节/课时说明/提示/任务文字，经原导入学生及发布入口授权；学生从 API 读取已保存值。10 段旅程全部通过，`pageErrors=[]`：[旅程记录](screenshots/journey.json) |
| 章节和主题 | 同课章节新增、改名、完整排序与课时归属；拒绝跨课、重复和不完整 ID；非空章节不级联删除。旧课时未分组可见，默认 campus；voyage 来自持久化字段，不按 9001 或名称判断。主题/章节刷新保留报告和助手草稿 |
| 文字清空和保存失败 | 可选故事/说明显式清空后学生不回填样例；未提交字段保留原值。写失败保输入；已保存但回读失败显示成功事实并可重读，不重复写。必要名称与长度/枚举由后端校验 |
| 权限矩阵与对象链 | 管理员、创建导师、受邀导师允许其负责范围；无关导师、普通教师、学生、媒体、匿名、停用、强制改密拒绝新增维护写入。章节/课时/卡片/任务/资料/回放/实验/封面逐级同课；即使拥有 A、B 两课也拒绝 A 路径拼 B 对象 |
| 导师失去范围、学生撤回恢复 | 旧维护表单提交被拒绝且数据不改；学生真实撤回清课内容，恢复“重新检查”实际重验。权限仍失效不放行；附件 404 仅局部提示，不卸载学习页 |
| 真实资料格式和下载 | 原资料白名单保留；真实 MD/CSV/XLS/XLSX 样本上传/下载、原中文文件名、用途和说明、公共/课时范围通过。后端拒绝伪后缀、异常 MIME/结构、51 MB 文件、跨课课时和落库失败，清理本次孤立文件；旧附件兼容 |
| 回放和封面 | 合成 VP8 WebM 经真实上传与原签名流播放；封面专用上传/认证读取，更换只清自己的旧文件。错误结构/6 MB/越权拒绝；公共 `/uploads/course-covers/...` 无鉴权路径 404，无私有直链 |
| 队列恢复 | 串行逐项上传，混合成功/失败仅重试失败项，成功 ID 保留；双击不重复，改选择不改已有队列归属，取消/切课确认后不带文件。上传成功/回读失败分开；资料幂等 token 重试返回同 ID，改变同 token 内容拒绝 |
| AI 索引状态 | 上传与解析各自显示真实状态；新增四格式显示 unsupported。失败只重试索引，不重新上传成功资料。不将本地 provider 回归当成外部模型质量验收 |
| 学习与评审原闭环 | 回顾→卡片→一次练习→报告/反思，作品另行提交；导师原评审，作品退回后第二版、档案读取通过。任务说明更新不重算成绩；已核验评分 87、作答次数 1，报告通过而作品退回仍有修改入口，无作品任务课时仍可继续 |
| 真实滑翔机及实验返回 | 原参考引擎、七参数、结果与历史重开通过；指定卡片进入并返回原卡片。解除关联后回地图说明，试飞历史保留；自由进入不伪造课时，完成试飞不自动提交作品或完课 |
| 头像/机器人/旧链接 | 真实头像保存/重登、账号与课程隔离；同课切页/关窗保草稿和在途请求，来源跳转、输入法、滚动、退出/停用/改密清理及旧链接 replace 回归通过 |
| 第二步视觉补修 | 8 个专项通过：全屏登录、独立桌面/手机图、字体、透明背景、居中详情和键盘/焦点、按钮与减少运动、运势、图片失败与短屏输入等。只复用前序素材，不重做学生美术 |
| 我的、运势、奖励与跨标签 | 账号级只读运势及本地奖励规则保持。IndexedDB 120 组混合事务全部无失败、12 次新第三标签抽检；20 组真实双标签凭据刷新无失败；反馈/通知/反思输入保留，换账号清理。压力组不另算业务场景 |
| 旧库与新库 | 真实 v16 schema 的非空 19 表合成旧库升级 17，原账号/报名/课时/作答/作品两版/报告/反思/头像/附件/回放/试飞/轨迹/合成模型配置逐字段保留，FK 通过；再次启动只记录一次 17，无虚构章节/实验。新库同等结构通过 |
| 响应式与真实截图 | 1440×900、768×1024、390×844，以及 360×800、844×390：维护表单、章节、上传、格式矩阵、地图/详情可达；表格横滚、窄屏 Tabs 和内部滚动可操作。[49 张精选真实截图](index.html)，包含失败恢复和学习旅程 |

## 首次失败和复验

未删业务断言、跳过关键失败或重置正式库制造通过。`evidence/*.txt` 是本轮原始 `.log` 的逐字副本；根目录 `.log` 被既有 Git ignore 排除，正式交付保留 `.txt`。所有失败批次仍在 [日志索引](evidence/verification-results.json) 的 `logs` 中

源码及文档的暂存差异空白检查通过；原始日志含运行器/页面诊断输出的行尾空白，保留原样。检查使用 `git diff --cached --check -- . ':(exclude)docs/redesign-v2/step-03/evidence/*.txt'`，未删除日志中的诊断内容来消除提示

- 初次 lint 发现 render 阶段读取 ref 和未用声明，修正生命周期与依赖；最终 lint 无问题。冻结审计起初未识别有限枚举拼接并发现 14 个未用新增文案，补有限枚举核对、移除新增闲置 ID，805 个旧条目保持原样
- 新后端契约初跑暴露测试上传目录、有效格式样本及断言的问题；完整旧迁移测试仍写旧版本数，随新增 017 更新并扩充非空学习数据检查。后续完整 173 项通过，不将负向测试故意触发的 SQL/400/403 日志误认为测试失败
- 旧大 ID 的有效实验来源初次被任意 1000000 上限拒绝，改为 JavaScript 安全整数范围，保留 stage 等实际枚举限制。该批另有一次 Node 测试运行器 `Unable to deserialize cloned data`，未声称修复其运行器根因；同一完整命令最终 173/173。原失败见 [大 ID 首次日志](evidence/backend-id-ceiling-first.txt)
- 浏览器初跑核实并修正 CoursePresentation 所在层、私有封面 API 双前缀、移动 Tabs 主动作不可见、同课元数据重读保输入，以及元数据等待/失败页缺少离开课程链接。其他复跑修正了重复表单 ID、旧 DOM 等待、当前 UI 标签/弹窗选择器、合成视频与播放时序；实际请求和状态断言保留
- 联合批次文案测试在临时源码 HMR 后关闭已替换的头像 Modal 超时，调整临时测试操作顺序并显式重载，独立 3 个子场景通过；没有修改实际文案来绕过删除断言。预览首跑旧 `.pixel-map-route-group` 选择器不匹配当前 `.pixel-map-region`，改为实际 DOM 后新预览两次 4/4 通过，旧失败日志仍保留

## 可复现命令

在 `C:\Users\shr\Desktop\nmg前端\app`，使用已有依赖与 `.venv`。以下浏览器文件共享部分端口，按顺序执行，不并行启动同一 fixture；输出到第三步，避免覆盖前两步图集

```powershell
npm run lint
npm run build
npm test
npm run test:backend
.venv/Scripts/python.exe tests/copy-extraction.test.py
node scripts/audit-step03-copy.mjs
.venv/Scripts/python.exe scripts/extract-copy-edits.py docs/redesign-v2/step-03/copy-review.html --baseline docs/redesign-v2/step-03/copy-baseline.json --out test-results/copy-step03.json
.venv/Scripts/python.exe scripts/extract-copy-edits.py docs/redesign-v2/step-02/visual-patch/copy-review.html --baseline docs/redesign-v2/step-02/visual-patch/copy-baseline.json --out test-results/copy-frozen.json

$env:PBL_EVIDENCE_DIR = 'C:/Users/shr/Desktop/nmg前端/app/docs/redesign-v2/step-03/regression'
$env:PBL_COPY_REVIEW_DIR = 'docs/redesign-v2/step-03'
node --test --test-concurrency=1 tests/redesign-v2.step02-copy.browser.test.js tests/redesign-v2.step02-states.browser.test.js tests/redesign-v2.step02.browser.test.js tests/redesign-v2.step03.browser.test.js tests/redesign-v2.visual-patch.browser.test.js
node --test tests/redesign-v2.step02-copy.browser.test.js
npm run test:e2e:v2
npm run test:e2e:round10

# 另一个终端启动新的隔离预览；如已占用，先核验是否为自己的 preview-v2 进程
npm run preview:v2
# 在前一终端核验最终 4174；不停止 4173 无关应用
node --test tests/redesign-v2.step03-preview.browser.test.js
```

提取新 HTML 与冻结 HTML 的实际结果均为 0 changes / 0 conflicts / 0 rejected、`applied=false`：[新版](evidence/copy-review-extraction.json)、[冻结版](evidence/frozen-copy-extraction.json)。用户未交回已保存改稿，不宣称应用浏览器中的临时编辑

## 隔离预览、Git 和未验证边界

4174 是本轮真实 Vite 生产构建，API 3144 使用新临时库；最终重新启动后再执行三尺寸浏览器检查。停启前核验自有进程树，不删除旧临时库；4173 原应用 PID 14072 保留。[停启前记录](evidence/preview-before-final.json)、[最终预览记录](evidence/preview-browser.json)。启动/账号见 [README](README.md)，维护入口 `/courses/9001?tab=maintenance`

Git 基线、唯一 origin 与最终提交信息在交付提交后补充到此处；不会修改或推送原仓库。旧素材、冻结文案及锁文件由上面的保护校验核对。仅提交源码、文档、真实隔离截图、schema 测试快照和无声测试图样视频；不提交密钥、实际数据库、真实学生数据或私人附件

未验证：正式教材内容、用户未来保存的文案改稿、外部模型质量、实际业务库升级演练、真机/软键盘、多浏览器、生产部署。资料结构检查不等同杀毒或完整媒体解码；没有 Office/PDF 在线阅读器、扫描 PDF OCR、音视频转写、三维预览/执行、长期聊天记忆或正式奖励后台。原奖励为账号级本地演示，运势为只读娱乐。本轮只管理 campus/voyage 和已注册 glider，下一版主题/机器人动画另行确认

第一步空间/地图、第二步课程页/头像/机器人/登录与文案、第三步真实维护/上传/学生读取已完成。交付后停止，等待最终复核，不自动部署、向原仓库提 PR 或扩展下一阶段
