# UI 组件设计

## 样式方案：NativeWind + React Native Reusables

### 基本原则

采用 **NativeWind v4**（Tailwind CSS for RN）+ **React Native Reusables**（shadcn/ui for RN）组合：

- **NativeWind**：编译时将 Tailwind class 转换为原生 StyleSheet，零运行时开销
- **React Native Reusables**：copy-paste 组件源码到 `src/components/ui/`，完全可控
- **@rn-primitives**：底层无头 UI 原语（Radix UI 移植），提供无障碍行为
- **lucide-react-native**：配套图标库

### cn() 工具函数

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

所有组件使用 `cn()` 合并 class，支持条件样式和外部覆盖：

```typescript
// 使用示例
<Text className={cn(
  'text-sm font-medium',
  isActive && 'text-primary',
  className  // 允许外部覆盖
)} />
```

### 暗色模式

通过 NativeWind 的 `dark:` 前缀实现，配合 `global.css` 中的 CSS 变量：

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    /* ... */
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    /* ... */
  }
}
```

### 组件分层

```
src/components/
├── ui/           ← React Native Reusables 基础组件（Button, Card, Dialog...）
├── common/       ← 业务通用组件（基于 ui/ 组合）
├── code/         ← 代码渲染（自定义，不使用 Reusables）
├── explorer/     ← 文件浏览器（自定义）
├── pr/           ← PR 相关（使用 ui/ 的 Card, Avatar, Badge 等）
├── command/      ← 命令中心
└── outline/      ← 符号大纲
```

> **注意**：`code/` 下的组件（CodeView, CodeLine, SyntaxToken 等）因性能要求极高，直接使用 `StyleSheet` + `React.memo`，不走 NativeWind。其余组件统一使用 NativeWind className 样式。

## 组件总览

```
┌─────────────────────────────────────────────────────────────┐
│                        App Shell                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Page (expo-router)                  │    │
│  │  ┌─────────────┐  ┌──────────────────────────────┐  │    │
│  │  │ MillerColumns│  │ DiffView                     │  │    │
│  │  │  ┌─────────┐│  │  ┌──────────────────────────┐│  │    │
│  │  │  │ Column  ││  │  │ DiffHunk                 ││  │    │
│  │  │  │┌───────┐││  │  │  ┌─────────┬───────────┐ ││  │    │
│  │  │  ││FileItem│││  │  │  │LineNums │ CodeLine  │ ││  │    │
│  │  │  │└───────┘││  │  │  │         │┌─────────┐│ ││  │    │
│  │  │  └─────────┘│  │  │  │         ││SyntaxTkn││ ││  │    │
│  │  └─────────────┘  │  │  │         │└─────────┘│ ││  │    │
│  │                    │  │  └─────────┴───────────┘ ││  │    │
│  │  ┌──────────────┐ │  └──────────────────────────┘│  │    │
│  │  │SymbolOutline │ │                               │  │    │
│  │  │  ┌──────────┐│ │  ┌──────────────────────────┐│  │    │
│  │  │  │SymbolItem││ │  │ CommentThread            ││  │    │
│  │  │  └──────────┘│ │  │  ┌──────────────────────┐││  │    │
│  │  └──────────────┘ │  │  │ CommentInput         │││  │    │
│  │                    │  │  └──────────────────────┘││  │    │
│  │                    │  └──────────────────────────┘│  │    │
│  └────────────────────┴──────────────────────────────┘  │    │
│  ┌─────────────────────────────────────────────────────┐│    │
│  │ CommandCenter (BottomSheet, Modal)                   ││    │
│  │  ┌───────────────────────────────────────────────┐  ││    │
│  │  │ CommandSearch                                  │  ││    │
│  │  ├───────────────────────────────────────────────┤  ││    │
│  │  │ CommandItem   CommandItem   CommandItem        │  ││    │
│  │  └───────────────────────────────────────────────┘  ││    │
│  └─────────────────────────────────────────────────────┘│    │
└─────────────────────────────────────────────────────────────┘
```

## CodeView — 高性能代码渲染

### Props

```typescript
interface CodeViewProps {
  sourceCode: string;               // 完整源代码
  languageId: string;               // 语言标识符 (e.g., "typescript")
  highlights?: HighlightCapture[];  // tree-sitter 高亮结果
  foldingRanges?: FoldingRange[];   // 可折叠范围
  foldedLines?: Set<number>;        // 当前已折叠的行号集合
  onToggleFold?: (startRow: number) => void;  // 折叠/展开回调
  startLineNumber?: number;         // 起始行号（diff 模式下可能不从 1 开始）
  lineDecorations?: Map<number, LineDecoration>;  // 行级装饰（背景色等）
  fontSize?: number;                // 字体大小（默认 14）
  showLineNumbers?: boolean;        // 是否显示行号（默认 true）
}

