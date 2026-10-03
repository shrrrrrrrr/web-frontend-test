# 星海远航 · 学生端功能框架

本项目使用 React / Vite / Ant Design / React Router / Axios，沿用原前后端锁文件。没有制作最终视觉主题。原项目引用信息见 [SOURCE.md](SOURCE.md)，最新功能修正、验证结果与验收截图见 [第二轮交付](docs/round-02.md)，初始框架记录见 [第一轮交付](docs/round-01.md)。

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
```

浏览器测试使用本机 Edge、临时 SQLite 和独立浏览器上下文，不连接生产服务。三个套件分别使用端口 3117/5179、3118/5180、3120/5182。首个回归套件需先安装上述参考引擎依赖；后两个套件不运行物理试飞。失败截图保存在忽略提交的 `test-results/`；第二轮验收截图保存在 `docs/round-02/screenshots/`。测试会自动关闭它启动的服务。后端未变时无需重复运行全部后端测试。

## 接入状态

- 真实接口：账号、强制改密、课程、课时、任务、知识卡片、练习、学习报告与反思、作品与版本、评审结果、档案、反馈、通知、学习助手、滑翔机。
- 本地演示：积分余额和明细、礼品详情与兑换、兑换记录、徽章；每个页面及确认框标明演示，不真实扣分或发货。数据按账号保存于当前浏览器。
- 待确认：正式奖励规则与后端契约、章节名称和课时分组、正式课程内容、最终视觉。

正式课程分组在 `frontend/src/student/config.js` 中，当前为空；不虚构章节，未分组课时始终显示。正式实验关联在 `experimentConfig.js` 中，当前为空，实验室可独立进入。仅 Vite 开发环境且 `VITE_STUDENT_TEST_CONFIG=1` 时启用明确标注的测试章节及课程 1 / 课时 1 / 卡片 2 的测试关联；生产构建不会启用。测试开关不会创建课程或更改报名关系，第二轮浏览器测试自行准备相应临时数据。

奖励配置集中于 `rewardConfig.js`，适配层位于 `rewardAdapter.js`。

学习报告和作品文字草稿只存当前浏览器，按账号、课程/任务隔离，不保存附件。原先未隔离账号的旧草稿键不会自动导入。
