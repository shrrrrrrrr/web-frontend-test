# 开发约定

本目录为新项目实现仓库，遵循上级 AGENTS.md 和用户本轮明确的实现要求。

- 唯一可推送远端为 https://github.com/shrrrrrrrr/web-frontend-test.git 。
- 原项目固定引用 SHA 见 SOURCE.md；不得向 nmg233/web 推送。
- 学生一级导航固定为探索地图、实验室、成长档案；其他角色保持原路由。
- backend、simulation 是原样复制的本地测试基线；修改业务接口、授权、评分或算法需明确产品授权。
- 课程、课时、学习进度从真实接口读取；章节配置为空时保留所有课时。
- 奖励目前仅本地演示，规则集中在 rewardConfig.js，不能连带真实扣分或发货。
- 交付前运行构建、lint、前端测试；涉及流程时运行浏览器测试。
- 不提交 .env、密钥、数据库、上传文件、测试产物或 node_modules。
