# 技术栈详解

## 核心决策矩阵

以下四个关键决策在架构设计阶段确定：

| 决策点 | 最终选择 | 淘汰方案 | 选择理由 |
|--------|---------|---------|---------|
| 代码渲染 | Expo Native Module（tree-sitter C） | WebView + Shiki/WASM; 纯 RN + Prism.js | 原生性能最优，不依赖 WebView |
| 认证方式 | GitHub Device Flow（零后端） | OAuth App + 代理服务器; Personal Access Token | 无需后端，安全，GitHub 官方推荐给 CLI/移动端 |
| 状态管理 | TanStack Query + Zustand | 仅 Zustand; Redux Toolkit | 服务端/客户端状态分离，各取所长 |
| UI 样式/组件 | NativeWind + React Native Reusables | Tamagui; Gluestack UI; React Native Paper | 编译时零运行时开销 + shadcn/ui copy-paste 模式，完全可控 |
| MVP 范围 | PR Code Review 核心流程 | 完整功能集 | 聚焦差异化，快速验证 |

## 完整技术栈

### 框架层

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| React Native | 0.76+ | 跨平台移动框架 | 最成熟的跨平台方案，社区生态丰富 |
| Expo | SDK 52+ | 开发工具链 + 原生模块系统 | 开发体验优秀，Expo Modules 支持 C++ 原生模块 |
| TypeScript | 5.x | 类型安全 | 大型项目必备，IDE 支持 |

### 路由与导航

| 技术 | 用途 | 选型理由 | 替代方案 |
|------|------|---------|---------|
| expo-router | 文件系统路由 | 基于文件约定，结构清晰，支持深度链接 | React Navigation（手动配置繁琐） |

### 状态管理

| 技术 | 职责 | 选型理由 | 替代方案 |
|------|------|---------|---------|
| TanStack Query | 服务端状态（API 数据） | 自动缓存、后台刷新、ETag 条件请求、乐观更新 | SWR（功能不如 TanStack Query 完整） |
| Zustand | 客户端状态（UI 状态） | 极简 API，无 Provider 嵌套，TypeScript 友好 | Redux Toolkit（模板代码过多）; Jotai（原子化粒度过细） |

### GitHub API + 认证

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| octokit | GitHub API 统一 SDK（REST + GraphQL + Auth） | GitHub 官方全功能 SDK，内置 REST 方法、GraphQL 客户端、插件系统、类型完整 |
| @octokit/auth-oauth-device | Device Flow 认证插件 | 与 Octokit 原生集成，自动处理设备码请求/轮询/错误，无需手写认证逻辑 |
| expo-secure-store | Token 安全存储 | iOS Keychain / Android Keystore 封装 |

### 原生模块

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| expo-modules-core | 原生模块基础设施 | Expo Module DSL，Swift/Kotlin 声明式 API |
| tree-sitter（C 库） | 代码解析引擎 | 增量解析，毫秒级性能，VS Code 同款 |

### UI 样式与组件

| 技术 | 用途 | 选型理由 | 替代方案 |
|------|------|---------|---------|
| NativeWind v4 | Tailwind CSS for RN | 编译时转换为原生样式，零运行时开销，`dark:` 前缀天然支持暗色模式 | Tamagui（文档差、学习曲线陡）; StyleSheet（手写样式繁琐） |
| React Native Reusables | shadcn/ui for RN（copy-paste 组件库） | 基于 NativeWind + @rn-primitives，组件源码完全可控，无供应商锁定 | Gluestack UI v3（更重）; React Native Paper（Material Design 风格不匹配） |
| @rn-primitives/* | 无头 UI 原语（Radix UI RN 移植） | React Native Reusables 的底层，提供无障碍、可组合的原语组件 | — |
| lucide-react-native | 图标库 | 与 React Native Reusables 配套，SVG 图标，tree-shakable | @expo/vector-icons（风格不统一） |

### UI 交互

| 技术 | 用途 | 选型理由 | 替代方案 |
|------|------|---------|---------|
| react-native-gesture-handler | 手势处理 | Pinch-to-zoom、滑动手势 | RN 内置手势（性能差） |
| react-native-reanimated | 动画引擎 | UI 线程动画，不阻塞 JS | Animated API（性能差） |

### 字体

| 资源 | 用途 | 说明 |
|------|------|------|
| FiraCode-Regular.ttf | 等宽代码字体 | 支持连字，代码阅读体验好 |

### 开发工具

| 工具 | 用途 |
|------|------|
| ESLint | 代码规范 |
| Prettier | 代码格式化 |
| Jest | 单元测试 |

## 依赖版本清单

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-modules-core": "~2.0.0",
    "react-native": "0.76.x",
    "nativewind": "~4.1.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "@tanstack/react-query": "~5.60.0",
    "zustand": "~5.0.0",
    "octokit": "~4.0.0",
    "@octokit/auth-oauth-device": "~7.0.0",
    "class-variance-authority": "~0.7.0",
    "clsx": "~2.1.0",
    "tailwind-merge": "~2.5.0",
    "lucide-react-native": "~0.460.0"
  },
  "devDependencies": {
    "tailwindcss": "~3.4.0"
  }
}
```

> `@rn-primitives/*` 按需安装（随 React Native Reusables 组件 copy 时引入）。
> React Native Reusables 本身不作为 npm 依赖，采用 copy-paste 模式将组件源码放入 `src/components/ui/`。

> 版本号为计划时参考值，实际安装时以最新稳定版为准。
