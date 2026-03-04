import { useQuery } from '@tanstack/react-query';
import { getOctokit } from '../client';
import type { PRFile } from '../types';

export function usePRFiles(owner: string, repo: string, number: number) {
  return useQuery<PRFile[]>({
    queryKey: ['pr-files', owner, repo, number],
    queryFn: async () => {
      const octokit = getOctokit();
      const files: PRFile[] = [];
      let page = 1;

      // Paginate through all files
      while (true) {
        const { data } = await octokit.pulls.listFiles({
          owner,
          repo,
          pull_number: number,
          per_page: 100,
          page,
        });

        files.push(
          ...data.map((f) => ({
            sha: f.sha ?? '',
            filename: f.filename,
            status: f.status as PRFile['status'],
            additions: f.additions,
            deletions: f.deletions,
            changes: f.changes,
            patch: f.patch,
            previous_filename: f.previous_filename,
          }))
        );

        if (data.length < 100) break;
        page++;
      }

      return files;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!owner && !!repo && !!number,
  });
}
