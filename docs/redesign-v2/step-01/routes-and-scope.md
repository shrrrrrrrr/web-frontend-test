# 第 1/3 步：当前 / 目标路由与数据作用域

实施前记录，基线 7bf3115；新版总指令优先于旧导航及全平台星海主题约定。

| 当前入口 | 本步目标 | 数据与兼容边界 |
| --- | --- | --- |
| /explore、学生 /dashboard、/courses | /explore 课程选择；两个旧入口 replace 到此 | 只读 active 报名且 published 的课程；单课程仍停留选择；不加载跨课程待办 |
| /courses/:id | 真实课程地图；同路径其他角色保留原详情 | URL 决定课程；显式 ID 主题映射，默认北航通用；读取并核验后显示 |
| /lab、/glider | /courses/:courseId/lab、/courses/:courseId/glider | 课程内自由使用绑定 courseId；原课时来源保留 lessonId/stage/cardId。无来源旧链接先选课程；未归属历史保留旧本人 API 读取，本步不新增浏览页、不迁移数据 |
| /archives、/works、/archives/reflection | /courses/:courseId/archives、/works、/reflection 后缀 | 服务端按本人和课程过滤；课程切换清理页面状态及迟到响应；未归属历史不猜归属 |
| /tasks、/tasks/:id、/works/:id、/works/upload | 课程内 tasks / works 及相同对象入口 | 旧对象先真实读取归属并 replace；新路径校验 URL 课程与任务/作品归属；其他角色同名页面不变 |
| /courses/:courseId/lessons/:lessonId/learn、/courses/:id/learn | 保留深链，使用课程外壳 | 原学习规则、草稿键、回看、资料和排课保留；课时真实归属校验；资源 404 局部处理 |
| /dashboard/ai?course_id=... | /courses/:courseId/assistant，过渡整页提问入口 | 本步保留真实助手；第二步才做机器人对话浮窗，不新增中转面板 |
| 无平台“我的” | /me | 账号身份、现有奖励 provider/IndexedDB 的积分徽章及入口；返回来源校验，课程切换不重置奖励 |
| /login、/change-password、/notifications、/feedback、/archives/rewards | 服务页保留 URL，旧奖励页 replace 到 /me，统一平台主题 | 登录落点 /explore；强制改密优先；课程世界观不出现在平台品牌；其他角色普通业务路由保留 |

## 最小实现约束

- 平台和课程主题分别封装；全局字体 Smiley Sans，保留 OFL；场景仅静态，无动画系统。
- 正式视觉主题绑定使用独立 courseId 配置（现有 theme 保持教学分类）；明确标注的隔离测试课程 ID 用于样板，未知 ID 不套星海主题。不修改用户课程名和正式数据库。
- 现状实验列表无课程查询约束、档案为账号汇总、部分作品读取只判本人。会补最小课程范围契约及对象归属校验，并保持旧请求可用；不改评分、仿真算法和奖励事务。
- 路由层、数据读取/写入和服务端共同验证范围；前端菜单不是授权。顶部返回使用合法站内层级与来源，直接打开也有回退。
- 课时与作品/报告完成状态独立；首页待办迁入当前课程地图，资源/安排仍在节点与课程信息区。
- 完整角色头像选择、机器人浮窗、课程内部视觉精修、文案编辑交接和维护端表单分别留第二、三步。

## 实际实现后的接口范围

| 对象 | 课程空间契约 | 写入/权限 |
| --- | --- | --- |
| 课程、课时、资料、回看 | /api/course-spaces/:courseId/courses/...、learning/... | active + published；lesson/card/exercise/resource/replay 核验真实 course_id；下载失败不等于课程撤回 |
| 任务与作品、版本、附件 | 同前缀 tasks / works | 本人 + 实际任务/报名/父作品范围；multipart 解析后再检查归属，拒绝时清理临时上传文件 |
| 报告与反思、成长档案 | learning/lessons/:id/report、archives/generate、archives/reflection | 报告仍走原学习解锁与评审；反思需当前课程 enrollment；聚合只纳入可确认归属的记录 |
| 自由或课时试飞、历史与结果 | glider/simulate、simulations、文件/trace 路径 | 自由试飞注入 URL 的 course_id，不注入 lesson_id；有课时来源时核验；记录和文件仅限本课本人 |
| 灵境小智 | dashboard/ai/courses、dashboard/ai/ask | 课程列表/提问固定在当前可访问课程，继续由原服务执行 enabled/provider/限额规则 |
| 奖励、账号、通知、反馈 | 仍为平台级原接口/本地 adapter | 不按课程复制奖励数据，奖励只存在同账号的本地 IndexedDB |

新入口仅允许 student；其他角色使用原路由和策略。正式主题映射的改动须经代码维护/审核，学生没有写配置入口。完整内容维护界面留第三步。无新增 schema 或迁移。

前端 useCourseApis 捕获 URL courseId，useRemote 清空旧数据并忽略卸载后的响应，StudentScope 对失效对象重新核验并保留网络失败时的输入。请求完成不能自行改变另一个课程的选中项或数据范围。

未绑定课程的旧实验/作品：保留原本人 API；课程列表不显示、不补 courseId。旧无课程导航返回选择页并说明；未归属作品对象链接明确说明原记录仍保留。此处没有实现跨课程历史管理或数据归属修复工具。
