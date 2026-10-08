# 字段、接口及权限交接

本轮在现有 CMS、学习报告和档案接口上增量实现。具体课程标题、编号、真实对象 ID 均来自接口。当前教学环境 9003 及前三课 90022/90023/90024 是数据事实，未作为产品判断条件。

| 填写区域 | 持久字段 / 原接口 | 学生显示位置、约束 |
| --- | --- | --- |
| 课程介绍与封面 | title/theme/description/driving_question/story_line/materials_needed/presentation_theme/cover_image；GET /courses/:id/maintenance；PUT /courses/:id/maintenance/course 复用原 courseController.update | 课程选择、课程信息、地图；名称 120 字、驱动问题 1000 字、长正文 10000 字；封面只能已有静态图或原专用上传 |
| 课时标题、介绍与安排 | PUT /courses/:id/maintenance/lessons/:lessonId；title/description/teaching_tip/sort_order/duration/start_at/end_at/location/instructor_id/chapter_id | 学生课时信息；时间为北京时间，结束不得早于开始，授课人是启用的执行导师；原值为空不编造 |
| 三种模板与准备状态 | presentation_type/content_state | 参观、理论、实验；preparing 保留待填写模板，ready 才进入原学习闭环，预览不改变完成判定 |
| 参观内容 | moments_note/article_title/article_url；同一课时 PUT | 精彩瞬间说明、资源照片、文章链接；只接受 HTTPS，不存任意 iframe/HTML/JS |
| 知识卡与练习 | /learning/manage/lessons/:id/cards、/cards/:id、/cards/:id/exercises、/exercises/:id | 原卡片和题目；维护者可编辑答案，教学预览只渲染公开题干/选项；学生接口仍执行原解锁/作答规则，每题一次 |
| 任务与报告指导 | 原 tasks title/description；课时 teaching_tip；PUT maintenance/tasks/:taskId | 作品任务按真实 taskId；报告原字段和 summary 门槛保留，报告与作品独立保存和评审 |
| 地图计划与章节 | PUT maintenance/plan、chapters/order；原章节新增/修改/删除 | 真实 lessonId 关联；未知七节点保持不可进入；维护界面不按名称猜测章节或解锁 |
| 实验关联 | maintenance/experiments；lessonId/stage/cardId/label/enabled | 原滑翔机/来源恢复，课程和卡片归属校验；无关联不出现配套入口，自由实验不伪造课程 |
| 公共/课时资料 | POST /courses/:id/resources；PUT maintenance/resources/:resourceId；GET 对应授权 download | 先选归属和用途；名称/说明可修改，下载取真实文件；图片授权 Blob 预览，PDF 使用 sandbox 空权限 iframe，无法显示时下载 |
| 封面 | POST /courses/:id/cover | 原文件策略、私有鉴权；改回静态封面时复用原删除记录/文件生命周期 |
| 课堂回放 | POST /courses/:id/replays；旧及嵌套维护入口 | **管理员上传，角色检查在 multer 前**；原签名授权流和撤回边界保留 |
| 回放元数据 | PUT/DELETE 原 replays 及维护嵌套路径 | 仍为负责导师和管理员；标题/归属/删除不因“上传限制”额外收紧；未新增替换文件接口 |
| 评审队列 | GET /learning/manage/lessons 获取负责课时摘要；GET /mentor-reviews?course_id&lesson_id&status&page | 不加载学生全课正文来生成筛选；详情按真实 reportId，返回保留查询和滚动位置 |
| 评审详情 | GET /mentor-reviews/:id；POST /:id/review | 原负责课程授权、评分、退回和版本规则；普通教师无评审写权限 |
| 本人导师反馈 | 原本人 lesson/report 接口，课程空间 archives | 选择课时直接显示本人报告/反思/意见，不再跳到课程结构；未提交、待评审、退回、通过独立状态 |
| 三框开放反思 | 原 POST /archives/reflection 和 course-spaces 包装；原 learning/lessons/:id/report | reflection_version=2，entry_note/together_note/extra_note 各 2000 字、任意一框有实质内容；详见兼容说明 |

## 角色边界

| 角色 | 原授权保留 | 本轮变化 |
| --- | --- | --- |
| admin | 全平台教学维护、用户/作品/反馈/通知等原能力 | 新维护预览；允许回放上传 |
| academic_mentor | 自己创建或受邀授课的课程；原学生、卡片、资源、任务、评审范围 | 新维护预览；回放上传不再允许，查看及元数据仍按原规则 |
| teacher | 仅分配学生及原档案范围，只读观察 | 新旧反思、报告正文与反馈正确读取；不新增维护/上传/评审写能力 |
| media | 原发布课程列表、自己的反馈/通知 | 校园样式同步；课程详情旧 RoleGuard 不允许，未擅自开放；不读学生隐私 |
| student | 自己有效报名且已发布课程、自己的成果/实验 | 三框反思；旧四字段阅读保留；无自助报名/退课/评审能力 |

账号停用、登录失效和强制改密沿全局认证；课程撤回/报名失效/对象越界后清除对应旧内容。附件 404 在组件反馈，不把正在填写的学习页面卸载。

维护更新使用可选 expected_revision 哈希令牌：课程、课时、计划、章节排序、章节/任务/资料/回放/实验对象、卡片、当前新增后继续修改的练习均核对已知版本。409 保留输入并要求重新读取核对。旧调用方不传令牌继续兼容，**不是全系统强制锁或自动合并**；删除操作仍需要原确认和授权。新增对象先保留服务端真实 ID，再回读；读失败不能变回“新建”。

预览使用管理接口，只有授权维护人员可进入；不是冒充学生的会话，不调用完成学习、试飞、交报告或学生作答接口。它展示教学字段布局，不模拟某个学生的全部解锁状态。
