import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';
import type { ReviewThread, ReviewComment, GitHubUser } from '../types';

const REVIEW_THREADS_QUERY = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            path
            line
            comments(first: 30) {
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

interface RawResponse {
  repository: {
    pullRequest: {
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

export function usePRComments(owner: string, repo: string, number: number, enabled = true) {
  return useQuery<ReviewThread[]>({
    queryKey: ['pr-comments', owner, repo, number],
    queryFn: async () => {
      const octokit = getOctokit();
      const result = await octokit.graphql<RawResponse>(REVIEW_THREADS_QUERY, {
        owner,
        repo,
        number,
      });

      return result.repository.pullRequest.reviewThreads.nodes.map(
        (thread): ReviewThread => ({
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
        })
      );
    },
    staleTime: 1000 * 60 * 2,
    enabled: enabled && !!owner && !!repo && !!number,
  });
}
