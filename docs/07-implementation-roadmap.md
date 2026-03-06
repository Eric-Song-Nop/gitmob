# 实现路线图

## 当前阶段判断

核心产品链路已经完成第一轮落地：

- 登录
- 多来源 PR inbox
- 纯手势 PR deck
- segment review deck
- comment / submit overlay
- Moonshot 原生结构化输出
- 语义顺序导向的分段提示词

当前路线图不再以“从零构建 UI reset”为目标，而是进入第二阶段：

- 稳定化
- 质量打磨
- 文档与实现持续对齐

## 已完成

### 主流程

- [x] `login -> review -> settings` 路由收敛
- [x] 多来源 PR inbox 聚合
- [x] 纯手势 PR deck
- [x] segment 双面卡片
- [x] comment overlay
- [x] submit overlay
- [x] GitHub review 提交

### LLM 与 provider

- [x] Moonshot China/Global 切换
- [x] `Moonshot + kimi-k2.5` 原生结构化输出
- [x] 健康检查与正式 provider 路径对齐
- [x] 分段提示词改成“语义审查步骤 + 依赖优先排序”
- [x] 分段质量信号接入调试链路

### 仓库清理

- [x] 删除旧 `PRHeader.tsx`、`PRListItem.tsx` 等零引用组件
- [x] 删除 `usePRFiles.ts`
- [x] 删除 bottom-sheet / material-top-tabs / pager-view 残留依赖
- [x] 文档不再描述旧 tabs / PR detail / files 页面架构

## 下一阶段

### 1. Segment 质量调优

目标：

- 让 segment 更稳定地表现为单一代码意图
- 让排序更稳定地接近依赖顺序

任务：

- [ ] 用真实大 PR 观察质量信号分布
- [ ] 继续迭代提示词的拆分信号与标题约束
- [ ] 评估是否需要在 UI 中暴露部分 segment 调试信息

### 2. Review UX 打磨

目标：

- 提升 segment 背面 diff 的阅读效率
- 让 review 节奏更顺，而不是更炫

任务：

- [ ] 优化 segment 翻面和 diff 背面阅读体验
- [ ] 优化 segment 手势阈值和反馈语义
- [ ] 优化 review 返回 inbox 时的状态恢复体验

### 3. 性能与可靠性

目标：

- 确保大 PR 下仍然可用
- 确保 provider 行为变化能被及时暴露

任务：

- [ ] 优化大 diff 下的 segment 背面渲染成本
- [ ] 继续 memo 化重组件
- [ ] 为 coverage、review event 推导、Moonshot provider 路径补测试

## 当前不安排

以下内容仍不属于当前主路径：

- provider routing / fallback
- API 成本治理
- 传统 tabs / detail / files 页面体系回归
- 高饱和年轻化视觉回退
- 任意自定义 baseURL 的 provider 面板

## 当前风险

| 风险 | 影响 | 当前处理方式 |
| --- | --- | --- |
| PR deck 手势误触 | 首页分诊效率下降 | 持续调手势阈值与 peek 触发方式 |
| segment 过宽或多意图 | review 节奏被打断 | 依赖 quality signals + prompt 迭代 |
| 大 diff 背面阅读成本高 | review 节奏被打断 | 控制背面渲染范围并优化 diff 组件 |
| Moonshot 原生 schema 行为变化 | 结构化输出回退 | 依赖健康检查和 provider 元信息暴露 |
| 文档再次落后于代码 | 后续决策混乱 | 每轮结构调整后同步刷新核心 docs |