interface LineDecoration {
  backgroundColor: string;          // 行背景色（如 diff 的红/绿）
  gutterIcon?: string;              // 行号栏图标
}
```

### 实现要点

1. **虚拟化渲染**：使用 `FlatList` 只渲染可见行
   - `windowSize={21}`：预渲染上下 10 屏内容
   - `maxToRenderPerBatch={50}`：每批最多渲染 50 行
   - `getItemLayout`：固定行高，O(1) 位置计算

2. **水平滚动**：外层 `ScrollView horizontal` 包裹 `FlatList`，代码行可水平滚动

3. **折叠逻辑**：
   - 从 `foldingRanges` 计算每行是否可折叠
   - `foldedLines` 集合中的行范围在渲染时跳过
   - 折叠按钮显示在 `FoldingGutter` 中

4. **Pinch-to-zoom**：`react-native-gesture-handler` 的 `PinchGestureHandler` 调整 `fontSize`

5. **高亮 Token 分组**：将 `highlights` 按行号分组，渲染时 O(1) 查找当前行的 token 列表

```typescript
// 核心渲染逻辑伪代码
const visibleLines = useMemo(() => {
  const lines = sourceCode.split('\n');
  return lines.filter((_, index) => !isLineFolded(index, foldedLines, foldingRanges));
}, [sourceCode, foldedLines, foldingRanges]);

const highlightsByLine = useMemo(() => {
  return groupHighlightsByLine(highlights);
}, [highlights]);

const renderItem = useCallback(({ item, index }) => (
  <CodeLine
    line={item.text}
    lineNumber={item.originalLineNumber}
    highlights={highlightsByLine.get(item.originalLineNumber) ?? []}
    decoration={lineDecorations?.get(item.originalLineNumber)}
    foldable={foldableLines.has(item.originalLineNumber)}
    folded={foldedLines?.has(item.originalLineNumber) ?? false}
    onToggleFold={() => onToggleFold?.(item.originalLineNumber)}
  />
), [highlightsByLine, lineDecorations, foldableLines, foldedLines, onToggleFold]);
```

## CodeLine — 单行渲染

### Props

```typescript
interface CodeLineProps {
  line: string;                     // 当前行文本
  lineNumber: number;               // 行号
  highlights: HighlightCapture[];   // 当前行的高亮 token
  decoration?: LineDecoration;      // 行级装饰
  foldable: boolean;                // 是否可折叠
  folded: boolean;                  // 是否已折叠
  onToggleFold: () => void;         // 折叠/展开回调
  fontSize: number;                 // 字体大小
}
```

### 渲染结构

```
┌────────────────────────────────────────────────────────────┐
│ [▼] │  42 │ function calculateSum(items: number[]): number { │
│     │     │  ^keyword  ^function        ^type       ^type   │
└────────────────────────────────────────────────────────────┘
  │      │     └── 代码文本（多个 SyntaxToken 拼接）
  │      └── 行号 (LineNumbers)
  └── 折叠按钮 (FoldingGutter)
```

```typescript
// 渲染伪代码
<View style={[styles.line, decoration && { backgroundColor: decoration.backgroundColor }]}>
  <FoldingGutter foldable={foldable} folded={folded} onToggle={onToggleFold} />
  <Text style={styles.lineNumber}>{lineNumber}</Text>
  <Text style={styles.codeText}>
    {renderTokens(line, highlights)}
  </Text>
</View>

function renderTokens(line: string, highlights: HighlightCapture[]): ReactNode[] {
  // 将 highlights 按 startCol 排序，依次切分行文本
  // 每个 token 渲染为 <Text style={{ color: theme[capture.captureName] }}>{tokenText}</Text>
  // 未被 highlight 覆盖的部分渲染为默认颜色
}
```

### 性能优化

- 使用 `React.memo` 避免不必要的重渲染
- `highlights` 按引用比较（来自 useMemo）
- 行高固定，避免布局抖动

## DiffView — 核心差异化组件

### Props

```typescript
interface DiffViewProps {
  diffFile: DiffFile;               // 解析后的 Diff 文件结构
  oldContent?: string;              // 旧版本完整文件内容（用于语法高亮）
  newContent?: string;              // 新版本完整文件内容（用于语法高亮）
  languageId: string;               // 语言标识符
  comments: ReviewThread[];         // 评论线程列表
  onAddComment: (line: number, side: 'LEFT' | 'RIGHT', body: string) => void;
  mode?: 'unified' | 'split';      // 显示模式（MVP 仅实现 unified）
}

interface DiffFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  oldFilename?: string;             // renamed 时的旧文件名
}

