# 本步实际验证

使用本机 Edge headless 154.0.4258.53。真实采集在4184/3154；业务、故障及角色场景在独立合成SQLite/3197、4227及原奖励隔离环境3184、4214进行。没有向实际库灌课程、改分、清奖励或上传测试教材。

| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| `npm run lint` | 通过，0错误/警告 | `lint-final.log` |
| `npm run build:teaching` | 通过，原有>500KB构建提示保留；独立build/teaching | `build-final.log` |
| `npm test` | 87项通过，含4项新增徽章/手势/返回地址单测 | `unit-final.log` |
| `node --test tests/badge-room.browser.test.js` | 12个业务场景通过 | `browser-final2.log`、`browser/final2/results.json` |
| `node --test tests/badge-room-rewards.browser.test.js` | 16个原奖励具名场景通过，仅迁移入口及对应文本断言 | `regression-first.log`、`regression/rewards-final/results.json` |
| `node --test tests/badge-room-copy.browser.test.js` | 3个增量审阅场景通过 | `copy-browser-final.log` |
| `node scripts/capture-badge-room.mjs after` | 真实4184五尺寸截图采集成功，pageErrors为0 | `capture-final.log`、`actual/after/result.json` |
| `node scripts/badge-room-protection-audit.mjs` | 49张表业务字段、附件字节、稳定私有配置、迁移版本保持；本步进度更新时间额外变化0 | `data-protection.json`、`copy-protection.json` |

共 **31个具名浏览器业务场景**（12+16+3），Node另外包含2个父容器，共33个通过项。五尺寸与重复复验不再额外累加成新场景。后端和仿真没有改动，没有为了数量重跑全部后端或物理试飞。

## 关键结果

- 姓名右侧徽章墙与左侧原头像可点，旧独立头像大按钮未恢复。“我的”原真实陈列及徽章标签移除；签到、金币、运势、实物演示及记录保持，数字演示入口迁入徽章墙。
- 追加定向复验：等待非学生实际403界面再断言拒绝（`role-targeted.log`）；滚动后桌面1440及手机390/360的返回按钮原生命中并可点击（`header-final.log`）。这些复验不重复计入31个场景。
- 真实获章彩色在上、授权未获得定义灰度在下，顺序稳定；零获得、全获得、25枚合成展示、场景/徽章404与读取503恢复通过。实际教学库仍为0已获得/3未获得，不为截图造记录。
- 中央详情五尺寸通过。Esc、遮罩、关闭按钮与焦点恢复通过；844×390短屏用原生滚轮验证详情内部scrollTop改变，关闭入口仍可见。键盘Enter进入，触屏不依赖hover；reduced-motion保留。
- 原规则全部满足才授予、报告通过但作品退回不授予、空参观与未准备课时不授予保持。获章反馈跳转实际grant并突出、稳定ID与多标签已读去重、重启与响应丢失恢复通过。
- 课程撤回后未获得项及失效链接清除，已获得仍为安全快照。先挂起旧GET、撤回后读取新状态、再释放旧响应，失效定义不会恢复。另一学生账号看不到本人授予记录，非学生深链被角色守卫拒绝。
- 小智现场首次原生鼠标点击能打开；打开后中心命中发送问题的遮挡已复现并修复。新版五尺寸默认机器人与聊天框矩形分离、触发器中心可命中；鼠标拖动后下一次点击、Enter/Space/Esc、视口固定、窗口夹紧、输入/选择文字/框内控件不误关、空白收起通过。
- 隔离模拟触屏初次tap、再次tap收起、拖动不打开、拖动后tap、touchCancel后tap通过。CDP发送浏览器原生触摸事件，不用DOM dispatch、force点击或删遮罩伪造激活；这是模拟触屏，不是真机验收。
- 4份增量审阅HTML可双击打开。点字修改、下载HTML重开、变化项JSON、纯脚本文字不执行、受控ID导入及旧基线冲突通过。旧46份原文件保留；只修改2条直接关联旧文案，新增26ID。其余人工改稿与宜忌各30条保持，原未渲染辅助行不恢复。

## 首次失败与修正（均保留）

1. `browser-before.log`、`browser/before/trigger-hit.json`：用旧生产构建在隔离库重现机器人中心不可命中；真实4184前记录同样命中“发送问题”。首次点不开未复现，不编造原因。
2. `browser-first.log`、`touch-first.log`、`browser/touch-evidence/touch-events.json`：统一只靠click后，模拟触屏拖动后下一tap只有pointerup而没有click，实测失败。修正为触屏pointerup激活、匹配兼容click只去重一次；鼠标仍click，取消/捕获丢失清理。最终轨迹在 `browser/final2/touch-events.json`。
3. `browser-recheck.log`：测试误用“关闭学习伙伴”，实际人工文案为“收起对话”；修正断言，不改用户文案。
4. `browser-recheck2.log`：课程来源经“我的”返回参数被课程专用safeReturnTo拒绝，丢失来源。增加陈列室专用 `/me` 白名单和嵌套课程校验；不放宽原实验返回规则。
5. `browser-recheck3.log`：误用Ant Design旧类名 `.ant-modal-content`；实际6版为 `.ant-modal-container`。修正样式与采集选择器，不升级依赖。
6. `browser-recheck4.log`：详情在缩放动画中测量造成中心断言失败；等待实际有限动画结束后再测量。保留 `actual/short-detail-during-animation.png`，最终图集不用过渡帧。
7. `browser-recheck5.log`：全获得提示断言带了被既有显示规则处理的末尾句号；按实际展示断言，未恢复用户删除的小字。
8. `lint-return-first.log`、`unit-return-first.log`：新增测试多一个括号、地址校验控制字符正则触发lint；修正测试语法与校验写法，最终87项及lint通过。
9. `copy-browser-first.log`、`copy-browser-second.log`：测试误把基线冲突当返回issues（实际抛错），并误假设旧fortune.boundary注册字段enabled为false；改为断言拒绝旧基线、完整旧字段保持及界面未渲染。没有为测试改变旧文案。
10. `header-first.log`：长页滚动后窄屏返回栏被多行公共头部遮住，原生命中失败。用ResizeObserver读取公共头部实际高度设置返回栏位置，字体/窗口变化同步；桌面及两种手机尺寸定向复验通过。

## 明确边界

没有后台接口、授权、评分、通关条件、运势算法、金币、连续签到或礼品规则变更。金币跨设备真实持久化、一次报告得分发币、阶梯签到及日历留待后续一步。本步不接正式礼品、不切公网，不声称真机、外部模型或新物理试飞通过。

真实数据备份及认证生命周期排除详见README。当前实际库与备份业务字段均相同；后续正常学习如更新进度时间戳应另行记录，不恢复数据库来伪造保护通过。截图与测试原始日志保留，本次Git格式检查对原始日志的工具输出空白单列处理。
