# 实际接口、授权与迁移

所有路径以下省略 `/api`。新增维护/封面路由在原认证及强制改密中间件之后，复用 `canManageCourse`：管理员或当前课程创建/受邀授课的执行导师。普通教师、学生、新媒体、匿名、停用和强制改密账号不能通过本轮维护写入。对每个嵌套对象核验路径课程，拥有两门课程也不能拼接对象；前端隐藏按钮不是权限边界

| 方法 / 路径 | 实际用途 |
| --- | --- |
| GET courses/upload-formats | 管理员/导师读取资料、回放、封面类型及限额 |
| POST / PUT courses[/:id] | 复用原课程创建/更新；受控 presentation_theme、现有教学字段、受控公共封面；omitted 保留，显式空值清除可选字段 |
| GET courses/:id/maintenance | 核验负责范围后返回课程、章节、课时、任务、卡片摘要、资料/解析状态、回放与实验关联；归档可读 |
| POST chapters，PUT chapters/:chapterId，DELETE chapters/:chapterId | 上述 maintenance 下新增/改名/删除空章节；非空返回 409，不删除课时或学习记录 |
| PUT chapters/order | `ids` 须为当前课程完整且唯一的章节 ID；事务排序 |
| PUT lessons/:lessonId | 仅 title、description、teaching_tip、chapter_id；取消课时拒绝 |
| PUT tasks/:taskId | 仅 title、description；核验任务→课时→课程，不迁移任务或改评分/历史；取消任务/课时拒绝 |
| POST / PUT / DELETE experiments[/:experimentId] | 仅实际 glider、lessonId、stage 0..3、cardId、label、enabled；同课卡片、卡片必须阶段 1，自由入口无阶段/卡片；禁止任意 URL/模块路径 |
| POST courses/:id/resources | 原上传入口，50 MB；补课时/说明/类型/原文件名，课程资料专用格式策略；可选 UUID upload_token＋摘要确认幂等重试 |
| PUT maintenance/resources/:resourceId | 名称、说明、归属及用途；不改私有文件或索引内容 |
| GET / DELETE maintenance/resources/:resourceId[/download] | 同课核验包装原下载/清理控制器；原全局对象下载接口仍兼容，没有另建存储服务 |
| POST courses/:id/replays | 原专用视频上传 500 MB，补所属课时和说明；原签名流接口/权限不变 |
| PUT / DELETE maintenance/replays/:replayId | 同课包装原回放编辑/删除；原入口继续兼容 |
| POST courses/:id/cover | 专用封面 5 MB，权限先于落盘；结构/尺寸校验、仅替换自己拥有的私有文件 |
| GET courses/:id/cover?v=revision | 管理者或本课程 published＋active 学生认证读取；no-store/nosniff，不能挂到公共 uploads；UUID 避免替换后读取旧 blob |

新增嵌套维护写入和上传对归档课程返回 409；旧课程更新/状态转换 API 的既有管理行为保留，新维护区显示归档只读，不据此宣称旧 API 完全相同的编辑限制。multipart 的认证/角色/课程负责范围在落盘前完成；body 的课时归属读取后检查，拒绝清理本次文件。课程资源下载复用原对象授权，教师不能直读资料；新封面也不会放开该范围

## 读取和恢复

`coursePresentation` 服务随真实课程详情/课程空间下发 `presentation_theme`、章节和合法启用实验；学生课时学习包含教学提示、文件信息，仍只读取公共＋本课时资料。删除或未发布卡片的关联不下发，取消课时不作为合法实验来源；返回时重新核验来源，解除关联回课程地图并说明，不删除历史试飞

课程选择、CoursePresentation、CourseExperience、侧栏、学习/实验/档案和头像许可共享已核验当前课程元数据。旧课程默认 campus；夹具通过真实持久化写 voyage，生产不识别 9001/课程名称。正常焦点重读同课元数据保持组件及正在填写的报告/助手，暂时读取失败保留仍有效输入；确认 403/404/撤回清内容。重试必须实际复核，不因点击“重新检查”直接放行

头像偏好仍为本人＋课程的六枚稳定 ID；campus 不提供头像读取/选择，不删除已有偏好。原六头像/机器人素材、助手 provider 协议、localStorage 草稿 key、IndexedDB 账号奖励及运势算法未变。章节仅组织地图，不创造跨课时门槛

## 017 最小升级

追加 `017_course_content_maintenance.sql`，不修改 001–016：

- courses.presentation_theme 默认 campus，受控 campus/voyage
- course_chapters：id/course_id/title/sort_order；lessons.chapter_id 可空、删除章节 SET NULL，另加 teaching_tip
- resources.file_name/file_type/upload_token/upload_digest；同课程/上传者/有效 token 唯一，用于资料幂等；token/digest 不下发学生/维护 DTO
- course_experiments：稳定 ID、course/lesson/stage/card、glider、label、enabled；来源唯一，不批量迁移测试配置
- course_covers：每课程一份私有拥有文件信息；courses.cover_image 记录受控鉴权 URL

全新 schema 同步等价字段/表。真实 v16 SQL 快照来自 `5777e98`，用于临时旧库复验；非空账号、报名、课时、作品两版本、报告、progress、卡片作答、反思、头像、资源/回放、试飞/轨迹和合成 AI 配置升级后逐字段相等，FK 检查通过。重复运行只记录一次版本 17，不产生虚构章节/实验或将旧课按名称改主题

## 已有库升级和恢复

1. 先停止自己的 API 写入，确认实际 DB_PATH 和附件根目录。备份 SQLite 数据库及 WAL/SHM（或用 SQLite 在线备份得到一致副本），复制其对应私有上传目录；既有模型配置密钥独立安全备份，不提交版本库
2. 保存当前代码提交与环境配置。使用备份副本/临时上传目录先启动 `npm run server`，按现有 `schema_migrations` 自动执行追加迁移，检查日志与课时/附件读取；不要运行初始化/重置来“修复”已有数据
3. 实际环境由维护者在备份完成后执行同样升级。失败保留数据库与错误日志，停止写入并调查；这轮没有自动向下迁移或自动回滚
4. 如需恢复，停止 API，使用一致的升级前备份和匹配旧代码/附件/配置还原。代码 revert 本身不会撤回数据库列、找回文件或回退奖励数据。没有备份时不删除库冒充恢复

本轮预览与测试均只用全新临时 DB。没有实际用户库升级演练、生产发布或新增模型/奖励业务；保留的其他旧对象历史政策与无归属数据边界见当前 [BOUNDARIES](../../BOUNDARIES.md)
