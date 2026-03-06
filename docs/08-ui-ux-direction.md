# UI / UX 方向文档

## 设计命题

GitMob 需要的是一种会让人愿意打开的代码审查体验，但这种吸引力不应该来自高饱和青春色，而应该来自节奏、材质和空间组织。

当前命题是：

> 把代码审查做成一套有 Tinder 感节奏、但以 Gruvbox 为视觉基底的移动交互体验。

## 核心判断

### 我们要像 Tinder 的地方

- 卡片是内容主角
- 当前对象始终处于视觉中心
- 下一步行动非常明确
- 用户有连续处理下去的节奏感

### 我们不能像 Tinder 的地方

- 不能让爽感压过代码可读性
- 不能为了动效牺牲精度
- 不能把 review 提交做成轻浮游戏化动作

## 当前空间策略

### 总原则

- 核心流不用 header
- 核心流不用 footer
- 顶部信息变成轻量 pills
- 首页 PR 分诊依赖卡片本身
- review 操作集中在 action dock
- 评论和提交通过 overlay 进入

### 屏幕分配

#### PR deck

- 70%：当前 PR 卡
- 15%：下一张卡的预览
- 15%：顶部轻 chrome

#### Segment deck

- 70%：当前 segment 卡
- 15%：下一段预览或背面 diff 过渡空间
- 15%：action dock 与 overlay 入口

## 当前视觉语言

### 风格名

`Gruvbox Deck`

### 语气

- 温暖
- 克制
- 复古
- 有弹性
- 不像企业后台
- 不依赖高饱和色块

### 色彩原则

- 基底来自 Gruvbox：暖灰、焦糖黄、橄榄绿、砖红
- light 与 dark 都是正式主题
- 卡片层次靠明暗、纸感、磨砂和阴影
- 代码区保持高对比，不做花哨皮肤

### 字体原则

- Hero / Card Title: `Bricolage Grotesque`
- UI Body: `Instrument Sans`
- Code: `JetBrains Mono`

## 当前组件情绪

### PR 分诊

感觉：

- 顺手
- 轻快
- 不费解释

表现：

- tap 翻面
- right swipe 进入 review
- left swipe 保存稍后
- 不保留底部按钮区

### Accept

感觉：

- 温暖
- 被确认
- 稳定通过

表现：

- 暖黄 / 橄榄绿倾向
- 柔和位移和轻触觉

### Concern

感觉：

- 被拉住
- 被提醒
- 明确但不惊吓

表现：

- 砖红
- 压缩感更强的反馈

### Comment

感觉：

- 进入更深一层
- 从判断切到表达

表现：

- overlay 抬起
- 焦点落到输入区

## 当前页面蓝图

### 1. Review 页面中的 PR deck

视觉特征：

- 主卡居中偏上
- 下一张卡部分露出
- 顶部只有 progress / repo / settings orb
- 卡片本身承担分诊交互

### 2. Review 页面中的 Segment deck

视觉特征：

- 当前 segment 卡片占据注意力中心
- 正面是摘要，背面是 diff
- `ActionDock` 像悬浮控制器，不像 footer

### 3. Submit overlay

视觉特征：

- 是收束层，不是独立页面
- review event、统计和 summary 一眼可读
- CTA 明确但不过度吓人

## 可用性底线

即使视觉方向更鲜明，也必须满足：

- 代码区域高对比
- 评论锚点稳定
- 关键信息不只靠颜色区分
- 首页 PR 分诊可以纯手势完成
- review 主动作仍有按钮入口
- 大 PR 时性能不明显下降

## 当前不再采用的方向

- `Sunset Pop x Code Glass`
- 高饱和青春色主导
- sheet-first 代码查看模式
- tabs / detail / files 页面体验
