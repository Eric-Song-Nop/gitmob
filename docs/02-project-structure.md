# 项目目录结构

## 完整结构

```
gitmob/
├── app.json                          # Expo 配置（scheme: gitmob）
├── package.json
├── tsconfig.json                     # 路径别名 @/* → ./src/*
├── tailwind.config.ts                # Tailwind CSS 配置（NativeWind）
├── global.css                        # Tailwind 指令 + CSS 变量（主题色）
├── babel.config.js
├── metro.config.js                   # 配置 assetExts 支持 .scm 文件 + NativeWind
├── CLAUDE.md                         # AI 辅助开发指令
│
├── src/
│   ├── app/                          # expo-router 文件路由
│   ├── components/                   # UI 组件
│   ├── lib/                          # 工具函数
│   ├── hooks/                        # 自定义 Hooks
│   ├── api/                          # GitHub API 层
│   ├── stores/                       # Zustand 状态管理
│   ├── services/                     # 业务服务
│   ├── constants/                    # 常量定义
│   └── types/                        # TypeScript 类型
│
├── modules/                          # Expo 本地原生模块
│   └── tree-sitter/                  # tree-sitter 原生模块
│
├── assets/                           # 静态资源
│   ├── fonts/
│   └── images/
│
└── docs/                             # 项目文档
```

## 详细说明

### `src/app/` — 路由页面

```
src/app/
├── _layout.tsx                       # 根布局（QueryClientProvider + Zustand 初始化）
├── index.tsx                         # 入口重定向（已登录 → tabs, 未登录 → login）
├── login.tsx                         # GitHub Device Flow 登录页
├── (tabs)/
│   ├── _layout.tsx                   # Tab 导航布局（底部 Tab Bar）
│   ├── pulls/
│   │   ├── index.tsx                 # PR 列表页（review-requested 筛选）
│   │   └── [owner]/[repo]/[number]/
│   │       ├── _layout.tsx           # PR 详情布局（顶部 Tab: Overview / Files）
│   │       ├── index.tsx             # PR 概要页（描述、CI 状态、reviewers）
│   │       ├── files.tsx             # 文件变更列表（Miller Columns 入口）
│   │       └── diff.tsx              # Diff 查看页（?path=xxx 查询参数选择文件）
│   ├── notifications.tsx             # 通知 Tab（MVP 简化版）
│   └── profile.tsx                   # 用户设置 Tab（登出、字体大小等）
└── command-center.tsx                # 命令中心（modal 路由，覆盖在当前页面之上）
```

### `src/components/` — UI 组件

