# 本轮实际验证

2026-10-08，本机 Microsoft Edge 154.0.4258.53。故障与跨日测试只在独立临时数据库运行；服务端时钟通过测试子进程 IPC 注入，浏览器使用 Playwright Clock。生产 API 无时钟入口，主机时钟未修改。

| 检查 | 实际结果 | 原始记录 |
| --- | --- | --- |
| `npm run lint` | 通过 | [lint](logs/lint-first.txt) |
| `npm run build:teaching` | 通过；只写 build/teaching | [构建](logs/build-first.txt) |
| `npm test` | 70/70，0 失败/跳过 | [前端](logs/frontend-first.txt) |
| `node --test backend/test/dailyFortune.test.js backend/test/coursePlanAccount.test.js` | 14/14，0 失败/跳过 | [最终后端](logs/backend-release.txt) |
| `PBL_FORTUNE_RUN=release node --test tests/fortune-patch.browser.test.js` | **7 个业务场景通过 + 1 父测试**，合计 8 项，0 失败/取消/跳过 | [最终浏览器](logs/browser-release.txt) · [具名结果](browser-release.json) |
| 实际 4184 三尺寸截图与原路径核验 | 1440×900、768×1024、390×844；无页面横向溢出/脚本异常，运势 v2 / no-store | [截图元数据](teaching-capture.json) · [实际 smoke](logs/teaching-smoke-first.txt) |
| 数据/文案保护 | 46 表业务字段、上传/反馈、配置、旧构建、冻结文件保留；967 原文案 0 改动 | [保护记录](data-protection.json) |
| `git diff --check` | 通过 | 交付前实际运行；Git 仅提示正常 LF/CRLF 转换 |

## 关键验证场景

| 场景 | 实际确认 |
| --- | --- |
| 已知碰撞与完整池 | 账号 4 的 12/6、12/7 比较 level/art/good/avoid，不把日期差异当内容刷新。64 个账号各连续 800 日，共 51,200 次；相邻组合不同，前 720 日每账号恰好 720 个不同组合，含循环边界。受控等级/图案/宜/忌、宜项不重复 |
| 同日与重启 | 独立 Node 子进程三次重算相同；真实 HTTP 同日重复读取/no-store、独立浏览器上下文、刷新页面和隔离后端重启相同；认证本人查询，指定他人/课程/日期均拒绝 |
| 日历与持续打开 | 北京午夜前后、12/31→1/1、2028/2/28→2/29→3/1、跳过多天。持续打开页面实际定时换日后比较组合；focus 与可见事件重新读取正确日期 |
| 网络与迟到 | 跨日 503 隐藏旧宜/忌结果，显示上次读取日期；桌面/手机失败截图可读，按钮重读当天。后发请求先到不被旧请求覆盖；真实登出/切学生 5 后旧学生 4 的迟到内容不显示，响应匹配账号 5 的服务端结果 |
| 显示与文案 | `.fortune-boundary` 不存在，指定说明文字不显示；宜/忌、日期、图案和等级保留。三尺寸无横向溢出。HTML 全部 23 ID，实际下载后重开保留测试文字；JSON 只导出改动 ID，映射导入保留其他新文案；测试改稿未应用网站 |
| 原路径 | 隔离库十关、空参观文章位、无 iframe、独立实验入口；头像真实保存并刷新重读，机器人拖动不打开、滚动位置固定、点击开窗/Esc 关闭。真实 4184 另截图课程、参观、头像选择与机器人，未点击头像保存 |
| 权限/保存 | 相关后端课程计划、空模板、头像、普通教师/学生不可写、撤回/报名移除、停用/强制改密、无登录/失效 token 仍正确拦截；运势读取不写业务表或奖励存储 |

## 首次失败与修正

- [原实现失败](logs/backend-before.txt)：新增已知两日碰撞和连续区间断言都失败，确认真实算法缺口。
- [首次算法修复后](logs/backend-final.txt)：组合检查通过；51,200 次同步检查超过 HTTP 默认空闲期限，引发一次 ECONNRESET。只延长测试服务器 keepAliveTimeout，不改生产服务；[复验](logs/backend-recheck.txt) 和最终结果均通过。
- [首次浏览器](logs/browser-first.txt) 与 [第二次](logs/browser-recheck.txt)：将浏览器推进到未来触发 15 分钟真实时钟 JWT 的反复轮换，登录/恢复测试超时，截图保留。测试恢复事件时钟运行，并仅在临时夹具使用已有 `JWT_ACCESS_EXPIRES_IN` 设置覆盖未来时钟区间；真实教学配置与授权逻辑未改。[修正后](logs/browser-clock-auth-recheck.txt)、[加强账号断言](logs/browser-final.txt)、最终加入手机失败截图均全部通过。
- 首次保护哈希发现 lesson_progress 差异；与重启前一致性备份逐列比较，确认只是一行 updated_at，其他字段和行数相同。没有删除、覆盖或忽略进度状态变化，具体例外公开记录。

未把同场景复验次数或三视口数量加进业务场景计数。未运行无改动的全量后端、全量物理仿真或旧全验收套件。

## 未验证与待复核

独立上下文代表隔离浏览器客户端，不声称已做两台物理设备实测；后台恢复使用可见事件仿真，不声称真实系统长期休眠测试。三尺寸为 headless Edge 视口，不是手机真机。公网仍为旧服务，未声称生产部署。文案可稍后人工修改，当前未强制定稿；后续功能继续停止。
