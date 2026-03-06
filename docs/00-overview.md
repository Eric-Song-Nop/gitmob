# GitMob - 项目总览

## 产品定位

GitMob 是一款面向移动端的 GitHub Pull Request 审查应用。

它不是把桌面端的 PR 页面压缩到手机里，而是把代码审查重构成一种更像内容流消费的体验：

- 全屏
- 高节奏
- 低导航负担
- 以 segment 为单位快速判断
- 通过卡片、动效、浮层和手势驱动审查流程

当前版本的产品方向可以概括为：

> **像 Tinder 一样有吸引力，像代码审查工具一样可靠。**

## 新的 UI/UX 北极星

### 关键词

- Tinder 感
- 青春活力
- 全屏卡片
- 轻导航 chrome
- 强动效反馈
- 柔和但不幼稚
- 代码内容始终是主角

### 明确反对的方向

- 传统企业后台感
- 粗重 header
- 常驻 footer tab bar
- 大量边框和信息块堆叠
- 桌面网页布局的移动端压缩版

## 核心设计原则

1. **No Header, No Footer First**
   核心审查流程默认不显示持久 header 和 footer。导航、状态和操作通过浮层、胶囊按钮、底部 action dock、peek sheet 承担。

2. **Card-First Review**
   用户看到的不是“页面 + 模块”，而是“一张又一张审查卡片”。每个 segment 都应该像一张可以判断、可以收藏、可以评论的对象。

3. **Chrome-Light, Content-Heavy**
   顶部和底部的系统 chrome 只保留必要信息，且尽量融入安全区。屏幕空间优先给：
   - PR 预览卡
   - segment 内容
   - diff
   - 评论输入

4. **Youthful Energy Without Noise**
   视觉上要有鲜明个性、节奏和张力，但不能为了活力牺牲信息可读性。代码审查不是游戏化皮肤，而是高密度内容上的流畅感和决策感。

5. **One-Hand Friendly**
   主要操作必须在拇指热区完成，尤其是：
   - 下一段
   - 标记通过 / 有疑问
   - 添加评论
   - 打开详情
   - 提交 review

## 视觉方向

详细方案见 [08-ui-ux-direction.md](/Users/eric/Documents/Sources/acp/gitmob/docs/08-ui-ux-direction.md)。

当前确定的方向是：

- 基调：`Sunset Pop x Code Glass`
- 氛围：温暖、流动、轻反光、年轻、干净
- 主色：珊瑚橙、番茄红、青绿色、奶油白、墨黑
- 视觉重心：大卡片、柔和高光、弧角、叠层、模糊浮层、节奏明确的动效

## 核心体验

| 阶段 | 用户看到的对象 | 系统职责 |
| --- | --- | --- |
| PR 选择 | 全屏 PR feed | 展示值得现在处理的 PR 卡片 |
| 预处理 | 进入 review 模式 | 拉取 unified diff，解析成文件和 hunk |
| 智能分段 | review deck | 使用 Vercel AI SDK 调用模型，将 hunk 组织为 segment |
| 段内审查 | segment card | 展示摘要、风险、涉及文件和代码入口 |
| 代码查看 | code peek sheet | 通过底部浮层或全屏展开查看精确 diff |
| 评论编辑 | comment composer sheet | 选择 hunk/line，编辑 review comment 草稿 |
| Review 汇总 | outcome sheet | 将段级判断转换为 PR 级 review event |
| 最终提交 | GitHub review | 提交 `APPROVE` / `REQUEST_CHANGES` / `COMMENT` |

## 新的导航模型

GitMob 的核心流不再依赖传统 header/footer。

### 全局导航规则

- 不使用常驻顶部标题栏作为主要信息容器
- 不使用常驻底部 tab bar 作为主要切换方式
- 使用浮动 avatar orb、progress pill、sheet handle、action dock 替代传统导航框架

### 核心流内的 chrome 组成

- 顶部安全区内：
  - 返回胶囊
  - PR 进度 pill
  - 可选仓库/状态 badge
- 底部拇指区：
  - action dock
  - 评论入口
  - summary 入口
- 辅助信息：
  - 通过上拉或点按展开的 sheet 呈现

## 审查模型

GitMob 中的卡片动作不直接等于 GitHub API 事件。

| 卡片层动作 | 本地语义 | 对最终 review 的影响 |
| --- | --- | --- |
| Glow Right | `accepted` | 增加通过段数 |
| Pull Left | `hasConcern` | 如为阻断性问题，可升级为 `REQUEST_CHANGES` |
| Lift Up | `commented` | 追加 review comments |
| Skip | `skipped` | 不直接影响最终 event |

最终 review event 的推导规则不变：

- 存在 blocking concern -> `REQUEST_CHANGES`
- 否则存在明确通过结论 -> `APPROVE`
- 否则 -> `COMMENT`

## MVP 范围

### 包含

- GitHub Device Flow 登录
- PR feed
- PR 概要页
- unified diff 拉取与解析
- 基于 Vercel AI SDK 的 segment 生成
- 全屏 segment review deck
- code peek sheet
- comment composer sheet
- Review outcome sheet
- GitHub review comments 提交
- GitHub review event 提交

### 不包含

- 常驻底部 tab bar 驱动的主体验
- 传统大 header 信息区
- 仓库浏览
- issue 管理
- 通知中心细化体验
- CI 日志详情
- 本地离线队列
- 网关路由、成本控制、供应商回退
- Web 专用审查体验优化

## 成功标准

### 产品标准

- 用户在首屏就能感知到“这不是 GitHub Mobile 的翻版”
- 从 PR feed 进入 review 的过渡足够丝滑和有节奏
- 审查时 header/footer 不再明显挤压内容空间
- 单手操作时主要动作都在底部热区完成

### 质量标准

- 每个 diff hunk 必须且只能出现在一个 segment 中
- segment coverage 必须达到 100%
- 评论必须准确落在 GitHub diff 上
- 动效只增强反馈，不降低信息可读性

## 重点文档

- [03-architecture.md](/Users/eric/Documents/Sources/acp/gitmob/docs/03-architecture.md)
- [05-components.md](/Users/eric/Documents/Sources/acp/gitmob/docs/05-components.md)
- [07-implementation-roadmap.md](/Users/eric/Documents/Sources/acp/gitmob/docs/07-implementation-roadmap.md)
- [08-ui-ux-direction.md](/Users/eric/Documents/Sources/acp/gitmob/docs/08-ui-ux-direction.md)
