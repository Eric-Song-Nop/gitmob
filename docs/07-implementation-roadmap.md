# 实现路线图

## 总览

10 周分阶段实施计划，按依赖关系排列。前 3 周聚焦 tree-sitter 原生模块（技术风险最高），中间 4 周构建核心功能，最后 3 周打磨和优化。

```
W1 ──> W2 ──> W3 ──> W4 ──> W5 ──> W6 ──> W7 ──> W8 ──> W9 ──> W10
 │      │      │      │      │      │      │      │      │       │
 │      │      │      │      │      │      │      │      │       └── Beta
 │      │      │      │      │      │      │      │      └── 性能优化
 │      │      │      │      │      │      │      └── Review + 命令中心
 │      │      │      │      │      │      └── Miller Columns + 大纲
 │      │      │      │      │      └── DiffView 完整实现
 │      │      │      │      └── CodeView + CodeLine
 │      │      │      └── OAuth + API + PR 列表
 │      │      └── Android JNI 桥接
 │      └── C++ 核心 + iOS 桥接
 └── 项目初始化 + tree-sitter 集成验证
```

## 依赖关系图

```
W1 (初始化)
 └──> W2 (C++ + iOS)
       └──> W3 (Android)
             └──> W5 (CodeView) ──> W6 (DiffView) ──> W7 (Miller + Outline)
                                                         └──> W8 (Review)
       W4 (OAuth + API) ──────────> W5
                                      └──> W9 (优化) ──> W10 (Beta)
```

## 详细计划

---

### Week 1：项目初始化 + tree-sitter 验证

**目标**：验证 tree-sitter C 源码能在 iOS/Android 上编译运行。

#### 任务清单

- [ ] 创建 Expo 项目（`npx create-expo-app gitmob`）
- [ ] 配置 TypeScript、路径别名 `@/*`
- [ ] 配置 NativeWind v4（`tailwind.config.ts` + `global.css` + Metro/Babel 集成）
- [ ] 安装 React Native Reusables 基础依赖（`clsx` + `tailwind-merge` + `class-variance-authority` + `lucide-react-native`）
- [ ] 创建 `src/lib/utils.ts`（`cn()` 工具函数）
- [ ] 创建 `src/components/ui/` 目录，copy 首批基础组件（Button, Text, Card, Badge）
- [ ] 创建 `modules/tree-sitter/` 目录结构
- [ ] 下载 tree-sitter C 运行时源码到 `vendor/tree-sitter/`
- [ ] 下载首批语法包（JavaScript、TypeScript、JSON）到 `vendor/grammars/`
- [ ] 编写最小 `CMakeLists.txt` 编译 tree-sitter + 语法
- [ ] 编写最小 `TreeSitterModule.podspec`
- [ ] 在 iOS Simulator 上验证 `ts_parser_new()` 调用成功
- [ ] 在 Android Emulator 上验证 `ts_parser_new()` 调用成功

#### 验收标准

- NativeWind 样式在 iOS/Android 上正常渲染（含 `dark:` 暗色模式）
- React Native Reusables 基础组件（Button, Text, Card）能正常使用
- 在 iOS/Android 上成功调用 `ts_parser_new()` 并返回非空指针
- 能加载 JavaScript 语法（`tree_sitter_javascript()`）

#### 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| C 源码编译失败 | 阻塞核心功能 | 参考 android-tree-sitter 项目配置 |
| CMake 交叉编译问题 | 编译错误 | 使用 NDK 提供的工具链文件 |

---

### Week 2：共享 C++ 核心层 + iOS 桥接

**目标**：在 iOS 上完成端到端：JS 调用 → Swift → Obj-C++ → C++ Core → tree-sitter → 返回高亮 token。

#### 任务清单

- [ ] 实现 `LanguageRegistry`（注册内置语言）
- [ ] 实现 `ParserPool`（线程安全 parser 复用）
- [ ] 实现 `QueryEngine`（加载 .scm 文件、编译查询、执行高亮）
- [ ] 实现 `ResultSerializer`（二进制序列化）
- [ ] 实现 `TreeSitterCore`（主编排层）
- [ ] 编写 JavaScript highlights.scm 查询文件
- [ ] 编写 `TreeSitterBridge.mm`（Obj-C++ 桥接）
- [ ] 编写 `TreeSitterModule.swift`（Expo Module DSL）
- [ ] 编写 TypeScript API 层 + 反序列化
- [ ] 端到端验证：JS 传入 JS 代码 → 返回高亮 token 数组

#### 验收标准

- iOS Simulator 上，传入 JavaScript 代码字符串，返回正确的高亮 token 列表
- 1000 行文件处理时间 < 50ms

---

### Week 3：Android JNI 桥接 + 查询文件完善

**目标**：Android 达到与 iOS 相同的功能水平，并完善查询文件。

#### 任务清单

