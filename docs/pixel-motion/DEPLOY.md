# 像素动效代码部署与素材导入

本包只含静态原创动效及其源文件，不含教材、数据库、uploads、账号或密钥。**素材导入不是数据库导入，无需数据库迁移**。四公共主题仍为校园/蓝天白云/森林/海滩；星海远航仍是现有专属主题。此文不是授权部署公网，本轮仅本地验收。

## 先确认代码，再决定是否导入

**常规Git途径**：部署包含本轮SiteMotionGate、SceneMotion、PixelSprite和课程/后台接入的完整代码。资源已随Git提交在frontend/public/assets/pixel-motion/v1，通常不必重复导入ZIP。按项目现有构建/静态发布流程执行npm ci --prefix frontend及npm run build（本轮开发未升级依赖/锁文件）；部署完整frontend/dist，保留现有后端运行方式。不要只覆盖几个JS或只传SVG。检查站点根/assets/pixel-motion/v1能读取SVG/JSON，缓存与JS产物同批更新。

**离线素材途径**：确认PACKAGE.json.developmentOnly=false及workingTreeDirty=false，先取得并部署匹配PACKAGE.json.codeCommit的完整前端代码，再将本ZIP解压到staging，预演校验、明确apply导入frontend/public，随后构建和发布完整产物。**单独上传素材不能让旧前端自动拥有动画**。staging校验成功不等于已经上线。若已采用Git途径，运行预演应显示wouldCopy=0，无需再次apply。

程序兼容标识为pixel-motion-v1，素材版本1.0.0，独立命名空间assets/pixel-motion/v1，不占数据库迁移编号。本机实测Node26.2.0，脚本无第三方运行依赖；其他Node版本及Linux环境本轮未实际运行，应先在staging检查。推荐由服务器同学使用与验收相同的Node版本。没有安装/购买Aseprite的要求。

## 包与校验

转交文件：pixel-motion-v1-complete.zip、同名.sha256及package-info.json（含实际ZIP SHA和匹配代码提交）。ZIP自身的SHA放外部sidecar避免自引用；ZIP内部FILE-SHA256.json校验所有其他成员，PACKAGE.json记录代码提交、63个运行文件、31组/248帧及体积。请把ZIP与SHA一起转交，无需补口头说明。仓库用node scripts/pixel-motion/package.mjs --out OUTPUT重新生成同样分区的真实包。

```text
pixel-motion-v1-complete.zip
  PACKAGE.json                  # 兼容标识、实际代码提交
  FILE-SHA256.json               # ZIP成员逐文件SHA（不自哈希）
  DEPLOY.md / SOURCE-GUIDE.md
  tools/import-assets.mjs        # 独立服务器校验/导入/回滚工具
  runtime/pixel-motion-import.json
  runtime/assets/pixel-motion/v1/
    manifest.json
    campus-*.sheet.svg / *.still.svg
    sky-* / forest-* / beach-* / voyage-* / neutral-instrument.*
  source/frames/*.frames.json    # 可编辑逐帧源
  source/scripts/pixel-motion/   # 原创绘制/发布/打包源
  source/frontend/src/motion/    # 播放机制及受控目录源，不能代替完整代码部署
```

## Windows本机演练命令

以下路径是示例staging/测试目标，**不是教学环境**。替换代码根目录时使用真实物理路径，勿使用junction/symlink。目标必须是已有frontend/public。

```powershell
Get-FileHash -Algorithm SHA256 .\pixel-motion-v1-complete.zip
Get-Content .\pixel-motion-v1-complete.zip.sha256
Expand-Archive -LiteralPath .\pixel-motion-v1-complete.zip -DestinationPath C:\pbl-staging\motion-v1
node C:\pbl-staging\motion-v1\tools\import-assets.mjs --source C:\pbl-staging\motion-v1\runtime --target C:\pbl-release\frontend\public
# 仅在预演成功、确认目标与完整代码版本后显式写入：
node C:\pbl-staging\motion-v1\tools\import-assets.mjs --source C:\pbl-staging\motion-v1\runtime --target C:\pbl-release\frontend\public --apply --backup C:\pbl-backups\motion-v1-first
Set-Location C:\pbl-release
npm ci --prefix frontend
npm run build
```

## Linux服务器示例

仅由服务器同学在既有发布权限和流程下执行。不要在本轮自动运行这些公网部署操作。/srv/pbl-release请替换为包含匹配代码的物理发布目录，不用current软链。

```sh
sha256sum -c pixel-motion-v1-complete.zip.sha256
mkdir -p /srv/pbl-staging/motion-v1
unzip pixel-motion-v1-complete.zip -d /srv/pbl-staging/motion-v1
node /srv/pbl-staging/motion-v1/tools/import-assets.mjs \
  --source /srv/pbl-staging/motion-v1/runtime --target /srv/pbl-release/frontend/public
node /srv/pbl-staging/motion-v1/tools/import-assets.mjs \
  --source /srv/pbl-staging/motion-v1/runtime --target /srv/pbl-release/frontend/public \
  --apply --backup /srv/pbl-backups/motion-v1-first
cd /srv/pbl-release
npm ci --prefix frontend
npm run build
# 将完整frontend/dist按既有静态发布流程上线；不改变后端服务或数据库。
```

默认结果是dry-run、writes=0；全新目标wouldCopy=63，已有Git资源wouldCopy=0。首次apply返回applied及实际writes/backup；重复同包返回unchanged、writes=0。只有这一个资源命名空间可写。脚本校验SHA/尺寸、8帧/250ms/2秒元数据、固定文件白名单和SVG纯整数路径，不执行包内代码；拒绝缺失/意外文件、路径穿越、符号链接、未知人工改动以及并发锁。所有校验在写入前完成。

## 失败与回滚

hash或元数据不符：停止，重新取得完整包，不能编辑清单绕过。未知人工改动：停止并核对，不能清空assets或覆盖uploads。锁存在：确认上次进程是否还在；不要盲目删锁或同时启动两次。复制中断：保留backup.json和files备份，先预演回滚；不能将部分导入称作成功。

```sh
node /srv/pbl-staging/motion-v1/tools/import-assets.mjs \
  --rollback /srv/pbl-backups/motion-v1-first --target /srv/pbl-release/frontend/public
node /srv/pbl-staging/motion-v1/tools/import-assets.mjs \
  --rollback /srv/pbl-backups/motion-v1-first --target /srv/pbl-release/frontend/public --apply
```

Windows使用相同参数与Windows绝对路径。默认rollback-dry-run不写；加--apply后只恢复本批原文件、移除本批原本不存在且仍匹配SHA的文件。不递归删除assets，不触碰教学上传/数据库；目标被人工改动或备份损坏则拒绝。备份绑定原目标目录，不可拿去覆盖另一发布目录。回滚源资源后重新构建/发布相匹配前端；若完全回退功能，以Git提交回退前端代码，禁止回滚数据库。

## 上线后由服务器同学验收

登录及三角色实际页面、五主题地图/关卡/预览有离散帧；暂停/恢复跨页一致；减少运动保持静态；隐藏/离屏暂停；图片404不影响表单。浏览器网络不得一次下载31套帧；手机/键盘及自定义图仍可用。课程标题正常流、信息卡不遮挡，滚动只有工作区栏贴真实顶栏。不得以本地staging预演替代正式站验收。既有权限和API仍是最终授权边界。
