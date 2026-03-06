import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getOctokit } from '@/api/client';

export interface GitHubDraftComment {
  path: string;
  line: number;
  side: 'RIGHT';
  body: string;
}

interface CreateReviewInput {
  owner: string;
  repo: string;
  pullNumber: number;
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body?: string;
  comments?: GitHubDraftComment[];
  commitId?: string;
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const octokit = getOctokit();

      return octokit.pulls.createReview({
        owner: input.owner,
        repo: input.repo,
        pull_number: input.pullNumber,
        event: input.event,
        body: input.body,
        commit_id: input.commitId,
        comments: input.comments?.map((comment) => ({
          ...comment,
        })),
      });
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['pulls'] });
      queryClient.invalidateQueries({ queryKey: ['pr', input.owner, input.repo, input.pullNumber] });
      queryClient.invalidateQueries({ queryKey: ['pr-comments', input.owner, input.repo, input.pullNumber] });
      queryClient.invalidateQueries({ queryKey: ['pr-diff', input.owner, input.repo, input.pullNumber] });
    },
  });
}