- [ ] 编写 `TreeSitterJNI.cpp`（JNI 桥接）
- [ ] 编写 `TreeSitterBridge.kt`（Kotlin JNI 声明）
- [ ] 编写 `TreeSitterModule.kt`（Expo Module DSL）
- [ ] 配置 Android `build.gradle` + `CMakeLists.txt`
- [ ] 配置 .scm 文件打包（Android assets）
- [ ] 端到端验证：与 iOS 相同的 API 调用，跨平台一致
- [ ] 编写剩余语言的 highlights.scm（TypeScript、Python、Go 等）
- [ ] 编写 folds.scm 和 outline.scm 查询文件
- [ ] 实现 `useTreeSitter` React Hook

#### 验收标准

- Android Emulator 上跨平台验证通过
- 至少 5 种语言的高亮 + 折叠 + 大纲查询正常工作

---

### Week 4：Device Flow 认证 + API 客户端 + PR 列表页

**目标**：用户能通过 GitHub Device Flow 登录并看到自己的 review-requested PR 列表。

#### 任务清单

- [ ] 注册 GitHub OAuth App（仅需 client_id，无需 client_secret 部署）
- [ ] 配置 `octokit` + `@octokit/auth-oauth-device`
- [ ] 实现 `useGitHubAuth` Hook（基于 `createOAuthDeviceAuth` 插件）
- [ ] 创建登录页 (`login.tsx`)（显示 user_code + 打开浏览器 + 等待授权）
- [ ] 实现 `authStore`（token + user 持久化）
- [ ] 实现 Octokit 统一客户端 (`client.ts`)
- [ ] 实现 `usePullRequests` Hook（GraphQL 查询）
- [ ] 创建 PR 列表页 (`pulls/index.tsx`)
- [ ] 创建 `PRListItem` 组件
- [ ] 配置 expo-router 布局文件

#### 验收标准

- 用户能通过 Device Flow 登录 GitHub（输入验证码 → 浏览器授权 → 自动获取 token）
- 登录后能看到 review-requested PR 列表，显示标题、作者、标签、review 状态
- Token 持久化存储，重启不需要重新登录

---

### Week 5：CodeView + CodeLine + Diff 解析

**目标**：能渲染带语法高亮的代码，支持折叠。

#### 任务清单

- [ ] 实现 `SyntaxToken` 组件
- [ ] 实现 `CodeLine` 组件（token 拼接渲染）
- [ ] 实现 `FoldingGutter` 组件
- [ ] 实现 `LineNumbers` 组件
- [ ] 实现 `CodeView` 组件（FlatList 虚拟化）
- [ ] 实现 `useSyntaxHighlight` Hook
- [ ] 实现 `useCodeFolding` Hook
- [ ] 实现 `diffParser.ts`（unified diff 解析器）
- [ ] 实现 `highlightTheme.ts`（颜色映射）
- [ ] Pinch-to-zoom 字体缩放

#### 验收标准

- 能渲染 1000+ 行代码文件，带完整语法高亮
- 代码折叠正常工作（函数、类、if 块等）
- 滚动流畅（60fps）
- Pinch-to-zoom 缩放响应流畅

---

### Week 6：DiffView 完整实现

**目标**：Diff 视图具备完整语法高亮、折叠、行内评论。

#### 任务清单

- [ ] 实现 `DiffHunk` 组件
- [ ] 实现 `DiffView` 组件（集成 CodeLine）
- [ ] 实现 `useFileContent` Hook（获取旧版/新版完整文件）
- [ ] 实现 `usePRDiff` Hook
- [ ] 实现 diff 行与完整文件高亮结果的映射逻辑
- [ ] 实现 `CommentThread` 组件
- [ ] 实现 `CommentInput` 组件
- [ ] 实现行间评论显示（在代码行之间插入评论区域）
- [ ] 长按代码行 → 添加评论交互
- [ ] 创建 Diff 页面 (`diff.tsx`)

#### 验收标准

- Diff 行有完整语法高亮（基于完整文件 AST）
- 新增行绿色背景、删除行红色背景
- 代码折叠在 diff 模式下正常工作
- 行间评论正确显示，能添加新评论

---

### Week 7：Miller Columns + 符号大纲

**目标**：文件浏览器和符号大纲面板完成。

#### 任务清单

- [ ] 实现 `buildFileTree()`（扁平文件列表 → 树结构）
- [ ] 实现 `FileTreeItem` 组件
- [ ] 实现 `MillerColumn` 组件
- [ ] 实现 `MillerColumns` 组件（水平滚动 + 滑入动画）
- [ ] 实现 `usePRFiles` Hook
- [ ] 创建文件列表页 (`files.tsx`)
- [ ] 实现 `SymbolItem` 组件
- [ ] 实现 `SymbolOutline` 组件（可滑出面板）
- [ ] 实现 `useSymbolOutline` Hook
- [ ] MillerColumns 选择文件 → 导航到 Diff 页面

#### 验收标准

