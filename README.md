# 星海远航 · 学生端功能框架

本项目使用 React / Vite / Ant Design / React Router / Axios，沿用原前后端锁文件。第五轮将「晴空观测站」视觉用于具体课时学习、作品提交及学生作品详情，保留第四轮首页和地图。最新结果见 [第五轮交付](docs/round-05.md) 和 [学习与作品截图图集](docs/round-05/index.html)，视觉约束见 [DESIGN.md](DESIGN.md)。原项目引用见 [SOURCE.md](SOURCE.md)，此前记录见 [第四轮](docs/round-04.md)、[第三轮](docs/round-03.md)、[第二轮](docs/round-02.md) 和 [第一轮](docs/round-01.md)。

## 本地启动

建议 Node.js 22.12 或以上；本次实际使用 Node.js 26.2.0。执行目录为本 README 所在的 `app`。

```powershell
npm ci
npm --prefix frontend ci
npm --prefix backend ci
npm run db:init
```

`db:init` 创建原项目的**本地合成测试数据**，已有业务数据时会拒绝覆盖；不要使用 `db:reset`。数据库和上传文件已排除版本管理。不要将初始化账号部署到公网。

在两个终端分别启动：

```powershell
npm run server
```

```powershell
npm run dev
```

访问 http://127.0.0.1:5173 。学生测试账号：`student_wang`，密码：`student123`。其他本地测试账号在原初始化脚本中。登录采用账号而非姓名。

原初始化课程是“月球基地设计师”，页面从接口读取名称，不会将它改名或硬编码为“星海远航”。原初始化数据没有知识卡片，因此其卡片阶段会如实显示等待导师发布。浏览器自动化测试会在独立临时数据库中补充测试卡片，验证完整学习流程，不会写入这个开发数据库。

## 可选：运行原滑翔机参考引擎

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install numpy matplotlib Pillow
```

`npm run server` 检测到此虚拟环境时，使用原 `reference` 引擎。没有环境时页面如实展示引擎状态；不会伪造试飞结果。生产 novaPhy 环境由原项目配置决定，本轮未验证 novaPhy。仿真配置与完整依赖参考 `simulation/glider/README.md`。

默认前端代理到 `http://127.0.0.1:3000`，可通过启动 Vite 时的 `API_PROXY_TARGET` 环境变量指定测试后端；无需改业务接口。

## 验证

```powershell
npm run lint
npm test
npm run build
npm run test:backend
npm run test:e2e
npm run test:e2e:round2
npm run test:e2e:access
npm run test:e2e:round3
npm run test:e2e:round4
npm run test:e2e:round5
```

浏览器测试使用本机 Edge、临时 SQLite 和独立浏览器上下文，不连接生产服务。六个套件分别使用端口 3117/5179、3118/5180、3120/5182、3122/5184、3123/5185、3124/5186。首个回归套件需先安装上述参考引擎依赖；其余套件不运行物理试飞。失败截图及第二至四轮重跑截图保存在忽略提交的 `test-results/`，不覆盖历史交付图。第五轮截图保存在 `docs/round-05/screenshots/`；运行 `node scripts/build-round5-gallery.mjs` 可重建离线图集。测试会自动关闭它启动的服务。后端未变时无需重复运行全部后端测试。

学生登录后可在开发服务器访问 `http://127.0.0.1:5173/__pixel-preview` 浏览原创素材及组件状态。该路由不进入生产构建，也不加入正式学生导航。生成本轮合成学习与作品截图使用 `npm run test:e2e:round5`，无需重置开发库。网页图片已提交，日常启动无需重新生成；复现派生文件可用现有 Pillow 环境运行 `.\.venv\Scripts\python.exe scripts/build-pixel-web-assets.py`，不会改写 PNG 母版。

## 接入状态

- 真实接口：账号、强制改密、课程、课时、任务、知识卡片、练习、学习报告与反思、作品与版本、评审结果、档案、反馈、通知、学习助手、滑翔机。
- 本地演示：积分余额和明细、礼品详情与兑换、兑换记录、徽章；每个页面及确认框标明演示，不真实扣分或发货。数据按账号保存于当前浏览器的原生 IndexedDB。
- 待确认：正式奖励规则与后端契约、章节名称和课时分组、正式课程内容、最终视觉。

正式课程分组在 `frontend/src/student/config.js` 中，当前为空；不虚构章节，未分组课时始终显示。正式实验关联在 `experimentConfig.js` 中，当前为空，实验室可独立进入。仅 Vite 开发环境且 `VITE_STUDENT_TEST_CONFIG=1` 时启用明确标注的测试章节及课程 1 / 课时 1 / 卡片 2 的测试关联；生产构建不会启用。测试开关不会创建课程或更改报名关系，第二轮浏览器测试自行准备相应临时数据。

奖励配置集中于 `rewardConfig.js`，适配层位于 `rewardAdapter.js`。第十轮起使用原生 IndexedDB 数据库 `star-voyage-rewards` 的 `accounts` 仓库；不需要安装数据库库或后端服务。旧 `star-voyage:rewards:demo:v1:${accountId}` 仅在该账号尚未初始化时导入，原备份保留但不再双写；重置保留初始化记录。升级时请刷新旧版本标签，旧页对 v1 的写入不会合并进当前余额。站点存储权限或空间异常会明确报错，不使用临时余额伪装成功。

本轮稳定性验证：`npm run test:e2e:round10`（真实 API 两标签 + 原生事务迁移和 120 组压力），`npm run test:e2e:round8`（完整奖励，不跳过），`npm run test:e2e:round9`（账号/通知/反馈）。第十轮隔离端口 3129/5191、5192；实际结果和最小截图见 [第十轮交付](docs/round-10.md)、[证据图集](docs/round-10/index.html)。历史轮次文档保留其当时实现。

学习报告和作品文字草稿只存当前浏览器，按账号、课程/任务隔离，不保存附件。原先未隔离账号的旧草稿键不会自动导入。
