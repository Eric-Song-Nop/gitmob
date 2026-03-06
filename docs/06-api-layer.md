# API 与 LLM 层设计

## 当前主路径

当前 API 层已经围绕移动端 review deck 收敛成四类能力：

- GitHub 数据读取
- PR inbox 聚合
- review 提交
- LLM provider / 分段 / 健康检查

不再保留旧 PR 详情时代的文件列表查询路径，也不再围绕 tabs 页面拆 API。

## 读取层

### `usePullRequests`

职责：

- 分别读取 `review-requested`、`assigned`、`created` 三类 PR
- 作为 `usePRInbox` 的底层来源

说明：

- 页面层不再直接消费单一 filter 结果
- 列表查询要提供首页卡片所需的最小信息：标题、作者、仓库、变更规模、labels、reviews 摘要

### `usePRInbox`

职责：

- 聚合 `review-requested + assigned + authored`
- 按 `review-requested > assigned > authored` 排序
- 对同一 PR 去重
- 结合 `prInboxStore` 过滤本地 snoozed 项

这是首页唯一数据入口。

### `usePullRequest`

职责：

- 在 `peek` 或进入 review 后按需拉取单个 PR 详情
- 提供 body、labels、reviewThreads、statusCheckRollup 等 detail 级信息

### `usePRDiff`

职责：

- 拉取 unified diff 原文
- 交给 `services/diffParser.ts` 解析为 hunk/file 结构

### `usePRComments`

职责：

- 拉取 review threads
- 提供给 segment 背面 diff 视图渲染行间讨论

## 写入层

### `useCreateReview`

职责：

- 将 review deck 内部的最终决策提交到 GitHub
- 统一提交：
  - `APPROVE`
  - `REQUEST_CHANGES`
  - `COMMENT`
- 支持批量 inline comments

说明：

- segment 层面的 `accepted / has-concern / commented / skipped` 只存在于本地 UI 语义
- 真正写回 GitHub 时仍然是 PR 级 review event

## LLM 层

### `providers.ts`

职责：

- 提供 OpenAI / Anthropic / Moonshot 的统一入口
- 统一输出 provider 元信息：
  - `provider`
  - `model`
  - `baseURL`
  - `regionLabel`

Moonshot 特别规则：

- 支持 `China / Global` 区域切换
- `china -> https://api.moonshot.cn/v1`
- `global -> https://api.moonshot.ai/v1`
- `Moonshot + kimi-k2.5` 使用原生 `json_schema` 结构化输出
- 同时固定：
  - `thinking: disabled`
  - `temperature: 0.6`

### `segmentPullRequest.ts`

职责：

- 将解析后的 hunk 输入送给模型做语义分段
- 输出 `SegmentCardModel[]`
- 记录 segmentation 的非阻断质量信号
- 只负责模型调用，不负责 GitHub payload 拼装

当前 prompt 目标：

- 把 PR 组织成语义审查步骤
- 每个 segment 尽量对应一个单一代码意图
- 默认按依赖顺序输出，而不是按文件名或原始 diff 顺序输出

当前顺序规则：

1. 入口与上游触发
2. 协调层 / 状态编排
3. 核心逻辑
4. 数据 / 持久化 / 集成
5. 支撑性清理

当前质量信号：

- `possibly-too-broad`
- `possibly-multi-purpose`
- `weak-title`

要求：

- 大 PR 采用 chunking，但最终必须覆盖所有 hunk
- 结果必须通过 `validateCoverage()`
- 质量信号不阻断生成，只用于调试 prompt 质量

### `checkHealth.ts`

职责：

- 验证当前 provider/model/apiKey/region 是否可用
- 验证结构化输出路径是否真实可用
- 验证当前 provider 能否返回符合 segment 语义的结构化结果
- 返回：
  - provider
  - model
  - baseURL
  - regionLabel
  - latency
  - checkedAt
  - error

要求：

- 健康检查和正式分段必须共用同一条 provider/model 调用链
- 如果健康检查成功而正式分段仍走错路径，视为实现不完整

## 设计边界

### API 层负责

- GitHub query / mutation
- provider 适配
- 健康检查
- diff 原文获取

### API 层不负责

- hunk coverage 校验
- review event 推导逻辑的产品语义解释
- 页面状态机
- segment deck UI 状态

这些逻辑继续留在：

- `services/segmentation/*`
- `services/review/*`
- `stores/*`
- `app/review.tsx`

## 当前文件树

```text
api/
├── client.ts
├── queries/
│   ├── usePullRequests.ts
│   ├── usePRInbox.ts
│   ├── usePullRequest.ts
│   ├── usePRDiff.ts
│   └── usePRComments.ts
├── mutations/
│   └── useCreateReview.ts
├── llm/
│   ├── providers.ts
│   ├── segmentPullRequest.ts
│   ├── checkHealth.ts
│   └── types.ts
└── types.ts
```
