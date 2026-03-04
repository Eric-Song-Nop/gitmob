# 系统架构

## 整体数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                         │
│                    (expo-router 页面 + 组件)                     │
├──────────────────────────────┬──────────────────────────────────┤
│     TanStack Query           │         Zustand                  │
│     (Server State)           │         (Client State)           │
│                              │                                  │
│  usePullRequests             │  authStore                       │
│  usePullRequest              │    - token: string               │
│  usePRFiles                  │    - user: GitHubUser            │
│  usePRDiff                   │                                  │
│  usePRComments               │  codeViewStore                   │
│  useFileContent              │    - foldedLines: Set<number>    │
│                              │    - fontSize: number            │
│  Cache + Background Refetch  │    - diffMode: 'unified'|'split'│
│  + ETag + Optimistic Update  │                                  │
│                              │  reviewStore                     │
│                              │    - pendingComments: Comment[]  │
│                              │    - draftBody: string           │
│                              │                                  │
│                              │  commandStore                    │
│                              │    - isOpen: boolean             │
│                              │    - recentCommands: Command[]   │
├──────────────────────────────┴──────────────────────────────────┤
│                         API Layer                                │
│               Octokit 统一 SDK (REST + GraphQL)                  │
├─────────────────────────────────────────────────────────────────┤
│                        GitHub API                                │
│                   (REST v3 + GraphQL v4)                         │
└─────────────────────────────────────────────────────────────────┘
```

## 状态管理策略

### Server State（TanStack Query）

管理所有来自 GitHub API 的数据。核心优势：

- **自动缓存**：相同 queryKey 不重复请求
- **后台刷新**：`staleTime` 过期后自动在后台重新获取
- **ETag 条件请求**：减少不必要的数据传输和 API rate limit 消耗
- **乐观更新**：提交评论后立即在 UI 反映，无需等待服务器响应
- **分页**：`useInfiniteQuery` 处理 PR 列表分页加载

### Client State（Zustand）

管理纯客户端 UI 状态，不与服务器同步：

| Store | 状态 | 持久化 |
|-------|------|--------|
| `authStore` | token, user, isAuthenticated | expo-secure-store |
| `codeViewStore` | foldedLines, fontSize, diffMode | AsyncStorage |
| `reviewStore` | pendingComments, draftBody | 内存（会话级） |
| `commandStore` | isOpen, recentCommands | AsyncStorage |

### 状态分离原则

```
是否来自服务器？
├── 是 → TanStack Query（自动缓存 + 刷新）
└── 否 → Zustand（轻量 + 无 Provider）
     ├── 需要跨会话持久化？
     │   ├── 是 → Zustand + persist middleware
     │   └── 否 → 纯内存 Zustand store
     └── 涉及敏感数据？
         ├── 是 → expo-secure-store
         └── 否 → AsyncStorage
```

## 导航架构

### 路由结构（expo-router）

```
/                                     # index.tsx → 重定向
/login                                # 登录页
/(tabs)/                              # Tab 导航容器
  ├── pulls/                          # PR 列表（Tab 1）
  │   └── [owner]/[repo]/[number]/    # PR 详情（嵌套路由）
  │       ├── /                       # PR 概要
  │       ├── files                   # 文件列表（Miller Columns）
  │       └── diff?path=xxx           # Diff 视图
  ├── notifications                   # 通知（Tab 2）
  └── profile                         # 设置（Tab 3）
/command-center                       # 命令中心（Modal 路由）
```

### 导航流图

```
App 启动
    │
    ├── 未登录 ──> /login ──> Device Flow ──> /(tabs)/pulls
    │
    └── 已登录 ──> /(tabs)/pulls
                      │
                      └── 选择 PR ──> /pulls/[owner]/[repo]/[number]
                                        │
                                        ├── Overview Tab（默认）
                                        │
                                        └── Files Tab
                                              │
                                              └── Miller Columns
                                                    │
                                                    └── 选择文件 ──> /diff?path=xxx
                                                                      │
                                                                      ├── 左滑 ──> Symbol Outline
                                                                      │
                                                                      └── 长按行 ──> 添加评论
