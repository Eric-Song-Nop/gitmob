# GitMob Phase 1 TDD: 测试基础设施 + 单元测试

## Context

Phase 1 实现（OAuth + API Client + PR List）已完成，但项目零测试基础设施。需要搭建测试框架并为现有模块补充测试，确保核心逻辑有充分覆盖。遵循 TDD 思路——先写测试用例验证预期行为。

## Step 1: 安装测试依赖

```bash
pnpm add -D jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

- `jest-expo`: Expo 官方 Jest preset，处理 RN 模块转换
- `@testing-library/react-native`: 组件测试
- `@testing-library/jest-native`: 扩展 matchers（toBeOnTheScreen 等）

## Step 2: 配置 Jest

**New**: `jest.config.js`
```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nern)?|@expo(nern)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|@rn-primitives/.*)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

**Modify**: `package.json` — 添加 `"test": "jest"` 和 `"test:watch": "jest --watch"` scripts

## Step 3: Mock 基础设施

**New**: `__mocks__/expo-secure-store.ts`
- 内存 Map 模拟 `getItemAsync`, `setItemAsync`, `deleteItemAsync`

**New**: `__mocks__/expo-clipboard.ts`
- Mock `setStringAsync`

## Step 4: 纯函数测试

### `lib/__tests__/date.test.ts`
测试 `formatRelativeTime()`:
- 不到 60 秒 → 'just now'
- 5 分钟前 → '5m ago'
- 3 小时前 → '3h ago'
- 2 天前 → '2d ago'
- 2 周前 → '2w ago'
- 3 个月前 → '3mo ago'
- 2 年前 → '2y ago'
- 边界值：恰好 60 秒 → '1m ago'

### `api/queries/__tests__/buildSearchQuery.test.ts`
需要先 **export** `buildSearchQuery` 函数（当前是 module-private）。

**Modify**: `api/queries/usePullRequests.ts` — 导出 `buildSearchQuery`

测试用例：
- `review-requested` → `'is:pr is:open review-requested:@me'`
- `assigned` → `'is:pr is:open assignee:@me'`
- `created` → `'is:pr is:open author:@me'`

## Step 5: Store 测试

### `stores/__tests__/authStore.test.ts`
测试 `useAuthStore`（Zustand store 可直接测试 getState/setState）:
- 初始状态：token=null, isAuthenticated=false
- `setToken('abc')` → isAuthenticated=true, token='abc'
- `logout()` → token=null, user=null, isAuthenticated=false
- `fetchUser()` 成功时设置 user（mock Octokit）
- `fetchUser()` 失败时清除认证状态
- `fetchUser()` 无 token 时直接返回

## Step 6: API Client 测试

### `api/__tests__/client.test.ts`
测试 `getOctokit()`:
- 无 token 时抛出 `'Not authenticated'`
- 有 token 时返回 Octokit 实例
- 多次调用返回同一实例（单例）
- token 变更后实例重置

## Step 7: 组件测试

### `components/common/__tests__/StatusBadge.test.tsx`
- `isDraft=true` → 渲染 "Draft" 文本
- `state='OPEN'` → 渲染 "Open"
- `state='CLOSED'` → 渲染 "Closed"
- `state='MERGED'` → 渲染 "Merged"
- `isDraft` 优先级高于 state

### `components/common/__tests__/LoadingState.test.tsx`
- 默认 mode='skeleton' 渲染 5 个骨架元素
- `count=3` 渲染 3 个
- `mode='spinner'` 渲染 ActivityIndicator

### `components/pr/__tests__/PRListItem.test.tsx`
- 渲染 PR 标题、仓库名、作者名
- 渲染 additions/deletions 统计
- 有标签时渲染标签列表
- 无标签时不渲染标签区域
- 无头像时显示 fallback 字母

## 文件清单

| Action | Path | Description |
|--------|------|-------------|
| New | `jest.config.js` | Jest 配置 |
| Modify | `package.json` | 添加 test scripts |
| New | `__mocks__/expo-secure-store.ts` | SecureStore mock |
| New | `__mocks__/expo-clipboard.ts` | Clipboard mock |
| Modify | `api/queries/usePullRequests.ts` | 导出 buildSearchQuery |
| New | `lib/__tests__/date.test.ts` | formatRelativeTime 测试 |
| New | `api/queries/__tests__/buildSearchQuery.test.ts` | 查询构建测试 |
| New | `stores/__tests__/authStore.test.ts` | Auth store 测试 |
| New | `api/__tests__/client.test.ts` | API client 测试 |
| New | `components/common/__tests__/StatusBadge.test.tsx` | StatusBadge 测试 |
| New | `components/common/__tests__/LoadingState.test.tsx` | LoadingState 测试 |
| New | `components/pr/__tests__/PRListItem.test.tsx` | PRListItem 测试 |

## Verification

```bash
pnpm test          # 所有测试通过
pnpm test --coverage  # 查看覆盖率
```

预期：所有测试绿色通过，核心业务逻辑（date、buildSearchQuery、authStore、client）100% 覆盖。

## Notes

- 不为 `useGitHubAuth` 写测试——涉及 Device Flow 外部交互，mock 成本高、收益低，后续可在集成测试覆盖
- 不为路由页面（app/）写单元测试——页面集成逻辑留给 E2E
- `buildSearchQuery` 需要从 module-private 改为 exported，这是唯一的生产代码变更
