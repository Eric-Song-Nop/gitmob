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

详细视觉方向见 [08-ui-ux-direction.md](/Users/eric/Documents/Sources/acp/gitmob/docs/08-ui-ux-direction.md)。

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
- review 内底部 `ActionDock`
- overlay 弹层
- PR 卡片滑动反馈标签

## 当前核心页面

### `review.tsx`

当前 `review` 页面内部承担三种状态：

- `pr-deck`
- `segment-deck`
- `submit-overlay`

这意味着组件设计也围绕这三种状态收敛，而不是按旧页面拆分。

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

- repo
- 标题
- 作者
- 更新时间
- files / `+ -`
- 来源 badge

#### `peek`

展示：

- PR body 摘要
- labels
- review pulse
- CI summary

约束：

- `peek` 只用于补充信息，不进入正式 review

### `SegmentDeck`

职责：

- 在单个 PR 内渲染当前 segment 和下一段预览
- 管理 segment 翻面和切换节奏

### `SegmentReviewCard`

职责：

- 渲染单个 segment 的正反两面

#### 正面 `CardFrontSummary`

展示：

- 标题
- summary
- rationale
- risk
- 涉及 hunk / file 的简要信息

#### 背面 `CardBackDiff`

展示：

- 精确 diff
- review threads
- 行评论入口

说明：

- 当前默认代码查看方式是卡片背面，不是 sheet-first
- `DiffView`、`DiffLine`、`CommentThread` 仍然是这条链路的一部分

### `ActionDock`

职责：

- 承担 segment review 的主要按钮动作

当前动作：

- `Accept`
- `Concern`
- `Comment`
- `Skip`
- `Submit`

约束：

- 只存在于 segment review 阶段
- 首页 PR deck 不共享这套动作

### `CommentOverlay`

职责：

- 录入段评论或行评论
- 不再开独立页面

### `SubmitReviewOverlay`

职责：

- 汇总 review stats
- 显示最终 GitHub review event
- 编辑 summary body
- 提交 review

## 当前已删除的旧组件类型

以下组件类型不再属于当前主路径：

- 旧 PR 详情 header
- 旧 PR 列表 item
- 旧 reviewer / CI 独立信息块
- 依赖 tabs/files 页面结构的辅助组件

如果新组件设计开始重新引入这些模式，应视为架构回退。
