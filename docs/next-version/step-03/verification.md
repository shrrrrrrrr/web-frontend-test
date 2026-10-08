# 第三步实际验证与最终回归

基线 `fbd94f703ddd2be07aa6274279e74cdd6bc71733`，验证日期为 2026-10-09（北京时间）。以下只记录实际执行的结果。运行环境是 Windows、Edge 154.0.4258.53 自动化与模拟视口，不是实体手机测试。测试写入均使用隔离数据库和合成账号；4184/3154 的教学数据仅做只读检查及增量迁移。

[当前真实截图](index.html) · [素材预览](assets.html) · [启动与保护交接](README.md) · [API 与判据](api-and-rules.md) · [首次失败及复验说明](evidence-first/initial-issues.md)

## 最终检查

| 实际命令或检查 | 结果 | 原始证据 |
| --- | --- | --- |
| `npm run lint` | 通过，零错误零警告 | [lint-delivery.log](evidence-first/lint-delivery.log) |
| `npm test` | 76 项前端单测通过 | [frontend-units-delivery.log](evidence-first/frontend-units-delivery.log) |
| `npm run build:teaching` | 独立生产构建通过，只输出 build/teaching；未重建旧 dist | [build-delivery.log](evidence-first/build-delivery.log) |
| `node --test --test-concurrency=1 backend/test/*.test.js` | 完整后端 201 项通过，包含本轮 8 项奖励业务测试 | [backend-full-final.log](evidence-first/backend-full-final.log) |
| `npm run test:teaching` | 最终 5 项通过，含新增空表兼容、已保存徽章/开放反思阻止归档、新三课定义及备份保护 | [teaching-verified.log](evidence-first/teaching-verified.log) |
| `node --test tests/next-step03.browser.test.js` | 11 个业务场景及独立 5 个视口检查通过；1 个父测试另列 | [browser-release.log](evidence-first/browser-release.log)、[具名结果](browser-release/results.json) |
| `node --test tests/next-step03-recovery.browser.test.js` | 3 个恢复业务场景通过；1 个父测试另列 | [recovery-final.log](evidence-first/recovery-final.log)、[具名结果](recovery-final/results.json) |
| `node --test tests/round10-rewards.browser.test.js` | 原生 IndexedDB 8 个子检查通过；1 个父测试另列；120 组双标签事务压力与 12 次第三标签抽检，失败 0 | [native-rewards.log](evidence-first/native-rewards.log)、[压力结果](native-stress.json) |
| `node --test tests/next-step03-copy.browser.test.js` | 新文案编辑/导出/安全重开、必要文案不可清空通过；27 张截图及 3 枚素材全部解码 | [copy-release.log](evidence-first/copy-release.log)、[结果](copy-browser-result.json) |

构建的 outDir 位于 frontend 外部，Vite 的提示是为了保护旧 dist，未使用清空旧目录选项。依赖和锁文件未升级。故障注入产生的预期 404、离线请求日志不计为页面脚本错误；最终本轮页面 `pageErrors` 为空。

## 签到与旧演示存储

| 验证场景 | 实际结果与证据 |
| --- | --- |
| 同一天双击、同账号双标签签到 | 只增加 5 金币、一条明细；头部和主页从已提交快照读取。主浏览器第 1 场景与原生事务新增场景通过 |
| 刷新、重登、普通重置 | 当天仍已签到；重置保留日期及待同步意图。不会利用重置再次领取 |
| 北京午夜、持续打开与恢复可见 | 主浏览器拦截日期 DTO 为 2099 年跨日值，原生事务检查排队日期到期，恢复可见后重读且只加一次；没有修改真实服务时钟 |
| 日期离线、拒绝存储、open 失败、blocked、事务 abort | 不出现加币成功；恢复后可重试。浏览器恢复第 3 场景及原生 IndexedDB 故障场景通过 |
| 广播/回读失败与事务已提交 | 已提交事实保留；广播只通知重读，不重复加币或扣币。原有故障断言未删除 |
| v1 记录、损坏记录及多账号 | 原明细/兑换原样迁入，不反复导入旧源；损坏同步意图明确报错，普通重置不能静默丢掉；账号隔离通过 |

金币只保证本浏览器账号的演示一致性；清空全部站点存储或另一设备不保证签到唯一和余额同步。

## 真实徽章及动画

| 验证场景 | 实际结果与证据 |
| --- | --- |
| 未回顾、未完成卡片/必做练习、最新报告待评/退回 | 各缺项分别阻止授予；原练习语义要求作答，不新增正确率。后端奖励第 3 项通过 |
| 文字/附件作品任务，以及旧通过、新待评/退回版本 | 所有活跃任务按最新版本链判断，旧 approved 不掩盖新版本；报告通过但作品退回不发。后端第 4 项、主浏览器第 1 场景通过 |
| 无作品任务的有效学习闭环 | 达到原回顾、卡片练习、最新报告通过后可获章，不制造额外作品任务。后端资格测试通过 |
| 空三课、参观无个人记录、未来七关 | 均不发章；未来节点仅未知占位，无伪造主题或所得。主浏览器地图场景及后端空状态测试通过 |
| 全部实际满足、重复/并发、另一账号、重启 | 唯一稳定授予记录及判据快照持久保存；同学生同课时一条，跨学生不串。后端事务测试、主浏览器重启场景通过 |
| 维护名称/受控图案、历史获章 | 原负责导师/管理员可改定义；已有授予保持获得时快照，教师/学生/媒体和外链图案被拒绝 |
| 主页读取失败及多枚未展示 | 授予已写但主页读取失败时不称已佩戴，不消耗展示标记；重读后两枚逐个关闭、刷新不重播。恢复第 1 场景通过 |
| 关闭、空白、Esc、跳过、焦点、减少运动 | 桌面/平板/窄屏/横屏通过；普通反馈一次渐显放大，减少运动为静态。读回稳定 ID 后服务端消费一次展示机会，关闭不影响持久徽章 |
| 课程撤回与报名失效 | 当前访问内容及时清理；徽章安全历史保留但课时链接移除，历史所得不是访问授权。主浏览器撤回及后端归属测试通过 |

