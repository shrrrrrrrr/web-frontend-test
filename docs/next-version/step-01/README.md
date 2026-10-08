# 下一版第 1/3 步 · 持久教学数据与十关地图

[真实页面截图](index.html) · [原创素材](assets.html) · [可编辑文案](copy-review.html) · [验证记录](verification.md) · [字段与权限](fields.md)

基于 `4138c9f6ed3a867b806a0c1d4eeb7ed9763e8730` 在原 main 上继续，原仓库只读参考 SHA 为 `49c179eed0656b34d8b5a03491c8afd9a9d1de77`。唯一提交/推送目标：`shrrrrrrrr/web-frontend-test`。无依赖升级或技术栈迁移。

## 实际入口与保存位置

新持久教学预览：<http://127.0.0.1:4184>，API 为 `http://127.0.0.1:3154/api`。本次实际课程 ID **9003**，前三课 ID **90022、90023、90024**；组件及权限判断不硬编码这些 ID 或课程名称。

保留原合成验收账号：学生 `student_wang / student123`，负责导师 `mentor_zhang / mentor123`，只读教师 `teacher_li / teacher123`。这些不是实际师生名单。导师进入 `/courses/9003?tab=maintenance`，学生进入 `/courses/9003`。

私有教学目录 `C:/Users/shr/Desktop/nmg前端/app/.local/teaching/` 已 Git ignored：

| 文件/目录 | 内容 |
| --- | --- |
| teaching.db（及运行时 WAL/SHM） | 账号、报名、课程/课时、计划、资源元数据、作品/报告/试飞等原业务记录 |
| uploads / feedback | 资料、封面、回放、反馈等真实文件；不进入 public/dist |
| private.json | 稳定 JWT/AI 加密密钥、前后端端口；禁止公开或提交 |
| runtime.json | 本环境进程与私有停止令牌 |
| before-skeleton.db | 一致性导入备份，早于迁移/样例隐藏 |
| import-report.json | 实际 ID、样例处理和文件缺失核对 |

教师文字/文件和账号头像均使用真实本地后端持久保存。金币、礼品、徽章继续是原本按账号隔离的本地演示，不增加奖励后端。学习和助手草稿沿原实现隔离；机器人坐标是设备 UI 偏好 `pbl:robot-position:v1`。

## 启停与初始化

在项目 app 目录执行。本机 `.local/teaching` **已建立，不要重复 init**：

```powershell
npm run build:teaching
npm run teaching -- start
```

构建只写 `build/teaching`。start 同时启动独立前端/原本地后端，仅运行安全迁移，不 seed；数据缺失或端口占用就失败，不重建数据、不杀占用进程。

```powershell
npm run teaching -- stop
# 待本环境退出后重启
npm run teaching -- start
```

stop 只使用本数据目录私有令牌停止对应新环境。后台启动请使用 `Start-Process -WindowStyle Hidden`，日志放 `.local/teaching`。可用 `--data .local/独立子目录` 或 `PBL_TEACHING_DATA` 指定目录，端口在该目录 private.json 内配置。

**原 4174/3144、4173、原公网隧道保持运行；旧 frontend/dist 未重建。** 新环境只监听回环，不自动切公网或部署。

仅另建教学副本时执行一次性导入，目标必须不存在：

```powershell
npm run teaching -- init --source test-results/redesign-v2/preview.json --data .local/新的教学副本
```

SQLite backup() 读取已提交 WAL，随后复制明确的 uploads/feedback 范围；真实存在的文件做路径重定向与 SHA-256 核对。范围外/原本缺失的引用保留并记录，不制造替代文件。普通启动不重新导入，已有目标拒绝覆盖。

## 本次数据处理

旧库核对为未改动的已知合成夹具。仅精确匹配课程 **9001/9002** 设 archived：原章节 **90011/90012**、课时 **90011–90016、90021**、任务 **9001–9003**、卡片 **900111/900112**、练习 **900111**、作品/报告/反思/头像/试飞/报名等原行全部保留，无删除或级联清空。初始化课程 1/2/3 原样保留。

首次建立空骨架时，为旧样例有效报名学生建立新课报名；以后启动不重复分配。关联内容指纹阻止误归档：旧课时、题目、安排、报告、作品或角色有已保存改变，就保留该课程可见，再另建空骨架。不会按“测试”字样批量删除。参见 [旧数据保护核验](protection-audit.json)。

原资源 **9001** 的 missing.txt 原本不在 uploads 且无真实文件，是唯一导入缺失项；保留原引用，下载真实返回局部错误。原预览无已保存 AI provider 密钥，新环境按实际未启用状态显示。若以后旧密文无原加密密钥，保留密文并禁用，管理员需安全重设，不能静默造可用 provider。

## 备份、恢复和回退

SQLite 备份可在线一致性读取；文件复制不是跨数据库事务。要保证元数据与文件同一时点，请暂停维护写入，或先停止**新环境**再备份：

```powershell
npm run teaching -- stop
npm run teaching -- backup --to .local/backup-20261008-唯一编号
npm run teaching -- start
```

备份包含数据库、uploads/feedback 和稳定密钥；目标存在则拒绝覆盖。检查 backup-report.json，缺失引用不能当作已备份文件。备份是私有教学数据，不上传 Git/公开。

恢复只写不存在的新副本，不覆盖正在使用的目录：

```powershell
npm run teaching -- restore --from .local/backup-20261008-唯一编号 --data .local/restored-唯一编号
# 若同时启动，先在恢复副本 private.json 选空闲回环端口
npm run teaching -- start --data .local/restored-唯一编号
```

复制范围内的路径改指恢复目录，原目录不变。本轮在隔离副本验证数据库完整性、文字、实际文件字节/下载、路径和稳定密钥，未覆盖教学环境。迁移 018 加字段/表，019 维护外键删除时的计划状态；回退请保留现场、恢复到新目录并选兼容构建，不用旧 init/schema 覆盖现库。

## 完成与停止边界

十关连续曲线地图、宇航员、未知节点、原安排/资源/底部入口、三课空模板、第三课实验往返、独立实验、八账号头像和顶层可拖动机器人已完成。参观不是全员通关；未准备教材不填样例、不提交学习记录、不发徽章。

仍需提供正式教材/题目/评审要求、照片/精彩瞬间说明、公众号 URL、学生名单和后七课映射。验收写入只在隔离库，未冒充正式内容。参考试飞七参数/算法未改，三维交互沿原未实现边界。

完整可视化填写、其他角色整体视觉、反思重构、签到/奖励后端、兑换通知、完成动画均留后续授权。本步交付后停止，不执行第 2/3 或 3/3 步。
