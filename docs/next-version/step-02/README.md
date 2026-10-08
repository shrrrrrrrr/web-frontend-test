# 下一版第 2/3 步 · 维护端可视化填写与开放反思

[验收图集](index.html) · [实际验证](verification.md) · [74 个角色路由实例](routes.md) · [字段及权限](fields-permissions.md) · [兼容与草稿](compatibility.md) · [独立新文案 HTML](copy-review.html) · [JSON](copy-review.json)

基于 a7ad0fbeb33609e44bec793d2d4fe0c0dbcdae45 继续，未回退已有提交。原仓库只读参考 SHA：49c179eed0656b34d8b5a03491c8afd9a9d1de77。唯一提交/推送目标为 shrrrrrrrr/web-frontend-test。沿用锁文件及原 React/Vite/Ant Design/Router/Axios，无依赖升级。

## 已完成

- 管理员、执行导师、普通教师、新媒体实际页面统一寒蝉团圆体、纸色/像素边框、表单、表格、状态、键盘焦点、触屏按下和减少运动；平台页面校园主题，课程 URL 读取真实主题。保留原角色菜单、可折叠侧栏及持续可达的返回操作。
- 原课程内容维护增加教学区域预览和点击填写，原各维护页签仍可用。课程说明/封面、课时安排与参观说明/照片/HTTPS 文章、回顾/卡片/练习、任务/报告指导、十关计划和实验关联都持久使用原接口。预览不显示答案解析、不操作学生学习记录。
- 保存采用真实对象 ID；写成功读失败保留输入和 ID，再改同一对象。已知版本冲突 409 不覆盖，显式重新读取后核对。上传沿原队列/格式/MIME/签名/大小限制，成功历史不占待处理名额；授权图片预览和 PDF 隔离容器有下载降级。
- 课堂回放上传在新旧路径均限管理员，检查在文件解析之前；其他角色拒绝且不落盘。负责导师仍可按原规则查看/维护标题、归属和删除。学生实际签名播放及撤回规则保留。
- 导师评审队列可直接筛选负责课程/课时、进入真实 reportId，返回恢复筛选及位置，迟到响应被丢弃。学生导师反馈选择课时直接读本人报告，教师只读新旧反思和报告反馈。
- 独立日志及报告附带反思采用三个开放框，任意一个有内容即可。新旧结构版本化，历史第四字段及旧草稿备份保留；报告总结、学习门槛、日限、版本和评审规则保留。
- 回归中修复了生产 CSS 压缩丢失机器人位移禁用规则的问题，保留原固定坐标/拖动语义，没有制作主题动作。

## 真实入口与启动

当前独立教学环境：**http://127.0.0.1:4184**，API **http://127.0.0.1:3154/api**。导师原入口 `/courses/9003?tab=maintenance`，新增页签“可视化填写 / 学生效果预览”；学生 `/courses/9003`、课程成长档案及开放日志；教师沿原观察入口。这些编号仅是当前数据库对象，不是产品规则。

合成验收沿用原提供账号：mentor_zhang / mentor123、student_wang / student123、teacher_li / teacher123。真实教学库及密钥留在 Git ignored 的 `.local/teaching`，不把私有数据放入图集或仓库。

在 app 目录执行：

```powershell
npm run build:teaching
npm run teaching -- start
# 已在运行时需先停本环境，等待退出再启动
npm run teaching -- stop
npm run teaching -- start
```

普通启动只运行增量迁移，不 init/seed。构建只写 build/teaching，不写 frontend/dist。后台启动使用 Start-Process -WindowStyle Hidden，日志留私有教学目录。旧 4174/3144、4173 和公网隧道未切换。

## 备份和回退

本轮开始前已一致备份 `.local/teaching-before-step02-20261008`，含 DB、uploads/feedback 和稳定私有配置。继承的一条缺失文件引用仍在报告中，未伪造替代文件。迁移 020 只新增反思字段；45 张表原字段、已有文件字节和 968 项原系统文案通过保护核对。

```powershell
npm run teaching -- stop
npm run teaching -- backup --to .local/backup-新的唯一编号
# 需要回退时恢复到新的独立目录，保留现场，不覆盖当前库
npm run teaching -- restore --from .local/teaching-before-step02-20261008 --data .local/restored-新的唯一编号
# 在副本 private.json 中选择空闲回环端口，再用兼容该库的构建启动
npm run teaching -- start --data .local/restored-新的唯一编号
```

不对现库执行旧 schema/init，也不在真实库做撤回/删除/上传故障测试。备份包含私有密钥和数据，不能提交。独立副本恢复和文件字节验证见第一步回归日志；本轮迁移后只读保护检查可执行：

```powershell
node scripts/step02-protection-audit.mjs .local/teaching-before-step02-20261008
```

## 文案交回

copy-review.html 包含 **74 项本轮 next2 新文案**，可直接人工编辑，导出仅改动项 JSON，也可保存继续编辑的 HTML。教学正文使用维护端保存，不在系统文案稿填写。此文件与旧冻结稿、fortune-patch 独立稿分开；968 项原 registry 条目逐项比对不变。

```powershell
node scripts/step02-copy.mjs 交回文件.json
# 先查看冲突检查结果，确认改稿后才显式应用
node scripts/step02-copy.mjs 交回文件.json --apply
```

工具仅允许 next2 条目，核对 baseText/baseEnabled，拒绝重复 ID、非本轮字段和已变化的旧值；必要状态不可清空或关闭。默认仅检查，不写源文件。

## 明确边界

本步新增填写、上传、报告反馈和反思均接真实本地接口。图集中带“隔离/合成”的文字和文件只属于验收数据库；实际教学库没有导入它们。正式教材仍由负责人员填写，未知七关不自行编造课时。

积分、礼品、徽章仍是原有明确标注的本地演示；本轮没有签到/账本/发奖/兑换通知或奖励后端。助手仍按实际启用能力，不自动读取生活反思或新增模型。PDF 已有授权下载与隔离容器，浏览器内置阅读器兼容性依浏览器，不声明所有 PDF 都已视觉验证。未做真实移动设备、外部模型、公网切换或生产部署。全路由 smoke 表示实际入口加载，不等于每个无关管理操作均重新验证。

本轮完成后停止，等待维护端与反思验收，不自动进入第 3/3 步。
