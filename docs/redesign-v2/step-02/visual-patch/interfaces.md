# 接口与素材配置

## 运势：本轮明确授权的最小后端新增

`GET /api/account/daily-fortune`，沿用 Bearer、`requireAuth`、`requirePasswordChanged` 和 student 角色检查，成功响应 `Cache-Control: no-store`

```json
{
  "version": "campus-fortune-v1",
  "date": "2026-10-07",
  "nextUpdateAt": "2026-10-07T16:00:00.000Z",
  "level": "great",
  "art": "fortune-plane",
  "good": ["record", "ask"],
  "avoid": ["rush"]
}
```

这是结构示例，不指定任何真实账号的结果。SHA-256 输入为版本、已认证 `req.user.id`、服务器 Asia/Shanghai 日期，受控枚举与数组派生结果；不同账号可能偶然显示相同组合，不保证每人独特。任何查询参数均返回 400 `FORTUNE_QUERY_NOT_ALLOWED`，不能指定他人、课程或日期。未登录/失效/停用、非学生、强制改密遵循原认证拦截

实现为 `backend/services/dailyFortune.js` 与 `routes/account.js`，app 只新增 mount。无数据库迁移和写入，无积分或学习副作用。原 dashboard 的“今日项目提示”字段及其他角色行为保持原样，不冒充运势能力

前端返回的是文案池 ID：`fortune.level.*`、`fortune.good.*`、`fortune.avoid.*`，文字在 `uiCopy.jsx`，可人工修改。按账号 key、请求序号和卸载标记隔离迟到结果；次日定时、重新可见/焦点与重新登录读取。失败清除结果并重试，不伪造成功

## 场景和封面

[母版与发布清单](asset-manifest.json) 记录尺寸、alpha、文件哈希、字节数。[生成记录](generation-prompts.json) 记录来源路径、提示词和采用状态；首张桌面版未采用，第二版已采用

参考来自 `D:/下载的图库/buaa photos` 的既有联系表、四张用户反馈截图和此前课程风格；原始照片与 PDF 均未修改。建筑描述只取已观察的外观：浅色窗列、银杏、玻璃建筑、池塘与石桥、航空展示，不编造建筑身份或标识。洛谷公开首页访问尝试超时；这里只参考用户要求的“当天结果、宜/忌”结构概念，未核验其内部生成规则、复制素材或抓取账号

`visualAssets.js` 集中管理响应式 URL，根 manifest 新增 `patch-*`，旧素材注册仍保留。`SceneArt` 用 picture/srcset 为手机选择独立构图，不下载桌面 PNG 母版；图只装饰，表单与信息为 DOM。各图预留尺寸，失败有稳定底色；头部使用原生透明 img，不经过有框 PixelImage

平台用 campus-select/campus-personal；课程按既有显式 ID 主题配置使用 voyage-reading/voyage-lab；未知课程默认校园，不按名称猜测。现有地图设施保持，头像只用于本人当前节点，不附带能力或权限。`config.js` 实验登记增加 cover 的 name/alt/position/width/height 展示元数据，未来模块可复用，当前只有已存在的滑翔机

场景母版与响应式 WebP 保留，本轮没有用照片马赛克或整页图取代界面。生成结果不是严格限定色数和统一整数像素网格的手工像素资产；最终颗粒与风格由用户视觉复核

## 显示与交互

`displayText` 处理完整受控句子；`copyFragment` 保留片段标点，经 Sentence/formatChildren 组装后处理。问号、叹号、省略号、外层引号、尾空白保持；URL/文件/数字/代码及输入不改。纯富文本末尾只处理安全 React 原生文字节点，不把 HTML 执行或扁平化。服务端和教师/学生已保存文字仍是原值

透明度、150ms transform/阴影和减少运动在 `visual-patch.css`，交互限于学生 `.student-interactions`。原生事件即时触发，不等待动画；Enter/Space 仅沿用元素本身语义。指针取消、释放、失焦清理按下状态。地图视觉包装缩放，锚点不动；disabled/loading 无弹起，输入不缩放

关卡 Modal 保留成熟遮罩与 dialog 语义并限制 Tab、锁底层滚动；焦点关闭回原节点。选中课时不可访问时清理详情。机器人、头像、关卡及导航复用同一 overlay，没有因场景换图重建课程 Provider。实验卡片封面不改变真实引擎、试飞记录或成果提交
