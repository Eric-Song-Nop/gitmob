# UI / UX 方向文档

## 设计命题

GitMob 需要的是一种会让人愿意打开的代码审查体验，但这种吸引力不应该来自高饱和青春色，而应该来自节奏、材质和空间组织。

当前命题是：

> 把代码审查做成一套有卡片节奏、但以 Gruvbox 为视觉基底的移动交互体验。

## 核心判断

### 要保留的卡片感

- 卡片是内容主角
- 当前对象始终处于视觉中心
- 下一步行动非常明确
- 用户有连续处理下去的节奏感

### 不能滑向游戏化的地方

- 不能让爽感压过代码可读性
- 不能为了动效牺牲精度
- 不能把 review 提交做成轻浮的甩卡游戏

## 当前空间策略

### 总原则

- 核心流不用传统 header
- 核心流不用 footer
- 顶部信息变成轻量 pills
- 首页 PR 分诊依赖卡片本身
- review 动作集中在 segment 卡片手势和覆盖层
- 评论和提交不打断主卡片层级

### 屏幕分配

#### PR deck

- 70%：当前 PR 卡
- 15%：下一张卡预览
- 15%：顶部轻 chrome

#### Segment deck

- 70%：当前 segment 卡
- 15%：下一段预览或背面 diff 过渡空间
- 15%：顶部 chrome 与 transient feedback

## 当前视觉语言

### 风格名

`Gruvbox Review Deck`

### 语气

- 温暖
- 克制
- 复古
- 有弹性
- 不像企业后台
- 不依赖高饱和色块

### 色彩原则

- 基底来自 Gruvbox：暖灰、焦糖黄、橄榄绿、砖红、青绿
- light 与 dark 都是正式主题
- 卡片层次靠明暗、纸感、磨砂和阴影
- 代码区保持高对比，不做花哨皮肤

### 字体原则

- Hero / Card Title: `Bricolage Grotesque`
- UI Body: `Instrument Sans`
- Code: `JetBrains Mono`

## 当前交互情绪

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

### Segment Accept

感觉：

- 稳定通过
- 判断清楚
- 不拖泥带水

表现：

- 右滑
- 温暖绿/黄反馈
- 轻触觉

### Segment Concern

感觉：

- 被拉住
- 被提醒
- 明确但不惊吓

表现：

- 左滑
- 砖红反馈
- 更强的阻滞感

### Segment Comment

感觉：

- 从判断切到表达
- 进入更深一层

表现：

- 上滑
- overlay 抬起
- 焦点落到输入区

## 当前页面蓝图

### Review 页面中的 PR deck

视觉特征：

- 主卡居中偏上
- 下一张卡部分露出
- 顶部只有 progress / repo / settings orb
- 卡片本身承担分诊交互

### Review 页面中的 Segment deck

视觉特征：

- 当前 segment 卡片占据注意力中心
- 正面是判断层，背面是证据层
- review 动作由卡片手势承担
- `Summary` 是收束入口，不是常驻主 CTA

## 可用性底线

即使视觉方向更鲜明，也必须满足：

- 代码区域高对比
- 评论锚点稳定
- 关键信息不只靠颜色区分
- 首页 PR 分诊可以纯手势完成
- review 主动作不依赖底部工具栏
- 大 PR 时性能不明显下降

## 当前不再采用的方向

- 高饱和青春色主导
- sheet-first 代码查看模式
- tabs / detail / files 页面体验
- GitHub 桌面页面的移动压缩版
