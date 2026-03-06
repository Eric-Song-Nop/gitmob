import type {
  MergeCapabilities,
  MergeMethod,
  PRCapabilities,
  PullRequest,
  PullRequestDetail,
  RepositoryPermission,
  ReviewCapabilities,
  StatusCheckRollup,
} from '@/api/types';

function hasReviewPermission(permission?: RepositoryPermission) {
  return permission === 'TRIAGE' || permission === 'WRITE' || permission === 'MAINTAIN' || permission === 'ADMIN';
}

function hasMergePermission(permission?: RepositoryPermission) {
  return permission === 'WRITE' || permission === 'MAINTAIN' || permission === 'ADMIN';
}

function deriveAllowedMethods(pr: PullRequest | PullRequestDetail): MergeMethod[] {
  const methods: MergeMethod[] = [];

  if (pr.repository.mergeCommitAllowed ?? true) methods.push('merge');
  if (pr.repository.squashMergeAllowed ?? true) methods.push('squash');
  if (pr.repository.rebaseMergeAllowed ?? true) methods.push('rebase');

  return methods;
}

function deriveMergeBlockedReasons(
  pr: PullRequest | PullRequestDetail,
  canMergePermission: boolean,
  statusCheckRollup?: StatusCheckRollup | null
): MergeCapabilities['blockedReasons'] {
  const reasons = new Set<MergeCapabilities['blockedReasons'][number]>();

  if (!canMergePermission) reasons.add('no-merge-permission');
  if (pr.isDraft) reasons.add('draft');
  if (pr.mergeable === 'CONFLICTING') reasons.add('conflicts');
  if (pr.mergeable === 'UNKNOWN') reasons.add('unknown');

  const checkState = statusCheckRollup?.state;
  if (checkState === 'PENDING' || checkState === 'EXPECTED') reasons.add('checks-pending');
  if (checkState === 'FAILURE' || checkState === 'ERROR') reasons.add('checks-failed');

  return [...reasons];
}

function deriveReviewCapabilities(
  isAuthoredByViewer: boolean,
  permission?: RepositoryPermission,
  isDraft?: boolean
): ReviewCapabilities {
  if (isAuthoredByViewer) {
    return {
      mode: 'self-merge',
      canSubmitApprove: false,
      canSubmitRequestChanges: false,
      canSubmitComment: true,
      reason: 'authored-pr',
    };
  }

  if (!hasReviewPermission(permission)) {
    return {
      mode: 'read-only',
      canSubmitApprove: false,
      canSubmitRequestChanges: false,
      canSubmitComment: false,
      reason: permission == null ? 'unknown' : 'no-review-permission',
    };
  }

  return {
    mode: 'full-review',
    canSubmitApprove: !isDraft,
    canSubmitRequestChanges: !isDraft,
    canSubmitComment: true,
    reason: isDraft ? 'draft' : undefined,
  };
}

export function derivePRCapabilities(
  pr: PullRequest | PullRequestDetail,
  viewerLogin?: string | null,
  statusCheckRollup?: StatusCheckRollup | null
): PRCapabilities {
  const isAuthoredByViewer =
    Boolean(viewerLogin) && Boolean(pr.author?.login) && viewerLogin === pr.author.login;
  const permission = pr.repository.viewerPermission;
  const allowedMethods = deriveAllowedMethods(pr);
  const blockedReasons = deriveMergeBlockedReasons(pr, hasMergePermission(permission), statusCheckRollup);

  return {
    isAuthoredByViewer,
    review: deriveReviewCapabilities(isAuthoredByViewer, permission, pr.isDraft),
    merge: {
      canMerge: hasMergePermission(permission) && allowedMethods.length > 0 && blockedReasons.length === 0,
      mergeable: pr.mergeable,
      allowedMethods,
      blockedReasons,
    },
  };
}
