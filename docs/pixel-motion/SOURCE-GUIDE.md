# 帧源编辑、生成与打包

修改scripts/pixel-motion/draw.mjs中的整数格rect/dot/line绘制源；31组48×32、8帧，受控十色板和透明。不要给原背景加噪点、模糊或连续变形。每次改帧后运行：

```sh
node scripts/pixel-motion/generate.mjs
node --test frontend/test/pixel-motion.test.js
node --test tests/pixel-motion-import.test.mjs
# 完成验证并提交Git，工作区干净后发布包
node scripts/pixel-motion/package.mjs --out /absolute/path/to/handoff
```

在真实预览站/pixel-motion-preview/index.html查看五主题、播放/暂停、上一/下一帧、8帧切片和静态对照。固定素材逻辑格、整数放大、实际显示尺寸、用途锚点和循环接缝分别检查。素材预览不是网站录屏。目录中的SVG只含静态像素路径；播放由受控前端完成，没有把代码藏在图片里。

绘制/打包工具是开发端工具，不能当服务器导入工具。服务器只用tools/import-assets.mjs读runtime/清单，不运行source/脚本，不导入数据库。新动效版本应使用新独立命名空间和兼容标识；不要将任意新增文件塞进现有导入白名单。

将ZIP与.sha256、package-info.json一起转交；完整DEPLOY.md已在ZIP中。运行素材、可编辑帧和代码分别分区，用户素材/原照片/教材/上传/数据库/账号/密钥不在包里。原生SVG未使用Aseprite或模型，不能伪造.aseprite或特定AI型号记录。

正式打包要求干净Git，PACKAGE记录实际代码提交及workingTreeDirty=false。--allow-dirty仅供本机导入演练，会标记developmentOnly=true，不能转交作正式部署包。最终交付包在完成第二步提交后重新生成。
