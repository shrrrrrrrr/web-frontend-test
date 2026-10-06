# 第二步当前路由与数据边界

| 路由 | 作用域与行为 |
| --- | --- |
| `/explore`、`/me`、登录/改密/通知/反馈 | 平台账号范围；不显示课程机器人或六角色头像。奖励仍账号本地演示。 |
| `/courses/:id` | 当前课程地图与原第一步场景路线；学习、报告、作品真实状态独立。 |
| `/courses/:courseId/lessons/:lessonId/learn` | 原四阶段学习、报告反思、回看与资料；对象真实 courseId 核验，不改变门槛。 |
| `/courses/:courseId/works`、`works/:workId`、`works/upload` | 当前课本人作品和版本；提交从真实 taskId 进入，退回重交使用 `parent_work_id`。 |
| `/courses/:courseId/lab`、`glider` | 已有滑翔机注册模块；自由使用绑定当前课，课时入口保留 lessonId/stage/cardId 和合法来源。 |
| `/courses/:courseId/archives`、`reflection` | 本课可靠归属的真实汇总、本人作品、报告、反馈和反思；未归属历史不猜归属。 |
| `/courses/:courseId/assistant`、学生旧 `/dashboard/ai?course_id=...` | 课程核验后 replace 到地图，打开并清除一次性参数；只共用一套 ask 会话处理。 |
| 非学生原路由 | 原角色页面、AI、权限和业务保持。 |

头像新增 `/api/course-spaces/:courseId/preferences/avatar` GET/PUT；其余接口继续复用第一步真实课程前缀，作品、报告、反思、仿真、助手均由后端最终核验。无新增教学维护端接口或聊天协议。

正式视觉与章节仍为独立前端 courseId 配置：9001 是合成 voyage 样板，9002 是校园主题隔离样板，未知 ID 默认校园。课程名称来自 API，不据名称绑定主题或实验。正式章节、实验位置与教材待负责人提供。

第一步 `routes-and-scope.md` 是当轮历史记录，其“整页小智待第二步”与当时字体说明由本文件及当前 DESIGN.md 更新；不改写当轮验证结果。
