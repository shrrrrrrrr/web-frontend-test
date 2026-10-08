首轮记录（实际执行，后续日志保留复验）：
1. 首次 lint：Rewards.jsx 93 行替换造成 JSX 解析错误；ServerRewards 混合导出违反 fast-refresh。已经拆分上下文并修复，lint-recheck.log 零错误零警告。
2. backend-rewards.log：新库 schema.sql 没同步迁移 021，8 子测试因 before 钩子失败，不计为8个业务失败。修复 schema 后 backend-rewards-recheck.log 8业务测试通过。
3. backend-full.log / backend-full-recheck.log：200通过，1迁移列表断言仍只列到20；字面列表更新后 backend-full-final.log 201通过。
4. browser-first.log：签到按钮定位器未转义加号导致正则解析失败，尚未执行签到断言。修复测试转义后继续复验。失败截图保留供追溯。

5. browser-recheck1.log 的业务断言通过，但后台标签和截图时机导致获章图片未完成绘制；当前图集已改用 browser-delivery，等待可见帧后截图，不把早期图片作为最终效果。
6. regression-step02.log / regression-step02-recheck.log：新获章反馈遮住原反馈评审按钮；测试关闭新增反馈后保留原流程断言，最终 regression-step02-final.log 全部通过。
7. regression-step01.log：与第二步测试同时使用共享夹具端口，课时 ID 不匹配；改为串行隔离执行后 regression-step01-final.log 通过。属于测试调度问题，未修改教学数据。
8. recovery-first.log：反馈关闭后焦点落到无意义节点；补充有效触发点/当前导航回退并等待 Modal 关闭，recovery-recheck.log 及 recovery-final.log 通过。
9. teaching-final.log / teaching-recheck.log：新空奖励表及第二步反思空默认字段改变了旧样例指纹。仅兼容无用户数据的新增默认结构，保留任何非空徽章/开放反思的归档保护，teaching-verified.log 5 项通过；没有在实际教学库执行 init 或样例归档。
