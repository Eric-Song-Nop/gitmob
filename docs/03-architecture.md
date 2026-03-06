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
- 正式 review 靠 segment 卡片手势 + overlays

### 当前 Shell

```text
Safe Area Overlay
  -> back pill / progress pill / repo pill / profile orb / summary pill
Main Canvas
  -> PR deck / segment deck
Transient Layers
  -> comment overlay / submit overlay
```

### Shell 规则

- 不使用常驻大 header
- 不使用常驻底部 tab bar
- 首页 PR deck 不保留按钮式 fallback
- review 内不保留底部工具栏
- `Submit` 不作为常驻底部动作，走顶部入口或流程收束

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
- hunk 到 segment 的输入构造
- coverage 校验
- review event 推导

### Data / Provider Layer

负责：

- GitHub API 查询与 mutation
- PR inbox 聚合
- Vercel AI SDK provider
- Moonshot region/baseURL 决策
- 健康检查
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

## 首页与 Review 的边界

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

交互：

- 右滑 -> `Accept`
- 左滑 -> `Concern`
- 上滑 -> `Comment`
- tap -> `front / back`

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

## 当前 segment 架构

### 输入

模型看到的输入由以下信息构成：

- `prTitle`
- `prBody`
- `filePath`
- `hunkKey`
- `header`
- `additions`
- `deletions`
- `summaryText`

### Prompt 目标

当前 prompt 不再把模型当成“分组器”，而是当成“审查路线规划器”。

要求模型：

- 把 PR 组织成语义审查步骤
- 每个 segment 尽量对应一个单一代码意图
- 允许跨文件 segment，但必须服务同一意图
- 结果按依赖顺序输出，而不是按文件名或原始 diff 顺序输出

### 默认顺序规则

默认顺序目标是：

1. 入口与上游触发点
2. 协调层 / 状态编排
3. 核心逻辑
4. 数据 / 持久化 / 集成
5. 支撑性清理 / 样式 / 重命名

如果依赖关系不清晰，则退回到“最利于审查者建立心智模型”的顺序。

### 输出目标

模型输出的 `SegmentCardModel` 字段语义：

- `title`: 这组改动在系统里做了什么
- `summary`: 这组改动改变了什么行为或职责
- `rationale`: 为什么这些 hunk 属于一起，以及为什么它排在这里
- `risk`: 这组改动作为一个整体的 review 风险
- `refs`: 该 segment 覆盖到的 hunk 引用

### 质量信号

除了 coverage 硬校验，当前还会记录非阻断质量信号：

- `possibly-too-broad`
- `possibly-multi-purpose`
- `weak-title`

这些信号当前只用于调试 prompt 质量，不改变 UI 和 review 流程。

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
2. 本地 wrapper 补足 `kimi-k2.5` 的原生结构化输出

规则：

- `Moonshot + kimi-k2.5` 走原生 `json_schema`
- `thinking: disabled`
- `temperature: 0.6`
- 支持 `China / Global` 区域切换
- 健康检查与正式分段复用同一条路径

## 当前状态模型

```ts
type ReviewMode = 'pr-deck' | 'segment-deck' | 'submit-overlay';
type InboxMode = 'front' | 'peek';
```

关键本地状态：

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