```
src/components/
├── code/                             # 代码渲染核心组件
│   ├── CodeView.tsx                  # 高层代码视图（FlatList 虚拟化渲染）
│   ├── DiffView.tsx                  # Diff 视图（高亮+折叠+评论集成）
│   ├── DiffHunk.tsx                  # 单个 Diff Hunk 渲染
│   ├── CodeLine.tsx                  # 单行代码渲染（token 拼接着色）
│   ├── FoldingGutter.tsx             # 折叠控制区（展开/收起按钮）
│   ├── LineNumbers.tsx               # 行号组件
│   └── SyntaxToken.tsx               # 语法 Token 渲染（单个着色片段）
│
├── explorer/                         # 文件浏览组件
│   ├── MillerColumns.tsx             # Finder 风格水平滚动列导航
│   ├── MillerColumn.tsx              # 单列渲染（目录下的文件/子目录列表）
│   └── FileTreeItem.tsx              # 文件/文件夹项（含变更类型 badge）
│
├── pr/                               # PR 相关组件
│   ├── PRListItem.tsx                # PR 列表项（标题、作者、状态标签）
│   ├── PRHeader.tsx                  # PR 头部信息（PR 标题、分支、描述摘要）
│   ├── ReviewActions.tsx             # 审查操作按钮（Approve / Request Changes）
│   ├── CommentThread.tsx             # 评论线程（嵌套回复）
│   ├── CommentInput.tsx              # 评论输入框
│   └── ReviewSummary.tsx             # 审查摘要（待提交评论数、操作确认）
│
├── command/                          # 命令中心组件
│   ├── CommandCenter.tsx             # 命令中心面板（@gorhom/bottom-sheet）
│   ├── CommandItem.tsx               # 命令项（图标 + 标题 + 快捷键提示）
│   └── CommandSearch.tsx             # 命令搜索框（模糊匹配过滤）
│
├── outline/                          # 符号大纲组件
│   ├── SymbolOutline.tsx             # 符号大纲面板（可滑出）
│   └── SymbolItem.tsx                # 大纲项（函数/类/方法，缩进层级）
│
├── ui/                               # React Native Reusables 基础组件（copy-paste）
│   ├── avatar.tsx                    # 头像（@rn-primitives/avatar）
│   ├── badge.tsx                     # 徽章
│   ├── button.tsx                    # 按钮（多 variant: default/destructive/outline/ghost）
│   ├── card.tsx                      # 卡片容器
│   ├── dialog.tsx                    # 对话框（@rn-primitives/dialog）
│   ├── input.tsx                     # 文本输入框
│   ├── label.tsx                     # 标签（@rn-primitives/label）
│   ├── separator.tsx                 # 分割线（@rn-primitives/separator）
│   ├── skeleton.tsx                  # 骨架屏
│   ├── tabs.tsx                      # 标签页（@rn-primitives/tabs）
│   ├── text.tsx                      # 文本（统一排版样式）
│   ├── textarea.tsx                  # 多行文本输入
│   └── tooltip.tsx                   # 工具提示（@rn-primitives/tooltip）
│
└── common/                           # 业务通用组件（基于 ui/ 组合）
    ├── StatusBadge.tsx               # 状态 Badge（变更类型、review 状态等）
    └── LoadingState.tsx              # 加载状态（骨架屏 / Spinner）
```

### `src/lib/` — 工具函数

```
src/lib/
├── utils.ts                          # cn() 工具函数（clsx + tailwind-merge）
└── icons.ts                          # lucide-react-native 图标统一导出
```

### `src/hooks/` — 自定义 Hooks

```
src/hooks/
├── useTreeSitter.ts                  # tree-sitter 解析入口 Hook
├── useSyntaxHighlight.ts             # 语法高亮 Hook（调用 tree-sitter highlight）
├── useCodeFolding.ts                 # 代码折叠 Hook（折叠范围计算 + 状态管理）
├── useSymbolOutline.ts               # 符号大纲 Hook（AST → 符号树）
├── useDiffParser.ts                  # Diff 解析 Hook（unified diff → 结构化数据）
├── useGitHubAuth.ts                  # GitHub 认证 Hook（@octokit/auth-oauth-device 封装）
└── useCommandCenter.ts               # 命令中心 Hook（命令注册 + 搜索 + 执行）
```

### `src/api/` — GitHub API 层

```
src/api/
├── client.ts                         # Octokit 统一实例（REST + GraphQL，从 authStore 读 token）
├── queries/                          # TanStack Query hooks（读操作）
│   ├── usePullRequests.ts            # GraphQL: review-requested PR 列表
│   ├── usePullRequest.ts             # GraphQL: PR 详情
│   ├── usePRFiles.ts                 # REST: GET /pulls/{n}/files
│   ├── usePRDiff.ts                  # REST: Accept:diff 获取 unified diff
│   ├── usePRReviews.ts               # REST: PR Review 列表
│   ├── usePRComments.ts              # GraphQL: reviewThreads 评论线程
│   └── useFileContent.ts             # REST: /contents/{path}?ref={sha}
├── mutations/                        # TanStack Query mutations（写操作）
│   ├── useCreateReview.ts            # 创建 Review（批量提交评论 + 操作）
│   ├── useCreateComment.ts           # 创建行内评论
│   └── useSubmitReview.ts            # 提交 Review（APPROVE / REQUEST_CHANGES）
└── types.ts                          # API 响应/请求类型定义
```

### `src/stores/` — Zustand 状态

```
src/stores/
├── authStore.ts                      # 认证状态：token, user, isAuthenticated
├── codeViewStore.ts                  # 代码视图状态：foldedLines, fontSize, diffMode
├── reviewStore.ts                    # 审查状态：pendingComments[], draftBody
└── commandStore.ts                   # 命令中心状态：isOpen, recentCommands
```