```

### 深度链接

```
gitmob://pulls                   # PR 列表
gitmob://pulls/{owner}/{repo}/{number}  # PR 详情
```

> Device Flow 不需要 redirect URI，因此无需 `login/callback` 深度链接。

## 认证流程

### GitHub Device Flow（零后端）

GitMob 使用 GitHub Device Flow 进行认证，**无需任何后端服务**。这是 GitHub 官方推荐给 CLI 和移动端应用的认证方式（`gh auth login` 也使用此流程）。

```
┌──────────┐    ┌──────────────────┐    ┌──────────────┐
│  GitMob  │    │  GitHub           │    │  System      │
│  App     │    │  OAuth Server     │    │  Browser     │
└────┬─────┘    └────────┬──────────┘    └──────┬───────┘
     │                    │                      │
     │ POST /login/device/code                   │
     │ { client_id, scope }                      │
     │ ──────────────────>│                      │
     │                    │                      │
     │ { device_code,     │                      │
     │   user_code,       │                      │
     │   verification_uri,│                      │
     │   interval }       │                      │
     │ <──────────────────│                      │
     │                    │                      │
     │ 显示 user_code     │                      │
     │ 打开 verification_uri                     │
     │ ─────────────────────────────────────────>│
     │                    │                      │
     │                    │  用户输入 user_code   │
     │                    │  并授权               │
     │                    │ <────────────────────│
     │                    │                      │
     │ 轮询 POST /login/oauth/access_token      │
     │ { client_id, device_code, grant_type }    │
     │ ──────────────────>│                      │
     │                    │                      │
     │ { access_token }   │                      │
     │ <──────────────────│                      │
     │                    │                      │
     │ expo-secure-store.setItemAsync('token', access_token)
     │                    │                      │
```

### 安全要点

1. **零后端**：Device Flow 不需要 `client_secret`，无需代理服务器
2. **Token 存储**：使用 `expo-secure-store`（iOS Keychain / Android Keystore）
3. **OAuth Scope**：`repo`（仓库读写） + `user`（用户信息）
4. **轮询间隔**：遵守 GitHub 返回的 `interval`（通常 5 秒），避免触发 `slow_down` 错误

### Device Flow 用户体验

```
┌─────────────────────────────────────┐
│          Login to GitHub            │
│                                     │
│  Enter this code on github.com:     │
│                                     │
│      ┌─────────────────────┐        │
│      │    ABCD-1234        │        │
│      └─────────────────────┘        │
│                                     │
│  [Copy Code & Open GitHub]          │
│                                     │
│  Waiting for authorization...  ⏳   │
│                                     │
└─────────────────────────────────────┘
```

用户点击按钮后，系统浏览器打开 `github.com/login/device`，粘贴代码并授权。App 在后台轮询直到获得 token。

## tree-sitter 集成架构

详见 [04-tree-sitter-module.md](./04-tree-sitter-module.md)

```
React Component
    │ useSyntaxHighlight(source, languageId)
    ↓
useTreeSitter Hook
    │ TreeSitterModule.highlight(...)
    ↓
Expo Bridge (requireNativeModule)
    │
    ├── iOS: Swift Module → Obj-C++ Bridge → C++ Core
    │
    └── Android: Kotlin Module → JNI → C++ Core
                                         │
                                    ┌────┴────┐
                                    │ Shared  │
                                    │ C++     │
                                    │ Core    │
                                    └────┬────┘
                                         │
                                    tree-sitter C API
                                         │
                                    Language Grammars
```

## Diff 高亮架构

**关键决策**：Diff 视图的语法高亮基于**完整文件**解析，而非 diff 片段。

```
PR Diff 页面加载
    │
    ├── 1. 获取 unified diff（REST Accept:diff）
    │       → 解析为 DiffFile[]
    │
    ├── 2. 获取旧版完整文件（/contents/{path}?ref={base_sha}）
    │       → tree-sitter 解析 → 旧版高亮结果
    │
    ├── 3. 获取新版完整文件（/contents/{path}?ref={head_sha}）
    │       → tree-sitter 解析 → 新版高亮结果
    │
    └── 4. 渲染 DiffView
            - 删除行：从旧版高亮结果查找对应行的 token
            - 新增行：从新版高亮结果查找对应行的 token
            - 未变行：从新版高亮结果查找
            - 折叠范围：从新版 AST 计算
            - 符号大纲：从新版 AST 提取
```

**优势**：完整文件的 AST 上下文保证高亮质量，不会因 diff 片段缺少上下文而出错。

**缓存优化**：文件内容以 SHA 作为 TanStack Query key，同一 SHA 永不过期（`staleTime: Infinity`），因为内容不可变。
