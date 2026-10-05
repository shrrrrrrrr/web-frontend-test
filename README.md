# PBL 科创平台 · 当前前端

新版第 1/3 步已完成，等待课程选择页与关卡地图视觉验收。基于 `7bf3115` 继续开发，保留原 React / Vite / Ant Design / React Router / Axios 及业务。**当前验收以新版文档为准，旧轮次结论保留为历史。**

**[新版页面与素材图集](docs/redesign-v2/step-01/index.html)** · [交付与启动](docs/redesign-v2/step-01/README.md) · [验证结果](docs/redesign-v2/step-01/verification.md) · [路由与数据范围](docs/redesign-v2/step-01/routes-and-scope.md)

## 当前入口

| 路径 | 学生内容 |
| --- | --- |
| `/explore` | 已分配课程选择；只有一门也保留选择。旧 `/dashboard`、`/courses` 兼容 |
| `/me` | 账号身份、演示积分徽章、礼品兑换/记录、改密、通知、反馈、退出 |
| `/courses/:courseId` | 直接进入真实课时地图，含本课待办、资源、安排、任务/作品入口 |
| `/courses/:courseId/lessons/:lessonId/learn` | 原学习闭环、报告反思、独立作品及评审状态 |
| `/courses/:courseId/lab`、`/glider` 后缀 | 当前课程自由实验、试飞历史；可携课时与卡片来源返回 |
| `/courses/:courseId/archives`、`/works`、`/reflection` 后缀 | 当前课程本人档案、作品版本和反思 |
| `/courses/:courseId/assistant` | 过渡期现有整页提问；能力依实际后台配置 |
| `/notifications`、`/feedback`、`/change-password` | 平台服务页；强制改密优先 |

旧对象链接读取真实归属后定位课程；没有来源的全局入口先选课程。后台角色原工作台和同名业务路由保留。学生不能自行报名、退课或改变主题绑定，后端才是权限边界。

## 新版隔离预览

在仓库根目录运行：

```powershell
npm run build
npm run preview:v2
```

打开 **http://127.0.0.1:4174**，测试账号 `student_wang / student123`。创建全新临时库和随机子进程密钥，使用合成课程 9001/9002；不覆盖已有库、`.env` 或用户配置。API 使用 3144。**4173 是其他应用，不停止它。** Node 依赖和参考 Python 环境需已安装，详见新版交付说明。当前 `.venv/Scripts/python.exe` 用于 reference；未验证 Linux novaPhy 或全新机器联网安装。

已有本地业务环境仍分别用 `npm run server`、`npm run dev`，默认 API 3000、前端 5173。已有库只启动，不执行 reset 或为预览覆盖变量。

## 本步复验

```powershell
npm run lint
npm test
npm run build
npm run test:backend
npm run test:e2e:v2
node --test tests/round10.browser.test.js
node --test tests/round10-rewards.browser.test.js
```

实际结果及日志在新版验证记录。新增课程范围 API 不改变学习、评分和仿真算法；无数据库迁移或依赖升级。奖励仍为账号本地演示，未实现真实发放、发货或跨设备同步。

正式课程 ID、教材、章节和实验绑定待确认，9001/9002 明确标注测试。未绑定课程的旧试飞和作品保留旧本人 API，不自动分配到第一门课；本步没有新增未归属历史浏览页。角色头像、机器人浮窗、内部页面精修、完整文案交接、维护端内容表单均未进入实施。

[当前设计规范](DESIGN.md) · [源码来源](SOURCE.md) · [新版边界说明](docs/redesign-v2/step-01/README.md)

## 历史交付

[旧版总验收](docs/acceptance/index.html) · [十二轮交接](docs/HANDOFF.md) · [权限恢复补修](docs/round-12/patch/README.md)

[第一轮](docs/round-01.md) · [第二轮](docs/round-02.md) · [第三轮](docs/round-03.md) · [第四轮](docs/round-04.md) · [第五轮](docs/round-05.md) · [第六轮](docs/round-06.md) · [第七轮](docs/round-07.md) · [第八轮](docs/round-08.md) · [第九轮](docs/round-09.md) · [第十轮](docs/round-10.md) · [第十一轮](docs/round-11.md) · [第十二轮](docs/round-12.md)

历史测试脚本保留；旧导航断言以其历史轮次为背景，不代表本步全部重新运行。第十轮跨标签脚本仅适配反思路径及退出入口，业务断言保留并实际复验。
