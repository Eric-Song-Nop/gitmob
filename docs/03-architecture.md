# 系统架构

## 总体架构

GitMob 当前采用四层结构：

```text
UI Layer
  -> Review Session Layer
  -> Domain Services Layer
  -> Data / Provider Layer
```

## UI Layer 当前约束

当前 UI 层已经从“多页面 GitHub 客户端壳层”收敛成单一 review 主流程。

核心规则：

- 默认全屏内容
- 最小化 chrome
- 首页是 `PR inbox deck`
- PR 内是 `segment review deck`
- PR 分诊靠卡片手势
- 正式 review 靠 action dock + overlay

### 当前 Shell

```text
Safe Area Overlay
  -> back pill / progress pill / repo pill / profile orb
Main Canvas
  -> PR deck / segment deck
Thumb Zone
  -> action dock (review only)
Transient Layers
  -> comment overlay / submit overlay
```

### Shell 规则

- 不使用常驻大 header
- 不使用常驻底部 tab bar
- 首页 PR deck 不保留按钮式 fallback
- review 内不保留底部工具栏，主要动作由卡片手势和 overlays 承担

## 四层职责

### UI Layer

负责：

- Expo Router 页面
- `PR deck`
- `segment deck`
- `CommentOverlay`
- `SubmitReviewOverlay`
- 动效和手势反馈

### Review Session Layer

负责：

- `pr-deck / segment-deck / submit-overlay` 状态切换
- 当前 PR 索引
- 当前 segment 索引
- PR peek 状态
- segment 翻面状态
- 段级判断
- 评论草稿和 inline comments

### Domain Services Layer

负责：

- unified diff 解析
- hunk 到 segment 的映射输入构造
- coverage 校验
- GitHub review event 推导

### Data / Provider Layer

负责：

- GitHub API 查询与 mutation
- PR inbox 聚合
- Vercel AI SDK provider
- Moonshot region/baseURL 决策
- health check
- SecureStore / 本地持久化

## 当前核心数据流

```text
usePRInbox()
  -> PR deck
  -> open review
  -> usePullRequest + usePRDiff + usePRComments
  -> parseDiff(diff)
  -> buildSegmentationInput(hunks)
  -> segmentPullRequest(input, llmConfig)
  -> validateCoverage(segments, hunks)
  -> build Review Session
  -> render SegmentDeck
  -> deriveReviewEvent(decisions)
  -> createReview()
```

## 首页与 Review 的明确边界

### 首页 `PR deck`

职责：

- 多来源 PR 分诊
- PR peek
- 进入 review
- Save For Later

交互：

- tap -> `front / peek`
- swipe right -> `Open Review`
- swipe left -> `Save For Later`

首页不负责：

- Accept
- Concern
- Comment
- Submit Review

### `segment review deck`

职责：

- 展示语义分段后的 review card
- 提供正式审查语义
- 录入段评论和行评论
- 聚合成 GitHub review payload

## Parser 与 LLM 的边界

LLM 不是权威 diff 解释器。

在当前架构里：

- parser 负责真实 file / hunk / line 映射
- LLM 只负责把 hunk 组织成语义 segment
- coverage 校验仍在业务层，不交给模型

这条边界不能反过来，否则会出现：

- 评论行号不可靠
- segment 无法证明完整覆盖 PR
- GitHub review payload 不稳定

## Vercel AI SDK 边界

Vercel AI SDK 只属于 provider 适配层。

它负责：

- 选择 provider
- 创建 model 实例
- 发起 structured output 请求
- 返回结构化结果

它不负责：

- 解析 diff
- 校验 coverage
- 生成评论锚点
- 推导最终 review event
- 管理页面状态

## Moonshot 当前架构位置

Moonshot 在当前架构里有两层：

1. 官方 provider 基础能力
2. 本地 wrapper 补足 `kimi-k2.5` 的 native structured outputs

规则：

- `Moonshot + kimi-k2.5` 走原生 `json_schema`
- `thinking: disabled`
- `temperature: 0.6`
- 支持 `China / Global` 区域切换
- health check 与正式 segmentation 复用同一条路径

## 当前状态模型

### Review 页面状态

```ts
type ReviewMode = 'pr-deck' | 'segment-deck' | 'submit-overlay';
type InboxMode = 'front' | 'peek';
```

### 关键本地状态

- 当前 PR index
- 当前 segment index
- 当前 PR 是否 peek
- 哪些 segment 已翻面
- `Save For Later` 的 snoozed PR keys
- 段评论
- 行评论
- 最终 review event

## 当前不属于主路径的架构项

以下内容仍不属于当前主路径：

- provider routing / fallback
- API 成本治理
- 传统 PR detail page 架构
- tabs / top tabs / files page 路由体系
