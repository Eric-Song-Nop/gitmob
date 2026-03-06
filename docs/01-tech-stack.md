# 技术栈详解

## 当前核心决策

| 决策点 | 当前选择 | 不再作为主路径的方案 | 选择理由 |
| --- | --- | --- | --- |
| 认证方式 | GitHub Device Flow | OAuth 代理服务器；PAT 手输 | 无需后端，移动端可用 |
| 路由形态 | `login -> review -> settings` | tabs / top-tabs / detail pages | 主流程更清晰，移动端占屏更高 |
| 代码查看 | unified diff parser + RN diff 组件 | 复杂原生代码解析扩展 | 当前重点是可靠 hunk/line 映射 |
| LLM 接入 | Vercel AI SDK + 官方 provider | 自建多 provider client | provider 接口统一，配置层简单 |
| Moonshot 路径 | 官方 provider + 本地 wrapper | beta provider 升级 | 稳定依赖线下即可启用原生 schema |
| 状态管理 | TanStack Query + Zustand | Redux Toolkit；仅 Zustand | 服务端/客户端状态边界清晰 |
| UI 样式 | NativeWind + Reusables | 重型 UI 框架 | 组件源码可控，便于做移动端定制 UX |

## 框架与运行时

| 技术 | 当前版本线 | 用途 |
| --- | --- | --- |
| React Native | 0.83.x | 跨平台移动框架 |
| Expo | SDK 55 | 开发工具链和原生模块集成 |
| TypeScript | 5.9.x | 类型安全 |
| expo-router | 55.x | 文件系统路由 |

## 状态与数据层

| 技术 | 职责 |
| --- | --- |
| TanStack Query | GitHub 数据、PR inbox 来源、detail/diff/comments、segmentation query |
| Zustand | 认证状态、主题、LLM 配置、PR inbox snooze、本地 review 状态 |
| octokit | GitHub REST + GraphQL |
| expo-secure-store | Token 与敏感配置持久化 |

## LLM 与结构化输出

| 技术 | 用途 |
| --- | --- |
| `ai` | Vercel AI SDK Core |
| `@ai-sdk/openai` | OpenAI provider |
| `@ai-sdk/anthropic` | Anthropic provider |
| `@ai-sdk/moonshotai` | Moonshot provider |
| `@ai-sdk/openai-compatible` | Moonshot `kimi-k2.5` 的本地 native structured-output wrapper |
| `zod` | structured output schema |

### Moonshot 当前策略

- 支持 `China / Global` 区域切换
- `china -> https://api.moonshot.cn/v1`
- `global -> https://api.moonshot.ai/v1`
- `Moonshot + kimi-k2.5` 走原生 `json_schema`
- `kimi-k2.5` 固定：
  - `thinking: disabled`
  - `temperature: 0.6`

## UI 与交互

| 技术 | 用途 |
| --- | --- |
| NativeWind v4 | RN Tailwind 风格样式 |
| React Native Reusables | 复制型基础组件基底 |
| `@rn-primitives/*` | 无头 UI primitives |
| `lucide-react-native` | 图标 |
| `react-native-gesture-handler` | PR/segment 卡片手势 |
| `react-native-reanimated` | 卡片位移、翻面和反馈动效 |
| `expo-blur` | overlay 与浮动 chrome 模糊层 |
| `expo-haptics` | 触觉反馈 |
| `expo-font` | 自定义字体加载 |

## 当前保留原则

- 保留与 `review` 主流程直接相关的依赖
- 保留 `expo-router` 所需的基础导航依赖
- 保留 `DiffView` 及 review 背面仍在使用的 diff 组件链路

## 当前已移除的旧路径依赖

| 技术 | 当前状态 |
| --- | --- |
| `@gorhom/bottom-sheet` | 已移除 |
| `@react-navigation/material-top-tabs` | 已移除 |
| `react-native-pager-view` | 已移除 |

## 代码边界

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
