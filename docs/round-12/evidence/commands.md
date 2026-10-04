# 第十二轮原交付命令与证据（历史提交 f5989eb）

2026-10-04，Windows，本仓库根目录。测试全部使用隔离目录与随机测试凭据；以下不记录密钥、令牌或真实附件。

```powershell
# 应用改动完成后
npm run lint
npm test
# 构建时主动置 1，生产中的 DEV 判断仍必须关闭测试配置
$env:VITE_STUDENT_TEST_CONFIG='1'
npm run build
Remove-Item Env:VITE_STUDENT_TEST_CONFIG

# 选定浏览器套件顺序执行（Node 会按文件名顺序发现；并发数为 1）
$env:ROUND12_CAPTURE_DELIVERY='1'
npm run test:acceptance
Remove-Item Env:ROUND12_CAPTURE_DELIVERY
```

lint.txt / unit.txt / build.txt 为对应命令输出。browser.txt 保留首次组合运行原始结果，包括公共恢复入口变更后旧权限定位失配的失败；不能将其说成整条命令零失败。实际业务断言未删除，更新为确认失效后使用原生链接返回有效首页并重新进入已恢复课时；最终定向复跑日志另行记录。

新增测试调试期出现的拦截器已取消请求释放、地图 query 参数、档案实际标题与已退出子进程重复等待问题，均已修正测试本身，不是前端业务修复。调试日志留于被忽略的 test-results/round12-*.txt，不混入最终场景计数。正式资料与其他角色规则未因用例适配而改变。

统计方法：每个 t.test/scenario 是一个业务场景；顶层测试是父测试；压力循环和视口数均不重复加到场景数。同一场景定向复跑只算一次，实际命令保留各自输出。奖励 120 组固定事务循环只执行一次，不为补日志重跑压力。

### 实验套件时间条件

首次第六轮套件快进浏览器时钟两次共 10 分钟，用于验证计算等待上限；快进后的客户端触发 15 分钟凭据的 5 分钟提前刷新，后续真实接口记录了 refresh 401，来源回退场景因此进入登录页。该隔离实验套件使用原后端已有 JWT_ACCESS_EXPIRES_IN=60 配置（60 分钟凭据），避免快进时间与默认凭据提前刷新互相干扰；没有恢复系统时间的调用。所有超时、参数、来源与权限断言保留，原交付时已定向重跑整套。没有修改生产认证逻辑、默认时长或后端源码。第十/十一轮仍使用真实凭据刷新覆盖。

首次组合日志也保留原 Ant Design Drawer width 弃用、静态 message 上下文及 Form 连接警告；不将构建或 lint 通过写成浏览器控制台没有任何警告。未借此升级依赖或迁移无关模块。
## 定向最终复跑

组合结束后按下列顺序，各自新建隔离库：

```powershell
node --test tests/access.browser.test.js
node --test tests/round6.browser.test.js
$env:ROUND12_CAPTURE_DELIVERY='1'
node --test tests/round12.browser.test.js
Remove-Item Env:ROUND12_CAPTURE_DELIVERY
node tests/round12-handoff.mjs
```

入库日志只移除行末空白及文件末尾空行以通过 Git 格式检查，命令、状态、错误与时间数值未改。

## 权限恢复补修的命令与结果

本页以上命令对应历史交付，未覆盖真实地图站内恢复。补修独立复现、指定四套件复验和前端检查见 [本次实际命令](../patch/evidence/commands.md)，计数与历史 122 个场景分开。此前所有 txt/json 原始日志保持不变。
