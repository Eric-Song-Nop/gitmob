# UI 组件设计

## 设计目标

这轮 UI/UX 重写的目标不是“做一个更漂亮的 GitHub Mobile”，而是建立一套属于 GitMob 的、明显带有 Tinder 感的移动审查体验。

它要满足三件事：

- 第一眼就有青春活力
- 主屏内容永远是卡片和代码，而不是导航栏
- 审查动作有情绪和反馈，但不损伤效率

## 审美方向

详细视觉方向见 [08-ui-ux-direction.md](/Users/eric/Documents/Sources/acp/gitmob/docs/08-ui-ux-direction.md)。

这里定义组件层面的执行原则：

- 大弧角卡片
- 温暖高饱和主色 + 冷色点缀
- 半透明浮层
- 大面积留白与轻微叠层
- 明确的赞成 / 疑问 / 评论动作反馈
- 少 chrome，多内容

## 全局布局规则

### 禁止项

- 常驻 header
- 常驻 footer tab bar
- 页面上方大标题 + 下方固定工具栏的双重挤压
- 用分隔线和盒子堆满屏幕

### 允许项

- 安全区内的浮动 pill
- 悬浮 avatar orb
- 半透明 action dock
- 底部 sheet
- 局部胶囊式 meta 信息

## 视觉系统

### 字体建议

- Display: `Bricolage Grotesque`
- Body: `Instrument Sans`
- Code: `JetBrains Mono`

### 色板建议

- `Sunset Coral`：主要情绪色，用于通过、活跃 CTA、高光渐变
- `Tomato Punch`：强调色，用于 concern、风险提示
- `Mint Aqua`：辅助冷色，用于评论、连线、微光
- `Butter Cream`：亮底和柔和文本背景
- `Ink Black`：代码与高对比文本

### 材质建议

- 主卡片使用实体面
- 次级浮层使用 85-92% 不透明玻璃感面板
- 背景使用微弱渐变和颗粒，不用纯色平铺

## 核心页面

### `PRFeedScreen`

这不是传统列表页，而是“待处理对象池”。

#### 结构

```text
PRFeedScreen
  -> AmbientCanvas
  -> UtilityRow
  -> SpotlightPRCard
  -> UpcomingQueueStrip
  -> FloatingProfileOrb
```

#### 说明

- `SpotlightPRCard` 占据主视觉中心
- 剩余 PR 以叠层或横向预览条出现
- 顶部只保留小尺寸 utility chips，不做大标题 header

### `ReviewDeckScreen`

这是产品最核心的页面。

#### 结构

```text
ReviewDeckScreen
  -> AmbientCanvas
  -> ReviewTopPills
  -> ReviewDeck
  -> ActionDock
  -> PeekHandle
  -> CodePeekSheet
  -> CommentComposerSheet
  -> OutcomeSheet
```

#### 说明

- `ReviewDeck` 是主角，占据 70% 以上视觉注意力
- `ActionDock` 位于拇指热区，是主要决策区
- 顶部 pill 只显示必要信息：PR 进度、repo、退出
- 不允许用 header 承担描述性信息堆积

### `ReviewOutcomeSheet`

用于提交前确认。

#### 说明

- 用 sheet，不用独立大页面 header
- 统计信息采用“大数字 + 情绪标签”
- 最终 event 预览要醒目但不吓人

## 核心组件

### `AmbientCanvas`

职责：

- 提供统一背景氛围
- 承载渐变、颗粒、柔和发光
- 不抢文本对比度

### `UtilityRow`

职责：

- 容纳轻量 utility pill
- 替代传统 header 的信息承载

内容建议：

- 当前筛选
- 今日待审数
- repo 切换入口

### `FloatingProfileOrb`

职责：

- 代替 profile tab 或 profile header 入口
- 打开设置、账号、主题、LLM 配置

### `SpotlightPRCard`

职责：

- 展示一条 PR 的核心信息
- 作为进入 review 的主入口

信息优先级：

- 标题
- 作者
- 仓库
- 改动规模
- 风险或紧急度 badge
- 进入 review CTA

