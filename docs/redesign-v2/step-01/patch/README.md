# 新版第一步补修 · 字体与场景关卡

本次从干净的 `57dea89` 工作区继续，保留 `7bf3115`、`e25aba5` 及既有功能。仅补修第一步样板；后端、权限、评分、奖励事务与仿真源码无变更，无依赖升级。

**[打开同尺寸前后图集](index.html)** · [实际验证](verification.md) · [设施 manifest](scene-manifest.json) · [字体来源](font-source.json)

## 本次完成

- 真实替换为官方 ChillReunion v2.700 **Round / 圆体**。原始 OTF 内部名称为 `ChillReunion_Round`，静态 500 字重、7934 个字形。已有 fontTools 与 Node Brotli 转为本地 WOFF2，逐字形核对轮廓、排版宽度和元数据；OFL 1.1 随字体交付。全局字体 token 和 Ant Design 引用同步，禁止伪可变字重与合成字重。原 Smiley Sans 文件及旧验证日志作为历史保留，当前页面不加载。
- 新增月面基地、轨道站泊位、陨石探测站三张原创透明粗像素母版。前方停机坪承载真实节点，数字移至旁侧；DOM 标题和真实状态独立可读，SVG 连接实际落点。原校园、宇宙、竖幅、飞船素材保持原样。
- 设施按真实课时顺序循环呈现，不代表正式章节或课时名称。0/1/6/20 个课时、未分组和长标题均可展示；取消课时仍保留原因、不会出现进入按钮。未配置宇宙主题的课程保留校园背景与中性节点。
- 金色“当前学习”与青色详情选择分开；键盘可进入，手动选择后重新检查不会抢回。图片失败仍保留标题、真实状态、路线和详情。
- 手机将课程工具、测试标识、待办和进度压紧；不缩小课时正文。390×844、360×800 地图上沿由约 498px 提前至 304px，首个完整节点底部约 645px。保留纵向场景、交错落点、侧栏飞船、菜单关闭和深入页面 sticky 返回。

父目录总指令与第一步提示词读取时已经改为 ChillReunion；已逐一核对并保留，见 [同步记录与文件哈希](prompt-sync.json)。未覆盖用户更新。

## 启动与复验

在 `app` 中运行：

```powershell
npm run build
npm run preview:v2
```

打开 **http://127.0.0.1:4174**，合成学生 `student_wang / student123`，进入第一张课程卡。API 使用 3144。预览脚本创建独立临时 SQLite 库和临时上传目录，不覆盖业务库或 `.env`。4173 无关应用未停止。

现有依赖及本机 `.venv/Scripts/python.exe` 参考仿真环境需要可用。本轮没有验证新机器安装或 Linux novaPhy。

```powershell
npm run lint
npm test
npm run build
npm run test:e2e:v2
npm run test:e2e:v2:patch
# 4174 预览已启动时
node scripts/capture-v2-patch.mjs
```

新增测试使用 5198/3147 和全新临时库；已有新版回归使用 5196/3145、5197/3146。结果分别存放在 `test-results/redesign-v2/`，本次通过的交付副本在本目录。

## 截图与证据

`before/` 是 `57dea89` 的真实页面：初次从修改前 4174 取证，交付时以该提交的独立临时构建在 4184 补拍全部稳定状态，避免抽屉展开时机影响比较。没有回退当前工作树或重置数据；临时 4184 已关闭。[补拍来源](evidence/before-recapture.json)。`after/map-*.png` 和 `after/detail-*.png` 为当前 4174 的相同视口真实截图。不是图片合成页面，也未裁切来改变首屏位置。

| 尺寸 | 首屏 | 选中详情 |
| --- | --- | --- |
| 1440×900 | [前](before/map-1440.png) / [后](after/map-1440.png) | [前](before/detail-1440.png) / [后](after/detail-1440.png) |
| 768×1024 | [前](before/map-768.png) / [后](after/map-768.png) | [前](before/detail-768.png) / [后](after/detail-768.png) |
| 390×844 | [前](before/map-390.png) / [后](after/map-390.png) | [前](before/detail-390.png) / [后](after/detail-390.png) |
| 360×800 | [前](before/map-360.png) / [后](after/map-360.png) | [前](before/detail-360.png) / [后](after/detail-360.png) |
| 844×390 横屏 | [前](before/map-844.png) / [后](after/map-844.png) | [前](before/detail-844.png) / [后](after/detail-844.png) |

图集中另有登录、选择页、我的、礼品浮层、手机侧栏、通用课程、空/错误状态、20 课时全页、三维护角色字体和真实试飞返回截图。全页图先通过正常滚动加载懒加载设施，再回到原位置截图。

## 实际数据与待办边界

课程、课时、安排、待办、作品版本、报告、草稿、评审、试飞、课程撤回与恢复均继续使用现有真实 API。合成课程/章节/卡片只用于隔离验收，不是正式星海教材。奖励仍为本浏览器按账号隔离的演示，不发生真实发放、扣分或发货。

本次未制定正式章节归属、实验关联、奖励条件；未制作新课程专属主题、头像选择、机器人浮窗、教师文案表单或主题动画。通用校园课程沿用中性节点，三种宇宙设施只用于显式 voyage 配置。第二、三步仍待用户指令。

## Git 与来源

新仓库唯一 origin：`https://github.com/shrrrrrrrr/web-frontend-test.git`。补修提交以本目录当前 Git 历史为准，交付消息提供最终 SHA 和远端核验结果。原仓库只读参考提交仍为 `49c179eed0656b34d8b5a03491c8afd9a9d1de77`，没有向原仓库推送。

新版第 1/3 步补修完成，等待地图视觉复核；第 2、3 步尚未开始。
