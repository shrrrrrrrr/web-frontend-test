# 全端动效覆盖矩阵

起点f03e585；开始时只读查询PR49为OPEN，上游main为82b021bfbb23a31da21190e302f703fc747001ee。独立分支feat/pixel-scene-motion，未追加旧PR分支。以下是实际接入及已执行的逐页记录，原生后台隐藏一项仍待人工复核，详见verification.md。

| 页面/角色 | 实际主题、位置及素材ID | 播放条件与后备 | 验证 |
| --- | --- | --- | --- |
| 正常登录，横/竖构图 | SceneArt原背景局部campus-leaves/water；可见校园器件区 | 默认播放；暂停/减少运动/失败静态；表单不等待图片 | 6尺寸、错误/存储/404通过 |
| 学生选课、我的/签到/金币/礼品/徽章、通知反馈指引与改密 | 校园；可见器件区及已有场景局部叶簇水波 | 真实业务数据与图形仍静态；原有奖励/徽章反馈不改 | 逐路由、原位编辑/保存回归通过 |
| 课程地图、四阶段、任务作品反思、实验/试飞与成长档案 | CoursePresentation/effectiveTheme真实主题；原CourseScene/SceneArt局部与对应器件 | 不猜课程名称或ID；自定义背景无预设叠图、中性后备 | 五主题、四阶段、真实试飞通过 |
| 四公共主题背景/适用标识封面、12模板 | campus leaves/water/flag；sky cloud/vane/airflow；forest leaves/insect；beach surf/flag/beacon；各node1/2/3 | 只动画内部装饰；原图片/尺寸/命中/角色锚点不动 | 三模板/未知/未准备、键盘、窄屏通过 |
| 星海远航已有VR/理论/实验设备、侧栏及阅读/档案 | voyage-star/signal，实际绑定图的vr/airflow/maker/led局部 | 原主体保留；未知、取消、未准备及现有不可访问原因均不增加节点动作 | 原图+锚点、四阶段；另补VR/理论/实验路由验证 |
| admin / mentor五模块及详情、创建/编辑、课程六页签/教材/上传/组织/申请/评审/奖励/设置 | 后台保持校园；独立叶簇/水面与校园器件；iframe自己的课程主题 | 不改业务布局/标题吸顶；窄屏底部预留控件空间 | admin45、mentor29路由位置及6视口通过 |
| 原位学生预览 | 每个iframe自己的主题及一个文档播放器 | 保留原编辑拦截，仅允许新暂停按钮；没有两层全屏帧 | 预览滚入可见区域后暂停/恢复、真实编辑通过 |
| 加载、网络失败、403/404、强制改密 | 外壳/独立控件仍可见；spinner不计动效 | 无权内容仍清除，装饰失败不触发全局授权清除 | 实际拒绝/503/404/强制改密通过 |
| 自定义上传图 | 原文件与绑定静态；neutral-instrument独立安全区 | 不套预设叶片/星芒、不执行外链脚本；图片失败沿用原后备 | 明示合成HTTP元数据验证通过；非真实主题上传回归 |
| teacher/media | 不新增动效、控件或主题 | PixelSprite与顶层入口按原角色过滤 | 现有角色及后台样式隔离回归通过 |

共享条件：同document一个250ms时钟；只加载可见精灵；暂停/系统减少运动/原生hidden/失焦/离屏停止，恢复不补帧，最后一个订阅/精灵卸载清理。正常模式可见PNG帧差已验证。原生hidden的真实窗口触发仍有宿主验证缺口，不能据此说全部条件均已实测。

## 逐页巡检展开

下面每行关联真实隔离授权对象，记录请求位置、最终路由、实际标题、主题及活动精灵。兼容地址重定向仍是兼容地址，不算一张新页面；状态/视口记录不是互不重叠的业务用例。截图与实时4204预览是独立合成会话，进度不要求相同。

独立实验目录/lab与工作区/glider已补查，仍为校园作用域。完整巡检133条加2条独立入口记录，排除补查中重复的课程实验记录；135条不是135个独立业务场景。

