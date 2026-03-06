import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';

/**
 * Fetch the raw unified diff for a PR.
 * Uses the `application/vnd.github.diff` media type.
 */
export function usePRDiff(owner: string, repo: string, number: number, enabled = true) {
  return useQuery<string>({
    queryKey: ['pr-diff', owner, repo, number],
    queryFn: async () => {
      const octokit = getOctokit();
      const { data } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: number,
        mediaType: { format: 'diff' },
      });
      // When requesting diff format, data comes back as a string
      return data as unknown as string;
    },
    staleTime: 1000 * 60 * 5,
    enabled: enabled && !!owner && !!repo && !!number,
  });
}
