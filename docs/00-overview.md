# GitMob - 项目总览

## 产品目标

GitMob 是一款面向移动端的 GitHub Pull Request 审查应用。

它的核心目标不是把桌面 PR 页面压缩到手机里，而是把大 PR 的 review 过程重构成一条更适合移动设备的语义审查链路：

- 首页先做 PR 分诊
- 进入 PR 后不直接看整页 diff
- 先由 LLM 按代码语义组织出审查步骤
- 再由人按依赖顺序快速 review
- 最后统一提交 GitHub review

项目服务的核心场景是：

> 在 vibe-coding 时代，PR 越来越大、跨文件跨度越来越强，需要先按代码语义组织 change，再让人高效判断。

## 当前产品形态

当前主流程已经收敛为三个真实页面：

- `login`
- `review`
- `settings`

其中 `review` 页面内部承担三种状态：

- `pr-deck`
- `segment-deck`
- `submit-overlay`

## 当前体验模型

| 阶段 | 用户看到的对象 | 系统职责 |
| --- | --- | --- |
| 登录 | `login` | GitHub Device Flow 登录 |
| PR 分诊 | `PR deck` | 聚合 `review-requested + assigned + authored` |
| PR 预览 | `PR card peek` | 懒加载 PR body、review pulse、CI summary |
| 进入 review | `segment deck` | 拉取 detail + diff，解析 hunk，调用 LLM 分段 |
| 段内审查 | `segment front/back` | 正面看结论与理由，背面看 diff 证据 |
| 评论 | `CommentOverlay` | 录入段评论或行评论 |
| 提交前确认 | `SubmitReviewOverlay` | 汇总本地判断并推导 GitHub review event |
| 最终提交 | GitHub review | 提交 `APPROVE` / `REQUEST_CHANGES` / `COMMENT` |

## 当前 UI / UX 北极星

### 关键词

- 全屏卡片
- 轻 chrome
- 纯手势 PR 分诊
- 语义审查步骤
- Gruvbox 视觉基底
- 代码内容优先
- 单手可操作

### 明确反对的方向

- 传统企业后台感
- 粗重 header
- 常驻 footer tab bar
- GitHub 桌面页面的移动压缩版
- 靠高饱和青春色制造吸引力

## 当前审查模型

### 首页 PR 卡片

首页 PR 卡片只负责分诊，不负责正式 review。

支持动作：

- tap：`front <-> peek`
- swipe right：`Open Review`
- swipe left：`Save For Later`

首页不支持：

- `Accept`
- `Concern`
- `Comment`
- `Submit Review`

### Segment 卡片

进入 PR 后，segment 卡片才承担正式审查语义。

当前 review 语义：

- 右滑：`Accept`
- 左滑：`Concern`
- 上滑：`Comment`
- 顶部 `Summary`：打开提交汇总
- 到最后一张 segment 后自动进入 `SubmitReviewOverlay`

### PR 级提交语义

segment 层的本地判断最终会被聚合成 GitHub PR 级 review event：

- 存在 blocking concern -> `REQUEST_CHANGES`
- 否则存在通过判断 -> `APPROVE`
- 否则 -> `COMMENT`

## 当前 segment 设计

当前 segment 不是按文件切，也不是按原始 diff 顺序切。

实际流程：

1. 先把 unified diff 解析成 file/hunk 结构
2. 再把 hunk 压成给 LLM 的 segmentation input
3. LLM 按代码语义把 hunk 组织成 review steps
4. 输出顺序默认遵循依赖顺序：
   - 入口
   - 协调层
   - 核心逻辑
   - 数据/持久化/集成
   - 支撑性清理
5. 最后做 coverage 校验，确保每个 hunk 恰好出现一次

当前目标不是形式化证明“每个 segment 只做一件事”，而是尽量让每个 segment 对应一个清晰、可命名的代码意图。

## 当前 LLM 路径

- provider 层统一在 `api/llm/providers.ts`
- 支持 OpenAI / Anthropic / Moonshot
- Moonshot 支持 `China / Global` 区域切换
- `Moonshot + kimi-k2.5` 使用原生 `json_schema` 结构化输出
- `kimi-k2.5` 固定使用：
  - `thinking: disabled`
  - `temperature: 0.6`
- 健康检查与正式分段走同一条模型提供方 / model 路径

## 当前质量约束

### 硬约束

- 每个 diff hunk 必须且只能出现在一个 segment 中
- segment coverage 必须达到 100%
- 评论必须准确落在 GitHub diff 上
- GitHub review event 必须由本地决策稳定推导

### 软约束

segment 生成后会记录非阻断质量信号，用于 prompt 调试：

- `possibly-too-broad`
- `possibly-multi-purpose`
- `weak-title`

这些信号当前只用于调试，不阻断 review 流程。

## MVP 当前包含

- GitHub Device Flow 登录
- 多来源 PR inbox
- 纯手势 PR deck
- unified diff 拉取与解析
- 基于 Vercel AI SDK 的 segment 生成
- 语义分段双面卡片
- 行评论与段评论 overlay
- review 提交 overlay
- GitHub review comments 提交
- GitHub review event 提交
- LLM 健康检查
- Moonshot China / Global 切换

## 当前不包含

- 仓库浏览
- issue 管理
- 通知中心主流程
- provider routing / fallback
- 成本治理
- 桌面化 PR detail / files 页面
- Web 专用审查体验优化

## 重点文档

- [01-tech-stack.md](/Users/eric/Documents/Sources/acp/gitmob/docs/01-tech-stack.md)
- [03-architecture.md](/Users/eric/Documents/Sources/acp/gitmob/docs/03-architecture.md)
- [06-api-layer.md](/Users/eric/Documents/Sources/acp/gitmob/docs/06-api-layer.md)
- [08-ui-ux-direction.md](/Users/eric/Documents/Sources/acp/gitmob/docs/08-ui-ux-direction.md)
