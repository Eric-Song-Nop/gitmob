# UI 组件设计

## 设计目标

当前组件体系的目标不是复制 GitHub Mobile 页面结构，而是服务这条已经落地的产品链路：

- `PR inbox deck`
- `segment review deck`
- `CommentOverlay`
- `SubmitReviewOverlay`

核心要求：

- 卡片始终是视觉中心
- 代码始终可读
- chrome 尽量轻
- 首页分诊和正式 review 严格分开

## 当前视觉原则

组件层面的执行规则：

- Gruvbox light/dark 双主题
- 大弧角卡片
- 温暖低饱和底色
- 半透明浮层只做辅助，不做主内容载体
- 通过材质、阴影和明暗做层次，不靠高饱和色块

## 全局布局规则

### 禁止项

- 常驻 header
- 常驻 footer tab bar
- 首页 PR 卡片底部按钮区
- 用传统页面块堆出 GitHub 桌面信息结构

### 允许项

- 安全区内的浮动 pill
- 悬浮 avatar orb
- review 内通过卡片手势和 overlays 承担主动作
- overlay 弹层
- PR 卡片滑动反馈标签

## 当前核心页面

### `review.tsx`

当前 `review` 页面内部承担三种状态：

- `pr-deck`
- `segment-deck`
- `submit-overlay`

组件设计也围绕这三种状态收敛，而不是按旧页面拆分。

## 当前核心组件

### `AmbientCanvas`

职责：

- 提供统一 Gruvbox 氛围背景
- 承载微弱渐变和光感
- 不影响正文对比度

### `FloatingProfileOrb`

职责：

- 打开 `settings`
- 代替旧的 profile tab / profile page 入口

### `ProgressPill`

职责：

- 首页显示 inbox 进度
- review 内显示 segment 进度

### `RepoPill`

职责：

- 在顶部显示当前 repo
- 不承担更多描述性信息

### `PRDeck`

职责：

- 渲染首页当前 PR 卡片和下一张卡的轻预览
- 响应首页分诊手势

交互规则：

- tap：翻到 `peek`
- swipe right：进入 review
- swipe left：Save For Later

约束：

- 不保留底部按钮
- 不承载正式 review 动作

### `PRReviewCard`

职责：

- 首页 PR 卡片本体
- 承担 `front / peek` 双面内容

#### `front`

展示：

- 来源 badges
- repo
- 标题
- 作者与更新时间
- files / `+ -`
- labels
- inbox context
- decision cue

#### `peek`

展示：

- PR body 摘要
- Why now
- labels
- review pulse
- CI summary

约束：

- `peek` 只用于补充判断，不进入正式 review
- PR 卡不是详情页缩略版，而是信息完整的分诊卡片

### `SegmentDeck`

职责：

- 在单个 PR 内渲染当前 segment 和下一段预览
- 管理 segment 翻面和切换节奏
- 管理 review 主手势

当前手势：

- 右滑：`Accept`
- 左滑：`Concern`
- 上滑：`Comment`
- tap：查看背面 diff

### `SegmentReviewCard`

职责：

- 渲染单个 segment 的正反两面

#### 正面 `CardFrontSummary`

展示：

- `title` 作为结论
- `rationale` 作为为什么值得现在判断
- `summary` 作为 LLM summary
- `risk`
- impact scope（files / refs）

语义：

- 正面是判断层
- 看完应能形成 review 倾向

#### 背面 `CardBackDiff`

展示：

- 精确 diff
- review threads
- 行评论入口

语义：

- 背面是证据层
- 回答“证据在哪”，而不是再次解释结论

### `CommentOverlay`

职责：

- 录入段评论或行评论
- 不开独立页面

### `SubmitReviewOverlay`

职责：

- 汇总 review stats
- 显示最终 GitHub review event
- 编辑 summary body
- 提交 review

说明：

- 是收束层，不是常驻主操作区
- 可由顶部 `Summary` 入口或最后一张 segment 后自动进入

## 当前已删除的旧组件类型

以下组件类型不再属于当前主路径：

- 旧 PR 详情 header
- 旧 PR 列表 item
- 旧 reviewer / CI 独立信息块
- 依赖 tabs/files 页面结构的辅助组件
- review 底部工具栏 `ActionDock`

如果新组件设计开始重新引入这些模式，应视为架构回退。
