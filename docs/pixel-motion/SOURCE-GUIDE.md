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

绘制/打包工具是开发端工具，不能当服务器导入工具。服务器只用tools/import-assets.mjs读runtime/清单，不运行source/脚本，不导入数据库。本次1.1.0使用新独立命名空间assets/pixel-motion/v1.1及兼容标识pixel-motion-v1.1，保留已发布v1目录及旧包；后续动效版本同样使用新独立命名空间和兼容标识；不要将任意新增文件塞进现有导入白名单。

将ZIP与.sha256、package-info.json一起转交；完整DEPLOY.md已在ZIP中。运行素材、可编辑帧和代码分别分区，用户素材/原照片/教材/上传/数据库/账号/密钥不在包里。原生SVG未使用Aseprite或模型，不能伪造.aseprite或特定AI型号记录。

正式打包要求干净Git，PACKAGE记录实际代码提交及workingTreeDirty=false。--allow-dirty仅供本机导入演练，会标记developmentOnly=true，不能转交作正式部署包。最终交付包在完成第二步提交后重新生成。

## 按原图维护可动区域（本轮新增）

可编辑表在frontend/src/motion/placements.json，投影函数在同目录placement.js；二者均随ZIP进入source/，动态预览中也带生成副本。请改权威源后运行generate.mjs，勿只改public副本。具体逐图定位表见仓库docs/pixel-motion/placement-patch/PLACEMENT.md。

scenes按实际图片文件名（去掉分辨率后缀）区分login-desktop/login-mobile、campus-select/campus-personal、staff横竖、课程desktop/mobile/cover、cosmos/vertical、voyage-reading/lab。未知或自定义图片没有自动推断的坐标，保留静图/中性器件。

size给出源图逻辑坐标系；point和region是源图归一化的锚点/语义矩形，不是容器百分比。浏览器读取真实currentSrc、object-fit/object-position或CSS背景图/背景位置，使用同一cover/contain矩阵计算裁切偏移。节点绘制的ink限定实际可见墨迹；透明画布不代表整个矩形都有内容。超出裁切或语义范围的对象直接不显示，不把水波搬到其他位置。

增加一张构图不同的底图时，先看实际原图，分别标水面/树冠/设备区域，再加新键并在实际尺寸检查。关卡按192px源图逐项设置，与角色站位和点击区独立。播放器仍然是8个离散帧；只在图片加载和尺寸变化时重算位置，不使用逐帧React重绘。
