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
  baseRefOid: string;
  headRefOid: string;
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
