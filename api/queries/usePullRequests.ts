import { useInfiniteQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';
import type { PullRequest } from '../types';
import { useAuthStore } from '@/stores/authStore';
import { derivePRCapabilities } from '@/services/review/derivePRCapabilities';

const PR_LIST_QUERY = `
  query($searchQuery: String!, $first: Int!, $after: String) {
    search(query: $searchQuery, type: ISSUE, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
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
          url
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
              body
              author {
                login
                avatarUrl
              }
              submittedAt
            }
          }
        }
      }
    }
  }
`;

export type PRFilter = 'review-requested' | 'assigned' | 'created';

interface SearchResult {
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  nodes: PullRequest[];
}

export function usePullRequests(filter: PRFilter = 'review-requested') {
  const searchQuery = buildSearchQuery(filter);
  const viewerLogin = useAuthStore((state) => state.user?.login);

  return useInfiniteQuery<SearchResult>({
    queryKey: ['pulls', filter],
    queryFn: async ({ pageParam }) => {
      const octokit = getOctokit();
      const result: { search: SearchResult } = await octokit.graphql(PR_LIST_QUERY, {
        searchQuery,
        first: 20,
        after: (pageParam as string) ?? null,
      });
      result.search.nodes = result.search.nodes.map((node) => ({
        ...node,
        capabilities: derivePRCapabilities(node, viewerLogin),
      })) as SearchResult['nodes'];
      return result.search;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

function buildSearchQuery(filter: PRFilter): string {
  const base = 'is:pr is:open';
  switch (filter) {
    case 'review-requested':
      return `${base} review-requested:@me`;
    case 'assigned':
      return `${base} assignee:@me`;
    case 'created':
      return `${base} author:@me`;
  }
}
