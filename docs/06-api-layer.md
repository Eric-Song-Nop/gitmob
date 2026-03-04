# GitHub API 层设计

## 端点选择策略

### REST vs GraphQL 决策

| 数据需求 | 选择 | 端点 | 理由 |
|---------|------|------|------|
| PR 列表 | GraphQL | `search` | 一次请求获取 PR + 作者 + 标签 + review 状态 |
| PR 详情 | GraphQL | `pullRequest` | 描述、review 请求、检查状态关联数据 |
| 文件列表 | REST | `GET /pulls/{n}/files` | GraphQL 不支持文件列表 |
| Diff 内容 | REST | `GET /pulls/{n}` + `Accept: application/vnd.github.diff` | 获取 unified diff 原始字符串 |
| 文件内容 | REST | `GET /repos/{o}/{r}/contents/{path}?ref={sha}` | 获取完整文件用于语法高亮 |
| 评论线程 | GraphQL | `reviewThreads` | 线程结构、嵌套回复 |
| 创建行内评论 | REST | `POST /pulls/{n}/comments` | 简单写操作 |
| 提交 Review | REST | `POST /pulls/{n}/reviews` | 批量提交评论 + 审查决策 |

### 混合策略原则

- **读取关联数据** → GraphQL（减少请求次数）
- **简单读取** → REST（缓存友好，ETag 支持）
- **写操作** → REST（更直观，错误处理简单）

## Octokit 统一客户端

使用 `octokit` 统一包，单实例同时提供 REST 方法和 GraphQL 客户端：

```typescript
// src/api/client.ts
import { Octokit } from 'octokit';
import { useAuthStore } from '@/stores/authStore';

let octokitInstance: Octokit | null = null;

export function getOctokit(): Octokit {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

  if (!octokitInstance) {
    octokitInstance = new Octokit({ auth: token });
  }
  return octokitInstance;
}

// Token 变更时重置实例
useAuthStore.subscribe((state, prev) => {
  if (state.token !== prev.token) {
    octokitInstance = null;
  }
});
```

> **说明**：统一的 `Octokit` 实例同时暴露 `octokit.rest.*`（REST API）和 `octokit.graphql()`（GraphQL），无需维护两个独立实例。

## TanStack Query Hooks

### usePullRequests — PR 列表

```typescript
// src/api/queries/usePullRequests.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';

const PR_LIST_QUERY = `
  query($query: String!, $first: Int!, $after: String) {
    search(query: $query, type: ISSUE, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          number
          title
          state
          createdAt
          updatedAt
          additions
          deletions
          changedFiles
          isDraft
          mergeable
          url
          author {
            login
            avatarUrl
          }
          repository {
            nameWithOwner
            owner { login }
            name
          }
          labels(first: 5) {
            nodes { name color }
          }
          reviewRequests(first: 5) {
            nodes {
              requestedReviewer {
                ... on User { login }
                ... on Team { name }
              }
            }
          }
          reviews(last: 5) {
            nodes {
              state
              author { login }
            }
          }
        }
      }
    }
  }
`;

type PRFilter = 'review-requested' | 'assigned' | 'created';

export function usePullRequests(filter: PRFilter = 'review-requested') {
  const searchQuery = buildSearchQuery(filter);

  return useInfiniteQuery({
    queryKey: ['pulls', filter],
    queryFn: async ({ pageParam }) => {
      const octokit = getOctokit();
      const result = await octokit.graphql(PR_LIST_QUERY, {
        query: searchQuery,
        first: 20,
        after: pageParam ?? null,
      });
      return result.search;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
    staleTime: 1000 * 60 * 2,        // 2 分钟
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

function buildSearchQuery(filter: PRFilter): string {
  const base = 'is:pr is:open';
  switch (filter) {
    case 'review-requested': return `${base} review-requested:@me`;
    case 'assigned':         return `${base} assignee:@me`;
    case 'created':          return `${base} author:@me`;
  }
}
```

### usePullRequest — PR 详情

```typescript
// src/api/queries/usePullRequest.ts
import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';

const PR_DETAIL_QUERY = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        number
        title
        body
        state
        createdAt
        updatedAt
        additions
        deletions
        changedFiles
        isDraft
        mergeable
        baseRefName
        headRefName
        baseRefOid
        headRefOid
        author {
          login
          avatarUrl
        }
        reviewRequests(first: 10) {
          nodes {
            requestedReviewer {
              ... on User { login avatarUrl }
              ... on Team { name }
            }
          }
        }
        reviews(last: 10) {
          nodes {
            state
            body
            submittedAt
            author { login avatarUrl }
          }
        }
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
                contexts(first: 10) {
                  nodes {
                    ... on StatusContext { state context description }
                    ... on CheckRun { name conclusion status }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export function usePullRequest(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pr', owner, repo, number],
    queryFn: async () => {
      const octokit = getOctokit();
      const result = await octokit.graphql(PR_DETAIL_QUERY, { owner, repo, number });
      return result.repository.pullRequest;
    },
    staleTime: 1000 * 60 * 3,        // 3 分钟
  });
}
```