展示标记是“取得一次展示机会”，不代表播放完成。服务端消费后若标签立刻关闭或响应丢失，该历史徽章仍在主页，但不会重播反馈；具体取舍见 API 文档。

## 演示兑换与恢复

| 验证场景 | 实际结果与证据 |
| --- | --- |
| 实物与数字徽章分别兑换 | 实物保留指定老师带奖品文案，同页、确认和结果明确不发货；数字徽章另用文案，并在主页标识演示兑换 |
| 管理员站内消息 | 原通知机制收到本人、商品类型、演示标记与稳定操作号；无邮件/微信等外发。老师、媒体、学生无法读取管理员记录 |
| 服务端成功但响应丢失、重试和刷新 | 本地只扣一次，同操作号服务端仅一个事件/管理员通知；同编号换商品 409，不套用旧成功 |
| 离线扣币、重置、切号、回到原账号 | outbox 保留原编号；切号不把旧意图发送给新 token；重登原账号补发，后端记录可见。恢复第 2 场景通过 |
| 服务端写通知失败 | 事务回滚无孤儿成功事件/通知；本地准确保留待同步状态。后端奖励第 8 项通过 |
| 不足余额、库存/限兑、并发重置 | 保留既有演示限制和数值；原生 120 组混合事务顺序及主浏览器重置场景通过 |
| 另一浏览器 | 能读后端演示事件与数字徽章，本地演示金币仍按自身初始化，不宣称服务器保存金币 |

## 前两步相关回归

回归通过各测试的输出目录参数及 `PBL_EVIDENCE_DIR` 定向写入本轮新目录，没有覆盖旧稿或旧图集。共享夹具端口的测试串行执行。

| 测试 | 实际结果 | 证据 |
| --- | --- | --- |
| `tests/next-step02.browser.test.js` | 10 个具名业务场景通过；另列 20 个维护端视口检查和 74 个角色路由 smoke；1 父测试 | [日志](evidence-first/regression-step02-final.log)、[结果](regression-step02-final/browser-step03-final/results.json) |
| `tests/next-step01.browser.test.js` | 10 个具名场景通过；1 父测试。含十关、头像/机器人、真实七参数 Python 参考试飞和返回原课时/卡片 | [日志](evidence-first/regression-step01-final.log) |
| `tests/next-step02-course.browser.test.js` | 1 场景通过，课程填写保存、失败回读及草稿生命周期 | [日志](evidence-first/regression-course.log) |
| `tests/next-step02-copy.browser.test.js` | 1 场景通过，第二步旧文案 HTML 编辑/导出/重开，不修改源稿 | [日志](evidence-first/regression-copy.log) |
| `tests/fortune-patch.browser.test.js` | 7 个子场景通过，1 父测试另列；隔离服务/浏览器测试时钟，运势跨日及旧文案显隐 | [日志](evidence-first/regression-fortune.log) |
| `tests/next-step02-readonly.browser.test.js` | 1 场景通过，实际 4184 教学维护页只读检查，不填写合成材料 | [日志](evidence-first/actual-readonly.log)、[实际教学维护页](actual-readonly/mentor-actual-1440.png) |

第二步回归包括教学文字/上传持久、回读失败保留 ID、管理员回放队列、三框与旧四项反思历史、报告直选和评审版本、附件 404 局部处理、撤回清内容。获章反馈出现时先关闭反馈，再继续原反馈评审流程，未放松原业务断言。普通教师只读和其他角色入口保留。

## 教学数据、恢复及图集

[保护比对](data-protection.json)：原 45 张表的既有字段/记录一致，原文件字节及稳定私有配置一致，数据库完整性 `ok`，外键错误 0。认证刷新 token 与派生 FTS 排除，路径迁移归一化；这不是无差别整库字节相同声明。迁移 021 定义 3 条；教学库真实授予 0、演示事件 0，没有用测试完成数据补齐教学状态。

[文案保护](copy-protection.json)：旧 1042 条注册文案值/ metadata 没改变，旧冻结目录及 `frontend/dist` 无差异；增加 50 条独立 `next3` 文案。[恢复副本验证](restore-verification.json)：从本轮前一致性备份恢复到独立目录，健康 200、原字段记录一致、增量迁移成功；只调整副本端口，核验后停止副本，教学仍为 4184/3154。

当前图集使用 `browser-release` 的最终构建截图：1440×900、768×1024、390×844、360×800、844×390 各含主页、徽章陈列、获章反馈；另含签到明细、地图资格、两类兑换、待同步、管理员消息、徽章维护、撤回历史。恢复图集 120/420ms 为真实 CSS 动画测试暂停采样，不是生成页面；[采样参数](recovery-final/animation-keyframes.json)。所有教学完成材料为隔离合成内容。

## 未验收边界

正式教学正文/照片、VR 个人参观完成依据、公众号文章、后七课主题仍待提供。没有真实礼品、服务器金币账本、支付/配送、任务加币或签到连领规则。未接外部模型，未验证真机、生产部署或公网切换。旧预览服务及隧道未替换。三步实现到此停止，等待最终复核。

提交前检查：统一入口及当前交接相对链接无缺失，当前教学 API 健康 200，交付文件未含本地教学密钥或 JWT；[检查记录](final-integrity.json)、[Git范围](git-record.md)。
