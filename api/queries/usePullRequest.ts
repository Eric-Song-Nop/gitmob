import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';
import type {
  PullRequestDetail,
  GitHubUser,
  StatusCheck,
  ReviewThread,
  ReviewComment,
  RepositoryPermission,
} from '../types';
import { derivePRCapabilities } from '@/services/review/derivePRCapabilities';

const PR_DETAIL_QUERY = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        number
        title
        body
        bodyHTML
        state
        createdAt
        updatedAt
        additions
        deletions
        changedFiles
        isDraft
        mergeable
        url
        baseRefName
        headRefName
        baseRefOid
        headRefOid
        author {
          login
          avatarUrl
        }
        repository {
          nameWithOwner
          owner { login }
          name
          viewerPermission
          mergeCommitAllowed
          squashMergeAllowed
          rebaseMergeAllowed
        }
        labels(first: 10) {
          nodes { name color }
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
            author { login avatarUrl }
            submittedAt
          }
        }
        commitsCount: commits {
          totalCount
        }
        comments {
          totalCount
        }
        lastCommit: commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
                contexts(first: 30) {
                  nodes {
                    ... on StatusContext {
                      context
                      state
                      targetUrl
                      description
                    }
                    ... on CheckRun {
                      name
                      conclusion
                      detailsUrl
                      title
                    }
                  }
                }
              }
            }
          }
        }
        reviewThreads(first: 50) {
          nodes {
            id
            isResolved
            path
            line
            comments(first: 20) {
              nodes {
                id
                body
                path
                line: originalLine
                author { login avatarUrl }
                createdAt
              }
            }
          }
        }
      }
    }
  }
`;

interface RawPRResponse {
  repository: {
    pullRequest: {
      number: number;
      title: string;
      body: string;
      bodyHTML: string;
      state: 'OPEN' | 'CLOSED' | 'MERGED';
      createdAt: string;
      updatedAt: string;
      additions: number;
      deletions: number;
      changedFiles: number;
      isDraft: boolean;
      mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN';
      url: string;
      baseRefName: string;
      headRefName: string;
      baseRefOid: string;
      headRefOid: string;
      author: GitHubUser;
      repository: {
        nameWithOwner: string;
        owner: { login: string };
        name: string;
        viewerPermission?: RepositoryPermission;
        mergeCommitAllowed?: boolean;
        squashMergeAllowed?: boolean;
        rebaseMergeAllowed?: boolean;
      };
      labels: { nodes: Array<{ name: string; color: string }> };
      reviewRequests: {
        nodes: Array<{
          requestedReviewer: { login?: string; avatarUrl?: string; name?: string };
        }>;
      };
      reviews: {
        nodes: Array<{
          state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
          body: string;
          author: GitHubUser;
          submittedAt: string;
        }>;
      };
      commitsCount: {
        totalCount: number;
      };
      lastCommit: {
        nodes: Array<{
          commit: {
            statusCheckRollup: {
              state: string;
              contexts: {
                nodes: Array<{
                  // StatusContext fields
                  context?: string;
                  state?: string;
                  targetUrl?: string;
                  description?: string;
                  // CheckRun fields
                  name?: string;
                  conclusion?: string;
                  detailsUrl?: string;
                  title?: string;
                }>;
              };
            } | null;
          };
        }>;
      };
      comments: { totalCount: number };
      reviewThreads: {
        nodes: Array<{
          id: string;
          isResolved: boolean;
          path: string;
          line: number | null;
          comments: {
            nodes: Array<{
              id: string;
              body: string;
              path: string;
              line: number | null;
              author: GitHubUser;
              createdAt: string;
            }>;
          };
        }>;
      };
    };
  };
}

function transformResponse(raw: RawPRResponse, viewerLogin?: string | null): PullRequestDetail {
  const pr = raw.repository.pullRequest;
  const lastCommit = pr.lastCommit.nodes[0]?.commit;
  const rawRollup = lastCommit?.statusCheckRollup;

  const statusCheckRollup = rawRollup
    ? {
        state: rawRollup.state as StatusCheck['state'],
        contexts: rawRollup.contexts.nodes.map((ctx): StatusCheck => {
          // CheckRun uses name/conclusion/detailsUrl; StatusContext uses context/state/targetUrl
          if (ctx.name != null) {
            return {
              context: ctx.name,
              state: mapCheckConclusion(ctx.conclusion),
              targetUrl: ctx.detailsUrl ?? null,
              description: ctx.title ?? null,
            };
          }
          return {
            context: ctx.context ?? '',
            state: (ctx.state ?? 'PENDING') as StatusCheck['state'],
            targetUrl: ctx.targetUrl ?? null,
            description: ctx.description ?? null,
          };
        }),
      }
    : null;

  const reviewThreads: ReviewThread[] = pr.reviewThreads.nodes.map((thread) => ({
    id: thread.id,
    isResolved: thread.isResolved,
    path: thread.path,
    line: thread.line,
    comments: thread.comments.nodes.map(
      (c): ReviewComment => ({
        id: c.id,
        body: c.body,
        path: c.path,
        line: c.line,
        author: c.author,
        createdAt: c.createdAt,
      })
    ),
  }));

  return {
    number: pr.number,
    title: pr.title,
    body: pr.body,
    bodyHTML: pr.bodyHTML,
    state: pr.state,
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
    isDraft: pr.isDraft,
    mergeable: pr.mergeable,
    baseRefName: pr.baseRefName,
    headRefName: pr.headRefName,
    baseRefOid: pr.baseRefOid,
    headRefOid: pr.headRefOid,
    url: pr.url,
    author: pr.author,
    repository: pr.repository,
    labels: pr.labels.nodes,
    reviewRequests: pr.reviewRequests.nodes.map((n) => ({
      login: n.requestedReviewer.login,
      name: n.requestedReviewer.name,
      avatarUrl: n.requestedReviewer.avatarUrl,
    })),
    reviews: pr.reviews.nodes,
    statusCheckRollup,
    reviewThreads,
    totalCommentsCount: pr.comments.totalCount,
    commits: pr.commitsCount.totalCount,
    capabilities: derivePRCapabilities(
      {
        ...pr,
        repository: pr.repository,
        labels: pr.labels.nodes,
        reviewRequests: pr.reviewRequests.nodes.map((n) => ({
          login: n.requestedReviewer.login,
          name: n.requestedReviewer.name,
          avatarUrl: n.requestedReviewer.avatarUrl,
        })),
        reviews: pr.reviews.nodes,
      },
      viewerLogin,
      statusCheckRollup
    ),
  };
}

function mapCheckConclusion(conclusion?: string | null): StatusCheck['state'] {
  switch (conclusion) {
    case 'SUCCESS':
    case 'NEUTRAL':
    case 'SKIPPED':
      return 'SUCCESS';
    case 'FAILURE':
    case 'TIMED_OUT':
    case 'CANCELLED':
      return 'FAILURE';
    case 'ACTION_REQUIRED':
      return 'PENDING';
    default:
      return 'PENDING';
  }
}

export function usePullRequest(
  owner: string,
  repo: string,
  number: number,
  viewerLogin?: string | null,
  enabled = true
) {
  return useQuery<PullRequestDetail>({
    queryKey: ['pr', owner, repo, number, viewerLogin],
    queryFn: async () => {
      const octokit = getOctokit();
      const result = await octokit.graphql<RawPRResponse>(PR_DETAIL_QUERY, {
        owner,
        repo,
        number,
      });
      return transformResponse(result, viewerLogin);
    },
    staleTime: 1000 * 60 * 3,
    enabled: enabled && !!owner && !!repo && !!number,
  });
}
