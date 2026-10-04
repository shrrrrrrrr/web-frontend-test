# 星海远航 · 学生端前端

当前约定的学生端改版与第十二轮交接已交付，权限恢复补修等待最终复核。沿用 React / Vite / Ant Design / React Router / Axios，后端及参考仿真来自固定源码基线。课程由后台分配；学生不自行选课或退课。其他角色保留原工作台和管理页面。

**[打开总验收图集](docs/acceptance/index.html)** · [当前交接说明](docs/HANDOFF.md) · [第十二轮历史结果](docs/round-12.md) · [当前补修与复验](docs/round-12/patch/README.md) · [待办与能力边界](docs/BOUNDARIES.md)

## 当前入口

| 学生路径 | 内容 |
| --- | --- |
| `/explore` | 首页待办与已分配课程；`/courses/:id` 真实课时地图 |
| `/courses/:courseId/lessons/:lessonId/learn` | 回顾、卡片练习、报告反思、导师评审、独立作品任务 |
| `/lab`、`/glider` | 自由实验、七参数试飞、结果/图表和历史；已配置课程来源精确返回 |
| `/archives`、`/works` | 本人档案、课程记录、作品版本与导师反馈 |
| `/archives/reflection` | 独立反思；沿用原日配额 |
| `/archives/rewards` | 积分、礼品、兑换记录、徽章的**本地演示** |
| `/dashboard/ai` | 灵境小智单次提问与真实来源，取决于后台配置 |
| `/notifications`、`/feedback`、`/change-password` | 通知、帮助反馈、改密；顶栏及个人菜单可达 |

旧 `/dashboard`、`/courses`、`/tasks`、`/tasks/:id`、`/courses/:id/learn` 与通知链接保留。强制改密先于任何学习。未知地址与无权页面有恢复入口，隐藏菜单不替代服务器授权。

## 启动

有已配置的本地环境时，在仓库根目录分别开两个终端：

```powershell
npm run server
npm run dev
```

打开 `http://127.0.0.1:5173`。API 默认 `127.0.0.1:3000`。已有数据库只启动，**不要执行 reset**。未配置或首次克隆请按 [最小启动、空库与构建预览](docs/HANDOFF.md#启动与环境) 设置自己的本地变量、安装锁定依赖和初始化空库。

本轮实测 Windows Node 26.2.0、npm 11.13.0、Python 3.12.10 / NumPy 2.5.3 / Matplotlib 3.11.2 / Pillow 12.3.0。验证复用了已有依赖，在全新临时目录初始化隔离库；**没有验证全新机器联网安装**。自动化使用 Windows Edge，仿真使用 reference，未验证 Linux novaPhy。

## 复验

```powershell
npm run lint
npm test
npm run build
npm run test:acceptance
```

`test:acceptance` 顺序运行选定的权限、第三/五至十二轮套件，包含完整奖励业务、120 组原生事务、真实凭证刷新、本地 HTTPS provider 和两次不同用途的参考试飞。它启动自己的临时数据库与端口，不使用现有业务库。需要已安装 Edge、参考 Python 环境；回放测试另需系统 ffmpeg，第十一轮本地 HTTPS 需要 Git 附带的 OpenSSL（可通过 `ROUND11_OPENSSL` 指定）。具体脚本、端口、场景统计、限制见 [本轮验收](docs/round-12.md)。

单模块脚本为 `test:e2e:access`、`test:e2e:round2` 至 `test:e2e:round12`，另保留最早 `test:e2e`。历史套件不是每轮都全跑；历史完整验收与当前补修的指定四套件结果分别记录，见第十二轮文档及补修日志。

## 数据与交接边界

- 登录/学习/作品/报告/档案/反思/通知/反馈/助手/试飞复用真实接口，报告和作品不合并，原完成与评分规则不变。
- 正式教学内容、章节和实验绑定未提供。`courseGroups={}`、`EXPERIMENT_ASSOCIATIONS=[]`；只有 DEV 且 `VITE_STUDENT_TEST_CONFIG=1` 才启用明确的合成配置。生产产物不开测试预览页。
- 奖励仍为账号隔离的 IndexedDB 演示，初始 120；没有真实积分、库存、跨设备同步或发货。旧数据一次迁移，重置不重新导入，旧标签需刷新，代码回退不等于数据回退。
- 小智本轮只验收本地测试 provider 链路，未验收外部付费服务或答案质量；没有后台聊天历史、流式输出或取消执行。
- 历史 MP4 可播放；新试飞是数据与科学图表，trace 三维渲染器未实现。原后端本人历史作品的课程有效性缺口仍待修，前端过滤不是后端授权修复。

[设计规范与素材出处](DESIGN.md) · [原源码来源](SOURCE.md) · [完整边界](docs/BOUNDARIES.md)。素材母版、原创 SVG 和派生清单保留；不把原项目代码统称原创。

## 历史轮次

[第一轮](docs/round-01.md) · [第二轮](docs/round-02.md) · [第三轮](docs/round-03.md) · [第四轮](docs/round-04.md) · [第五轮](docs/round-05.md) · [第六轮](docs/round-06.md) · [第七轮](docs/round-07.md) · [第八轮](docs/round-08.md) · [第九轮](docs/round-09.md) · [第十轮](docs/round-10.md) · [第十一轮](docs/round-11.md)

历史文档记载当时状态，不覆盖当前交接结论。唯一提交/推送目标为 `shrrrrrrrr/web-frontend-test`；原仓库只读。当前范围交付后停止，等待用户最终验收，不自动增加新阶段。
