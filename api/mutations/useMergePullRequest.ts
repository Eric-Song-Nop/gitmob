import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getOctokit } from '@/api/client';
import type { MergeMethod } from '@/api/types';

interface MergePullRequestInput {
  owner: string;
  repo: string;
  pullNumber: number;
  method: MergeMethod;
  commitTitle?: string;
  commitMessage?: string;
}

export function useMergePullRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MergePullRequestInput) => {
      const octokit = getOctokit();

      return octokit.pulls.merge({
        owner: input.owner,
        repo: input.repo,
        pull_number: input.pullNumber,
        merge_method: input.method,
        commit_title: input.commitTitle,
        commit_message: input.commitMessage,
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