### `src/services/` — 业务服务

```
src/services/
├── treeSitter.ts                     # tree-sitter JS 服务层（parser 生命周期管理）
├── diffParser.ts                     # Unified Diff 解析器（字符串 → DiffFile[]）
├── highlightTheme.ts                 # capture name → 颜色映射（One Dark 等主题）
└── languageRegistry.ts               # 文件扩展名 → 语言 ID 映射
```

### `src/constants/` — 常量

```
src/constants/
├── colors.ts                         # 语法高亮颜色表（tree-sitter 专用，不走 Tailwind）
└── languages.ts                      # 支持的语言列表及元数据
```

### `src/types/` — TypeScript 类型

```
src/types/
├── diff.ts                           # Diff 相关类型（DiffFile, DiffHunk, DiffLine）
├── treeSitter.ts                     # tree-sitter 相关类型
├── github.ts                         # GitHub API 相关类型
└── navigation.ts                     # 导航参数类型
```

### `modules/tree-sitter/` — 原生模块

详见 [04-tree-sitter-module.md](./04-tree-sitter-module.md)

```
modules/tree-sitter/
├── expo-module.config.json           # Expo 模块配置
├── package.json                      # 模块依赖
├── tsconfig.json
├── src/                              # TypeScript API 层
│   ├── index.ts                      # 公共 API 导出
│   ├── TreeSitterModule.ts           # requireNativeModule 桥接
│   ├── types.ts                      # TypeScript 接口定义
│   ├── constants.ts                  # 语言枚举、scope 名称表
│   └── useTreeSitter.ts             # React Hook 封装
├── cpp/                              # 共享 C++ 核心（iOS/Android 共用）
│   ├── CMakeLists.txt
│   ├── TreeSitterCore.h/cpp
│   ├── ParserPool.h/cpp
│   ├── QueryEngine.h/cpp
│   ├── ResultSerializer.h/cpp
│   ├── LanguageRegistry.h/cpp
│   └── IncrementalState.h/cpp
├── vendor/                           # 第三方 C 源码
│   ├── tree-sitter/                  # tree-sitter C 运行时
│   └── grammars/                     # 各语言语法 C 源码（16 种）
├── queries/                          # .scm 查询文件
│   ├── javascript/
│   │   ├── highlights.scm
│   │   ├── folds.scm
│   │   └── locals.scm
│   ├── typescript/...
│   └── ...
├── ios/                              # iOS 原生桥接
│   ├── TreeSitterModule.swift
│   ├── TreeSitterModule.podspec
│   └── bridge/
│       ├── TreeSitterBridge.h
│       └── TreeSitterBridge.mm
└── android/                          # Android 原生桥接
    ├── build.gradle
    ├── src/main/
    │   ├── java/expo/modules/treesitter/
    │   │   └── TreeSitterModule.kt
    │   ├── jni/
    │   │   ├── CMakeLists.txt
    │   │   ├── TreeSitterJNI.cpp
    │   │   └── OnLoad.cpp
    │   └── assets/queries/
    └── proguard-rules.pro
```

### `assets/` — 静态资源

```
assets/
├── fonts/
│   └── FiraCode-Regular.ttf          # 等宽代码字体
└── images/                           # 应用图标、启动画面等
```

## 配置文件说明

| 文件 | 用途 |
|------|------|
| `app.json` | Expo 应用配置，`scheme: "gitmob"` 用于深度链接 |
| `tsconfig.json` | TypeScript 配置，路径别名 `@/*` → `./src/*` |
| `tailwind.config.ts` | Tailwind CSS 配置，定义主题色、间距、字体，供 NativeWind 编译使用 |
| `global.css` | Tailwind 指令（`@tailwind base/components/utilities`）+ CSS 变量定义暗色/亮色主题 |
| `metro.config.js` | Metro 打包配置，添加 `.scm` 到 `assetExts` + `withNativeWind()` 集成 |
| `babel.config.js` | Babel 配置，支持 Reanimated 插件 + NativeWind preset |
