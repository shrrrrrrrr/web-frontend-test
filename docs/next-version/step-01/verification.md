# 本步实际验证记录

测试在独立临时夹具或 `.local/acceptance-*` 中运行，未重置 `.local/teaching`。本机持久环境另做只读页面/API/截图核验，并在私有备份后正常迁移重启。真实文件上传与参考试飞均经实际本地 API；不是截取静态设计图。

## 执行结果

| 检查 | 实际结果 | 原始日志 |
| --- | --- | --- |
| `npm run lint` | 通过 | [最终 lint](logs/lint-final-label.txt) |
| `npm run build:teaching` | 通过，只写 build/teaching | [生产构建](logs/build-release.txt) |
| `npm test` | **68/68**，无跳过 | [前端单测](logs/frontend-release.txt) |
| `npm run test:backend` | **179/179**，无跳过 | [后端授权/迁移/原业务](logs/backend-release.txt) |
| `npm run test:teaching` | **3/3** | [导入保护](logs/import-release.txt) |
| `node --test tests/next-step01.browser.test.js` | **10 个业务场景通过 + 1 个父测试** | [最终迁移回归](logs/browser-migration-release.txt) · [结构化结果](evidence-migration-release/results.json) |
| `node --test tests/redesign-v2.step03.browser.test.js` | **10 个业务场景通过 + 1 个父测试** | [原维护/学习闭环](logs/journey-first.txt) · [旅程结果](regression-screenshots/journey.json) |
| `node --test tests/redesign-v2.step02.browser.test.js` | **13 个业务场景通过 + 1 个父测试** | [最新助手回归](logs/assistant-release.txt) |
| `node --test tests/redesign-v2.step02-states.browser.test.js` | **5 个业务场景通过 + 1 个父测试** | [局部错误复验](logs/states-recheck.txt) |
| 最终 4184 教学环境只读 smoke/五尺寸截图 | 实际 API：3 真实课时、10 计划节点、7 NULL 未来节点；新数量文案与页面读取通过 | [只读核验](logs/teaching-final-smoke.txt) · [截图元数据](teaching-screenshots/capture.json) |
| 独立文案 HTML 实际浏览器导出 | 967 项稳定 ID；修改 JSON 和保留改稿的 HTML 下载通过，不应用测试改稿 | [文案 smoke](logs/copy-review-smoke.txt) |
| 旧数据/文案/构建保护 | 44 个旧业务表原行字段逐行保留，只有两明确样例 status 归档；912 个旧文案 0 改动；旧文件保护路径 0 改动 | [保护审计](protection-audit.json) |

浏览器合计 **38 个业务场景**，Node TAP 的 4 个父测试另计，总计 42 项。未把同场景多次复验或五视口重复检查加进业务场景数量。没有宣称运行旧全量验收脚本或真机测试。

[最终运行环境核对](runtime-check.json) 保留了新迁移版本、空教学字段和旧服务进程确认；私有密钥和教学数据库未导出。

最终浏览器迁移回归完成后仅调整“10个课时→10个关卡”这一计划计数文案；随后最终 lint/build 和 4184 只读 API/五尺寸/截图重新核验。新测试源也补入此数量断言。

## 关键场景证据

