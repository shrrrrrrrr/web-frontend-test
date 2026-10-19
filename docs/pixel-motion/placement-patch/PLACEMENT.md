# 逐原图定位表

权威可编辑源：frontend/src/motion/placements.json；投影函数：placement.js。坐标归一化到命名的原图，不是容器百分比。原图均逐项查看，按实际currentSrc、object-fit/object-position或CSS背景位置映射。桌面/手机/封面分别配置；超出裁切不挪位置。

| 类别/原图键 | 坐标系 | 动作及语义 | 源图锚点 | 源图语义矩形 x/y/w/h |
| --- | --- | --- | --- | --- |
| scenes/login-desktop | 960×540 | campus-leaves：银杏树冠叶片 | [0.12, 0.12] | [0.03, 0.02, 0.22, 0.23] |
| scenes/login-desktop | 960×540 | campus-water：水面波纹 | [0.34, 0.77] | [0.29, 0.69, 0.14, 0.18] |
| scenes/login-mobile | 960×1706 | campus-leaves：银杏树冠叶片 | [0.09, 0.59] | [0.01, 0.49, 0.22, 0.22] |
| scenes/login-mobile | 960×1706 | campus-water：水面波纹 | [0.22, 0.845] | [0.14, 0.82, 0.25, 0.045] |
| scenes/campus-select | 960×540 | campus-leaves：银杏树冠叶片 | [0.18, 0.12] | [0.1, 0.03, 0.2, 0.24] |
| scenes/campus-select | 960×540 | campus-water：水面波纹 | [0.55, 0.8] | [0.42, 0.66, 0.25, 0.22] |
| scenes/campus-personal | 960×540 | campus-leaves：银杏树冠叶片 | [0.15, 0.28] | [0.05, 0.15, 0.22, 0.27] |
| scenes/campus-personal | 960×540 | campus-water：水面波纹 | [0.8, 0.84] | [0.69, 0.76, 0.26, 0.18] |
| scenes/campus | 960×640 | campus-leaves：银杏树冠叶片 | [0.565, 0.53] | [0.515, 0.44, 0.105, 0.2] |
| scenes/campus | 960×640 | campus-water：水面波纹 | [0.84, 0.76] | [0.76, 0.7, 0.18, 0.13] |
| scenes/campus-workspace | 960×540 | campus-leaves：银杏树冠叶片 | [0.12, 0.13] | [0.03, 0.02, 0.21, 0.27] |
| scenes/campus-workspace | 960×540 | campus-leaves：银杏树冠叶片 | [0.87, 0.14] | [0.77, 0.02, 0.22, 0.27] |
| scenes/campus-mobile | 960×1706 | campus-leaves：左侧近景银杏树冠（避开顶栏遮挡） | [0.035, 0.55] | [0, 0.48, 0.1, 0.14] |
| scenes/campus-mobile | 960×1706 | campus-leaves：同一近景树冠内侧（窄幅cover裁切候选） | [0.14, 0.55] | [0.07, 0.48, 0.16, 0.14] |
| scenes/campus-mobile | 960×1706 | campus-water：水面波纹 | [0.55, 0.96] | [0.46, 0.94, 0.22, 0.045] |
| scenes/sky-desktop | 960×540 | sky-cloud：云海边缘 | [0.48, 0.66] | [0.38, 0.58, 0.23, 0.19] |
| scenes/sky-desktop | 960×540 | sky-airflow：高空云层气流 | [0.75, 0.2] | [0.63, 0.13, 0.25, 0.14] |
| scenes/sky-mobile | 960×1706 | sky-cloud：左侧云海边缘 | [0.39, 0.69] | [0.29, 0.65, 0.2, 0.08] |
| scenes/sky-mobile | 960×1706 | sky-airflow：高空云层气流 | [0.74, 0.18] | [0.62, 0.15, 0.25, 0.07] |
| scenes/sky-cover | 960×540 | sky-cloud：云海边缘 | [0.34, 0.68] | [0.24, 0.59, 0.23, 0.2] |
| scenes/forest-desktop | 960×540 | forest-leaves：顶部树冠 | [0.29, 0.08] | [0.21, 0.015, 0.18, 0.18] |
| scenes/forest-desktop | 960×540 | forest-insect：林缘草丛昆虫 | [0.18, 0.77] | [0.08, 0.68, 0.23, 0.2] |
| scenes/forest-mobile | 960×1706 | forest-leaves：顶部树冠 | [0.34, 0.075] | [0.23, 0.02, 0.25, 0.12] |
| scenes/forest-mobile | 960×1706 | forest-insect：林缘草丛昆虫 | [0.19, 0.76] | [0.09, 0.7, 0.24, 0.13] |
| scenes/forest-cover | 960×540 | forest-leaves：顶部树冠 | [0.72, 0.065] | [0.61, 0.005, 0.23, 0.14] |
| scenes/forest-cover | 960×540 | forest-insect：林缘草丛昆虫 | [0.2, 0.81] | [0.08, 0.7, 0.26, 0.22] |
| scenes/beach-desktop | 960×540 | beach-surf：近岸海水浪花 | [0.48, 0.82] | [0.31, 0.72, 0.38, 0.2] |
| scenes/beach-desktop | 960×540 | beach-beacon：现有灯塔灯室 | [0.943, 0.272] | [0.9, 0.2, 0.09, 0.15] |
| scenes/beach-mobile | 960×1706 | beach-surf：近岸海水浪花 | [0.55, 0.84] | [0.39, 0.77, 0.31, 0.13] |
| scenes/beach-mobile | 960×1706 | beach-beacon：现有灯塔灯室 | [0.91, 0.175] | [0.85, 0.14, 0.12, 0.07] |
| scenes/beach-cover | 960×540 | beach-surf：近岸海水浪花 | [0.25, 0.69] | [0.14, 0.6, 0.25, 0.18] |
| scenes/beach-cover | 960×540 | beach-beacon：现有灯塔灯室 | [0.89, 0.2] | [0.84, 0.13, 0.11, 0.15] |
| scenes/cosmos | 960×640 | voyage-star：深空星点 | [0.4, 0.2] | [0.34, 0.13, 0.13, 0.16] |
| scenes/cosmos | 960×640 | voyage-led：空间站灯带 | [0.565, 0.63] | [0.51, 0.58, 0.12, 0.1] |
| scenes/vertical | 960×1440 | voyage-star：深空星点 | [0.48, 0.36] | [0.42, 0.31, 0.13, 0.12] |
| scenes/vertical | 960×1440 | voyage-led：空间站灯带 | [0.78, 0.51] | [0.72, 0.47, 0.13, 0.09] |
| scenes/voyage-reading | 960×540 | voyage-led：左舷控制台灯带 | [0.065, 0.55] | [0.005, 0.48, 0.13, 0.14] |
| scenes/voyage-reading | 960×540 | voyage-star：右舷窗外星点 | [0.81, 0.15] | [0.75, 0.08, 0.18, 0.16] |
| scenes/voyage-lab | 960×540 | voyage-led：实验机柜指示灯 | [0.24, 0.42] | [0.19, 0.35, 0.12, 0.16] |
| scenes/voyage-lab | 960×540 | voyage-star：舱外星点 | [0.51, 0.15] | [0.44, 0.08, 0.15, 0.15] |
| nodes/campus-node1 | 192×192 | campus-node1：培养罐气泡 | [0.33, 0.31] | [0.22, 0.22, 0.25, 0.18] |
| nodes/campus-node2 | 192×192 | campus-node2：后部仪表灯 | [0.79, 0.28] | [0.68, 0.18, 0.23, 0.2] |
| nodes/campus-node3 | 192×192 | campus-node3：展示屏扫描 | [0.76, 0.43] | [0.64, 0.3, 0.27, 0.27] |
| nodes/sky-node1 | 192×192 | sky-node1：风速仪气流 | [0.76, 0.28] | [0.65, 0.17, 0.24, 0.23] |
| nodes/sky-node2 | 192×192 | sky-node2：测风台气流 | [0.75, 0.34] | [0.64, 0.23, 0.24, 0.23] |
| nodes/sky-node3 | 192×192 | sky-node3：观察屏指示 | [0.71, 0.36] | [0.6, 0.25, 0.25, 0.22] |
| nodes/forest-node1 | 192×192 | forest-node1：生态观察屏扫描 | [0.83, 0.36] | [0.71, 0.25, 0.25, 0.23] |
| nodes/forest-node2 | 192×192 | forest-node2：棚顶藤叶 | [0.77, 0.14] | [0.65, 0.04, 0.25, 0.23] |
| nodes/forest-node3 | 192×192 | forest-node3：棚顶藤叶 | [0.72, 0.18] | [0.6, 0.07, 0.26, 0.23] |
| nodes/beach-node1 | 192×192 | beach-node1：海水监测仪指示 | [0.74, 0.22] | [0.62, 0.11, 0.26, 0.22] |
| nodes/beach-node2 | 192×192 | beach-node2：水轮控制台指示 | [0.38, 0.26] | [0.25, 0.14, 0.27, 0.24] |
| nodes/beach-node3 | 192×192 | beach-node3：灯塔灯室 | [0.37, 0.15] | [0.24, 0.04, 0.27, 0.23] |
| nodes/vr | 192×192 | voyage-vr：全息设备扫描 | [0.49, 0.4] | [0.36, 0.28, 0.27, 0.25] |
| nodes/theory | 192×192 | voyage-airflow：风洞仪表气流 | [0.69, 0.22] | [0.56, 0.1, 0.27, 0.24] |
| nodes/experiment | 192×192 | voyage-maker：试飞台仪表灯 | [0.25, 0.39] | [0.12, 0.27, 0.27, 0.25] |
| nodes/moon-base | 192×192 | voyage-led：月面基站灯 | [0.34, 0.18] | [0.21, 0.06, 0.27, 0.25] |
| nodes/orbital-berth | 192×192 | voyage-led：轨道港灯 | [0.48, 0.3] | [0.35, 0.18, 0.27, 0.25] |
| nodes/asteroid-outpost | 192×192 | voyage-led：小行星基地灯 | [0.7, 0.3] | [0.57, 0.18, 0.27, 0.25] |

标识mark无定位配置，保持静态。自定义图、失败图、未知/未准备/不可访问关卡沿用静图与中性后备。后台正文阅读层保持不透明；手机正文覆盖的灯/水波不算可见证明，本轮实拍的是页边可见树冠。左右树冠同素材使用独立slot，不按素材ID误取另一个锚点。

逻辑坐标系是原图的等比例参考空间，运行时使用相同宽高比做投影；无需把960/1536响应式变体重复填表。节点ink限定实际墨迹，源图留白和原站位/命中区不变。
