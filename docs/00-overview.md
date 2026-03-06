# GitMob - 项目总览

## 产品定位

GitMob 是一款面向移动端的 GitHub Pull Request 审查应用。

它不是把桌面端 PR 页面缩到手机里，而是把审查流程重构成一条更适合移动设备的链路：

- 首页是多来源 `PR inbox`
- PR 入口是全屏 `deck`
- 进入 PR 后是 `segment review deck`
- 代码查看通过卡片背面完成
- 评论和提交通过 overlay 完成

当前产品方向可以概括为：

> **像内容流一样顺手，像代码审查工具一样可靠。**

## 当前 UI / UX 北极星

### 关键词

- Tinder 感的节奏
- 全屏卡片
- 轻 chrome
- 纯手势 PR 分诊
- Gruvbox 视觉基底
- 代码内容优先
- 单手可操作

### 明确反对的方向

- 传统企业后台感
- 粗重 header
- 常驻 footer tab bar
- 桌面网页布局的移动端压缩版
- 高饱和青春色

## 当前视觉方向

详细方案见 [08-ui-ux-direction.md](/Users/eric/Documents/Sources/acp/gitmob/docs/08-ui-ux-direction.md)。

当前确定方向：

- 基底：`Gruvbox`
- 氛围：温暖、克制、复古、终端感
- light：偏纸面、便笺、暖底
- dark：偏木炭、磨砂、代码高对比
- 卡片层次主要靠材质、阴影、明暗，不靠艳色

## 当前核心体验

| 阶段 | 用户看到的对象 | 系统职责 |
| --- | --- | --- |
| PR 分诊 | `PR deck` | 展示 `review-requested + assigned + authored` 的统一 inbox |
| PR 预览 | `PR card back / peek` | 懒加载 PR 摘要、labels、review/CI 概况 |
| 进入 review | `segment deck` | 拉取 detail + diff，解析 hunk，调用 LLM 分段 |
| 段内审查 | `segment front/back` | 正面看摘要和风险，背面看 diff |
| 评论 | `CommentOverlay` | 录入段评论或行评论 |
| 提交前确认 | `SubmitReviewOverlay` | 汇总本地决策并推导最终 GitHub review event |
| 最终提交 | GitHub review | 提交 `APPROVE` / `REQUEST_CHANGES` / `COMMENT` |

## 当前导航模型

GitMob 核心流已经收敛为三个真实页面：

- `login`
- `review`
- `settings`

其中 `review` 页面内部再分三种状态：

- `pr-deck`
- `segment-deck`
- `submit-overlay`

### Chrome 规则

- 不使用常驻大 header
- 不使用常驻底部 tab bar
- 顶部只保留轻量 chrome：
  - back pill
  - progress pill
  - repo pill
  - floating profile orb
- 底部只在 segment review 中显示 `ActionDock`

## 当前审查模型

### 首页 PR 卡片

首页 PR 卡片只负责分诊，不负责正式 review。

支持动作：

- tap：`front <-> peek`
- swipe right：`Open Review`
- swipe left：`Save For Later`

不支持动作：

- `Accept`
- `Concern`
- `Comment`
- `Submit Review`

### Segment 卡片

进入 PR 后，segment 卡片才承担正式审查语义：

- `accepted`
- `has-concern`
- `commented`
- `skipped`

这些本地语义最终会被聚合成 GitHub PR 级 review event：

- blocking concern -> `REQUEST_CHANGES`
- 否则存在通过判断 -> `APPROVE`
- 否则 -> `COMMENT`

## 当前 LLM 路径

- provider 层统一在 `api/llm/providers.ts`
- Moonshot 支持 `China / Global` 区域切换
- `Moonshot + kimi-k2.5` 使用 native `json_schema` structured outputs
- `kimi-k2.5` 固定使用：
  - `thinking: disabled`
  - `temperature: 0.6`
- diff parser 和 coverage 校验仍在业务层，不交给模型

## MVP 范围

### 包含

- GitHub Device Flow 登录
- 多来源 PR inbox
- 纯手势 PR deck
- unified diff 拉取与解析
- 基于 Vercel AI SDK 的 segment 生成
- segment 双面卡片
- 行评论与段评论 overlay
- review 提交 overlay
- GitHub review comments 提交
- GitHub review event 提交
- LLM health check

### 不包含

- 传统 tabs / PR detail / files 页面
- 仓库浏览
- issue 管理
- 通知中心主流程
- provider routing / fallback
- 成本治理
- Web 专用审查体验优化

## 成功标准

### 产品标准

- 首屏不是 GitHub Mobile 的翻版
- 首页 PR 卡片可以纯手势完成分诊
- 进入 review 后 header/footer 不再挤压代码内容
- 单手操作能完成主要判断和提交流程

### 质量标准

- 每个 diff hunk 必须且只能出现在一个 segment 中
- segment coverage 必须达到 100%
- 评论必须准确落在 GitHub diff 上
- health check 与正式 segmentation 走同一条 provider 路径

## 重点文档

- [02-project-structure.md](/Users/eric/Documents/Sources/acp/gitmob/docs/02-project-structure.md)
- [03-architecture.md](/Users/eric/Documents/Sources/acp/gitmob/docs/03-architecture.md)
- [06-api-layer.md](/Users/eric/Documents/Sources/acp/gitmob/docs/06-api-layer.md)
- [08-ui-ux-direction.md](/Users/eric/Documents/Sources/acp/gitmob/docs/08-ui-ux-direction.md)
