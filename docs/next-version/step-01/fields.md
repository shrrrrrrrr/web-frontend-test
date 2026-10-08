# 本步字段与权限

迁移 018 新增字段/表，019 保持课时删除时计划编号和未知状态一致，不删除或重建旧业务表；新库 schema 包含相同定义。

| 数据 | 页面/写入 | 边界 |
| --- | --- | --- |
| courses.map_mode | chapters 保留章节；plan 单连续地图 | 主题仍读 presentation_theme，不按标题绑定 |
| course_plan_nodes | course_id/position/lesson_id/state；维护计划 PUT | 同课真实对象，重复位置/课时和跨课拒绝，NULL 不生成课时或学习记录 |
| lessons.presentation_type | learning/visit/theory/experiment | 现有“编辑课时说明与归属”保存，不改课时 ID |
| lessons.content_state | ready/preparing | preparing 拒绝回顾完成/报告提交；ready 仍执行原学习门槛 |
| lessons.moments_note | 精彩瞬间说明，可空 | 照片复用实际 lesson_id 图片资源，不填样例 |
| lessons.article_title/article_url | 真实文章标题及外链，可空 | 仅 HTTPS，无脚本/URL 内凭据；链接不代表内嵌或完成 |
| users.avatar_preset | 本人 GET/PUT /account/avatar；auth/me 回读 | 8 许可 ID，拒绝 URL/他人 ID/额外 body 或 query 字段，旧 avatar_url 保留 |
| course_avatar_preferences | 原课程六角色接口 | 与账号头像完全独立 |
| course_experiments | 第三课 glider 真实关联 | 原关联/来源/返回权限，试飞不自动提交作品或通关 |

负责导师（创建/受邀）和管理员走原维护权限，普通教师/学生不可写；无关对象拒绝，归档课程不可写。课程/学习包在原发布、有效报名和对象权限校验后返回新增字段；撤回/报名移除清除内容；登录失效、停用、强制改密仍走原全局流程。

账号头像保存失败保留原已保存值，写成功回读失败明确提示并可重读/重登；不混入课程角色。教师原文字按原值保存，Sentence 只处理显示末尾句号。

机器人脱离 transform 内容祖先，使用 document.body Portal。鼠标显式 Pointer Capture、触摸原生隐式捕获，6px 区分拖动。触摸轻触在 pointerup 确认并抑制重复 click，避免移动浏览器拖动后缺失兼容 click；鼠标/键盘保持点击。监听 visualViewport 和窗口变化夹紧，Home/可聚焦重置入口可用，仅机器人 touch-action:none，聊天原草稿/请求/资料/权限清理保持。

未知图像失败保留编号/问号/状态及详情；每个平台仅单入口。SVG 测量节点锚点绘制三次曲线，路线不参与解锁。其它课程真实章节及未分组课时保留。
