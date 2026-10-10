# 本轮实际验证记录

## 验证范围与计数

所有填写、故障注入、学习作答、报告评审、签到和试飞写入均使用独立合成数据库或恢复副本。真实 `.local/teaching` 仅进行授权第一课文章导入及读取核对；未写测试教材、学生提交、验收签到或验收试飞。

下表不把父套件、视口循环、截图数量和重复复验计为新业务场景。浏览器业务为课时维护10项、原教学12项、金币14项、徽章/小智12项，共48项；另有3项系统文案文件验证。Node输出包含4个父套件，合计55个测试结果，不能将55称为业务场景数。

| 实际执行命令（在 app 目录） | 结果与证据 |
| --- | --- |
| `npm run lint` | 通过；最终 `lint-final-pass.log` |
| `npm test` | 88项前端单测通过；`unit-final-pass.log` |
| `npm run build:teaching` | 通过，写 `build/teaching`；`build-final-pass.log`。保留构建器原有大分块提示，没有因此宣称零警告 |
| `npm run test:backend` | 214项通过，包含本轮结构化图文、归属、冲突与资源引用保护；`backend-handoff.log` |
| `npm run test:teaching` | 5项通过，包含持久环境工具；`teaching-first.log` |
| `node scripts/verify-lesson-authoring.mjs` | 隔离旧库22→23、56张旧表原字段保留、重复迁移、文章导入幂等、改稿冲突和独立恢复通过；`migration-final.log` |
| `$env:PBL_AUTHORING_RUN='release-final'; node --test tests/lesson-authoring.browser.test.js` | 10项业务场景通过；`browser-complete.log`，`browser/release-final/results.json` |
| `$env:PBL_EVIDENCE_DIR='docs/lesson-authoring/regression/teaching'; $env:PBL_STEP02_RUN='handoff'; node --test tests/lesson-authoring-teaching.browser.test.js` | 12项通过；`teaching-browser-complete.log`，`regression/teaching/browser-handoff/results.json` |
| `$env:PBL_COINS_RUN='handoff-aligned'; node --test tests/lesson-authoring-coins.browser.test.js` | 14项通过；`coins-handoff-aligned.log`，`regression/coins/handoff-aligned/results.json` |
| `$env:PBL_BADGE_PHASE='release-final'; node --test tests/lesson-authoring-badges.browser.test.js` | 12项通过；`badges-release-final.log`，`regression/badges/release-final/results.json` |
| `node --test tests/lesson-authoring-copy.browser.test.js` | 3项通过；`copy-browser-final.log` |
| `node scripts/capture-lesson-authoring.mjs` | 真实4184读取、16张截图、全文8段/284字符、9张原图授权200/字节散列及无微信热链通过；`capture-final.log` |
| `node scripts/audit-lesson-authoring.mjs` | 55张原业务表受保护字段、12份原文件、私有配置、1210项旧注册文案和冻结历史、仿真/锁文件核对通过；`protection-final.log` |

验收HTML总入口还实际切换五种尺寸，三方本地截图均加载；可读指南8章节/4表及页面无脚本错误通过，记录在`gallery-check.log`。

日志、结果JSON、合成测试截图都是本机验收记录，不入Git；不删除首次失败记录。上述相对路径均在本目录。测试源码和脱敏交接说明可提交；含真实照片的16张截图另留本机deliverables目录。另一机器要重跑需具备原依赖、Edge和参考试飞Python环境；迁移/实拍脚本还需本地备份、授权素材及私有配置，不提供它们的Git副本。

## 关键场景证据

| 场景 | 实际核对 |
| --- | --- |
| 三模板与四阶段同源 | 共用LessonTemplateView、LessonLearningView及ExerciseView；负责导师实际选课时、鼠标及键盘切换预览。预览期间学生答案/进度/报告/金币/徽章表快照不变，未发送学生学习/奖励写请求 |
| 原位文字、图片、资料 | 原位回顾、报告/实验独立字段、参观段落/图片保存后学生读取；图片/文档落真实文件目录并核对字节；段落/图片上移下移后保存顺序可核对 |
| 新增与已保存对象 | 新卡保存后回读503仍保留真实ID，二次保存更新原记录；课时原位回读失败保持ID/revision；同对象再次修改无重复记录 |
| 故障与防丢稿 | 上传中断沿原upload_token重试；写失败保留文字与选件；并发409不覆盖。关闭/切换提示及原生浏览器后退、侧栏跳转取消保留输入，确认离开不写未保存教材 |
| 权限和文件 | student/teacher/无关mentor写请求拒绝；管理员回放真实上传后学生授权播放，导师旧嵌套上传端点也拒绝且不落盘；撤回、报名移除旧资源地址不泄露；正文图片跨课/跨课时引用拒绝，正在引用的资料不能移动或删除 |
| 五尺寸 | 1440×900、768×1024、390×844、360×800、844×390编辑/预览/学生界面无横溢；原位上传按钮实际键盘聚焦并提交，维护弹窗与关闭入口检查通过；真实第一课每尺寸三方截图 |
| 真实试飞 | 隔离真实API调用reference引擎，计算成功、6指标和三维航迹/遥测两图读取；独立试飞course_id/lesson_id为空，不伪造教材关联。实验返回课时及附件404局部错误由原教学回归覆盖 |
| 学习闭环与评审 | 原回顾/卡片/练习/开放反思/报告、退回后新版本、导师评审、学生直选反馈及普通教师只读通过；原任务与作品关系保留 |
| 金币、签到、徽章、小智 | 原首次有效评分一次结算、作品前置、0分一次、并发/跨日/跨标签/重启、课内获章墙、原生小智鼠标/触屏/拖动均通过。旧演示兑换仍独立 |
| 真库图文与数据保护 | 第一课17个结构块（8段+9图），第6/7图同散列仍保留两处。重复导入创建0资源；用户新稿冲突停止。实际原有5金币/1次签到保持，没有把旧轮0记录描述当成本轮现状 |
| 人工文案 | 旧1210项含元信息逐项保持，新增52项；两份增量HTML可编辑、安全保存重开、仅导出变更ID，旧46份文件及宜忌30/30保持 |

