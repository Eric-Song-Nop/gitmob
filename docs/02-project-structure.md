# 项目目录结构

## 目标

目录文档必须反映两件事：

- 当前仓库真实结构
- 新的 UI/UX 方向下应该如何继续演进

本项目当前采用 Expo Router 根目录布局，不再使用文档里虚构的 `src/` 结构。

## 当前仓库基线

```text
gitmob/
├── api/
├── app/
├── assets/
├── components/
├── constants/
├── docs/
├── hooks/
├── lib/
├── modules/
├── services/
├── stores/
├── app.json
├── package.json
└── ...
```

## 顶层目录说明

### `app/`

Expo Router 页面和布局。

当前仓库已有：

- `app/_layout.tsx`
- `app/index.tsx`
- `app/login.tsx`
- `app/(tabs)/pulls/...`
- `app/(tabs)/notifications.tsx`
- `app/(tabs)/profile.tsx`

新的 UI/UX 方向下，虽然仍可保留路由分组，但**核心体验不再依赖常驻 tab bar 和 header**。

### `api/`

承载 GitHub 查询和 LLM 薄适配层。

当前已有：

- `client.ts`
- `queries/usePullRequests.ts`
- `queries/usePullRequest.ts`
- `queries/usePRFiles.ts`
- `queries/usePRDiff.ts`
- `queries/usePRComments.ts`
- `types.ts`

建议新增：

- `mutations/useCreateReview.ts`
- `mutations/useCreateReviewComment.ts`
- `llm/providers.ts`
- `llm/segmentPullRequest.ts`
- `llm/types.ts`

### `components/`

承载所有视觉组件。

当前已有：

- `components/pr/*`
- `components/common/*`
- `components/ui/*`

新的 UI/UX 方向下，建议重点新增 `review/` 目录：

- `AmbientCanvas.tsx`
- `UtilityRow.tsx`
- `FloatingProfileOrb.tsx`
- `ReviewDeck.tsx`
- `ReviewCard.tsx`
- `ActionDock.tsx`
- `CodePeekSheet.tsx`
- `CommentComposerSheet.tsx`
- `OutcomeSheet.tsx`

### `hooks/`

封装页面层逻辑。

当前已有：

- `useGitHubAuth.ts`

建议新增：

- `useSegmentation.ts`
- `useReviewSession.ts`
- `useReviewSubmission.ts`
- `useChromeState.ts`

### `services/`

承载领域逻辑，不应夹杂页面层和 provider 层细节。

当前已有：

- `diffParser.ts`

建议新增：

- `segmentation/buildSegmentationInput.ts`
- `segmentation/mergeSegments.ts`
- `segmentation/validateCoverage.ts`
- `review/deriveReviewEvent.ts`
- `review/buildGitHubComments.ts`

### `stores/`

承载客户端状态。

当前已有：

- `authStore.ts`

建议新增：

- `reviewDraftStore.ts`
- `llmConfigStore.ts`
- `uiSessionStore.ts`
- `chromeStore.ts`

### `modules/`

保留为原生扩展实验区。

当前方向下：

- `modules/` 不属于主路径
- tree-sitter 原生模块不进入当前 UI/UX 重写范围

## 推荐目标结构

```text
api/
├── client.ts
├── queries/
│   ├── usePullRequests.ts
│   ├── usePullRequest.ts
│   ├── usePRFiles.ts
│   ├── usePRDiff.ts
│   └── usePRComments.ts
├── mutations/
│   ├── useCreateReview.ts
│   └── useCreateReviewComment.ts
├── llm/
│   ├── providers.ts
│   ├── segmentPullRequest.ts
│   └── types.ts
└── types.ts

app/
├── _layout.tsx
├── index.tsx
├── login.tsx
└── (tabs)/
    ├── _layout.tsx
    ├── pulls/
    │   ├── index.tsx
    │   └── [owner]/[repo]/[number]/
    │       ├── _layout.tsx
    │       ├── index.tsx
    │       ├── files.tsx
    │       └── review.tsx
    ├── notifications.tsx
    └── profile.tsx

components/
├── common/
├── pr/
├── review/
└── ui/

services/
├── diffParser.ts
├── segmentation/
│   ├── buildSegmentationInput.ts
│   ├── mergeSegments.ts
│   └── validateCoverage.ts
└── review/
    ├── buildGitHubComments.ts
    └── deriveReviewEvent.ts
```

## 页面职责建议

### `app/(tabs)/pulls/index.tsx`

职责：

- 展示 PR feed
- 使用 `SpotlightPRCard` 和预览条替代传统密集列表
- 提供进入 PR 详情和 review 的主入口

### `app/(tabs)/pulls/[owner]/[repo]/[number]/index.tsx`

职责：

- 展示 PR 概要
- 展示作者、reviewers、CI 状态、改动规模
- 进入 `Files` 或 `Review`

### `app/(tabs)/pulls/[owner]/[repo]/[number]/files.tsx`

职责：

- 展示文件列表
- 提供非 card-first 模式下的补充浏览入口
- 作为需要按文件回看时的辅助界面

### `app/(tabs)/pulls/[owner]/[repo]/[number]/review.tsx`

职责：

- 拉取 diff
- parse diff
- 触发 segmentation
- 启动 review deck
- 管理 code peek、comment sheet、outcome sheet

## 组件分组建议

### `components/pr/`

偏 PR 浏览和概览：

- `SpotlightPRCard.tsx`
- `QueuePreviewStrip.tsx`
- `PRMetaPills.tsx`
- `PRHeader.tsx`
- `PRListItem.tsx`

### `components/review/`

偏全屏审查体验：

- `AmbientCanvas.tsx`
- `UtilityRow.tsx`
- `FloatingProfileOrb.tsx`
- `ReviewDeck.tsx`
- `ReviewCard.tsx`
- `ActionDock.tsx`
- `CodePeekSheet.tsx`
- `CommentComposerSheet.tsx`
- `OutcomeSheet.tsx`

### `components/ui/`

仍然保留基础 UI 组件，但不再让页面依赖传统 header/footer 组合。

## 路由与视觉壳层的关系

虽然项目仍然可以保留 `(tabs)` 路由组，但 UI 上应遵守以下规则：

- `review.tsx` 中隐藏或弱化 tab shell
- 核心体验使用 floating controls 和 sheets
- 页面切换时优先保留全屏感，而不是把 tab/navigation chrome 强行露出来

## 当前不建议继续扩张的目录

以下方向暂时不应继续扩张：

- `modules/tree-sitter/*`
- 传统命令中心专属目录
- 围绕 header/footer 设计的大量导航组件

因为它们不属于这轮主路径。