### `ReviewDeck`

职责：

- 管理 segment 顺序
- 渲染当前卡和下一张卡的预览层
- 响应主动作和轻手势

建议接口：

```ts
interface ReviewDeckProps {
  segments: Segment[];
  currentIndex: number;
  onAccept: (segmentId: string) => void;
  onConcern: (segmentId: string) => void;
  onComment: (segmentId: string) => void;
  onSkip: (segmentId: string) => void;
  onOpenCode: (segmentId: string) => void;
}
```

### `ReviewCard`

职责：

- 展示单个 segment 的摘要和情绪
- 强化“像一张对象卡片”的感受

建议内容：

- 大标题
- 一段简洁 summary
- 风险 badge
- 文件数量 / hunk 数量
- 一句 rationale
- 一个“peek code”入口

视觉规则：

- 上半区偏情绪和摘要
- 下半区偏信息和操作预告
- 不要像表单卡片一样堆指标

### `ActionDock`

职责：

- 替代 footer 工具栏
- 承担主要拇指区操作

建议按钮：

- `Accept`
- `Concern`
- `Comment`
- `Skip`

布局规则：

- 半透明悬浮
- 居中但贴近拇指热区
- 默认短而宽，不要占满底部整条栏

### `PeekHandle`

职责：

- 提示用户可以上拉查看代码或 summary
- 提供微弱手势引导，不抢主 CTA

### `CodePeekSheet`

职责：

- 展示当前 segment 的精确 diff hunk
- 保留行评论能力

说明：

- 优先用 sheet，不强依赖 3D 翻转
- 如果后续要做翻转，也只作为增强动效，不作为唯一入口

### `CommentComposerSheet`

职责：

- 编辑 segment 级或 line 级评论
- 显示评论锚点上下文
- 保存草稿

### `OutcomeSheet`

职责：

- 展示审查统计
- 预览最终 review event
- 编辑 summary body
- 提交 review

## 动效系统

### 页面进入

- 使用轻量错位上浮和透明度淡入
- 卡片入场应有“被推到前景”的感觉

### 决策反馈

- `Accept`：暖色发光、轻微向右位移、成功触感
- `Concern`：番茄红拉力感、微震
- `Comment`：上提、青绿色边缘光
- `Skip`：弱反馈，避免和主要动作抢戏

### 技术约束

- 只动画 `transform` 和 `opacity`
- 手势驱动动效用 Reanimated
- 大列表或大 diff 页面不要做复杂背景动画

## 手势规则

### 主手势

- 轻扫或按钮完成段级判断
- 点击卡片打开代码
- 上拉 handle 打开 code peek 或 summary
- 点击行号或代码行进入评论

### 避免的冲突

- back 面滚动与上滑评论冲突
- 整卡点击与行评论点击冲突
- 横向甩卡与系统返回冲突

结论：

- 手势是锦上添花，不是唯一入口
- 所有关键操作必须也能通过明确按钮完成

## 组件分组建议

```text
components/
├── common/
├── pr/
│   ├── SpotlightPRCard.tsx
│   ├── QueuePreviewStrip.tsx
│   └── PRMetaPills.tsx
├── review/
│   ├── AmbientCanvas.tsx
│   ├── ReviewDeck.tsx
│   ├── ReviewCard.tsx
│   ├── ActionDock.tsx
│   ├── CodePeekSheet.tsx
│   ├── CommentComposerSheet.tsx
│   ├── OutcomeSheet.tsx
│   ├── UtilityRow.tsx
│   └── FloatingProfileOrb.tsx
└── ui/
```

## 性能策略

### Feed

- 列表型内容用虚拟化
- 卡片组件 `memo`
- 避免在 item 内创建大对象和闭包

### ReviewDeck

- 当前卡和下一张卡预渲染即可
- action dock 独立渲染，避免 deck 频繁重绘
- 大背景动画保持极轻

### CodePeek

- diff 按 hunk 渲染
- 长内容虚拟化
- 评论草稿和 sheet 状态解耦