### usePRFiles — 文件列表

```typescript
// src/api/queries/usePRFiles.ts
import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';

export function usePRFiles(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pr-files', owner, repo, number],
    queryFn: async () => {
      const octokit = getOctokit();
      // 处理分页（大 PR 可能有超过 30 个文件）
      const files = await octokit.paginate(
        octokit.pulls.listFiles,
        { owner, repo, pull_number: number, per_page: 100 }
      );
      return files;
    },
    staleTime: 1000 * 60 * 5,        // 5 分钟
  });
}
```

### usePRDiff — Diff 内容

```typescript
// src/api/queries/usePRDiff.ts
import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';

export function usePRDiff(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pr-diff', owner, repo, number],
    queryFn: async () => {
      const octokit = getOctokit();
      const response = await octokit.pulls.get({
        owner, repo, pull_number: number,
        mediaType: { format: 'diff' },
      });
      // response.data 是 unified diff 字符串
      return response.data as unknown as string;
    },
    staleTime: 1000 * 60 * 5,        // 5 分钟
  });
}
```

### useFileContent — 文件内容（用于语法高亮）

```typescript
// src/api/queries/useFileContent.ts
import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';

export function useFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string,  // commit SHA
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['file-content', owner, repo, path, ref],
    queryFn: async () => {
      const octokit = getOctokit();
      const response = await octokit.repos.getContent({
        owner, repo, path, ref,
        mediaType: { format: 'raw' },
      });
      return response.data as unknown as string;
    },
    staleTime: Infinity,              // SHA 唯一确定内容，永不过期
    gcTime: 1000 * 60 * 30,          // 30 分钟后垃圾回收
    enabled,
  });
}
```

### usePRComments — 评论线程

```typescript
// src/api/queries/usePRComments.ts
import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';

const PR_COMMENTS_QUERY = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            isOutdated
            path
            line
            diffSide
            comments(first: 50) {
              nodes {
                id
                body
                createdAt
                author {
                  login
                  avatarUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;

export function usePRComments(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pr-comments', owner, repo, number],
    queryFn: async () => {
      const octokit = getOctokit();
      const result = await octokit.graphql(PR_COMMENTS_QUERY, { owner, repo, number });
      return result.repository.pullRequest.reviewThreads.nodes;
    },
    staleTime: 1000 * 60 * 2,        // 2 分钟
  });
}
```

## Mutations

### useCreateReview — 提交审查

```typescript
// src/api/mutations/useCreateReview.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getOctokit } from '../client';
import { useReviewStore } from '@/stores/reviewStore';

type ReviewEvent = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';

interface CreateReviewParams {
  owner: string;
  repo: string;
  number: number;
  event: ReviewEvent;
  body?: string;
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { pendingComments, clearPendingComments } = useReviewStore();

  return useMutation({
    mutationFn: async ({ owner, repo, number, event, body }: CreateReviewParams) => {
      const octokit = getOctokit();

      return octokit.pulls.createReview({
        owner,
        repo,
        pull_number: number,
        event,
        body: body ?? '',
        comments: pendingComments.map(c => ({
          path: c.path,
          line: c.line,
          side: c.side,
          body: c.body,
        })),
      });
    },
    onSuccess: (_, { owner, repo, number }) => {
      // 清空暂存评论
      clearPendingComments();

      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['pr', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pr-comments', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pulls'] });
    },
  });
}
```

### useCreateComment — 创建单条评论

```typescript
// src/api/mutations/useCreateComment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getOctokit } from '../client';

interface CreateCommentParams {
  owner: string;
  repo: string;
  number: number;
  body: string;
  path: string;
  line: number;
  side: 'LEFT' | 'RIGHT';
  commitId: string;
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCommentParams) => {
      const octokit = getOctokit();
      return octokit.pulls.createReviewComment({
        owner: params.owner,
        repo: params.repo,
        pull_number: params.number,
        body: params.body,
        path: params.path,
        line: params.line,
        side: params.side,
        commit_id: params.commitId,
      });
    },
    onSuccess: (_, { owner, repo, number }) => {
      queryClient.invalidateQueries({ queryKey: ['pr-comments', owner, repo, number] });
    },
  });
}
```

## 缓存策略

### staleTime 配置

| 数据类型 | staleTime | 理由 |
|---------|-----------|------|
| PR 列表 | 2 分钟 | 频繁变化，需要较新数据 |
| PR 详情 | 3 分钟 | 中等变化频率 |
| 文件列表 | 5 分钟 | PR 更新后才变化 |
| Diff 内容 | 5 分钟 | PR 更新后才变化 |
| 文件内容 | Infinity | SHA 唯一确定内容，永不过期 |
| 评论线程 | 2 分钟 | 多人协作场景下需要较新数据 |

### ETag 条件请求

```typescript
// Octokit 内置支持 ETag / If-Modified-Since
// 当服务器返回 304 Not Modified 时，不消耗 API rate limit 配额
// TanStack Query 配合 ETag 可以实现极低成本的后台刷新
```

### 缓存失效策略

