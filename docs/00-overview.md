# GitMob - 项目总览

## 愿景

GitMob 是一款以**代码审查为核心**的 GitHub 移动客户端，通过原生 tree-sitter 实现 VS Code 级别的语法高亮、代码折叠和符号大纲 —— 即使在 Diff 模式下也完整支持。这是与官方 GitHub Mobile 的关键差异化。

## 核心功能

| 功能 | 说明 |
|------|------|
| 全色语法高亮 | 基于 tree-sitter 原生解析，Diff 模式下同样支持 |
| 代码折叠 | Diff 模式下可折叠代码块（函数、类、if 等） |
| 符号大纲 | tree-sitter AST 驱动的函数/类/方法列表，点击跳转 |
| Miller Columns | Finder 风格水平滚动文件浏览器 |
| 命令中心 | 类 VS Code Command Palette 的快速操作面板 |
| PR 审查流程 | 行内评论、Approve、Request Changes 完整支持 |

## MVP 范围

MVP 聚焦 **PR Code Review 核心流程**，不做完整功能集：

```
登录 → PR 列表 → 文件变更列表（Miller Columns）→ Diff 视图（高亮+折叠+outline）→ 评论/审批
```

### MVP 包含

- GitHub Device Flow 登录（零后端）
- review-requested PR 列表
- PR 详情（描述、检查状态、review 状态）
- Miller Columns 文件浏览
- Diff 视图（语法高亮 + 折叠 + 行内评论）
- 符号大纲面板
- Review 提交（Approve / Request Changes + 批量评论）
- 命令中心

### MVP 不包含

- Issue 管理
- 仓库浏览（非 PR 上下文）
- CI/CD 管理
- Notification 推送（Tab 保留，内容简化）
- 多账户支持

## 用户流程图

```
┌─────────┐     ┌──────────┐     ┌────────────────┐
│  Login   │────>│ PR List  │────>│  PR Detail     │
│ (Device  │     │ (review  │     │  (overview)    │
│  Flow)   │     │          │     │                │
└─────────┘     │ requested)│     └───────┬────────┘
                └──────────┘              │
                                          ├─── Files Tab ───> Miller Columns ───> Diff View
                                          │                                         │
                                          │                                    ┌────┴────┐
                                          │                                    │ Syntax  │
                                          │                                    │ Highlight│
                                          │                                    │ + Fold  │
                                          │                                    │ + Outline│
                                          │                                    │ + Comment│
                                          │                                    └────┬────┘
                                          │                                         │
                                          └─── Submit Review <──────────────────────┘
                                                (Approve / Request Changes
                                                 + Batch Comments)
```

## 差异化分析

| 功能 | GitHub Mobile | GitMob |
|------|--------------|--------|
| Diff 语法高亮 | 无 | tree-sitter 原生高亮 |
| 代码折叠 | 无 | AST 驱动折叠 |
| 符号大纲 | 无 | tree-sitter 符号提取 |
| 文件浏览 | 平铺列表 | Miller Columns |
| 快速操作 | 无 | 命令中心 |
| 代码审查 | 基础 | 专业级 |

## 目标用户

- 需要在移动端进行高质量代码审查的开发者
- 通勤/碎片时间处理 PR review 的工程师
- 对代码阅读体验有高要求的技术负责人
