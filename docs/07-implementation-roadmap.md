# 实现路线图

## 重写后的执行原则

这轮路线图新增一个高优先级目标：

> 在不牺牲代码审查可靠性的前提下，把 GitMob 的 UI/UX 从“工具页”重塑成“有 Tinder 感的移动内容流体验”。

因此，路线图不再只关注功能闭环，还要同步推进：

- 视觉方向
- 导航壳层
- 全屏卡片体验
- 无 header/footer 的空间重构

## Phase 0: UI Reset

### 目标

先定义新的移动端体验，不继续在旧 UI 上打补丁。

### 任务

- [ ] 明确新的视觉方向和设计 token
- [ ] 确定 `No Header, No Footer First` 原则
- [ ] 确定 PR feed、review deck、outcome sheet 三个核心屏的空间结构
- [ ] 定义 action dock、top pills、floating orb 的职责
- [ ] 定义动效和触觉反馈规则

### 验收标准

- [ ] 文档层面已明确新的 UI/UX 北极星
- [ ] 所有核心页面都不再依赖传统 header/footer 作为主容器

## Phase 1: Shell 与导航重构

### 目标

把传统页面框架改成 chrome-light shell。

### 任务

- [ ] 移除核心流程中的常驻 header
- [ ] 移除核心流程中的常驻 footer/tab bar
- [ ] 实现安全区浮动 utility row
- [ ] 实现 floating profile orb
- [ ] 实现统一 sheet 容器
- [ ] 设计 route 之间的转场节奏

### 验收标准

- [ ] PR feed 和 review flow 在视觉上接近全屏
- [ ] 导航控制不再挤压主内容区域

## Phase 2: PR Feed 重设计

### 目标

让用户进入应用后看到的是“值得现在处理的对象”，不是传统列表。

### 任务

- [ ] 设计 `PRFeedScreen`
- [ ] 实现 `SpotlightPRCard`
- [ ] 实现 `QueuePreviewStrip`
- [ ] 重写 PR metadata 的层级和信息密度
- [ ] 加入 feed 入场和 hover/press 反馈

### 验收标准

- [ ] 首屏具备明显的个性化和年轻感
- [ ] PR 主卡的信息密度适合一眼判断是否进入 review

## Phase 3: Review Deck 重设计

### 目标

把 segment review 变成真正的 card-first 流程。

### 任务

- [ ] 设计 `ReviewDeckScreen`
- [ ] 实现 `ReviewDeck`
- [ ] 实现 `ReviewCard`
- [ ] 实现 `ActionDock`
- [ ] 实现 `PeekHandle`
- [ ] 调整段级动作的反馈语义
- [ ] 为 `Accept / Concern / Comment / Skip` 加入动作语言和视觉反馈

### 验收标准

- [ ] 当前 segment 始终是屏幕视觉中心
- [ ] 主要动作都在拇指热区完成
- [ ] 用户不会怀念传统 footer 工具栏

## Phase 4: Code Peek 与 Comment Flow

### 目标

在不引入重 chrome 的前提下，完成代码查看和评论。

### 任务

- [ ] 实现 `CodePeekSheet`
- [ ] 实现 `CommentComposerSheet`
- [ ] 定义行评论入口和段评论入口
- [ ] 解决 deck、sheet、scroll 之间的手势冲突
- [ ] 保证评论锚点仍由 parser 精确提供

### 验收标准

- [ ] 打开代码时不会破坏整体卡片节奏
- [ ] 评论输入流程清晰且不挤占主界面

## Phase 5: Outcome 与提交体验

### 目标

让提交 review 的过程有“完成一轮匹配/筛选”的收束感。

### 任务

- [ ] 实现 `OutcomeSheet`
- [ ] 设计大数字统计和情绪标签
- [ ] 预览最终 review event
- [ ] 编辑 summary body
- [ ] 提交 review

### 验收标准

- [ ] Summary 不像传统表单确认页
- [ ] 最终提交有明确收束感和完成感

## Phase 6: 基础能力接入

### 目标

保持现有可靠性要求不变，把 UI 重构和数据能力接上。

### 任务

- [ ] GitHub Device Flow 登录
- [ ] PR 列表与 PR 详情查询
- [ ] unified diff 拉取
- [ ] parseDiff 接入
- [ ] Vercel AI SDK segmentation 接入
- [ ] coverage 校验
- [ ] GitHub review 提交

### 验收标准

- [ ] 新 UI 壳层下的真实审查闭环跑通
- [ ] 每个 hunk 仍保持 100% coverage
- [ ] 评论仍能准确提交到 GitHub diff

## Phase 7: 动效与性能打磨

### 目标

让“青春活力”来自节奏和反馈，而不是过度动画。

### 任务

- [ ] 优化页面切换转场
- [ ] 优化 action dock 反馈动画
- [ ] 优化 card 入场和离场动画
- [ ] 控制大 diff 页面背景动画成本
- [ ] memo 化卡片和列表项
- [ ] 必要时引入更强列表虚拟化策略

### 验收标准

- [ ] 动效增强体验而非拖慢界面
- [ ] 主要列表与 review deck 在常见设备上流畅

## 当前阶段不安排

以下内容仍不属于当前主路径：

- provider routing / fallback
- API 成本治理
- 隐私策略治理
- tree-sitter 原生模块落地
- 桌面网页式 header/footer 方案

## 风险

| 风险 | 影响 | 处理方式 |
| --- | --- | --- |
| 视觉过强导致代码可读性下降 | 审查效率下降 | 代码区保持高对比和低噪音 |
| 去掉 header/footer 后用户迷路 | 认知负担上升 | 用 utility pills、action dock、sheet handle 建立清晰导航线索 |
| 手势过多冲突 | 可用性下降 | 关键操作保留按钮入口，手势只做增强 |
| 动效太多导致卡顿 | 体验变差 | 只动画 transform/opacity，重内容页面降级背景效果 |
| UI 更新后数据链路断裂 | 功能回退 | UI 重构与真实 GitHub 流程并行验证 |

## 关键里程碑

| 里程碑 | 标志 |
| --- | --- |
| M1 | 新的 UI/UX 方向和空间规则写入文档 |
| M2 | 无 header/footer 的 shell 可运行 |
| M3 | PR feed 和 review deck 完成首轮重设计 |
| M4 | code peek / comment / outcome sheet 跑通 |
| M5 | 新 UI 下的 GitHub review 闭环完成 |