interface DiffHunk {
  header: string;                   // @@ -1,10 +1,12 @@ function name
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'addition' | 'deletion' | 'context';
  content: string;                  // 行内容（不含 +/- 前缀）
  oldLineNumber?: number;           // 旧版行号（deletion/context）
  newLineNumber?: number;           // 新版行号（addition/context）
}
```

### Diff 高亮策略

```
1. 获取 unified diff → 解析为 DiffFile[]
2. 并行获取旧版/新版完整文件内容
3. 分别对旧版和新版做 tree-sitter 解析
4. 渲染时：
   - deletion 行 → 从旧版高亮结果查找 oldLineNumber 对应的 token
   - addition 行 → 从新版高亮结果查找 newLineNumber 对应的 token
   - context 行  → 从新版高亮结果查找 newLineNumber 对应的 token
```

### 行间评论

```
┌────────────────────────────────────────────────────┐
│  42 │ function calculateSum(items) {               │ ← 代码行
├────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐   │ ← 评论区域
│ │ 🧑 @alice 2h ago                            │   │
│ │ This should handle empty arrays              │   │
│ ├──────────────────────────────────────────────┤   │
│ │ 🧑 @bob 1h ago                              │   │
│ │ Good point, I'll add a guard clause          │   │
│ ├──────────────────────────────────────────────┤   │
│ │ [Reply...]                                   │   │ ← CommentInput
│ └──────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────┤
│  43 │   return items.reduce((sum, i) => sum + i)   │ ← 下一行代码
└────────────────────────────────────────────────────┘
```

### 添加评论交互

1. **长按代码行** → 显示操作菜单（"Add Comment"）
2. 选择后展开 `CommentInput` 组件
3. 输入评论文本 → 暂存到 `reviewStore.pendingComments`
4. 最终通过 Review 提交一次性发送所有评论

## MillerColumns — Finder 风格文件浏览器

### Props

```typescript
interface MillerColumnsProps {
  files: PRFile[];                  // PR 变更文件列表
  onFileSelect: (file: PRFile) => void;  // 选择文件回调（导航到 diff 页面）
  selectedPath?: string;            // 当前选中文件路径
}

interface PRFile {
  filename: string;                 // 完整路径 (e.g., "src/components/Button.tsx")
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;                   // 补丁内容
}
```

### 文件树构建

```typescript
interface FileTreeNode {
  name: string;                     // 当前节点名（文件名或目录名）
  path: string;                     // 完整路径
  type: 'file' | 'directory';
  children?: FileTreeNode[];        // 子节点（仅目录）
  file?: PRFile;                    // 原始文件信息（仅文件）
}

function buildFileTree(files: PRFile[]): FileTreeNode {
  // 将扁平的文件列表转换为树结构
  // e.g., ["src/a.ts", "src/b.ts", "lib/c.ts"]
  //   → root
  //     ├── src/
  //     │   ├── a.ts
  //     │   └── b.ts
  //     └── lib/
  //         └── c.ts
}
```

### 渲染结构

```
┌──────────────┬──────────────┬──────────────┐
│ root         │ src/         │ components/  │
│              │              │              │
│ ▸ src/    ⟶  │ ▸ components/│ Button.tsx M │
│ ▸ lib/       │   hooks/     │ Card.tsx   A │
│   README.md  │   App.tsx  M │ Modal.tsx  D │
│              │              │              │
└──────────────┴──────────────┴──────────────┘
       列 1           列 2          列 3

← 水平滚动 ScrollView →
```

### 实现要点

1. **状态追踪**：`activePath: string[]` 记录当前展开路径
   ```typescript
   // 例: activePath = ['src', 'components']
   // 渲染 3 列: root → src/ → components/
   ```

2. **列渲染**：`ScrollView horizontal` 内包含多个 `FlatList`，每列一个 `FlatList`

3. **滑入动画**：
   ```typescript
   // react-native-reanimated 滑入动画
   const translateX = useSharedValue(COLUMN_WIDTH);
   useEffect(() => {
     translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
   }, []);
   ```

4. **变更类型 Badge**：
   ```
   A = Added   (绿色)
   M = Modified (黄色)
   D = Deleted  (红色)
   R = Renamed  (蓝色)
   ```

5. **目录统计**：每个目录显示其下变更文件总数

## CommandCenter — 命令中心

### 设计

基于 `@gorhom/bottom-sheet` 实现，作为 modal 路由覆盖在当前页面之上。

```typescript
interface CommandCenterProps {
  // 通过 commandStore 管理状态，无需 props
}

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;                     // icon 名称
  category: CommandCategory;
  action: () => void;
  keywords?: string[];              // 搜索关键词
}