- Miller Columns 文件树导航正常，支持多级展开
- 每个文件项显示变更类型 badge（A/M/D/R）
- 目录显示子级变更文件数量统计
- 选择文件导航到 Diff 页面
- 符号大纲正确显示函数/类/方法层级
- 点击大纲项跳转到对应代码行

---

### Week 8：Review 流程 + 命令中心

**目标**：完整的代码审查提交流程和命令中心。

#### 任务清单

- [ ] 实现 `reviewStore`（暂存评论管理）
- [ ] 实现 `ReviewActions` 组件
- [ ] 实现 `ReviewSummary` 组件（提交前确认）
- [ ] 实现 `useCreateReview` mutation
- [ ] 实现 `useCreateComment` mutation
- [ ] 实现 `CommandSearch` 组件
- [ ] 实现 `CommandItem` 组件
- [ ] 实现 `CommandCenter` 组件（BottomSheet）
- [ ] 注册所有命令（切换文件、搜索符号、审查操作等）
- [ ] 实现 `useCommandCenter` Hook
- [ ] 创建命令中心路由 (`command-center.tsx`)

#### 验收标准

- 能暂存多条行内评论
- 能提交 Review（Approve / Request Changes + 批量评论）
- 提交后在 GitHub 上可见正确的 Review
- 命令中心能打开/关闭，搜索过滤命令列表
- 命令执行后正确触发对应操作

---

### Week 9：性能优化 + 边缘情况

**目标**：确保性能达标，处理各种边缘情况。

#### 任务清单

- [ ] 1000 行文件端到端高亮性能基准测试
- [ ] FlatList 虚拟化参数调优
- [ ] 大 PR（100+ 文件）文件列表性能优化
- [ ] 内存使用分析（parser/tree 泄漏检查）
- [ ] 网络错误处理（断网、超时、rate limit）
- [ ] 空状态 UI（无 PR、无评论等）
- [ ] 二进制文件处理（跳过高亮）
- [ ] 超大文件处理（>5000 行截断提示）
- [ ] 未知语言处理（无高亮降级）
- [ ] Token 过期 / 撤销处理
- [ ] 深度链接测试

#### 验收标准

- 1000 行文件高亮 < 100ms（端到端，含 JS 反序列化）
- 大 PR 文件列表流畅滚动
- 所有网络错误有合理的用户提示
- 无内存泄漏

---

### Week 10：Bug 修复 + 打磨 + 发布准备

**目标**：端到端全流程可用，准备 TestFlight / Internal Testing。

#### 任务清单

- [ ] 端到端全流程手动测试（登录 → PR 列表 → 文件 → Diff → Review）
- [ ] UI 细节打磨（间距、颜色、动画曲线）
- [ ] 暗色模式支持
- [ ] 应用图标和启动画面
- [ ] 无障碍支持（VoiceOver / TalkBack 基础）
- [ ] 错误上报集成（Sentry 或类似）
- [ ] App Store / Play Store 截图
- [ ] TestFlight 发布
- [ ] Android Internal Testing 发布

#### 验收标准

- 端到端全流程在真机上可用
- 无 crash
- 暗色模式正常
- TestFlight / Internal Testing 发布成功

---

## 风险与缓解措施

| # | 风险 | 影响 | 概率 | 缓解措施 |
|---|------|------|------|---------|
| 1 | tree-sitter C 编译在 iOS/Android 失败 | 阻塞核心功能 | 中 | W1 优先验证；备选：Obj-C wrapper（iOS），参考 android-tree-sitter（Android） |
| 2 | Swift/C modulemap 互操作问题 | 阻塞 iOS | 中 | 使用 Obj-C++ 中间层，不直接 Swift ↔ C |
| 3 | 大文件 Diff 性能 | 用户体验差 | 中 | FlatList 虚拟化 + 分块高亮 + 后台预计算 |
| 4 | GitHub API Rate Limiting | 功能不可用 | 低 | 激进缓存 + ETag + SHA 永久缓存 |
| 5 | Device Flow 用户体验 | 登录略繁琐 | 低 | 自动复制验证码 + 打开浏览器，最小化操作步骤 |
| 6 | .scm 查询文件正确性 | 高亮不完整 | 中 | 复用 nvim-treesitter 社区维护的查询文件 |
| 7 | 语法包体积 | APK/IPA 过大 | 低 | 16 种语言约 2.5-3.5MB，可接受 |
| 8 | Expo SDK 版本不兼容 | 编译失败 | 低 | 锁定 SDK 52，逐步升级 |

## 关键里程碑

| 里程碑 | 周次 | 标志 |
|--------|------|------|
| **tree-sitter 可行性验证** | W1 | iOS/Android 上 ts_parser_new() 成功 |
| **跨平台高亮工作** | W3 | JS 代码在两端都能返回正确高亮 |
| **MVP 可用** | W6 | 登录 → PR → Diff（带高亮）全流程打通 |
| **功能完整** | W8 | Review 提交 + 命令中心 + 符号大纲 |
| **发布就绪** | W10 | TestFlight / Internal Testing |
