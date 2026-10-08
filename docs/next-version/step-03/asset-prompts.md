# 素材来源与生成提示

内置 image_gen，三次原创独立生成，透明背景；未复制品牌、人物或其他作品。输出原图分别来自 Codex generated_images 中 exec-d8b07829-868e-45da-8bc2-a11af348578f.png、exec-87c0b4d9-559e-4ba8-81b2-fad2b892ee12.png、exec-bab1a6f1-bedd-406e-a05f-37b7c94f547a.png。项目母版与 WebP 均在 `frontend/public/assets/next-rewards/`。只使用 Pillow 做最近邻尺寸导出，未重绘或背景修图，alpha 保留。

最终提示共同要求：stylized-concept；中学生科学平台成就徽章；48×48 网格感的大颗粒 16-bit pixel sprite、厚阶梯海军蓝轮廓、大色块、简化两级阴影；navy #132a49、cream #fbf6e8、gold #ffd276、cyan #76d9ed；单枚居中、有透明余白；64px 可辨认；不要文字、水印、渐变、发光、模糊、矢量光滑曲线、3D、细纹理、抗锯齿或外部阴影。

三枚最终主题提示：

- VR：ONE badge representing a VR campus science visit, with a simple ivory VR headset and two small cyan lens windows inside a stepped navy-and-gold round medallion. Centered isolated badge, square composition, generous transparent margin, complete silhouette. Real alpha transparent background.
- Theory：One original THEORY EXPLORATION achievement badge. A simple open cream notebook with navy pixel outline and one small cyan star above, inside gold and navy stepped round medallion. Coarse 48x48 pixel-art sprite enlarged nearest neighbor. No text. Real transparent background.
- Glider：ONE original GLIDER PRACTICE achievement badge. A simple cream paper-style glider viewed from top with wide straight wings and tiny cyan nose, inside a navy/gold stepped round medallion. Match coarse 48x48 16-bit pixel-art sprite enlarged by nearest neighbor. Entire badge visible. Genuinely transparent alpha background.

母版 1254×1254 RGBA，发布 192/384 无损 WebP；素材清单记录实际尺寸和 alpha 范围。48格与6–8色是生成目标，不声明母版严格满足固定色数/网格。WebP 与网页 image-rendering:pixelated 保持块状轮廓。灰色“未知徽章”是未来占位，不生成第4–10课正式主题或获章记录。
