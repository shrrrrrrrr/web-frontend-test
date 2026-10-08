# 数据、权限、判据与恢复

## 三种数据各自提交

金币是 `star-voyage-rewards` IndexedDB 的 `accounts` 表，继续 schemaVersion 1。增量扩展可选 `meta.checkins` 与 `meta.outbox`，保留旧 state 值、localStorage v1 备份和迁移来源。没有可用数据库时明确失败，不降级成内存成功。

签到在请求 `/api/rewards/day` 之后才开启一个 readwrite 事务。服务器返回自然日和到北京时间午夜的有效毫秒数；客户端以请求前的单调时钟做保守截止。排队后在读取回调再次检查截止，过期不提交。事务读取同账号去重日期、加固定 5、写明细与日期标记，只有 complete 才成功。重新可见、focus 和午夜定时重读；无网络时不使用客户端日历。不同日期资格只由服务端 DTO 提供，客户端时间仅用于明细展示。

真实徽章由 migration 021 的 `lesson_badge_definitions` 和 `student_badge_grants` 保存。定义只连接真实课时，受控艺术 ID 为 vr/theory/glider；不存在未来课时表或未来得奖种子。已有计划前三真实 visit/theory/experiment 类型获得默认定义，不按课程名称或固定课程 ID 判断。新定义也可由原课程维护按授权配置。

演示兑换事件在 `demo_exchange_events`，仅含认证本人、受控商品、稳定操作 ID、类型、时间与通知关联。不含金币余额、支付或真实库存。`notificationService.createForUsers` 使用有效 admin 角色收件人及 `demo-exchange:学生ID:操作ID` dedupeKey，与事件同一 SQLite 事务；写入失败整体回滚，没有孤儿通知。不能提交身份、角色、收件人、任意正文、金额等额外字段。

## 资格判据（lesson-badge-v1）

`learningGate.getLessonLearningState.completed` 原本只含回顾、全部已发布卡片和最新通过报告；原 `consolidationStats` 只看 require_upload=1 且任一作品已通过，不能拿来判定这次徽章。原 progress/评分/前置流程完全不变。

统一服务端 `eligibility` 在本人有效报名、已发布课程、未取消课时内核验：

- 已配置徽章且 content_state=ready；必须有已发布知识卡片，防止零任务空通关。
- 原课堂回顾记录、原全部已发布卡片完成规则。卡片 is_required 不额外改变原闭环的含义。
- 卡片中 is_required 练习沿原“已作答”判据，不要求新正确率、成绩门槛或新增次数。
- 最新报告版本为 approved；submitted/rejected/draft 都不通过。
- 每个 active task 的本人作品版本链均检查最新版本，包括 require_upload=0 的文字作品。旧 approved 不能掩盖新 pending/rejected；取消任务不参与。当前 schema 所有任务作品都有原评审状态，没有另设免评审任务标记，因而不能把 pending 当已完成。
- 参观没有个人完成记录模型，明确未满足。文章点击、精彩瞬间、回放、自由实验成功都不能代替个人通关。

有完整原学习闭环而没有作品任务的课时可以获章；空理论/实验模板不能获章。DTO 只返回定义和满足/缺项理由，不返回答案、他人评分、报告正文。

`POST /badges/reconcile` 是明确的认证本人按需核验：学生进入页面、重新聚焦/上线时核验全部仍可访问的已配置课时，不只在地图点击时修改前端。同一个 server evaluator 在数据库事务中重新确认资格，`UNIQUE(student_id,lesson_id)` 保证重复请求唯一。既有合格学生可补齐首次授予，但不会 seed 任何教学完成记录。

授予记录保留稳定 UUID、真实课时/课程 ID、当时名称、图案、说明、来源标题、时间、判据版本、报告 ID 和作品版本状态快照。后续定义改名/换图、新增任务或课程撤回不静默删除已得历史，也不篡改原分数。历史徽章不是授权：来源失效时 accessible=false，主页只保留本人历史快照、没有进入链接。

## 获章展示

先 reconcile，再成功读取主页 grants；只对其中未展示的稳定 ID 请求 `/badges/present`。该事务竞争消费一个展示机会，提交 shown_at 后返回；多标签仅一个能拿到同一条反馈。一次只显示一个，关闭后重读并顺序取下一条。展示标记表示已发送本次展示机会，不以动画播完为条件；在提交展示机会后立刻关页不会反复补播。首次主页回读失败不会消费展示机会，重读不重复授予。图集动画帧是隔离浏览器对真实 CSS 动画 120/420ms 的暂停采样。

关闭 X、遮罩、Esc、跳过与焦点恢复可用；触发控件已消失/隐藏时回到当前平台导航。reduced-motion 不播放渐显位移。1320 弹窗层级盖住原机器人，不增加机器人/背景动画。

## 演示兑换 outbox

1. 同一本人 IndexedDB readwrite 中检查原价格/库存/限兑，扣本地演示金币、写本地记录和稳定 ID pending 意图。
2. 事务 complete 后，网络发送 `{operationId,giftId}`。后端同账号同操作号同商品复用事件；换商品 409。
3. 后端事件/管理员通知提交确认后，另一本地事务标记 synced，随后重读余额与主页。回读失败不是回滚，也不重新扣币。

网络请求永不夹在 IndexedDB 事务内。响应丢失/离线显示“演示兑换已记录，消息待同步”，刷新、重登、恢复网络或重试沿用原 ID；不换 UUID，不重复扣币。后台事件确认与本地扣币不是跨数据库原子事务，待同步态是正式的恢复状态。

重置保留 checkins 和 outbox（包括已确认 ID，防旧请求重扣），仅重置 state。损坏 meta 明确拒绝，不静默丢意图。账户 key、生命周期 AbortController、JWT owner 与原 client 的 auth revision 双重校验，切账号后暂停旧同步和丢弃迟到响应；旧意图留在原账号，下次登录可恢复。广播只是重读提示，广播失败不能把已提交写变成失败。

## API 与权限

| 路径（/api/rewards） | 方法 | 语义 |
| --- | --- | --- |
| /day | GET | 服务器北京时间与有效时间；拒绝客户端 date/user query |
| /lessons/:lessonId | GET | 本人当前可访问课时资格；失效 404 |
| /badges | GET | 本人真实授予、安全历史、可访问定义/缺项、本人演示事件 |
| /badges/reconcile | POST {} | 本人认证按需授予；拒绝额外字段 |
| /badges/present | POST {grantId} | 本人尚未展示记录的竞争消费 |
| /exchanges | GET | 本人演示事件 |
| /exchanges | POST {operationId,giftId} | 受控演示事件与管理员通知，幂等 |

这些路由沿用原 requireAuth、requirePasswordChanged、student role；停用/登录失效/强制改密仍全局处理，no-store。维护 `/courses/:id/maintenance/badges` GET 和 `/badges/:lessonId` PUT 仍限管理员/负责导师且校验课程内真实课时，教师、新媒体、学生不可写。归档/取消对象不可写，不接受外部素材 URL 或脚本。
