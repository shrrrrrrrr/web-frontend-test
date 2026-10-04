# 本人历史作品的课程有效性：后端待办

本文件纳入原工作区 `deliverables/作品课程有效性-后端待办.md` 的已核实内容，使仓库单独克隆可交接。原记录为第五轮基线 4579bf5 的只读代码及隔离 canViewWork 检查；2026-10-04 第十二轮在 88c7b9b 基线上重新只读核对。原始导入 SHA 为 49c179eed0656b34d8b5a03491c8afd9a9d1de77，不称今日上游最新版本。

## 证据与影响

- [backend/helpers/workPolicy.js](../backend/helpers/workPolicy.js) 的 canViewWork：student 分支为 `work.student_id === user.id`，没有课程发布/当前报名检查。
- [backend/controllers/workController.js](../backend/controllers/workController.js) 的 list/show/download：学生列表按本人，详情和下载依赖上述策略；课程归属可沿 works.enrollment_id → enrollments.course_id 获得，但这些读取入口缺统一的当前课程有效性校验。
- 相应入口为 GET `/works`、`/works/:id`、`/works/:id/download`。因此撤回课程/移除报名后，直接请求本人历史作品仍可能获准。这是本人记录的课程边界问题，**不是已确认跨学生访问漏洞**。
- 原作品列表 DTO 不能依靠 course_id 直接归属（有课程标题不足以消歧），前端按当前课程 ID 分批查询并二次确认，避免同名课程错误关联。

第六/七/十一轮已经完成学生作品列表、详情、资料页本人版本的前端过滤与清理。原外部记录中“作品总列表尚未改造”属于第五轮历史，当前不再成立。第十二轮复跑作品、档案、权限和迟到响应覆盖；没有修改后端，也不把界面已隐藏称为直接 API 已拒绝。

## 后续后端工作

先确认课程撤回及异常报名移除后历史作品的保留/访问政策。在当前产品要求下，学生读取本人记录还应统一核对 published 课程及 active 报名；覆盖列表、详情、下载及有关聚合，保留既有其他角色边界。修复后应通过真实接口回归：有效课程 → 撤回 / 移除报名 → 恢复，旧版/新版作品与附件、同名课程、其他学生拒绝、导师与教师原权限。

此项需要另行授权后端工作，本轮仅记录。相关档案/反思数据缺口见 [档案后端待办](archive-backend-todos.md)。
