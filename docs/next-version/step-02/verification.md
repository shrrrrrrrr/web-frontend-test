# 实际验证记录

最终独立生产构建来自当前源文件。所有教学写入、上传、撤回、故障、评审测试使用隔离 SQLite + 真 HTTP/文件接口；真实 4184/3154 只正常迁移、登录和只读验收。首次失败及各次复验日志留 evidence-first，未以父测试增加业务场景数。

| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| npm run lint | 通过 | evidence-first/lint-handoff2.log |
| npm run build:teaching | 通过，仅 build/teaching | evidence-first/build-handoff2.log |
| npm run test | 73 项通过 | evidence-first/frontend-handoff2.log |
| node --test --test-concurrency=1 backend/test/*.test.js | 完整后端 193 项通过 | evidence-first/backend-handoff.log |
| 本轮全角色浏览器 | 12 个业务场景通过；74 个授权路由实例 smoke；pageErrors 空 | evidence-first/browser-handoff.log、browser-handoff/results.json |
| 课程介绍/封面补验 | 1 个场景通过，实际字节/清理/409/保留输入 | evidence-first/course-browser-verified.log、course-browser/result.json |
| 第一步原功能回归 | 10 个业务场景通过，包括实际 Python reference 七参数试飞 | evidence-first/step01-regression-final.log、regression/step01-final/evidence-step02-final/results.json |
| 运势原补修回归 | 7 个业务场景通过，包含跨日/跨账号/迟到请求和改稿显隐 | evidence-first/fortune-regression.log、regression/fortune/browser-step02.json |
| 新文案实际浏览器 | 1 个场景通过，编辑/JSON 下载/保存 HTML 重开/脚本文字不执行 | evidence-first/copy-browser-final.log、copy-browser-result.json |
| 最终真实持久环境只读 | 1 个场景通过，health 200、无教学写入、未导入合成正文 | evidence-first/actual-readonly.log、actual-readonly/result.json |
| 原数据/文件/改稿 | 45 张表原字段保留，文件字节一致，迁移 020 一次，integrity ok/外键违规 0，原 968 文案不变 | evidence-first/protection-handoff.log、data-protection.json、copy-protection.json |

共 **32 个具名浏览器业务场景**，不包含父测试及 74 次路由 smoke。

## 本轮 12 个主场景

1. 负责导师在教学布局中填写课时介绍/安排/授课人/指导，学生读取准确；预览没有新增课堂回顾记录。
2. 卡片新增写成功读失败保留真实 ID，继续更新只有一条；练习新增后继续改同一 ID，预览没有答案解析。
3. 实际附件上传失败重试、写成功回读失败、成功历史 + 20 待处理文件，正常后端重启后文件字节和 ID 保留；学生下载一致。
4. 管理员上传 WebM，学生签名下载字节及浏览器 video.currentTime 实际推进；四种其他角色对旧/嵌套端点拒绝且无文件/记录新增。
5. 独立开放日志全部空客户端拒绝、只写最后一框成功；网络失败草稿刷新恢复，日限失败不清输入。
6. 旧四项报告草稿独立备份并保留第四项原义，开放报告提交后导师直接 reportId 评审、退回。
7. 学生成长档案“导师反馈”直接选择课时看到本人报告与退回意见；分配教师只读看到日志和报告反思，无评审按钮/写权限。
8. 退回后第 2 版提交并通过重审，学生直接看最新意见；提交队列旧响应迟到不覆盖已切换的通过队列。
9. 参观说明、照片和 HTTPS 链接真实填写；授权图片实际 naturalWidth > 0，HTTP 地址拒绝；维护弹窗五尺寸可达。
10. 四角色代表页 1440×900、768×1024、390×844、360×800、844×390；无整页横溢出，字体实际 ChillReunion、返回焦点和减少运动、折叠菜单可用。
11. 管理员 31、执行导师 25、教师 10、新媒体 8 个路由实例实际进入，包含通知/反馈/对象详情；无缺失路由/RoleGuard 错误或学生角色/机器人菜单。
12. 附件 404 只显示局部下载失败，学习阶段仍在；第三课实验来源返回；十节点可见；真实隔离库课程撤回后页面清除，学习接口 404。

后端检查还覆盖新旧反思四项阅读/三框分别提交、空白/长度/混合版本、报名/发布/取消/归属/账号停用/强制改密、无关教师/导师/同学/媒体读取和写入、旧库重复迁移、课程/卡片/实验/练习过期版本不覆盖。原角色与作品授权、文件生命周期、评分和学习闭环的完整后端套件均执行。

## 首次失败与修复依据

保留 backend-first/retry、browser-first/retry、course-browser-first/retry 等原始日志。初期暴露了 fresh schema 未含增量字段、卡片版本与关联查询混用、移动侧栏 3px 边框和返回遮挡、重复选择器 ID 等问题，均修复后复验。其余失败包括测试未等待重新读取表单重建、按钮图标/汉字间距/准备模板与正式学习阶段入口差异，按实际 UI 定位修正，没有移除业务断言。

第一步机器人固定视口断言两次失败，实际生产页诊断显示 hover 的 translate/scale 在压缩后覆盖禁用意图；添加原等价内联禁用后十场景通过。一次完整后端并行运行遇到 Node 26 子测试消息反序列化异常，日志 backend-release.log 保留；串行完整套件复验通过，最终新增练习保护后为 193 项。不得将异常那次记录为通过。

浏览器为本机 Headless Edge；没有真实手机/平板硬件验收。触屏事件及软键盘 visualViewport 模拟的界限在兼容说明中注明。图片预览和 WebM 实际播放验证通过，PDF 下载降级与隔离实现不等于全部 PDF 阅读器视觉兼容验证。
