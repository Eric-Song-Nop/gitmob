# 系统架构

## 总体架构

GitMob 当前采用四层结构：

```text
UI Layer
  -> Review Session Layer
  -> Domain Services Layer
  -> Data / Provider Layer
```

## UI Layer 的新约束

UI 层现在不只是“显示页面”，还要承担新的空间策略：

- 默认全屏内容
- 最小化 chrome
- 用浮层替代 header/footer
- 用动效表达状态切换和审查结果

### Chrome-Light Shell

新的 App Shell 不再以固定 header/footer 为核心。

```text
Safe Area Overlay
  -> floating back pill / avatar orb / progress chip
Main Canvas
  -> feed card / review deck / code peek
Thumb Zone
  -> action dock / primary CTA / sheet handle
Transient Layers
  -> comment sheet / summary sheet / repo switcher
```

### Shell 规则

- 不使用常驻大标题 header
- 不使用常驻底部 tab bar 承担主导航
- 非核心页面允许出现轻量工具栏，但不能复制网页式布局
- Review 流中优先使用 floating controls 和 sheets

## 四层职责

### UI Layer

负责：

- Expo Router 页面
- feed 卡片
- review deck
- code peek sheet
- comment composer
- outcome sheet
- 动效和手势反馈

### Review Session Layer

负责：

- 当前 segment 索引
- 段级判断
- 评论草稿
- summary body
- sheet 打开关闭状态
- action dock 状态

### Domain Services Layer

负责：

- unified diff 解析
- hunk 到 segment 的映射
- coverage 校验
- GitHub review event 推导
- GitHub review comments 构造

### Data / Provider Layer

负责：

- GitHub API
- Vercel AI SDK provider
- SecureStore
- 本地缓存

## Vercel AI SDK 边界

在当前架构里，Vercel AI SDK 只属于 provider 适配层。

它负责：

- 选择 provider
- 创建 model 实例
- 调用模型
- 返回结构化输出

它不负责：

- 解析 diff
- 生成评论锚点
- 校验 segment coverage
- 推导 GitHub review event
- 管理 review draft
- 管理 UI 状态与导航模式

## 视觉与导航架构

### Feed 模式

目标：把 PR 列表做成更像“内容池”的体验，而不是传统列表页。

推荐结构：

```text
PRFeedScreen
  -> AmbientCanvas
  -> TopUtilityChips
  -> SpotlightPRCard
  -> QueuePreviewRail
  -> FloatingProfileOrb
```

### Review 模式

目标：让 segment 成为屏幕中心对象。

推荐结构：

```text
ReviewDeckScreen
  -> AmbientCanvas
  -> ReviewTopChips
  -> SegmentDeck
  -> ActionDock
  -> SheetHandle
  -> CommentComposerSheet
  -> OutcomeSheet
```

### Code Peek 模式

目标：不破坏 card-first flow，但允许深看代码。

推荐结构：

```text
CodePeekSheet
  -> SegmentMetaStrip
  -> DiffHunkList
  -> InlineCommentEntry
```

## 核心数据流

```text
GitHub PR
  -> fetch unified diff
  -> parseDiff(diff)
  -> DiffFile[] / DiffHunk[]
  -> buildSegmentationInput(hunks)
  -> LLM segmentation
  -> validateCoverage(segments, hunks)
  -> build ReviewSession
  -> render ReviewDeck
  -> deriveReviewEvent(draft)
  -> submit GitHub review
```

## 为什么 parser 必须在 LLM 之前

LLM 不是权威 diff 解释器。

在 GitMob 中：

- parser 负责真实文件、真实 hunk、真实行号
- LLM 只负责将这些 hunk 组织成更易理解的 segment

这条边界不能反过来，否则会出现：

- 评论行号不可靠
- segment 无法证明完整覆盖 PR
- GitHub review comment 构造不稳定

## 分层边界

### 1. Diff 解析层

输入：

- GitHub 返回的 unified diff 字符串

输出：

- `DiffFile[]`
- 每个文件下的 `DiffHunk[]`
- 每行的 old/new line number

要求：

- 解析结果可重复
- 不依赖 LLM
- 作为后续映射的唯一真相源

### 2. Segmentation 层

输入：

- 结构化 hunk 列表
- PR 元数据
- 用户 LLM 配置

输出：

- `Segment[]`
- 每个 segment 引用哪些 file/hunk
- 每个 segment 的标题、摘要、风险说明

要求：

- 每个 hunk 必须且只能被分配一次
- 输出可以解释
- 不允许丢 hunk

实现约束：

- `api/llm/*` 只做模型调用
- `services/segmentation/*` 负责输入构建、结果合并和 coverage 校验
- 页面层不能直接拼 prompt 和 schema

### 3. Review Session 层

输入：

- `Segment[]`
- 用户在 UI 上的段级判断和评论

输出：

- review draft
- 待提交 comments
- summary body
- 最终 event
- 当前 screen / sheet 组合状态

### 4. Submission 层

输入：

- review draft
- GitHub PR metadata

输出：

- `pulls.createReview()` payload
- review comments payload

## Review Shell 状态模型

```ts
interface ReviewChromeState {
  topChipsVisible: boolean;
  actionDockVisible: boolean;
  codePeekOpen: boolean;
  commentSheetOpen: boolean;
  outcomeSheetOpen: boolean;
}
```

规则：

- `codePeekOpen` 时保留 action dock 的轻量版本
- `commentSheetOpen` 时隐藏非必要 top chips
- `outcomeSheetOpen` 时锁定 deck 手势

## 手势策略

### 可以保留为核心的手势

- 左右轻扫切换/判断 segment
- 点按展开代码
- 点按或长按行进入评论
- 上拉打开 summary 或 code peek

### 不应同时争抢的手势

- back 面滚动与上滑评论
- deck 横滑与系统返回手势
- code line 点击与整卡点击

结论：

- Review 流不能依赖 header/footer 来安置所有操作
- 但也不能用过多冲突手势替代它们
- 最终方案是：**浮动控件 + 明确手势分区 + sheet 分层**

## 缓存架构

### GitHub Query Cache

由 TanStack Query 管理：

- PR 列表
- PR 详情
- PR 文件列表
- PR 评论
- PR diff

### Segment Cache

建议 key 包含：

- `owner`
- `repo`
- `pullNumber`
- `diffHash`
- `provider`
- `model`
- `promptVersion`

### Review Draft Cache

按 `prKey` 存储：

```text
review-draft:{owner}:{repo}:{pull}
```

## 大 PR 处理

### 目标

大 PR 不允许漏内容，也不允许简单截断后继续审查。

### 推荐流程

```text
parseDiff()
  -> flatten hunks
  -> chunk hunks for LLM input
  -> LLM returns partial segment groups
  -> merge groups
  -> validateCoverage()
  -> if coverage != 100%, fail session initialization
```

## 当前不纳入主路径的内容

以下能力不属于当前主路径：

- provider fallback
- LLM gateway
- 离线提交队列
- tree-sitter native module
- Web 专门适配架构
- 传统 header/footer 驱动的主界面
