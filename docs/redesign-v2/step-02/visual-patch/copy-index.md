# 本轮文案索引与修改交接

[新版可编辑 HTML](copy-review.html) · [新版稳定基线](copy-baseline.json) · [原编辑方法](../copy-edit-guide.md) · [逐字节保护证据](evidence/copy-protection.json) · [ID 接入审计](evidence/copy-id-audit.json)

用户没有交回已保存文件，并确认先使用原稿，之后手动修改。未应用浏览器中尚未保存的改字。旧版 HTML、JSON、教学快照冻结不动；新版只增加 ID，不重新编号。805 个系统 ID：769 个原条目未改写、36 个新增；803 个现用、2 个旧布局保留。34 个合成教学快照独立保留，共 839 个编辑条目

新增内容分组：`fortune.*` 为今日运势状态、等级、宜忌与娱乐边界；`patch.login.*` 为沿用原稿的登录显示；`patch.map.title` 为统一关卡详情标题；`patch.scene.failed` 为场景失败的辅助说明。新增项也可修改，必要操作/错误不能删除到无法使用；可选项可隐藏或留空， formatter 不回补旧小字

在 HTML 修改后点击“保存已修改 HTML”或“导出文案修改 JSON”，交回实际保存路径。只在浏览器编辑不会写入应用或课程数据库。系统文案由 JSX registry 管理，教学条目为来源快照与建议，第三步维护端尚未开发

在项目根目录安全提取新版差异：

```powershell
.venv/Scripts/python.exe scripts/extract-copy-edits.py "你的已保存文件.html" --baseline docs/redesign-v2/step-02/visual-patch/copy-baseline.json --out test-results/copy-proposed.json
```

脚本只解析数据，不执行 HTML/JSX，不自动应用；未知 ID、非法类型、必要项删除被拒绝，双来源冲突单列。归档确认来源后再应用无冲突差异。测试会临时修改文案时，只操作隔离源副本，本仓库实际 JSX 不被临时覆盖

完整显示句块只去掉最后的句号，内部标点保留。原 registry、原 API 与输入并不改写，因此编辑器里仍可能看到原句号，这是显示规则而非保存时删除

本轮新旧 HTML 安全提取均为 0 修改、0 冲突、0 拒绝，`applied:false`；此结果只能说明当前交付文件和基线一致，不能证明用户没有在其他尚未交回的文件中改稿