```typescript
// 提交 Review 后主动失效相关缓存
queryClient.invalidateQueries({ queryKey: ['pr', owner, repo, number] });
queryClient.invalidateQueries({ queryKey: ['pr-comments', owner, repo, number] });
queryClient.invalidateQueries({ queryKey: ['pulls'] });  // PR 列表状态也变化了

// 切换 PR 时不需要手动失效，queryKey 不同自动隔离
```

### 预取优化

```typescript
// 在 PR 列表页预取即将查看的 PR 详情
function onPRItemVisible(pr: PullRequest) {
  queryClient.prefetchQuery({
    queryKey: ['pr', pr.owner, pr.repo, pr.number],
    queryFn: () => fetchPRDetail(pr.owner, pr.repo, pr.number),
    staleTime: 1000 * 60 * 3,
  });
}
```

## 认证：GitHub Device Flow（Octokit Auth 插件）

### 为什么选择 Device Flow

GitMob 只与 GitHub API 交互，不需要自己的用户系统或后端。Device Flow 是最适合的方案：

- **零后端**：不需要 `client_secret`，不需要代理服务器
- **安全**：token 交换直接在 App 与 GitHub 之间完成
- **GitHub 官方推荐**：CLI/移动端应用的标准认证方式（`gh` CLI 也使用此流程）

### 为什么用 `@octokit/auth-oauth-device` 而非手写

| | 手写 Device Flow | @octokit/auth-oauth-device |
|---|---|---|
| 代码量 | ~80 行自己实现轮询/错误处理 | ~10 行配置 |
| 边缘情况 | 需自己处理 `slow_down`、`expired_token` | 插件内置处理 |
| Octokit 集成 | 手动把 token 注入 Octokit | 原生绑定，统一实例 |
| 维护 | 自己维护 | GitHub 官方维护 |

### useGitHubAuth Hook

认证逻辑完全由 `@octokit/auth-oauth-device` 驱动，无需自定义 `deviceFlow.ts` 服务：

```typescript
// src/hooks/useGitHubAuth.ts
import { useState, useCallback } from 'react';
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { useAuthStore } from '@/stores/authStore';

const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';

type AuthStatus = 'idle' | 'awaiting_code' | 'polling' | 'success' | 'error';

export function useGitHubAuth() {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [error, setError] = useState('');
  const { setToken, fetchUser } = useAuthStore();

  const login = useCallback(async () => {
    try {
      setStatus('awaiting_code');
      setError('');

      const auth = createOAuthDeviceAuth({
        clientType: 'oauth-app',
        clientId: GITHUB_CLIENT_ID,
        scopes: ['repo', 'user'],
        onVerification: (verification) => {
          // 插件回调：收到设备码后更新 UI
          setUserCode(verification.user_code);
          setVerificationUri(verification.verification_uri);
          setStatus('polling');
        },
      });

      // 触发 Device Flow：请求设备码 → 轮询 token（全由插件处理）
      const { token } = await auth({ type: 'oauth' });

      // 保存 token 并获取用户信息
      await setToken(token);
      await fetchUser();
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [setToken, fetchUser]);

  const copyCodeAndOpenBrowser = useCallback(async () => {
    await Clipboard.setStringAsync(userCode);
    await Linking.openURL(verificationUri);
  }, [userCode, verificationUri]);

  return {
    status,
    userCode,
    verificationUri,
    error,
    login,
    copyCodeAndOpenBrowser,
  };
}
```

> **关键简化**：`createOAuthDeviceAuth` 内置处理了整个 Device Flow 生命周期——请求设备码、按 `interval` 轮询、处理 `slow_down` / `expired_token` / `access_denied` 错误——无需手写任何轮询逻辑。

## API Rate Limiting

### GitHub API 限制

| 认证方式 | REST 限制 | GraphQL 限制 |
|---------|----------|-------------|
| OAuth token | 5000 次/小时 | 5000 点/小时 |

### 缓解策略

1. **激进缓存**：`staleTime` 合理配置，减少不必要请求
2. **ETag 条件请求**：304 响应不消耗配额
3. **GraphQL 聚合**：一次请求获取多种关联数据
4. **文件内容永久缓存**：SHA 不变，内容不变
5. **Rate limit 监控**：读取响应头 `X-RateLimit-Remaining`，低于阈值时提示用户

## 类型定义

```typescript
// src/api/types.ts

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  createdAt: string;
  updatedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  isDraft: boolean;
  mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN';
  baseRefName: string;
  headRefName: string;
  baseRefOid: string;              // base commit SHA
  headRefOid: string;              // head commit SHA
  url: string;
  author: GitHubUser;
  repository: {
    nameWithOwner: string;
    owner: { login: string };
    name: string;
  };
  labels: Array<{ name: string; color: string }>;
  reviewRequests: Array<{ login?: string; name?: string }>;
  reviews: Array<{
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
    body: string;
    author: GitHubUser;
    submittedAt: string;
  }>;
}

export interface GitHubUser {
  login: string;
  avatarUrl: string;
}

export interface PRFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export interface PendingComment {
  path: string;
  line: number;
  side: 'LEFT' | 'RIGHT';
  body: string;
}
```