| 场景 | 实际确认 |
| --- | --- |
| 教师保存与重启 | 负责导师在原维护页面保存课时说明、上传持久验收.txt；新前后端重启两次，ID 和说明不变，学生实际下载 200，文件字节相同，无重复 seed/资源 |
| 备份与恢复 | 新备份/新恢复目录 integrity_check=ok；数据库、真实文件字节、恢复路径和稳定私有密钥相同；已有目录初始化/覆盖拒绝 |
| 导入前已有内容 | 原库 WAL 已提交文字和真实上传进入副本；原路径/库不改；报告/题目/安排/角色变更时已知样例课程保持可见 |
| 新字段授权 | 普通教师/学生不能写；无关课时和非法计划 400/404；撤回/移除报名清节点；停用/强制改密仍拦截；头像额外字段/URL/畸形 body 拒绝 |
| 十关路线 | 1440×900、768×1024、390×844、360×800、844×390 均有 10 节点、至少 9 段三次曲线，无横向页面溢出；前三真实 ID，后七无进入按钮；底部三个入口可达，末端余白<100px |
| 键盘/图像故障 | 平台单入口打开详情，Esc 动画结束后回原按钮；未知平台 404 仍显示编号、状态和说明；当前宇航员不使用旧角色脸或落点方块 |
| 三课空模板 | 参观仅真实空结构，无 URL 就不显示 iframe/假文章；不写完成记录；理论/实验卡片和题目为空，直接完成/报告拒绝 409 |
| 实验关联及自由使用 | 第三课真实绑定 glider 并回原 stage=0；第二课无未关联入口；自由实验真实成功记录 course_id/lesson_id=NULL，不写作品或课时完成 |
| 账号头像 | 本人真实保存、重读和重登；两个账号隔离；课程角色与账号头像互不覆盖；503 保旧已保存值，写成功回读失败给明确提示，重登读到新值 |
| 机器人 | Portal 的直接宿主在 body；鼠标/触屏拖后不误开；滚动坐标不变，改变尺寸夹紧；触屏再轻触可开、关闭回焦点；Home/Enter/Esc、减少运动、横屏和模拟 visualViewport 压缩均通过 |
| 原闭环 | 原排课/章节/资料/回放和上传队列；课堂回顾/一次练习/指定卡片真实七参数试飞及返回；报告/反思/评分；作品退回和第2版父关系；档案/权限撤回恢复均通过 |
| 原助手与局部错误 | 草稿/IME/请求中关窗/迟到响应/资料引用/跨课清理/登录轮换/停用；附件404保留学习页；真实上传失败保输入及重试等通过 |

## 首次失败与修复记录

logs/ 与 screenshots/failure-* 保留原失败，不删除后只留下通过结果：

- 早期脚本导师账号写成 mentor_chen（正确为 mentor_zhang），下载按钮匹配为“下载资料”（真实 aria-label 是“下载：持久验收.txt”）。这些是测试定位问题；正确定位后实际 200 下载和字节检查通过，未保留试探性的下载组件改动。
- 初次后端测试 3 个旧 schema/响应断言需匹配新增字段和迁移版本；更新后原业务检查与新增授权检查通过。初次 lint 的新头像 effect/依赖写法问题已修正。
- 真实发现地图末端旧 padding 产生约 152px 余白，修正作用域覆盖，五尺寸末端检查通过。
- 真实发现基线 `/lab` 总是中转课程选择；恢复无 course_id 的自由入口，保留显式课程来源原校验，实际独立试飞 NULL 关联通过。
- 首次新增焦点检查用了固定180ms，偶发早于弹窗 afterClose；改等待实际焦点恢复。没有通过脚本手动聚焦来伪造恢复结果。
- 触屏序列证实拖动后兼容 click 可能缺失，先试单独释放/隐式捕获仍失败；最终以 touch pointerup 确认轻触并抑制重复 click，鼠标/键盘保留原点击。原触摸事件日志和失败结果保留，最终触屏/键盘检查通过。
- 触屏事件绑定曾有括号语法错误，独立 build 即时报错并阻止启动测试，修正后最终构建通过。
- 保护审计初版把 BLOB 对象引用不同当字节不同，并与仍运行旧预览的新登录记录比较；修正为导入时一致性快照与 BLOB 字节比较，排除短期轮换 refresh_tokens。未忽略教学记录差异。
- 早期 avatar-robot/combined-states 执行曾长时间挂起并取消，未启动的场景不计通过。独立最终复验无 fail/cancel/skip。自动文档写入曾审批超时，核对未写入后重试成功。

## 实际限制

浏览器为本机 headless Microsoft Edge，版本见 capture.json。触屏使用浏览器触摸输入仿真，软键盘为明确的 visualViewport 事件模拟，不是真实 iOS/Android 键盘；没有声称多浏览器/真机或生产公网发布通过。可人工在触屏设备复核键盘与拖动。

新环境未启用 provider，正式前三课正文/照片/文章/题目没有提供；本轮维护/学习旅程中的教材、报告、作品、附件和 provider 错误均标为隔离验收材料。公网仍是原4174环境，未把这些截图当成公网已更新。金币规则、后七课内容及下一阶段功能未制定/实施。
