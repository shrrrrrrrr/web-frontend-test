# 版本与交付范围

开工基线为 `fbd94f703ddd2be07aa6274279e74cdd6bc71733`，main，工作区干净，origin/main 同 SHA；保留全部既有提交，没有回退、强推或重新创建项目。

唯一远端为 `https://github.com/shrrrrrrrr/web-frontend-test.git`。本轮提交包含签到/徽章/演示兑换的前后端增量、原创透明素材、直接相关测试、第三步独立交接以及统一当前验收入口。原仓库和 reference 只读，不向其提交、推送或发 PR；参考提交为 `49c179eed0656b34d8b5a03491c8afd9a9d1de77`。

数据库、密钥、私人上传、教学备份、恢复副本、运行配置、依赖目录和独立 build/teaching 不纳入 Git。测试原始日志仅来自合成夹具与只读核验，保留首次失败和复验，不修饰原始日志格式。

本轮提交信息为 `feat: finish persistent badges and demo reward flows`。完成提交后用 `git show -1 --format=fuller` 查看最终完整 SHA，再正常 `git push origin main`，用 `git ls-remote origin refs/heads/main` 对比本地 HEAD，并检查工作区。最终 SHA 与推送实际结果随最终交付消息提供，本文不嵌入自身提交的循环哈希。

当前本地仍为 4184/3154；旧 4174/3144、4173 和既有公网隧道不切换。三步授权范围完成后停止，等待最终复核。