type CommandCategory =
  | 'file'       // 切换文件
  | 'symbol'     // 搜索符号
  | 'review'     // 审查操作
  | 'view'       // 视图切换
  | 'navigate'   // 导航
  | 'settings';  // 设置
```

### 命令列表

| 类别 | 命令 | 说明 |
|------|------|------|
| file | Go to File | 在 PR 文件列表中搜索并跳转 |
| symbol | Go to Symbol | 在当前文件的符号大纲中搜索 |
| review | Approve PR | 提交 Approve review |
| review | Request Changes | 提交 Request Changes review |
| review | Submit Review | 提交暂存的 review 评论 |
| view | Toggle Diff Mode | 切换 unified / split 模式 |
| view | Toggle Outline | 显示/隐藏符号大纲 |
| navigate | Jump to Comment | 跳转到下一条评论 |
| settings | Font Size | 调整代码字体大小 |

### 搜索逻辑

```typescript
function filterCommands(query: string, commands: Command[]): Command[] {
  if (!query) return commands;
  const lower = query.toLowerCase();
  return commands.filter(cmd =>
    cmd.title.toLowerCase().includes(lower) ||
    cmd.subtitle?.toLowerCase().includes(lower) ||
    cmd.keywords?.some(k => k.toLowerCase().includes(lower))
  );
}
```

### BottomSheet 配置

```typescript
<BottomSheet
  snapPoints={['50%', '90%']}
  enablePanDownToClose={true}
  backdropComponent={BottomSheetBackdrop}
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
>
  <CommandSearch value={query} onChangeText={setQuery} autoFocus />
  <BottomSheetFlatList
    data={filteredCommands}
    renderItem={({ item }) => <CommandItem command={item} />}
    keyExtractor={item => item.id}
  />
</BottomSheet>
```

## SymbolOutline — 符号大纲

### Props

```typescript
interface SymbolOutlineProps {
  symbols: SymbolInfo[];            // tree-sitter 提取的符号列表
  onSymbolPress: (symbol: SymbolInfo) => void;  // 点击跳转到对应行
  activeSymbol?: SymbolInfo;        // 当前光标所在的符号（高亮显示）
}
```

### 渲染结构

```
┌─────────────────────────────┐
│ OUTLINE                     │
├─────────────────────────────┤
│ 📦 class UserService        │
│   ├── 🔧 constructor()     │
│   ├── 🔵 getUser()         │
│   ├── 🔵 updateUser()      │
│   └── 🔴 deleteUser()      │
│ 📦 class UserValidator      │
│   ├── 🔵 validate()        │
│   └── 🔵 sanitize()        │
│ 🟢 function createUser()   │
│ 🟢 function parseConfig()  │
└─────────────────────────────┘
```

### 符号类型图标

| Kind | 图标 | 颜色 |
|------|------|------|
| class | 📦 | 黄色 |
| function | 🟢 | 绿色 |
| method | 🔵 | 蓝色 |
| variable | 🟣 | 紫色 |
| interface | 🔶 | 橙色 |
| type | 🔷 | 青色 |
| enum | 📋 | 灰色 |

### 实现要点

1. **可滑出面板**：从右侧滑入/滑出，`react-native-reanimated` 驱动
2. **缩进层级**：`depth` 字段控制左侧 padding，`depth * 16px`
3. **当前符号高亮**：根据滚动位置实时计算当前所在的符号，高亮显示
4. **折叠嵌套**：可折叠展开类的方法列表

## PR 审查组件

### PRListItem

```typescript
interface PRListItemProps {
  pr: PullRequest;
  onPress: () => void;
}

