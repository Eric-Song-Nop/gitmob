# 技术栈详解

## 当前核心决策

| 决策点 | 当前选择 | 不再作为主路径的方案 | 选择理由 |
|--------|---------|----------------------|---------|
| 代码查看 | unified diff parser + RN diff 组件 | 复杂原生代码解析扩展 | 当前 review 背面只需要可靠 diff/hunk/line 映射，先保证交付闭环 |
| 认证方式 | GitHub Device Flow（零后端） | OAuth 代理服务器；PAT 手输 | 无需后端，安全，移动端适配好 |
| 状态管理 | TanStack Query + Zustand | Redux Toolkit；仅 Zustand | 服务端/客户端状态分层明确 |
| UI 样式 | NativeWind + React Native Reusables | 重型 UI 框架 | 组件源码可控，便于做非模板化移动体验 |
| LLM 接入 | Vercel AI SDK + 官方 provider 包 | 自建多 provider client | provider 接口统一，配置层简单 |
| Moonshot 路径 | 官方 provider + 本地 wrapper | beta provider 升级 | 稳定依赖线下即可启用原生 structured outputs |

## 当前技术栈

### 框架层

| 技术 | 当前版本线 | 用途 |
|------|-----------|------|
| React Native | 0.83.x | 跨平台移动框架 |
| Expo | SDK 55 | 开发工具链和原生模块集成 |
| TypeScript | 5.9.x | 类型安全 |

### 路由与导航

| 技术 | 用途 |
|------|------|
| expo-router | 文件系统路由 |
| @react-navigation/native | 主题提供层和 expo-router 导航基础设施 |

说明：

- 不再使用 Material Top Tabs 作为主路径
- 当前只有 `index / login / review / settings` 四个主要路由入口

### 状态管理

| 技术 | 职责 |
|------|------|
| TanStack Query | GitHub 数据、PR inbox 来源、PR detail/diff/comments、health check mutation |
| Zustand | 认证状态、主题、LLM 配置、PR inbox snooze、本地 review UI 状态 |

### GitHub API + 认证

| 技术 | 用途 |
|------|------|
| octokit | GitHub REST + GraphQL 统一 SDK |
| @octokit/auth-oauth-device | Device Flow |
| expo-secure-store | Token 与敏感配置持久化 |

### LLM 与结构化输出

| 技术 | 用途 |
|------|------|
| ai | Vercel AI SDK Core |
| @ai-sdk/openai | OpenAI provider |
| @ai-sdk/anthropic | Anthropic provider |
| @ai-sdk/moonshotai | Moonshot provider |
| @ai-sdk/openai-compatible | Moonshot `kimi-k2.5` 的本地 native structured-output wrapper |
| zod | structured output schema |

### Moonshot 当前策略

- 支持 `China / Global` 区域切换
- `china -> https://api.moonshot.cn/v1`
- `global -> https://api.moonshot.ai/v1`
- `Moonshot + kimi-k2.5` 走 native `json_schema`
- 固定参数：
  - `thinking: disabled`
  - `temperature: 0.6`

### UI 与交互

| 技术 | 用途 |
|------|------|
| NativeWind v4 | RN Tailwind 风格样式 |
| React Native Reusables | copy-paste 组件基底 |
| @rn-primitives/* | 无头 UI primitives |
| lucide-react-native | 图标 |
| react-native-gesture-handler | 手势 |
| react-native-reanimated | 卡片与交互动效 |
| expo-blur | 浮层/overlay blur |
| expo-haptics | 触觉反馈 |
| expo-font | 自定义字体加载 |

### 当前不作为主路径的技术

| 技术 | 当前状态 |
|------|---------|
| @gorhom/bottom-sheet | 已移除 |
| @react-navigation/material-top-tabs | 已移除 |
| react-native-pager-view | 已移除 |

## 当前依赖策略

### 保留原则

- 保留与当前 `review` 主流程直接相关的依赖
- 保留 `expo-router` 所需的基础导航依赖
- 保留 `DiffView` 及 review 背面仍在使用的 diff 组件链路

### 删除原则

- 删除旧 PR 详情页时代的零引用组件和依赖
- 删除 tabs/top-tabs/bottom-sheet 相关残留
- 不为了“以后可能用到”保留未接入的主路径依赖

## 当前代码边界

### LLM 层负责

- provider 选择
- model 构造
- region/baseURL 决定
- structured output 调用
- health check

### LLM 层不负责

- unified diff 解析
- hunk coverage 校验
- GitHub review event 推导
- 页面状态机

这些逻辑继续留在：

- `services/diffParser.ts`
- `services/segmentation/*`
- `services/review/*`
- `app/review.tsx`