## 首次失败、定位与复验

| 首次失败记录 | 核实原因与处理 | 复验 |
| --- | --- | --- |
| `lint-first.log`、`lint-final2.log` | 抽取共享展示后的未用导出与遗留Typography引用；修正实际代码及导入 | 最终lint和88单测通过 |
| `browser-first.log`、`browser-recheck*.log` | 旧/猜测文案定位不符人工冻结文案、Ant两字按钮自动空格、虚拟Select辅助节点不是真实选项；按实际标签、可见选项及键盘操作修正测试，未force点击或删业务断言 | 三模板鼠标/键盘与最终10场景通过 |
| `capture-first.log`、`browser-trace.log` | 实际鼠标点击时sticky工具条被职员顶部栏遮挡；工具条改正常文档流，保留课时结构 | 最终真实五尺寸16截图、鼠标选课时通过 |
| `browser-keyboard.log`、`browser-final.log` | 冲突后测试沿父列表旧revision继续保存，正确收到409；测试按真实操作先保稿、重新读取，再编辑。网络失败等待条件曾误匹配草稿文字，改等实际错误提示 | 原ID回读失败、并发、网络、离开取消通过 |
| `teaching-browser-first.log`、`teaching-browser-recheck.log` | 历史测试使用旧安排按钮和准备中下载按钮；按真实现有入口更新本轮测试副本，明确就绪后检查真实学习四阶段下载，保留原业务和文件字节断言 | 原教学12项通过 |
| `copy-browser-first.log`、`copy-browser-recheck.log` | 复用测试读旧差异文件changed/added，本轮键为changedOldIds/addedIds；修正读取，不修改旧文案来迎合测试 | 文案3项通过 |
| `browser-release.log`、`browser-navigation-probe*.log` | 原生后退先由Router卸载编辑，迟注册的监听失效。提前注册范围限定历史处理，维护挂载期间适配BrowserRouter导航，取消还原原历史项，不增加假历史项；登录失效/强制改密放行原全局路径 | 后退取消/确认、侧栏取消/确认均通过 |
| `lint-release-final.log` | React hooks immutability静态规则把BrowserRouter可变历史适配当React数据修改；为这个局部兼容适配明确注释例外，退出时恢复原方法，没有关闭全项目规则或改React状态 | `lint-final-pass.log`通过 |
| `browser-final-pass.log` | 新增排序断言使用无空格的精确双字名称，实际可访问名称是“下 移/上 移”；改为匹配实际空格，仍原生点击 | `browser-complete.log`通过 |

提交前另发现练习修订号放在学生DTO而非维护DTO，已移到维护接口。增强后端断言：维护读取的revision可更新原练习且再次使用返回409，未作答学生响应没有revision/answer_json，答案和解析仍为空；214项后端复验通过。准备中课时原位“任务要求”也补为沿已有任务ID保存，无任务时不制造新对象；`browser-tasks-preparing.log`针对复验通过，不重复计数。

最终金币复验`coins-handoff.log`曾在第2场景回到登录页。测试服务端固定昨天Date，浏览器使用现实Date，凭据提前刷新受到两个时钟干扰；仅本轮隔离测试改为服务器与各浏览器上下文对齐受控Date，浏览器定时器正常运行，默认凭据时长不延长。`coins-handoff-aligned.log`14项通过，含午夜、跨日休眠及原生回焦；生产Date、鉴权和签到代码未改。

首次失败和中间复验不能计为“全部首跑通过”。最终结果以上表各通过记录为准。

## 实际环境和未完成边界

真实服务已在备份后重启，仍为本机4184/3154，无隧道或公网切换。Migration023是增量列，完整性ok、外键检查0；原业务记录和附件不清空。备份原有一个缺文件的资源引用保持并记录，未造文件掩盖历史缺件。

教材保存即更新当前对象，没有整课草稿发布、永久未保存编辑草稿或跨设备协同合稿。任意富文本、Office在线编辑、通用三维预览、OCR、视频转写、参观出勤判定未实现。当前预览展示教材及教学阶段，不展示某一具体学生的私有答案/进度/评审。真实手机软键盘、实际设备、公网及生产运行由后续独立复核；本轮停止在此。
