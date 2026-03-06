# 实现路线图

## 当前阶段判断

核心产品链路已经完成第一轮落地：

- 登录
- 多来源 PR inbox
- 纯手势 PR deck
- segment review deck
- comment / submit overlay
- Moonshot native structured outputs

当前路线图不再以“从零构建 UI reset”为目标，而是进入第二阶段：

- 收口
- 清理
- 稳定化
- 与当前实现对齐

## Phase 1: 主流程稳定化

### 目标

把已经跑通的 `review` 主流程进一步稳定下来。

### 任务

- [x] `login -> review -> settings` 路由收敛
- [x] 多来源 PR inbox 聚合
- [x] 纯手势 PR deck
- [x] segment 双面卡片
- [x] comment overlay
- [x] submit overlay
- [x] GitHub review 提交
- [x] Moonshot native structured outputs

### 验收标准

- [x] 首页和 review 已不依赖 tabs / top tabs
- [x] 纯手势 PR deck 可工作
- [x] Moonshot China/Global 切换可工作

## Phase 2: 仓库清理

### 目标

删除旧 PR 详情时代遗留的孤立路径和依赖。

### 任务

- [x] 删除 `usePRFiles.ts`
- [x] 删除旧 `PRHeader.tsx`、`PRListItem.tsx` 等零引用组件
- [x] 删除 bottom-sheet / material-top-tabs / pager-view 残留依赖
- [x] 收拢文档到当前真实结构

### 验收标准

- [x] 零引用旧组件已删除
- [x] 依赖树不再保留无效主路径依赖
- [x] 文档不再描述旧 tabs / PR detail / files 页面架构

## Phase 3: 交互与可靠性打磨

### 目标

围绕当前已落地的主路径继续提升使用感和可靠性。

### 任务

- [ ] 优化 PR deck 手势阈值和反馈语义
- [ ] 优化 segment 翻面和 diff 背面阅读体验
- [ ] 强化 health check 错误信息和可诊断性
- [ ] 增强 review 返回 inbox 时的状态恢复体验
- [ ] 继续收窄老路径注释、无效代码和样式残留

### 验收标准

- [ ] PR 分诊和 segment review 的边界更清晰
- [ ] health check 与正式 segmentation 表现一致
- [ ] review 回到 inbox 时状态连贯

## Phase 4: 性能与质量保证

### 目标

确保大 PR 和连续使用时仍然可靠。

### 任务

- [ ] 优化大 diff 下的 segment 背面渲染成本
- [ ] 控制背景和卡片动画成本
- [ ] 继续 memo 化重组件
- [ ] 增强错误态和空状态一致性
- [ ] 为关键业务层补测试覆盖

### 验收标准

- [ ] 大 PR 下 review deck 仍可用
- [ ] 动效不明显拖慢界面
- [ ] 覆盖校验、review event 推导和 Moonshot provider 路径有稳定测试

## 当前不安排

以下内容仍不属于当前主路径：

- provider routing / fallback
- API 成本治理
- 传统 tabs / detail / files 页面体系回归
- 高饱和年轻化视觉回退

## 当前风险

| 风险 | 影响 | 处理方式 |
| --- | --- | --- |
| PR deck 手势误触 | 首页分诊效率下降 | 持续调手势阈值与 peek 触发方式 |
| 大 diff 背面阅读成本高 | review 节奏被打断 | 控制背面渲染范围并优化 diff 组件 |
| Moonshot 原生 schema 行为变化 | structured output 回退 | 依赖 health check 和 provider metadata 及时暴露 |
| 文档再次落后于代码 | 后续决策混乱 | 每轮结构调整后同步刷新核心 docs |

## 关键里程碑

| 里程碑 | 标志 |
| --- | --- |
| M1 | `review` 主流程收敛成 inbox deck + segment deck |
| M2 | Moonshot China/Global + native structured outputs 跑通 |
| M3 | 旧 PR detail 路径和依赖清理完成 |
| M4 | 交互和性能开始围绕当前主路径打磨 |
