# 项目目录结构

## 目标

目录文档只反映当前仓库的真实结构，以及当前已经落地的产品主路径。

当前主流程已经收敛为：

- `login`
- `review`
- `settings`
- 多来源 `PR inbox`
- 纯手势 `PR deck`
- `segment review deck`

不再存在旧的 tabs、PR 详情页、files 页面、notifications/profile 主导航结构。

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

当前真实页面：

- `app/_layout.tsx`
- `app/index.tsx`
- `app/login.tsx`
- `app/review.tsx`
- `app/settings.tsx`

职责：

- `index.tsx`：认证后的路由分发
- `login.tsx`：GitHub 登录
- `review.tsx`：PR inbox + review deck 主流程
- `settings.tsx`：主题、LLM、GitHub 账号设置

### `api/`

承载 GitHub 查询、review mutation 和 LLM 薄适配层。

当前主路径：

- `client.ts`
- `queries/usePullRequests.ts`
- `queries/usePRInbox.ts`
- `queries/usePullRequest.ts`
- `queries/usePRDiff.ts`
- `queries/usePRComments.ts`
- `mutations/useCreateReview.ts`
- `llm/providers.ts`
- `llm/segmentPullRequest.ts`
- `llm/checkHealth.ts`
- `llm/types.ts`
- `types.ts`

说明：

- 不再保留 `usePRFiles.ts`
- 首页统一走 `usePRInbox.ts`，不再由页面自己拼多来源逻辑
- Moonshot 配置和 health check 都从 `llm/providers.ts` 的统一 metadata 获取真实 baseURL/region

### `components/`

承载视觉组件。

当前结构：

- `components/review/*`：主流程 UI
- `components/pr/*`：review 背面 diff 相关组件
- `components/common/*`：基础状态组件
- `components/ui/*`：通用设计系统组件

当前 review 主路径组件：

- `AmbientCanvas.tsx`
- `FloatingProfileOrb.tsx`
- `PRDeck.tsx`
- `PRReviewCard.tsx`
- `SegmentDeck.tsx`
- `SegmentReviewCard.tsx`
- `CardFrontSummary.tsx`
- `CardBackDiff.tsx`
- `ActionDock.tsx`
- `CommentOverlay.tsx`
- `SubmitReviewOverlay.tsx`
- `ProgressPill.tsx`
- `RepoPill.tsx`

说明：

- 旧的 `PRHeader.tsx`、`PRListItem.tsx`、`CIChecks.tsx`、`ReviewerList.tsx` 已删除
- `DiffView.tsx`、`DiffLine.tsx`、`CommentThread.tsx` 继续保留，因为 segment review 背面仍在使用

### `hooks/`

当前主要保留：

- `useGitHubAuth.ts`

### `services/`

承载领域逻辑。

当前主路径：

- `diffParser.ts`
- `segmentation/buildSegmentationInput.ts`
- `segmentation/validateCoverage.ts`
- `review/deriveReviewEvent.ts`

说明：

- diff 解析、coverage 校验、review event 推导都保留在业务层
- provider 适配和模型能力判断不进入 `services/`

### `stores/`

承载客户端状态。

当前主路径：

- `authStore.ts`
- `preferencesStore.ts`
- `llmConfigStore.ts`
- `prInboxStore.ts`

说明：

- `llmConfigStore.ts` 保存 provider/model/apiKey/region 和 health check 结果
- `prInboxStore.ts` 负责本地 snooze 状态

### `modules/`

原生扩展实验区。

当前不属于主路径，tree-sitter 相关设计仍属于后续探索，不影响当前 review 流。

## 推荐理解方式

当前仓库应按下面这条产品链路来理解，而不是旧的 GitHub 页面镜像结构：

```text
login -> review (PR inbox deck) -> segment review deck -> submit overlay -> settings
```

如果新代码不服务这条链路，就应该先怀疑它是不是旧时代残留。
