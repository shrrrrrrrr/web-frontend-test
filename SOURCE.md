# 引用来源

- 原仓库：https://github.com/nmg233/web
- 分支：main
- 固定提交：49c179eed0656b34d8b5a03491c8afd9a9d1de77
- 获取日期：2026-10-03（北京时间）
- 获取方式：GitHub codeload 固定 SHA ZIP，不复制 .git。
- frontend：作为功能基线，保留原页面和接口，重组学生入口。
- backend：原样复制，用于本地测试；不修改接口、授权、评分。
- simulation：原样复制引擎代码，用于本地测试；不修改参数和算法。
- 原目录中的设计交付、素材及源码快照保持不变。
- 本仓库唯一 origin：https://github.com/shrrrrrrrr/web-frontend-test.git

固定导入基线的当前 AI 后端支持可配置 provider；前端读取真实 enabled、origin。第十一/十二轮通过隔离本地 HTTPS provider 验证链路，未使用真实外部 Key，也不保证外部回答质量。不存在已核实的“模型失败必有规则回退”承诺；未新增模型、聊天历史或流式能力。

像素素材的生成母版、原创 SVG、派生关系与历史参考出处见 [DESIGN.md](DESIGN.md) 和 [素材清单](frontend/public/assets/pixel-v1/manifest.json)。代码与素材各自注明来源，不把原项目复制代码或外部参考统称原创。
