# 引用来源

- 原仓库：https://github.com/nmg233/web
- 分支：main
- 固定提交：49c179eed0656b34d8b5a03491c8afd9a9d1de77
- 获取日期：2026-10-03（北京时间）
- 获取方式：GitHub codeload 固定 SHA ZIP，不复制 .git。
- frontend：作为功能基线，保留原页面和接口，重组学生入口。
- backend：最初原样导入用于本地测试。新版第 1 步依据新版总指令，在本仓库添加课程范围适配与对象有效性检查；未改评分、原仓库或仿真算法，详见 docs/redesign-v2/step-01/README.md。
- simulation：原样复制引擎代码，用于本地测试；不修改参数和算法。
- 原目录中的设计交付、素材及源码快照保持不变。
- 本仓库唯一 origin：https://github.com/shrrrrrrrr/web-frontend-test.git

新版第三步继续在本仓库实现，基线 5777e98，原始固定 SHA 不变。按本轮明确授权追加 017 最小课程章节/展示/提示/实验/私有封面迁移，补原资源/回放字段与资料专用格式策略，未修改原仓库、评分或仿真。用户照片/PDF、既有像素素材与前两步文案图集未覆盖。当前契约与验证见 [第三步交接](docs/redesign-v2/step-03/README.md)

`backend/testFixtures/schema-v16.sql` 是基线提交中的 schema 只读快照，用于临时旧库升级，不包含学生数据。`teaching-replay.webm` 为本机现有 FFmpeg lavfi testsrc2 生成的 320×180/12fps/1s VP8 测试图案，无真人影像/声音；作为可播放上传回放的合成验收样本。本轮所有浏览器填写、文件与 provider 回复均来自隔离夹具，不是正式教材或外部模型质量证据

固定导入基线的当前 AI 后端支持可配置 provider；前端读取真实 enabled、origin。第十一/十二轮通过隔离本地 HTTPS provider 验证链路，未使用真实外部 Key，也不保证外部回答质量。不存在已核实的“模型失败必有规则回退”承诺；未新增模型、聊天历史或流式能力。

新版第二步视觉补修依该轮明确授权，仅在本仓库新增 `/api/account/daily-fortune` 只读娱乐展示：已认证学生账号与服务器北京时间稳定派生，无数据库迁移或写入，不影响原 dashboard 提示、评分、奖励或学习权限。原仓库与 reference 保持只读。新增素材、参考与版本见 [补修素材预览](docs/redesign-v2/step-02/visual-patch/assets.html)。

像素素材的生成母版、原创 SVG、派生关系与历史参考出处见 [DESIGN.md](DESIGN.md) 和 [素材清单](frontend/public/assets/pixel-v1/manifest.json)。代码与素材各自注明来源，不把原项目复制代码或外部参考统称原创。