// 渲染结构
// ┌──────────────────────────────────────────┐
// │ 🟢 Add user authentication     #123     │
// │ user/repo • @alice • 2 hours ago        │
// │ [bug] [enhancement]    ✅ 2 / ❌ 1       │
// └──────────────────────────────────────────┘
```

### ReviewActions

```typescript
interface ReviewActionsProps {
  pendingCommentCount: number;      // 暂存评论数量
  onApprove: () => void;
  onRequestChanges: () => void;
  onComment: () => void;            // 仅评论不做 approve/reject
}
```

### CommentThread

```typescript
interface CommentThreadProps {
  thread: ReviewThread;
  onReply: (body: string) => void;
  onResolve: () => void;
}

interface ReviewThread {
  id: string;
  path: string;
  line: number;
  side: 'LEFT' | 'RIGHT';
  isResolved: boolean;
  comments: ReviewComment[];
}

interface ReviewComment {
  id: string;
  author: { login: string; avatarUrl: string };
  body: string;
  createdAt: string;
}
```

## UI 基础组件（React Native Reusables）

以下组件从 React Native Reusables copy 到 `src/components/ui/`，按需引入对应的 `@rn-primitives/*` 包：

| 组件 | 底层原语 | 用途 |
|------|---------|------|
| `button.tsx` | — | 按钮（variant: default/destructive/outline/secondary/ghost/link） |
| `card.tsx` | — | 卡片容器（PRListItem、CommentThread 等的外壳） |
| `avatar.tsx` | `@rn-primitives/avatar` | 用户头像（带 fallback） |
| `badge.tsx` | — | 徽章（状态标签） |
| `dialog.tsx` | `@rn-primitives/dialog` | 确认对话框（提交 Review 确认等） |
| `input.tsx` | — | 文本输入框 |
| `textarea.tsx` | — | 多行文本输入（评论输入） |
| `label.tsx` | `@rn-primitives/label` | 表单标签 |
| `tabs.tsx` | `@rn-primitives/tabs` | 标签页切换 |
| `separator.tsx` | `@rn-primitives/separator` | 分割线 |
| `skeleton.tsx` | — | 骨架屏加载占位 |
| `text.tsx` | — | 统一排版（自动适配暗色模式） |
| `tooltip.tsx` | `@rn-primitives/tooltip` | 工具提示 |

### 使用示例

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

// PRListItem 使用 Card + Avatar + Badge 组合
<Card className="mx-4 mb-2">
  <CardHeader className="flex-row items-center gap-3">
    <Avatar alt={pr.author.login} className="h-8 w-8">
      <AvatarImage source={{ uri: pr.author.avatarUrl }} />
      <AvatarFallback><Text>{pr.author.login[0]}</Text></AvatarFallback>
    </Avatar>
    <Text className="flex-1 font-semibold">{pr.title}</Text>
    <Badge variant="outline"><Text>#{pr.number}</Text></Badge>
  </CardHeader>
</Card>
```

## 业务通用组件

### StatusBadge

基于 `ui/badge.tsx` 封装的业务状态徽章：

```typescript
interface StatusBadgeProps {
  type: 'added' | 'modified' | 'deleted' | 'renamed' |
        'approved' | 'changes_requested' | 'pending';
  size?: 'sm' | 'default';
}

// NativeWind class 映射
const BADGE_VARIANTS: Record<string, string> = {
  added: 'bg-green-500/15 text-green-700 dark:text-green-400',
  modified: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  deleted: 'bg-red-500/15 text-red-700 dark:text-red-400',
  renamed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  approved: 'bg-green-500/15 text-green-700 dark:text-green-400',
  changes_requested: 'bg-red-500/15 text-red-700 dark:text-red-400',
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
};
```

### LoadingState

```typescript
interface LoadingStateProps {
  type: 'skeleton' | 'spinner';     // 骨架屏或转圈
  lines?: number;                   // 骨架屏行数
  message?: string;                 // 加载提示文本
}
```

> `skeleton` 模式使用 `ui/skeleton.tsx`，`spinner` 模式使用 `ActivityIndicator`。
