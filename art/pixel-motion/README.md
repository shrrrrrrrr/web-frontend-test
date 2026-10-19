# 原创整数格像素帧

实际绘制源为scripts/pixel-motion/draw.mjs；v1/*.frames.json为31组、248帧48×32格数据。十色受控色板加透明，8帧×250ms、2秒循环。运行node scripts/pixel-motion/generate.mjs复现SVG横向帧表、静态首帧、运行manifest及SHA。没有Aseprite文件、模型调用或第三方视频/壁纸文件，没有修改原背景。每组至少4个不同像素图案；灯塔和信号最初重复偏多，已由实际帧数据断言查出并修正。

显示为整数缩放、image-rendering:pixelated，不平移整图，不作连续旋转/变形/透明度闪烁。五主题、12公共模板和VR/气流/制作设备分别有用途映射。实际课时、未知/锁定状态及自定义图后备仍由既有业务控制，素材不能决定开放状态。

本轮实际查看技能校园选课、voyage-map、level-vr、level-glider以及四公共主题背景及相关模板原图。校园叶簇/水波和宇宙星芒/信号按真实网页尺寸小样校准后再进入全站接入。原锚点不覆盖。

用户提供的六个B站链接正常抓取均不可用或412；本轮未完整逐帧审阅，不将标题/封面当作运动证据。只参考提示词已经说明的低频像素轮廓变化、湖面高光重排和错相节奏，不复制画面、音乐或壁纸文件。代码原生SVG无需外部模型，不调用中转API、用户本机API key或其他供应商；模型/生图计费型号不适用，不宣称工具名称是账单证明。


## 参考来源与未使用工具

用户指定的参考地址（本轮正常访问失败/412，未下载或复用资源）：

- https://www.bilibili.com/video/BV1thFHewEKV/
- https://www.bilibili.com/video/BV1grBtYwEV9/
- https://www.bilibili.com/video/BV1irvseyELK/
- https://www.bilibili.com/video/BV1RpqUBHEfx/
- https://www.bilibili.com/video/BV1FBJi6QEPx/
- https://www.bilibili.com/video/BV1u92hYcEf5/

可选工具官方资料：https://www.aseprite.org/docs/sprite-sheet/ 、https://www.aseprite.org/docs/cli/ 。本轮未使用、购买或安装Aseprite，不宣称视频作者用它创作。网页不依赖Steam/Wallpaper Engine。本仓库现有校园/公共主题/远航背景仅作为已验收底图对齐小样与锚点，保留原件；新生成资源仅在assets/pixel-motion/v1。

模板使用扫描线、灯点或局部叶片/旗面，不复制第二套设备/灯塔外壳；实际主体仍由原图承担。水波以整数来回位置连回第一帧。源帧JSON包括逻辑格、透明像素、锚点、时长及缩放方式，不伪造位图分层或Aseprite源文件。

不同场景/设备实例以稳定组件标识选择250ms整数倍错相；显式相位仍可配置。错相不改变帧率、锚点或播放规则。