| 角色 | 请求位置 | 最终路由/状态 | 标题 | 主题 | 活动精灵 |
| --- | --- | --- | --- | --- | --- |
| public | /login | 同址 | 登录你的账号 | campus | 4 |
| student | /explore | /explore | 选择一门课程 | campus | 16 |
| student | /me | /me | 合成验收student徽章墙 | campus | 4 |
| student | /me?rewards=records | /me | 合成验收student徽章墙 | campus | 4 |
| student | /me/badges | /me/badges | 徽章陈列室 | campus | 4 |
| student | /guide | /guide | 学生使用指南 | campus | 4 |
| student | /notifications | /notifications | 通知中心 | campus | 4 |
| student | /notifications/10091 | /notifications/10091 | 通知详情 | campus | 4 |
| student | /feedback | /feedback | 我的反馈 | campus | 4 |
| student | /feedback/new | /feedback/new | 提交反馈 | campus | 4 |
| student | /feedback/10091 | /feedback/10091 | 反馈详情 | campus | 4 |
| student | /change-password | /change-password | 修改密码 | campus | 4 |
| student | /courses/9001 | /courses/9001 | 星海远航 · 动效合成验收 | voyage | 11 |
| student | /courses/9001/learn | /courses/9001/learn | 回看课程资料 | voyage | 8 |
| student | /courses/9001/tasks | /courses/9001/tasks | 课后任务 | voyage | 8 |
| student | /courses/9001/tasks/9002 | /courses/9001/tasks/9002 | 课后学习 | voyage | 6 |
| student | /courses/9001/works | /courses/9001/works | 我的作品 | voyage | 8 |
| student | /courses/9001/works/10091 | /courses/9001/works/10091 | 动效验收作品（合成） | voyage | 8 |
| student | /courses/9001/works/upload?task_id=9002 | /courses/9001/works/upload | 提交作品 | voyage | 8 |
| student | /courses/9001/archives | /courses/9001/archives | 我的成长档案 | voyage | 8 |
| student | /courses/9001/reflection | /courses/9001/reflection | 把这次学习，留给下一次自己 | voyage | 8 |
| student | /courses/9001/lab | /courses/9001/lab | 实验室 | voyage | 8 |
| student | /courses/9001/glider | /courses/9001/glider | 滑翔机模拟实验室 | voyage | 8 |
| student | /courses/9001/assistant | /courses/9001 | 星海远航 · 动效合成验收 | voyage | 11 |
| student | /courses/9001/lessons/90011/learn | /courses/9001/lessons/90011/learn | 观察与提问 | voyage | 8 |
| student | /courses/9001/lessons/90012/learn | /courses/9001/lessons/90012/learn | 课后学习 | voyage | 6 |
| student | /courses/9001/lessons/90013/learn | /courses/9001/lessons/90013/learn | 课后学习 | voyage | 6 |
| student | /courses/9001/lessons/90014/learn?stage=0 | /courses/9001/lessons/90014/learn | 实践与验证 | voyage | 8 |
| student | /courses/9001/lessons/90014/learn?stage=1 | /courses/9001/lessons/90014/learn | 实践与验证 | voyage | 8 |
| student | /courses/9001/lessons/90014/learn?stage=2 | /courses/9001/lessons/90014/learn | 实践与验证 | voyage | 8 |
| student | /courses/9001/lessons/90014/learn?stage=3 | /courses/9001/lessons/90014/learn | 实践与验证 | voyage | 8 |
| student | /courses/92011 | /courses/92011 | campus · 动效合成课程 | campus | 11 |
| student | /courses/92012 | /courses/92012 | sky · 动效合成课程 | sky | 13 |
| student | /courses/92013 | /courses/92013 | forest · 动效合成课程 | forest | 13 |
| student | /courses/92014 | /courses/92014 | beach · 动效合成课程 | beach | 12 |
| admin | /dashboard | /dashboard |  欢迎回来，合成验收admin | campus | 4 |
| admin | /courses | /courses | 课程管理 | campus | 4 |
| admin | /courses/create | /courses/create | 创建课程 | campus | 4 |
| admin | /courses/import | /courses/import | 导入数据课程包 | campus | 4 |
| admin | /courses/91001/edit | /courses/91001/edit | 编辑课程 | campus | 4 |
| admin | /courses/91001?tab=overview | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| admin | /courses/91001?tab=maintenance | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| admin | /courses/91001?tab=resources | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| admin | /courses/91001?tab=students | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| admin | /courses/91001?tab=visual | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| admin | /courses/91001?tab=rewards | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| admin | /courses/91001/lessons/91001/content | /courses/91001/lessons/91001/content | 课时内容编辑 | campus | 4 |
| admin | /courses/91001/lessons/91001/preview | /courses/91001/lessons/91001/preview | 基础观察 · 合成课时 | campus | 4 |
| admin | /mentor/teaching | /mentor/teaching | 教学与成长 | campus | 4 |
| admin | /mentor/organization | /mentor/organization | 学校与账号 | campus | 4 |
| admin | /mentor/requests | /mentor/requests | 申请与回复 | campus | 4 |
| admin | /mentor/feedback | /mentor/feedback | 课程反馈 | campus | 4 |
| admin | /mentor/guide | /mentor/guide | 办课使用指引 | campus | 4 |
| admin | /students | /students |  用户管理 | campus | 4 |
| admin | /students/10004 | /students/10004 | 合成验收student的详细信息 | campus | 4 |
| admin | /works | /works | 作品管理 | campus | 4 |
| admin | /archives | /archives | 成长档案 | campus | 4 |
| admin | /mentor/reviews | /mentor/reviews | 学习报告评审 | campus | 4 |
| admin | /notifications | /notifications | 通知中心 | campus | 4 |
| admin | /notifications/10091 | /notifications/10091 | 通知详情 | campus | 4 |
| admin | /feedback | /feedback | 我的反馈 | campus | 4 |
| admin | /feedback/new | /feedback/new | 提交反馈 | campus | 4 |
| admin | /feedback/10091 | /feedback/10091 | 反馈详情 | campus | 4 |
| admin | /student-copy?courseId=91001&page=map | /student-copy | 编辑学生页面文字 | campus | 4 |
| admin | /admin/teaching | /admin/teaching | 教学与成长 | campus | 4 |
| admin | /admin/organization | /admin/organization | 账号与组织 | campus | 4 |
| admin | /admin/organization?section=schools | /admin/organization | 账号与组织 | campus | 4 |
| admin | /admin/organization?section=requests | /admin/organization | 账号与组织 | campus | 4 |
| admin | /admin/organization?section=school-accounts | /admin/organization | 账号与组织 | campus | 4 |
| admin | /admin/organization?section=applications | /admin/organization | 账号与组织 | campus | 4 |
| admin | /dashboard/schools/7001 | /dashboard/schools/7001 | 合成验收学校7001 | campus | 4 |
| admin | /observer/students | /observer/students | 负责学生 | campus | 4 |
| admin | /observer/students/10004 | /observer/students/10004 | 合成验收student | campus | 4 |
| admin | /admin/settings | /admin/settings | 平台设置 | campus | 4 |
| admin | /student-copy | /student-copy | 编辑学生页面文字 | campus | 4 |
| admin | /copy-review | /copy-review | 系统文案审阅 | campus | 4 |
| admin | /dashboard/ai/settings | /dashboard/ai/settings | 灵境小智 · 管理员配置 | campus | 4 |
| admin | /dashboard/ai | /dashboard/ai | 灵境小智 | campus | 4 |
| admin | /feedback/manage | /feedback/manage | 反馈管理 | campus | 4 |
| admin | /reward-management | /reward-management | 待关联课程的存量礼品/历史订单 | campus | 4 |
| mentor | /dashboard | /dashboard | 办课工作台 | campus | 4 |
| mentor | /courses | /courses | 课程管理 | campus | 4 |
| mentor | /courses/create | /courses/create | 创建课程 | campus | 4 |
| mentor | /courses/import | /courses/import | 导入数据课程包 | campus | 4 |
| mentor | /courses/91001/edit | /courses/91001/edit | 编辑课程 | campus | 4 |
| mentor | /courses/91001?tab=overview | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| mentor | /courses/91001?tab=maintenance | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| mentor | /courses/91001?tab=resources | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| mentor | /courses/91001?tab=students | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| mentor | /courses/91001?tab=visual | /courses/91001 | 导师课程A · 隔离验收 | campus | 5 |
| mentor | /courses/91001?tab=rewards | /courses/91001 | 导师课程A · 隔离验收 | campus | 4 |
| mentor | /courses/91001/lessons/91001/content | /courses/91001/lessons/91001/content | 课时内容编辑 | campus | 4 |
| mentor | /courses/91001/lessons/91001/preview | /courses/91001/lessons/91001/preview | 基础观察 · 合成课时 | campus | 4 |
| mentor | /mentor/teaching | /mentor/teaching | 教学与成长 | campus | 4 |
| mentor | /mentor/organization | /mentor/organization | 学校与账号 | campus | 4 |
| mentor | /mentor/requests | /mentor/requests | 申请与回复 | campus | 4 |
| mentor | /mentor/feedback | /mentor/feedback | 课程反馈 | campus | 4 |
| mentor | /mentor/guide | /mentor/guide | 办课使用指引 | campus | 4 |
| mentor | /students | /students |  学生管理 | campus | 4 |
| mentor | /students/10004 | /students/10004 | 合成验收student的详细信息 | campus | 4 |
| mentor | /works | /works | 作品管理 | campus | 4 |
| mentor | /archives | /archives | 成长档案 | campus | 4 |
| mentor | /mentor/reviews | /mentor/reviews | 学习报告评审 | campus | 4 |
| mentor | /notifications | /notifications | 通知中心 | campus | 4 |
| mentor | /notifications/10091 | /notifications/10091 | 通知详情 | campus | 4 |
| mentor | /feedback | /feedback | 我的反馈 | campus | 4 |
| mentor | /feedback/new | /feedback/new | 提交反馈 | campus | 4 |
| mentor | /feedback/10091 | /feedback/10091 | 反馈详情 | campus | 4 |
| mentor | /student-copy?courseId=91001&page=map | /student-copy | 编辑学生页面文字 | campus | 4 |
| student | /reward-management | forbidden or missing | 当前身份无法访问此页面 | campus | 4 |
| student | /courses/999999999 | forbidden or missing | 当前内容已不可访问 | campus | 2 |
| student | /courses/92011 | loading |  | campus | 2 |
| student | /courses/92011 | custom metadata/asset HTTP fixture; static original + neutral dock | campus · 动效合成课程 | neutral | 3 |
| student | /change-password | forced | 先设置你的新密码 | campus | 2 |
| student | /lab | /lab | 实验室 | campus | 4 |
| student | /glider | /glider | 滑翔机模拟实验室 | campus | 4 |

最终补查：短横屏后台暂停入口移至主内容右侧，折叠键实际点击通过；手机菜单展开时控件让位，原课程管理导航通过。三角色六视口及1440×390课程侧栏补查见responsive-patch.json，重复记录不相加。
