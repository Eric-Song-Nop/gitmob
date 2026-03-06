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
    viewerPermission?: RepositoryPermission;
    mergeCommitAllowed?: boolean;
    squashMergeAllowed?: boolean;
    rebaseMergeAllowed?: boolean;
  };
  labels: Array<{ name: string; color: string }>;
  reviewRequests: Array<{ login?: string; name?: string }>;
  reviews: Array<{
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
    body: string;
    author: GitHubUser;
    submittedAt: string;
  }>;
  capabilities?: PRCapabilities;
}

export type RepositoryPermission = 'ADMIN' | 'MAINTAIN' | 'WRITE' | 'TRIAGE' | 'READ' | 'NONE';

export type ReviewMode = 'full-review' | 'read-only' | 'self-merge';

export interface ReviewCapabilities {
  mode: ReviewMode;
  canSubmitApprove: boolean;
  canSubmitRequestChanges: boolean;
  canSubmitComment: boolean;
  reason?: 'no-review-permission' | 'authored-pr' | 'draft' | 'unknown';
}

export type MergeMethod = 'merge' | 'squash' | 'rebase';

export interface MergeCapabilities {
  canMerge: boolean;
  mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN';
  allowedMethods: MergeMethod[];
  blockedReasons: Array<
    'no-merge-permission' | 'conflicts' | 'draft' | 'checks-pending' | 'checks-failed' | 'unknown'
  >;
}

export interface PRCapabilities {
  isAuthoredByViewer: boolean;
  review: ReviewCapabilities;
  merge: MergeCapabilities;
}

export type PRSource = 'review-requested' | 'assigned' | 'authored';

export interface InboxPRCardModel {
  prKey: string;
  pullRequest: PullRequest;
  sources: PRSource[];
  primarySource: PRSource;
  snoozed: boolean;
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

export interface StatusCheck {
  context: string;
  state: 'EXPECTED' | 'ERROR' | 'FAILURE' | 'PENDING' | 'SUCCESS';
  targetUrl: string | null;
  description: string | null;
}

export interface StatusCheckRollup {
  state: 'EXPECTED' | 'ERROR' | 'FAILURE' | 'PENDING' | 'SUCCESS';
  contexts: StatusCheck[];
}

export interface ReviewComment {
  id: string;
  body: string;
  path: string;
  line: number | null;
  author: GitHubUser;
  createdAt: string;
}

export interface ReviewThread {
  id: string;
  isResolved: boolean;
  path: string;
  line: number | null;
  comments: ReviewComment[];
}

export interface PullRequestDetail extends PullRequest {
  bodyHTML: string;
  statusCheckRollup: StatusCheckRollup | null;
  reviewThreads: ReviewThread[];
  totalCommentsCount: number;
  commits: number;
  capabilities: PRCapabilities;
}

export interface PendingComment {
  path: string;
  line: number;
  side: 'LEFT' | 'RIGHT';
  body: string;
}
